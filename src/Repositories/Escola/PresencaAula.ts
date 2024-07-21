import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
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
    const { aluno, aula_presenca_qual_escola, status } = presencaAulaDataForm;
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;
    return await prisma.presencaEscola.create({
      data: {
        status,
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
        date_update
      },
    });
  }

  async updatePresencaAula(id: string, presencaAulaDataForm: PresencaAulaData) {
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

  async deletePresencaAula(id: string) {
    await prisma.presencaEscola.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaAulaRepositorie();
