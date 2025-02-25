import { Prisma } from "@prisma/client";
import { CelulaData, CelulaDataForm } from "../Controllers/CelulaController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";
import { CultoIndividualRepositorie } from "./Culto";

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

function getStartOfMonth(date: Date): Date {
  const startOfMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  );
  return startOfMonth;
}

function getEndOfMonth(date: Date): Date {
  const endOfMonth = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return endOfMonth;
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

  async PresenceByCultoIndividual(id: string, idsCultos: string[]) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }

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
            password: false,
            presencas_cultos: {
              where: {
                cultoIndividualId: {
                  in: idsCultos,
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
        // reunioes_celula: {
        //   select: {
        //     id: true,
        //     data_reuniao: true,
        //     status: true,
        //     presencas_membros_reuniao_celula: {
        //       select: {
        //         id: true,
        //         membro: {
        //           select: {
        //             id: true,
        //             first_name: true,
        //           },
        //         },
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

  async findByIdDetails(id: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }

    const todayDate = new Date();
    const startOfMonth = getStartOfMonth(todayDate);
    const endOfMonth = getEndOfMonth(todayDate);
    const endOfDay = getEndOfDay(todayDate);

    const cultosIndividuaisPerPeriod =
      await CultoIndividualRepositorie.findPerPeriodDetails(
        startOfMonth,
        endOfDay
      );
    console.log("todayDate", todayDate);
    console.log("startOfMonth", startOfMonth);
    console.log("endOfDay", endOfDay);
    console.log("cultosIndividuaisPerPeriod", cultosIndividuaisPerPeriod);

    const result = await prisma?.celula.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        reunioes_celula: {
          where: {
            data_reuniao: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            id: true,
            data_reuniao: true,
            visitantes: true,
            almas_ganhas: true,
            presencas_membros_reuniao_celula: {
              select: {
                status: true,
                membro: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
          },
        },
        membros: {
          select: {
            id: true,
            first_name: true,
            presencas_cultos: {
              where: {
                date_create: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
              },
            },
            presencas_reuniao_celula: {
              where: {
                date_create: {
                  gte: startOfMonth,
                  lte: endOfMonth,
                },
                status: true,
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
                _count: {
                  select: {
                    discipulado: {
                      where: {
                        data_ocorreu: {
                          gte: startOfMonth,
                          lte: endOfMonth,
                        },
                      },
                    },
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
      },
    });

    await disconnectPrisma();

    // Preparando o resultado
    const membrosComCultos = result?.membros.map((membro) => ({
      id: membro.id,
      first_name: membro.first_name,
      possui_disciopulador: membro.discipulador.length > 0,
      discipula: membro.discipulos.length > 0,
      cargo_de_lideranca: membro.cargo_de_lideranca?.nome,
      situacao_no_reino: membro.situacao_no_reino?.nome,
      total_cultos: cultosIndividuaisPerPeriod.length,
      cultos_status_true: membro.presencas_cultos.filter(
        (culto) => culto.status
      ).length,
      total_celulas: result.reunioes_celula.length,
      celulas_status_true: membro.presencas_reuniao_celula.filter(
        (celula) => celula.status
      ).length,
    }));

    return { membrosComCultos };
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
            password: false,
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
                membro: {
                  select: {
                    id: true,
                    first_name: true,
                  },
                },
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

  async updateCelula(id: string, newData: CelulaDataForm) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }

    // Recuperar membros atuais da célula
    const existingCelula = await prisma.celula.findUnique({
      where: { id },
      select: {
        membros: {
          select: { id: true },
        },
      },
    });

    if (!existingCelula) {
      throw new Error(`Célula com ID ${id} não encontrada.`);
    }

    // Extrair IDs dos membros atuais e dos novos membros
    const currentMemberIds = existingCelula.membros.map((m) => m.id);
    const newMemberIds = newData.membros?.map((m) => m) || [];

    // Identificar membros para adicionar e remover
    const membersToAdd = newMemberIds.filter(
      (id) => !currentMemberIds.includes(id)
    );
    const membersToRemove = currentMemberIds.filter(
      (id) => !newMemberIds.includes(id)
    );

    // Atualize apenas os campos que foram passados
    const updateData: Prisma.CelulaUpdateInput = {
      ...(newData.nome && { nome: newData.nome }),
      ...(newData.lider && {
        lider: {
          connect: { id: newData.lider.id },
        },
      }),
      ...(newData.supervisao && {
        supervisao: {
          connect: { id: newData.supervisao.id },
        },
      }),
      ...(newData.cep && { cep: newData.cep }),
      ...(newData.cidade && { cidade: newData.cidade }),
      ...(newData.estado && { estado: newData.estado }),
      ...(newData.bairro && { bairro: newData.bairro }),
      ...(newData.endereco && { endereco: newData.endereco }),
      ...(newData.numero_casa && { numero_casa: newData.numero_casa }),
      ...(newData.date_inicio && { date_inicio: newData.date_inicio }),
      ...(newData.date_multipicar && {
        date_multipicar: newData.date_multipicar,
      }),
      ...(newData.date_que_ocorre && {
        date_que_ocorre: newData.date_que_ocorre,
      }),

      membros: {
        connect: membersToAdd.map((id) => ({ id })),
        disconnect: membersToRemove.map((id) => ({ id })),
      },
    };

    // Atualize a célula com os novos dados
    const updatedCelula = await prisma?.celula.update({
      where: { id },
      data: updateData,
    });
    await disconnectPrisma();
    return updatedCelula;
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
