import { PrismaClient } from "@prisma/client";
import { PresencaReuniaoCelulaData } from "../../Controllers/PresencaReuniaoCelula";

const prisma = new PrismaClient();

class PresencaReuniaoCelulaRepositorie {
  async findAll() {
    return await prisma.presencaReuniaoCelula.findMany({
      select: {
        id: true,
        status: true,
        membro: true,
        presencas_reuniao_celula: true,
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
        membro: true,
        presencas_reuniao_celula: true,
      },
    });
  }

  async createPresencaReuniaCelula(presencaCultoDataForm: PresencaReuniaoCelulaData) {
    const { membro, presencas_reuniao_celula, status } = presencaCultoDataForm;
    return await prisma.presencaReuniaoCelula.create({
      data: {
        membro: {
          connect: {
            id: membro
          }
        },
        presencas_reuniao_celula: {
          connect: {
            id: presencas_reuniao_celula
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
        presencas_reuniao_celula: {
          connect: {
            id: presencaReuniaoCelulaData.presencas_reuniao_celula
          }
        }
      },
    });
  }

  async deletePresencaReuniaoCelula(id: string) {
    await prisma.presencaReuniaoCelula.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaReuniaoCelulaRepositorie();
