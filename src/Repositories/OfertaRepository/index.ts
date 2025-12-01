// OfertaRepository.ts
import { Oferta, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type OfertaWithUser = Prisma.OfertaGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        first_name: true;
        last_name: true;
        email: true;
        supervisao_pertence: { select: { nome: true } };
        celula: { select: { nome: true } };
        cargo_de_lideranca: { select: { nome: true } };
        situacao_no_reino: { select: { nome: true } };
      };
    };
  };
}>;

export class OfertaRepository {
  async createMany(
    data: Prisma.OfertaCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    return await prisma.oferta.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async create(data: Prisma.OfertaUncheckedCreateInput): Promise<Oferta> {
    return await prisma.oferta.create({ data });
  }

  async findAll(
    page: number = 1,
    limit: number = 20
  ): Promise<OfertaWithUser[]> {
    const skip = (page - 1) * limit;
    return await prisma.oferta.findMany({
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supervisao_pertence: { select: { nome: true } },
            celula: { select: { nome: true } },
            cargo_de_lideranca: { select: { nome: true } },
            situacao_no_reino: { select: { nome: true } },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Oferta | null> {
    return await prisma.oferta.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async update(
    id: string,
    data: Prisma.OfertaUncheckedUpdateInput
  ): Promise<Oferta | null> {
    return await prisma.oferta.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Oferta | null> {
    return await prisma.oferta.delete({ where: { id } });
  }
}
