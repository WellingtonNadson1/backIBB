import { PrismaClient } from "@prisma/client";
import { AulaEscolaData } from "../../Controllers/Escola/AulaEscola";

const prisma = new PrismaClient();

class AulaEscolaRepositorie {
  async findAll() {
    return await prisma.aulaEscola.findMany({
      select: {
        id: true,
        data_aula: true,
        turma: true,
        status: true,
        presencas: {
          select: {
            id: true,
            aluno: true,
            status: true,
            aula_presenca_qual_escola: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.aulaEscola.findUnique({
      where: {
        id: id,
      },
      select: {
        data_aula: true,
        turma: true,
        status: true,
        presencas: {
          select: {
            id: true,
            aluno: true,
            status: true,
            aula_presenca_qual_escola: true,
          },
        },
      },
    });
  }

  async createAulaEscola(aulaEscolaDataForm: AulaEscolaData) {
    const { presencas, turma, ...AulaEscolaData } = aulaEscolaDataForm;
    return await prisma.aulaEscola.create({
      data: {
        ...AulaEscolaData,
        turma: {
          connect: {
            id: turma,
          },
        },
        presencas: {
          connect: presencas ? presencas.map((presencaId) => ({ id: presencaId })) : [],
        },
      },
    });
  }

  async updateAulaEscola(id: string, aulaEscolaDataForm: AulaEscolaData) {
    const { presencas, turma, ...AulaEscolaData } = aulaEscolaDataForm;
    return await prisma.aulaEscola.update({
      where: {
        id: id,
      },
      data: {
        ...AulaEscolaData,
        turma: {
          connect: {
            id: turma,
          },
        },
        presencas: {
          connect: presencas ? presencas.map((presencaId) => ({ id: presencaId })) : [],
        },
      },
    });
  }

  async deleteAulaEscola(id: string) {
    await prisma.aulaEscola.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new AulaEscolaRepositorie();
