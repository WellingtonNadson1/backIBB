import { EscolaData } from "../../Controllers/Escola/Escola";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

class EscolaRepositorie {
  async findAll() {
    return await prisma.escola.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        lider: {
          select: {
            id: true,
            first_name: true,
          },
        },
        alunos: {
          select: {
            id: true,
            first_name: true,
          },
        },
        turmas: {
          select: {
            id: true,
            nome: true,
            escola: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.escola.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        alunos: {
          select: {
            id: true,
            first_name: true,
          },
        },
        lider: {
          select: {
            id: true,
            first_name: true,
          },
        },
        turmas: {
          select: {
            id: true,
            nome: true,
            escola: true,
          },
        },
      },
    });
  }

  async createEscola(escolaDataForm: EscolaData) {
    const { alunos, turmas, ...EscolaData } = escolaDataForm;
    return await prisma.escola.create({
      data: {
        ...EscolaData,
        lider: {
          connect: {
            id: EscolaData.lider,
          },
        },
        alunos: {
          connect: alunos ? alunos.map((alunoId) => ({ id: alunoId })) : [],
        },
        turmas: {
          connect: turmas ? turmas.map((turmaId) => ({ id: turmaId })) : [],
        },
      },
    });
  }

  async updateEscola(id: string, escolaDataForm: EscolaData) {
    const { lider, alunos, turmas, ...EscolaData } = escolaDataForm;
    return await prisma.escola.update({
      where: {
        id: id,
      },
      data: {
        ...EscolaData,
        lider: {
          connect: {
            id: lider,
          },
        },
        alunos: {
          connect: alunos?.map((alunoId) => ({ id: alunoId })),
        },
        turmas: {
          connect: turmas ? turmas.map((turmaId) => ({ id: turmaId })) : [],
        },
      },
    });
  }

  async deleteEscola(id: string) {
    await prisma.escola.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new EscolaRepositorie();
