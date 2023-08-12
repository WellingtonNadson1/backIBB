import { PrismaClient } from "@prisma/client";
import { CultoSemanalData } from "../../Controllers/Culto/CultoSemanal";

const prisma = new PrismaClient();

class CultoSemanalRepositorie {
  async findAll() {
    return await prisma.cultoSemanal.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        cultoGeral: true,
        cultos: {
          select: {
            id: true,
            culto_semana: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.cultoSemanal.findUnique({
      where: {
        id: id,
      },
      select: {
        nome: true,
        descricao: true,
        cultoGeral: true,
        cultos: {
          select: {
            id: true,
            culto_semana: true,
          },
        },
      },
    });
  }

  async createCultoSemanal(cultoSemanalDataForm: CultoSemanalData) {
    const { cultos, cultoGeral, ...CultoSemanalData } = cultoSemanalDataForm;
    return await prisma.cultoSemanal.create({
      data: {
        ...CultoSemanalData,
        cultoGeral: {
          connect: {
            id: cultoGeral,
          },
        },
        cultos: {
          connect: cultos ? cultos.map((cultoId) => ({ id: cultoId })) : [],
        },
      },
    });
  }

  async updateCultoSemanal(id: string, cultoSemanalDataForm: CultoSemanalData) {
    const { cultos, cultoGeral, ...CultoSemanalData } = cultoSemanalDataForm;
    return await prisma.cultoSemanal.update({
      where: {
        id: id,
      },
      data: {
        ...CultoSemanalData,
        cultoGeral: {
          connect: {
            id: cultoGeral,
          },
        },
        cultos: {
          connect: cultos ? cultos.map((cultoId) => ({ id: cultoId })) : [],
        },
      },
    });
  }

  async deleteCultoSemanal(id: string) {
    await prisma.cultoSemanal.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoSemanalRepositorie();
