import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";
import { dataSchemaCreateDiscipulado } from "../../Controllers/Discipulado/schema";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

dayjs.extend(utc);
dayjs.extend(timezone);

class RegisterDiscipuladoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz("America/Sao_Paulo");
    const date_create = dataBrasil.format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    const dataBrasilDate = new Date(date_create);
    console.log("Data Brasil (Date):", dataBrasilDate);
  }

  // async cultosRelatoriosSupervisor(
  //   startDate: Date,
  //   endDate: Date,
  //   superVisionId: string,
  //   cargoLideranca: string[],
  // ) {

  //   try {
  //     const prisma = createPrismaInstance();

  //     const dataInicio = dayjs(startDate).toISOString();
  //     const dataFim = dayjs(endDate).toISOString();

  //     // Consulta para buscar membros da supervisão que compareceram aos cultos no intervalo de tempo
  //     const membrosCompareceramCultos = await prisma?.user.findMany({
  //       where: {
  //         supervisaoId: superVisionId,
  //         cargoDeLiderancaId: {
  //           in: cargoLideranca,
  //         },
  //         presencas_cultos: {
  //           some: {
  //             AND: [
  //               { presenca_culto: { data_inicio_culto: { gte: dataInicio } } },
  //               { presenca_culto: { data_termino_culto: { lte: dataFim } } }
  //             ]
  //           },
  //         },
  //       },
  //       // Use a opção 'select' para selecionar apenas os campos desejados
  //       select: {
  //         id: true, // Inclua os campos que você deseja
  //         first_name: true,
  //         last_name: true,
  //         // Adicione outros campos necessários
  //         presencas_cultos: {
  //           select: {
  //             // Selecione apenas os campos relevantes em 'presencas_cultos'
  //             status: true,
  //             cultoIndividualId: true,
  //             date_create: true,
  //             presenca_culto: {
  //               select: {
  //                 data_inicio_culto: true,
  //                 culto_semana: {
  //                   select: {
  //                     id: true
  //                   }
  //                 }
  //               }
  //             }
  //           },
  //         },
  //         cargo_de_lideranca: {
  //           select: {
  //             nome: true
  //           }
  //         },
  //       },
  //     });

  //     const cultosIndividuaisForDate = await CultoIndividualRepositorie.findAllIntervall(startDate, endDate, superVisionId);

  //     const totalCultosPeriodo = cultosIndividuaisForDate.totalCultosPeriodo
  //     const cultoQuarta = cultosIndividuaisForDate.cultoQuarta
  //     const cultoPrimicia = cultosIndividuaisForDate.cultoPrimicia
  //     const cultoDomingoSacrificio = cultosIndividuaisForDate.cultoDomingoSacrificio
  //     const cultoSabado = cultosIndividuaisForDate.cultoSabado
  //     const totalCultosDomingoManha = cultosIndividuaisForDate.cultoDomingoManha
  //     const totalCultosDomingoTarde = cultosIndividuaisForDate.cultoDomingoTarde

  //     // Filtrar as presenças dentro do intervalo de datas
  //     const membrosCompareceramCultosFiltrados = membrosCompareceramCultos.map((membro) => {
  //       const presencasFiltradas = membro.presencas_cultos.filter((presenca) => {
  //         const dataPresenca = dayjs(presenca.date_create).utcOffset(0);
  //         return (
  //           dataPresenca.isAfter(dayjs(dataInicio).utcOffset(0)) &&
  //           dataPresenca.isBefore(dayjs(dataFim).utcOffset(0))
  //         );
  //       });

  //       const quantidadeCultosPresentes = presencasFiltradas.reduce((total, presente) => {
  //         return total + (presente.status === true ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresentePrimicia = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'bffb62af-8d03-473a-ba20-ab5a9d7dafbe') ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresenteDomingoSacrificio = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'e7bc72d1-8faa-4bbe-9c24-475b64f956cf') ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresenteQuarta = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === '4064be1d-bf55-4851-9f76-99c4554a6265') ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresenteSabado = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === '84acfbe4-c7e0-4841-813c-04731ffa9c67') ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresenteDomingoManha = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'cab02f30-cade-46ca-b118-930461013d53') ? 1 : 0);
  //       }, 0);

  //       const quantidadeCultosPresenteDomingoTarde = presencasFiltradas.reduce((total, presente) => {
  //         return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'ea08ec9b-3d1b-42f3-818a-ec53ef99b78f') ? 1 : 0);
  //       }, 0);

  //       const porcentagemPresencaTotal = ((quantidadeCultosPresentes / totalCultosPeriodo) * 100).toFixed(2).slice(0, 5);

  //       let porcentagemPresencaQuarta = undefined
  //       if (quantidadeCultosPresenteQuarta !== 0) {
  //         porcentagemPresencaQuarta = ((quantidadeCultosPresenteQuarta / cultoQuarta) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaQuarta = 0.00.toFixed(2)
  //       }

  //       let porcentagemPresencaPrimicia = undefined
  //       if (quantidadeCultosPresentePrimicia !== 0) {
  //         porcentagemPresencaPrimicia = ((quantidadeCultosPresentePrimicia / cultoPrimicia) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaPrimicia = 0.00.toFixed(2)
  //       }

  //       let porcentagemPresencaDomingoSacrificio = undefined
  //       if (quantidadeCultosPresenteDomingoSacrificio !== 0) {
  //         porcentagemPresencaDomingoSacrificio = ((quantidadeCultosPresenteDomingoSacrificio / cultoDomingoSacrificio) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaDomingoSacrificio = 0.00.toFixed(2)
  //       }

  //       let porcentagemPresencaSabado = undefined
  //       if (quantidadeCultosPresenteSabado !== 0) {
  //         porcentagemPresencaSabado = ((quantidadeCultosPresenteSabado / cultoSabado) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaSabado = 0.00.toFixed(2)
  //       }

  //       let porcentagemPresencaTotalDomingoManha = undefined
  //       if (quantidadeCultosPresenteDomingoManha !== 0) {
  //         porcentagemPresencaTotalDomingoManha = ((quantidadeCultosPresenteDomingoManha / totalCultosDomingoManha) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaTotalDomingoManha = 0.00.toFixed(2)
  //       }

  //       let porcentagemPresencaTotalDomingoTarde = undefined
  //       if (quantidadeCultosPresenteDomingoTarde !== 0) {
  //         porcentagemPresencaTotalDomingoTarde = ((quantidadeCultosPresenteDomingoTarde / totalCultosDomingoTarde) * 100).toFixed(2).slice(0, 5);
  //       } else {
  //         porcentagemPresencaTotalDomingoTarde = 0.00.toFixed(2)
  //       }

  //       const cultos = {
  //         porcentagemPresencaTotal,
  //         porcentagemPresencaQuarta,
  //         porcentagemPresencaPrimicia,
  //         porcentagemPresencaDomingoSacrificio,
  //         porcentagemPresencaSabado,
  //         porcentagemPresencaTotalDomingoManha,
  //         porcentagemPresencaTotalDomingoTarde,
  //       }

  //       return {
  //         ...membro,
  //         presencasFiltradas,
  //         cultos: cultos

  //       };
  //     });

  //     return membrosCompareceramCultosFiltrados;
  //   } catch (error) {
  //     console.error('Erro:', error);
  //     return ('Erro interno do servidor');
  //   }
  //   finally {
  //     await disconnectPrisma();
  //   }
  // }

  async discipuladosSupervisorRelatorios(
    startDate: Date,
    endDate: Date,
    superVisionId: string,
    cargoLiderancaId: string[],
  ) {
    const prisma = createPrismaInstance();
    const dataFim = dayjs(endDate).endOf("day").toDate();

    try {
      // 1) Supervisão + supervisores (membros filtrados por cargo)
      const supervisao = await prisma.supervisao.findUnique({
        where: { id: superVisionId },
        select: {
          id: true,
          nome: true,
          membros: {
            where: {
              cargoDeLiderancaId: { in: cargoLiderancaId },
            },
            select: {
              id: true,
              first_name: true,
              cargo_de_lideranca: { select: { nome: true } },
              celula: {
                select: {
                  id: true,
                  nome: true,
                  lider: { select: { first_name: true } },
                },
              },
              supervisao_pertence: { select: { id: true, nome: true } },
            },
            orderBy: [{ first_name: "asc" }],
          },
        },
      });

      if (!supervisao) return [];

      const supervisorIds = supervisao.membros.map((m) => m.id);
      if (supervisorIds.length === 0) {
        return [{ id: supervisao.id, nome: supervisao.nome, membros: [] }];
      }

      // 2) Discípulos ATUAIS (fonte de verdade: User.discipuladorId)
      const discipulosAtuais = await prisma.user.findMany({
        where: {
          supervisaoId: superVisionId,
          discipuladorId: { in: supervisorIds },
          // se quiser reforçar:
          // is_discipulado: true,
        },
        select: {
          id: true,
          first_name: true,
          discipuladorId: true,
        },
        orderBy: [{ first_name: "asc" }],
      });

      const discipuloIds = discipulosAtuais.map((d) => d.id);

      // 3) Discipulados no período (tabela discipulado)
      //    Aqui pega por (usuario_id, discipulador_id) e data
      const discipuladosNoPeriodo = discipuloIds.length
        ? await prisma.discipulado.findMany({
            where: {
              usuario_id: { in: discipuloIds },
              discipulador_id: { in: supervisorIds },
              data_ocorreu: {
                gte: new Date(startDate),
                lte: dataFim,
              },
            },
            select: {
              usuario_id: true,
              discipulador_id: true,
              data_ocorreu: true,
            },
            orderBy: [{ data_ocorreu: "desc" }],
          })
        : [];

      // 4) Indexa discipulados por par (usuario|discipulador)
      const discipuladoByPair = new Map<string, { data_ocorreu: Date }[]>();
      for (const r of discipuladosNoPeriodo) {
        const key = `${r.usuario_id}|${r.discipulador_id}`;
        const list = discipuladoByPair.get(key) ?? [];
        list.push({ data_ocorreu: r.data_ocorreu });
        discipuladoByPair.set(key, list);
      }

      // 5) Agrupa discípulos por supervisor, montando o MESMO shape do front:
      //    discipulador.discipulos[] => { user_discipulos: { first_name }, discipulado: [{data_ocorreu}] }
      const discipulosBySupervisor = new Map<string, any[]>();

      for (const d of discipulosAtuais) {
        const supId = d.discipuladorId;
        if (!supId) continue;

        const keyPair = `${d.id}|${supId}`;
        const discipulado = discipuladoByPair.get(keyPair) ?? [];

        const list = discipulosBySupervisor.get(supId) ?? [];
        list.push({
          user_discipulos: { first_name: d.first_name },
          discipulado,
        });
        discipulosBySupervisor.set(supId, list);
      }

      // 6) Retorno final com supervisores + discipulos atuais
      const membros = supervisao.membros.map((m) => ({
        ...m,
        discipulos: discipulosBySupervisor.get(m.id) ?? [],
      }));

      return [
        {
          id: supervisao.id,
          nome: supervisao.nome,
          membros,
        },
      ];
    } finally {
      await disconnectPrisma();
    }
  }

  async getMemberMetrics() {
    const prisma = createPrismaInstance();
    const totalMembros = await prisma.user.count();
    const totalAtivos = await prisma.user.count({
      where: { situacao_no_reino: { nome: { equals: "Ativo" } } },
    });
    const totalNormais = await prisma.user.count({
      where: { situacao_no_reino: { nome: { equals: "Normal" } } },
    });
    const totalInativos = await prisma.user.count({
      where: { situacao_no_reino: { nome: { equals: "Afastado" } } },
    });

    const totalDiscipulados = await prisma.discipulado.count();

    return {
      totalMembros,
      totalAtivos,
      totalNormais,
      totalInativos,
      totalDiscipulados,
    };
  }

  async discipuladosRelatorioSupervisao(params: {
    superVisionId: string;
    startDate: Date;
    endDate: Date;
  }) {
    const dataFim = dayjs(params.endDate).endOf("day").toISOString();

    const prisma = createPrismaInstance();
    try {
      const result = await prisma.supervisao.findMany({
        where: {
          id: params.superVisionId,
        },
        select: {
          membros: {
            select: {
              id: true,
              first_name: true,
              celula: {
                select: {
                  id: true,
                  nome: true,
                  lider: {
                    select: {
                      first_name: true,
                    },
                  },
                },
              },
              supervisao_pertence: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              discipulador: {
                select: {
                  user_discipulador: {
                    select: {
                      first_name: true,
                    },
                  },
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: new Date(params.startDate),
                        lte: new Date(dataFim),
                      },
                    },
                    select: {
                      discipulador_usuario: {
                        select: {
                          user_discipulos: {
                            select: {
                              first_name: true,
                            },
                          },
                        },
                      },
                      data_ocorreu: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async cultosRelatorios(params: {
    supervisaoId: string;
    startOfInterval: string;
    endOfInterval: string;
  }) {
    const prisma = createPrismaInstance();
    const dataFim = dayjs(params.endOfInterval).endOf("day").toISOString();

    console.log(params);
    try {
      const result = await prisma.cultoIndividual.findMany({
        where: {
          data_inicio_culto: { gte: params.startOfInterval },
          data_termino_culto: { lte: dataFim },
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
      await disconnectPrisma();
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
      await disconnectPrisma();
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
    await disconnectPrisma();
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
    await disconnectPrisma();
    return result;
  }

  async findByIdCulto(culto: string, lider: string) {
    const prisma = createPrismaInstance();

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
    await disconnectPrisma();
    return result;
  }

  async findAllMembersSupervisorForPeriod({
    supervisor_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    supervisor_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();

    try {
      const end = dayjs(lastDayOfMonth).endOf("day").toDate();

      // 1) Supervisor (mantém o shape esperado)
      const supervisorArr = await prisma.user.findMany({
        where: { id: supervisor_id },
        select: {
          id: true,
          first_name: true,
          cargo_de_lideranca: {
            select: {
              id: true,
              nome: true,
            },
          },

          // Quem discipula ESTE supervisor (mantém o shape atual)
          discipulador: {
            select: {
              user_discipulos: {
                select: {
                  id: true,
                  first_name: true,
                  image_url: true,
                },
              },
              _count: {
                select: {
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: firstDayOfMonth,
                        lte: end,
                      },
                    },
                  },
                },
              },
              discipulado: {
                where: {
                  data_ocorreu: {
                    gte: firstDayOfMonth,
                    lte: end,
                  },
                },
                select: {
                  data_ocorreu: true,
                },
                orderBy: [{ data_ocorreu: "desc" }],
              },
            },
          },

          // ⚠️ NÃO usamos mais a relação "discipulos" aqui pra definir "atuais"
          // Vamos montar manualmente com base em User.discipuladorId
          // (mas deixamos o campo aqui fora do select)
        },
      });

      const supervisor = supervisorArr[0];
      if (!supervisor) return [];

      // 2) Discípulos ATUAIS (fonte de verdade: user.discipuladorId)
      const discipulosAtuais = await prisma.user.findMany({
        where: {
          discipuladorId: supervisor_id,
          // se quiser reforçar "atual", use regras de negócio:
          // is_discipulado: true,
          // situacao_no_reino: { nome: { equals: "Ativo" } },
        },
        select: {
          id: true,
          first_name: true,
          image_url: true,
        },
        orderBy: [{ first_name: "asc" }],
      });

      const discipuloIds = discipulosAtuais.map((d) => d.id);

      // 3) Discipulados no período para esses discípulos (tabela discipulado)
      const discipulados = discipuloIds.length
        ? await prisma.discipulado.findMany({
            where: {
              usuario_id: { in: discipuloIds },
              discipulador_id: supervisor_id,
              data_ocorreu: {
                gte: firstDayOfMonth,
                lte: end,
              },
            },
            select: {
              usuario_id: true,
              data_ocorreu: true,
            },
            orderBy: [{ data_ocorreu: "desc" }],
          })
        : [];

      // 4) Indexa por usuário
      const byUser = new Map<string, Date[]>();
      for (const d of discipulados) {
        const list = byUser.get(d.usuario_id) ?? [];
        list.push(d.data_ocorreu);
        byUser.set(d.usuario_id, list);
      }

      // 5) Monta o campo "discipulos" no SHAPE esperado
      const discipulosShape = discipulosAtuais.map((u) => {
        const datas = byUser.get(u.id) ?? [];
        return {
          user_discipulos: {
            id: u.id,
            first_name: u.first_name,
            image_url: u.image_url ?? "",
          },
          _count: {
            discipulado: datas.length,
          },
          discipulado: datas.map((dt) => ({
            data_ocorreu: dt.toISOString(),
          })),
        };
      });

      // 6) Retorna no formato final esperado: data: User[] (array)
      return [
        {
          ...supervisor,
          discipulos: discipulosShape,
        },
      ];
    } finally {
      await disconnectPrisma();
    }
  }

  async findAllMembersCellForPeriod({
    cell_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    cell_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();
    // console.log('cell_id', cell_id)
    // console.log('firstDayOfMonth', firstDayOfMonth)
    // console.log('lastDayOfMonth', lastDayOfMonth)
    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, "day");
      const result = await prisma.celula.findMany({
        where: {
          id: cell_id,
          // membros: {
          //   some: {
          //     discipulos: {
          //       some: {
          //         discipulado: {
          //           some: {
          //             AND: [
          //               { data_ocorreu: { gte: firstDayOfMonth } },
          //               { data_ocorreu: { lte: lastDayOfMonth } }
          //             ]
          //           }
          //         }
          //       }
          //     }
          //   }
          // }
        },
        select: {
          membros: {
            select: {
              id: true,
              first_name: true,
              image_url: true,
              cargo_de_lideranca: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              discipulador: {
                select: {
                  user_discipulador: {
                    select: {
                      id: true,
                      first_name: true,
                      image_url: true,
                    },
                  },
                  _count: {
                    select: {
                      discipulado: {
                        where: {
                          data_ocorreu: {
                            gte: firstDayOfMonth,
                            lte: lastDayOfMonthPlusOneDay.toISOString(),
                          },
                        },
                      },
                    },
                  },
                  discipulado: {
                    // select: {
                    //   data_ocorreu: true
                    // }
                    where: {
                      data_ocorreu: {
                        gte: firstDayOfMonth,
                        lte: lastDayOfMonthPlusOneDay.toISOString(),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // const quantidadeDiscipuladoRealizado = result.length
      // const discipuladosRealizados = result

      // return { quantidadeDiscipuladoRealizado, discipuladosRealizados };
      // console.log('result', result)
      return result;
    } finally {
      await disconnectPrisma();
    }
  }

  async findAllForPeriod({
    usuario_id,
    discipulador_id,
    firstDayOfMonth,
    lastDayOfMonth,
  }: {
    usuario_id: string;
    discipulador_id: string;
    firstDayOfMonth: Date;
    lastDayOfMonth: Date;
  }) {
    const prisma = createPrismaInstance();

    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, "day");
      const result = await prisma.discipulado.findMany({
        where: {
          usuario_id: usuario_id,
          data_ocorreu: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonthPlusOneDay.toISOString(),
          },
        },
        select: {
          discipulado_id: true,
          data_ocorreu: true,
        },
      });

      const quantidadeDiscipuladoRealizado = result.length;
      const discipuladosRealizados = result;

      return { quantidadeDiscipuladoRealizado, discipuladosRealizados };
    } finally {
      await disconnectPrisma();
    }
  }

  async createRegisterDiscipulado(
    RegisterDiscipuladoDataForm: dataSchemaCreateDiscipulado,
  ) {
    const prisma = createPrismaInstance();

    const { usuario_id, discipulador_id, data_ocorreu } =
      RegisterDiscipuladoDataForm;

    // const dataOcorreuIso = data_ocorreu.toDateString()
    const dateFinally = new Date(data_ocorreu);

    const result = await prisma.discipulado.create({
      data: {
        usuario_id: usuario_id,
        discipulador_id: discipulador_id,
        data_ocorreu: dateFinally,
      },
    });
    await disconnectPrisma();
    return result;
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
    await disconnectPrisma();
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
      await disconnectPrisma();
    }
  }
}

export default new RegisterDiscipuladoRepositorie();
