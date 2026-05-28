import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  CertificationType,
  ContractType,
  TimeEventAction,
  TimeEntryStatus,
  Facility,
  Project,
  Equipment,
  Employee,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// ==========================================
// HELPERY
// ==========================================
function generateValidPESEL(
  year: number,
  month: number,
  day: number,
  isMale: boolean,
): string {
  let monthStr = month.toString().padStart(2, '0');
  const yearStr = year.toString().slice(2);

  if (year >= 2000) monthStr = (month + 20).toString().padStart(2, '0');

  const dayStr = day.toString().padStart(2, '0');
  const randomDigits = Math.floor(Math.random() * 900) + 100; // 3 cyfry
  const genderDigit = isMale
    ? Math.floor(Math.random() * 5) * 2 + 1
    : Math.floor(Math.random() * 5) * 2;

  const peselBase = `${yearStr}${monthStr}${dayStr}${randomDigits}${genderDigit}`;
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
  let sum = 0;

  for (let i = 0; i < 10; i++) sum += parseInt(peselBase[i]) * weights[i];
  const checksum = (10 - (sum % 10)) % 10;

  return `${peselBase}${checksum}`;
}

async function main() {
  console.log('🌱 Rozpoczynam potężne seedowanie bazy danych...');

  // 1. CZYSZCZENIE BAZY
  await prisma.timeEntry.deleteMany();
  await prisma.timeEvent.deleteMany();
  await prisma.equipmentAssignment.deleteMany();
  await prisma.employeeCertification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.employeeFacilityAccess.deleteMany();
  await prisma.employeeAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.reader.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.certificationDictionary.deleteMany();

  // 2. ZAKŁADY (Facilities) - jawnie typujemy tablicę!
  const facilitiesData = [
    {
      name: 'Centrala Warszawa',
      code: 'WAW-01',
      address: 'ul. Złota 44, Warszawa',
    },
    {
      name: 'Oddział Północ (Gdańsk)',
      code: 'GDA-02',
      address: 'ul. Długa 10, Gdańsk',
    },
    {
      name: 'Oddział Południe (Kraków)',
      code: 'KRK-03',
      address: 'ul. Floriańska 1, Kraków',
    },
  ];

  const facilities: Facility[] = [];
  for (const f of facilitiesData) {
    facilities.push(await prisma.facility.create({ data: f }));
  }
  const mainFacility = facilities[0];
  console.log(`✅ Wygenerowano ${facilities.length} Zakłady`);

  // 3. PROJEKTY I CZYTNIKI - jawnie typujemy tablicę!
  const projects: Project[] = [];
  for (let i = 1; i <= 5; i++) {
    const fId = facilities[i % 3].id;
    const project = await prisma.project.create({
      data: {
        facilityId: fId,
        name: `Budowa Kompleksu ${i}`,
        internalCode: `PRJ-${2025 + i}-${Math.floor(Math.random() * 1000)}`,
        status: 'ACTIVE',
        startDate: new Date(2023, 1, 1),
      },
    });
    projects.push(project);

    await prisma.reader.create({
      data: {
        facilityId: fId,
        projectId: project.id,
        serialNumber: `RFID-R-${1000 + i}`,
        locationName: `Brama Główna (Budowa ${i})`,
      },
    });
  }
  console.log(
    `✅ Wygenerowano ${projects.length} Projektów budowlanych z czytnikami`,
  );

  // 4. SŁOWNIKI BHP
  const certDicts = await prisma.certificationDictionary.createManyAndReturn({
    data: [
      {
        name: 'Szkolenie BHP Podstawowe',
        type: CertificationType.BHP,
        defaultValidityMonths: 12,
      },
      {
        name: 'Badania Lekarskie - Wysokościowe',
        type: CertificationType.MEDICAL,
        defaultValidityMonths: 24,
      },
      {
        name: 'Uprawnienia UDT - Wózki',
        type: CertificationType.UDT,
        defaultValidityMonths: 36,
      },
      {
        name: 'Uprawnienia SEP - 1kV',
        type: CertificationType.OTHER,
        defaultValidityMonths: 60,
      },
    ],
  });
  console.log(`✅ Wygenerowano słowniki certyfikatów`);

  // 5. KATEGORIE I SPRZĘT - jawnie typujemy tablicę!
  const eqCat1 = await prisma.equipmentCategory.create({
    data: { name: 'Elektronarzędzia' },
  });
  const eqCat2 = await prisma.equipmentCategory.create({
    data: { name: 'Odzież Ochronna (ŚOI)' },
  });

  const equipments: Equipment[] = [];
  for (let i = 1; i <= 15; i++) {
    equipments.push(
      await prisma.equipment.create({
        data: {
          categoryId: i % 2 === 0 ? eqCat1.id : eqCat2.id,
          name:
            i % 2 === 0
              ? `Wiertarka udarowa Hilti TE ${i}`
              : `Szelki bezpieczeństwa roz. L`,
          serialNumber: `EQ-${Math.floor(Math.random() * 100000)}`,
        },
      }),
    );
  }
  console.log(`✅ Wygenerowano 15 sztuk sprzętu`);

  // 6. PRACOWNICY (Role zarządcze)
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const createEmp = async (
    fn: string,
    ln: string,
    role: UserRole,
    email: string,
    facilityId: string,
  ) => {
    const pesel = generateValidPESEL(
      1980 + Math.floor(Math.random() * 20),
      Math.floor(Math.random() * 12) + 1,
      Math.floor(Math.random() * 28) + 1,
      true,
    );
    const emp = await prisma.employee.create({
      data: {
        firstName: fn,
        lastName: ln,
        email,
        pesel,
        role,
        facilityId,
        passwordHash,
        isLoginEnabled: true,
        isActive: true,
      },
    });

    await prisma.employeeFacilityAccess.create({
      data: { employeeId: emp.id, facilityId: emp.facilityId },
    });

    await prisma.contract.create({
      data: {
        employeeId: emp.id,
        type: ContractType.UOP,
        salaryAmount: Math.floor(Math.random() * 5000) + 6000,
        startDate: new Date(2020, 1, 1),
        isCurrent: true,
      },
    });
    return emp;
  };

  const admin = await createEmp(
    'Jan',
    'Administrator',
    UserRole.ADMIN,
    'admin@workflow.pl',
    mainFacility.id,
  );
  const hr = await createEmp(
    'Anna',
    'Kadrowa',
    UserRole.HR,
    'hr@workflow.pl',
    mainFacility.id,
  );
  const acc = await createEmp(
    'Krystyna',
    'Księgowa',
    UserRole.ACCOUNTING,
    'ksiegowa@workflow.pl',
    mainFacility.id,
  );
  const foreman1 = await createEmp(
    'Piotr',
    'Brygadzista',
    UserRole.FOREMAN,
    'brygadzista@workflow.pl',
    projects[0].facilityId,
  );
  const foreman2 = await createEmp(
    'Krzysztof',
    'Kierownik',
    UserRole.FOREMAN,
    'kierownik@workflow.pl',
    projects[1].facilityId,
  );

  // Używamy zmiennych, żeby ESLint nie krzyczał o nieużywanych
  console.log(
    `✅ Wygenerowano konta zarządcze dla: ${hr.email}, ${acc.email}, ${foreman1.email}, ${foreman2.email}`,
  );

  // Zapewniamy Adminowi dostęp do wszystkich zakładów
  for (const f of facilities) {
    await prisma.employeeFacilityAccess.upsert({
      where: {
        employeeId_facilityId: { employeeId: admin.id, facilityId: f.id },
      },
      create: { employeeId: admin.id, facilityId: f.id },
      update: {},
    });
  }

  // 7. ROBOTNICY (Generowanie masowe 20 osób)
  const workers: Employee[] = [];
  const firstNames = [
    'Marek',
    'Tomasz',
    'Andrzej',
    'Kamil',
    'Marcin',
    'Mateusz',
    'Łukasz',
    'Michał',
    'Dawid',
    'Adam',
  ];
  const lastNames = [
    'Kowalski',
    'Nowak',
    'Wiśniewski',
    'Wójcik',
    'Kowalczyk',
    'Kamiński',
    'Lewandowski',
    'Zieliński',
    'Szymański',
    'Woźniak',
  ];

  for (let i = 0; i < 20; i++) {
    const fId = facilities[i % 3].id;
    const worker = await createEmp(
      firstNames[Math.floor(Math.random() * firstNames.length)],
      lastNames[Math.floor(Math.random() * lastNames.length)] + i,
      UserRole.WORKER,
      `pracownik${i}@workflow.pl`,
      fId,
    );
    workers.push(worker);

    if (i % 2 === 0) {
      await prisma.equipmentAssignment.create({
        data: {
          employeeId: worker.id,
          equipmentId: equipments[i % equipments.length].id,
          assignedAt: new Date(),
        },
      });
    }

    const bhpDict = certDicts.find((d) => d.type === 'BHP');
    if (bhpDict) {
      const isExpiring = i < 3;
      const expires = isExpiring
        ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 200 * 24 * 60 * 60 * 1000);

      await prisma.employeeCertification.create({
        data: {
          employeeId: worker.id,
          dictionaryId: bhpDict.id,
          issuedAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
          expiresAt: expires,
        },
      });
    }

    const pId = projects[i % projects.length].id;
    const todayStart = new Date();
    todayStart.setHours(7, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(15, 0, 0, 0);

    await prisma.timeEntry.create({
      data: {
        employeeId: worker.id,
        projectId: pId,
        startTime: todayStart,
        endTime: todayEnd,
        calculatedHours: 8.0,
        status: TimeEntryStatus.PENDING,
      },
    });

    const reader = await prisma.reader.findFirst({ where: { projectId: pId } });
    if (reader) {
      await prisma.timeEvent.create({
        data: {
          employeeId: worker.id,
          readerId: reader.id,
          action: TimeEventAction.IN,
          eventTime: todayStart,
        },
      });
    }
  }

  console.log(
    `✅ Wygenerowano role zarządcze i ${workers.length} robotników (wygenerowano alerty BHP i czasu pracy).`,
  );
  console.log(
    `\n🎉 Seedowanie zakończone pełnym sukcesem! Baza jest gotowa do testów.`,
  );
  console.log(`\nDane logowania (hasło dla wszystkich: Admin123!):`);
  console.log(`  👨‍💻 hr@workflow.pl`);
  console.log(`  👷‍♂️ brygadzista@workflow.pl`);
  console.log(`  💼 ksiegowa@workflow.pl`);
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
