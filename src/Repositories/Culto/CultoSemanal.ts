import { Prisma, PrismaClient } from "@prisma/client";
import { CultoSemanalData } from "../../Controllers/Culto/CultoSemanal";

const prisma = new PrismaClient();

type UpdateCultoSemanalInput = Prisma.CultoSemanalUpdateInput & {
  cultos?: { connect: { id: string } }[];
};

interface CultoSemanalConnect {
  connect: { id: string };
}

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
    const cultoSemanal = await prisma.cultoSemanal.create({
      data: {
        ...CultoSemanalData,
      },
    });

      // Conecte os relacionamentos opcionais, se fornecidos
  if (cultoGeral) {
    await prisma.cultoSemanal.update({
      where: { id: cultoSemanal.id },
      data: {
        cultoGeral: { connect: { id: cultoGeral } },
      },
    });
  }

    if (cultos) {
      await prisma.cultoSemanal.update({
        where: { id: cultoSemanal.id },
        data: {
          cultos: { connect: cultos.map((cultoId) => ({ id: cultoId })) },
        },
      });
    }
    return cultoSemanal
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

    return await prisma.cultoSemanal.update({
      where: {
        id: id,
      },
      data: updateCultoSemanalInput,
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
