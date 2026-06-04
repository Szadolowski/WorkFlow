import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function clearDatabase() {
  await prisma.timeEntry.deleteMany();
  await prisma.timeEvent.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeCertification.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.payrollExport.deleteMany();
  await prisma.employeeFacilityAccess.deleteMany();
  await prisma.employeeAssignment.deleteMany();
  await prisma.equipmentAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.equipmentCategory.deleteMany();
  await prisma.reader.deleteMany();
  await prisma.project.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.certificationDictionary.deleteMany();
  await prisma.facility.deleteMany();
}

async function createUser({
  firstName,
  lastName,
  email,
  role,
  facilityId,
  passwordHash,
}: {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  facilityId: string;
  passwordHash: string;
}) {
  const employee = await prisma.employee.create({
    data: {
      firstName,
      lastName,
      email,
      role,
      facilityId,
      passwordHash,
      isLoginEnabled: true,
      isActive: true,
    },
  });

  await prisma.employeeFacilityAccess.create({
    data: {
      employeeId: employee.id,
      facilityId,
    },
  });

  return employee;
}

async function main() {
  console.log('Czyszczenie bazy...');
  await clearDatabase();

  console.log('Tworzenie zakładu głównego...');
  const facility = await prisma.facility.create({
    data: {
      name: 'Biuro Główne',
      code: 'MAIN',
      address: 'Siedziba główna',
      isActive: true,
    },
  });

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  console.log('Tworzenie kont startowych...');

  await createUser({
    firstName: 'Admin',
    lastName: 'Systemu',
    email: 'admin@workflow.pl',
    role: UserRole.ADMIN,
    facilityId: facility.id,
    passwordHash,
  });

  await createUser({
    firstName: 'Anna',
    lastName: 'Kadry',
    email: 'hr@workflow.pl',
    role: UserRole.HR,
    facilityId: facility.id,
    passwordHash,
  });

  await createUser({
    firstName: 'Krystyna',
    lastName: 'Księgowość',
    email: 'ksiegowa@workflow.pl',
    role: UserRole.ACCOUNTING,
    facilityId: facility.id,
    passwordHash,
  });

  await createUser({
    firstName: 'Piotr',
    lastName: 'Brygadzista',
    email: 'brygadzista@workflow.pl',
    role: UserRole.FOREMAN,
    facilityId: facility.id,
    passwordHash,
  });

  console.log('');
  console.log('Minimalny seed zakończony.');
  console.log('');
  console.log('Zakład:');
  console.log(`- ${facility.name} (${facility.code})`);
  console.log('');
  console.log('Konta startowe:');
  console.log('- admin@workflow.pl');
  console.log('- hr@workflow.pl');
  console.log('- ksiegowa@workflow.pl');
  console.log('- brygadzista@workflow.pl');
  console.log('');
  console.log(`Hasło startowe: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error('Błąd minimalnego seeda:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
