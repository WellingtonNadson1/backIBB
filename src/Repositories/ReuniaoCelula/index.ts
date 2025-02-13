import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReuniaoCelulaData } from "../../Controllers/ReuniaoCelula";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

interface ReuniaoCelulaResult {
  data_reuniao: string;
  celula: string;
  status: string;
  presencas_membros_reuniao_celula: null | any; // Substitua 'any' pelo tipo apropriado se possível
}

const prisma = createPrismaInstance();

dayjs.extend(utc);
dayjs.extend(timezone);

type UpdateReuniaCelulaInput = Prisma.ReuniaoCelulaUpdateInput & {
  presencas_membros_reuniao_celula?: { connect: { id: string } }[];
};

interface ReuniaCelulaConnect {
  connect: { id: string };
}

class ReuniaoCelulaRepositorie {
  async reuniaoCelulaExist({
    data_reuniao,
    celula,
  }: {
    data_reuniao: string;
    celula: string;
  }): Promise<ReuniaoCelulaResult[]> {
    console.log("Data Reunia: ", data_reuniao);
    if (prisma) {
      const query = await prisma.$queryRaw<
        ReuniaoCelulaResult[]
      >`SELECT * FROM reuniao_celula WHERE DATE(data_reuniao) = DATE(${data_reuniao}) AND "celulaId" = ${celula}`;
      console.log("QUERY Retorno: ", query);
      await disconnectPrisma();
      return query;
    } else {
      // Trate o caso em que prisma é undefined, se necessário
      await disconnectPrisma();
      return [];
    }
  }

  async findAll() {
    const result = await prisma?.reuniaoCelula.findMany({
      select: {
        id: true,
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              },
            },
          },
        },
        celula: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findFirst({
    data_reuniao,
    celula,
  }: {
    data_reuniao: Date;
    celula: string;
  }) {
    const startOfDay = dayjs(data_reuniao).startOf("day").toDate(); // Início do dia como Date
    const endOfDay = dayjs(data_reuniao).endOf("day").toDate();
    // const dataReuniaoModify = dayjs(data_reuniao)
    //   .toISOString()
    //   .substring(0, 10);
    const result = await prisma?.reuniaoCelula.findFirst({
      where: {
        data_reuniao: {
          gte: startOfDay, // Usando o Date
          lt: endOfDay, // Usando o Date
        },
        celula: { id: celula },
      },
      select: {
        id: true,
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              },
            },
          },
        },
        celula: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findById(id: string) {
    const result = await prisma?.reuniaoCelula.findUnique({
      where: {
        id: id,
      },
      select: {
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              },
            },
          },
        },
        celula: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findByDate(id: string, data_reuniao: Date) {
    const result = await prisma?.reuniaoCelula.findUnique({
      where: {
        id: id,
        data_reuniao: data_reuniao,
      },
      select: {
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              },
            },
          },
        },
        celula: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async createReuniaoCelula(reuniaoCelulaDataForm: ReuniaoCelulaData) {
    const { presencas_membros_reuniao_celula, celula, status, data_reuniao } =
      reuniaoCelulaDataForm;
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const date_createBrasilDate = new Date(date_create);
    const date_update = date_createBrasilDate;
    const reuniaoCelula = await prisma?.reuniaoCelula.create({
      data: {
        celula: {
          connect: {
            id: celula,
          },
        },
        data_reuniao: date_createBrasilDate,
        date_update: date_update,
        status: status,
      },
    });
    // Conecte os relacionamentos opcionais, se fornecidos
    if (presencas_membros_reuniao_celula) {
      await prisma?.reuniaoCelula.update({
        where: { id: reuniaoCelula?.id },
        data: {
          presencas_membros_reuniao_celula: {
            connect: presencas_membros_reuniao_celula.map(
              (reuniaoCelulaId) => ({ id: reuniaoCelulaId })
            ),
          },
        },
      });
    }
    await disconnectPrisma();
    return reuniaoCelula;
  }

  async updateReuniaoCelula(
    id: string,
    reuniaoCelulaDataForm: ReuniaoCelulaData
  ) {
    const {
      presencas_membros_reuniao_celula,
      celula,
      visitantes,
      almas_ganhas,
      ...ReuniaoCelulaData
    } = reuniaoCelulaDataForm;
    const updateReuniaoCelulaInput: UpdateReuniaCelulaInput = {
      ...ReuniaoCelulaData,
      date_update: new Date(), // Atualizando a data de atualização
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (celula !== undefined) {
      updateReuniaoCelulaInput.celula = {
        connect: {
          id: celula,
        },
      };
    }

    if (visitantes !== undefined) {
      updateReuniaoCelulaInput.visitantes = {
        set: Number(visitantes),
      };
    }

    if (almas_ganhas !== undefined) {
      updateReuniaoCelulaInput.almas_ganhas = {
        set: Number(almas_ganhas),
      };
    }

    if (presencas_membros_reuniao_celula !== undefined) {
      updateReuniaoCelulaInput.presencas_membros_reuniao_celula =
        presencas_membros_reuniao_celula.map((presencaReuniaCelulaId) => ({
          connect: {
            id: presencaReuniaCelulaId,
          },
        })) as ReuniaCelulaConnect[];
    }
    const result = await prisma?.reuniaoCelula.update({
      where: {
        id: id,
      },
      data: updateReuniaoCelulaInput,
    });
    await disconnectPrisma();
    return result;
  }

  async deleteReuniaoCelula(id: string) {
    const result = await prisma?.reuniaoCelula.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new ReuniaoCelulaRepositorie();
