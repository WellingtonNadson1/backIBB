// DizimoRepository.ts
import { Dizimo, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type DizimoWithUser = Prisma.DizimoGetPayload<{
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

export class DizimoRepository {
  async createMany(
    data: Omit<Dizimo, "id" | "date_create" | "date_update">[]
  ): Promise<Prisma.BatchPayload> {
    return await prisma.dizimo.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async create(
    data: Omit<Dizimo, "id" | "date_create" | "date_update">
  ): Promise<Dizimo> {
    return await prisma.dizimo.create({ data });
  }

  async findAll(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    data: DizimoWithUser[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.dizimo.findMany({
        take: limit,
        skip,
        orderBy: { data_dizimou: "desc" }, // opcional, só p/ manter ordem consistente
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
      }),
      prisma.dizimo.count(),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
