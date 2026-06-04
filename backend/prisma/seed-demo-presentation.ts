import 'dotenv/config';
import {
  AbsenceType,
  CertificationType,
  ContractType,
  PrismaClient,
  ProjectStatus,
  TimeEntryStatus,
  TimeEventAction,
  UserRole,
  type Contract,
  type Employee,
  type EmployeeCertification,
  type TimeEntry,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Admin123!';

function required<T>(value: T | undefined, label: string): T {
  if (!value) {
    throw new Error(`Brak wymaganej wartości demo: ${label}`);
  }

  return value;
}

function daysAgo(days: number, hour = 8, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function daysFromNow(days: number, hour = 8, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function dateOnlyFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateOnlyAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function clearDatabase() {
  console.log('Czyszczenie danych prezentacyjnych...');

  await prisma.timeEntry.deleteMany();
  await prisma.timeEvent.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeCertification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.payrollExport.deleteMany();
  await prisma.equipmentAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.employeeAssignment.deleteMany();
  await prisma.reader.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.employeeFacilityAccess.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.certificationDictionary.deleteMany();
  await prisma.facility.deleteMany();
}

async function createEmployeeWithAccess(input: {
  firstName: string;
  lastName: string;
  email?: string;
  pesel?: string;
  rfidCardId?: string;
  role: UserRole;
  facilityId: string;
  accessFacilityIds?: string[];
  passwordHash?: string;
  isLoginEnabled?: boolean;
  isActive?: boolean;
}) {
  const employee = await prisma.employee.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      pesel: input.pesel,
      rfidCardId: input.rfidCardId,
      role: input.role,
      facilityId: input.facilityId,
      passwordHash: input.passwordHash,
      isLoginEnabled: input.isLoginEnabled ?? false,
      isActive: input.isActive ?? true,
    },
  });

  const facilityIds = Array.from(
    new Set([input.facilityId, ...(input.accessFacilityIds ?? [])]),
  );

  for (const facilityId of facilityIds) {
    await prisma.employeeFacilityAccess.create({
      data: {
        employeeId: employee.id,
        facilityId,
      },
    });
  }

  return employee;
}

async function createWorkDay(input: {
  employeeId: string;
  projectId: string;
  readerId: string;
  daysAgo: number;
  startHour: number;
  startMinute?: number;
  endHour: number;
  endMinute?: number;
  status: TimeEntryStatus;
}) {
  const startTime = daysAgo(
    input.daysAgo,
    input.startHour,
    input.startMinute ?? 0,
  );
  const endTime = daysAgo(input.daysAgo, input.endHour, input.endMinute ?? 0);
  const calculatedHours =
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  await prisma.timeEvent.create({
    data: {
      employeeId: input.employeeId,
      readerId: input.readerId,
      action: TimeEventAction.IN,
      eventTime: startTime,
    },
  });

  await prisma.timeEvent.create({
    data: {
      employeeId: input.employeeId,
      readerId: input.readerId,
      action: TimeEventAction.OUT,
      eventTime: endTime,
    },
  });

  return prisma.timeEntry.create({
    data: {
      employeeId: input.employeeId,
      projectId: input.projectId,
      startTime,
      endTime,
      calculatedHours,
      status: input.status,
    },
  });
}

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Seed prezentacyjny jest destrukcyjny. Ustaw ALLOW_DEMO_SEED=true w .env, aby go uruchomić.',
    );
  }

  await clearDatabase();

  console.log('Tworzenie zakładów...');
  const mainFacility = await prisma.facility.create({
    data: {
      name: 'Biuro Główne',
      code: 'MAIN',
      address: 'ul. Główna 1, Kraków',
      isActive: true,
    },
  });

  const krakowFacility = await prisma.facility.create({
    data: {
      name: 'Zakład Kraków',
      code: 'KRK',
      address: 'ul. Przemysłowa 12, Kraków',
      isActive: true,
    },
  });

  const warsawFacility = await prisma.facility.create({
    data: {
      name: 'Oddział Warszawa',
      code: 'WAW',
      address: 'ul. Prosta 20, Warszawa',
      isActive: true,
    },
  });

  const allFacilityIds = [
    mainFacility.id,
    krakowFacility.id,
    warsawFacility.id,
  ];

  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  console.log('Tworzenie kont systemowych...');
  const admin = await createEmployeeWithAccess({
    firstName: 'Admin',
    lastName: 'Systemu',
    email: 'admin@workflow.pl',
    role: UserRole.ADMIN,
    facilityId: mainFacility.id,
    accessFacilityIds: allFacilityIds,
    passwordHash,
    isLoginEnabled: true,
  });

  const hr = await createEmployeeWithAccess({
    firstName: 'Anna',
    lastName: 'Kadry',
    email: 'hr@workflow.pl',
    role: UserRole.HR,
    facilityId: mainFacility.id,
    accessFacilityIds: allFacilityIds,
    passwordHash,
    isLoginEnabled: true,
  });

  const accounting = await createEmployeeWithAccess({
    firstName: 'Krystyna',
    lastName: 'Księgowość',
    email: 'ksiegowa@workflow.pl',
    role: UserRole.ACCOUNTING,
    facilityId: mainFacility.id,
    accessFacilityIds: allFacilityIds,
    passwordHash,
    isLoginEnabled: true,
  });

  await createEmployeeWithAccess({
    firstName: 'Piotr',
    lastName: 'Brygadzista',
    email: 'brygadzista@workflow.pl',
    role: UserRole.FOREMAN,
    facilityId: krakowFacility.id,
    accessFacilityIds: [krakowFacility.id],
    passwordHash,
    isLoginEnabled: true,
  });

  console.log('Tworzenie pracowników...');
  const workersData = [
    {
      firstName: 'Marcin',
      lastName: 'Woźniak',
      pesel: '84092651531',
      rfidCardId: 'CARD-000123',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Kamil',
      lastName: 'Nowak',
      pesel: '91031512345',
      rfidCardId: 'CARD-000124',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Mateusz',
      lastName: 'Kowalczyk',
      pesel: '88071198765',
      rfidCardId: 'CARD-000125',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Tomasz',
      lastName: 'Wiśniewski',
      pesel: '95010111223',
      rfidCardId: 'CARD-000126',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Andrzej',
      lastName: 'Zieliński',
      pesel: '79051445678',
      rfidCardId: 'CARD-000127',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Michał',
      lastName: 'Kowalski',
      pesel: '90020222334',
      rfidCardId: 'CARD-000128',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Paweł',
      lastName: 'Lewandowski',
      pesel: '86123133445',
      rfidCardId: 'CARD-000129',
      facilityId: warsawFacility.id,
    },
    {
      firstName: 'Grzegorz',
      lastName: 'Kamiński',
      pesel: '93090944556',
      rfidCardId: 'CARD-000130',
      facilityId: warsawFacility.id,
    },
    {
      firstName: 'Dawid',
      lastName: 'Wójcik',
      pesel: '97121255667',
      rfidCardId: 'CARD-000131',
      facilityId: warsawFacility.id,
    },
    {
      firstName: 'Robert',
      lastName: 'Mazur',
      pesel: '85080866778',
      rfidCardId: 'CARD-000132',
      facilityId: warsawFacility.id,
    },
    {
      firstName: 'Łukasz',
      lastName: 'Dąbrowski',
      pesel: '92040477889',
      facilityId: krakowFacility.id,
    },
    {
      firstName: 'Adam',
      lastName: 'Pawlak',
      pesel: '81060688990',
      facilityId: warsawFacility.id,
      isActive: false,
    },
  ];

  const workers: Employee[] = [];

  for (const [index, worker] of workersData.entries()) {
    const created = await createEmployeeWithAccess({
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: `pracownik${index + 1}@workflow.pl`,
      pesel: worker.pesel,
      rfidCardId: worker.rfidCardId,
      role: UserRole.WORKER,
      facilityId: worker.facilityId,
      isActive: worker.isActive ?? true,
    });

    workers.push(created);
  }

  const workerMarcin = required(workers[0], 'workerMarcin');
  const workerKamil = required(workers[1], 'workerKamil');
  const workerMateusz = required(workers[2], 'workerMateusz');
  const workerTomasz = required(workers[3], 'workerTomasz');
  const workerAndrzej = required(workers[4], 'workerAndrzej');
  const workerMichal = required(workers[5], 'workerMichal');
  const workerPawel = required(workers[6], 'workerPawel');
  const workerGrzegorz = required(workers[7], 'workerGrzegorz');
  const workerDawid = required(workers[8], 'workerDawid');
  const workerRobert = required(workers[9], 'workerRobert');
  const workerLukasz = required(workers[10], 'workerLukasz');

  console.log('Tworzenie projektów...');
  const projectKrakow = await prisma.project.create({
    data: {
      facilityId: krakowFacility.id,
      name: 'Budowa Osiedla Południe',
      internalCode: 'KRK-BUD-001',
      address: 'ul. Wielicka 100, Kraków',
      status: ProjectStatus.ACTIVE,
      startDate: dateOnlyAgo(45),
      endDate: daysFromNow(90),
    },
  });

  const projectService = await prisma.project.create({
    data: {
      facilityId: krakowFacility.id,
      name: 'Serwis infrastruktury hali A',
      internalCode: 'KRK-SER-002',
      address: 'ul. Przemysłowa 12, Kraków',
      status: ProjectStatus.ACTIVE,
      startDate: dateOnlyAgo(20),
      endDate: daysFromNow(30),
    },
  });

  const projectWarsaw = await prisma.project.create({
    data: {
      facilityId: warsawFacility.id,
      name: 'Modernizacja biura Warszawa',
      internalCode: 'WAW-MOD-001',
      address: 'ul. Prosta 20, Warszawa',
      status: ProjectStatus.ACTIVE,
      startDate: dateOnlyAgo(30),
      endDate: daysFromNow(45),
    },
  });

  await prisma.project.create({
    data: {
      facilityId: mainFacility.id,
      name: 'Rozbudowa systemu RCP',
      internalCode: 'MAIN-RCP-2026',
      address: 'Biuro Główne',
      status: ProjectStatus.PLANNED,
      startDate: daysFromNow(14),
      endDate: daysFromNow(120),
    },
  });

  const completedProject = await prisma.project.create({
    data: {
      facilityId: krakowFacility.id,
      name: 'Remont magazynu technicznego',
      internalCode: 'KRK-REM-2025',
      address: 'ul. Magazynowa 4, Kraków',
      status: ProjectStatus.COMPLETED,
      startDate: dateOnlyAgo(180),
      endDate: dateOnlyAgo(30),
    },
  });

  console.log('Tworzenie czytników RCP...');
  const readerKrakowMain = await prisma.reader.create({
    data: {
      facilityId: krakowFacility.id,
      projectId: projectKrakow.id,
      serialNumber: 'RFID-R-1003',
      locationName: 'Brama główna - Budowa Osiedla Południe',
      isActive: true,
    },
  });

  const readerKrakowService = await prisma.reader.create({
    data: {
      facilityId: krakowFacility.id,
      projectId: projectService.id,
      serialNumber: 'RFID-R-1002',
      locationName: 'Wejście hala A',
      isActive: true,
    },
  });

  const readerWarsaw = await prisma.reader.create({
    data: {
      facilityId: warsawFacility.id,
      projectId: projectWarsaw.id,
      serialNumber: 'RFID-R-1001',
      locationName: 'Recepcja Warszawa',
      isActive: true,
    },
  });

  console.log('Tworzenie przypisań do projektów...');
  const projectAssignments = [
    { employee: workerMarcin, project: projectKrakow },
    { employee: workerKamil, project: projectKrakow },
    { employee: workerMateusz, project: projectKrakow },
    { employee: workerTomasz, project: projectKrakow },
    { employee: workerAndrzej, project: projectService },
    { employee: workerMichal, project: projectService },
    { employee: workerPawel, project: projectWarsaw },
    { employee: workerGrzegorz, project: projectWarsaw },
    { employee: workerDawid, project: projectWarsaw },
    { employee: workerRobert, project: projectWarsaw },
    { employee: workerLukasz, project: completedProject },
  ];

  for (const item of projectAssignments) {
    await prisma.employeeAssignment.create({
      data: {
        employeeId: item.employee.id,
        projectId: item.project.id,
        assignedAt: dateOnlyAgo(20),
        notes: 'Przypisanie utworzone przez seed prezentacyjny.',
      },
    });
  }

  console.log('Tworzenie słownika certyfikatów...');
  const bhpBasic = await prisma.certificationDictionary.create({
    data: {
      type: CertificationType.BHP,
      name: 'Szkolenie BHP Podstawowe',
      description: 'Podstawowe szkolenie BHP dla pracowników.',
      defaultValidityMonths: 12,
      isActive: true,
    },
  });

  const medicalStandard = await prisma.certificationDictionary.create({
    data: {
      type: CertificationType.MEDICAL,
      name: 'Badania Lekarskie Ogólne',
      description: 'Okresowe badania lekarskie.',
      defaultValidityMonths: 24,
      isActive: true,
    },
  });

  const udtForklift = await prisma.certificationDictionary.create({
    data: {
      type: CertificationType.UDT,
      name: 'Uprawnienia UDT - Wózki',
      description: 'Uprawnienia do obsługi wózków widłowych.',
      defaultValidityMonths: 36,
      isActive: true,
    },
  });

  const sepOneKv = await prisma.certificationDictionary.create({
    data: {
      type: CertificationType.OTHER,
      name: 'Uprawnienia SEP - 1kV',
      description: 'Uprawnienia elektryczne do 1kV.',
      defaultValidityMonths: 60,
      isActive: true,
    },
  });

  console.log('Tworzenie umów...');
  const contracts: Contract[] = [];
  const contractTypes = [
    ContractType.UOP,
    ContractType.UOP,
    ContractType.UZ,
    ContractType.B2B,
  ];

  for (const [index, worker] of workers.entries()) {
    if (!worker.isActive) {
      continue;
    }

    const contractType =
      contractTypes[index % contractTypes.length] ?? ContractType.UOP;

    const salaryAmountByContractType = (() => {
      switch (contractType) {
        case ContractType.UOP:
          return 5200 + index * 450;

        case ContractType.UZ:
          return 38 + index * 2;

        case ContractType.B2B:
          return 75 + index * 4;

        case ContractType.UD:
          return 2800 + index * 250;

        default:
          return 0;
      }
    })();

    const baseSalaryAmount = 5200 + index * 450;

    const salaryAmount =
      contractType === ContractType.UZ || contractType === ContractType.B2B
        ? Number((baseSalaryAmount / 100).toFixed(2))
        : baseSalaryAmount;

    const contract = await prisma.contract.create({
      data: {
        employeeId: worker.id,
        type: contractType,
        salaryAmount,
        startDate: dateOnlyAgo(120),
        endDate: null,
        isCurrent: true,
      },
    });

    contracts.push(contract);

    if (index < 3) {
      await prisma.contract.create({
        data: {
          employeeId: worker.id,
          type: ContractType.UOP,
          salaryAmount: 4300 + index * 300,
          startDate: dateOnlyAgo(365),
          endDate: dateOnlyAgo(121),
          isCurrent: false,
        },
      });
    }
  }

  console.log('Tworzenie certyfikatów pracowników...');
  const dictionaries = [bhpBasic, medicalStandard, udtForklift, sepOneKv];
  const certificationRecords: EmployeeCertification[] = [];

  for (const [index, worker] of workers.entries()) {
    if (!worker.isActive) {
      continue;
    }

    const dictionary = required(
      dictionaries[index % dictionaries.length],
      `dictionary-${index}`,
    );

    const cert = await prisma.employeeCertification.create({
      data: {
        employeeId: worker.id,
        dictionaryId: dictionary.id,
        certificateNumber: `CERT/${new Date().getFullYear()}/${String(index + 1).padStart(3, '0')}`,
        issuedAt: dateOnlyAgo(300 - index * 5),
        expiresAt:
          index === 0
            ? daysFromNow(7)
            : index === 1
              ? daysFromNow(14)
              : index === 2
                ? daysFromNow(30)
                : index === 3
                  ? dateOnlyAgo(5)
                  : daysFromNow(180 + index * 10),
      },
    });

    certificationRecords.push(cert);
  }

  console.log('Tworzenie dokumentów...');
  for (const [index, contract] of contracts.slice(0, 8).entries()) {
    await prisma.document.create({
      data: {
        employeeId: contract.employeeId,
        contractId: contract.id,
        fileName: `umowa-pracownika-${index + 1}.pdf`,
        fileUrl: `documents/demo/contracts/umowa-pracownika-${index + 1}.pdf`,
      },
    });
  }

  for (const [index, certification] of certificationRecords
    .slice(0, 8)
    .entries()) {
    await prisma.document.create({
      data: {
        employeeId: certification.employeeId,
        certificationId: certification.id,
        fileName: `certyfikat-${index + 1}.pdf`,
        fileUrl: `documents/demo/certifications/certyfikat-${index + 1}.pdf`,
      },
    });
  }

  const absenceDocument = await prisma.document.create({
    data: {
      employeeId: workerMateusz.id,
      fileName: 'l4-pracownik-demo.pdf',
      fileUrl: 'documents/demo/absences/l4-pracownik-demo.pdf',
    },
  });

  console.log('Tworzenie nieobecności...');
  await prisma.absence.createMany({
    data: [
      {
        employeeId: workerMarcin.id,
        type: AbsenceType.HOLIDAY,
        startDate: dateOnlyFromNow(5),
        endDate: dateOnlyFromNow(10),
        isApproved: true,
      },
      {
        employeeId: workerKamil.id,
        type: AbsenceType.HOLIDAY,
        startDate: dateOnlyFromNow(15),
        endDate: dateOnlyFromNow(18),
        isApproved: false,
      },
      {
        employeeId: workerMateusz.id,
        type: AbsenceType.SICK_LEAVE,
        startDate: dateOnlyAgo(2),
        endDate: dateOnlyFromNow(3),
        documentId: absenceDocument.id,
        isApproved: true,
      },
      {
        employeeId: workerTomasz.id,
        type: AbsenceType.UNEXCUSED,
        startDate: dateOnlyAgo(1),
        endDate: dateOnlyAgo(1),
        isApproved: false,
      },
      {
        employeeId: workerAndrzej.id,
        type: AbsenceType.SPECIAL,
        startDate: dateOnlyFromNow(2),
        endDate: dateOnlyFromNow(2),
        isApproved: true,
      },
    ],
  });

  console.log('Tworzenie czasu pracy i zdarzeń RCP...');
  const timeEntries: TimeEntry[] = [];

  const krakowWorkers = [
    workerMarcin,
    workerKamil,
    workerMateusz,
    workerTomasz,
  ];
  const serviceWorkers = [workerAndrzej, workerMichal];
  const warsawWorkers = [
    workerPawel,
    workerGrzegorz,
    workerDawid,
    workerRobert,
  ];

  for (let day = 1; day <= 7; day++) {
    for (const [index, worker] of krakowWorkers.entries()) {
      const entry = await createWorkDay({
        employeeId: worker.id,
        projectId: projectKrakow.id,
        readerId: readerKrakowMain.id,
        daysAgo: day,
        startHour: 7,
        startMinute: index * 5,
        endHour: 15,
        endMinute: index * 3,
        status: day <= 4 ? TimeEntryStatus.APPROVED : TimeEntryStatus.PENDING,
      });

      timeEntries.push(entry);
    }

    for (const [index, worker] of serviceWorkers.entries()) {
      const entry = await createWorkDay({
        employeeId: worker.id,
        projectId: projectService.id,
        readerId: readerKrakowService.id,
        daysAgo: day,
        startHour: 8,
        startMinute: index * 10,
        endHour: 16,
        endMinute: 15,
        status: day <= 5 ? TimeEntryStatus.APPROVED : TimeEntryStatus.PENDING,
      });

      timeEntries.push(entry);
    }

    for (const [index, worker] of warsawWorkers.entries()) {
      const entry = await createWorkDay({
        employeeId: worker.id,
        projectId: projectWarsaw.id,
        readerId: readerWarsaw.id,
        daysAgo: day,
        startHour: 6,
        startMinute: 30 + index * 5,
        endHour: 14,
        endMinute: 45,
        status: day <= 4 ? TimeEntryStatus.APPROVED : TimeEntryStatus.PENDING,
      });

      timeEntries.push(entry);
    }
  }

  console.log('Tworzenie eksportu payroll...');
  const approvedEntries = timeEntries.filter(
    (entry) => entry.status === TimeEntryStatus.APPROVED,
  );

  const payrollExport = await prisma.payrollExport.create({
    data: {
      generatedByUserId: accounting.id,
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      totalEmployees: new Set(approvedEntries.map((entry) => entry.employeeId))
        .size,
      fileUrl: 'documents/demo/payroll/payroll-export-demo.csv',
    },
  });

  await prisma.timeEntry.updateMany({
    where: {
      id: {
        in: approvedEntries.slice(0, 20).map((entry) => entry.id),
      },
    },
    data: {
      payrollExportId: payrollExport.id,
    },
  });

  console.log('Tworzenie przykładowych logów audytowych...');
  await prisma.auditLog.createMany({
    data: [
      {
        employeeId: admin.id,
        action: 'DEMO_SEED_CREATED',
        entityName: 'Database',
        entityId: admin.id,
        oldValues: {},
        newValues: {
          description: 'Utworzono dane prezentacyjne systemu WorkFlow.',
        },
      },
      {
        employeeId: hr.id,
        action: 'EMPLOYEE_CONTRACT_CREATED',
        entityName: 'Contract',
        entityId: contracts[0]?.id ?? hr.id,
        oldValues: {},
        newValues: {
          description: 'Przykładowy wpis audytowy dla umowy pracownika.',
        },
      },
    ],
  });

  console.log('');
  console.log('Seed prezentacyjny zakończony.');
  console.log('');
  console.log('Konta testowe:');
  console.log(`- admin@workflow.pl / ${defaultPassword}`);
  console.log(`- hr@workflow.pl / ${defaultPassword}`);
  console.log(`- ksiegowa@workflow.pl / ${defaultPassword}`);
  console.log(`- brygadzista@workflow.pl / ${defaultPassword}`);
  console.log('');
  console.log('Dane RCP zgodne z symulatorem:');
  console.log('- karta: CARD-000123');
  console.log('- czytnik: RFID-R-1003');
}

main()
  .catch((error) => {
    console.error('Błąd seeda prezentacyjnego:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
