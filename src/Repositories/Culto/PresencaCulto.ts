import { PrismaClient } from "@prisma/client";
import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

// Defina o fuso horário para o Brasil
// dayjs.tz.setDefault('America/Sao_Paulo');

// Registre uma data com o fuso horário do Brasil
// console.log('Data Brasil: ', dataBrasil)

const prisma = new PrismaClient();

class PresencaCultoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    console.log('Data Brasil (Date):', dataBrasilDate);
  }
  async findAll() {
    return await prisma.presencaCulto.findMany({

      select: {
        id: true,
        status: true,
        userId: true, // Inclua o campo userId
        cultoIndividualId: true, // Inclua o campo cultoIndividualId
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
        date_create: true, // Inclua o campo date_create
        date_update: true, // Inclua o campo date_update
      },
    });
  }

  async findFirst({
    presenca_culto,
    membro,
  }: {
    presenca_culto: string;
    membro: string;
  }) {
    return await prisma.presencaCulto.findFirst({
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
  }

  async findById(id: string) {
    return await prisma.presencaCulto.findUnique({
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
  }

  async findByIdCulto(culto: string, lider: string) {
    return await prisma.presencaCulto.findFirst({
      where: {
        cultoIndividualId: culto,
        membro: {id: lider}
      },
      select: {
        id: true,
        status: true,
        presenca_culto: true,
      },
    });
  }

  async createPresencaCulto(presencaCultoDataForm: PresencaCultoData) {
    const { membro, presenca_culto, status } = presencaCultoDataForm;
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;

    return await prisma.presencaCulto.create({
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
  }

  // async createPresencaMembrosCulto(presencaMembrosCultoData: PresencaCultoData[]) {
  //   return await prisma.presencaCulto.create({
  //     data: {

  //   }}
  //   )
  // }

  async updatePresencaCulto(id: string, presencaCultoDataForm: PresencaCultoData) {
    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    return await prisma.presencaCulto.update({
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
  }

  async deletePresencaCulto(id: string) {
    return await prisma.presencaCulto.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaCultoRepositorie();
