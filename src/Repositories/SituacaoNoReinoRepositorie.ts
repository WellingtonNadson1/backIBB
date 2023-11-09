import { SituacaoNoReinoData } from "../Controllers/SituacaoNoReinoController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";

const prisma = createPrismaInstance()

class SituacaoNoReinoRepositorie {
  async findAll() {
    const result = await prisma?.situacaoNoReino.findMany({
      select: {
        id: true,
        nome: true,
        membros: {
          select: {
            id: true,
            first_name: true,
          }
        },
      }
    });

    await disconnectPrisma()
    return result
  }

  async findById(id: string){
    const situacaoNoReinoExistById = await prisma?.situacaoNoReino.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        membros: {
          select: {
            id: true,
            first_name: true,
            image_url: true,
          }
        },
      }
    })
    await disconnectPrisma()
    return situacaoNoReinoExistById
  }

  async createSituacaoNoReino(situacaoNoReinoDataForm: SituacaoNoReinoData) {
    const { nome, membros } = situacaoNoReinoDataForm
    const result = await prisma?.situacaoNoReino.create({
      data: {
        nome,
        membros: {
          connect: membros.map((membroId) => ({id: membroId}))
        },
      },
    });
    await disconnectPrisma()
    return result
  }

  async updateSituacaoNoReino(id: string, situacaoNoReinoDataForm: SituacaoNoReinoData) {
    const { nome, membros } = situacaoNoReinoDataForm
    const result = await prisma?.situacaoNoReino.update({
      where: {
        id: id,
      },
      data: {
        nome,
        membros: {
          connect: membros.map((membroId) => ({id: membroId}))
        },
      },
    });
    await disconnectPrisma()
    return result
  }

  async deleteSituacaoNoReino(id: string) {
    const result = await prisma?.situacaoNoReino.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma()
    return result
  }
}

export default new SituacaoNoReinoRepositorie();
