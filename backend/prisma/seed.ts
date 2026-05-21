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

  // 1. Tworzenie Zakładu Głównego (Facility)
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
  console.log(`✅ Utworzono zakład: ${branchFacility.name}`);

  // 2. Tworzenie Słowników Szkoleń (CertificationDictionary)
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

  // 3. Tworzenie konta Administratora
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.employee.create({
    data: {
      facilityId: mainFacility.id, // Podpinamy pod nowo utworzony zakład!
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

  await prisma.$executeRaw`
    INSERT INTO "EmployeeFacilityAccess" ("employeeId", "facilityId", "createdAt")
    VALUES
      (${admin.id}, ${mainFacility.id}, NOW()),
      (${admin.id}, ${branchFacility.id}, NOW())
    ON CONFLICT ("employeeId", "facilityId") DO NOTHING
  `;
  console.log(`✅ Utworzono konto admina: ${admin.email} (hasło: Admin123!)`);
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
