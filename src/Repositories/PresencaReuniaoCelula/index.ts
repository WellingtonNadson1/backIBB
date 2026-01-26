import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { z } from "zod";
import { PresencaReuniaoCelulaData } from "../../Controllers/PresencaReuniaoCelula";
import { createPrismaInstance } from "../../services/prisma";
import { UpsertPresencaReuniaoCelulaInput } from "./schemas";

dayjs.extend(utc);
dayjs.extend(timezone);

const PresencaNewReuniaoCelulaSchema = z.object({
  which_reuniao_celula: z.string(),
  membro: z.array(
    z.object({
      id: z.string(),
      status: z.boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
    }),
  ),
});

export type PresencaNewReuniaoCelula = z.infer<
  typeof PresencaNewReuniaoCelulaSchema
>;

const prisma = createPrismaInstance();

class PresencaReuniaoCelulaRepositorie {
  async getCellMetrics() {
    const totalCelulasAtivas = await prisma.celula.count();

    const presencas = await prisma.presencaReuniaoCelula.findMany({
      select: { status: true, reuniaoCelulaId: true },
    });

    const totalPresencas = presencas.length;
    const presencasConfirmadas = presencas.filter((p) => p.status).length;
    const mediaPresenca = totalPresencas
      ? (presencasConfirmadas / totalPresencas) * 100
      : 0;

    const reunioes = await prisma.reuniaoCelula.findMany({
      select: { visitantes: true },
    });

    const totalReunioes = reunioes.length;
    const totalVisitantes = reunioes.reduce(
      (sum, r) => sum + (r.visitantes ?? 0),
      0,
    );
    const mediaVisitantes = totalReunioes ? totalVisitantes / totalReunioes : 0;
    console.log("totalCelulasAtivas: ", totalCelulasAtivas);

    return {
      totalCelulasAtivas,
      totalVisitantes,
      mediaPresenca: Number(mediaPresenca.toFixed(2)),
      mediaVisitantes: Number(mediaVisitantes.toFixed(2)),
    };
  }

  async findAll() {
    const result = await prisma?.presencaReuniaoCelula.findMany({
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        which_reuniao_celula: true,
      },
    });

    return result;
  }

  async findPresenceRegistered(id: string) {
    const result = await prisma?.presencaReuniaoCelula.findFirst({
      where: {
        which_reuniao_celula: { id: id },
      },
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        which_reuniao_celula: true,
      },
    });

    return result;
  }

  async existsByReuniaoId(reuniaoId: string) {
    const count = await prisma.presencaReuniaoCelula.count({
      where: { reuniaoCelulaId: reuniaoId },
    });

    return count > 0;
  }

  async findFirst({
    which_reuniao_celula,
    membro,
  }: {
    which_reuniao_celula: string;
    membro: string;
  }) {
    const result = await prisma?.presencaReuniaoCelula.findFirst({
      where: {
        which_reuniao_celula: { id: which_reuniao_celula },
        membro: { id: membro },
      },
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        which_reuniao_celula: true,
      },
    });

    return result;
  }

  async findById(id: string) {
    const result = await prisma?.presencaReuniaoCelula.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        which_reuniao_celula: true,
      },
    });

    return result;
  }

  async createPresencaReuniaCelula(
    presencaCultoDataForm: PresencaReuniaoCelulaData,
  ) {
    const { membro, which_reuniao_celula, status } = presencaCultoDataForm;
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;
    const result = await prisma?.presencaReuniaoCelula.create({
      data: {
        membro: {
          connect: {
            id: membro,
          },
        },
        which_reuniao_celula: {
          connect: {
            id: which_reuniao_celula,
          },
        },
        status: status,
        date_create: dataBrasilDate,
        date_update: date_update,
      },
    });

    return result;
  }

  async createManyIdempotent(data: PresencaNewReuniaoCelula) {
    const { which_reuniao_celula, membro } = data;

    const userIds = membro.map((m) => m.id);

    // 1) quais já existem?
    const existing = await prisma.presencaReuniaoCelula.findMany({
      where: {
        reuniaoCelulaId: which_reuniao_celula,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    const existingSet = new Set(existing.map((e) => e.userId));

    // 2) filtra só os que faltam
    const toCreate = membro
      .filter((m) => !existingSet.has(m.id))
      .map((m) => ({
        reuniaoCelulaId: which_reuniao_celula,
        userId: m.id,
        status: Boolean(m.status),
        // se seus campos date_create/date_update são @default(now()),
        // você nem precisa mandar. Se quiser mandar, use new Date()
      }));

    // 3) cria em lote (não explode se duplicar por corrida)
    // (skipDuplicates depende do Prisma/DB — em Postgres funciona bem)
    if (toCreate.length > 0) {
      await prisma.presencaReuniaoCelula.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    return {
      total: membro.length,
      created: toCreate.length,
      skipped: membro.length - toCreate.length,
    };
  }

  async upsertManyIdempotent(data: UpsertPresencaReuniaoCelulaInput) {
    const { which_reuniao_celula, membro } = data;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      for (const m of membro) {
        await tx.presencaReuniaoCelula.upsert({
          where: {
            reuniaoCelulaId_userId: {
              reuniaoCelulaId: which_reuniao_celula,
              userId: m.id,
            },
          },
          create: {
            reuniaoCelulaId: which_reuniao_celula,
            userId: m.id,
            status: Boolean(m.status),
            date_create: now,
            date_update: now,
          },
          update: {
            status: Boolean(m.status),
            date_update: now,
          },
        });
      }
    });

    return { total: membro.length, upserted: membro.length };
  }

  async createNewPresencaReuniaCelula(
    presencaNewReuniaoDataForm: PresencaNewReuniaoCelula,
  ) {
    const prisma = createPrismaInstance();

    const { membro, which_reuniao_celula } = presencaNewReuniaoDataForm;
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;

    const result = await prisma.$transaction(
      membro.map(({ id, status }) =>
        prisma.presencaReuniaoCelula.create({
          data: {
            which_reuniao_celula: {
              connect: {
                id: which_reuniao_celula,
              },
            },
            membro: {
              connect: {
                id: id,
              },
            },
            status: Boolean(status),
            date_create: dataBrasilDate,
            date_update: date_update,
          },
        }),
      ),
    );

    return result;
  }

  async listByReuniaoId(reuniaoId: string) {
    const rows = await prisma.presencaReuniaoCelula.findMany({
      where: { reuniaoCelulaId: reuniaoId },
      select: { userId: true, status: true },
    });

    return rows;
  }

  async updatePresencaReuniaoCelula(
    id: string,
    presencaReuniaoCelulaDataForm: PresencaReuniaoCelulaData,
  ) {
    const { membro, ...presencaReuniaoCelulaData } =
      presencaReuniaoCelulaDataForm;
    const result = await prisma?.presencaReuniaoCelula.update({
      where: {
        id: id,
      },
      data: {
        ...presencaReuniaoCelulaData,
        membro: {
          connect: {
            id: membro,
          },
        },
        which_reuniao_celula: {
          connect: {
            id: presencaReuniaoCelulaData.which_reuniao_celula,
          },
        },
      },
    });

    return result;
  }

  async deletePresencaReuniaoCelula(id: string) {
    const result = await prisma?.presencaReuniaoCelula.delete({
      where: {
        id: id,
      },
    });

    return result;
  }
}

export default new PresencaReuniaoCelulaRepositorie();
