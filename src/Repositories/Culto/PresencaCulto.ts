import { PrismaClient } from "@prisma/client";
import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";

const prisma = new PrismaClient();

class PresencaCultoRepositorie {
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
    // const date_create = new Date(); // Defina a data e hora atual
    // const date_update = date_create; // Defina a mesma data e hora para date_update

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
        // date_create: date_create,
        // date_update: date_update,
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
