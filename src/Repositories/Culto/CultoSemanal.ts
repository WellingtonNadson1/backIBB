import { Prisma } from "@prisma/client";
import { CultoSemanalData } from "../../Controllers/Culto/CultoSemanal";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

const prisma = createPrismaInstance();

type UpdateCultoSemanalInput = Prisma.CultoSemanalUpdateInput & {
  cultos?: { connect: { id: string } }[];
};

interface CultoSemanalConnect {
  connect: { id: string };
}

class CultoSemanalRepositorie {
  async findAll() {
    const result = await prisma?.cultoSemanal.findMany({
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
      orderBy: { nome: "asc" },
    });
    await disconnectPrisma();
    return result;
  }

  async findById(id: string) {
    const result = await prisma?.cultoSemanal.findUnique({
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
    await disconnectPrisma();
    return result;
  }

  async createCultoSemanal(cultoSemanalDataForm: CultoSemanalData) {
    const { cultos, cultoGeral, ...CultoSemanalData } = cultoSemanalDataForm;
    const cultoSemanal = await prisma?.cultoSemanal.create({
      data: {
        ...CultoSemanalData,
      },
    });

    // Conecte os relacionamentos opcionais, se fornecidos
    if (cultoGeral) {
      await prisma?.cultoSemanal.update({
        where: { id: cultoSemanal.id },
        data: {
          cultoGeral: { connect: { id: cultoGeral } },
        },
      });
    }

    if (cultos) {
      await prisma?.cultoSemanal.update({
        where: { id: cultoSemanal.id },
        data: {
          cultos: { connect: cultos.map((cultoId) => ({ id: cultoId })) },
        },
      });
    }
    await disconnectPrisma();
    return cultoSemanal;
  }

  async updateCultoSemanal(id: string, cultoSemanalDataForm: CultoSemanalData) {
    const { cultos, cultoGeral, ...CultoSemanalData } = cultoSemanalDataForm;
    const updateCultoSemanalInput: UpdateCultoSemanalInput = {
      ...CultoSemanalData,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (cultoGeral !== undefined) {
      updateCultoSemanalInput.cultoGeral = {
        connect: {
          id: cultoGeral,
        },
      };
    }

    if (cultos !== undefined) {
      updateCultoSemanalInput.cultos = cultos.map((cultoId) => ({
        connect: {
          id: cultoId,
        },
      })) as CultoSemanalConnect[];
    }

    const result = await prisma?.cultoSemanal.update({
      where: {
        id: id,
      },
      data: updateCultoSemanalInput,
    });
    await disconnectPrisma();
    return result;
  }

  async deleteCultoSemanal(id: string) {
    const result = await prisma?.cultoSemanal.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new CultoSemanalRepositorie();
