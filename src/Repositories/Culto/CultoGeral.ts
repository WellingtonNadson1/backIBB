import { PrismaClient } from "@prisma/client";
import { CultoGeralData } from "../../Controllers/Culto/CultoGeral";

const prisma = new PrismaClient();

class CultoGeralRepositorie {
  async findAll() {
    return await prisma.cultoGeral.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        lista_cultos_semanais: {
          select: {
            id: true,
            cultos: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.cultoGeral.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        lista_cultos_semanais: {
          select: {
            id: true,
            cultos: true,
          },
        },
      },
    });
  }

  async createCultoGeral(cultoGeralDataForm: CultoGeralData) {
    const { lista_cultos_semanais, ...CultoGeralData } = cultoGeralDataForm;
    return await prisma.cultoGeral.create({
      data: {
        ...CultoGeralData,
        lista_cultos_semanais: {
          connect: lista_cultos_semanais ? lista_cultos_semanais.map((cultoSemanaId) => ({ id: cultoSemanaId })) : [],
        },
      },
    });
  }

  async updateCultoGerala(id: string, cultoGeralDataForm: CultoGeralData) {
    const { lista_cultos_semanais, ...CultoGeralData } = cultoGeralDataForm;
    return await prisma.cultoGeral.update({
      where: {
        id: id,
      },
      data: {
        ...CultoGeralData,
        lista_cultos_semanais: {
          connect: lista_cultos_semanais ? lista_cultos_semanais.map((cultoSemanaId) => ({ id: cultoSemanaId })) : [],
        },
      },
    });
  }

  async deleteCultoGeral(id: string) {
    await prisma.cultoGeral.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoGeralRepositorie();
