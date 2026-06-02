import 'dotenv/config';
import {
  ContractType,
  PrismaClient,
  TimeEntryStatus,
  UserRole,
} from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Brak DATABASE_URL w zmiennych środowiskowych.');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const payrollMonth = Number(process.env.PAYROLL_MONTH || 3);
const payrollYear = Number(process.env.PAYROLL_YEAR || 2026);
const payrollEmployeeLimit = Number(process.env.PAYROLL_EMPLOYEE_LIMIT || 5);
const payrollFacilityId = process.env.PAYROLL_FACILITY_ID;
const payrollFacilityCode = process.env.PAYROLL_FACILITY_CODE;

const oldDemoPayrollEmails = [
  'payroll.worker1@workflow.pl',
  'payroll.worker2@workflow.pl',
  'payroll.worker3@workflow.pl',
];

function getPeriodRange(year: number, month: number) {
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 1),
  };
}

function getBusinessDays(year: number, month: number, limit = 10) {
  const days: Date[] = [];
  const date = new Date(year, month - 1, 1);

  while (date.getMonth() === month - 1 && days.length < limit) {
    const dayOfWeek = date.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(new Date(date));
    }

    date.setDate(date.getDate() + 1);
  }

  return days;
}

function shuffleArray<T>(items: T[]) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

async function resolveFacility() {
  if (payrollFacilityId) {
    const facility = await prisma.facility.findUnique({
      where: { id: payrollFacilityId },
    });

    if (!facility || !facility.isActive) {
      throw new Error(
        `Nie znaleziono aktywnego zakładu PAYROLL_FACILITY_ID=${payrollFacilityId}`,
      );
    }

    return facility;
  }

  if (payrollFacilityCode) {
    const facility = await prisma.facility.findUnique({
      where: { code: payrollFacilityCode },
    });

    if (!facility || !facility.isActive) {
      throw new Error(
        `Nie znaleziono aktywnego zakładu PAYROLL_FACILITY_CODE=${payrollFacilityCode}`,
      );
    }

    return facility;
  }

  const facility = await prisma.facility.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!facility) {
    throw new Error('Brak aktywnego zakładu w bazie.');
  }

  return facility;
}

async function removeOldDemoPayrollEmployees() {
  const oldEmployees = await prisma.employee.findMany({
    where: {
      email: {
        in: oldDemoPayrollEmails,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (oldEmployees.length === 0) {
    return;
  }

  const oldEmployeeIds = oldEmployees.map((employee) => employee.id);

  console.log(
    `🧹 Usuwam starych sztucznych pracowników payroll: ${oldEmployees
      .map((employee) => employee.email)
      .join(', ')}`,
  );

  await prisma.timeEntry.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.timeEvent.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.equipmentAssignment.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.employeeCertification.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.absence.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.document.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.contract.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.employeeFacilityAccess.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.employeeAssignment.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.auditLog.deleteMany({
    where: {
      employeeId: {
        in: oldEmployeeIds,
      },
    },
  });

  await prisma.employee.deleteMany({
    where: {
      id: {
        in: oldEmployeeIds,
      },
    },
  });
}

async function getExistingPayrollEmployees(facilityId: string) {
  const employees = await prisma.employee.findMany({
    where: {
      facilityId,
      isActive: true,
      role: UserRole.WORKER,
    },
    include: {
      contracts: {
        where: {
          isCurrent: true,
        },
        take: 1,
      },
    },
  });

  if (employees.length === 0) {
    throw new Error(
      'Brak aktywnych pracowników WORKER w wybranym zakładzie. Dodaj pracowników albo uruchom główny seed.',
    );
  }

  return shuffleArray(employees).slice(0, payrollEmployeeLimit);
}

async function main() {
  if (
    !Number.isInteger(payrollMonth) ||
    payrollMonth < 1 ||
    payrollMonth > 12
  ) {
    throw new Error('PAYROLL_MONTH musi być liczbą od 1 do 12.');
  }

  if (
    !Number.isInteger(payrollYear) ||
    payrollYear < 2000 ||
    payrollYear > 2100
  ) {
    throw new Error('PAYROLL_YEAR musi być liczbą od 2000 do 2100.');
  }

  if (
    !Number.isInteger(payrollEmployeeLimit) ||
    payrollEmployeeLimit < 1 ||
    payrollEmployeeLimit > 50
  ) {
    throw new Error('PAYROLL_EMPLOYEE_LIMIT musi być liczbą od 1 do 50.');
  }

  const facility = await resolveFacility();
  const { startDate, endDate } = getPeriodRange(payrollYear, payrollMonth);

  console.log(
    '🧾 Generuję dane testowe payroll dla istniejących pracowników...',
  );
  console.log(`Zakład: ${facility.name} (${facility.id})`);
  console.log(`Okres: ${payrollMonth}/${payrollYear}`);
  console.log(`Limit pracowników: ${payrollEmployeeLimit}`);

  await removeOldDemoPayrollEmployees();

  const projectCode = `PAYROLL-DEMO-${facility.id.slice(0, 8)}`;

  const project = await prisma.project.upsert({
    where: { internalCode: projectCode },
    create: {
      facilityId: facility.id,
      name: `Projekt testowy payroll - ${facility.name}`,
      internalCode: projectCode,
      status: 'ACTIVE',
      startDate,
    },
    update: {
      facilityId: facility.id,
      status: 'ACTIVE',
    },
  });

  await prisma.timeEntry.deleteMany({
    where: {
      projectId: project.id,
      startTime: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  const payrollEmployees = await getExistingPayrollEmployees(facility.id);
  const days = getBusinessDays(payrollYear, payrollMonth, 10);

  console.log(
    `Wylosowano ${payrollEmployees.length} pracowników do danych payroll.`,
  );

  for (const [index, employee] of payrollEmployees.entries()) {
    await prisma.employeeFacilityAccess.upsert({
      where: {
        employeeId_facilityId: {
          employeeId: employee.id,
          facilityId: facility.id,
        },
      },
      create: {
        employeeId: employee.id,
        facilityId: facility.id,
      },
      update: {},
    });

    let currentContract = employee.contracts[0];

    if (!currentContract) {
      currentContract = await prisma.contract.create({
        data: {
          employeeId: employee.id,
          type: ContractType.UZ,
          salaryAmount: 42 + index * 4,
          startDate,
          isCurrent: true,
        },
      });

      console.log(
        `ℹ️ Dodano testową umowę UZ dla: ${employee.firstName} ${employee.lastName}`,
      );
    }

    for (const day of days) {
      const startTime = new Date(day);
      startTime.setHours(7 + (index % 3), 0, 0, 0);

      const endTime = new Date(day);
      endTime.setHours(15 + (index % 3), 0, 0, 0);

      await prisma.timeEntry.create({
        data: {
          employeeId: employee.id,
          projectId: project.id,
          startTime,
          endTime,
          calculatedHours: 8,
          status: TimeEntryStatus.APPROVED,
        },
      });
    }

    console.log(
      `✅ ${employee.firstName} ${employee.lastName}: ${days.length} zatwierdzonych wpisów po 8h, umowa: ${currentContract.type}, ${currentContract.salaryAmount.toString()}`,
    );
  }

  console.log('');
  console.log('🎉 Dane payroll gotowe.');
  console.log(`facilityId do testu: ${facility.id}`);
  console.log(`miesiąc/rok: ${payrollMonth}/${payrollYear}`);
}

main()
  .catch((error) => {
    console.error('❌ Błąd seedowania payroll:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
