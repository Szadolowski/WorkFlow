import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Dzięki temu dekoratorowi nie będziesz musiał importować PrismaModule w każdym nowym module, który stworzymy!
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
