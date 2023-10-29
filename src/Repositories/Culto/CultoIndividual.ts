import { Prisma, PrismaClient } from "@prisma/client";
import { CultoIndividualData, CultoIndividualForDate } from "../../Controllers/Culto/CultoIndividual";
import prisma from "../../services/prisma";

type UpdateCultoIndividualInput = Prisma.CultoIndividualUpdateInput & {
  presencas_culto?: { connect: { id: string } }[];
};

interface CultoIndividualConnect {
  connect: { id: string };
}

class CultoIndividualRepositorie {
  async findAllIntervall(startDate: Date, endDate: Date, superVisionId: string) {
    const result = await prisma?.cultoIndividual.findMany({
        where: {
            data_inicio_culto: {
                gte: startDate,
                lte: endDate,
            },
            presencas_culto: {
                some: {
                    membro: {
                      supervisao_pertence: {
                        id: { equals: superVisionId }
                      },
                    }
                }
            }
        },
        orderBy: {
          data_inicio_culto: 'asc' // Ordena em ordem crescente
      },
        select: {
            id: true,
            data_inicio_culto: true,
            presencas_culto: {
                where: {
                    membro: {
                      supervisao_pertence: {
                        id: { equals: superVisionId }
                      },
                    }
                },
                select: {
                    status: true,
                    membro: {
                        select: {
                            id: true,
                            first_name: true,
                            supervisao_pertence: {
                                select: {
                                    id: true,
                                    nome: true,
                                }
                            },
                            celula: {
                                select: {
                                    id: true,
                                    nome: true,
                                }
                            }
                        }
                    }
                }
            },
            culto_semana: {
                select: {
                    nome: true
                },
            },
        },
    });
    await prisma?.$disconnect();
    return result;
}


  async findAll() {
    return await prisma?.cultoIndividual.findMany({
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
    return await prisma?.cultoIndividual.findUnique({
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
    const { data } = cultoIndividualDataForm;

    console.log('Dados recebidos do frontend', cultoIndividualDataForm);

    console.log('Data Início (antes de criar)', data.data_inicio_culto);
    console.log('Data Término (antes de criar)', data.data_termino_culto);

    const cultoIndividual = await prisma?.cultoIndividual.create({
      data: {
        data_inicio_culto: data.data_inicio_culto,
        data_termino_culto: data.data_termino_culto,
        status: data.status,
        date_update: new Date()
      },
    });
    // Conecte os relacionamentos opcionais, se fornecidos
  if (data.culto_semana) {
    await prisma?.cultoIndividual.update({
      where: { id: cultoIndividual?.id },
      data: {
        culto_semana: { connect: { id: data.culto_semana } },
      },
    });
  }

    if (data.presencas_culto) {
      await prisma?.cultoIndividual.update({
        where: { id: cultoIndividual?.id },
        data: {
          presencas_culto: { connect: data.presencas_culto.map((cultoIndividualId) => ({ id: cultoIndividualId })) },
        },
      });
    }

    return cultoIndividual
  }

  async updateCultoIndividual(id: string, cultoIndividualDataForm: CultoIndividualData) {
    const { data } = cultoIndividualDataForm;
    const updateCultoIndividualInput: UpdateCultoIndividualInput = {
        data_inicio_culto: data.data_inicio_culto,
        data_termino_culto: data.data_termino_culto,
        status: data.status,
        date_update: new Date(),
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (data.culto_semana !== undefined) {
      updateCultoIndividualInput.culto_semana = {
        connect: {
          id: data.culto_semana,
        },
      };
    }

    if (data.presencas_culto !== undefined) {
      updateCultoIndividualInput.presencas_culto = data.presencas_culto.map((presencaCultoId) => ({
        connect: {
          id: presencaCultoId,
        },
      })) as CultoIndividualConnect[];
    }
    return await prisma?.cultoIndividual.update({
      where: {
        id: id,
      },
      data: updateCultoIndividualInput,
    });
  }

  async deleteCultoIndividual(id: string) {
    return await prisma?.cultoIndividual.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new CultoIndividualRepositorie();
