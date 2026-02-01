import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";
import { dataSchemaCreateDiscipulado } from "../../Controllers/Discipulado/schema";
import { createPrismaInstance } from "../../services/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

type Period = { start: Date; end: Date };

type UUID = string;

type UserMini = {
  id: UUID;
  first_name: string;
  image_url: string | null;
};

type UserMiniNoImg = {
  id: UUID;
  first_name: string;
};

type DiscipuladoRow = {
  usuario_id: UUID;
  discipulador_id: UUID;
  data_ocorreu: Date;
};

type DiscipuladorShape = {
  user_discipulador: UserMiniNoImg & { image_url?: string | null };
  _count: { discipulado: number };
  discipulado: { data_ocorreu: string }[];
};

type DisciplosShape = {
  user_discipulos: { id: UUID; first_name: string; image_url: string };
  _count: { discipulado: number };
  discipulado: { data_ocorreu: string }[];
};

function endOfDay(d: Date) {
  return dayjs(d).endOf("day").toDate();
}

function toPeriod(start: Date, end: Date): Period {
  return { start, end };
}

class RegisterDiscipuladoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    console.log("Data Brasil (Date):", dataBrasilDate);
  }

  // =========================
  // Helpers (regra: "atual" = User.discipuladorId)
  // =========================

  private async getUsersByIds(prisma: any, ids: UUID[]): Promise<UserMini[]> {
    if (!ids.length) return [];
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, first_name: true, image_url: true },
    }) as Promise<UserMini[]>;
  }

  private async getCurrentDisciplesOf(
    prisma: any,
    discipuladorId: UUID,
  ): Promise<UserMini[]> {
    return prisma.user.findMany({
      where: { discipuladorId },
      select: { id: true, first_name: true, image_url: true },
      orderBy: [{ first_name: "asc" }],
    }) as Promise<UserMini[]>;
  }

  private async getDiscipuladosForPairsInPeriod(
    prisma: any,
    pairs: Array<{ usuario_id: UUID; discipulador_id: UUID }>,
    period: Period,
  ): Promise<DiscipuladoRow[]> {
    if (!pairs.length) return [];
    const OR = pairs.map((p) => ({
      usuario_id: p.usuario_id,
      discipulador_id: p.discipulador_id,
    }));

    return prisma.discipulado.findMany({
      where: { OR, data_ocorreu: { gte: period.start, lte: period.end } },
      select: { usuario_id: true, discipulador_id: true, data_ocorreu: true },
      orderBy: [{ data_ocorreu: "desc" }],
    }) as Promise<DiscipuladoRow[]>;
  }

  private buildDatesByPairIndex(rows: DiscipuladoRow[]) {
    const byPair = new Map<string, Date[]>();
    for (const r of rows) {
      const key = `${r.usuario_id}|${r.discipulador_id}`;
      const list = byPair.get(key) ?? [];
      list.push(r.data_ocorreu);
      byPair.set(key, list);
    }
    return byPair;
  }

  private buildCountAndDatesIndex(rows: DiscipuladoRow[]): Map<string, Date[]> {
    const byPair = new Map<string, Date[]>();

    for (const r of rows) {
      const key = `${r.usuario_id}|${r.discipulador_id}`;
      const list = byPair.get(key) ?? [];
      list.push(r.data_ocorreu);
      byPair.set(key, list);
    }

    return byPair;
  }

  // =========================
  // Relatório Supervisor (já estava no caminho certo)
  // =========================
  async discipuladosSupervisorRelatorios(
    startDate: Date,
    endDate: Date,
    superVisionId: string,
    cargoLiderancaId: string[],
  ) {
    const prisma = createPrismaInstance();
    const period: Period = {
      start: new Date(startDate),
      end: endOfDay(endDate),
    };

    try {
      const supervisao = await prisma.supervisao.findUnique({
        where: { id: superVisionId },
        select: {
          id: true,
          nome: true,
          membros: {
            where: { cargoDeLiderancaId: { in: cargoLiderancaId } },
            select: {
              id: true,
              first_name: true,
              cargo_de_lideranca: { select: { nome: true } },
              celula: {
                select: {
                  id: true,
                  nome: true,
                  lider: { select: { first_name: true } },
                },
              },
              supervisao_pertence: { select: { id: true, nome: true } },
            },
            orderBy: [{ first_name: "asc" }],
          },
        },
      });

      if (!supervisao) return [];

      const supervisorIds = supervisao.membros.map((m) => m.id);
      if (!supervisorIds.length) {
        return [{ id: supervisao.id, nome: supervisao.nome, membros: [] }];
      }

      // Discípulos atuais por supervisor (fonte de verdade)
      const discipulosAtuais = await prisma.user.findMany({
        where: {
          supervisaoId: superVisionId,
          discipuladorId: { in: supervisorIds },
          // is_discipulado: true, // opcional
        },
        select: {
          id: true,
          first_name: true,
          image_url: true,
          discipuladorId: true,
        },
        orderBy: [{ first_name: "asc" }],
      });

      const pairs = discipulosAtuais
        .filter((d) => d.discipuladorId)
        .map((d) => ({ usuario_id: d.id, discipulador_id: d.discipuladorId! }));

      const discipuladosNoPeriodo = await this.getDiscipuladosForPairsInPeriod(
        prisma,
        pairs,
        period,
      );

      const byPair = this.buildCountAndDatesIndex(discipuladosNoPeriodo);

      const discipulosBySupervisor = new Map<string, any[]>();
      for (const d of discipulosAtuais) {
        const supId = d.discipuladorId;
        if (!supId) continue;
        const key = `${d.id}|${supId}`;
        const datas = byPair.get(key) ?? [];

        const list = discipulosBySupervisor.get(supId) ?? [];
        list.push({
          user_discipulos: {
            id: d.id,
            first_name: d.first_name,
            image_url: d.image_url ?? "",
          },
          _count: { discipulado: datas.length },
          discipulado: datas.map((dt) => ({ data_ocorreu: dt.toISOString() })),
        });
        discipulosBySupervisor.set(supId, list);
      }

      const membros = supervisao.membros.map((m) => ({
        ...m,
        discipulos: discipulosBySupervisor.get(m.id) ?? [],
      }));

      return [{ id: supervisao.id, nome: supervisao.nome, membros }];
    } finally {
    }
  }

  // =========================
  // Métricas (não muda)
  // =========================
  async getMemberMetrics() {
    const prisma = createPrismaInstance();
    try {
      const totalMembros = await prisma.user.count();
      const totalAtivos = await prisma.user.count({
        where: { situacao_no_reino: { nome: { equals: "Ativo" } } },
      });
      const totalNormais = await prisma.user.count({
        where: { situacao_no_reino: { nome: { equals: "Normal" } } },
      });
      const totalInativos = await prisma.user.count({
        where: { situacao_no_reino: { nome: { equals: "Afastado" } } },
      });

      const totalDiscipulados = await prisma.discipulado.count();

      return {
        totalMembros,
        totalAtivos,
        totalNormais,
        totalInativos,
        totalDiscipulados,
      };
    } finally {
    }
  }

  // =========================
  // Relatório Supervisão (AJUSTADO: só discipulado atual)
  // Mantém o retorno já esperado (membros -> discipulador -> discipulado)
  // =========================
  async discipuladosRelatorioSupervisao(params: {
    superVisionId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const prisma = createPrismaInstance();
    const period: Period = {
      start: new Date(params.startDate),
      end: endOfDay(params.endDate),
    };

    try {
      // 1) Membros da supervisão com discipuladorId atual
      const supervisaoArr = await prisma.supervisao.findMany({
        where: { id: params.superVisionId },
        select: {
          membros: {
            select: {
              id: true,
              first_name: true,
              image_url: true,
              discipuladorId: true, // <- fonte de verdade
              celula: {
                select: {
                  id: true,
                  nome: true,
                  lider: { select: { first_name: true } },
                },
              },
              supervisao_pertence: { select: { id: true, nome: true } },
            },
          },
        },
      });

      const supervisao = supervisaoArr[0];
      if (!supervisao) return [];

      const membros = supervisao.membros;

      // 2) Pega dados dos discipuladores atuais (nome/imagem) num batch
      const discipuladorIds = Array.from(
        new Set(membros.map((m) => m.discipuladorId).filter(Boolean)),
      ) as string[];

      const discipuladores = await this.getUsersByIds(prisma, discipuladorIds);
      const discipuladorById = new Map<UUID, UserMini>(
        discipuladores.map((u: UserMini) => [u.id, u]),
      );

      // 3) Busca discipulados no período apenas do par atual (membro.id + membro.discipuladorId)
      const pairs = membros
        .filter((m) => !!m.discipuladorId)
        .map((m) => ({ usuario_id: m.id, discipulador_id: m.discipuladorId! }));

      const discipulados = await this.getDiscipuladosForPairsInPeriod(
        prisma,
        pairs,
        period,
      );
      const byPair = this.buildCountAndDatesIndex(discipulados);

      // 4) Monta no mesmo shape do front:
      // discipulador: [{ user_discipulador, _count, discipulado[] }]
      const membrosComDiscipuladorShape = membros.map((m) => {
        const discipuladorId = m.discipuladorId;
        if (!discipuladorId) {
          return { ...m, discipulador: [] };
        }

        const discipuladorUser = discipuladorById.get(discipuladorId);
        const datas = byPair.get(`${m.id}|${discipuladorId}`) ?? [];

        return {
          ...m,
          discipulador: [
            {
              user_discipulador: {
                id: discipuladorUser?.id ?? discipuladorId,
                first_name: discipuladorUser?.first_name ?? "",
              },
              _count: { discipulado: datas.length },
              discipulado: datas.map((dt) => ({
                data_ocorreu: dt.toISOString(),
              })),
            },
          ],
        };
      });

      // mantém o “array de supervisao” como antes (seu código retornava um array)
      return [{ membros: membrosComDiscipuladorShape }];
    } finally {
    }
  }

  // =========================
  // Cultos / Presença (não muda)
  // =========================
  async cultosRelatorios(params: {
    supervisaoId: string;
    startOfInterval: string;
    endOfInterval: string;
  }) {
    const prisma = createPrismaInstance();
    const dataFim = dayjs(params.endOfInterval).endOf("day").toISOString();

    try {
      return await prisma.cultoIndividual.findMany({
        where: {
          data_inicio_culto: { gte: params.startOfInterval },
          data_termino_culto: { lte: dataFim },
        },
        include: {
          presencas_culto: {
            include: {
              membro: {
                select: {
                  id: true,
                  first_name: true,
                  celula: { select: { id: true, nome: true } },
                  supervisao_pertence: { select: { id: true, nome: true } },
                },
              },
            },
          },
        },
      });
    } finally {
    }
  }

  async findAll() {
    const prisma = createPrismaInstance();
    try {
      return await prisma.presencaCulto.findMany({
        select: {
          id: true,
          status: true,
          userId: true,
          cultoIndividualId: true,
          membro: {
            select: {
              id: true,
              first_name: true,
              celula: { select: { nome: true } },
            },
          },
          date_create: true,
          date_update: true,
        },
      });
    } finally {
    }
  }

  async findFirst({
    presenca_culto,
    membro,
  }: {
    presenca_culto: string;
    membro: string;
  }) {
    const prisma = createPrismaInstance();
    try {
      return await prisma.presencaCulto.findFirst({
        where: {
          presenca_culto: { id: presenca_culto },
          membro: { id: membro },
        },
        select: {
          id: true,
          status: true,
          membro: {
            select: {
              id: true,
              first_name: true,
              celula: { select: { nome: true } },
            },
          },
          presenca_culto: true,
        },
      });
    } finally {
    }
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();
    try {
      return await prisma.presencaCulto.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          membro: {
            select: {
              id: true,
              first_name: true,
              celula: { select: { nome: true } },
            },
          },
          presenca_culto: true,
        },
      });
    } finally {
    }
  }

  async findByIdCulto(culto: string, lider: string) {
    const prisma = createPrismaInstance();
    try {
      return await prisma.presencaCulto.findFirst({
        where: { cultoIndividualId: culto, userId: lider },
        select: { id: true, status: true, presenca_culto: true },
      });
    } finally {
    }
  }

  // =========================
  // Rota: allmemberssupervisor/existing-register (AJUSTADO: já está ok)
  // Mantém retorno: data: User[] com discipulador[] e discipulos[]
  // =========================
  async findAllMembersSupervisorForPeriod({
    supervisor_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    supervisor_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();
    const period = toPeriod(firstDayOfMonth, lastDayOfMonth);

    try {
      // Supervisor
      const supervisorArr = await prisma.user.findMany({
        where: { id: supervisor_id },
        select: {
          id: true,
          first_name: true,
          cargo_de_lideranca: { select: { id: true, nome: true } },
          discipuladorId: true, // <- fonte de verdade pra "quem discipula ele"
        },
      });

      const supervisor = supervisorArr[0];
      if (!supervisor) return [];

      // discipulador atual do supervisor (1 item no array)
      let discipuladorShape: any[] = [];
      if (supervisor.discipuladorId) {
        const discipuladorUser = await prisma.user.findUnique({
          where: { id: supervisor.discipuladorId },
          select: { id: true, first_name: true },
        });

        const discipuladosDoSupervisor = await prisma.discipulado.findMany({
          where: {
            usuario_id: supervisor.id,
            discipulador_id: supervisor.discipuladorId,
            data_ocorreu: { gte: period.start, lte: period.end },
          },
          select: { data_ocorreu: true },
          orderBy: [{ data_ocorreu: "desc" }],
        });

        discipuladorShape = [
          {
            user_discipulador: {
              id: discipuladorUser?.id ?? supervisor.discipuladorId,
              first_name: discipuladorUser?.first_name ?? "",
            },
            _count: { discipulado: discipuladosDoSupervisor.length },
            discipulado: discipuladosDoSupervisor.map((d) => ({
              data_ocorreu: d.data_ocorreu.toISOString(),
            })),
          },
        ];
      }

      // discípulos atuais do supervisor (lista por discipuladorId)
      const discipulosAtuais = await this.getCurrentDisciplesOf(
        prisma,
        supervisor.id,
      );

      const pairs = discipulosAtuais.map((d: UserMini) => ({
        usuario_id: d.id,
        discipulador_id: supervisor.id,
      }));

      const discipulados = await this.getDiscipuladosForPairsInPeriod(
        prisma,
        pairs,
        period,
      );
      const byPair = this.buildCountAndDatesIndex(discipulados);

      const discipulosShape: DisciplosShape[] = discipulosAtuais.map(
        (u: UserMini) => {
          const datas = byPair.get(`${u.id}|${supervisor.id}`) ?? [];
          return {
            user_discipulos: {
              id: u.id,
              first_name: u.first_name,
              image_url: u.image_url ?? "",
            },
            _count: { discipulado: datas.length },
            discipulado: datas.map((dt) => ({
              data_ocorreu: dt.toISOString(),
            })),
          };
        },
      );

      return [
        {
          id: supervisor.id,
          first_name: supervisor.first_name,
          cargo_de_lideranca: supervisor.cargo_de_lideranca,
          discipulador: discipuladorShape,
          discipulos: discipulosShape,
        },
      ];
    } finally {
    }
  }

  // =========================
  // Rota: allmemberscell/existing-register (AJUSTADO: atual por discipuladorId)
  // Mantém retorno igual ao que você já manda (celula->membros->discipulador[])
  // =========================
  async findAllMembersCellForPeriod({
    cell_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    cell_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();
    const period = toPeriod(firstDayOfMonth, lastDayOfMonth);

    try {
      // 1) Membros da célula + discipuladorId (atual)
      const result = await prisma.celula.findMany({
        where: { id: cell_id },
        select: {
          membros: {
            select: {
              id: true,
              first_name: true,
              image_url: true,
              discipuladorId: true,
              cargo_de_lideranca: { select: { id: true, nome: true } },
            },
          },
        },
      });

      const celula = result[0];
      if (!celula) return [];

      const membros = celula.membros;

      // 2) Carrega dados dos discipuladores atuais em batch
      const discipuladorIds = Array.from(
        new Set(membros.map((m) => m.discipuladorId).filter(Boolean)),
      ) as string[];
      const discipuladores = await this.getUsersByIds(prisma, discipuladorIds);
      const discipuladorById = new Map<UUID, UserMini>(
        discipuladores.map((u: UserMini) => [u.id, u]),
      );

      // 3) Busca discipulados do período apenas dos pares atuais
      const pairs = membros
        .filter((m) => !!m.discipuladorId)
        .map((m) => ({ usuario_id: m.id, discipulador_id: m.discipuladorId! }));

      const discipulados = await this.getDiscipuladosForPairsInPeriod(
        prisma,
        pairs,
        period,
      );
      const byPair = this.buildCountAndDatesIndex(discipulados);

      // 4) Monta o mesmo shape do front: membro.discipulador: [{ user_discipulador, _count, discipulado[] }]
      const membrosComDiscipulador = membros.map((m) => {
        if (!m.discipuladorId) {
          return { ...m, discipulador: [] };
        }

        const u = discipuladorById.get(m.discipuladorId);
        const datas = byPair.get(`${m.id}|${m.discipuladorId}`) ?? [];

        return {
          ...m,
          discipulador: [
            {
              user_discipulador: {
                id: u?.id ?? m.discipuladorId,
                first_name: u?.first_name ?? "",
                image_url: u?.image_url ?? "",
              },
              _count: { discipulado: datas.length },
              discipulado: datas.map((dt) => ({
                data_ocorreu: dt.toISOString(),
              })),
            },
          ],
        };
      });

      // mantém o mesmo formato que você retornava: [{ membros: [...] }]
      return [{ membros: membrosComDiscipulador }];
    } finally {
    }
  }

  // =========================
  // findAllForPeriod (AJUSTADO: só atual pelo discipulador_id informado)
  // =========================
  async findAllForPeriod({
    usuario_id,
    discipulador_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    usuario_id: string;
    discipulador_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();
    const period = toPeriod(firstDayOfMonth, lastDayOfMonth);

    try {
      // valida o "atual": o usuário precisa ter discipuladorId == discipulador_id
      // (se você não quiser bloquear, pode só usar isso como filtro extra)
      const user = await prisma.user.findUnique({
        where: { id: usuario_id },
        select: { discipuladorId: true },
      });

      const discipuladorAtual = user?.discipuladorId;
      if (!discipuladorAtual || discipuladorAtual !== discipulador_id) {
        // retorna vazio (mantém shape) para não misturar histórico
        return {
          quantidadeDiscipuladoRealizado: 0,
          discipuladosRealizados: [],
        };
      }

      const result = await prisma.discipulado.findMany({
        where: {
          usuario_id,
          discipulador_id, // <- ESSENCIAL (antes faltava)
          data_ocorreu: { gte: period.start, lte: period.end },
        },
        select: { discipulado_id: true, data_ocorreu: true },
      });

      return {
        quantidadeDiscipuladoRealizado: result.length,
        discipuladosRealizados: result,
      };
    } finally {
    }
  }

  // =========================
  // createRegisterDiscipulado (opcional: validar atual)
  // =========================
  async createRegisterDiscipulado(
    RegisterDiscipuladoDataForm: dataSchemaCreateDiscipulado,
  ) {
    const prisma = createPrismaInstance();
    const { usuario_id, discipulador_id, data_ocorreu } =
      RegisterDiscipuladoDataForm;

    try {
      // Opcional (recomendado): garantir que está registrando no discipulador ATUAL
      const user = await prisma.user.findUnique({
        where: { id: usuario_id },
        select: { discipuladorId: true },
      });

      if (!user?.discipuladorId || user.discipuladorId !== discipulador_id) {
        // evita registrar histórico / inconsistência
        throw new Error(
          "Discipulador informado não é o discipulador atual do usuário.",
        );
      }

      const dateFinally = new Date(data_ocorreu);

      return await prisma.discipulado.create({
        data: {
          usuario_id,
          discipulador_id,
          data_ocorreu: dateFinally,
        },
      });
    } finally {
    }
  }

  // =========================
  // Presença (não muda)
  // =========================
  async updatePresencaCulto(
    id: string,
    presencaCultoDataForm: PresencaCultoData,
  ) {
    const prisma = createPrismaInstance();
    try {
      const { membro, ...presencaCultoData } = presencaCultoDataForm;

      return await prisma.presencaCulto.update({
        where: { id },
        data: {
          ...presencaCultoData,
          membro: { connect: { id: membro } },
          presenca_culto: { connect: { id: presencaCultoData.presenca_culto } },
        },
      });
    } finally {
    }
  }

  async deletePresencaCulto(id: string) {
    const prisma = createPrismaInstance();
    try {
      return await prisma.presencaCulto.delete({ where: { id } });
    } finally {
    }
  }
}

export default new RegisterDiscipuladoRepositorie();
