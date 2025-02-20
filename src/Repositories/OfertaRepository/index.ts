import { Oferta, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class OfertaRepository {
  async createMany(
    data: Omit<Oferta, "id" | "date_create" | "date_update">[]
  ): Promise<Prisma.BatchPayload> {
    return await prisma.oferta.createMany({
      data,
      skipDuplicates: true, // ✅ Evita duplicações caso já existam registros iguais
    });
  }

  async create(
    data: Omit<Oferta, "id" | "date_create" | "date_update">
  ): Promise<Oferta> {
    return await prisma.oferta.create({ data });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<Oferta[]> {
    const skip = (page - 1) * limit;
    return await prisma.oferta.findMany({
      take: limit, // Define o número de registros por página
      skip: skip, // Pula os registros anteriores conforme a página
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            supervisao_pertence: {
              select: { nome: true },
            },
            celula: {
              select: { nome: true },
            },
            cargo_de_lideranca: {
              select: { nome: true },
            },
            situacao_no_reino: {
              select: { nome: true },
            },
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

  async update(id: string, data: Partial<Oferta>): Promise<Oferta | null> {
    return await prisma.oferta.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Oferta | null> {
    return await prisma.oferta.delete({ where: { id } });
  }
}
