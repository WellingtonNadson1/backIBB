import { PrismaClient } from "@prisma/client";
import { CultoIndividualData } from "../../Controllers/Culto/CultoIndividual";

const prisma = new PrismaClient();

class CultoIndividualRepositorie {
  async findAll() {
    return await prisma.cultoIndividual.findMany({
      select: {
        id: true,
        data_inicio_culto: true,
        data_termino_culto: true,
        status: true,
        culto_semana: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.cultoIndividual.findUnique({
      where: {
        id: id,
      },
      select: {
        data_inicio_culto: true,
        data_termino_culto: true,
        status: true,
        culto_semana: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async createCultoIndividual(cultoIndividualDataForm: CultoIndividualData) {
    const { presencas_culto, culto_semana, ...CultoIndividualData } = cultoIndividualDataForm;
    return await prisma.cultoIndividual.create({
      data: {
        ...CultoIndividualData,
        culto_semana: {
          connect: {
            id: culto_semana,
          },
        },
        presencas_culto: {
          connect: presencas_culto ? presencas_culto.map((presencaId) => ({ id: presencaId })) : [],
        },
      },
    });
  }

  async updateCultoIndividual(id: string, cultoIndividualDataForm: CultoIndividualData) {
    const { presencas_culto, culto_semana, ...CultoIndividualData } = cultoIndividualDataForm;
    return await prisma.cultoIndividual.update({
      where: {
        id: id,
      },
      data: {
        ...CultoIndividualData,
        culto_semana: {
          connect: {
            id: culto_semana,
          },
        },
        presencas_culto: {
          connect: presencas_culto ? presencas_culto.map((presencaId) => ({ id: presencaId })) : [],
        },
      },
    });
  }

  async deleteCultoIndividual(id: string) {
    await prisma.cultoIndividual.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoIndividualRepositorie();
