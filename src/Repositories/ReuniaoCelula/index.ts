import { Prisma, PrismaClient } from "@prisma/client";
import { ReuniaoCelulaData } from "../../Controllers/ReuniaoCelula";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = new PrismaClient()

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
    data_reuniao: Date,
    celula: string,
  }) {
    console.log('Data Reunia: ', data_reuniao)
    return prisma.$queryRaw`SELECT * FROM reuniao_celula WHERE DATE(data_reuniao) = DATE('${data_reuniao}') AND celula = '${celula}'`;
  }

  async findAll() {
    return await prisma.reuniaoCelula.findMany({
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
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findFirst({
    data_reuniao,
    celula,
  }: {
    data_reuniao: Date,
    celula: string,
  } ) {
    const dataReuniaoModify = dayjs(data_reuniao).toISOString().substring(0,10)
    return await prisma.reuniaoCelula.findFirst({
      where: {
        data_reuniao: dataReuniaoModify,
        celula: {id: celula },
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
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.reuniaoCelula.findUnique({
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
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findByDate(id: string, data_reuniao: Date) {
    return await prisma.reuniaoCelula.findUnique({
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
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async createReuniaoCelula(reuniaoCelulaDataForm: ReuniaoCelulaData) {
    const { presencas_membros_reuniao_celula, celula, status, data_reuniao } = reuniaoCelulaDataForm;
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const date_createBrasilDate = new Date(date_create);
    const date_update = date_createBrasilDate;
    const reuniaoCelula = await prisma.reuniaoCelula.create({
      data: {
        celula: {
          connect: {
            id: celula
          }
        },
        data_reuniao: date_createBrasilDate,
        date_update: date_update,
        status: status,
    }});
    // Conecte os relacionamentos opcionais, se fornecidos
    if (presencas_membros_reuniao_celula) {
      await prisma.reuniaoCelula.update({
        where: { id: reuniaoCelula.id },
        data: {
          presencas_membros_reuniao_celula: { connect: presencas_membros_reuniao_celula.map((reuniaoCelulaId) => ({ id: reuniaoCelulaId })) },
        },
      });
    }
    return reuniaoCelula
  }

  async updateReuniaoCelula(id: string, reuniaoCelulaDataForm: ReuniaoCelulaData) {
    const { presencas_membros_reuniao_celula, celula, ...ReuniaoCelulaData } = reuniaoCelulaDataForm;
    const updateReuniaoCelulaInput: UpdateReuniaCelulaInput = {
      ...ReuniaoCelulaData,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (celula !== undefined) {
      updateReuniaoCelulaInput.celula = {
        connect: {
          id: celula,
        },
      };
    }

    if (presencas_membros_reuniao_celula !== undefined) {
      updateReuniaoCelulaInput.presencas_membros_reuniao_celula = presencas_membros_reuniao_celula.map((presencaReuniaCelulaId) => ({
        connect: {
          id: presencaReuniaCelulaId,
        },
      })) as ReuniaCelulaConnect[];
    }
    return await prisma.reuniaoCelula.update({
      where: {
        id: id,
      },
      data: updateReuniaoCelulaInput,
    });
  }

  async deleteReuniaoCelula(id: string) {
    return await prisma.reuniaoCelula.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new ReuniaoCelulaRepositorie();
