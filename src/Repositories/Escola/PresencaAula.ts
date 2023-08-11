import { PrismaClient } from "@prisma/client";
import { PresencaAulaData } from "../../Controllers/Escola/PresencaAula";

const prisma = new PrismaClient();

class PresencaAulaRepositorie {
  async findAll() {
    return await prisma.presencaEscola.findMany({
      select: {
        id: true,
        status: true,
        aluno: true,
        aula_presenca_qual_escola: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.presencaEscola.findUnique({
      where: {
        id: id,
      },
      select: {
        status: true,
        aluno: true,
        aula_presenca_qual_escola: true,
      },
    });
  }

  async createPresencaAula(presencaAulaDataForm: PresencaAulaData) {
    const {aluno, aula_presenca_qual_escola, ...PresencaAulaData } = presencaAulaDataForm;
    return await prisma.presencaEscola.create({
      data: {
        ...PresencaAulaData,
        aluno: {
          connect: {
            id: aluno,
          }
        },
        aula_presenca_qual_escola: {
          connect: {
            id: aula_presenca_qual_escola,
          }
        },
      },
    });
  }

  async updateAulaEscola(id: string, presencaAulaDataForm: PresencaAulaData) {
    const { aluno, aula_presenca_qual_escola, ...PresencaAulaData } = presencaAulaDataForm;
    return await prisma.presencaEscola.update({
      where: {
        id: id,
      },
      data: {
        ...PresencaAulaData,
        aluno: {
          connect: {
            id: aluno,
          }
        },
        aula_presenca_qual_escola: {
          connect: {
            id: aula_presenca_qual_escola,
          }
        },
      },
    });
  }

  async deleteAulaEscola(id: string) {
    await prisma.presencaEscola.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaAulaRepositorie();
