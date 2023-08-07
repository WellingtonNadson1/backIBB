import { PrismaClient } from "@prisma/client";
import { CelulaData } from "../Controllers/CelulaController";

const prisma = new PrismaClient();

class CelulaRepositorie {
  async findAll() {
    return await prisma.celula.findMany({
      select: {
        id: true,
        nome: true,
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        },
        supervisao: {
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
    })
  }

  async findById(id: string){
    return await prisma.celula.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        membros: {
          select: {
            first_name: true,
          }
        },
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        }
      }
    })
  }

  async createCelula(celulaDataForm: CelulaData) {
    const { membros, ...CelulaData } = celulaDataForm

    return await prisma.celula.create({
      data: {
        ...CelulaData,
        lider: {
          connect: {
            id: CelulaData.lider,
          }
        },
        supervisao: {
          connect: {
            id: CelulaData.supervisao,
          }
        },
        membros: {
          connect: membros ? membros.map((membroId) => ({id: membroId.id})) : []

        },
      },
    })
  }

  async updateCelula(id: string, celulaDataForm: CelulaData) {
    const { nome, lider, supervisao, membros } = celulaDataForm
    return await prisma.celula.update({
      where: {
        id: id,
      },
      data: {
        nome,
        lider: {
          connect: {
            id: lider
          }
        },
        supervisao: {
          connect: {
            id: supervisao
          }
        },
        membros: {
          connect: membros?.map((membroId) => ({id: membroId.id}))

        },
      },
    })

  }

  async deleteCelula(id: string) {
    await prisma.celula.delete({
      where: {
        id: id,
      },
    })
  }
}

export default new CelulaRepositorie();
