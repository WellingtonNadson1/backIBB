// DizimoRepository.ts
import { Dizimo, Prisma } from "@prisma/client";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

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
    data: Prisma.DizimoCreateManyInput[],
  ): Promise<Prisma.BatchPayload> {
    return await prisma.dizimo.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async create(data: Prisma.DizimoUncheckedCreateInput): Promise<Dizimo> {
    return await prisma.dizimo.create({ data });
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
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
        orderBy: { data_dizimou: "desc" },
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

  async update(
    id: string,
    data: Prisma.DizimoUncheckedUpdateInput,
  ): Promise<Dizimo | null> {
    // OBS: prisma.dizimo.update lança erro se não encontrar.
    // Se você realmente quiser null quando não encontrar, tem que tratar isso no controller.
    return await prisma.dizimo.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Dizimo | null> {
    return await prisma.dizimo.delete({ where: { id } });
  }
}
