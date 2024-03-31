import { Prisma } from "@prisma/client";
import { CultoIndividualData } from "../../Controllers/Culto/CultoIndividual";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";
import dayjs from "dayjs";

type UpdateCultoIndividualInput = Prisma.CultoIndividualUpdateInput & {
  presencas_culto?: { connect: { id: string } }[];
};

interface CultoIndividualConnect {
  connect: { id: string };
}

class CultoIndividualRepositorie {
  async findAllIntervall(startDate: Date, endDate: Date, superVisionId: string) {
    console.log('startDate', startDate)
    console.log('endDate', endDate)


    const prisma = createPrismaInstance()

    try {
      const result = await prisma?.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: new Date(startDate),
            lte: new Date(endDate),
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
              id: true,
              status: true,
              date_create: true,
              membro: {
                select: {
                  id: true,
                  first_name: true,
                  presencas_cultos: false,
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
              id: true,
              nome: true,
            },
          },
        },
      });
      const totalCultosPeriodo = result.length
      const cultoPrimicia = result.reduce((total, primicia) => {
        return total + (primicia.culto_semana?.id === 'bffb62af-8d03-473a-ba20-ab5a9d7dafbe' ? 1 : 0);
      }, 0);

      const cultoDomingoSacrificio = result.reduce((total, sacrificio) => {
        return total + (sacrificio.culto_semana?.id === 'e7bc72d1-8faa-4bbe-9c24-475b64f956cf' ? 1 : 0);
      }, 0);

      const cultoQuarta = result.reduce((total, quarta) => {
        return total + (quarta.culto_semana?.id === '4064be1d-bf55-4851-9f76-99c4554a6265' ? 1 : 0);
      }, 0);

      const cultoSabado = result.reduce((total, sabado) => {
        return total + (sabado.culto_semana?.id === '84acfbe4-c7e0-4841-813c-04731ffa9c67' ? 1 : 0);
      }, 0);

      const cultoDomingoManha = result.reduce((total, domingoManha) => {
        return total + (domingoManha.culto_semana?.id === 'cab02f30-cade-46ca-b118-930461013d53' ? 1 : 0);
      }, 0);

      const cultoDomingoTarde = result.reduce((total, domingoTarde) => {
        return total + (domingoTarde.culto_semana?.id === 'ea08ec9b-3d1b-42f3-818a-ec53ef99b78f' ? 1 : 0);
      }, 0);

      return {
        ...result,
        cultoQuarta: cultoQuarta,
        cultoPrimicia: cultoPrimicia,
        cultoDomingoSacrificio: cultoDomingoSacrificio,
        cultoSabado: cultoSabado,
        cultoDomingoManha: cultoDomingoManha,
        cultoDomingoTarde: cultoDomingoTarde,
        totalCultosPeriodo: totalCultosPeriodo,
      };
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findAll() {
    const prisma = createPrismaInstance()

    try {
      const result = await prisma?.cultoIndividual.findMany({
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
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findPerPeriod(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    const prisma = createPrismaInstance()
    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, 'day');
      const result = await prisma?.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonthPlusOneDay.toISOString(),
          },
        },
        orderBy: {
          data_inicio_culto: 'asc' // Ordena em ordem crescente
        },
        select: {
          id: true,
          data_inicio_culto: true,
          data_termino_culto: true,
          culto_semana: {
            select: {
              id: true,
              nome: true
            },
          },
        },
      });
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findById(id: string) {
    const prisma = createPrismaInstance()

    try {
      const result = await prisma?.cultoIndividual.findUnique({
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
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async createCultoIndividual(cultoIndividualDataForm: CultoIndividualData) {
    const prisma = createPrismaInstance()

    try {
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
    finally {
      await disconnectPrisma()
    }
  }

  async updateCultoIndividual(id: string, cultoIndividualDataForm: CultoIndividualData) {
    const prisma = createPrismaInstance()
    try {
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
      const result = await prisma?.cultoIndividual.update({
        where: {
          id: id,
        },
        data: updateCultoIndividualInput,
      });

      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async deleteCultoIndividual(id: string) {
    const prisma = createPrismaInstance()

    try {
      const result = await prisma?.cultoIndividual.delete({
        where: {
          id: id,
        },
      });
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }
}

export default new CultoIndividualRepositorie();
