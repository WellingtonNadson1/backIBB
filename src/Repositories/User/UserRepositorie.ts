import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { UserData, UserDataUpdate } from "../../Controllers/User/schema";
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

    // DEFINE O INÍCIO DO CORRENTE ANO
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    // DEFINE O FIM DO DIA DE HOJE
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // BUSCA ALMAS GANHAS NO ANO ATUAL
    const almasGanhasAno = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfYear,
            lt: endOfToday,
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);
    const almasGanhasNoAno = almasGanhasAno[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0
    );

    // DEFINE O INÍCIO DO ANO PASSADO
    const startOfLastYear = new Date(new Date().getFullYear() - 1, 0, 1);

    // DEFINE O FIM DO ANO PASSADO
    const endOfLastYear = new Date(
      new Date().getFullYear() - 1,
      11,
      31,
      23,
      59,
      59,
      999
    );

    // BUSCA ALMAS GANHAS NO ANO PASSADO
    const almasGanhasAnoPassado = await prisma.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfLastYear,
            lt: endOfLastYear,
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoAnoPassado = almasGanhasAnoPassado[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0
    );

    // DEFINE O INÍCIO E FIM DO MÊS ATUAL
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const endOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );

    const almasGanhasMes = await prisma?.$transaction([
      prisma.reuniaoCelula.findMany({
        where: {
          data_reuniao: {
            gte: startOfMonth,
            lt: new Date(
              endOfMonth.getFullYear(),
              endOfMonth.getMonth(),
              endOfMonth.getDate() + 1
            ),
          },
        },
        select: {
          almas_ganhas: true,
        },
      }),
    ]);

    const almasGanhasNoMes = almasGanhasMes[0].reduce(
      (total, reuniao) => total + (reuniao.almas_ganhas ?? 0),
      0
    );

    // DEFINE O INÍCIO E FIM DO MÊS PASSADO
    const startOfLastMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth() - 1,
      1
    );
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
              endOfLastMonth.getDate() + 1
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
      0
    );

    const combinedData = await prisma?.$transaction([
      prisma?.supervisao.findMany({
        select: {
          id: true,
          nome: true,
          cor: true,
          userId: true,
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
                      cargo_de_lideranca: {
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

    await disconnectPrisma();

    return {
      combinedData,
      almasGanhasNoMes,
      almasGanhasNoMesPassado,
      almasGanhasNoAno,
      almasGanhasNoAnoPassado, // 👈 Aqui está o valor retornado do ano passado
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

  async findAllDiscipulosSupervisor({
    dicipuladosupervisaoId,
    supervisorId,
  }: {
    dicipuladosupervisaoId: string;
    supervisorId: string;
  }) {
    const prisma = createPrismaInstance();

    if (!supervisorId) {
      throw new Error("Supervisor ID is not defined");
    }

    console.log("dicipuladosupervisaoId", dicipuladosupervisaoId);
    console.log("supervisorId", supervisorId);

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      where: {
        discipulador: {
          some: {
            user_discipulador: {
              id: supervisorId,
            },
          },
        },
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
                cargo_de_lideranca: true,
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

    console.log("result discipulos", result);
    return result;
  }

  async findAllDiscipulosSupervisores({
    dicipuladosupervisaoId,
    cargoLiderancaSupervisores,
  }: {
    dicipuladosupervisaoId: string;
    cargoLiderancaSupervisores: { id: string; nome: string }[];
  }) {
    const prisma = createPrismaInstance();

    console.log("dicipuladosupervisaoId", dicipuladosupervisaoId);
    console.log("cargoLiderancaSupervisores", cargoLiderancaSupervisores);

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      where: {
        supervisaoId: dicipuladosupervisaoId,
        OR: cargoLiderancaSupervisores.map((cargo) => ({
          cargo_de_lideranca: {
            nome: {
              contains: cargo.nome,
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
                cargo_de_lideranca: true,
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

    console.log("result", result);
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

  async findAllMembers() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      select: {
        id: true,
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
        first_name: true,
        last_name: true,
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
      },
    });
    await disconnectPrisma();
    return result;
  }

  async findAllSimple() {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    const result = await prisma?.user.findMany({
      select: {
        id: true,
        image_url: true,
        first_name: true,
        last_name: true,
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
        estado_civil: true,
        nome_conjuge: false,
        date_casamento: false,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: false,
        celulaId: false,
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
      situacao_no_reino,
      cargo_de_lideranca,
      date_nascimento,
      date_batizado,
      date_casamento,
      date_decisao,
      discipuladorId,
      escolas,
      encontros,
      celula_lidera,
      escola_lidera,
      supervisoes_lidera,
      presencas_aulas_escolas,
      presencas_reuniao_celula,
      presencas_cultos,
      TurmaEscola,
      ...userData
    } = userDataForm;

    const user = await prisma.user.create({
      data: {
        ...userData,
        password,
        date_nascimento,
        date_batizado,
        date_casamento,
        date_decisao,
        supervisao_pertence: { connect: { id: supervisao_pertence } }, // Obrigatório
        celula: celula ? { connect: { id: celula } } : undefined, // Obrigatório
        situacao_no_reino: { connect: { id: situacao_no_reino } }, // Obrigatório
        cargo_de_lideranca: { connect: { id: cargo_de_lideranca } }, // Obrigatório
        // Ajuste para discipuladorId: só conecta se estiver presente
        ...(discipuladorId && { user: { connect: { id: discipuladorId } } }), // Relação ajustada
        TurmaEscola: TurmaEscola ? { connect: { id: TurmaEscola } } : undefined,
        escolas: escolas?.length
          ? { connect: escolas.map((escola) => ({ id: escola.id })) }
          : undefined,
        encontros: encontros?.length
          ? { connect: encontros.map((encontro) => ({ id: encontro.id })) }
          : undefined,
        celula_lidera: celula_lidera?.length
          ? {
              connect: celula_lidera.map((celulaLideraId) => ({
                id: celulaLideraId,
              })),
            }
          : undefined,
        escola_lidera: escola_lidera?.length
          ? {
              connect: escola_lidera.map((escolaLideraId) => ({
                id: escolaLideraId,
              })),
            }
          : undefined,
        supervisoes_lidera: supervisoes_lidera?.length
          ? {
              connect: supervisoes_lidera.map((supervisoesLideraId) => ({
                id: supervisoesLideraId,
              })),
            }
          : undefined,
        presencas_aulas_escolas: presencas_aulas_escolas?.length
          ? {
              connect: presencas_aulas_escolas.map(
                (presencasAulasEscolasId) => ({ id: presencasAulasEscolasId })
              ),
            }
          : undefined,
        presencas_cultos: presencas_cultos?.length
          ? {
              connect: presencas_cultos.map((presencasCultosId) => ({
                id: presencasCultosId,
              })),
            }
          : undefined,
        presencas_reuniao_celula: presencas_reuniao_celula?.length
          ? {
              connect: presencas_reuniao_celula.map(
                (presencasReuniaoCelulaId) => ({ id: presencasReuniaoCelulaId })
              ),
            }
          : undefined,
      },
    });

    if (user.discipuladorId) {
      try {
        await this.createOrUpdateDiscipuladorRelation(
          user.id,
          user.discipuladorId
        );
      } catch (error) {
        throw new Error("Erro ao criar relacao discipulo / discipulador");
      }
    }

    await disconnectPrisma();
    return user;
  }

  async updateUser(id: string, userDataForm: UserDataUpdate) {
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

      const updateUserInput: any = {
        ...userData,
        date_nascimento,
        date_batizado,
        date_casamento,
      };

      // Atualizar campos simples apenas se fornecidos
      if (password !== undefined) updateUserInput.password = password;
      if (role !== undefined) updateUserInput.role = role;

      // Relacionamentos: desconectar antes de conectar novos valores
      if (supervisao_pertence !== undefined) {
        updateUserInput.supervisao_pertence = {
          connect: { id: supervisao_pertence },
        };
      }

      if (celula !== undefined) {
        updateUserInput.celula = celula
          ? { connect: { id: celula } }
          : { disconnect: true }; // Desconectar se vier como null/undefined
      }

      if (situacao_no_reino !== undefined) {
        updateUserInput.situacao_no_reino = {
          connect: { id: situacao_no_reino },
        };
      }

      if (cargo_de_lideranca !== undefined) {
        updateUserInput.cargo_de_lideranca = {
          connect: { id: cargo_de_lideranca },
        };
      }

      if (discipuladorId !== undefined) {
        console.log("discipuladorId fornecido:", discipuladorId);
        console.log("usuario_id:", id);

        // Validar se o discipulador existe (se discipuladorId não for null)
        if (discipuladorId) {
          const discipuladorExists = await prisma.user.findUnique({
            where: { id: discipuladorId },
          });
          console.log("discipuladorExists:", discipuladorExists);
          if (!discipuladorExists) {
            throw new Error(
              `Discipulador com ID ${discipuladorId} não encontrado`
            );
          }
        }

        // Validar se o usuário existe
        const userExists = await prisma.user.findUnique({
          where: { id },
        });
        console.log("userExists:", userExists);
        if (!userExists) {
          throw new Error(`Usuário com ID ${id} não encontrado`);
        }

        // Verificar se a relação já existe
        const existingRelation = await prisma.discipulador_usuario.findFirst({
          where: { usuario_id: id },
        });
        console.log("existingRelation:", existingRelation);

        if (discipuladorId) {
          if (existingRelation) {
            console.log("Deletando relação existente:", existingRelation);
            await prisma.discipulador_usuario.delete({
              where: {
                usuario_id_discipulador_id: {
                  usuario_id: id,
                  discipulador_id: existingRelation.discipulador_id,
                },
              },
            });
          }

          console.log(
            "Criando nova relação com discipuladorId:",
            discipuladorId
          );
          await prisma.discipulador_usuario.create({
            data: {
              usuario_id: id,
              discipulador_id: discipuladorId,
            },
          });
        } else if (existingRelation) {
          console.log("Removendo relação existente:", existingRelation);
          await prisma.discipulador_usuario.delete({
            where: {
              usuario_id_discipulador_id: {
                usuario_id: id,
                discipulador_id: existingRelation.discipulador_id,
              },
            },
          });
        }

        console.log(
          "Atualizando discipuladorId na tabela User:",
          discipuladorId || null
        );
        await prisma.user.update({
          where: { id },
          data: { discipuladorId: discipuladorId || null },
        });
      }

      if (TurmaEscola !== undefined) {
        updateUserInput.TurmaEscola = TurmaEscola
          ? { connect: { id: TurmaEscola } }
          : { disconnect: true };
      }

      // Arrays de relações
      if (escolas !== undefined) {
        // Desconectar escolas existentes e conectar as novas
        await prisma.user.update({
          where: { id },
          data: { escolas: { set: [] } }, // Limpa as conexões existentes
        });
        updateUserInput.escolas = {
          connect: escolas?.map((escola) => ({ id: escola.id })) || [],
        };
      }

      if (encontros !== undefined) {
        // Desconectar encontros existentes e conectar os novos
        await prisma.user.update({
          where: { id },
          data: { encontros: { set: [] } }, // Limpa as conexões existentes
        });
        updateUserInput.encontros = {
          connect: encontros?.map((encontro) => ({ id: encontro.id })) || [],
        };
      }

      if (celula_lidera !== undefined) {
        updateUserInput.celula_lidera = {
          set: celula_lidera?.map((celulaId) => ({ id: celulaId })) || [],
        };
      }

      if (escola_lidera !== undefined) {
        updateUserInput.escola_lidera = {
          set: escola_lidera?.map((escolaId) => ({ id: escolaId })) || [],
        };
      }

      if (supervisoes_lidera !== undefined) {
        updateUserInput.supervisoes_lidera = {
          set:
            supervisoes_lidera?.map((supervisaoId) => ({ id: supervisaoId })) ||
            [],
        };
      }

      if (presencas_aulas_escolas !== undefined) {
        updateUserInput.presencas_aulas_escolas = {
          set: presencas_aulas_escolas?.map((aulaId) => ({ id: aulaId })) || [],
        };
      }

      if (presencas_reuniao_celula !== undefined) {
        updateUserInput.presencas_reuniao_celula = {
          set:
            presencas_reuniao_celula?.map((reuniaoId) => ({ id: reuniaoId })) ||
            [],
        };
      }

      if (presencas_cultos !== undefined) {
        updateUserInput.presencas_cultos = {
          set: presencas_cultos?.map((cultoId) => ({ id: cultoId })) || [],
        };
      }

      console.log("updateUserInput", updateUserInput);

      const result = await prisma.user.update({
        where: { id },
        data: updateUserInput,
      });

      await disconnectPrisma();
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // Função para criar ou atualizar a relação discipulador_usuario
  async createOrUpdateDiscipuladorRelation(
    userId: string,
    discipuladorId: string
  ) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    // Verificar se a relação já existe
    const existingRelation = await prisma.discipulador_usuario.findFirst({
      where: { usuario_id: userId },
    });

    console.log("existingRelation com Disicipulo: ", existingRelation);

    if (existingRelation) {
      // Se já existe uma relação, atualizar para o novo discipuladorId
      await prisma.discipulador_usuario.update({
        where: {
          usuario_id_discipulador_id: {
            usuario_id: userId,
            discipulador_id: existingRelation.discipulador_id,
          },
        },
        data: {
          discipulador_id: discipuladorId,
        },
      });
    } else {
      // Se não existe relação, criar uma nova
      const disipuladoFeitoUpdate = await prisma.discipulador_usuario.create({
        data: {
          usuario_id: userId,
          discipulador_id: discipuladorId,
        },
      });

      return disipuladoFeitoUpdate;
    }
  }

  async patchStatusMembro({
    idMembro,
    statusMembro,
  }: {
    idMembro: string;
    statusMembro: string;
  }) {
    const membro = await prisma?.user.findUnique({
      where: {
        id: idMembro,
      },
    });

    if (!membro) {
      throw new Error("Evento not found.");
    }

    await prisma?.user.update({
      where: {
        id: idMembro,
      },
      data: {
        situacaoNoReinoId: statusMembro,
      },
    });

    await disconnectPrisma();
    return { message: "Satus Atualizado com Sucesso!" };
  }

  async updateDiscipuladorId(userId: string, discipuladorId: string) {
    const prisma = createPrismaInstance();

    if (!prisma) {
      throw new Error("Prisma instance is null");
    }
    console.log("discipuladorId", discipuladorId);

    try {
      // Check if the new discipuladorId exists before updating
      const discipuladorExists = await prisma.discipulador_usuario.findFirst({
        where: { discipulador_id: discipuladorId },
      });

      if (!discipuladorExists) {
        // Create a new discipulador_usuario relation if it doesn't exist
        await prisma.discipulador_usuario.create({
          data: { usuario_id: userId, discipulador_id: discipuladorId },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: { discipuladorId: discipuladorId },
      });

      // Criar ou atualizar a relação discipulador_usuario
      const newRelation = await this.createOrUpdateDiscipuladorRelation(
        userId,
        discipuladorId
      );
      console.log("New relation created or updated:", newRelation);

      await disconnectPrisma();
      return `Discipulador updated successfully`;
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
