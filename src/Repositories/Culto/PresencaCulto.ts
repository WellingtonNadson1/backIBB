import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CultoIndividualRepositorie } from ".";
import {
  PresencaCultoData,
  PresencaCultoDataNew,
} from "../../Controllers/Culto/PresencaCulto";
import { createPrismaInstance } from "../../services/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

class PresencaCultoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    console.log("Data Brasil (Date):", dataBrasilDate);
  }

  async cultosRelatoriosSupervisor(
    startDate: Date,
    endDate: Date,
    supervisionScopeIds: string[],
    cargoLideranca: string[],
  ) {
    try {
      const prisma = createPrismaInstance();
      const coverageIds = Array.from(
        new Set(
          (supervisionScopeIds ?? [])
            .filter((id): id is string => typeof id === "string")
            .map((id) => id.trim())
            .filter((id) => id.length > 0),
        ),
      );

      const dataInicio = dayjs(startDate).toISOString();
      const dataFim = dayjs(endDate).endOf("day").toISOString();

      // Consulta para buscar membros da supervisão que compareceram aos cultos no intervalo de tempo
      const membrosCompareceramCultos = await prisma?.user.findMany({
        where: {
          supervisaoId: { in: coverageIds },
          cargoDeLiderancaId: {
            in: cargoLideranca,
          },
        },
        // Use a opção 'select' para selecionar apenas os campos desejados
        select: {
          id: true, // Inclua os campos que você deseja
          first_name: true,
          last_name: true,
          image_url: true,
          // Adicione outros campos necessários
          presencas_cultos: {
            where: {
              presenca_culto: {
                AND: [
                  { data_inicio_culto: { gte: dataInicio } },
                  { data_termino_culto: { lte: dataFim } },
                ],
              },
            },
            select: {
              // Selecione apenas os campos relevantes em 'presencas_cultos'
              status: true,
              cultoIndividualId: true,
              date_create: true,
              presenca_culto: {
                select: {
                  data_inicio_culto: true,
                  culto_semana: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
          cargo_de_lideranca: {
            select: {
              nome: true,
            },
          },
        },
      });

      const cultosIndividuaisForDate =
        await CultoIndividualRepositorie.findAllIntervall(
          startDate,
          endDate,
          coverageIds,
        );

      const totalCultosPeriodo = cultosIndividuaisForDate.totalCultosPeriodo;
      const cultoQuarta = cultosIndividuaisForDate.cultoQuarta;
      const cultoPrimicia = cultosIndividuaisForDate.cultoPrimicia;
      const cultoDomingoSacrificio =
        cultosIndividuaisForDate.cultoDomingoSacrificio;
      const cultoSabado = cultosIndividuaisForDate.cultoSabado;
      const totalCultosDomingoManha =
        cultosIndividuaisForDate.cultoDomingoManha;
      const totalCultosDomingoTarde =
        cultosIndividuaisForDate.cultoDomingoTarde;

      // Filtrar as presenças dentro do intervalo de datas
      const membrosCompareceramCultosFiltrados = membrosCompareceramCultos.map(
        (membro) => {
          const presencasFiltradas = membro.presencas_cultos.filter(
            (presenca) => {
              const dataPresenca = dayjs(presenca.date_create).utcOffset(0);
              return (
                dataPresenca.isAfter(dayjs(dataInicio).utcOffset(0)) &&
                dataPresenca.isBefore(dayjs(dataFim).utcOffset(0))
              );
            },
          );

          const quantidadeCultosPresentes = presencasFiltradas.reduce(
            (total, presente) => {
              return total + (presente.status === true ? 1 : 0);
            },
            0,
          );

          const quantidadeCultosPresentePrimicia = presencasFiltradas.reduce(
            (total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "bffb62af-8d03-473a-ba20-ab5a9d7dafbe"
                  ? 1
                  : 0)
              );
            },
            0,
          );

          const quantidadeCultosPresenteDomingoSacrificio =
            presencasFiltradas.reduce((total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "e7bc72d1-8faa-4bbe-9c24-475b64f956cf"
                  ? 1
                  : 0)
              );
            }, 0);

          const quantidadeCultosPresenteQuarta = presencasFiltradas.reduce(
            (total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "4064be1d-bf55-4851-9f76-99c4554a6265"
                  ? 1
                  : 0)
              );
            },
            0,
          );

          const quantidadeCultosPresenteSabado = presencasFiltradas.reduce(
            (total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "84acfbe4-c7e0-4841-813c-04731ffa9c67"
                  ? 1
                  : 0)
              );
            },
            0,
          );

          const quantidadeCultosPresenteDomingoManha =
            presencasFiltradas.reduce((total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "cab02f30-cade-46ca-b118-930461013d53"
                  ? 1
                  : 0)
              );
            }, 0);

          const quantidadeCultosPresenteDomingoTarde =
            presencasFiltradas.reduce((total, presente) => {
              return (
                total +
                (presente.status === true &&
                presente.presenca_culto?.culto_semana?.id ===
                  "ea08ec9b-3d1b-42f3-818a-ec53ef99b78f"
                  ? 1
                  : 0)
              );
            }, 0);

          const porcentagemPresencaTotal = (
            (quantidadeCultosPresentes / totalCultosPeriodo) *
            100
          )
            .toFixed(2)
            .slice(0, 5);

          let porcentagemPresencaQuarta = undefined;
          if (quantidadeCultosPresenteQuarta !== 0) {
            porcentagemPresencaQuarta = (
              (quantidadeCultosPresenteQuarta / cultoQuarta) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaQuarta = (0.0).toFixed(2);
          }

          let porcentagemPresencaPrimicia = undefined;
          if (quantidadeCultosPresentePrimicia !== 0) {
            porcentagemPresencaPrimicia = (
              (quantidadeCultosPresentePrimicia / cultoPrimicia) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaPrimicia = (0.0).toFixed(2);
          }

          let porcentagemPresencaDomingoSacrificio = undefined;
          if (quantidadeCultosPresenteDomingoSacrificio !== 0) {
            porcentagemPresencaDomingoSacrificio = (
              (quantidadeCultosPresenteDomingoSacrificio /
                cultoDomingoSacrificio) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaDomingoSacrificio = (0.0).toFixed(2);
          }

          let porcentagemPresencaSabado = undefined;
          if (quantidadeCultosPresenteSabado !== 0) {
            porcentagemPresencaSabado = (
              (quantidadeCultosPresenteSabado / cultoSabado) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaSabado = (0.0).toFixed(2);
          }

          let porcentagemPresencaTotalDomingoManha = undefined;
          if (quantidadeCultosPresenteDomingoManha !== 0) {
            porcentagemPresencaTotalDomingoManha = (
              (quantidadeCultosPresenteDomingoManha / totalCultosDomingoManha) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaTotalDomingoManha = (0.0).toFixed(2);
          }

          let porcentagemPresencaTotalDomingoTarde = undefined;
          if (quantidadeCultosPresenteDomingoTarde !== 0) {
            porcentagemPresencaTotalDomingoTarde = (
              (quantidadeCultosPresenteDomingoTarde / totalCultosDomingoTarde) *
              100
            )
              .toFixed(2)
              .slice(0, 5);
          } else {
            porcentagemPresencaTotalDomingoTarde = (0.0).toFixed(2);
          }

          const cultos = {
            porcentagemPresencaTotal,
            porcentagemPresencaQuarta,
            porcentagemPresencaPrimicia,
            porcentagemPresencaDomingoSacrificio,
            porcentagemPresencaSabado,
            porcentagemPresencaTotalDomingoManha,
            porcentagemPresencaTotalDomingoTarde,
          };

          return {
            ...membro,
            presencasFiltradas,
            cultos: cultos,
          };
        },
      );

      return membrosCompareceramCultosFiltrados;
    } catch (error) {
      console.error("Erro:", error);
      return "Erro interno do servidor";
    } finally {
    }
  }

  async cultosRelatorios(params: {
    supervisaoId: string;
    startOfInterval: string;
    endOfInterval: string;
  }) {
    const prisma = createPrismaInstance();

    try {
      const result = await prisma.cultoIndividual.findMany({
        where: {
          data_inicio_culto: { gte: params.startOfInterval },
          data_termino_culto: { lte: params.endOfInterval },
        },
        include: {
          presencas_culto: {
            include: {
              membro: {
                select: {
                  id: true,
                  first_name: true,
                  celula: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                  supervisao_pertence: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      console.log(result);
      return result;
    } finally {
    }
  }

  async findAll() {
    const prisma = createPrismaInstance();

    try {
      const result = await prisma.presencaCulto.findMany({
        select: {
          id: true,
          status: true,
          userId: true,
          cultoIndividualId: true,
          membro: {
            select: {
              id: true,
              first_name: true,
              celula: {
                select: {
                  nome: true,
                },
              },
            },
          },
          date_create: true,
          date_update: true,
        },
      });

      return result;
    } finally {
    }
  }

  async findPresencasRegistradas(presence_culto: string, membrosIds: string[]) {
    const prisma = createPrismaInstance();

    const result = await prisma.presencaCulto.findMany({
      where: {
        cultoIndividualId: presence_culto,
        userId: { in: membrosIds },
      },
      select: {
        userId: true,
      },
    });

    return result.map((r) => r.userId);
  }

  async findFirstPresenceAllMembers({
    presence_culto,
    membro,
  }: PresencaCultoDataNew) {
    const prisma = createPrismaInstance();
    console.log({ presence_culto });
    try {
      // Mapeia apenas o ID dos membros
      const idsMembros = membro.map((m) => m.id);

      // Verifica a existência de registros de presença para cada membro e culto individual
      const results = await Promise.all(
        idsMembros.map(async (userId) => {
          const result = await prisma.presencaCulto.findFirst({
            where: {
              cultoIndividualId: presence_culto,
              userId: userId,
            },
          });
          return result;
        }),
      );

      // Filtra os resultados para excluir nulos (caso não haja registro para um membro específico)
      const filteredResults = results.filter((result) => result !== null);

      console.log({ filteredResults });

      if (filteredResults.length > 0) {
        return {
          sucesso: "Registro já realizado",
          result: filteredResults,
        };
      } else {
        return {
          sucesso: "Nenhum registro encontrado",
          result: [],
        };
      }
    } catch (error) {
      console.error("Erro ao buscar presenças:", error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  async findFirst({
    presenca_culto,
    membro,
  }: {
    presenca_culto: string;
    membro: string;
  }) {
    const prisma = createPrismaInstance();

    const result = await prisma.presencaCulto.findFirst({
      where: {
        presenca_culto: { id: presenca_culto },
        membro: { id: membro },
      },
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        presenca_culto: true,
      },
    });

    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();

    const result = await prisma.presencaCulto.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        status: true,
        membro: {
          select: {
            id: true,
            first_name: true,
            celula: {
              select: {
                nome: true,
              },
            },
          },
        },
        presenca_culto: true,
      },
    });

    return result;
  }

  async findByIdCulto(culto: string, lider: string) {
    const prisma = createPrismaInstance();
    console.log("culto", culto);
    console.log("lider", lider);

    const result = await prisma.presencaCulto.findFirst({
      where: {
        cultoIndividualId: culto,
        userId: lider,
      },
      select: {
        id: true,
        status: true,
        presenca_culto: true,
      },
    });

    return result;
  }

  // repo
  // PresencaCultoRepositorie.ts
  async findDetailsByCultoAndCelula(cultoId: string, celulaId: string) {
    const prisma = createPrismaInstance();

    const items = await prisma.presencaCulto.findMany({
      where: {
        cultoIndividualId: cultoId,
        membro: { celulaId }, // ✅ aqui é a chave
      },
      select: {
        userId: true,
        status: true,
        date_update: true,
      },
    });

    return {
      exists: items.length > 0,
      items,
      lastUpdate: items.reduce<Date | null>(
        (acc, it) => (!acc || it.date_update > acc ? it.date_update : acc),
        null,
      ),
    };
  }

  // PresencaCultoRepositorie.ts
  async findDetailsByCultoAndUser(cultoId: string, userId: string) {
    const prisma = createPrismaInstance();

    const items = await prisma.presencaCulto.findMany({
      where: {
        cultoIndividualId: cultoId,
        userId: userId, // ✅ aqui agora é por usuário
      },
      select: {
        userId: true,
        status: true,
        date_update: true,
      },
    });

    return {
      exists: items.length > 0,
      items,
      lastUpdate: items.reduce<Date | null>(
        (acc, it) => (!acc || it.date_update > acc ? it.date_update : acc),
        null,
      ),
    };
  }

  async createPresencaCultoNew(presencaCultoDataForm: PresencaCultoDataNew) {
    const prisma = createPrismaInstance();
    try {
      const { membro, presence_culto } = presencaCultoDataForm;

      const dataBrasil = dayjs().tz("America/Sao_Paulo").toDate();

      const res = await prisma.presencaCulto.createMany({
        data: membro.map((m) => ({
          cultoIndividualId: presence_culto,
          userId: m.id,
          status: m.status, // boolean direto
          date_create: dataBrasil,
          date_update: dataBrasil,
        })),
        // se houver unique no banco, isso evita crash
        skipDuplicates: true,
      });

      console.log("createMany.count", res.count);
      return res;
    } finally {
    }
  }

  async createPresencaCulto(presencaCultoDataForm: PresencaCultoData) {
    const prisma = createPrismaInstance();

    const { membro, presenca_culto, status } = presencaCultoDataForm;
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;

    const result = await prisma.presencaCulto.create({
      data: {
        membro: {
          connect: {
            id: membro,
          },
        },
        presenca_culto: {
          connect: {
            id: presenca_culto,
          },
        },
        status: status,
        date_create: dataBrasilDate,
        date_update: date_update,
      },
    });

    return result;
  }

  async upsertManyByCulto(input: {
    presence_culto: string;
    allowUpdate: boolean;
    membro: { id: string; status: boolean }[];
  }) {
    const prisma = createPrismaInstance();
    const { presence_culto, allowUpdate, membro } = input;

    const dataBrasil = dayjs().tz("America/Sao_Paulo").toDate();

    const uniqueById = Array.from(
      new Map(membro.map((m) => [m.id, m])).values(),
    );
    const ids = uniqueById.map((m) => m.id);

    const existing = await prisma.presencaCulto.findMany({
      where: { cultoIndividualId: presence_culto, userId: { in: ids } },
      select: { userId: true },
    });

    const existingSet = new Set(existing.map((e) => e.userId));
    const toCreate = uniqueById.filter((m) => !existingSet.has(m.id));
    const toUpdate = uniqueById.filter((m) => existingSet.has(m.id));

    const createRes =
      toCreate.length > 0
        ? await prisma.presencaCulto.createMany({
            data: toCreate.map((m) => ({
              cultoIndividualId: presence_culto,
              userId: m.id,
              status: m.status,
              date_create: dataBrasil,
              date_update: dataBrasil,
            })),
            skipDuplicates: true,
          })
        : { count: 0 };

    let updatedCount = 0;
    if (allowUpdate && toUpdate.length > 0) {
      const ops = toUpdate.map((m) =>
        prisma.presencaCulto.updateMany({
          where: { cultoIndividualId: presence_culto, userId: m.id },
          data: { status: m.status, date_update: dataBrasil },
        }),
      );

      const results = await prisma.$transaction(ops);
      updatedCount = results.reduce((acc, r) => acc + (r?.count ?? 0), 0);
    }

    return {
      totalUnique: uniqueById.length,
      createdCount: createRes.count,
      updatedCount,
    };
  }

  async updatePresencaCulto(
    id: string,
    presencaCultoDataForm: PresencaCultoData,
  ) {
    const prisma = createPrismaInstance();

    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    const result = await prisma.presencaCulto.update({
      where: {
        id: id,
      },
      data: {
        ...presencaCultoData,
        membro: {
          connect: {
            id: membro,
          },
        },
        presenca_culto: {
          connect: {
            id: presencaCultoData.presenca_culto,
          },
        },
      },
    });

    return result;
  }

  async deletePresencaCulto(id: string) {
    const prisma = createPrismaInstance();

    try {
      const result = await prisma.presencaCulto.delete({
        where: {
          id: id,
        },
      });
      return result;
    } finally {
    }
  }
}

export default new PresencaCultoRepositorie();
