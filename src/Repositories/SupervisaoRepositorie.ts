import { PrismaClient } from "@prisma/client";
import { SupervisaoData } from "../Controllers/SupervisaoController";

const prisma = new PrismaClient();

class SupervisiaoRepositorie {
  async findAll() {
    return await prisma.supervisao.findMany({
      select: {
        id: true,
        nome: true,
        cor: true,
        supervisor: {
          select: {
            id: true,
            first_name: true,
          }
        },
        celulas: {
          select: {
            id: true,
            nome: true,
          }
        },
        membros: {
          select: {
            id: true,
            first_name: true,
          }
        },
      }
    });
  }

  async findById(id: string){
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
          }
        },
        celulas: {
          select: {
            id: true,
            nome: true,
            lider: {
              select: {
                id: true,
                first_name: true,
              }
            }
          }
        },
        membros: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          }
        },
      }
    })
    return supervisaoExistById
  }

  async createSupervisao(supervisaoDataForm: SupervisaoData) {
    const { nome, cor, supervisor, celulas, membros } = supervisaoDataForm
    return await prisma.supervisao.create({
      data: {
        nome,
        cor,
        supervisor: {
          connect: {
            id: supervisor.id
          }
        },
        celulas: {
          connect: celulas.map((celulaId) => ({id: celulaId.id}))
        },
        membros: {
          connect: membros.map((membroId) => ({id: membroId.id}))

        },
      },
    });
  }

  async updateSupervisao(id: string, supervisaoDataForm: SupervisaoData) {
    const { nome, cor, supervisor, celulas, membros } = supervisaoDataForm
    return await prisma.supervisao.update({
      where: {
        id: id,
      },
      data: {
        nome,
        cor,
        supervisor: {
          connect: {
            id: supervisor.id
          }
        },
        celulas: {
          connect: celulas.map((celulaId) => ({id: celulaId.id}))
        },
        membros: {
          connect: membros.map((membroId) => ({id: membroId.id}))

        },
      },
    });
  }

  async deleteSupervisao(id: string) {
    await prisma.supervisao.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new SupervisiaoRepositorie();
