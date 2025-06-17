import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { CultoIndividualData } from "../../Controllers/Culto/CultoIndividual";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

type UpdateCultoIndividualInput = Prisma.CultoIndividualUpdateInput & {
  presencas_culto?: { connect: { id: string } }[];
};

interface CultoIndividualConnect {
  connect: { id: string };
}

// Tipo esperado pelo frontend
type CultoData = {
  nome: string;
  data: string;
  presentes: number;
  capacidade: number;
  comparativo: number;
};

type CultoTipo = "edificacao" | "cpd" | "celebracao-manha" | "celebracao-tarde";

type AttendanceData = Record<CultoTipo, CultoData[]>;

class CultoIndividualRepositorie {
  async getAttendanceData({
    startDate,
    endDate,
  }: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<AttendanceData> {
    const prisma = createPrismaInstance();

    try {
      // Definir intervalo de datas padrão se não fornecido
      const defaultStart =
        startDate || dayjs().subtract(30, "day").startOf("day").toDate();
      const defaultEnd = endDate || dayjs().endOf("day").toDate(); // Até o final do dia atual

      console.log("Intervalo de busca:", {
        defaultStart: defaultStart.toISOString(),
        defaultEnd: defaultEnd.toISOString(),
      });

      // Contar a capacidade (total de membros da igreja)
      const capacidadePadrao = await prisma!.user.count();

      // Buscar todos os cultos da igreja, sem filtro por supervisão
      const cultos = await prisma!.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: defaultStart,
            lte: defaultEnd,
          },
        },
        select: {
          id: true,
          data_inicio_culto: true,
          presencas_culto: {
            where: {
              status: true, // Apenas presenças confirmadas
            },
            select: {
              id: true,
            },
          },
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          data_inicio_culto: "desc",
        },
      });

      console.log(
        "Cultos encontrados:",
        cultos.map((c) => ({
          id: c.id,
          data: c.data_inicio_culto.toISOString(),
          presentes: c.presencas_culto.length,
          culto_semana: c.culto_semana?.nome,
        }))
      );

      if (!cultos.length) {
        throw new Error("Nenhum culto encontrado no intervalo especificado");
      }

      // Mapeamento para o formato esperado
      const attendanceData: AttendanceData = {
        edificacao: [],
        cpd: [],
        "celebracao-manha": [],
        "celebracao-tarde": [],
      };

      cultos.forEach((culto) => {
        const presentes = culto.presencas_culto.length;
        const dataFormatada = dayjs(culto.data_inicio_culto).format(
          "DD/MM/YYYY"
        );
        const cultoData: CultoData = {
          nome: culto.culto_semana?.nome || "Culto Sem Nome",
          data: dataFormatada,
          presentes,
          capacidade: capacidadePadrao,
          comparativo: 0,
        };

        // Mapeamento baseado no ID do culto_semana
        switch (culto.culto_semana?.id) {
          case "4064be1d-bf55-4851-9f76-99c4554a6265": // Culto de Quarta (exemplo para Edificação)
            attendanceData.edificacao.push(cultoData);
            break;
          case "84acfbe4-c7e0-4841-813c-04731ffa9c67": // Culto de Sábado (exemplo para CPD)
            attendanceData.cpd.push(cultoData);
            break;
          case "cab02f30-cade-46ca-b118-930461013d53": // Culto de Domingo Manhã
            attendanceData["celebracao-manha"].push(cultoData);
            break;
          case "ea08ec9b-3d1b-42f3-818a-ec53ef99b78f": // Culto de Domingo Tarde
            attendanceData["celebracao-tarde"].push(cultoData);
            break;
          default:
            attendanceData.edificacao.push(cultoData);
            break;
        }
      });

      // Ordenar por data
      Object.keys(attendanceData).forEach((key) => {
        attendanceData[key as CultoTipo].sort((a, b) =>
          dayjs(b.data, "DD/MM/YYYY").diff(dayjs(a.data, "DD/MM/YYYY"))
        );
      });

      // Calcular comparativo
      Object.keys(attendanceData).forEach((key) => {
        const cultos = attendanceData[key as CultoTipo];
        for (let i = 0; i < cultos.length; i++) {
          if (i > 0) {
            cultos[i].comparativo =
              cultos[i].presentes - cultos[i - 1].presentes;
          }
        }
      });

      return attendanceData;
    } finally {
      await disconnectPrisma();
    }
  }

  // Dados considerando a supervisao
  // async getAttendanceData({
  //   startDate,
  //   endDate,
  //   superVisionId,
  // }: {
  //   startDate?: Date;
  //   endDate?: Date;
  //   superVisionId?: string;
  // }): Promise<AttendanceData> {
  //   const prisma = createPrismaInstance();

  //   try {
  //     // Definir intervalo de datas padrão se não fornecido
  //     const defaultStart = startDate || dayjs().subtract(30, "day").toDate();
  //     const defaultEnd = endDate || dayjs().endOf("day").toDate();

  //     console.log("Intervalo de busca:", {
  //       defaultStart: defaultStart.toISOString(),
  //       defaultEnd: defaultEnd.toISOString(),
  //     });

  //     // Contar a capacidade (total de membros esperados)
  //     const capacidadePadrao = await prisma!.user.count({
  //       where: superVisionId
  //         ? { supervisaoId: superVisionId } // Filtra por supervisão, se fornecida
  //         : {}, // Caso contrário, total geral
  //     });

  //     // Buscar cultos com presenças filtradas por status: true
  //     const cultos = await prisma!.cultoIndividual.findMany({
  //       where: {
  //         data_inicio_culto: {
  //           gte: defaultStart,
  //           lte: defaultEnd,
  //         },
  //         ...(superVisionId && {
  //           presencas_culto: {
  //             some: {
  //               membro: {
  //                 supervisao_pertence: {
  //                   id: { equals: superVisionId },
  //                 },
  //               },
  //             },
  //           },
  //         }),
  //       },
  //       select: {
  //         id: true,
  //         data_inicio_culto: true,
  //         presencas_culto: {
  //           where: {
  //             status: true, // Apenas presenças confirmadas
  //           },
  //           select: {
  //             id: true,
  //           },
  //         },
  //         culto_semana: {
  //           select: {
  //             id: true,
  //             nome: true,
  //           },
  //         },
  //       },
  //       orderBy: {
  //         data_inicio_culto: "desc",
  //       },
  //     });

  //     if (!cultos) {
  //       throw new Error("Nenhum culto encontrado");
  //     }

  //     // Mapeamento dos cultos para o formato esperado
  //     const attendanceData: AttendanceData = {
  //       edificacao: [],
  //       cpd: [],
  //       "celebracao-manha": [],
  //       "celebracao-tarde": [],
  //     };

  //     cultos.forEach((culto) => {
  //       const presentes = culto.presencas_culto.length; // Apenas status: true
  //       const dataFormatada = dayjs(culto.data_inicio_culto).format(
  //         "DD/MM/YYYY"
  //       );
  //       const cultoData: CultoData = {
  //         nome: culto.culto_semana?.nome || "Culto Sem Nome",
  //         data: dataFormatada,
  //         presentes,
  //         capacidade: capacidadePadrao, // Total de membros esperados
  //         comparativo: 0, // Será calculado depois
  //       };

  //       // Mapeamento baseado no ID do culto_semana (ajuste conforme seus IDs reais)
  //       switch (culto.culto_semana?.id) {
  //         case "4064be1d-bf55-4851-9f76-99c4554a6265": // Culto de Quarta (exemplo para Edificação)
  //           attendanceData.edificacao.push(cultoData);
  //           break;
  //         case "84acfbe4-c7e0-4841-813c-04731ffa9c67": // Culto de Sábado (exemplo para CPD)
  //           attendanceData.cpd.push(cultoData);
  //           break;
  //         case "cab02f30-cade-46ca-b118-930461013d53": // Culto de Domingo Manhã
  //           attendanceData["celebracao-manha"].push(cultoData);
  //           break;
  //         case "ea08ec9b-3d1b-42f3-818a-ec53ef99b78f": // Culto de Domingo Tarde
  //           attendanceData["celebracao-tarde"].push(cultoData);
  //           break;
  //         default:
  //           // Caso não mapeado, adiciona em uma categoria padrão
  //           attendanceData.edificacao.push(cultoData);
  //           break;
  //       }
  //     });

  //     // Ordenar os dados por data
  //     Object.keys(attendanceData).forEach((key) => {
  //       attendanceData[key as CultoTipo].sort((a, b) =>
  //         dayjs(b.data, "DD/MM/YYYY").diff(dayjs(a.data, "DD/MM/YYYY"))
  //       );
  //     });

  //     // Calcular comparativo (diferença de presenças em relação ao culto anterior)
  //     Object.keys(attendanceData).forEach((key) => {
  //       const cultos = attendanceData[key as CultoTipo];
  //       for (let i = 0; i < cultos.length; i++) {
  //         if (i > 0) {
  //           cultos[i].comparativo =
  //             cultos[i].presentes - cultos[i - 1].presentes;
  //         }
  //       }
  //     });

  //     return attendanceData;
  //   } finally {
  //     await disconnectPrisma();
  //   }
  // }

  async findAllIntervall(
    startDate: Date,
    endDate: Date,
    superVisionId: string
  ) {
    const dataFim = dayjs(endDate).endOf("day").toISOString();
    const prisma = createPrismaInstance();

    try {
      const result = await prisma?.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: new Date(startDate),
            lte: new Date(dataFim),
          },
          presencas_culto: {
            some: {
              membro: {
                supervisao_pertence: {
                  id: { equals: superVisionId },
                },
              },
            },
          },
        },
        orderBy: {
          data_inicio_culto: "asc", // Ordena em ordem crescente
        },
        select: {
          id: true,
          data_inicio_culto: true,
          presencas_culto: {
            where: {
              membro: {
                supervisao_pertence: {
                  id: { equals: superVisionId },
                },
              },
            },
            select: {
              id: true,
              status: true,
              date_create: true,
              membro: {
                select: {
                  id: true,
                  first_name: true,
                  image_url: true,
                  presencas_cultos: false,
                  supervisao_pertence: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                  celula: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });
      const totalCultosPeriodo = result.length;
      const cultoPrimicia = result.reduce((total, primicia) => {
        return (
          total +
          (primicia.culto_semana?.id === "bffb62af-8d03-473a-ba20-ab5a9d7dafbe"
            ? 1
            : 0)
        );
      }, 0);

      const cultoDomingoSacrificio = result.reduce((total, sacrificio) => {
        return (
          total +
          (sacrificio.culto_semana?.id ===
          "e7bc72d1-8faa-4bbe-9c24-475b64f956cf"
            ? 1
            : 0)
        );
      }, 0);

      const cultoQuarta = result.reduce((total, quarta) => {
        return (
          total +
          (quarta.culto_semana?.id === "4064be1d-bf55-4851-9f76-99c4554a6265"
            ? 1
            : 0)
        );
      }, 0);

      const cultoSabado = result.reduce((total, sabado) => {
        return (
          total +
          (sabado.culto_semana?.id === "84acfbe4-c7e0-4841-813c-04731ffa9c67"
            ? 1
            : 0)
        );
      }, 0);

      const cultoDomingoManha = result.reduce((total, domingoManha) => {
        return (
          total +
          (domingoManha.culto_semana?.id ===
          "cab02f30-cade-46ca-b118-930461013d53"
            ? 1
            : 0)
        );
      }, 0);

      const cultoDomingoTarde = result.reduce((total, domingoTarde) => {
        return (
          total +
          (domingoTarde.culto_semana?.id ===
          "ea08ec9b-3d1b-42f3-818a-ec53ef99b78f"
            ? 1
            : 0)
        );
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
    } finally {
      await disconnectPrisma();
    }
  }

  async getCultosPresencaPorTipoEAno(tipos: string[]) {
    const prisma = createPrismaInstance();
    const inicioDoAno = new Date(new Date().getFullYear(), 0, 1);
    const hoje = new Date();

    try {
      const cultos = await prisma.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: inicioDoAno,
            lte: hoje,
          },
          culto_semana: {
            nome: {
              in: tipos,
            },
          },
        },
        select: {
          id: true,
          data_inicio_culto: true,
          culto_semana: {
            select: {
              nome: true,
            },
          },
          presencas_culto: {
            select: {
              status: true,
            },
          },
        },
      });

      console.log("cultos: ", cultos);

      // Agrupamento dos dados
      const resultado = tipos.map((tipo) => {
        const cultosDoTipo = cultos.filter(
          (c) => c.culto_semana?.nome === tipo
        );
        return {
          tipo,
          cultos: cultosDoTipo.map((culto) => {
            const presentes = culto.presencas_culto.filter(
              (p) => p.status
            ).length;
            const ausentes = culto.presencas_culto.filter(
              (p) => !p.status
            ).length;

            return {
              data: culto.data_inicio_culto,
              presentes,
              ausentes,
            };
          }),
        };
      });
      console.log("resultado: ", resultado);
      return resultado;
    } finally {
      await disconnectPrisma();
    }
  }

  async findAll({
    startDate,
    endDate,
    limit,
    offset,
  }: {
    startDate: Date;
    endDate: Date;
    limit: number;
    offset: number;
  }) {
    const prisma = createPrismaInstance();

    try {
      const result = await prisma.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: {
          id: true,
          data_inicio_culto: true,
          data_termino_culto: true,
          status: true,
          // presencas_culto: {
          //   select: {
          //     status: true,
          //     membro: {
          //       select: {
          //         id: true,
          //         first_name: true,
          //         supervisao_pertence: true,
          //       },
          //     },
          //   },
          // },
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        take: limit,
        skip: offset,
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async findPerPeriodDetails(firstDayOfMonth: Date, lastDayOfPeriod: Date) {
    const prisma = createPrismaInstance();
    try {
      const lastDayOfPeriodQuery = dayjs(lastDayOfPeriod).endOf("day");
      const result = await prisma?.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: firstDayOfMonth,
            lte: lastDayOfPeriodQuery.toISOString(),
          },
        },
        orderBy: {
          data_inicio_culto: "asc", // Ordena em ordem crescente
        },
        select: {
          id: true,
          data_inicio_culto: true,
          data_termino_culto: true,
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async findPerPeriod(firstDayOfMonth: Date, lastDayOfMonth: Date) {
    const prisma = createPrismaInstance();
    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, "day");
      const result = await prisma?.cultoIndividual.findMany({
        where: {
          data_inicio_culto: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonthPlusOneDay.toISOString(),
          },
        },
        orderBy: {
          data_inicio_culto: "asc", // Ordena em ordem crescente
        },
        select: {
          id: true,
          data_inicio_culto: true,
          data_termino_culto: true,
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();

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
                },
              },
            },
          },
          culto_semana: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async createCultoIndividual(cultoIndividualDataForm: CultoIndividualData) {
    const prisma = createPrismaInstance();

    try {
      const { data } = cultoIndividualDataForm;

      console.log("Dados recebidos do frontend", cultoIndividualDataForm);

      console.log("Data Início (antes de criar)", data.data_inicio_culto);
      console.log("Data Término (antes de criar)", data.data_termino_culto);
      const cultoIndividual = await prisma?.cultoIndividual.create({
        data: {
          data_inicio_culto: data.data_inicio_culto,
          data_termino_culto: data.data_termino_culto,
          status: data.status,
          date_update: new Date(),
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
            presencas_culto: {
              connect: data.presencas_culto.map((cultoIndividualId) => ({
                id: cultoIndividualId,
              })),
            },
          },
        });
      }

      return cultoIndividual;
    } finally {
      await disconnectPrisma();
    }
  }

  async updateCultoIndividual(
    id: string,
    cultoIndividualDataForm: CultoIndividualData
  ) {
    const prisma = createPrismaInstance();
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
        updateCultoIndividualInput.presencas_culto = data.presencas_culto.map(
          (presencaCultoId) => ({
            connect: {
              id: presencaCultoId,
            },
          })
        ) as CultoIndividualConnect[];
      }
      const result = await prisma?.cultoIndividual.update({
        where: {
          id: id,
        },
        data: updateCultoIndividualInput,
      });

      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async deleteCultoIndividual(id: string) {
    const prisma = createPrismaInstance();

    try {
      const result = await prisma?.cultoIndividual.delete({
        where: {
          id: id,
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }
}

export default new CultoIndividualRepositorie();
