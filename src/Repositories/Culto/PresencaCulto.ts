import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);


class PresencaCultoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    console.log('Data Brasil (Date):', dataBrasilDate);
  }

  async cultosRelatorios(
    params: {
      supervisaoId: string;
      startOfInterval: string;
      endOfInterval: string;
    }
  ) {
const prisma = createPrismaInstance()

    console.log(params);
    try {
      const result = await prisma.cultoIndividual.findMany({

        where: {
          data_inicio_culto: { gte: params.startOfInterval },
          data_termino_culto: { lte: params.endOfInterval },
        },
        include: {
          presencas_culto: {
            include: {
              membro: {
                select: {
                  id: true,
                  first_name: true,
                  celula: {
                    select: {
                      id: true,
                      nome: true,
                    }
                  },
                  supervisao_pertence: {
                    select: {
                      id: true,
                      nome: true,
                    }
                  }
                }
              },
            },
          },
        },
      });

      console.log(result);
      return result;
    }

  finally {
    await disconnectPrisma()
  }
  }


  async findAll() {
  const prisma = createPrismaInstance()

  try {
    const result = await prisma.presencaCulto.findMany({
      select: {
        id: true,
        status: true,
        userId: true,
        cultoIndividualId: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              }
            }
          }
        },
        date_create: true,
        date_update: true,
      },
    });

    return result;
  }
finally {
  await disconnectPrisma()
}
  }

  async findFirst({
    presenca_culto,
    membro,
  }: {
    presenca_culto: string;
    membro: string;
  }) {
    const prisma = createPrismaInstance()

    const result = await prisma.presencaCulto.findFirst({
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
            celula: {
              select: {
                nome: true,
              }
            }
          }
        },
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance()

    const result = await prisma.presencaCulto.findUnique({
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
              }
            }
          }
        },
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findByIdCulto(culto: string, lider: string) {
    const prisma = createPrismaInstance()

    const result = await prisma.presencaCulto.findFirst({
      where: {
        cultoIndividualId: culto,
        userId: lider
      },
      select: {
        id: true,
        status: true,
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async createPresencaCulto(presencaCultoDataForm: PresencaCultoData) {
    const prisma = createPrismaInstance()

    const { membro, presenca_culto, status } = presencaCultoDataForm;
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;

    const result = await prisma.presencaCulto.create({
      data: {
        membro: {
          connect: {
            id: membro
          }
        },
        presenca_culto: {
          connect: {
            id: presenca_culto
          }
        },
        status: status,
        date_create: dataBrasilDate,
        date_update: date_update,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async updatePresencaCulto(id: string, presencaCultoDataForm: PresencaCultoData) {
    const prisma = createPrismaInstance()

    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    const result = await prisma.presencaCulto.update({
      where: {
        id: id,
      },
      data: {
        ...presencaCultoData,
        membro: {
          connect: {
            id: membro
          }
        },
        presenca_culto: {
          connect: {
            id: presencaCultoData.presenca_culto
          }
        }
      },
    });
    await disconnectPrisma()
    return result;
  }

  async deletePresencaCulto(id: string) {
    const prisma = createPrismaInstance()

    try {
      const result = await prisma.presencaCulto.delete({
        where: {
          id: id,
        },
      });
      return result;
    }
  finally {
    await disconnectPrisma()
  }
  }
}

export default new PresencaCultoRepositorie();
