import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { UserData } from "../../Controllers/User/schema";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

type UpdateUserInput = Prisma.UserUpdateInput & {
  connect?: {
    user?: {
      id: string;
    };
    user_discipulos?: {
      connect: {
        usuario_id: string;
        discipulador_id: string;
      };
    };
    discipulador?: {
      connect: {
        usuario_id: string;
        discipulador_id: string;
      };
    };
  };
  // user_discipulos?: {
  //   connect: {
  //     usuario_id: string;
  //     discipulador_id: string;
  //   };
  // };
  supervisao_pertence?: { connect: { id: string } };
  role?: string;
  celula?: { connect: { id: string } };
  celula_lidera?: { connect: { id: string } }[];
  escola_lidera?: { connect: { id: string } }[];
  supervisoes_lidera?: { connect: { id: string } }[];
  presencas_aulas_escolas?: { connect: { id: string } }[];
  presencas_reuniao_celula?: { connect: { id: string } }[];
  presencas_cultos?: { connect: { id: string } }[];
  escolas?: { connect: { id: string } }[];
  encontros?: { connect: { id: string } }[];
  situacao_no_reino?: { connect: { id: string } };
  cargo_de_lideranca?: { connect: { id: string } };
  TurmaEscola?: { connect: { id: string } };
};

class UserRepositorie {
  async getCombinedData() {
    const prisma = createPrismaInstance();

    //DEFINE O INICIO DO CORRENTE ANO
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    //DEFINE O FIM DO DIA DE HOJE
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const almasGanhasAno = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfYear,
            lt: endOfToday,
          },
        },
        select: {
          almas_ganhas: true
        }
      })
    ])
    const almasGanhasNoAno = almasGanhasAno[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );
    console.log('almasGanhasNoAno', almasGanhasNoAno)

    //DEFINE O INICIO DO CORRENTE MES
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    //DEFINE O FIM DO CORRENTE MES
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    );

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const almasGanhasMes = await prisma?.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfMonth,
            lt: new Date(
              endOfMonth.getFullYear(),
              endOfMonth.getMonth(),
              endOfMonth.getDate() + 1,
            ),
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const combinedData = await prisma?.$transaction([
      prisma?.supervisao.findMany({
        select: {
          id: true,
          nome: true,
          cor: true,
          supervisor: {
            select: {
              id: true,
              first_name: true,
              discipulos: {
                select: {
                  user_discipulos: {
                    select: {
                      id: true,
                      first_name: true,
                      cargo_de_lideranca: true
                    },
                  },
                },
              },
            },
          },
          celulas: {
            select: {
              id: true,
              nome: true,
              lider: {
                select: {
                  id: true,
                  first_name: true,
                },
              },
            },
          },
        },
      }),
      prisma?.escola.findMany(),
      prisma?.encontros.findMany(),
      prisma?.situacaoNoReino.findMany(),
      prisma?.cargoDeLideranca.findMany(),
    ]);
    // Calcula a quantidade de almas ganhas no presente mês
    const almasGanhasNoMes = almasGanhasMes[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    //DEFINE O INICIO DO MES PASSADO
    const startOfLastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    )

    //DEFINE O FIM DO MES PASSADO
    const endOfLastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      0
    );

    const almasGanhasMesPassado = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfLastMonth,
            lt: new Date(
              endOfLastMonth.getFullYear(),
              endOfLastMonth.getMonth(),
              endOfLastMonth.getDate() + 1,
            ),
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoMesPassado = almasGanhasMesPassado[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0,
    );

    await disconnectPrisma();
    return {
      combinedData,
      almasGanhasNoMes,
      almasGanhasNoMesPassado,
      almasGanhasNoAno
    };
  }

  async findAllCell() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                name: true,
              },
            },
          },
        },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: {
          select: {
            id: true,
            nome: true,
          },
        },
        encontros: {
          select: {
            id: true,
            nome: true,
          },
        },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findAllDiscipulosSUpervisores(
    {
      dicipuladosupervisaoId,
      cargoLiderancaSupervisores
    }: {
      dicipuladosupervisaoId: string,
      cargoLiderancaSupervisores: { id: string, nome: string }[]
    }

  ) {
    const prisma = createPrismaInstance();

    console.log('dicipuladosupervisaoId', dicipuladosupervisaoId)
    console.log('cargoLiderancaSupervisores', cargoLiderancaSupervisores)

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      where: {
        supervisaoId: dicipuladosupervisaoId,
        OR: cargoLiderancaSupervisores.map(cargo => ({
          cargo_de_lideranca: {
            nome: {
              contains: cargo.nome
            },
          },
        })),
      },
      select: {
        id: true,
        role: true,
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
                cargo_de_lideranca: true
              },
            },
          },
        },
        user_roles: {
          select: {
            rolenew: {
              select: {
                name: true,
              },
            },
          },
        },
        image_url: true,
        email: false,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: false,
        sexo: false,
        telefone: false,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: false,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: false,
        encontros: false,
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });
    await disconnectPrisma();

    console.log('result', result)
    return result;
  }

  async findAllDiscipulados() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                name: true,
              },
            },
          },
        },
        image_url: true,
        email: false,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: false,
        sexo: false,
        telefone: false,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: false,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: {
          select: {
            id: true,
            nome: true,
          },
        },
        encontros: {
          select: {
            id: true,
            nome: true,
          },
        },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findAll() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                name: true,
              },
            },
          },
        },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: false,
        cep: false,
        cidade: false,
        estado: false,
        bairro: false,
        endereco: false,
        numero_casa: false,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: {
          select: {
            id: true,
            nome: true,
          },
        },
        encontros: {
          select: {
            id: true,
            nome: true,
          },
        },
        presencas_aulas_escolas: true,
        presencas_cultos: false,
        password: false,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findByIdCell(id: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        image_url: true,
        role: true,
        // DISCIPULADOR
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
        // DISCIPULO(S)
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        // user = discipulador
        // user: {
        //   select: {
        //     id: true,
        //     first_name: true,
        //   }
        // },
        estado_civil: false,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: false,
        quantidade_de_filho: false,
        date_decisao: false,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: false,
        situacaoNoReinoId: false,
        cargoDeLiderancaId: false,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        // escolas: {
        //   select: {
        //     id: true,
        //     nome: true,
        //   },
        // },
        // encontros: {
        //   select: {
        //     id: true,
        //     nome: true,
        //   },
        // },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: false,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findById(id: string) {
    const prisma = createPrismaInstance();
    console.log("idRepo:", id);

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        image_url: true,
        role: true,
        // DISCIPULADOR
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
        // DISCIPULO(S)
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: false,
        profissao: false,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        // user = discipulador
        // user: {
        //   select: {
        //     id: true,
        //     first_name: true,
        //   }
        // },
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: true,
        situacaoNoReinoId: true,
        cargoDeLiderancaId: true,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: {
          select: {
            id: true,
            nome: true,
          },
        },
        encontros: {
          select: {
            id: true,
            nome: true,
          },
        },
        presencas_aulas_escolas: true,
        presencas_cultos: false,
        password: false,
      },
    });
    console.log("Result Repo:", result);

    await disconnectPrisma();
    return result;
  }

  async findByEmail(email: string) {
    const prisma = createPrismaInstance();

    const result = await prisma?.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
        role: true,
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
        user_roles: {
          select: {
            rolenew: {
              select: {
                name: true,
              },
            },
          },
        },
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: true,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: true,
        profissao: true,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipuladorId: true,
        user: {
          select: {
            id: true,
            first_name: true,
          },
        },
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
        celulaId: true,
        cep: true,
        cidade: true,
        estado: true,
        bairro: true,
        endereco: true,
        numero_casa: true,
        supervisaoId: true,
        situacaoNoReinoId: true,
        cargoDeLiderancaId: true,
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
        celula_lidera: {
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
        cargo_de_lideranca: {
          select: {
            id: true,
            nome: true,
          },
        },
        escolas: {
          select: {
            id: true,
            nome: true,
          },
        },
        encontros: {
          select: {
            id: true,
            nome: true,
          },
        },
        presencas_aulas_escolas: false,
        presencas_cultos: false,
        password: true,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async createUser(userDataForm: UserData) {
    const prisma = createPrismaInstance();

    const {
      password,
      supervisao_pertence,
      celula,
      celula_lidera,
      escola_lidera,
      supervisoes_lidera,
      presencas_aulas_escolas,
      presencas_reuniao_celula,
      presencas_cultos,
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      TurmaEscola,
      date_nascimento,
      date_batizado,
      date_casamento,
      userIdRefresh,
      discipuladorId,
      ...userData
    } = userDataForm;

    const user = await prisma?.user.create({
      data: {
        ...userData,
        date_nascimento,
        date_batizado,
        date_casamento,
        password,
        TurmaEscola: TurmaEscola ? { connect: { id: TurmaEscola } } : undefined,
        supervisao_pertence: supervisao_pertence
          ? { connect: { id: supervisao_pertence } }
          : undefined,
        celula: celula ? { connect: { id: celula } } : undefined,
        celula_lidera: celula_lidera
          ? {
            connect: celula_lidera?.map((celulaLideraId) => ({
              id: celulaLideraId,
            })),
          }
          : undefined,
        escola_lidera: {
          connect: escola_lidera?.map((escolaLideraId) => ({
            id: escolaLideraId,
          })),
        },
        supervisoes_lidera: {
          connect: supervisoes_lidera?.map((supervisoesLideraId) => ({
            id: supervisoesLideraId,
          })),
        },
        presencas_aulas_escolas: {
          connect: presencas_aulas_escolas?.map((presencasAulasEscolasId) => ({
            id: presencasAulasEscolasId,
          })),
        },
        presencas_cultos: {
          connect: presencas_cultos?.map((presencasCultosId) => ({
            id: presencasCultosId,
          })),
        },
        presencas_reuniao_celula: {
          connect: presencas_reuniao_celula?.map(
            (presencasReuniaoCelulaId) => ({
              id: presencasReuniaoCelulaId,
            }),
          ),
        },
        escolas: {
          connect: escolas?.map((escolaId) => ({ id: escolaId })),
        },
        encontros: {
          connect: encontros?.map((encontId) => ({ id: encontId })),
        },
        userIdRefresh,
        situacao_no_reino: situacao_no_reino
          ? { connect: { id: situacao_no_reino } }
          : undefined,

        cargo_de_lideranca: cargo_de_lideranca
          ? { connect: { id: cargo_de_lideranca } }
          : undefined,
      },
    });

    await disconnectPrisma();
    return user;
  }

  async updateUser(id: string, userDataForm: UserData) {
    const dataBrasil = dayjs().tz('America/Sao_Paulo');
    const date_create = dataBrasil.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
    const dataBrasilDate = new Date(date_create);
    const date_update = dataBrasilDate;
    const prisma = createPrismaInstance();
    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    try {
      const {
        password,
        role,
        supervisao_pertence,
        celula,
        celula_lidera,
        escola_lidera,
        supervisoes_lidera,
        presencas_aulas_escolas,
        presencas_reuniao_celula,
        presencas_cultos,
        escolas,
        encontros,
        situacao_no_reino,
        TurmaEscola,
        date_nascimento,
        date_batizado,
        date_casamento,
        cargo_de_lideranca,
        discipuladorId,
        ...userData
      } = userDataForm;

      const updateUserInput: UpdateUserInput = {
        ...userData,
        date_nascimento,
        date_batizado,
        date_casamento,
      };

      const discipulador = await prisma.user.findFirst(
        {
          where: {
            id: id,
          },
          select: {
            discipulador: true
          }
        }
      )
      console.log(discipulador)

      const discipulos = await prisma.user.findFirst(
        {
          where: {
            id: id,
          },
          select: {
            discipulos: true
          }
        }
      )
      console.log(discipulos)
      // Conecte os relacionamentos opcionais apenas se forem fornecidos
      // Conectar ao discipulador_usuario
      if (discipuladorId) {
        updateUserInput.connect = {
          discipulador: {
            connect: {
              usuario_id: id, // ID do usuário que está sendo atualizado
              discipulador_id: discipuladorId, // Novo discipulador ID
            },
          },
        };
      }

      if (discipulos) {
        updateUserInput.discipulos
      }
      // if (discipuladorId) {
      //   // Remove existing connection if needed (optional, depending on use case)
      //   await prisma.discipulador_usuario.deleteMany({
      //     where: { usuario_id: id },
      //   });

      //   updateUserInput.user_discipulos = {
      //     connect: {
      //       usuario_id: id, // ID do usuário que está sendo atualizado
      //       discipulador_id: discipuladorId, // Novo discipulador ID
      //     },
      //   };

      //   await prisma.discipulador_usuario.create({
      //     data: {
      //       usuario_id: id,
      //       discipulador_id: discipuladorId,
      //     },
      //   });
      // }

      if (role !== undefined) {
        updateUserInput.role = role;
      }

      if (TurmaEscola !== undefined) {
        updateUserInput.TurmaEscola = {
          connect: {
            id: TurmaEscola,
          },
        };
      }

      if (supervisao_pertence !== undefined) {
        updateUserInput.supervisao_pertence = {
          connect: {
            id: supervisao_pertence,
          },
        };
      }

      if (celula !== undefined) {
        updateUserInput.celula = {
          connect: {
            id: celula,
          },
        };
      }

      if (celula_lidera !== undefined) {
        const celulaLideraIds = celula_lidera.map((celulaLideraId) => ({
          id: celulaLideraId,
        }));
        updateUserInput.celula_lidera = celulaLideraIds.map((celulaLideraId) => ({
          connect: {
            id: celulaLideraId.id,
          },
        }));
      }

      if (escola_lidera !== undefined) {
        const escolasIds = escola_lidera.map((escolasId) => ({
          id: escolasId,
        }));
        updateUserInput.escola_lidera = escolasIds.map((escolaId) => ({
          connect: {
            id: escolaId.id,
          },
        }));
      }

      if (supervisoes_lidera !== undefined) {
        const supervisoesIds = supervisoes_lidera.map((supervisoesId) => ({
          id: supervisoesId,
        }));
        updateUserInput.supervisoes_lidera = supervisoesIds.map((supervisaoId) => ({
          connect: {
            id: supervisaoId.id,
          },
        }));
      }

      if (presencas_aulas_escolas !== undefined) {
        const aulaEscolaIds = presencas_aulas_escolas.map((aulaEscolaId) => ({
          id: aulaEscolaId,
        }));
        updateUserInput.presencas_aulas_escolas = aulaEscolaIds.map((aulaId) => ({
          connect: {
            id: aulaId.id,
          },
        }));
      }

      if (presencas_reuniao_celula !== undefined) {
        const ReuniaoCelulaIds = presencas_reuniao_celula?.map((reuniaoCelulaId) => ({
          id: reuniaoCelulaId,
        }));
        updateUserInput.presencas_reuniao_celula = ReuniaoCelulaIds?.map((reuniaoCelulaId) => ({
          connect: {
            id: reuniaoCelulaId.id,
          },
        }));
      }

      if (presencas_cultos !== undefined) {
        const CultosIds = presencas_cultos?.map((cultoId) => ({
          id: cultoId,
        }));
        updateUserInput.presencas_cultos = CultosIds?.map((cultoId) => ({
          connect: {
            id: cultoId.id,
          },
        }));
      }

      if (escolas !== undefined) {
        const EscolasIds = escolas?.map((escolaId) => ({
          id: escolaId,
        }));
        updateUserInput.escolas = EscolasIds?.map((escolaId) => ({
          connect: {
            id: escolaId.id,
          },
        }));
      }

      if (encontros !== undefined) {
        const EncontrosIds = encontros?.map((EncontroId) => ({
          id: EncontroId,
        }));
        updateUserInput.encontros = EncontrosIds?.map((encontrId) => ({
          connect: {
            id: encontrId.id,
          },
        }));
      }

      // if (discipulador?.discipulador !== undefined) {
      //   const DiscipulosIds = discipulador?.discipulador?.map((DiscipuloId) => ({
      //     id: DiscipuloId
      //   }))
      //   updateUserInput.discipulador = DiscipulosIds?.map((discipuloId) => ({
      //     connect: {
      //       id: discipuloId
      //     }
      //   }))
      // }

      if (situacao_no_reino !== undefined) {
        updateUserInput.situacao_no_reino = {
          connect: {
            id: situacao_no_reino,
          },
        };
      }

      if (cargo_de_lideranca !== undefined) {
        updateUserInput.cargo_de_lideranca = {
          connect: {
            id: cargo_de_lideranca,
          },
        };
      }

      console.log('updateUserInput', updateUserInput)

      const result = await prisma?.user.update({
        where: {
          id: id,
        },
        data: updateUserInput,
      });

      await disconnectPrisma();
      return result;
    } catch (error) {
      console.error(error)
    }
  }


  // async updateDiscipuladorId(userId: string, newDiscipuladorId: string) {
  //   const prisma = createPrismaInstance();

  //   if (!prisma) {
  //     throw new Error('Prisma instance is null');
  //   }

  //   try {
  //     const result = await prisma.user.update({
  //       where: { id: userId },
  //       data: { discipuladorId: newDiscipuladorId },
  //     });

  //     const existDiscipuladorForMember = await prisma.discipulador_usuario.findFirst({
  //       where: { usuario_id: userId }
  //     });

  //     if (!existDiscipuladorForMember) {
  //       const newRelationDiscipulado = await prisma.discipulador_usuario.create({
  //         data: { usuario_id: userId, discipulador_id: newDiscipuladorId },
  //       });
  //     } else {
  //       // Relação já existe, não precisa atualizar
  //       const updateRelationDiscipulado = await prisma.discipulador_usuario.update({
  //         where: {
  //           usuario_id_discipulador_id: {
  //             usuario_id: userId,
  //             discipulador_id: existDiscipuladorForMember?.discipulador_id as string
  //           }
  //         },
  //         data: {
  //           discipulador_id: newDiscipuladorId
  //         }
  //       });
  //     }

  //     const success = `Discipulador updated successfully`;
  //     await disconnectPrisma();
  //     return success;
  //   } catch (error) {
  //     console.error(`Error updating discipuladorId: ${error}`);
  //     await disconnectPrisma();
  //     throw error; // Re-throw the error for proper handling
  //   }
  // }

  async updateDiscipuladorId(userId: string, newDiscipuladorId: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }

    try {
      // Check if the new discipuladorId exists before updating
      const discipuladorExists = await prisma.discipulador_usuario.findFirst({
        where: { discipulador_id: newDiscipuladorId },
      });

      if (!discipuladorExists) {
        // Create a new discipulador_usuario relation if it doesn't exist
        await prisma.discipulador_usuario.create({
          data: { usuario_id: userId, discipulador_id: newDiscipuladorId },
        });
      }

      const result = await prisma.user.update({
        where: { id: userId },
        data: { discipuladorId: newDiscipuladorId },
      });

      // Update the existing discipulador_usuario relation if it exists
      const existingUserDiscipulado =
        await prisma.discipulador_usuario.findFirst({
          where: { usuario_id: userId },
        });
      console.log("existingUserDiscipulado: ", existingUserDiscipulado);
      console.log("usuario_id: ", userId);
      console.log(
        "discipulador_id: ",
        existingUserDiscipulado?.discipulador_id,
      );
      console.log("newDiscipuladorId: ", newDiscipuladorId);

      if (existingUserDiscipulado) {
        const oldDiscipuladorId = existingUserDiscipulado.discipulador_id;
        const deleteRelationDiscipulado =
          await prisma?.discipulador_usuario.delete({
            where: {
              usuario_id_discipulador_id: {
                usuario_id: userId,
                discipulador_id: oldDiscipuladorId,
              },
            },
          });
        console.log("deleteRelationDiscipulado", deleteRelationDiscipulado);
        // await prisma.discipulador_usuario.update({
        //   where: { // Use both user and discipulador id for unique identification
        //     usuario_id_discipulador_id: {
        //       usuario_id: userId,
        //       discipulador_id: oldDiscipuladorId
        //     }
        //   },
        //   data: { discipulador_id: newDiscipuladorId },
        // });
        // Create a new discipulador_usuario relation if it doesn't exist
        const newRealtionDiscipulado = await prisma.discipulador_usuario.create(
          {
            data: { usuario_id: userId, discipulador_id: newDiscipuladorId },
          },
        );
        console.log("newRealtionDiscipulado", newRealtionDiscipulado);
      } else {
        // Create a new discipulador_usuario relation if it doesn't exist
        const newRealtionDiscipulado = await prisma.discipulador_usuario.create(
          {
            data: { usuario_id: userId, discipulador_id: newDiscipuladorId },
          },
        );
        console.log("newRealtionDiscipulado", newRealtionDiscipulado);
      }

      const success = `Discipulador updated successfully`;
      await disconnectPrisma();
      return success;
    } catch (error) {
      console.error(`Error updating discipuladorId: ${error}`);
      await disconnectPrisma();
      throw error; // Re-throw the error for proper handling
    }
  }

  async deleteUser(id: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new UserRepositorie();
