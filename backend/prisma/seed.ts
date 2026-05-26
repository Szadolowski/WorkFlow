import 'dotenv/config';
import { PrismaClient, UserRole, CertificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Rozpoczynam seedowanie bazy danych...');

  // 1. Tworzenie Zakładów (Facility)
  const mainFacility = await prisma.facility.create({
    data: {
      name: 'Główna Siedziba / Centrala',
      code: 'HQ-001',
      address: 'ul. Przykładowa 1, 00-000 Warszawa',
    },
  });
  console.log(`✅ Utworzono zakład: ${mainFacility.name}`);

  const branchFacility = await prisma.facility.create({
    data: {
      name: 'Oddział Północ',
      code: 'NORTH-002',
      address: 'ul. Przykładowa 2, 80-000 Gdańsk',
    },
  });

  // 2. Tworzenie Słowników Szkoleń
  await prisma.certificationDictionary.createMany({
    data: [
      {
        name: 'Szkolenie BHP',
        type: CertificationType.BHP,
        defaultValidityMonths: 12,
      },
      {
        name: 'Badania Lekarskie',
        type: CertificationType.MEDICAL,
        defaultValidityMonths: 24,
      },
      {
        name: 'Uprawnienia UDT - Wózki',
        type: CertificationType.UDT,
        defaultValidityMonths: 36,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Utworzono słowniki uprawnień`);

  // 3. Tworzenie kategorii i sprzętu BHP (Z Kroku 3)
  const eqCategory = await prisma.equipmentCategory.create({
    data: {
      name: 'Elektronarzędzia',
      description: 'Wiertarki, szlifierki, piły',
    },
  });

  await prisma.equipment.create({
    data: {
      categoryId: eqCategory.id,
      name: 'Wiertarka Udarowa Bosch',
      serialNumber: 'BOSCH-12345',
    },
  });
  console.log(`✅ Utworzono kategorie i przykładowy sprzęt BHP`);

  // 4. Tworzenie użytkowników: Admin, HR, Brygadzista
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  // ADMIN
  const admin = await prisma.employee.create({
    data: {
      facilityId: mainFacility.id,
      firstName: 'Jan',
      lastName: 'Administrator',
      email: 'admin@workflow.pl',
      pesel: '00000000000',
      role: UserRole.ADMIN,
      isLoginEnabled: true,
      passwordHash: passwordHash,
      isActive: true,
    },
  });

  // HR
  const hr = await prisma.employee.create({
    data: {
      facilityId: mainFacility.id,
      firstName: 'Anna',
      lastName: 'Kadrowa',
      email: 'hr@workflow.pl',
      pesel: '11111111111',
      role: UserRole.HR, // Założenie, że masz taką rolę w enumie UserRole
      isLoginEnabled: true,
      passwordHash: passwordHash,
      isActive: true,
    },
  });

  // BRYGADZISTA
  const foreman = await prisma.employee.create({
    data: {
      facilityId: mainFacility.id,
      firstName: 'Piotr',
      lastName: 'Brygadzista',
      email: 'brygadzista@workflow.pl',
      pesel: '22222222222',
      role: UserRole.FOREMAN, // Założenie, że masz taką rolę w enumie UserRole
      isLoginEnabled: true,
      passwordHash: passwordHash,
      isActive: true,
    },
  });

  // Nadanie dostępów do zakładów
  await prisma.$executeRaw`
    INSERT INTO "EmployeeFacilityAccess" ("employeeId", "facilityId", "createdAt")
    VALUES
      (${admin.id}, ${mainFacility.id}, NOW()),
      (${admin.id}, ${branchFacility.id}, NOW()),
      (${hr.id}, ${mainFacility.id}, NOW()),
      (${foreman.id}, ${mainFacility.id}, NOW())
    ON CONFLICT ("employeeId", "facilityId") DO NOTHING
  `;
  console.log(`✅ Utworzono konta testowe (hasło: Admin123!):`);
  console.log(`   - admin@workflow.pl`);
  console.log(`   - hr@workflow.pl`);
  console.log(`   - brygadzista@workflow.pl`);
  console.log('🚀 Baza danych jest gotowa do pracy!');
}

main()
  .catch((e) => {
    console.error('❌ Błąd podczas seedowania:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
