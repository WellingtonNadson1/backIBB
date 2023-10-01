import { Prisma, PrismaClient } from "@prisma/client";
import { CultoIndividualData } from "../../Controllers/Culto/CultoIndividual";

const prisma = new PrismaClient();

type UpdateCultoIndividualInput = Prisma.CultoIndividualUpdateInput & {
  presencas_culto?: { connect: { id: string } }[];
};

interface CultoIndividualConnect {
  connect: { id: string };
}

class CultoIndividualRepositorie {
  async findAll() {
    return await prisma.cultoIndividual.findMany({
      select: {
        id: true,
        data_inicio_culto: true,
        data_termino_culto: true,
        status: true,
        presencas_culto: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
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
        presencas_culto: {
          select: {
            id: true,
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
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
    const { presencas_culto, culto_semana, data_inicio_culto, data_termino_culto, status } = cultoIndividualDataForm;
    console.log('Dados recebidos do frontend', cultoIndividualDataForm);

    console.log('Data Início (antes de criar)', cultoIndividualDataForm.data_inicio_culto);
    console.log('Data Término (antes de criar)', cultoIndividualDataForm.data_termino_culto);

    const cultoIndividual = await prisma.cultoIndividual.create({
      data: {
        data_inicio_culto: data_inicio_culto,
        data_termino_culto: data_termino_culto,
        status: status,
        date_update: new Date()
      },
    });
    // Conecte os relacionamentos opcionais, se fornecidos
  if (culto_semana) {
    await prisma.cultoIndividual.update({
      where: { id: cultoIndividual.id },
      data: {
        culto_semana: { connect: { id: culto_semana } },
      },
    });
  }

    if (presencas_culto) {
      await prisma.cultoIndividual.update({
        where: { id: cultoIndividual.id },
        data: {
          presencas_culto: { connect: presencas_culto.map((cultoIndividualId) => ({ id: cultoIndividualId })) },
        },
      });
    }

    return cultoIndividual
  }

  async updateCultoIndividual(id: string, cultoIndividualDataForm: CultoIndividualData) {
    const { presencas_culto, culto_semana, ...CultoIndividualData } = cultoIndividualDataForm;
    const updateCultoIndividualInput: UpdateCultoIndividualInput = {
      ...CultoIndividualData,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (culto_semana !== undefined) {
      updateCultoIndividualInput.culto_semana = {
        connect: {
          id: culto_semana,
        },
      };
    }

    if (presencas_culto !== undefined) {
      updateCultoIndividualInput.presencas_culto = presencas_culto.map((presencaCultoId) => ({
        connect: {
          id: presencaCultoId,
        },
      })) as CultoIndividualConnect[];
    }
    return await prisma.cultoIndividual.update({
      where: {
        id: id,
      },
      data: updateCultoIndividualInput,
    });
  }

  async deleteCultoIndividual(id: string) {
    return await prisma.cultoIndividual.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoIndividualRepositorie();
