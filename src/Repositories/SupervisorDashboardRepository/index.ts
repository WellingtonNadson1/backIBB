// Repositories/SupervisorDashboardRepository.ts
import {
  endOfDay,
  startOfDay,
  subDays,
  differenceInDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { utcToZonedTime, zonedTimeToUtc } from "date-fns-tz";
import { createPrismaInstance } from "../../services/prisma";

// ================= Helpers (Timezone) =================
const TZ = "America/Sao_Paulo";

/**
 * Retorna:
 * - nowSP: "agora" no relógio de São Paulo (para lógica: weekday, diffDays etc)
 * - ranges em UTC (inicioHojeUTC/fimHojeUTC/inicioMesUTC/fimMesUTC) para consultar no banco
 */
function getSaoPauloRangeNow() {
  const now = new Date(); // instante real
  const nowSP = utcToZonedTime(now, TZ);

  const inicioHojeUTC = zonedTimeToUtc(startOfDay(nowSP), TZ);
  const fimHojeUTC = zonedTimeToUtc(endOfDay(nowSP), TZ);

  const inicioMesUTC = zonedTimeToUtc(startOfMonth(nowSP), TZ);
  const fimMesUTC = zonedTimeToUtc(endOfMonth(nowSP), TZ);

  return { now, nowSP, inicioHojeUTC, fimHojeUTC, inicioMesUTC, fimMesUTC };
}

const prisma = createPrismaInstance();

type Params = { supervisorId: string; inicio: Date; fim: Date };

export type CelulaStatus = "CRITICA" | "ATENCAO" | "OK";
export type CelulaOrder = "criticidade" | "dias" | "frequencia";

export type ListParams = {
  supervisorId: string;
  status?: CelulaStatus;
  q?: string;
  order?: CelulaOrder;
};

type DetailParams = { supervisorId: string; celulaId: string };

export class SupervisorDashboardRepository {
  async getDashboardBySupervisor(supervisorId: string) {
    const { nowSP, inicioHojeUTC, fimHojeUTC, inicioMesUTC, fimMesUTC } =
      getSaoPauloRangeNow();

    // "hoje" para lógica sempre em SP
    const hoje = nowSP;

    // ranges para o banco sempre em UTC
    const inicioHoje = inicioHojeUTC;
    const fimHoje = fimHojeUTC;

    const trintaDiasAtras = subDays(hoje, 30);
    const quatorzeDiasAtras = subDays(hoje, 14);

    const supervisao = await prisma.supervisao.findFirst({
      where: { userId: supervisorId },
      select: {
        id: true,
        nome: true,
        cor: true,
        celulas: {
          select: {
            id: true,
            nome: true,
            date_que_ocorre: true,
            lider: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image_url: true,
              },
            },
            membros: { select: { id: true } },
            reunioes_celula: {
              // ✅ usa fimHoje (UTC) para comparar corretamente
              where: { data_reuniao: { lte: fimHoje } },
              orderBy: { data_reuniao: "desc" },
              take: 1,
              select: {
                id: true,
                data_reuniao: true,
                visitantes: true,
                almas_ganhas: true,
                presencas_membros_reuniao_celula: { select: { status: true } },
              },
            },
          },
        },
      },
    });

    if (!supervisao) return null;

    const totalCelulas = supervisao.celulas.length;

    const lideres = supervisao.celulas
      .map((c) => c.lider?.id)
      .filter(Boolean) as string[];
    const totalLideres = new Set(lideres).size;

    // ================= Cultos de hoje (range UTC) =================
    const cultosHoje = await prisma.cultoIndividual.findMany({
      where: { data_inicio_culto: { gte: inicioHoje, lte: fimHoje } },
      orderBy: { data_inicio_culto: "asc" },
      select: { id: true },
    });

    const primeiroCultoHojeId = cultosHoje[0]?.id ?? null;

    const membrosIds = supervisao.celulas.flatMap((c) =>
      c.membros.map((m) => m.id),
    );

    /**
     * ✅ PENDÊNCIA CORRETA:
     * Para "pendência", NÃO filtre por status=true.
     * O que importa é: existe registro (true/false) para o membro no culto?
     */
    const presencasCultoHojeRegistradas =
      primeiroCultoHojeId && membrosIds.length
        ? await prisma.presencaCulto.findMany({
            where: {
              // se no seu schema for cultoIndividualId, mantenha.
              // se for via relação, troque por: presenca_culto: { is: { id: primeiroCultoHojeId } }
              cultoIndividualId: primeiroCultoHojeId,
              userId: { in: membrosIds },
            },
            select: { userId: true },
          })
        : [];

    const registradosCultoSet = new Set(
      presencasCultoHojeRegistradas
        .map((p) => p.userId)
        .filter(Boolean) as string[],
    );

    // ================= Discipulados 30d =================
    const discipuladosRecentes = lideres.length
      ? await prisma.discipulado.findMany({
          where: {
            data_ocorreu: { gte: trintaDiasAtras },
            discipulador_id: { in: lideres },
          },
          select: { usuario_id: true, discipulador_id: true },
        })
      : [];

    const discipuladosPorLider = new Map<string, Set<string>>();
    for (const d of discipuladosRecentes) {
      if (!discipuladosPorLider.has(d.discipulador_id)) {
        discipuladosPorLider.set(d.discipulador_id, new Set());
      }
      discipuladosPorLider.get(d.discipulador_id)!.add(d.usuario_id);
    }

    const acoesPendentes: any[] = [];
    let reunioesPendentesHoje = 0;
    let cultosPendentesHoje = 0;
    let membrosSemDiscipulado30dTotal = 0;
    let celulasCriticas = 0;

    // ✅ weekday baseado em SP
    const hojeWeekday = hoje.getDay(); // 0..6 (domingo..sábado)

    // ================= KPI: frequência do mês (range UTC) =================
    const inicioMes = inicioMesUTC;
    const fimMes = fimMesUTC;

    const totalCultosMes = await prisma.cultoIndividual.count({
      where: { data_inicio_culto: { gte: inicioMes, lte: fimMes } },
    });

    // frequência = status=true (aqui faz sentido)
    const presencasCultoMes =
      membrosIds.length && totalCultosMes > 0
        ? await prisma.presencaCulto.findMany({
            where: {
              status: true,
              userId: { in: membrosIds },
              presenca_culto: {
                data_inicio_culto: { gte: inicioMes, lte: fimMes },
              },
            },
            select: { userId: true },
          })
        : [];

    const presencasMesPorMembro = new Map<string, number>();
    for (const p of presencasCultoMes) {
      if (!p.userId) continue;
      presencasMesPorMembro.set(
        p.userId,
        (presencasMesPorMembro.get(p.userId) ?? 0) + 1,
      );
    }

    const celulasResumo = supervisao.celulas.map((c) => {
      const membrosTotal = c.membros.length;

      const diaCelula = c.date_que_ocorre ? Number(c.date_que_ocorre) : null;
      const ehDiaDeCelula = diaCelula === hojeWeekday;

      const ultima = c.reunioes_celula[0] ?? null;
      const ultimaData = ultima?.data_reuniao ?? null;

      const presentesUltima = ultima
        ? ultima.presencas_membros_reuniao_celula.filter((p) => p.status).length
        : 0;

      const presencaUltimaPct =
        ultima && membrosTotal > 0
          ? Math.round((presentesUltima / membrosTotal) * 100)
          : null;

      // ✅ range UTC para "reunião hoje"
      const precisaRegistrarReuniaoHoje =
        ehDiaDeCelula &&
        (!ultimaData || ultimaData < inicioHoje || ultimaData > fimHoje);

      if (precisaRegistrarReuniaoHoje) {
        reunioesPendentesHoje++;
        acoesPendentes.push({
          id: `acao-reuniao-hoje-${c.id}`,
          type: "CELULA_SEM_REUNIAO_HOJE",
          title: "Reunião pendente hoje",
          description: `A célula "${c.nome}" deveria registrar a reunião de hoje.`,
          meta: { celulaId: c.id },
        });
      }

      // ✅ pendência de culto = falta registro (true/false) para algum membro
      let precisaCultoHoje = false;
      if (primeiroCultoHojeId && membrosTotal > 0) {
        const registrados = c.membros.reduce((acc, m) => {
          if (registradosCultoSet.has(m.id)) acc++;
          return acc;
        }, 0);

        precisaCultoHoje = registrados !== membrosTotal;
      }

      if (cultosHoje.length && precisaCultoHoje) {
        cultosPendentesHoje++;
        acoesPendentes.push({
          id: `acao-culto-hoje-${c.id}`,
          type: "CELULA_CULTO_PENDENTE_HOJE",
          title: "Culto pendente hoje",
          description: `A célula "${c.nome}" ainda não completou o registro de presença do culto de hoje.`,
          meta: {
            celulaId: c.id,
            cultoId: primeiroCultoHojeId,
            totalCultosHoje: cultosHoje.length,
          },
        });
      }

      const semReuniao14d = !ultimaData || ultimaData < quatorzeDiasAtras;
      if (semReuniao14d) {
        acoesPendentes.push({
          id: `acao-sem-reuniao-14d-${c.id}`,
          type: "CELULA_SEM_REUNIAO_14D",
          title: "Célula sem reunião há muito tempo",
          description: `A célula "${c.nome}" está sem reunião registrada há 14+ dias.`,
          meta: {
            celulaId: c.id,
            ultimaReuniao: ultimaData?.toISOString() ?? null,
          },
        });
      }

      const liderId = c.lider?.id ?? null;
      const discipuladosSet = liderId
        ? (discipuladosPorLider.get(liderId) ?? new Set())
        : new Set<string>();

      const membrosSemDiscipulado30d = c.membros.filter(
        (m) => !discipuladosSet.has(m.id),
      ).length;

      membrosSemDiscipulado30dTotal += membrosSemDiscipulado30d;

      if (membrosSemDiscipulado30d > 0) {
        acoesPendentes.push({
          id: `acao-discipulado-${c.id}`,
          type: "CELULA_MEMBROS_SEM_DISCIPULADO",
          title: "Membros sem discipulado (30 dias)",
          description: `A célula "${c.nome}" tem ${membrosSemDiscipulado30d} membro(s) sem discipulado recente.`,
          meta: { celulaId: c.id, count: membrosSemDiscipulado30d, liderId },
        });
      }

      const pendenciasHoje =
        Number(precisaRegistrarReuniaoHoje) +
        Number(cultosHoje.length && precisaCultoHoje);

      const diasSemReuniao = ultimaData
        ? differenceInDays(hoje, ultimaData)
        : 999;

      let status: "CRITICA" | "ATENCAO" | "OK" = "OK";
      if (
        pendenciasHoje >= 1 ||
        diasSemReuniao >= 14 ||
        membrosSemDiscipulado30d >= 5
      )
        status = "CRITICA";
      else if (diasSemReuniao >= 7 || membrosSemDiscipulado30d >= 1)
        status = "ATENCAO";

      if (status === "CRITICA") celulasCriticas++;

      // ===== freqCultoMesPct (média da célula no mês) =====
      let freqCultoMesPct: number | null = null;

      if (totalCultosMes > 0 && membrosTotal > 0) {
        const somaPresencasCelula = c.membros.reduce((acc, m) => {
          return acc + (presencasMesPorMembro.get(m.id) ?? 0);
        }, 0);

        freqCultoMesPct = Math.round(
          (somaPresencasCelula / (membrosTotal * totalCultosMes)) * 100,
        );
      }

      return {
        id: c.id,
        nome: c.nome,
        lider: c.lider
          ? {
              id: c.lider.id,
              nome: `${c.lider.first_name} ${c.lider.last_name ?? ""}`.trim(),
              imageUrl: c.lider.image_url,
            }
          : null,
        diaSemanaCelula: diaCelula,
        ultimaReuniaoIso: ultimaData ? ultimaData.toISOString() : null,
        presencaUltimaReuniaoPct: presencaUltimaPct,
        visitantesUltima: ultima?.visitantes ?? 0,
        almasGanhasUltima: ultima?.almas_ganhas ?? 0,
        freqCultoMesPct,
        membrosTotal,
        membrosSemDiscipulado30d,
        pendenciasHoje,
        status,
      };
    });

    const scoreSaude = (() => {
      const base = 100;
      const p1 = celulasCriticas * 8;
      const p2 = reunioesPendentesHoje * 5;
      const p3 = cultosPendentesHoje * 3;
      const p4 = Math.min(20, Math.floor(membrosSemDiscipulado30dTotal / 10));
      return Math.max(0, base - p1 - p2 - p3 - p4);
    })();

    const orderRank = { CRITICA: 0, ATENCAO: 1, OK: 2 } as const;
    celulasResumo.sort((a, b) => orderRank[a.status] - orderRank[b.status]);

    return {
      supervisao: {
        id: supervisao.id,
        nome: supervisao.nome,
        cor: supervisao.cor,
      },
      cards: {
        totalCelulas,
        totalLideres,
        reunioesPendentesHoje,
        cultosPendentesHoje,
        membrosSemDiscipulado30d: membrosSemDiscipulado30dTotal,
        celulasCriticas,
        scoreSaude,
      },
      acoesPendentes,
      celulasResumo,
    };
  }

  async getFrequenciaCultosMesPorSupervisao(params: Params) {
    const { supervisorId } = params;

    // ✅ normaliza início/fim para o mês no fuso SP (igual padrão do dashboard)
    const { inicioMesUTC, fimMesUTC, nowSP } = getSaoPauloRangeNow();
    const inicio = inicioMesUTC;
    const fim = fimMesUTC;

    const supervisao = await prisma.supervisao.findFirst({
      where: { userId: supervisorId },
      select: {
        id: true,
        nome: true,
        celulas: {
          select: { id: true, nome: true, membros: { select: { id: true } } },
        },
      },
    });

    const mesRef = `${nowSP.getFullYear()}-${String(
      nowSP.getMonth() + 1,
    ).padStart(2, "0")}`;

    if (!supervisao) {
      return { mesRef, supervisao: null, totalCultosMes: 0, celulas: [] };
    }

    const totalCultosMes = await prisma.cultoIndividual.count({
      where: {
        data_inicio_culto: { gte: inicio, lte: fim },
      },
    });

    const membrosIds = supervisao.celulas.flatMap((c) =>
      c.membros.map((m) => m.id),
    );

    const presencasMes = membrosIds.length
      ? await prisma.presencaCulto.findMany({
          where: {
            status: true,
            userId: { in: membrosIds },
            presenca_culto: {
              data_inicio_culto: { gte: inicio, lte: fim },
            },
          },
          select: { userId: true },
        })
      : [];

    const countPorMembro = new Map<string, number>();
    for (const p of presencasMes) {
      if (!p.userId) continue;
      countPorMembro.set(p.userId, (countPorMembro.get(p.userId) ?? 0) + 1);
    }

    const celulas = supervisao.celulas.map((c) => {
      const membros = c.membros;
      if (!membros.length || totalCultosMes === 0) {
        return {
          id: c.id,
          nome: c.nome,
          membros: membros.length,
          percentualMedio: 0,
        };
      }

      const somaPct = membros.reduce((acc, m) => {
        const pres = countPorMembro.get(m.id) ?? 0;
        return acc + Math.round((pres / totalCultosMes) * 100);
      }, 0);

      return {
        id: c.id,
        nome: c.nome,
        membros: membros.length,
        percentualMedio: Math.round(somaPct / membros.length),
      };
    });

    celulas.sort((a, b) => a.percentualMedio - b.percentualMedio);

    return {
      mesRef,
      supervisao: { id: supervisao.id, nome: supervisao.nome },
      totalCultosMes,
      celulas,
    };
  }

  async listCelulasBySupervisor(params: ListParams) {
    const { supervisorId, status, q, order = "criticidade" } = params;

    const supervisao = await prisma.supervisao.findFirst({
      where: { userId: supervisorId },
      select: {
        id: true,
        nome: true,
        cor: true,
        celulas: {
          select: {
            id: true,
            nome: true,
            date_que_ocorre: true,
            lider: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                image_url: true,
              },
            },
            membros: { select: { id: true } },
            reunioes_celula: {
              orderBy: { data_reuniao: "desc" },
              take: 1,
              select: { data_reuniao: true },
            },
          },
        },
      },
    });

    if (!supervisao) {
      return {
        supervisao: null,
        cards: {
          totalCelulas: 0,
          celulasCriticas: 0,
          semReuniao7d: 0,
          pendenciasHoje: 0,
        },
        celulas: [],
      };
    }

    const { nowSP } = getSaoPauloRangeNow();
    const hoje = nowSP;

    const celulasDTO = supervisao.celulas.map((c) => {
      const ultima = c.reunioes_celula[0]?.data_reuniao ?? null;
      const diasSemReuniao = ultima ? differenceInDays(hoje, ultima) : 999;

      let st: CelulaStatus = "OK";
      if (diasSemReuniao >= 14) st = "CRITICA";
      else if (diasSemReuniao >= 7) st = "ATENCAO";

      return {
        id: c.id,
        nome: c.nome,
        lider: c.lider
          ? {
              id: c.lider.id,
              nome: `${c.lider.first_name} ${c.lider.last_name ?? ""}`.trim(),
              imageUrl: c.lider.image_url,
            }
          : null,
        membrosTotal: c.membros.length,
        ultimaReuniaoIso: ultima ? ultima.toISOString() : null,
        diasSemReuniao,
        status: st,
        pendenciasHoje: 0,
        freqCultoMesPct: null as number | null,
      };
    });

    let filtered = celulasDTO;

    if (status) filtered = filtered.filter((c) => c.status === status);

    if (q) {
      const needle = q.toLowerCase();
      filtered = filtered.filter((c) => {
        const lider = c.lider?.nome?.toLowerCase() ?? "";
        return c.nome.toLowerCase().includes(needle) || lider.includes(needle);
      });
    }

    const rank = { CRITICA: 0, ATENCAO: 1, OK: 2 } as const;

    filtered.sort((a, b) => {
      if (order === "dias") return b.diasSemReuniao - a.diasSemReuniao;

      if (order === "frequencia") {
        const av = a.freqCultoMesPct ?? 999;
        const bv = b.freqCultoMesPct ?? 999;
        return av - bv;
      }

      const byStatus = rank[a.status] - rank[b.status];
      if (byStatus !== 0) return byStatus;

      return b.diasSemReuniao - a.diasSemReuniao;
    });

    const totalCelulas = supervisao.celulas.length;
    const celulasCriticas = celulasDTO.filter(
      (c) => c.status === "CRITICA",
    ).length;
    const semReuniao7d = celulasDTO.filter((c) => c.diasSemReuniao >= 7).length;
    const pendenciasHoje = celulasDTO.reduce(
      (acc, c) => acc + (c.pendenciasHoje ?? 0),
      0,
    );

    return {
      supervisao: {
        id: supervisao.id,
        nome: supervisao.nome,
        cor: supervisao.cor,
      },
      cards: { totalCelulas, celulasCriticas, semReuniao7d, pendenciasHoje },
      celulas: filtered,
    };
  }

  async getCelulaDetailBySupervisor(params: DetailParams) {
    const { supervisorId, celulaId } = params;

    const supervisao = await prisma.supervisao.findFirst({
      where: { userId: supervisorId, celulas: { some: { id: celulaId } } },
      select: { id: true, nome: true, cor: true },
    });
    if (!supervisao) return null;

    const { nowSP, inicioHojeUTC, fimHojeUTC, inicioMesUTC, fimMesUTC } =
      getSaoPauloRangeNow();

    const hoje = nowSP;
    const inicioHoje = inicioHojeUTC;
    const fimHoje = fimHojeUTC;

    const trintaDiasAtras = subDays(hoje, 30);

    const inicioMes = inicioMesUTC;
    const fimMes = fimMesUTC;

    const celula = await prisma.celula.findUnique({
      where: { id: celulaId },
      select: {
        id: true,
        nome: true,
        date_que_ocorre: true,
        lider: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image_url: true,
          },
        },
        membros: {
          select: { id: true, first_name: true, last_name: true },
          orderBy: [{ first_name: "asc" }],
        },
        reunioes_celula: {
          orderBy: { data_reuniao: "desc" },
          take: 6,
          select: {
            id: true,
            data_reuniao: true,
            visitantes: true,
            almas_ganhas: true,
            presencas_membros_reuniao_celula: { select: { status: true } },
          },
        },
      },
    });

    if (!celula) return null;

    const membrosTotal = celula.membros.length;

    const ultimaReuniao = celula.reunioes_celula[0]?.data_reuniao ?? null;
    const diasSemReuniao = ultimaReuniao
      ? differenceInDays(hoje, ultimaReuniao)
      : 999;

    const reuniaoHoje = await prisma.reuniaoCelula.findFirst({
      where: { celulaId, data_reuniao: { gte: inicioHoje, lte: fimHoje } },
      select: { id: true },
    });

    const cultosHoje = await prisma.cultoIndividual.findMany({
      where: { data_inicio_culto: { gte: inicioHoje, lte: fimHoje } },
      orderBy: { data_inicio_culto: "asc" },
      select: { id: true },
    });

    const primeiroCultoHojeId = cultosHoje[0]?.id ?? null;

    // ✅ pendência = falta registro (true/false), não falta status=true
    let precisaCultoHoje = false;
    if (primeiroCultoHojeId && membrosTotal > 0) {
      const presencasCultoHoje = await prisma.presencaCulto.findMany({
        where: {
          cultoIndividualId: primeiroCultoHojeId,
          userId: { in: celula.membros.map((m) => m.id) },
        },
        select: { userId: true },
      });

      const registrados = new Set(
        presencasCultoHoje.map((p) => p.userId).filter(Boolean) as string[],
      );

      precisaCultoHoje = registrados.size !== membrosTotal;
    }

    const liderId = celula.lider?.id ?? null;
    const discipuladosRecentes = liderId
      ? await prisma.discipulado.findMany({
          where: {
            discipulador_id: liderId,
            data_ocorreu: { gte: trintaDiasAtras },
          },
          select: { usuario_id: true },
        })
      : [];

    const discipuladosSet = new Set(
      discipuladosRecentes.map((d) => d.usuario_id),
    );
    const membrosSemDiscipulado = celula.membros.filter(
      (m) => !discipuladosSet.has(m.id),
    );
    const semDiscipulado = membrosSemDiscipulado.length;
    const semDiscipuladoPct = membrosTotal
      ? Math.round((semDiscipulado / membrosTotal) * 100)
      : 0;

    const totalCultosMes = await prisma.cultoIndividual.count({
      where: { data_inicio_culto: { gte: inicioMes, lte: fimMes } },
    });

    let cultoMesPresencaMediaPct = 0;
    let membrosBaixaFrequencia: Array<{
      id: string;
      nome: string;
      presencas: number;
      pct: number;
    }> = [];

    if (totalCultosMes > 0 && membrosTotal > 0) {
      const presencasMes = await prisma.presencaCulto.findMany({
        where: {
          status: true,
          userId: { in: celula.membros.map((m) => m.id) },
          presenca_culto: {
            data_inicio_culto: { gte: inicioMes, lte: fimMes },
          },
        },
        select: { userId: true },
      });

      const countPorMembro = new Map<string, number>();
      for (const p of presencasMes) {
        if (!p.userId) continue;
        countPorMembro.set(p.userId, (countPorMembro.get(p.userId) ?? 0) + 1);
      }

      const pctList = celula.membros.map((m) => {
        const pres = countPorMembro.get(m.id) ?? 0;
        const pct = Math.round((pres / totalCultosMes) * 100);
        return {
          id: m.id,
          nome: `${m.first_name} ${m.last_name ?? ""}`.trim(),
          presencas: pres,
          pct,
        };
      });

      cultoMesPresencaMediaPct = Math.round(
        pctList.reduce((acc, x) => acc + x.pct, 0) / pctList.length,
      );

      membrosBaixaFrequencia = pctList
        .slice()
        .sort((a, b) => a.pct - b.pct)
        .slice(0, 6);
    }

    // ✅ weekday SP
    const hojeWeekday = hoje.getDay();
    const diaCelula = celula.date_que_ocorre
      ? Number(celula.date_que_ocorre)
      : null;
    const ehDiaDeCelula = diaCelula !== null && diaCelula === hojeWeekday;

    const precisaReuniaoHoje = ehDiaDeCelula && !reuniaoHoje;

    const motivos: string[] = [];
    if (precisaReuniaoHoje) motivos.push("Reunião pendente hoje");
    if (precisaCultoHoje) motivos.push("Culto de hoje incompleto");
    if (diasSemReuniao >= 14) motivos.push("14+ dias sem reunião registrada");
    else if (diasSemReuniao >= 7)
      motivos.push("7+ dias sem reunião registrada");
    if (semDiscipulado >= 5)
      motivos.push("Muitos membros sem discipulado (30d)");
    else if (semDiscipulado >= 1) motivos.push("Membros sem discipulado (30d)");

    let status: "CRITICA" | "ATENCAO" | "OK" = "OK";
    if (
      precisaReuniaoHoje ||
      precisaCultoHoje ||
      diasSemReuniao >= 14 ||
      semDiscipulado >= 5
    ) {
      status = "CRITICA";
    } else if (diasSemReuniao >= 7 || semDiscipulado >= 1) {
      status = "ATENCAO";
    }

    const ultimasReunioes = celula.reunioes_celula.map((r) => {
      const presentes = r.presencas_membros_reuniao_celula.filter(
        (p) => p.status,
      ).length;
      const total = membrosTotal || 0;
      const pct = total ? Math.round((presentes / total) * 100) : 0;
      return {
        id: r.id,
        data: r.data_reuniao ? r.data_reuniao.toISOString() : null,
        presentes,
        totalMembros: total,
        percentual: pct,
        visitantes: r.visitantes ?? 0,
        almasGanhas: r.almas_ganhas ?? 0,
      };
    });

    return {
      supervisao,
      celula: {
        id: celula.id,
        nome: celula.nome,
        diaSemanaCelula: diaCelula,
        lider: celula.lider
          ? {
              id: celula.lider.id,
              nome: `${celula.lider.first_name} ${
                celula.lider.last_name ?? ""
              }`.trim(),
              imageUrl: celula.lider.image_url,
            }
          : null,

        status,
        motivos,
        diasSemReuniao,
        ultimaReuniaoIso: ultimaReuniao ? ultimaReuniao.toISOString() : null,

        pendenciasHoje: {
          precisaReuniaoHoje,
          precisaCultoHoje,
          cultoHoje: {
            cultoId: primeiroCultoHojeId,
            totalCultosHoje: cultosHoje.length,
          },
        },

        cultoMes: {
          mesRef: `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(
            2,
            "0",
          )}`,
          totalCultosMes,
          presencaMediaPct: cultoMesPresencaMediaPct,
          membrosBaixaFrequencia,
        },

        discipulado30d: {
          totalMembros: membrosTotal,
          semDiscipulado,
          semDiscipuladoPct,
          membrosSemDiscipulado: membrosSemDiscipulado.map((m) => ({
            id: m.id,
            nome: `${m.first_name} ${m.last_name ?? ""}`.trim(),
          })),
        },

        ultimasReunioes,
      },
    };
  }
}
