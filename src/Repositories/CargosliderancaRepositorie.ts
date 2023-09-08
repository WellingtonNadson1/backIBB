import { PrismaClient } from "@prisma/client";
import { CargosliderancaData } from "../Controllers/CargosliderancaController";

const prisma = new PrismaClient();

class CargosliderancaRepositorie {
  async findAll() {
    return await prisma.cargoDeLideranca.findMany({
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
    const cargoLiderancaExistById = await prisma.cargoDeLideranca.findUnique({
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
    return cargoLiderancaExistById
  }

  async createCargoslideranca(cargoLiderancaDataForm: CargosliderancaData) {
    const { nome, membros } = cargoLiderancaDataForm
    return await prisma.cargoDeLideranca.create({
      data: {
        nome,
        membros: {
          connect: membros.map((membroId) => ({id: membroId}))
        },
      },
    });
  }

  async updateCargoslideranca(id: string, cargoLiderancaDataForm: CargosliderancaData) {
    const { nome, membros } = cargoLiderancaDataForm
    return await prisma.cargoDeLideranca.update({
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

  async deleteCargoslideranca(id: string) {
    return await prisma.cargoDeLideranca.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CargosliderancaRepositorie();
