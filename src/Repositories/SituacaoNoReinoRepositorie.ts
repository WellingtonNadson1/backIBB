import { PrismaClient } from "@prisma/client";
import { SituacaoNoReinoData } from "../Controllers/SituacaoNoReinoController";

const prisma = new PrismaClient();

class SituacaoNoReinoRepositorie {
  async findAll() {
    return await prisma.situacaoNoReino.findMany({
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
  }

  async findById(id: string){
    const situacaoNoReinoExistById = await prisma.situacaoNoReino.findUnique({
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
    return situacaoNoReinoExistById
  }

  async createSituacaoNoReino(situacaoNoReinoDataForm: SituacaoNoReinoData) {
    const { nome, membros } = situacaoNoReinoDataForm
    return await prisma.situacaoNoReino.create({
      data: {
        nome,
        membros: {
          connect: membros.map((membroId) => ({id: membroId}))
        },
      },
    });
  }

  async updateSituacaoNoReino(id: string, situacaoNoReinoDataForm: SituacaoNoReinoData) {
    const { nome, membros } = situacaoNoReinoDataForm
    return await prisma.situacaoNoReino.update({
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
  }

  async deleteSituacaoNoReino(id: string) {
    await prisma.situacaoNoReino.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new SituacaoNoReinoRepositorie();
