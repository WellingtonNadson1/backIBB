import { Prisma } from "@prisma/client";
import { CultoGeralData } from "../../Controllers/Culto/CultoGeral";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

type UpdateCultoGeralInput = Prisma.CultoGeralUpdateInput & {
  lista_cultos_semanais?: { connect: { id: string } }[];
};

interface CultoGeralConnect {
  connect: { id: string };
}

class CultoGeralRepositorie {
  async findAll() {
    return await prisma?.cultoGeral.findMany({
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
    return await prisma?.cultoGeral.findUnique({
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
    const cultoGeral = await prisma?.cultoGeral.create({
      data: {
        ...CultoGeralData,
      },
    });
    if (lista_cultos_semanais) {
      await prisma?.cultoGeral.update({
        where: { id: cultoGeral.id },
        data: {
          lista_cultos_semanais: {
            connect: lista_cultos_semanais.map((escolaId) => ({
              id: escolaId,
            })),
          },
        },
      });
    }

    return cultoGeral;
  }

  async updateCultoGerala(id: string, cultoGeralDataForm: CultoGeralData) {
    const { lista_cultos_semanais, ...CultoGeralData } = cultoGeralDataForm;

    const updateCultoGeralInput: UpdateCultoGeralInput = {
      ...CultoGeralData,
    };

    if (lista_cultos_semanais !== undefined) {
      updateCultoGeralInput.lista_cultos_semanais = lista_cultos_semanais.map(
        (cultoGeralId) => ({
          connect: {
            id: cultoGeralId,
          },
        }),
      ) as CultoGeralConnect[];
    }

    return await prisma?.cultoGeral.update({
      where: {
        id: id,
      },
      data: updateCultoGeralInput,
    });
  }

  async deleteCultoGeral(id: string) {
    return await prisma?.cultoGeral.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoGeralRepositorie();
