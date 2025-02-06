import { Dizimo, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class DizimoRepository {
  async createMany(
    data: Omit<Dizimo, "id" | "date_create" | "date_update">[]
  ): Promise<Prisma.BatchPayload> {
    return await prisma.dizimo.createMany({
      data,
      skipDuplicates: true, // ✅ Evita duplicações caso já existam registros iguais
    });
  }

  async create(
    data: Omit<Dizimo, "id" | "date_create" | "date_update">
  ): Promise<Dizimo> {
    return await prisma.dizimo.create({ data });
  }

  async findAll(page: number = 1, limit: number = 20): Promise<Dizimo[]> {
    const skip = (page - 1) * limit;
    return await prisma.dizimo.findMany({
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

  async findById(id: string): Promise<Dizimo | null> {
    return await prisma.dizimo.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async update(id: string, data: Partial<Dizimo>): Promise<Dizimo | null> {
    return await prisma.dizimo.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Dizimo | null> {
    return await prisma.dizimo.delete({ where: { id } });
  }
}
