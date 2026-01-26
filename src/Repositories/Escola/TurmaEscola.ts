import { PrismaClient } from "@prisma/client";
import { TrumaEscolaData } from "../../Controllers/Escola/TurmaEscola";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

class TurmaEscolaRepositorie {
  async findAll() {
    return await prisma.turmaEscola.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        alunos: {
          select: {
            id: true,
            first_name: true,
          },
        },
        date_inicio: true,
        date_conclusao: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.turmaEscola.findUnique({
      where: {
        id: id,
      },
      select: {
        nome: true,
        descricao: true,
        alunos: {
          select: {
            id: true,
            first_name: true,
          },
        },
        date_inicio: true,
        date_conclusao: true,
      },
    });
  }

  async createTurmaEscola(escolaDataForm: TrumaEscolaData) {
    const { alunos, aulas_marcadas, ...TrumaEscolaData } = escolaDataForm;
    return await prisma.turmaEscola.create({
      data: {
        ...TrumaEscolaData,
        escola: {
          connect: {
            id: TrumaEscolaData.escola,
          },
        },
        alunos: {
          connect: alunos ? alunos.map((alunoId) => ({ id: alunoId })) : [],
        },
        aulas_marcadas: {
          connect: aulas_marcadas
            ? aulas_marcadas.map((aulaId) => ({ id: aulaId }))
            : [],
        },
      },
    });
  }

  async updateTurmaEscola(id: string, escolaDataForm: TrumaEscolaData) {
    const { alunos, aulas_marcadas, ...TrumaEscolaData } = escolaDataForm;
    return await prisma.turmaEscola.update({
      where: {
        id: id,
      },
      data: {
        ...TrumaEscolaData,
        escola: {
          connect: {
            id: TrumaEscolaData.escola,
          },
        },
        alunos: {
          connect: alunos?.map((alunoId) => ({ id: alunoId })),
        },
        aulas_marcadas: {
          connect: aulas_marcadas
            ? aulas_marcadas.map((aulaId) => ({ id: aulaId }))
            : [],
        },
      },
    });
  }

  async deleteTurmaEscola(id: string) {
    await prisma.turmaEscola.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new TurmaEscolaRepositorie();
