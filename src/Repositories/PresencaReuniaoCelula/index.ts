import { PrismaClient } from "@prisma/client";
import { PresencaReuniaoCelulaData } from "../../Controllers/PresencaReuniaoCelula";

const prisma = new PrismaClient();

class PresencaReuniaoCelulaRepositorie {
  async findAll() {
    return await prisma.presencaReuniaoCelula.findMany({
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
  }

  async findFirst({
    which_reuniao_celula,
    membro,
  }: {
    which_reuniao_celula: string;
    membro: string;
  }) {
    return await prisma.presencaReuniaoCelula.findFirst({
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
  }


  async findById(id: string) {
    return await prisma.presencaReuniaoCelula.findUnique({
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
  }

  async createPresencaReuniaCelula(presencaCultoDataForm: PresencaReuniaoCelulaData) {
    const { membro, which_reuniao_celula, status } = presencaCultoDataForm;
    return await prisma.presencaReuniaoCelula.create({
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
        status: status
      },
    });
  }

  async updatePresencaReuniaoCelula(id: string, presencaReuniaoCelulaDataForm: PresencaReuniaoCelulaData) {
    const { membro, ...presencaReuniaoCelulaData } = presencaReuniaoCelulaDataForm;
    return await prisma.presencaReuniaoCelula.update({
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
  }

  async deletePresencaReuniaoCelula(id: string) {
    return await prisma.presencaReuniaoCelula.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaReuniaoCelulaRepositorie();
