/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";

// Helpers
const TZ = "America/Sao_Paulo";

function getSaoPauloRangeNow() {
  const now = new Date(); // instante real
  const nowSP = utcToZonedTime(now, TZ); // "relógio" SP

  // DIA em SP -> converte para UTC p/ query no DB
  const inicioHojeUTC = zonedTimeToUtc(startOfDay(nowSP), TZ);
  const fimHojeUTC = zonedTimeToUtc(endOfDay(nowSP), TZ);

  // MÊS em SP -> converte para UTC p/ query no DB
  const inicioMesUTC = zonedTimeToUtc(startOfMonth(nowSP), TZ);
  const fimMesUTC = zonedTimeToUtc(endOfMonth(nowSP), TZ);

  return { now, nowSP, inicioHojeUTC, fimHojeUTC, inicioMesUTC, fimMesUTC };
}

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
    /**
     * ✅ agora significa:
     * "há registro (presente/ausente) para todos os membros"
     * (não depende do status ser true)
     */
    jaRegistrouPresenca?: boolean;
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
    const { nowSP, inicioHojeUTC, fimHojeUTC, inicioMesUTC, fimMesUTC } =
      getSaoPauloRangeNow();

    const hoje = nowSP; // lógica (weekday etc) em SP
    const inicioHoje = inicioHojeUTC; // queries no DB em UTC
    const fimHoje = fimHojeUTC;
    const inicioMes = inicioMesUTC;
    const fimMes = fimMesUTC;

    // 1) Descobrir a célula do líder
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

    // 3) Cultos de hoje
    const cultosHoje = await prisma.cultoIndividual.findMany({
      where: {
        data_inicio_culto: { gte: inicioHoje, lte: fimHoje },
      },
      select: { id: true, data_inicio_culto: true },
      orderBy: { data_inicio_culto: "asc" },
    });

    const cultosHojeIds = cultosHoje.map((c) => c.id);
    const membrosIds = celula.membros.map((m) => m.id);

    // ✅ Se quiser só cobrar pendência quando o culto já começou:
    const cultosQueJaComecaramIds = cultosHoje
      .filter((c) => c.data_inicio_culto <= fimHoje)
      .map((c) => c.id);

    const cultosParaChecarIds =
      cultosQueJaComecaramIds.length > 0
        ? cultosQueJaComecaramIds
        : cultosHojeIds;

    let jaRegistrouPresenca = false;
    let pendenciasPorCulto: Array<{ cultoId: string; faltam: number }> = [];

    if (cultosParaChecarIds.length > 0 && membrosIds.length > 0) {
      /**
       * ✅ CORREÇÃO DO PRISMA:
       * Seu model PresencaCulto tem:
       * - userId
       * - presenca_culto (relação com CultoIndividual)
       * - membro (relação com User)
       *
       * Então filtramos por:
       * - userId IN membrosIds
       * - presenca_culto.id IN cultosParaChecarIds
       */
      const presencasHoje = await prisma.presencaCulto.findMany({
        where: {
          userId: { in: membrosIds },
          presenca_culto: {
            // relação nullable => use "is" para filtrar pelo registro relacionado
            is: { id: { in: cultosParaChecarIds } },
          },
        },
        select: {
          userId: true,
          status: true,
          presenca_culto: { select: { id: true } },
        },
      });

      // Mapa cultoId -> set(userId) que já tem registro
      const mapCultoToSet = new Map<string, Set<string>>();
      for (const cultoId of cultosParaChecarIds) {
        mapCultoToSet.set(cultoId, new Set());
      }

      for (const p of presencasHoje) {
        const cultoId = p.presenca_culto?.id;
        if (!cultoId) continue;
        mapCultoToSet.get(cultoId)?.add(p.userId!);
      }

      pendenciasPorCulto = cultosParaChecarIds.map((cultoId) => {
        const set = mapCultoToSet.get(cultoId) ?? new Set<string>();
        const faltam = membrosIds.filter((id) => !set.has(id)).length;
        return { cultoId, faltam };
      });

      // ✅ completo se TODOS os cultos checados tiverem registro para TODOS os membros
      jaRegistrouPresenca = pendenciasPorCulto.every((x) => x.faltam === 0);
    }

    // 4) Lição vigente
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

    // 5) Agenda do mês
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

    // 6.1 registrar culto hoje (se há culto e faltam registros)
    if (cultosParaChecarIds.length > 0 && !jaRegistrouPresenca) {
      acoesPendentes.push({
        id: "acao-registrar-culto",
        type: "REGISTRAR_CULTO",
        title: "Registrar presença do culto de hoje",
        description:
          "Há culto(s) hoje e ainda faltam registros (presente/ausente) para alguns membros.",
        meta: {
          totalCultosHoje: cultosHoje.length,
          cultosChecados: cultosParaChecarIds.length,
          pendenciasPorCulto: pendenciasPorCulto.filter((p) => p.faltam > 0),
        },
      });
    }

    // 6.2 registrar reunião da célula hoje
    const diaCelula = Number(celula.date_que_ocorre ?? "-1");
    const hojeWeekday = hoje.getDay(); // ✅ agora correto (SP)
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

    // 7) Mensagem de fé semanal
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

      const totalCultosMes = await prisma.cultoIndividual.count({
        where: {
          data_inicio_culto: { gte: inicio },
          data_termino_culto: { lte: fim },
        },
      });

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
            select: { id: true },
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
