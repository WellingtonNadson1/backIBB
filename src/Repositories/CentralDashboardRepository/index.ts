import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CentralDashboardRepository {
  async getCentralDashboard(params: {
    from: Date;
    to: Date;
    cultoSemanalId?: string;
    supervisaoId?: string;
    staleDays?: number; // ex 21
  }) {
    const { from, to, cultoSemanalId, supervisaoId, staleDays = 21 } = params;

    // filtros reutilizáveis
    const userWhere: any = supervisaoId ? { supervisaoId } : {};
    const cellWhere: any = supervisaoId ? { supervisaoId } : {};
    const cultoIndWhere: any = {
      data_inicio_culto: { gte: from, lte: to },
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
      prisma.user.count({ where: userWhere }),

      prisma.user.count({
        where: { ...userWhere, date_create: { gte: from, lte: to } },
      }),

      prisma.celula.count({ where: cellWhere }),

      prisma.celula.count({
        where: { ...cellWhere, OR: [{ userId: null }, { userId: "" }] },
      }),

      prisma.reuniaoCelula.count({
        where: {
          data_reuniao: { gte: from, lte: to },
          ...(supervisaoId ? { celula: { supervisaoId } } : {}),
        },
      }),

      prisma.reuniaoCelula.aggregate({
        where: {
          data_reuniao: { gte: from, lte: to },
          ...(supervisaoId ? { celula: { supervisaoId } } : {}),
        },
        _sum: { visitantes: true, almas_ganhas: true },
      }),

      prisma.cultoIndividual.findMany({
        where: cultoIndWhere,
        select: { id: true },
      }),

      prisma.presencaCulto.count({
        where: {
          ...(supervisaoId ? { membro: { supervisaoId } } : {}),
          presenca_culto: cultoIndWhere,
          status: true,
        },
      }),

      // células “stale”: sem reunião nos últimos X dias (pega última reunião)
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

    const cultosIds = cultosInRange.map((c) => c.id);
    const totalPresencasPossiveis = cultosIds.length * membersTotal;

    const worshipAttendancePct =
      totalPresencasPossiveis > 0
        ? (presencasCultoInRange / totalPresencasPossiveis) * 100
        : 0;

    // stale cells
    const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);
    const staleCells = staleCellsRaw
      .filter(
        (c) =>
          !c.reunioes_celula[0]?.data_reuniao ||
          c.reunioes_celula[0].data_reuniao < cutoff
      )
      .map((c) => ({
        id: c.id,
        name: c.nome,
        supervisaoName: c.supervisao.nome,
        lastMeetingAt:
          c.reunioes_celula[0]?.data_reuniao?.toISOString() ?? null,
      }));

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
    };
  }
}
