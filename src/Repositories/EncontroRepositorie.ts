import { EncontroData } from "../Controllers/EncontroController";
import { createPrismaInstance } from "../services/prisma";

const prisma = createPrismaInstance();

class EncontroRepositorie {
  async findAll() {
    const result = await prisma?.encontros.findMany({
      select: {
        id: true,
        nome: true,
        descricao: true,
        participantes: {
          select: {
            id: true,
            first_name: true,
          },
        },
      },
    });

    return result;
  }

  async findById(id: string) {
    const result = await prisma?.encontros.findUnique({
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
          },
        },
      },
    });

    return result;
  }

  async createEncontro(eencontroDataForm: EncontroData) {
    const { participantes, ...EncontroData } = eencontroDataForm;
    const result = await prisma?.encontros.create({
      data: {
        ...EncontroData,
        participantes: {
          connect: participantes
            ? participantes.map((membroId) => ({ id: membroId }))
            : [],
        },
      },
    });

    return result;
  }

  async updateEncontro(id: string, escolaDataForm: EncontroData) {
    const { participantes, ...EncontroData } = escolaDataForm;
    const result = await prisma?.encontros.update({
      where: {
        id: id,
      },
      data: {
        ...EncontroData,
        participantes: {
          connect: participantes?.map((membroId) => ({ id: membroId })),
        },
      },
    });

    return result;
  }

  async deleteEncontro(id: string) {
    const result = await prisma?.encontros.delete({
      where: {
        id: id,
      },
    });

    return result;
  }
}

export default new EncontroRepositorie();
