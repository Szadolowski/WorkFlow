import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaPg } from '@prisma/adapter-pg';
import { UserRole } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';

// Load Prisma client class from generated internals to stay compatible with ts-node CJS execution.
const { getPrismaClientClass } = require('../generated/prisma/internal/class');
const PrismaClient = getPrismaClientClass();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = 'admin@workflow.local';
  const plainPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!plainPassword) {
    console.error('❌ Brak hasła administratora w zmiennych środowiskowych');
    console.log(
      '👉 Upewnij się, że masz plik .env w folderze backend i zawiera on tę zmienną.',
    );
    process.exit(1);
  }

  // Haszowanie hasła (używamy 10 rund soli, co jest standardowym balansem między bezpieczeństwem a wydajnością)
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  // Weryfikacja czy admin już istnieje, aby zachować idempotentność skryptu
  const admin = await prisma.employee.upsert({
    where: {
      email: adminEmail,
    },
    update: {}, // Jeśli istnieje, nic nie zmieniamy
    create: {
      firstName: 'Główny',
      lastName: 'Administrator',
      email: adminEmail,
      pesel: '00000000000', // Unikalne pole, wymagane przez schemat, wstawiamy dummy data dla seeda
      passwordHash: passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      isLoginEnabled: true, // Kluczowe: domyślnie w schemacie jest false
    },
  });

  console.log(
    `✅ Pomyślnie utworzono lub zweryfikowano konto administratora: ${admin.email}`,
  );
}

main()
  .catch((error) => {
    console.error('❌ Wystąpił błąd podczas inicjalizacji bazy danych:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Zawsze zamykamy połączenie z bazą
    await prisma.$disconnect();
  });
