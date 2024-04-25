import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import dayjs from "dayjs";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";
import { CultoIndividualRepositorie } from "../Culto";
import { dataSchemaCreateDiscipulado } from "../../Controllers/Discipulado/schema";

dayjs.extend(utc);
dayjs.extend(timezone);


class RegisterDiscipuladoRepositorie {
  findLog() {
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    console.log('Data Brasil (Date):', dataBrasilDate);
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

  async cultosRelatoriosSupervisor(
    startDate: Date,
    endDate: Date,
    superVisionId: string,
    cargoLiderancaId: string[],
  ) {

    try {
      const prisma = createPrismaInstance();
      const result = await prisma.supervisao.findMany({
        where: {
          id: superVisionId,
        },
        select: {
          membros: {
            where: {
              cargoDeLiderancaId: {
                in: cargoLiderancaId
              }
            },
            select: {
              id: true,
              first_name: true,
              cargo_de_lideranca: {
                select: {
                  nome: true,
                }
              },
              celula: {
                select: {
                  id: true,
                  nome: true,
                  lider: {
                    select: {
                      first_name: true
                    }
                  }
                }
              },
              supervisao_pertence: {
                select: {
                  id: true,
                  nome: true,
                }
              },
              discipulador_usuario_discipulador_usuario_discipulador_idTouser: {
                select: {
                  user_discipulador_usuario_usuario_idTouser: {
                    select: {
                      first_name: true
                    }
                  },
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: new Date(startDate),
                        lte: new Date(endDate)
                      }
                    },
                    select: {
                      // discipulador_usuario: {
                      //   select: {
                      //     user_discipulador_usuario_discipulador_idTouser: {
                      //       select: {
                      //         first_name: true
                      //       }
                      //     }
                      //   }
                      // },
                      data_ocorreu: true
                    }
                  }
                }
              }
            }
          }
        },
      });
      return result;
    }

    finally {
      await disconnectPrisma()
    }
  }


  async discipuladosRelatorioSupervisao(
    params: {
      superVisionId: string;
      startDate: Date;
      endDate: Date;
    }
  ) {
    const prisma = createPrismaInstance()
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
                      first_name: true
                    }
                  }
                }
              },
              supervisao_pertence: {
                select: {
                  id: true,
                  nome: true,
                }
              },
              discipulador_usuario_discipulador_usuario_usuario_idTouser: {
                select: {
                  user_discipulador_usuario_discipulador_idTouser: {
                    select: {
                      first_name: true
                    }
                  },
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: new Date(params.startDate),
                        lte: new Date(params.endDate)
                      }
                    },
                    select: {
                      discipulador_usuario: {
                        select: {
                          user_discipulador_usuario_discipulador_idTouser: {
                            select: {
                              first_name: true
                            }
                          }
                        }
                      },
                      data_ocorreu: true
                    }
                  }
                }
              }
            }
          }
        },
      });
      return result;
    }

    finally {
      await disconnectPrisma()
    }
  }

  async cultosRelatorios(
    params: {
      supervisaoId: string;
      startOfInterval: string;
      endOfInterval: string;
    }
  ) {
    const prisma = createPrismaInstance()

    console.log(params);
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
                    }
                  },
                  supervisao_pertence: {
                    select: {
                      id: true,
                      nome: true,
                    }
                  }
                }
              },
            },
          },
        },
      });

      console.log(result);
      return result;
    }

    finally {
      await disconnectPrisma()
    }
  }

  async findAll() {
    const prisma = createPrismaInstance()

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
                }
              }
            }
          },
          date_create: true,
          date_update: true,
        },
      });

      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findFirst({
    presenca_culto,
    membro,
  }: {
    presenca_culto: string;
    membro: string;
  }) {
    const prisma = createPrismaInstance()

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
              }
            }
          }
        },
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance()

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
              }
            }
          }
        },
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findByIdCulto(culto: string, lider: string) {
    const prisma = createPrismaInstance()

    const result = await prisma.presencaCulto.findFirst({
      where: {
        cultoIndividualId: culto,
        userId: lider
      },
      select: {
        id: true,
        status: true,
        presenca_culto: true,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async findAllMembersSupervisorForPeriod({
    supervisor_id, firstDayOfMonth, lastDayOfMonth
  }: {
    supervisor_id: string,
    firstDayOfMonth: Date
    lastDayOfMonth: Date
  }) {
    const prisma = createPrismaInstance()
    // console.log('supervisor_id', supervisor_id)
    // console.log('firstDayOfMonth', firstDayOfMonth)
    // console.log('lastDayOfMonth', lastDayOfMonth)
    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, 'day');
      const result = await prisma.user.findMany({
        where: {
          id: supervisor_id,
          // discipulador_usuario_discipulador_usuario_usuario_idTouser: {
          //   some: {
          //     discipulado: {
          //       some: {
          //         data_ocorreu: {
          //           gte: firstDayOfMonth,
          //           lte: lastDayOfMonth
          //         }
          //       }
          //     }
          //   }
          // }
        },
        select: {
          id: true,
          first_name: true,
          cargo_de_lideranca: {
            select: {
              id: true,
              nome: true,
            }
          },
          // DISCIPULADOR
          discipulador_usuario_discipulador_usuario_usuario_idTouser: {
            select: {
              user_discipulador_usuario_discipulador_idTouser: {
                select: {
                  id: true,
                  first_name: true
                }
              },
              _count: {
                select: {
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: firstDayOfMonth,
                        lte: lastDayOfMonthPlusOneDay.toISOString()
                      }
                    }
                  }
                }
              },
              discipulado: {
                where: {
                  data_ocorreu: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonthPlusOneDay.toISOString()
                  }
                }
                // select: {
                //   data_ocorreu: true
                // }
              }
            }
          },
          // DISCIPULOS
          discipulador_usuario_discipulador_usuario_discipulador_idTouser: {
            select: {

              user_discipulador_usuario_usuario_idTouser: {
                select: {
                  id: true,
                  first_name: true
                }
              },
              _count: {
                select: {
                  discipulado: {
                    where: {
                      data_ocorreu: {
                        gte: firstDayOfMonth,
                        lte: lastDayOfMonthPlusOneDay.toISOString()
                      }
                    }
                  }
                }
              },
              discipulado: {
                where: {
                  data_ocorreu: {
                    gte: firstDayOfMonth,
                    lte: lastDayOfMonthPlusOneDay.toISOString()
                  }
                }
                // select: {
                //   data_ocorreu: true
                // }
              }
            }
          }
        },
      });

      // const quantidadeDiscipuladoRealizado = result.length
      // const discipuladosRealizados = result

      // return { quantidadeDiscipuladoRealizado, discipuladosRealizados };
      console.log('result', result)
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findAllMembersCellForPeriod({
    cell_id, firstDayOfMonth, lastDayOfMonth
  }: {

    cell_id: string,
    firstDayOfMonth: Date
    lastDayOfMonth: Date
  }) {
    const prisma = createPrismaInstance()
    // console.log('cell_id', cell_id)
    // console.log('firstDayOfMonth', firstDayOfMonth)
    // console.log('lastDayOfMonth', lastDayOfMonth)
    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, 'day');
      const result = await prisma.celula.findMany({
        where: {
          id: cell_id,
          // membros: {
          //   some: {
          //     discipulador_usuario_discipulador_usuario_usuario_idTouser: {
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
              cargo_de_lideranca: {
                select: {
                  id: true,
                  nome: true,
                }
              },
              discipulador_usuario_discipulador_usuario_usuario_idTouser: {
                select: {

                  user_discipulador_usuario_discipulador_idTouser: {
                    select: {
                      id: true,
                      first_name: true
                    }
                  },
                  _count: {
                    select: {
                      discipulado: {
                        where: {
                          data_ocorreu: {
                            gte: firstDayOfMonth,
                            lte: lastDayOfMonthPlusOneDay.toISOString()
                          }
                        }
                      }
                    }
                  },
                  discipulado: {
                    // select: {
                    //   data_ocorreu: true
                    // }
                    where: {
                      data_ocorreu: {
                        gte: firstDayOfMonth,
                        lte: lastDayOfMonthPlusOneDay.toISOString()
                      }
                    }

                  },
                }
              }
            }
          }
        },
      });

      // const quantidadeDiscipuladoRealizado = result.length
      // const discipuladosRealizados = result

      // return { quantidadeDiscipuladoRealizado, discipuladosRealizados };
      // console.log('result', result)
      return result;
    }
    finally {
      await disconnectPrisma()
    }
  }

  async findAllForPeriod({
    usuario_id, discipulador_id, firstDayOfMonth, lastDayOfMonth
  }: {
    usuario_id: string,
    discipulador_id: string,
    firstDayOfMonth: Date
    lastDayOfMonth: Date
  }) {
    const prisma = createPrismaInstance()

    try {
      const lastDayOfMonthPlusOneDay = dayjs(lastDayOfMonth).add(1, 'day');
      const result = await prisma.discipulado.findMany({
        where: {
          usuario_id: usuario_id,
          data_ocorreu: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonthPlusOneDay.toISOString()
          },
        },
        select: {
          discipulado_id: true,
          data_ocorreu: true
        },
      });

      const quantidadeDiscipuladoRealizado = result.length
      const discipuladosRealizados = result

      return { quantidadeDiscipuladoRealizado, discipuladosRealizados };
    }
    finally {
      await disconnectPrisma()
    }
  }

  async createRegisterDiscipulado(RegisterDiscipuladoDataForm: dataSchemaCreateDiscipulado) {
    const prisma = createPrismaInstance()

    const { usuario_id, discipulador_id, data_ocorreu } = RegisterDiscipuladoDataForm;

    // const dataOcorreuIso = data_ocorreu.toDateString()
    const dateFinally = new Date(data_ocorreu)

    const result = await prisma.discipulado.create({
      data: {
        usuario_id: usuario_id,
        discipulador_id: discipulador_id,
        data_ocorreu: dateFinally,
      },
    });
    await disconnectPrisma()
    return result;
  }

  async updatePresencaCulto(id: string, presencaCultoDataForm: PresencaCultoData) {
    const prisma = createPrismaInstance()

    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    const result = await prisma.presencaCulto.update({
      where: {
        id: id,
      },
      data: {
        ...presencaCultoData,
        membro: {
          connect: {
            id: membro
          }
        },
        presenca_culto: {
          connect: {
            id: presencaCultoData.presenca_culto
          }
        }
      },
    });
    await disconnectPrisma()
    return result;
  }

  async deletePresencaCulto(id: string) {
    const prisma = createPrismaInstance()

    try {
      const result = await prisma.presencaCulto.delete({
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

export default new RegisterDiscipuladoRepositorie();
