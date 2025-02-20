import { Dizimo, Prisma, PrismaClient } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();

export class DizimoRelatorioRepository {
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

  async findAllRelatorioCards() {
    // Obtendo as datas relevantes
    const primeiroDiaMesPassado = startOfMonth(subMonths(new Date(), 1));
  const ultimoDiaMesPassado = endOfMonth(subMonths(new Date(), 1));
  const primeiroDiaMesAtual = startOfMonth(new Date());
  const primeiroDiaTresMesesAtras = startOfMonth(subMonths(new Date(), 3));

    // Total de membros da igreja
    const totalMembros = await prisma.user.count();

    // Membros que dizimaram no mês passado e no mês atual (até agora)
  const [usuariosUltimoMes, usuariosMesAtual, totalDizimosTresMeses] = await Promise.all([
    prisma.dizimo.groupBy({
      by: ["userId"],
      where: {
        data_dizimou: {
          gte: primeiroDiaMesPassado,
          lte: ultimoDiaMesPassado,
        },
      },
      _count: { _all: true },
    }),
    prisma.dizimo.groupBy({
      by: ["userId"],
      where: {
        data_dizimou: {
          gte: primeiroDiaMesAtual,
          lte: new Date(),
        },
      },
      _count: { _all: true },
    }),
    prisma.dizimo.aggregate({
      _sum: { valor: true },
      where: {
        data_dizimou: {
          gte: primeiroDiaTresMesesAtras,
          lte: new Date(),
        },
      },
    }),
  ]);

    console.log(`Usuários que dizimaram no último mês: ${usuariosUltimoMes.length}`);
    console.log(`Usuários que dizimaram no mês atual até hoje: ${usuariosMesAtual.length}`);
    // const dizimistasUltimoMes = await prisma.dizimo.groupBy({
    //   by: ["userId"],
    //   where: {
    //     data_dizimou: {
    //       gte: primeiroDiaMesPassado,
    //       lte: new Date(), // Até o momento da requisição
    //     },
    //   },
    //   having: {
    //     _count: { equals: 1 },
    //   },
    //   _count: true,
    // });

    // Calculando percentual de dizimistas
    const totalDizimistasUnicosMesPassado = usuariosUltimoMes.length;
    const percentualDizimistas =
      totalMembros > 0 ? (totalDizimistasUnicosMesPassado / totalMembros) * 100 : 0;

    // Valor total dos dízimos do mês passado
    const totalDizimosMesPassado = await prisma.dizimo.aggregate({
      _sum: { valor: true },
      where: {
        data_dizimou: {
          gte: primeiroDiaMesPassado,
          lte: ultimoDiaMesPassado,
        },
      },
    });

    return {
      totalMembros,
      totalDizimistasUnicosMesPassado,
      percentualDizimistasMesPassado: percentualDizimistas.toFixed(2),
      totalDizimosMesPassado: totalDizimosMesPassado._sum.valor || 0,
      totalDizimosUltimosTresMeses: totalDizimosTresMeses._sum.valor || 0,
    };
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

  async findByIdSupervisao(
    id: string,
    dataInicio: string,
    dataFim: string
  ): Promise<Dizimo[] | null> {
    return await prisma.dizimo.findMany({
      where: {
        user: { supervisaoId: id },
        data_dizimou: {
          gte: new Date(dataInicio),
          lte: new Date(dataFim),
        },
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            supervisao_pertence: { select: { id: true, nome: true } },
            celula: { select: { id: true, nome: true } },
            cargo_de_lideranca: { select: { id: true, nome: true } },
            situacao_no_reino: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { data_dizimou: "asc" },
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
