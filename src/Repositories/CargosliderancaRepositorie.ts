import { CargosliderancaData } from "../Controllers/CargosliderancaController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";

const prisma = createPrismaInstance()

class CargosliderancaRepositorie {
  async findAll() {
    const result = await prisma?.cargoDeLideranca.findMany({
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
    return result;
  }

  async findById(id: string){
    const cargoLiderancaExistById = await prisma?.cargoDeLideranca.findUnique({
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
    return cargoLiderancaExistById
  }

  async createCargoslideranca(cargoLiderancaDataForm: CargosliderancaData) {
    const { nome, membros } = cargoLiderancaDataForm
    const result = await prisma?.cargoDeLideranca.create({
      data: {
        nome,
        membros: {
          connect: membros.map((membroId) => ({id: membroId}))
        },
      },
    });
    await disconnectPrisma()
    return result;
  }

  async updateCargoslideranca(id: string, cargoLiderancaDataForm: CargosliderancaData) {
    const { nome, membros } = cargoLiderancaDataForm
    const result = await prisma?.cargoDeLideranca.update({
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
    return result;
  }

  async deleteCargoslideranca(id: string) {
    const result = await prisma?.cargoDeLideranca.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma()
    return result;
  }
}

export default new CargosliderancaRepositorie();
