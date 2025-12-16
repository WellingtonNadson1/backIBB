import {
  Dizimo,
  EventoContribuicao,
  Prisma,
  PrismaClient,
  TipoPagamento,
} from "@prisma/client";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

type LiderPorSupervisaoDTO = {
  supervisaoId: string;
  supervisaoNome: string;
  lideres: MembroCelulaRelatorioDTO[]; // reutiliza seu DTO
  totalGeral: number;
  totalRegistros: number;
};

type RelatorioFuncaoDetalhadoDTO = {
  supervisoes: LiderPorSupervisaoDTO[];
  totalGeral: number;
  totalRegistros: number;
};

type MembroCelulaRelatorioDTO = {
  membroId: string;
  membroNome: string;
  cargoNome: string | null;
  user_roles?: { rolenew: { name: string | null } }[];
  totalLancamentos: number;
  totalValor: number;
  temRegistro: boolean;
  ultimaDataDizimo: string | null;
};

type RelatorioCelulaDetalhadoDTO = {
  supervisaoId: string;
  supervisaoNome: string;
  celulaId: string;
  celulaNome: string;
  membros: MembroCelulaRelatorioDTO[];
  totalGeral: number;
  totalRegistros: number;
};

type CelulaRelatorioDTO = {
  celulaId: string;
  celulaNome: string;
  membros: MembroCelulaRelatorioDTO[];
};

type RelatorioSupervisaoDetalhadoDTO = {
  supervisaoId: string;
  supervisaoNome: string;
  celulas: CelulaRelatorioDTO[];
  totalGeral: number; // soma de todos os dízimos do período
  totalRegistros: number; // quantidade de lançamentos de dízimo
};

type DizimoReportItem = {
  id: string;
  data: string; // ISO string
  valor: number;
  evento: EventoContribuicao;
  tipoPagamento: TipoPagamento;

  membroId: string | null;
  membroNome: string | null;

  supervisaoId: string | null;
  supervisaoNome: string | null;

  celulaId: string | null;
  celulaNome: string | null;
};

type DizimoRelatorioDetalhadoResponse = {
  items: DizimoReportItem[];
  totalGeral: number;
  totalRegistros: number;
};

type TipoRelatorio = "SUPERVISAO" | "CELULA" | "FUNCAO" | "STATUS";

const prisma = new PrismaClient();

export class DizimoRelatorioRepository {
  async findRelatorioDetalhadoPorFuncao(params: {
    tipoFinanceiro: "DIZIMO" | "OFERTA";
    dataInicio?: string;
    dataFim?: string;
    supervisaoId?: string;
  }): Promise<RelatorioFuncaoDetalhadoDTO> {
    const { tipoFinanceiro, dataInicio, dataFim, supervisaoId } = params;

    const [yIni, mIni, dIni] = dataInicio?.split("-").map(Number) ?? [];
    const [yFim, mFim, dFim] = dataFim?.split("-").map(Number) ?? [];

    const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0, 0);
    const fim = new Date(yFim, mFim - 1, dFim, 23, 59, 59, 999);

    const rolesLideranca = [
      "USERLIDER",
      "USERSUPERVISOR",
      "USERPASTOR",
      "USERCENTRAL",
      "ADMIN",
    ] as const;

    const users = await prisma.user.findMany({
      where: {
        ...(supervisaoId ? { supervisaoId } : {}),
        user_roles: {
          some: {
            rolenew: { name: { in: rolesLideranca as any } },
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        cargo_de_lideranca: { select: { nome: true } },
        supervisao_pertence: { select: { id: true, nome: true } },
        user_roles: { select: { rolenew: { select: { name: true } } } },

        // ✅ “left join lógico”: traz contribuições do período; pode vir vazio
        Dizimo:
          tipoFinanceiro === "DIZIMO"
            ? {
                where: { data_dizimou: { gte: inicio, lte: fim } },
                select: { id: true, valor: true, data_dizimou: true },
              }
            : false,

        Oferta:
          tipoFinanceiro === "OFERTA"
            ? {
                where: { data_ofertou: { gte: inicio, lte: fim } },
                select: { id: true, valor: true, data_ofertou: true },
              }
            : false,
      },
      orderBy: [
        { supervisao_pertence: { nome: "asc" } },
        { first_name: "asc" },
      ],
    });

    // agrupa por supervisão
    const map = new Map<string, LiderPorSupervisaoDTO>();

    let totalGeralAll = 0;
    let totalRegsAll = 0;

    for (const u of users) {
      const supervisaoNome = u.supervisao_pertence?.nome ?? "SEM_SUPERVISÃO";
      const supervisaoKey = u.supervisao_pertence?.id ?? "SEM_SUPERVISAO";

      if (!map.has(supervisaoKey)) {
        map.set(supervisaoKey, {
          supervisaoId: supervisaoKey,
          supervisaoNome,
          lideres: [],
          totalGeral: 0,
          totalRegistros: 0,
        });
      }

      // pega lista de contribuições do período
      const contribs =
        tipoFinanceiro === "DIZIMO"
          ? (u as any).Dizimo ?? []
          : (u as any).Oferta ?? [];

      const totalValor = contribs.reduce(
        (acc: number, c: any) => acc + Number(c.valor ?? 0),
        0
      );

      const totalLancamentos = contribs.length;
      const temRegistro = totalLancamentos > 0;

      // última data no período
      let ultimaData: Date | null = null;
      for (const c of contribs) {
        const dt =
          tipoFinanceiro === "DIZIMO" ? c.data_dizimou : c.data_ofertou;
        if (dt && (!ultimaData || dt > ultimaData)) ultimaData = dt;
      }

      const membroNome = `${u.first_name} ${u.last_name ?? ""}`.trim();

      const dto: MembroCelulaRelatorioDTO = {
        membroId: u.id,
        membroNome,
        cargoNome: u.cargo_de_lideranca?.nome ?? null,
        user_roles: u.user_roles,
        totalLancamentos,
        totalValor,
        temRegistro,
        ultimaDataDizimo: ultimaData ? ultimaData.toISOString() : null,
      };

      const bucket = map.get(supervisaoKey)!;
      bucket.lideres.push(dto);

      bucket.totalGeral += totalValor;
      bucket.totalRegistros += totalLancamentos;

      totalGeralAll += totalValor;
      totalRegsAll += totalLancamentos;
    }

    // opcional: ordenar líderes dentro da supervisão por (temRegistro desc, totalValor desc, nome)
    const supervisoes = Array.from(map.values()).map((s) => ({
      ...s,
      lideres: s.lideres.sort((a, b) => {
        if (a.temRegistro !== b.temRegistro) return a.temRegistro ? -1 : 1;
        if (b.totalValor !== a.totalValor) return b.totalValor - a.totalValor;
        return a.membroNome.localeCompare(b.membroNome, "pt-BR");
      }),
    }));

    return {
      supervisoes,
      totalGeral: totalGeralAll,
      totalRegistros: totalRegsAll,
    };
  }

  async findRelatorioDetalhadoPorSupervisao(params: {
    supervisaoId: string;
    dataInicio: string; // "YYYY-MM-DD"
    dataFim: string; // "YYYY-MM-DD"
  }): Promise<RelatorioSupervisaoDetalhadoDTO> {
    const { supervisaoId, dataInicio, dataFim } = params;

    const [yIni, mIni, dIni] = dataInicio.split("-").map(Number);
    const [yFim, mFim, dFim] = dataFim.split("-").map(Number);

    const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0, 0);
    const fim = new Date(yFim, mFim - 1, dFim, 23, 59, 59, 999);

    const supervisao = await prisma.supervisao.findUnique({
      where: { id: supervisaoId },
      select: {
        id: true,
        nome: true,
        celulas: {
          select: {
            id: true,
            nome: true,
            membros: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                cargo_de_lideranca: {
                  select: { nome: true },
                },
                user_roles: { select: { rolenew: { select: { name: true } } } },
                Dizimo: {
                  where: {
                    data_dizimou: {
                      gte: inicio,
                      lte: fim,
                    },
                  },
                  select: {
                    id: true,
                    valor: true,
                    data_dizimou: true, // 👈 importante
                  },
                },
              },
            },
          },
          orderBy: {
            nome: "asc",
          },
        },
      },
    });

    if (!supervisao) {
      return {
        supervisaoId,
        supervisaoNome: "",
        celulas: [],
        totalGeral: 0,
        totalRegistros: 0,
      };
    }

    let totalGeral = 0;
    let totalRegistros = 0;

    const celulas: CelulaRelatorioDTO[] = supervisao.celulas.map((celula) => {
      const membros: MembroCelulaRelatorioDTO[] = celula.membros
        .sort((a, b) => {
          const nomeA = `${a.first_name} ${a.last_name ?? ""}`.trim();
          const nomeB = `${b.first_name} ${b.last_name ?? ""}`.trim();
          return nomeA.localeCompare(nomeB, "pt-BR");
        })
        .map((membro) => {
          const nome = `${membro.first_name} ${membro.last_name ?? ""}`.trim();
          const cargoNome = membro.cargo_de_lideranca?.nome ?? null;

          const totalValor = membro.Dizimo.reduce(
            (acc, d) => acc + Number(d.valor ?? 0),
            0
          );
          const totalLancamentos = membro.Dizimo.length;
          const temRegistro = totalLancamentos > 0;

          // 👇 pega a última data de dízimo do período, se houver
          let ultimaData: Date | null = null;
          for (const d of membro.Dizimo) {
            if (!ultimaData || d.data_dizimou > ultimaData) {
              ultimaData = d.data_dizimou;
            }
          }

          const ultimaDataDizimo = ultimaData ? ultimaData.toISOString() : null;

          totalGeral += totalValor;
          totalRegistros += totalLancamentos;

          return {
            membroId: membro.id,
            membroNome: nome,
            cargoNome,
            totalLancamentos,
            totalValor,
            temRegistro,
            ultimaDataDizimo, // 👈 NOVO
          };
        });

      return {
        celulaId: celula.id,
        celulaNome: celula.nome,
        membros,
      };
    });

    return {
      supervisaoId: supervisao.id,
      supervisaoNome: supervisao.nome,
      celulas,
      totalGeral,
      totalRegistros,
    };
  }

  async findRelatorioDetalhadoPorCelula(params: {
    celulaId: string;
    dataInicio: string; // "YYYY-MM-DD"
    dataFim: string; // "YYYY-MM-DD"
  }): Promise<RelatorioCelulaDetalhadoDTO> {
    const { celulaId, dataInicio, dataFim } = params;

    const [yIni, mIni, dIni] = dataInicio.split("-").map(Number);
    const [yFim, mFim, dFim] = dataFim.split("-").map(Number);

    const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0, 0);
    const fim = new Date(yFim, mFim - 1, dFim, 23, 59, 59, 999);

    const celula = await prisma.celula.findUnique({
      where: { id: celulaId },
      select: {
        id: true,
        nome: true,
        supervisao: {
          select: {
            id: true,
            nome: true,
          },
        },
        membros: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            cargo_de_lideranca: {
              select: { nome: true },
            },
            user_roles: { select: { rolenew: { select: { name: true } } } },
            Dizimo: {
              where: {
                data_dizimou: {
                  gte: inicio,
                  lte: fim,
                },
              },
              select: {
                id: true,
                valor: true,
                data_dizimou: true,
              },
            },
          },
        },
      },
    });

    if (!celula) {
      return {
        supervisaoId: "",
        supervisaoNome: "",
        celulaId,
        celulaNome: "",
        membros: [],
        totalGeral: 0,
        totalRegistros: 0,
      };
    }

    let totalGeral = 0;
    let totalRegistros = 0;

    // Ordena membros alfabeticamente
    const membros: MembroCelulaRelatorioDTO[] = celula.membros
      .sort((a, b) => {
        const nomeA = `${a.first_name} ${a.last_name ?? ""}`.trim();
        const nomeB = `${b.first_name} ${b.last_name ?? ""}`.trim();
        return nomeA.localeCompare(nomeB, "pt-BR");
      })
      .map((membro) => {
        const nome = `${membro.first_name} ${membro.last_name ?? ""}`.trim();
        const cargoNome = membro.cargo_de_lideranca?.nome ?? null;

        const totalValor = membro.Dizimo.reduce(
          (acc, d) => acc + Number(d.valor ?? 0),
          0
        );
        const totalLancamentos = membro.Dizimo.length;
        const temRegistro = totalLancamentos > 0;

        let ultimaData: Date | null = null;
        for (const d of membro.Dizimo) {
          if (!ultimaData || d.data_dizimou > ultimaData) {
            ultimaData = d.data_dizimou;
          }
        }

        const ultimaDataDizimo = ultimaData ? ultimaData.toISOString() : null;

        totalGeral += totalValor;
        totalRegistros += totalLancamentos;

        return {
          membroId: membro.id,
          membroNome: nome,
          cargoNome,
          totalLancamentos,
          totalValor,
          temRegistro,
          ultimaDataDizimo,
        };
      });

    return {
      supervisaoId: celula.supervisao.id,
      supervisaoNome: celula.supervisao.nome,
      celulaId: celula.id,
      celulaNome: celula.nome,
      membros,
      totalGeral,
      totalRegistros,
    };
  }

  async findRelatorioDetalhado(params: {
    tipoRelatorio: TipoRelatorio;
    tipoFinanceiro: "DIZIMO" | "OFERTA";
    dataInicio: string; // "YYYY-MM-DD"
    dataFim: string; // "YYYY-MM-DD"
    supervisaoId?: string;
    celulaId?: string;
  }): Promise<DizimoRelatorioDetalhadoResponse | RelatorioCelulaDetalhadoDTO> {
    const { tipoRelatorio, dataInicio, dataFim, supervisaoId, celulaId } =
      params;

    // 🔹 CASO ESPECIAL: relatório por CÉLULA com membros
    if (tipoRelatorio === "CELULA" && celulaId) {
      return this.findRelatorioDetalhadoPorCelula({
        celulaId,
        dataInicio,
        dataFim,
      });
    }

    // monta datas (incluindo fim do dia para dataFim)
    const [yIni, mIni, dIni] = dataInicio.split("-").map(Number);
    const [yFim, mFim, dFim] = dataFim.split("-").map(Number);

    const inicio = new Date(yIni, mIni - 1, dIni, 0, 0, 0, 0);
    const fim = new Date(yFim, mFim - 1, dFim, 23, 59, 59, 999);

    const where: Prisma.DizimoWhereInput = {
      data_dizimou: {
        gte: inicio,
        lte: fim,
      },
    };

    // 🔹 filtro por tipo de relatório
    switch (tipoRelatorio) {
      case "SUPERVISAO":
        if (supervisaoId) {
          where.user = { supervisaoId };
        }
        break;

      case "CELULA":
        if (celulaId) {
          // filtra pela célula específica
          where.user = { celulaId };
        } else if (supervisaoId) {
          // ou por supervisão, se não tiver célula
          where.user = { supervisaoId };
        }
        break;

      case "FUNCAO":
        // aqui depois você pode filtrar por cargo_de_liderancaId
        // ex: where.user = { cargoDeLiderancaId: algumId }
        break;

      case "STATUS":
        // aqui depois dá pra filtrar por situacaoNoReinoId
        // ex: where.user = { situacaoNoReinoId: algumId }
        break;
    }

    const registros = await prisma.dizimo.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            supervisao_pertence: { select: { id: true, nome: true } },
            celula: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: {
        data_dizimou: "asc",
      },
    });

    const items: DizimoReportItem[] = registros.map((r) => ({
      id: r.id,
      data: r.data_dizimou.toISOString(),
      valor: Number(r.valor ?? 0),

      evento: r.evento,
      tipoPagamento: r.tipoPagamento,

      membroId: r.user?.id ?? null,
      membroNome: r.user
        ? `${r.user.first_name} ${r.user.last_name}`.trim()
        : null,

      supervisaoId: r.user?.supervisao_pertence?.id ?? null,
      supervisaoNome: r.user?.supervisao_pertence?.nome ?? null,

      celulaId: r.user?.celula?.id ?? null,
      celulaNome: r.user?.celula?.nome ?? null,
    }));

    const totalGeral = items.reduce((acc, curr) => acc + curr.valor, 0);

    return {
      items,
      totalGeral,
      totalRegistros: items.length,
    };
  }

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

  async findRelatorioMensal(qtdMeses: number = 12): Promise<
    {
      year: number;
      month: number; // 1–12
      totalDizimistasUnicos: number;
      totalMembros: number;
      percentualDizimistas: number;
    }[]
  > {
    const hoje = new Date();

    // início da janela: primeiro dia do mês (qtdMeses - 1) meses atrás
    const inicioJanela = startOfMonth(subMonths(hoje, qtdMeses - 1));

    // total de membros da igreja (fixo para todos os meses)
    const totalMembros = await prisma.user.count();

    // pega todos os dízimos da janela com userId
    const dizimos = await prisma.dizimo.findMany({
      where: {
        data_dizimou: {
          gte: inicioJanela,
          lte: hoje,
        },
      },
      select: {
        data_dizimou: true,
        userId: true,
      },
    });

    type Key = string; // "YYYY-M"

    const mapaMeses = new Map<
      Key,
      {
        year: number;
        month: number;
        userIds: Set<string>;
      }
    >();

    for (const d of dizimos) {
      if (!d.userId) continue; // ignora registros sem membro vinculado

      const data = d.data_dizimou;
      const year = data.getFullYear();
      const month = data.getMonth() + 1; // 0–11 → 1–12
      const key = `${year}-${month}`;

      if (!mapaMeses.has(key)) {
        mapaMeses.set(key, {
          year,
          month,
          userIds: new Set<string>(),
        });
      }

      mapaMeses.get(key)!.userIds.add(d.userId);
    }

    // garantir que todos os meses da janela apareçam, mesmo sem dízimos
    for (let i = 0; i < qtdMeses; i++) {
      const dataRef = subMonths(hoje, qtdMeses - 1 - i);
      const year = dataRef.getFullYear();
      const month = dataRef.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!mapaMeses.has(key)) {
        mapaMeses.set(key, {
          year,
          month,
          userIds: new Set<string>(),
        });
      }
    }

    // transforma em array e calcula percentuais
    const resultado = Array.from(mapaMeses.values())
      .map((item) => {
        const totalDizimistasUnicos = item.userIds.size;
        const percentualDizimistas =
          totalMembros > 0 ? (totalDizimistasUnicos / totalMembros) * 100 : 0;

        return {
          year: item.year,
          month: item.month,
          totalDizimistasUnicos,
          totalMembros,
          percentualDizimistas: Number(percentualDizimistas.toFixed(2)),
        };
      })
      // ordena por ano/mês (ascendente)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    return resultado;
  }
}
