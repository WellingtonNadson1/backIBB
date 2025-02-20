import { Oferta, Prisma, PrismaClient } from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

const prisma = new PrismaClient();

export class OfertaRelatorioRepository {
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

  async findAllRelatorioCards() {
    // Obtendo as datas relevantes
    const primeiroDiaMesPassado = startOfMonth(subMonths(new Date(), 1));
    const ultimoDiaMesPassado = endOfMonth(subMonths(new Date(), 1));
    const primeiroDiaMesAtual = startOfMonth(new Date());
    const primeiroDiaTresMesesAtras = startOfMonth(subMonths(new Date(), 3));

    // Total de membros da igreja
    const totalMembros = await prisma.user.count();

    // Membros que dizimaram no mês passado e no mês atual (até agora)
    const [usuariosUltimoMes, usuariosMesAtual, totalofertasTresMeses] =
      await Promise.all([
        prisma.oferta.groupBy({
          by: ["userId"],
          where: {
            data_ofertou: {
              gte: primeiroDiaMesPassado,
              lte: ultimoDiaMesPassado,
            },
          },
          _count: { _all: true },
        }),
        prisma.oferta.groupBy({
          by: ["userId"],
          where: {
            data_ofertou: {
              gte: primeiroDiaMesAtual,
              lte: new Date(),
            },
          },
          _count: { _all: true },
        }),
        prisma.oferta.aggregate({
          _sum: { valor: true },
          where: {
            data_ofertou: {
              gte: primeiroDiaTresMesesAtras,
              lte: new Date(),
            },
          },
        }),
      ]);

    console.log(
      `Usuários que ofertaram no último mês: ${usuariosUltimoMes.length}`
    );
    console.log(
      `Usuários que ofertaram no mês atual até hoje: ${usuariosMesAtual.length}`
    );
    // const dizimistasUltimoMes = await prisma.oferta.groupBy({
    //   by: ["userId"],
    //   where: {
    //     data_ofertou: {
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
    const totalOfertantesUnicosMesPassado = usuariosUltimoMes.length;
    const percentualOfertantes =
      totalMembros > 0
        ? (totalOfertantesUnicosMesPassado / totalMembros) * 100
        : 0;

    // Valor total dos dízimos do mês passado
    const totalOfertasMesPassado = await prisma.oferta.aggregate({
      _sum: { valor: true },
      where: {
        data_ofertou: {
          gte: primeiroDiaMesPassado,
          lte: ultimoDiaMesPassado,
        },
      },
    });

    return {
      totalMembros,
      totalOfertantesUnicosMesPassado,
      percentualOfertantesMesPassado: percentualOfertantes.toFixed(2),
      totalofertasMesPassado: totalOfertasMesPassado._sum.valor || 0,
      totalofertasUltimosTresMeses: totalofertasTresMeses._sum.valor || 0,
    };
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

  async findByIdSupervisao(
    id: string,
    dataInicio: string,
    dataFim: string
  ): Promise<Oferta[] | null> {
    return await prisma.oferta.findMany({
      where: {
        user: { supervisaoId: id },
        data_ofertou: {
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
      orderBy: { data_ofertou: "asc" },
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
