import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Inicjalizujemy pulę połączeń dla Prisma 7
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    // Przekazujemy adapter do konstruktora bazowego PrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
