import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const facilities = await this.prisma.facility.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            employees: true,
            projects: true,
            readers: true,
            accessUsers: true,
          },
        },
      },
    });

    return {
      data: facilities,
    };
  }

  async create(dto: CreateFacilityDto) {
    if (dto.code) {
      const existing = await this.prisma.facility.findUnique({
        where: { code: dto.code },
        select: { id: true },
      });

      if (existing) {
        throw new ConflictException('Zakład z podanym kodem już istnieje.');
      }
    }

    const facility = await this.prisma.facility.create({
      data: {
        name: dto.name,
        code: dto.code || null,
        address: dto.address || null,
      },
    });

    return {
      data: facility,
    };
  }

  async update(id: string, dto: UpdateFacilityDto) {
    const existing = await this.prisma.facility.findUnique({
      where: { id },
      select: { id: true, code: true },
    });

    if (!existing) {
      throw new NotFoundException('Zakład nie istnieje.');
    }

    if (dto.code && dto.code !== existing.code) {
      const codeOwner = await this.prisma.facility.findUnique({
        where: { code: dto.code },
        select: { id: true },
      });

      if (codeOwner && codeOwner.id !== id) {
        throw new ConflictException('Zakład z podanym kodem już istnieje.');
      }
    }

    const updated = await this.prisma.facility.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return {
      data: updated,
    };
  }
}
