import { PrismaClient } from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

const prisma = new PrismaClient();

/** ================= DTOs ================= */

type DashboardCardDTO = {
  membrosTotal: number;
  reuniaoHoje: boolean;
  presencaUltimaReuniao?: {
    data: string | null;
    presentes: number;
    totalMembros: number;
    percentual: number;
    visitantes: number;
    almasGanhas: number;
  };
  cultosHoje: {
    total: number;
    jaRegistrouPresenca?: boolean; // true se todos membros têm presença no 1º culto do dia
  };
};

type AcaoPendenteDTO = {
  id: string;
  type:
    | "REGISTRAR_CULTO"
    | "REGISTRAR_CELULA"
    | "MEMBROS_SEM_DISCIPULADO"
    | "MEMBROS_FALTOSOS";
  title: string;
  description?: string;
  meta?: Record<string, any>;
};

type LicaoVigenteDTO = {
  id: string;
  titulo: string;
  versiculoChave: string;
  linkPdf?: string | null;
  inicio: string;
  termino: string;
};

type AgendaItemDTO = {
  id: string;
  title: string | null;
  description: string | null;
  data_inicio: string;
  data_termino: string;
};

type MensagemFeDTO = {
  titulo: string;
  versiculo: string;
  texto: string;
};

export type LiderDashboardDTO = {
  celula: {
    id: string;
    nome: string;
    supervisao: { id: string; nome: string; cor: string };
    lider: {
      id: string;
      first_name: string;
      last_name: string;
      imageUrl: string | null;
    } | null;
  };
  cards: DashboardCardDTO;
  acoesPendentes: AcaoPendenteDTO[];
  licaoVigente: LicaoVigenteDTO | null;
  agendaHoje: AgendaItemDTO[];
  mensagemFeSemanal: MensagemFeDTO;
};

type Params = {
  userId: string;
  inicio: Date;
  fim: Date;
};

type FrequenciaCultosMesDTO = {
  mesRef: string; // "2025-12"
  totalCultosMes: number;
  celula: { id: string; nome: string };
  membros: {
    id: string;
    nome: string;
    presentesMes: number;
    percentual: number; // 0..100
  }[];
};

/** ================= Repository ================= */

export class LiderDashboardRepository {
  async getDashboardByLider(
    liderId: string
  ): Promise<LiderDashboardDTO | null> {
    const hoje = new Date();
    const inicioHoje = startOfDay(hoje);
    const fimHoje = endOfDay(hoje);
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    // 1) Descobrir a célula do líder:
    // - tenta pela relação celula_lidera
    // - fallback: user.celulaId (caso você use isso)
    const celula = await prisma.celula.findFirst({
      where: {
        OR: [{ userId: liderId }, { membros: { some: { id: liderId } } }],
      },
      select: {
        id: true,
        nome: true,
        date_que_ocorre: true,
        supervisao: { select: { id: true, nome: true, cor: true } },
        lider: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image_url: true,
          },
        },
        membros: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image_url: true,
            presencas_reuniao_celula: {
              select: { status: true, reuniaoCelulaId: true },
            },
            presencas_cultos: {
              select: { status: true, cultoIndividualId: true },
            },
          },
        },
      },
    });

    if (!celula) return null;

    const membrosTotal = celula.membros.length;

    // 2) Reuniões da célula (última e de hoje)
    const reuniaoHoje = await prisma.reuniaoCelula.findFirst({
      where: {
        celulaId: celula.id,
        data_reuniao: { gte: inicioHoje, lte: fimHoje },
      },
      orderBy: { data_reuniao: "desc" },
      select: { id: true, data_reuniao: true },
    });

    const ultimaReuniao = await prisma.reuniaoCelula.findFirst({
      where: {
        celulaId: celula.id,
        data_reuniao: { lte: fimHoje },
      },
      orderBy: { data_reuniao: "desc" },
      select: {
        id: true,
        data_reuniao: true,
        visitantes: true,
        almas_ganhas: true,
        presencas_membros_reuniao_celula: {
          select: { status: true },
        },
      },
    });

    const presencaUltimaReuniao = (() => {
      if (!ultimaReuniao) return undefined;

      const presentes = ultimaReuniao.presencas_membros_reuniao_celula.filter(
        (p) => p.status === true
      ).length;

      const percentual =
        membrosTotal > 0 ? Math.round((presentes / membrosTotal) * 100) : 0;

      return {
        data: ultimaReuniao.data_reuniao
          ? ultimaReuniao.data_reuniao.toISOString()
          : null,
        presentes,
        totalMembros: membrosTotal,
        percentual,
        visitantes: ultimaReuniao.visitantes ?? 0,
        almasGanhas: ultimaReuniao.almas_ganhas ?? 0,
      };
    })();

    // 3) Cultos de hoje (existem / e se já registrou)
    const cultosHoje = await prisma.cultoIndividual.findMany({
      where: {
        data_inicio_culto: { gte: inicioHoje, lte: fimHoje },
      },
      select: { id: true },
      orderBy: { data_inicio_culto: "asc" },
    });

    const primeiroCultoHojeId = cultosHoje[0]?.id ?? null;

    const jaRegistrouPresenca =
      primeiroCultoHojeId && membrosTotal > 0
        ? celula.membros.every((m) =>
            m.presencas_cultos.some(
              (p) => p.cultoIndividualId === primeiroCultoHojeId && p.status
            )
          )
        : false;

    // 4) Lição vigente (pela data)
    const licaoVigente = await prisma.licaoCelula.findFirst({
      where: {
        data_inicio: { lte: fimHoje },
        data_termino: { gte: inicioHoje },
      },
      orderBy: { data_inicio: "desc" },
      select: {
        id: true,
        titulo: true,
        versiculo_chave: true,
        link_objeto_aws: true,
        data_inicio: true,
        data_termino: true,
      },
    });

    // 5) Agenda do dia (se você usar Agenda global)
    const agendaHoje = await prisma.agenda.findMany({
      where: {
        data_inicio: { lte: fimMes },
        data_termino: { gte: inicioMes },
        status: true,
      },
      orderBy: { data_inicio: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        data_inicio: true,
        data_termino: true,
      },
    });

    // 6) Ações pendentes
    const acoesPendentes: AcaoPendenteDTO[] = [];

    // 6.1 registrar culto hoje (se existe culto e não registrou)
    if (cultosHoje.length > 0 && !jaRegistrouPresenca) {
      acoesPendentes.push({
        id: "acao-registrar-culto",
        type: "REGISTRAR_CULTO",
        title: "Registrar presença do culto de hoje",
        description:
          "Há culto(s) hoje e a presença ainda não foi registrada para todos os membros.",
        meta: {
          cultoId: primeiroCultoHojeId,
          totalCultosHoje: cultosHoje.length,
        },
      });
    }

    // 6.2 registrar reunião da célula hoje (se hoje for dia da célula e não existe reunião do dia)
    const diaCelula = Number(celula.date_que_ocorre ?? "-1");
    const hojeWeekday = hoje.getDay(); // 0 domingo... 6 sábado
    const ehDiaDeCelula = diaCelula === hojeWeekday;

    if (ehDiaDeCelula && !reuniaoHoje) {
      acoesPendentes.push({
        id: "acao-registrar-celula",
        type: "REGISTRAR_CELULA",
        title: "Registrar reunião da célula de hoje",
        description:
          "Hoje é dia de célula e não encontramos uma reunião registrada para a data.",
        meta: { celulaId: celula.id },
      });
    }

    // 6.3 membros sem discipulado recente (últimos 30 dias)
    // (você tem disciplinado por tabela "discipulado" vinculada via discipulador_usuario)
    const trintaDiasAtras = subDays(hoje, 30);

    const discipuladosRecentes = await prisma.discipulado.findMany({
      where: {
        data_ocorreu: { gte: trintaDiasAtras },
        discipulador_id: liderId,
      },
      select: { usuario_id: true },
    });

    const discipuladosSet = new Set(
      discipuladosRecentes.map((d) => d.usuario_id)
    );
    const membrosSemDiscipulado = celula.membros.filter(
      (m) => !discipuladosSet.has(m.id)
    );

    if (membrosSemDiscipulado.length > 0) {
      acoesPendentes.push({
        id: "acao-discipulado",
        type: "MEMBROS_SEM_DISCIPULADO",
        title: "Membros sem discipulado recente",
        description: `${membrosSemDiscipulado.length} membro(s) sem discipulado nos últimos 30 dias.`,
        meta: {
          membros: membrosSemDiscipulado.slice(0, 8).map((m) => ({
            id: m.id,
            nome: `${m.first_name} ${m.last_name ?? ""}`.trim(),
            image_url: m.image_url ?? null,
          })),
        },
      });
    }

    // 7) Mensagem de fé semanal (fallback estático por enquanto)
    // Depois a gente transforma em tabela própria ou usa Agenda com type=FE
    const mensagemFeSemanal: MensagemFeDTO = {
      titulo: "Fidelidade e ordem",
      versiculo: "1 Coríntios 14:40",
      texto:
        "Nesta semana, caminhe com fidelidade: seja constante no que Deus te confiou, cuide das pessoas com zelo e conduza tudo com decência e ordem.",
    };

    const cards: DashboardCardDTO = {
      membrosTotal,
      reuniaoHoje: !!reuniaoHoje,
      presencaUltimaReuniao,
      cultosHoje: {
        total: cultosHoje.length,
        jaRegistrouPresenca:
          cultosHoje.length > 0 ? !!jaRegistrouPresenca : undefined,
      },
    };

    return {
      celula: {
        id: celula.id,
        nome: celula.nome,
        supervisao: {
          id: celula.supervisao.id,
          nome: celula.supervisao.nome,
          cor: celula.supervisao.cor,
        },
        lider: celula.lider
          ? {
              id: celula.lider.id,
              first_name: celula.lider.first_name,
              last_name: celula.lider.last_name,
              imageUrl: celula.lider.image_url,
            }
          : null,
      },
      cards,
      acoesPendentes,
      licaoVigente: licaoVigente
        ? {
            id: licaoVigente.id,
            titulo: licaoVigente.titulo,
            versiculoChave: licaoVigente.versiculo_chave,
            linkPdf: licaoVigente.link_objeto_aws ?? null,
            inicio: licaoVigente.data_inicio.toISOString(),
            termino: licaoVigente.data_termino.toISOString(),
          }
        : null,
      agendaHoje: agendaHoje.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        data_inicio: a.data_inicio.toISOString(),
        data_termino: a.data_termino.toISOString(),
      })),
      mensagemFeSemanal,
    };
  }

  async getFrequenciaCultosMesPorCelula(
    params: Params
  ): Promise<FrequenciaCultosMesDTO> {
    const prisma = createPrismaInstance();

    try {
      const { userId, inicio, fim } = params;

      // 1) pega célula do líder
      const lider = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          celulaId: true,
          celula: { select: { id: true, nome: true } },
        },
      });

      if (!lider?.celulaId || !lider?.celula) {
        return {
          mesRef: `${inicio.getFullYear()}-${String(
            inicio.getMonth() + 1
          ).padStart(2, "0")}`,
          totalCultosMes: 0,
          celula: { id: "", nome: "Sem célula" },
          membros: [],
        };
      }

      const celulaId = lider.celulaId;

      // 2) total de cultos no mês
      // ✅ aqui você pode ajustar o filtro se quiser por supervisão, igreja, etc.
      const totalCultosMes = await prisma.cultoIndividual.count({
        where: {
          data_inicio_culto: { gte: inicio },
          data_termino_culto: { lte: fim },
        },
      });

      // 3) membros da célula + presenças do mês (status true)
      const membros = await prisma.user.findMany({
        where: { celulaId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          image_url: true,
          presencas_cultos: {
            where: {
              status: true,
              presenca_culto: {
                data_inicio_culto: { gte: inicio },
                data_termino_culto: { lte: fim },
              },
            },
            select: { id: true }, // só precisa contar
          },
        },
        orderBy: [{ first_name: "asc" }],
      });

      const membrosDTO = membros.map((m) => {
        const presentesMes = m.presencas_cultos.length;
        const nome = `${m.first_name} ${m.last_name ?? ""}`.trim();

        const percentual =
          totalCultosMes > 0
            ? Math.round((presentesMes / totalCultosMes) * 100)
            : 0;

        return { id: m.id, nome, presentesMes, percentual };
      });

      return {
        mesRef: `${inicio.getFullYear()}-${String(
          inicio.getMonth() + 1
        ).padStart(2, "0")}`,
        totalCultosMes,
        celula: { id: lider.celula.id, nome: lider.celula.nome },
        membros: membrosDTO,
      };
    } finally {
      await disconnectPrisma();
    }
  }
}
