import { Prisma, SupervisaoTipo } from "@prisma/client";
import { UserData, UserDataUpdate } from "../../Controllers/User/schema";
import { createPrismaInstance } from "../../services/prisma";

type UpdateUserInput = Prisma.UserUpdateInput & {
  connect?: {
    user?: {
      id: string;
    };
    user_discipulos?: {
      connect: {
        usuario_id: string;
        discipulador_id: string;
      };
    };
    discipulador?: {
      connect: {
        usuario_id: string;
        discipulador_id: string;
      };
    };
  };
  supervisao_pertence?: { connect: { id: string } };
  role?: string;
  celula?: { connect: { id: string } };
  celula_lidera?: { connect: { id: string } }[];
  escola_lidera?: { connect: { id: string } }[];
  supervisoes_lidera?: { connect: { id: string } }[];
  presencas_aulas_escolas?: { connect: { id: string } }[];
  presencas_reuniao_celula?: { connect: { id: string } }[];
  presencas_cultos?: { connect: { id: string } }[];
  escolas?: { connect: { id: string } }[];
  encontros?: { connect: { id: string } }[];
  situacao_no_reino?: { connect: { id: string } };
  cargo_de_lideranca?: { connect: { id: string } };
  TurmaEscola?: { connect: { id: string } };
};

class UserRepositorie {
  private sanitizeIds(ids: unknown[] | undefined): string[] {
    if (!ids) return [];

    return Array.from(
      new Set(
        ids
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      ),
    );
  }

  private sanitizeNodeId(value: unknown): string | null {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private resolveCoverageNodeIdFromPayload(payload: {
    nodeId?: unknown;
    supervisionNodeId?: unknown;
    supervisaoId?: unknown;
    superVisionId?: unknown;
    dicipuladosupervisaoId?: unknown;
  }): string | null {
    const candidates = [
      this.sanitizeNodeId(payload.nodeId),
      this.sanitizeNodeId(payload.supervisionNodeId),
      this.sanitizeNodeId(payload.supervisaoId),
      this.sanitizeNodeId(payload.superVisionId),
      this.sanitizeNodeId(payload.dicipuladosupervisaoId),
    ];

    return candidates.find(Boolean) ?? null;
  }

  private async resolveCoverageSetorIds(
    prisma: ReturnType<typeof createPrismaInstance>,
    coverageNodeId: string,
  ): Promise<string[]> {
    const node = await prisma.supervisao.findUnique({
      where: { id: coverageNodeId },
      select: { id: true, tipo: true },
    });

    if (!node) {
      return [];
    }

    if (node.tipo === SupervisaoTipo.SETOR) {
      return [node.id];
    }

    const descendants = await prisma.supervisaoClosure.findMany({
      where: {
        ancestorId: node.id,
        descendant: { tipo: SupervisaoTipo.SETOR },
      },
      select: { descendantId: true },
    });

    return this.sanitizeIds(descendants.map((row) => row.descendantId));
  }

  async getCombinedData() {
    const prisma = createPrismaInstance();

    // DEFINE O INÍCIO DO CORRENTE ANO
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    // DEFINE O FIM DO DIA DE HOJE
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // BUSCA ALMAS GANHAS NO ANO ATUAL
    const almasGanhasAno = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfYear,
            lt: endOfToday,
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);
    const almasGanhasNoAno = almasGanhasAno[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    // DEFINE O INÍCIO DO ANO PASSADO
    const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);

    // DEFINE O FIM DO ANO PASSADO
    const endOfLastYear = new Date(
      new Date().getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999,
    );

    // BUSCA ALMAS GANHAS NO ANO PASSADO
    const almasGanhasAnoPassado = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfLastYear,
            lt: endOfLastYear,
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoAnoPassado = almasGanhasAnoPassado[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    // DEFINE O INÍCIO E FIM DO MÊS ATUAL
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    );

    const almasGanhasMes = await prisma?.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfMonth,
            lt: new Date(
              endOfMonth.getFullYear(),
              endOfMonth.getMonth(),
              endOfMonth.getDate() + 1,
            ),
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoMes = almasGanhasMes[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    // DEFINE O INÍCIO E FIM DO MÊS PASSADO
    const startOfLastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1,
    );
    const endOfLastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      0,
    );

    const almasGanhasMesPassado = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfLastMonth,
            lt: new Date(
              endOfLastMonth.getFullYear(),
              endOfLastMonth.getMonth(),
              endOfLastMonth.getDate() + 1,
            ),
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoMesPassado = almasGanhasMesPassado[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    // Busca todas as reuniões do ano com data e almas ganhas
    const reunioesAno = await prisma.reuniaoCelula.findMany({
      where: {
        data_reuniao: {
          gte: startOfYear,
          lt: endOfToday,
        },
      },
      select: {
        data_reuniao: true,
        almas_ganhas: true,
      },
    });

    // Agrupa por mês
    const almasPorMesNoAno: Record<string, number> = {};

    reunioesAno.forEach((reuniao) => {
      if (reuniao.data_reuniao) {
        const mes = reuniao.data_reuniao.toLocaleString("pt-BR", {
          month: "long",
        });
        almasPorMesNoAno[mes] =
          (almasPorMesNoAno[mes] ?? 0) + (reuniao.almas_ganhas ?? 0);
      }
    });

    const combinedData = await prisma?.$transaction([
      prisma?.supervisao.findMany({
        select: {
          id: true,
          nome: true,
          cor: true,
          userId: true,
          supervisor: {
            select: {
              id: true,
              first_name: true,
              image_url: true,
              discipulos: {
                select: {
                  user_discipulos: {
                    select: {
                      id: true,
                      first_name: true,
                      cargo_de_lideranca: {
                        select: {
                          id: true,
                          nome: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          celulas: {
            select: {
              id: true,
              nome: true,
              lider: {
                select: {
                  id: true,
                  first_name: true,
                  image_url: true,
                },
              },
            },
          },
        },
      }),
      prisma?.escola.findMany(),
      prisma?.encontros.findMany(),
      prisma?.situacaoNoReino.findMany(),
      prisma?.cargoDeLideranca.findMany(),
    ]);

    return {
      combinedData,
      almasGanhasNoMes,
      almasGanhasNoMesPassado,
      almasGanhasNoAno,
      almasGanhasNoAnoPassado,
      almasPorMesNoAno,
    };
  }

  async findAllCell() {
    const prisma = createPrismaInstance();

    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        discipulos: {
          select: {
            user_discipulos: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        user_roles: {
          select: { rolenew: { select: { name: true } } },
        },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        escolas: { select: { id: true, nome: true } },
        encontros: { select: { id: true, nome: true } },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });

    return result;
  }

  async findAllDiscipulosSupervisor(payload: {
    dicipuladosupervisaoId?: string;
    supervisorId: string;
    nodeId?: string;
    supervisionNodeId?: string;
    supervisaoId?: string;
    superVisionId?: string;
  }) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");
    if (!payload.supervisorId) throw new Error("Supervisor ID is not defined");

    const coverageNodeId = this.resolveCoverageNodeIdFromPayload(payload);
    if (!coverageNodeId) throw new Error("Coverage node ID is not defined");

    const coverageSetorIds = await this.resolveCoverageSetorIds(
      prisma,
      coverageNodeId,
    );

    try {
      const [supervisor, discipulos] = await prisma.$transaction([
        prisma.user.findUnique({
          where: { id: payload.supervisorId },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image_url: true,
            role: true,
            supervisao_pertence: { select: { id: true, nome: true } },
            cargo_de_lideranca: { select: { id: true, nome: true } },
            user_roles: { select: { rolenew: { select: { name: true } } } },
          },
        }),

        prisma.user.findMany({
          where: {
            supervisaoId: { in: coverageSetorIds }, // cobertura de SETOR do nó selecionado
            discipuladorId: payload.supervisorId, // ✅ pega SOMENTE os atuais
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image_url: true,
            role: true,
            discipuladorId: true,
            supervisao_pertence: { select: { id: true, nome: true } },
            celula: { select: { id: true, nome: true } },
            cargo_de_lideranca: { select: { id: true, nome: true } },
            situacao_no_reino: { select: { id: true, nome: true } },
            user_roles: { select: { rolenew: { select: { name: true } } } },
            // ✅ se você quiser contar/mostrar discipulado recente, faça em outro endpoint
            // porque aqui seu "discipulos" é histórico e pode confundir.
          },
          orderBy: [{ first_name: "asc" }],
        }),
      ]);

      if (!supervisor) {
        throw new Error(`Supervisor ${payload.supervisorId} não encontrado`);
      }

      return {
        supervisor,
        discipulos,
        total: discipulos.length,
        coverage: {
          nodeId: coverageNodeId,
          setorIds: coverageSetorIds,
          totalSetores: coverageSetorIds.length,
        },
      };
    } finally {
    }
  }

  async findAllDiscipulosSupervisores(payload: {
    dicipuladosupervisaoId?: string;
    nodeId?: string;
    supervisionNodeId?: string;
    supervisaoId?: string;
    superVisionId?: string;
    cargoLiderancaSupervisores: { id: string; nome: string }[];
  }) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const coverageNodeId = this.resolveCoverageNodeIdFromPayload(payload);
    if (!coverageNodeId) throw new Error("Coverage node ID is not defined");

    const coverageSetorIds = await this.resolveCoverageSetorIds(
      prisma,
      coverageNodeId,
    );

    const coverageNode = await prisma.supervisao.findUnique({
      where: { id: coverageNodeId },
      select: {
        id: true,
        nome: true,
        tipo: true,
        cor: true,
        supervisor: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          },
        },
      },
    });

    try {
      const cargoFilters = payload.cargoLiderancaSupervisores.map((cargo) => ({
        cargo_de_lideranca: { nome: { contains: cargo.nome } },
      }));

      // 1) Busca supervisores (pessoas que são supervisores dentro da supervisão)
      const supervisores = await prisma.user.findMany({
        where: {
          supervisaoId: { in: coverageSetorIds },
          ...(cargoFilters.length > 0 ? { OR: cargoFilters } : {}),
        },
        select: {
          id: true,
          role: true,
          image_url: true,
          first_name: true,
          last_name: true,
          batizado: true,
          is_discipulado: true,
          discipuladorId: true,

          // ✅ se você quiser mostrar o discipulador ATUAL desse supervisor (1:1 via discipuladorId)
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              image_url: true,
            },
          },

          user_roles: { select: { rolenew: { select: { name: true } } } },

          supervisao_pertence: { select: { id: true, nome: true } },
          celula: { select: { id: true, nome: true } },
          celula_lidera: { select: { id: true, nome: true } },
          situacao_no_reino: { select: { id: true, nome: true } },
          cargo_de_lideranca: { select: { id: true, nome: true } },

          // ⚠️ NÃO use "discipulos" aqui para contagem/visão atual (isso é histórico)
          // discipulos: ... REMOVIDO
        },
        orderBy: [{ first_name: "asc" }],
      });

      const supervisorIds = supervisores.map((s) => s.id);

      // 2) Conta discípulos ATUAIS por supervisor (discipuladorId)
      const counts = supervisorIds.length
        ? await prisma.user.groupBy({
            by: ["discipuladorId"],
            where: {
              supervisaoId: { in: coverageSetorIds },
              discipuladorId: { in: supervisorIds },
            },
            _count: { _all: true },
          })
        : [];

      const countMap = new Map<string, number>();
      for (const row of counts) {
        const key = row.discipuladorId;
        if (key) countMap.set(key, row._count._all);
      }

      // 3) (Opcional) trazer uma amostra dos discípulos atuais para cada supervisor (ex: 3)
      // Se não precisar, pode remover esse bloco inteiro.
      const amostraDiscipulos = supervisorIds.length
        ? await prisma.user.findMany({
            where: {
              supervisaoId: { in: coverageSetorIds },
              discipuladorId: { in: supervisorIds },
            },
            select: {
              id: true,
              first_name: true,
              last_name: true,
              image_url: true,
              discipuladorId: true,
              cargo_de_lideranca: { select: { id: true, nome: true } },
            },
            orderBy: [{ first_name: "asc" }],
          })
        : [];

      const amostraMap = new Map<string, any[]>();
      for (const d of amostraDiscipulos) {
        const key = d.discipuladorId;
        if (!key) continue;
        const list = amostraMap.get(key) ?? [];
        if (list.length < 3) {
          list.push(d);
          amostraMap.set(key, list);
        }
      }

      const supervisorsWithMetrics = supervisores.map((s) => ({
        ...s,
        discipulosAtuaisCount: countMap.get(s.id) ?? 0,
        discipulosAtuaisPreview: amostraMap.get(s.id) ?? [],
      }));

      const celulas = coverageSetorIds.length
        ? await prisma.celula.findMany({
            where: {
              supervisaoId: { in: coverageSetorIds },
            },
            select: {
              id: true,
              nome: true,
              supervisaoId: true,
              lider: {
                select: {
                  id: true,
                  first_name: true,
                  image_url: true,
                },
              },
            },
            orderBy: [{ nome: "asc" }],
          })
        : [];

      // 4) Retorno final com contagem correta e cobertura
      return {
        node: coverageNode
          ? {
              id: coverageNode.id,
              nome: coverageNode.nome,
              tipo: coverageNode.tipo,
              cor: coverageNode.cor,
              supervisor: coverageNode.supervisor,
            }
          : null,
        coverage: {
          nodeId: coverageNodeId,
          setorIds: coverageSetorIds,
          totalSetores: coverageSetorIds.length,
        },
        supervisores: supervisorsWithMetrics,
        celulas,
      };
    } finally {
    }
  }

  async findAllDiscipulados() {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: { select: { id: true, first_name: true } },
          },
        },
        discipulos: {
          select: {
            user_discipulos: { select: { id: true, first_name: true } },
          },
        },
        user_roles: { select: { rolenew: { select: { name: true } } } },
        image_url: true,
        email: false,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: false,
        sexo: false,
        telefone: false,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: false,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        escolas: { select: { id: true, nome: true } },
        encontros: { select: { id: true, nome: true } },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });

    return result;
  }

  async findAllDiscipuladosAvailable() {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        image_url: true,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
      },
    });

    return result;
  }

  async findAllMembers() {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        user_roles: { select: { rolenew: { select: { name: true } } } },
        image_url: true,
        first_name: true,
        last_name: true,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
      },
    });

    return result;
  }

  async findAllSimple() {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        image_url: true,
        first_name: true,
        last_name: true,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
      },
    });

    return result;
  }

  async findAll() {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        discipulos: {
          select: {
            user_discipulos: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        user_roles: { select: { rolenew: { select: { name: true } } } },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: true,
        profissao: true,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: true,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: false,
        celulaId: false,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        escolas: { select: { id: true, nome: true } },
        encontros: { select: { id: true, nome: true } },
        presencas_aulas_escolas: true,
        presencas_cultos: false,
        password: false,
      },
    });

    const normalized = result.map((u) => {
      const discipulador_atual = u.discipuladorId
        ? (u.discipulador.find(
            (d) => d.user_discipulador?.id === u.discipuladorId,
          )?.user_discipulador ?? null)
        : null;

      return {
        ...u,
        discipulador: discipulador_atual, // { id, first_name, image_url } | null
      };
    });

    return normalized;
  }

  async findByIdCell(id: string) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        image_url: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        discipulos: {
          select: {
            user_discipulos: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        user_roles: {
          select: { rolenew: { select: { id: true, name: true } } },
        },
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });

    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        image_url: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        discipulos: {
          select: {
            user_discipulos: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        user_roles: {
          select: { rolenew: { select: { id: true, name: true } } },
        },
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: true,
        situacaoNoReinoId: true,
        cargoDeLiderancaId: true,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        escolas: { select: { id: true, nome: true } },
        encontros: { select: { id: true, nome: true } },
        presencas_aulas_escolas: true,
        presencas_cultos: false,
        password: false,
      },
    });

    return result;
  }

  async findByEmail(email: string) {
    const prisma = createPrismaInstance();

    const result = await prisma?.user.findFirst({
      where: { email },
      select: {
        id: true,
        role: true,
        discipulador: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        discipulos: {
          select: {
            user_discipulos: {
              select: { id: true, first_name: true, image_url: true },
            },
          },
        },
        user_roles: { select: { rolenew: { select: { name: true } } } },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: true,
        profissao: true,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        user: { select: { id: true, first_name: true, image_url: true } },
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: true,
        situacaoNoReinoId: true,
        cargoDeLiderancaId: true,
        supervisao_pertence: { select: { id: true, nome: true } },
        celula: { select: { id: true, nome: true } },
        celula_lidera: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },
        escolas: { select: { id: true, nome: true } },
        encontros: { select: { id: true, nome: true } },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: true,
      },
    });

    return result;
  }

  async createUser(userDataForm: UserData) {
    const prisma = createPrismaInstance();

    const {
      password,
      supervisao_pertence,
      celula,
      situacao_no_reino,
      cargo_de_lideranca,
      date_nascimento,
      date_batizado,
      date_casamento,
      date_decisao,
      discipuladorId,
      escolas,
      encontros,
      celula_lidera,
      escola_lidera,
      supervisoes_lidera,
      presencas_aulas_escolas,
      presencas_reuniao_celula,
      presencas_cultos,
      TurmaEscola,
      ...userData
    } = userDataForm;

    const user = await prisma.user.create({
      data: {
        ...userData,
        password,
        date_nascimento,
        date_batizado,
        date_casamento,
        date_decisao,
        supervisao_pertence: { connect: { id: supervisao_pertence } },
        celula: celula ? { connect: { id: celula } } : undefined,
        situacao_no_reino: { connect: { id: situacao_no_reino } },
        cargo_de_lideranca: { connect: { id: cargo_de_lideranca } },
        ...(discipuladorId && { user: { connect: { id: discipuladorId } } }),
        TurmaEscola: TurmaEscola ? { connect: { id: TurmaEscola } } : undefined,
        escolas: escolas?.length
          ? { connect: escolas.map((escola) => ({ id: escola.id })) }
          : undefined,
        encontros: encontros?.length
          ? { connect: encontros.map((encontro) => ({ id: encontro.id })) }
          : undefined,
        celula_lidera: celula_lidera?.length
          ? {
              connect: celula_lidera.map((celulaLideraId) => ({
                id: celulaLideraId,
              })),
            }
          : undefined,
        escola_lidera: escola_lidera?.length
          ? {
              connect: escola_lidera.map((escolaLideraId) => ({
                id: escolaLideraId,
              })),
            }
          : undefined,
        supervisoes_lidera: supervisoes_lidera?.length
          ? {
              connect: supervisoes_lidera.map((supervisoesLideraId) => ({
                id: supervisoesLideraId,
              })),
            }
          : undefined,
        presencas_aulas_escolas: presencas_aulas_escolas?.length
          ? { connect: presencas_aulas_escolas.map((id) => ({ id })) }
          : undefined,
        presencas_cultos: presencas_cultos?.length
          ? { connect: presencas_cultos.map((id) => ({ id })) }
          : undefined,
        presencas_reuniao_celula: presencas_reuniao_celula?.length
          ? { connect: presencas_reuniao_celula.map((id) => ({ id })) }
          : undefined,
      },
    });

    // ✅ cria relação pivô (sem “update” de PK)
    if (user.discipuladorId) {
      await this.ensureDiscipuladorRelation(user.id, user.discipuladorId);
    }

    return user;
  }

  async updateUser(id: string, userDataForm: UserDataUpdate) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    try {
      const {
        password,
        role,
        supervisao_pertence,
        celula,
        celula_lidera,
        escola_lidera,
        supervisoes_lidera,
        presencas_aulas_escolas,
        presencas_reuniao_celula,
        presencas_cultos,
        escolas,
        encontros,
        situacao_no_reino,
        TurmaEscola,
        date_nascimento,
        date_batizado,
        date_casamento,
        cargo_de_lideranca,
        discipuladorId,
        ...userData
      } = userDataForm;

      const updateUserInput: any = {
        ...userData,
        date_nascimento,
        date_batizado,
        date_casamento,
      };

      if (password !== undefined) updateUserInput.password = password;
      if (role !== undefined) updateUserInput.role = role;

      if (supervisao_pertence !== undefined) {
        updateUserInput.supervisao_pertence = {
          connect: { id: supervisao_pertence },
        };
      }

      if (celula !== undefined) {
        updateUserInput.celula = celula
          ? { connect: { id: celula } }
          : { disconnect: true };
      }

      if (situacao_no_reino !== undefined) {
        updateUserInput.situacao_no_reino = {
          connect: { id: situacao_no_reino },
        };
      }

      if (cargo_de_lideranca !== undefined) {
        updateUserInput.cargo_de_lideranca = {
          connect: { id: cargo_de_lideranca },
        };
      }

      if (TurmaEscola !== undefined) {
        updateUserInput.TurmaEscola = TurmaEscola
          ? { connect: { id: TurmaEscola } }
          : { disconnect: true };
      }

      // ✅ DISCIPULADOR: NÃO deleta relação antiga. NÃO update em discipulador_usuario.
      // Apenas:
      // 1) seta User.discipuladorId
      // 2) upsert na pivô para garantir que existe a relação (historico pode existir)
      if (discipuladorId !== undefined) {
        await prisma.$transaction(async (tx) => {
          if (discipuladorId) {
            const discipuladorExists = await tx.user.findUnique({
              where: { id: discipuladorId },
              select: { id: true },
            });
            if (!discipuladorExists) {
              throw new Error(
                `Discipulador com ID ${discipuladorId} não encontrado`,
              );
            }

            await tx.user.update({
              where: { id },
              data: { discipuladorId },
            });

            await tx.discipulador_usuario.upsert({
              where: {
                usuario_id_discipulador_id: {
                  usuario_id: id,
                  discipulador_id: discipuladorId,
                },
              },
              update: {},
              create: {
                usuario_id: id,
                discipulador_id: discipuladorId,
              },
            });
          } else {
            // se quiser permitir "remover discipulador atual"
            await tx.user.update({
              where: { id },
              data: { discipuladorId: null },
            });

            // ⚠️ não apaga pivô antiga (pra não apagar discipulado por cascade)
          }
        });
      }

      // Arrays de relações
      if (escolas !== undefined) {
        await prisma.user.update({
          where: { id },
          data: { escolas: { set: [] } },
        });
        updateUserInput.escolas = {
          connect: escolas?.map((e) => ({ id: e.id })) || [],
        };
      }

      if (encontros !== undefined) {
        await prisma.user.update({
          where: { id },
          data: { encontros: { set: [] } },
        });
        updateUserInput.encontros = {
          connect: encontros?.map((e) => ({ id: e.id })) || [],
        };
      }

      if (celula_lidera !== undefined) {
        updateUserInput.celula_lidera = {
          set: celula_lidera?.map((celulaId) => ({ id: celulaId })) || [],
        };
      }

      if (escola_lidera !== undefined) {
        updateUserInput.escola_lidera = {
          set: escola_lidera?.map((escolaId) => ({ id: escolaId })) || [],
        };
      }

      if (supervisoes_lidera !== undefined) {
        updateUserInput.supervisoes_lidera = {
          set:
            supervisoes_lidera?.map((supervisaoId) => ({ id: supervisaoId })) ||
            [],
        };
      }

      if (presencas_aulas_escolas !== undefined) {
        updateUserInput.presencas_aulas_escolas = {
          set: presencas_aulas_escolas?.map((aulaId) => ({ id: aulaId })) || [],
        };
      }

      if (presencas_reuniao_celula !== undefined) {
        updateUserInput.presencas_reuniao_celula = {
          set:
            presencas_reuniao_celula?.map((reuniaoId) => ({ id: reuniaoId })) ||
            [],
        };
      }

      if (presencas_cultos !== undefined) {
        updateUserInput.presencas_cultos = {
          set: presencas_cultos?.map((cultoId) => ({ id: cultoId })) || [],
        };
      }

      const result = await prisma.user.update({
        where: { id },
        data: updateUserInput,
      });

      return result;
    } catch (error) {
      console.error(error);

      throw error;
    }
  }

  // ✅ Não atualiza PK, não deleta histórico, não quebra FK de discipulado
  async ensureDiscipuladorRelation(userId: string, discipuladorId: string) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    try {
      return await prisma.discipulador_usuario.upsert({
        where: {
          usuario_id_discipulador_id: {
            usuario_id: userId,
            discipulador_id: discipuladorId,
          },
        },
        update: {},
        create: {
          usuario_id: userId,
          discipulador_id: discipuladorId,
        },
      });
    } finally {
    }
  }

  async patchStatusMembro({
    idMembro,
    statusMembro,
  }: {
    idMembro: string;
    statusMembro: string;
  }) {
    // ⚠️ aqui no seu código original você usa "prisma" global, o que dá bug.
    // Vamos manter o padrão createPrismaInstance() igual aos outros métodos.
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    try {
      const membro = await prisma.user.findUnique({ where: { id: idMembro } });
      if (!membro) throw new Error("Evento not found.");

      await prisma.user.update({
        where: { id: idMembro },
        data: { situacaoNoReinoId: statusMembro },
      });

      return { message: "Satus Atualizado com Sucesso!" };
    } finally {
    }
  }

  async updateDiscipuladorId(userId: string, discipuladorId: string) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    try {
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userExists) throw new Error(`Usuário ${userId} não encontrado`);

      const discipuladorExists = await prisma.user.findUnique({
        where: { id: discipuladorId },
      });
      if (!discipuladorExists) {
        throw new Error(`Discipulador ${discipuladorId} não encontrado`);
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { discipuladorId },
        });

        await tx.discipulador_usuario.upsert({
          where: {
            usuario_id_discipulador_id: {
              usuario_id: userId,
              discipulador_id: discipuladorId,
            },
          },
          update: {},
          create: {
            usuario_id: userId,
            discipulador_id: discipuladorId,
          },
        });
      });

      return "Discipulador updated successfully";
    } catch (error) {
      console.error("Error updating discipuladorId:", error);
      throw error;
    } finally {
    }
  }

  async deleteUser(id: string) {
    const prisma = createPrismaInstance();
    if (!prisma) throw new Error("Prisma instance is null");

    const result = await prisma?.user.delete({ where: { id } });

    return result;
  }
}

export default new UserRepositorie();
