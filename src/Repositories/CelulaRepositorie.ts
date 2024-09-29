import { Prisma } from "@prisma/client";
import { CelulaData } from "../Controllers/CelulaController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";

function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

class CelulaRepositorie {
  async findAll() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.celula.findMany({
      select: {
        id: true,
        nome: true,
        lider: {
          select: {
            id: true,
            first_name: true,
          },
        },
        supervisao: {
          select: {
            id: true,
            nome: true,
          },
        },
        membros: {
          select: {
            id: true,
            first_name: true,
          },
        },
        date_que_ocorre: true,
        // reunioes_celula: {
        //   select: {
        //     id: true,
        //     data_reuniao: true,
        //     status: true,
        //     presencas_membros_reuniao_celula: {
        //       select: {
        //         id: true,
        //         membro: true,
        //         status: true,
        //       },
        //     },
        //   },
        // },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }

    const todayDate = new Date();
    const startOfDay = getStartOfDay(todayDate);
    const endOfDay = getEndOfDay(todayDate);

    console.log("todayDate", todayDate);
    const result = await prisma?.celula.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        membros: {
          select: {
            id: true,
            first_name: true,
            presencas_cultos: {
              where: {
                date_create: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
              },
            },
            discipulador: {
              select: {
                user_discipulador: {
                  select: {
                    id: true,
                    first_name: true,
                  },
                },
              },
            },
            discipulos: {
              select: {
                user_discipulos: {
                  select: {
                    id: true,
                    first_name: true,
                  },
                },
              },
            },
            cargo_de_lideranca: {
              select: {
                id: true,
                nome: true,
              },
            },
            situacao_no_reino: {
              select: {
                id: true,
                nome: true,
              },
            },
            user: {
              select: {
                id: true,
                first_name: true,
              },
            },
          },
        },
        lider: {
          select: {
            id: true,
            first_name: true,
          },
        },
        supervisao: {
          select: {
            id: true,
            nome: true,
          },
        },
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        date_que_ocorre: true,
        date_inicio: true,
        date_multipicar: true,
        reunioes_celula: {
          select: {
            id: true,
            data_reuniao: true,
            status: true,
            presencas_membros_reuniao_celula: {
              select: {
                id: true,
                membro: true,
                status: true,
              },
            },
          },
        },
      },
    });

    await disconnectPrisma();
    console.log(result?.membros[0].presencas_cultos);
    return result;
  }

  async createCelula(celulaDataForm: CelulaData) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const { membros, reunioes_celula, ...CelulaData } = celulaDataForm;

    const result = await prisma?.celula.create({
      data: {
        ...CelulaData,
        lider: {
          connect: {
            id: CelulaData.lider,
          },
        },
        supervisao: {
          connect: {
            id: CelulaData.supervisao,
          },
        },
        membros: {
          connect: membros ? membros.map((membroId) => ({ id: membroId })) : [],
        },
        reunioes_celula: {
          connect: reunioes_celula?.map((reuniaoCelulaId) => ({
            id: reuniaoCelulaId,
          })),
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async updateCelula(id: string, celulaDataForm: CelulaData) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const { nome, lider, reunioes_celula, supervisao, membros, ...CelulaData } =
      celulaDataForm;
    const result = await prisma?.celula.update({
      where: {
        id: id,
      },
      data: {
        ...CelulaData,
        nome,
        lider: {
          connect: {
            id: lider,
          },
        },
        supervisao: {
          connect: {
            id: supervisao,
          },
        },
        membros: {
          connect: membros?.map((membroId) => ({ id: membroId })),
        },
        reunioes_celula: {
          connect: reunioes_celula?.map((reuniaoCelulaId) => ({
            id: reuniaoCelulaId,
          })),
        },
      },
    });
    await disconnectPrisma();
    return result;
  }

  async updateDateCelula(id: string, newDate: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    // Consulte a célula existente para obter os dados atuais
    const existingCelula = await prisma?.celula.findUnique({
      where: {
        id: id,
      },
      include: {
        // Inclua as relações que você deseja manter sem modificação
        lider: true,
        supervisao: true,
        membros: true,
        reunioes_celula: true,
      },
    });

    if (!existingCelula) {
      throw new Error(`Célula com ID ${id} não encontrada.`);
    }

    // Crie um objeto de dados de atualização que inclui a nova data
    const updateData: Prisma.CelulaUpdateInput = {
      date_que_ocorre: newDate,
    };

    // Mantenha as relações existentes sem modificação
    if (existingCelula.lider) {
      updateData.lider = {
        connect: {
          id: existingCelula.lider.id,
        },
      };
    }

    if (existingCelula.supervisao) {
      updateData.supervisao = {
        connect: {
          id: existingCelula.supervisao.id,
        },
      };
    }

    if (existingCelula.membros) {
      updateData.membros = {
        connect: existingCelula.membros.map((membro) => ({
          id: membro.id,
        })),
      };
    }

    if (existingCelula.reunioes_celula) {
      updateData.reunioes_celula = {
        connect: existingCelula.reunioes_celula.map((reuniao) => ({
          id: reuniao.id,
        })),
      };
    }

    // Atualize a célula com os novos dados de data
    const updatedCelula = await prisma?.celula.update({
      where: {
        id: id,
      },
      data: updateData,
    });
    await disconnectPrisma();
    return updatedCelula;
  }

  async deleteCelula(id: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.celula.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new CelulaRepositorie();
