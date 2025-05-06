import { SupervisaoData } from "../Controllers/SupervisaoController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";

const prisma = createPrismaInstance();

class SupervisiaoRepositorie {
  async findAll() {
    const result = await prisma.supervisao.findMany({
      select: {
        id: true,
        nome: true,
        cor: true,
        supervisor: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          },
        },
        celulas: {
          select: {
            id: true,
            nome: true,
            _count: {
              select: {
                membros: true,
              },
            },
          },
        },
      },
    });

    // Calcula a quantidade total de membros e células por supervisão
    const formatted = result.map((supervisao) => {
      const quantidadeCelulas = supervisao.celulas.length;
      const quantidadeMembros = supervisao.celulas.reduce(
        (total, celula) => total + celula._count.membros,
        0
      );

      return {
        id: supervisao.id,
        nome: supervisao.nome,
        cor: supervisao.cor,
        supervisor: supervisao.supervisor,
        quantidadeCelulas,
        quantidadeMembros,
      };
    });

    await disconnectPrisma();
    return formatted;
  }

  async findById(id: string) {
    const supervisaoExistById = await prisma.supervisao.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        cor: true,
        supervisor: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          },
        },
        celulas: {
          select: {
            id: true,
            nome: true,
            lider: {
              select: {
                id: true,
                first_name: true,
                image_url: true,
              },
            },
          },
        },
        membros: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          },
        },
      },
    });
    await disconnectPrisma();
    return supervisaoExistById;
  }

  async createSupervisao(supervisaoDataForm: SupervisaoData) {
    const { nome, cor, supervisor, celulas, membros } = supervisaoDataForm;
    const result = await prisma.supervisao.create({
      data: {
        nome,
        cor,
        supervisor: {
          connect: {
            id: supervisor,
          },
        },
        celulas: {
          connect: celulas.map((celulaId) => ({ id: celulaId })),
        },
        membros: {
          connect: membros.map((membroId) => ({ id: membroId })),
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async updateSupervisao(id: string, supervisaoDataForm: SupervisaoData) {
    const { nome, cor, supervisor, celulas, membros } = supervisaoDataForm;
    const result = await prisma.supervisao.update({
      where: {
        id: id,
      },
      data: {
        nome,
        cor,
        supervisor: {
          connect: {
            id: supervisor,
          },
        },
        celulas: {
          connect: celulas.map((celulaId) => ({ id: celulaId })),
        },
        membros: {
          connect: membros.map((membroId) => ({ id: membroId })),
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async deleteSupervisao(id: string) {
    const result = await prisma.supervisao.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new SupervisiaoRepositorie();
