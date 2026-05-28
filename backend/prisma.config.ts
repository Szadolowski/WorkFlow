import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts', // <--- TUTAJ DODAJEMY POLECENIE SEED
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
