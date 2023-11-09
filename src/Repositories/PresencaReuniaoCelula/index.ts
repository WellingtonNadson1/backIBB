import { PresencaReuniaoCelulaData } from "../../Controllers/PresencaReuniaoCelula";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

const prisma = createPrismaInstance()

class PresencaReuniaoCelulaRepositorie {
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
              }
            }
          }
        },
        which_reuniao_celula: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findPresenceRegistered(
    id: string) {
    const result = await prisma?.presencaReuniaoCelula.findFirst({
      where: {
        which_reuniao_celula: { id: id},
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
        which_reuniao_celula: true,
      },
    });
    await disconnectPrisma()
    return result;
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
        which_reuniao_celula: { id: which_reuniao_celula},
        membro: { id: membro},
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
        which_reuniao_celula: true,
      },
    });
    await disconnectPrisma()
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
              }
            }
          }
        },
        which_reuniao_celula: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async createPresencaReuniaCelula(presencaCultoDataForm: PresencaReuniaoCelulaData) {
    const { membro, which_reuniao_celula, status } = presencaCultoDataForm;
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;
    const result = await prisma?.presencaReuniaoCelula.create({
      data: {
        membro: {
          connect: {
            id: membro
          }
        },
        which_reuniao_celula: {
          connect: {
            id: which_reuniao_celula
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

  async updatePresencaReuniaoCelula(id: string, presencaReuniaoCelulaDataForm: PresencaReuniaoCelulaData) {
    const { membro, ...presencaReuniaoCelulaData } = presencaReuniaoCelulaDataForm;
    const result = await prisma?.presencaReuniaoCelula.update({
      where: {
        id: id,
      },
      data: {
        ...presencaReuniaoCelulaData,
        membro: {
          connect: {
            id: membro
          }
        },
        which_reuniao_celula: {
          connect: {
            id: presencaReuniaoCelulaData.which_reuniao_celula
          }
        }
      },
    });
    await disconnectPrisma()
    return result;
  }

  async deletePresencaReuniaoCelula(id: string) {
    const result = await prisma?.presencaReuniaoCelula.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma()
    return result;
  }
}

export default new PresencaReuniaoCelulaRepositorie();
