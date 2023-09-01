import { PrismaClient } from "@prisma/client";
import { EncontroData } from "../Controllers/EncontroController";

const prisma = new PrismaClient();

class EncontroRepositorie {
  async findAll() {
    return await prisma.encontros.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        participantes: {
          select: {
            id: true,
            first_name: true,
          }
        },
      }
    })
  }

  async findById(id: string){
    return await prisma.encontros.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        descricao: true,
        participantes: {
          select: {
            id: true,
            first_name: true,
          }
        },
      }
    })
  }

  async createEncontro(eencontroDataForm: EncontroData) {
    const { participantes, ...EncontroData } = eencontroDataForm
    return await prisma.encontros.create({
      data: {
        ...EncontroData,
        participantes: {
          connect: participantes ? participantes.map((membroId) => ({id: membroId})) : []

        },
      },
    })
  }

  async updateEncontro(id: string, escolaDataForm: EncontroData) {
    const { participantes, ...EncontroData } = escolaDataForm
    return await prisma.encontros.update({
      where: {
        id: id,
      },
      data: {
        ...EncontroData,
        participantes: {
          connect: participantes?.map((membroId) => ({id: membroId}))

        },
      },
    })

  }

  async deleteEncontro(id: string) {
    await prisma.encontros.delete({
      where: {
        id: id,
      },
    })
  }
}

export default new EncontroRepositorie();
