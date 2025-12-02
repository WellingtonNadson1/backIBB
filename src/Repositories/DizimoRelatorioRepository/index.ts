import { Dizimo, Prisma, PrismaClient } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();

export class DizimoRelatorioRepository {
  async createMany(
    data: Prisma.DizimoCreateManyInput[]
  ): Promise<Prisma.BatchPayload> {
    return await prisma.dizimo.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async create(
    data: Prisma.DizimoCreateInput | Prisma.DizimoUncheckedCreateInput
  ): Promise<Dizimo> {
    return await prisma.dizimo.create({ data });
  }

  async findAllRelatorioCards() {
    const primeiroDiaMesPassado = startOfMonth(subMonths(new Date(), 1));
    const ultimoDiaMesPassado = endOfMonth(subMonths(new Date(), 1));
    const primeiroDiaMesAtual = startOfMonth(new Date());
    const primeiroDiaTresMesesAtras = startOfMonth(subMonths(new Date(), 3));
    const hoje = new Date();

    const totalMembros = await prisma.user.count();

    const [
      usuariosUltimoMes,
      usuariosMesAtual,
      totalDizimosTresMeses,
      totalDizimosMesAtualAgg,
      totalDizimosMesPassadoAgg,
    ] = await Promise.all([
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
            lte: hoje,
          },
        },
        _count: { _all: true },
      }),
      prisma.dizimo.aggregate({
        _sum: { valor: true },
        where: {
          data_dizimou: {
            gte: primeiroDiaTresMesesAtras,
            lte: hoje,
          },
        },
      }),
      prisma.dizimo.aggregate({
        _sum: { valor: true },
        where: {
          data_dizimou: {
            gte: primeiroDiaMesAtual,
            lte: hoje,
          },
        },
      }),
      prisma.dizimo.aggregate({
        _sum: { valor: true },
        where: {
          data_dizimou: {
            gte: primeiroDiaMesPassado,
            lte: ultimoDiaMesPassado,
          },
        },
      }),
    ]);

    const totalDizimistasUnicosMesPassado = usuariosUltimoMes.length;
    const percentualDizimistasMesPassado =
      totalMembros > 0
        ? (totalDizimistasUnicosMesPassado / totalMembros) * 100
        : 0;

    const totalDizimosMesPassado = totalDizimosMesPassadoAgg._sum.valor || 0;
    const totalDizimosMesAtual = totalDizimosMesAtualAgg._sum.valor || 0;
    const totalDizimosUltimosTresMeses = totalDizimosTresMeses._sum.valor || 0;

    const totalDizimistasMesAtual = usuariosMesAtual.length;
    const ticketMedioMesAtual =
      totalDizimistasMesAtual > 0
        ? Number(totalDizimosMesAtual) / totalDizimistasMesAtual
        : 0;

    const variacaoMesAtualVsAnterior =
      Number(totalDizimosMesPassado) > 0
        ? ((Number(totalDizimosMesAtual) - Number(totalDizimosMesPassado)) /
            Number(totalDizimosMesPassado)) *
          100
        : 0;

    return {
      totalMembros,
      totalDizimistasUnicosMesPassado,
      percentualDizimistasMesPassado: percentualDizimistasMesPassado.toFixed(2),

      totalDizimosMesPassado,
      totalDizimosMesAtual,
      totalDizimosUltimosTresMeses,

      totalDizimistasMesAtual,
      ticketMedioMesAtual: ticketMedioMesAtual.toFixed(2),
      variacaoMesAtualVsAnterior: Number(variacaoMesAtualVsAnterior.toFixed(2)),
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
