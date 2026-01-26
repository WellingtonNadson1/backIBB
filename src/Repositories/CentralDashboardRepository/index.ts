import { Prisma, Role } from "@prisma/client";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

// ===== Utils (UTC) =====
type ChartCultoPoint = {
  name: string; // "03/01"
  value: number; // ✅ % (compatível com seu LineChartCard atual)
  valuePct: number; // % explícito
  presencasTrue: number;
  cultosNoDia: number;
  membersTotal: number;
  denom: number; // membersTotal * cultosNoDia
};

function startOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function formatBucketUTC(d: Date) {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

/** Cria buckets diários [from, toExclusive) */
function buildDailyBuckets(from: Date, toExclusive: Date) {
  if (!from || !toExclusive) {
    throw new Error("buildDailyBuckets: from/toExclusive is required");
  }
  const start = startOfDayUTC(from);
  const endExclusive = startOfDayUTC(toExclusive);

  const buckets: Array<{ key: string; dayUTC: Date }> = [];
  for (let cur = start; cur < endExclusive; cur = addDaysUTC(cur, 1)) {
    buckets.push({ key: formatBucketUTC(cur), dayUTC: cur });
  }
  return buckets;
}

/**
 * Defina quem entra no denominador de “membros elegíveis”.
 * Exclui ADMIN, OUTRAIGREJA, AFASTADO.
 */
const ELIGIBLE_MEMBER_ROLES: Role[] = [
  Role.MEMBER,
  Role.USERLIDER,
  Role.USERSUPERVISOR,
  Role.USERPASTOR,
  Role.USERCENTRAL,
];

// Constrói: ARRAY['MEMBER'::"Role",'USERLIDER'::"Role", ...]
const ELIGIBLE_ROLES_SQL = Prisma.sql`ARRAY[${Prisma.join(
  ELIGIBLE_MEMBER_ROLES.map((r) => Prisma.sql`${r}::"Role"`),
  ", ",
)}]`;

export class CentralDashboardRepository {
  async getCentralDashboard(params: {
    from: Date;
    toExclusive: Date;
    cultoSemanalId?: string;
    supervisaoId?: string;
    staleDays?: number;
    rankingLimit?: number;
  }) {
    const {
      from,
      toExclusive,
      cultoSemanalId,
      supervisaoId,
      staleDays = 21,
      rankingLimit = 8,
    } = params;

    if (!from || !toExclusive) throw new Error("from/toExclusive are required");

    const memberWhere: Prisma.UserWhereInput = {
      role: { in: ELIGIBLE_MEMBER_ROLES },
      ...(supervisaoId ? { supervisaoId } : {}),
    };

    const cellWhere: Prisma.CelulaWhereInput = supervisaoId
      ? { supervisaoId }
      : {};

    const cultoIndWhere: Prisma.CultoIndividualWhereInput = {
      data_inicio_culto: { gte: from, lt: toExclusive },
      ...(cultoSemanalId ? { cultoSemanalId } : {}),
    };

    const [
      membersTotal,
      membersNewInRange,
      cellsTotal,
      cellsWithoutLeader,
      meetingsInRange,
      meetingAgg,
      cultosInRange,
      presencasCultoInRange,
      staleCellsRaw,
    ] = await prisma.$transaction([
      prisma.user.count({ where: memberWhere }),

      prisma.user.count({
        where: { ...memberWhere, date_create: { gte: from, lt: toExclusive } },
      }),

      prisma.celula.count({ where: cellWhere }),

      prisma.celula.count({
        where: { ...cellWhere, OR: [{ userId: null }, { userId: "" }] },
      }),

      prisma.reuniaoCelula.count({
        where: {
          data_reuniao: { gte: from, lt: toExclusive },
          ...(supervisaoId ? { celula: { supervisaoId } } : {}),
        },
      }),

      prisma.reuniaoCelula.aggregate({
        where: {
          data_reuniao: { gte: from, lt: toExclusive },
          ...(supervisaoId ? { celula: { supervisaoId } } : {}),
        },
        _sum: { visitantes: true, almas_ganhas: true },
      }),

      prisma.cultoIndividual.findMany({
        where: cultoIndWhere,
        select: { id: true, data_inicio_culto: true },
      }),

      // ✅ total presenças TRUE no período (por culto; então 2 cultos no dia conta 2)
      prisma.presencaCulto.count({
        where: {
          status: true,
          presenca_culto: cultoIndWhere,
          membro: {
            ...(supervisaoId ? { supervisaoId } : {}),
            role: { in: ELIGIBLE_MEMBER_ROLES },
          },
        },
      }),

      prisma.celula.findMany({
        where: cellWhere,
        select: {
          id: true,
          nome: true,
          supervisao: { select: { nome: true } },
          reunioes_celula: {
            orderBy: { data_reuniao: "desc" },
            take: 1,
            select: { data_reuniao: true },
          },
        },
      }),
    ]);

    const totalCultosPeriodo = cultosInRange.length;
    const totalPresencasPossiveis = totalCultosPeriodo * membersTotal;

    const worshipAttendancePct =
      totalPresencasPossiveis > 0
        ? Math.round((presencasCultoInRange / totalPresencasPossiveis) * 100)
        : 0;

    // ===== stale cells =====
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    const staleCells = staleCellsRaw
      .filter(
        (c) =>
          !c.reunioes_celula[0]?.data_reuniao ||
          c.reunioes_celula[0].data_reuniao < cutoff,
      )
      .map((c) => ({
        id: c.id,
        name: c.nome,
        supervisaoName: c.supervisao.nome,
        lastMeetingAt:
          c.reunioes_celula[0]?.data_reuniao?.toISOString() ?? null,
      }));

    // ===== CHARTS =====
    const buckets = buildDailyBuckets(from, toExclusive);

    let chartCulto: ChartCultoPoint[] = [];

    if (membersTotal > 0) {
      const presConditions: Prisma.Sql[] = [
        Prisma.sql`pc.status = true`,
        Prisma.sql`ci.data_inicio_culto >= ${from}`,
        Prisma.sql`ci.data_inicio_culto < ${toExclusive}`,
        Prisma.sql`u.role = ANY(${ELIGIBLE_ROLES_SQL}::"Role"[])`,
      ];

      if (cultoSemanalId) {
        presConditions.push(
          Prisma.sql`ci."cultoSemanalId" = ${cultoSemanalId}`,
        );
      }
      if (supervisaoId) {
        presConditions.push(Prisma.sql`u."supervisaoId" = ${supervisaoId}`);
      }

      // ✅ AGRUPA PELO DIA UTC (alinha com seus buckets UTC)
      const presByDay = await prisma.$queryRaw<
        Array<{ day_utc: Date; count: bigint }>
      >(Prisma.sql`
        SELECT
          date_trunc('day', (ci.data_inicio_culto AT TIME ZONE 'UTC')) AS day_utc,
          COUNT(*)::bigint AS count
        FROM "PresencaCulto" pc
        JOIN "culto_individual" ci ON ci.id = pc."cultoIndividualId"
        JOIN "user" u ON u.id = pc."userId"
        WHERE ${Prisma.join(presConditions, " AND ")}
        GROUP BY 1
        ORDER BY 1;
      `);

      const cultoConditions: Prisma.Sql[] = [
        Prisma.sql`data_inicio_culto >= ${from}`,
        Prisma.sql`data_inicio_culto < ${toExclusive}`,
      ];

      if (cultoSemanalId) {
        cultoConditions.push(Prisma.sql`"cultoSemanalId" = ${cultoSemanalId}`);
      }

      // ✅ AGRUPA PELO DIA UTC
      const cultosByDay = await prisma.$queryRaw<
        Array<{ day_utc: Date; count: bigint }>
      >(Prisma.sql`
        SELECT
          date_trunc('day', (data_inicio_culto AT TIME ZONE 'UTC')) AS day_utc,
          COUNT(*)::bigint AS count
        FROM "culto_individual"
        WHERE ${Prisma.join(cultoConditions, " AND ")}
        GROUP BY 1
        ORDER BY 1;
      `);

      const presMap = new Map<string, number>();
      for (const row of presByDay) {
        if (!row?.day_utc) continue;
        const k = formatBucketUTC(new Date(row.day_utc));
        presMap.set(k, Number(row.count));
      }

      const cultosMap = new Map<string, number>();
      for (const row of cultosByDay) {
        if (!row?.day_utc) continue;
        const k = formatBucketUTC(new Date(row.day_utc));
        cultosMap.set(k, Number(row.count));
      }

      chartCulto = buckets.map((b) => {
        const pres = presMap.get(b.key) ?? 0;
        const cultosDia = cultosMap.get(b.key) ?? 0;
        const denom = membersTotal * cultosDia;
        const pct = denom > 0 ? Math.round((pres / denom) * 100) : 0;

        return {
          name: b.key,
          value: pct, // ✅ continua % pro front atual
          valuePct: pct,
          presencasTrue: pres,
          cultosNoDia: cultosDia,
          membersTotal,
          denom,
        };
      });
    } else {
      chartCulto = buckets.map((b) => ({
        name: b.key,
        value: 0,
        valuePct: 0,
        presencasTrue: 0,
        cultosNoDia: 0,
        membersTotal: 0,
        denom: 0,
      }));
    }

    // Reuniões/visitantes/almas por dia
    const reunioes = await prisma.reuniaoCelula.findMany({
      where: {
        data_reuniao: { gte: from, lt: toExclusive },
        ...(supervisaoId ? { celula: { supervisaoId } } : {}),
      },
      select: { data_reuniao: true, visitantes: true, almas_ganhas: true },
    });

    const meetingsByDay = new Map<string, number>();
    const visitantesByDay = new Map<string, number>();
    const almasByDay = new Map<string, number>();

    for (const r of reunioes) {
      if (!r.data_reuniao) continue;
      const key = formatBucketUTC(r.data_reuniao);

      meetingsByDay.set(key, (meetingsByDay.get(key) ?? 0) + 1);
      visitantesByDay.set(
        key,
        (visitantesByDay.get(key) ?? 0) + Number(r.visitantes ?? 0),
      );
      almasByDay.set(
        key,
        (almasByDay.get(key) ?? 0) + Number(r.almas_ganhas ?? 0),
      );
    }

    const chartCelula = buckets.map((b) => ({
      name: b.key,
      value: meetingsByDay.get(b.key) ?? 0,
    }));
    const chartVisitantes = buckets.map((b) => ({
      name: b.key,
      value: visitantesByDay.get(b.key) ?? 0,
    }));
    const chartConversoes = buckets.map((b) => ({
      name: b.key,
      value: almasByDay.get(b.key) ?? 0,
    }));

    const supervisionRanking = await this.getSupervisionRankingByPeriod({
      from,
      toExclusive,
      cultoSemanalId,
      supervisaoId,
      limit: rankingLimit,
    });

    return {
      kpis: {
        membersTotal,
        membersNewInRange,
        cellsTotal,
        cellsWithoutLeader,
        meetingsCount: meetingsInRange,
        visitorsTotal: Number(meetingAgg._sum.visitantes ?? 0),
        soulsTotal: Number(meetingAgg._sum.almas_ganhas ?? 0),
        worshipAttendancePct,
        cellsWithoutMeetingSinceDays: staleCells.length,
      },
      alerts: {
        cellsStale: staleCells.slice(0, 12),
      },
      supervisionRanking,
      charts: {
        culto: chartCulto, // ✅ agora vem com extras
        celula: chartCelula,
        visitantes: chartVisitantes,
        conversoes: chartConversoes,
      },
    };
  }

  async getSupervisionRankingByPeriod(params: {
    from: Date;
    toExclusive: Date;
    cultoSemanalId?: string;
    supervisaoId?: string;
    limit?: number;
  }) {
    const {
      from,
      toExclusive,
      cultoSemanalId,
      supervisaoId,
      limit = 8,
    } = params;

    const cultosCount = await prisma.cultoIndividual.count({
      where: {
        data_inicio_culto: { gte: from, lt: toExclusive },
        ...(cultoSemanalId ? { cultoSemanalId } : {}),
      },
    });

    const supervisoes = await prisma.supervisao.findMany({
      where: supervisaoId ? { id: supervisaoId } : undefined,
      select: {
        id: true,
        nome: true,
        membros: {
          where: { role: { in: ELIGIBLE_MEMBER_ROLES } },
          select: { id: true },
        },
      },
    });

    const membersBySup = new Map<string, number>();
    for (const s of supervisoes) membersBySup.set(s.id, s.membros.length);

    if (cultosCount === 0) {
      return supervisoes
        .map((s) => ({
          id: s.id,
          nome: s.nome,
          valuePct: 0,
          membersTotal: membersBySup.get(s.id) ?? 0,
        }))
        .sort((a, b) => b.membersTotal - a.membersTotal)
        .slice(0, limit);
    }

    const conditions: Prisma.Sql[] = [
      Prisma.sql`pc.status = true`,
      Prisma.sql`ci.data_inicio_culto >= ${from}`,
      Prisma.sql`ci.data_inicio_culto < ${toExclusive}`,
      Prisma.sql`u.role = ANY(${ELIGIBLE_ROLES_SQL}::"Role"[])`,
    ];
    if (cultoSemanalId)
      conditions.push(Prisma.sql`ci."cultoSemanalId" = ${cultoSemanalId}`);
    if (supervisaoId)
      conditions.push(Prisma.sql`u."supervisaoId" = ${supervisaoId}`);

    const presBySup = await prisma.$queryRaw<
      Array<{ supervisaoId: string; count: bigint }>
    >(Prisma.sql`
      SELECT u."supervisaoId" as "supervisaoId",
             COUNT(*)::bigint as count
      FROM "PresencaCulto" pc
      JOIN "culto_individual" ci ON ci.id = pc."cultoIndividualId"
      JOIN "user" u ON u.id = pc."userId"
      WHERE ${Prisma.join(conditions, " AND ")}
      GROUP BY u."supervisaoId";
    `);

    const presMap = new Map<string, number>();
    for (const r of presBySup) {
      if (!r?.supervisaoId) continue;
      presMap.set(r.supervisaoId, Number(r.count));
    }

    const ranking = supervisoes.map((s) => {
      const membersTotal = membersBySup.get(s.id) ?? 0;
      const presTrue = presMap.get(s.id) ?? 0;

      const denom = membersTotal * cultosCount;
      const valuePct = denom > 0 ? Math.round((presTrue / denom) * 100) : 0;

      return { id: s.id, nome: s.nome, valuePct, membersTotal };
    });

    ranking.sort((a, b) => b.valuePct - a.valuePct);
    return ranking.slice(0, limit);
  }
}
