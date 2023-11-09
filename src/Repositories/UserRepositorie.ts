import { Prisma } from "@prisma/client";
import { UserData } from "../Controllers/UserController";
import { createPrismaInstance, disconnectPrisma } from "../services/prisma";

const prisma = createPrismaInstance()

type UpdateUserInput = Prisma.UserUpdateInput & {
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
    const combinedData = await prisma?.$transaction([
      prisma?.supervisao.findMany({
        select: {
          id: true,
          nome: true,
          celulas: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      }),
      prisma?.escola.findMany(),
      prisma?.encontros.findMany(),
      prisma?.situacaoNoReino.findMany(),
      prisma?.cargoDeLideranca.findMany(),
    ]);
    await disconnectPrisma()
    return combinedData;
  }

  async findAll() {
    const result = await prisma?.user.findMany({
      select: {
        id: true,
        role: true,
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: true,
        profissao: true,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipulador: true,
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
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
        presencas_cultos: true,
        password: false,
      },
    });
    await disconnectPrisma()
    return result
  }

  async findById(id: string) {
    const result = await prisma?.user.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        role: true,
        image_url: true,
        email: true,
        first_name: true,
        last_name: true,
        cpf: false,
        date_nascimento: true,
        sexo: true,
        telefone: true,
        escolaridade: true,
        profissao: true,
        batizado: true,
        date_batizado: true,
        is_discipulado: true,
        discipulador: true,
        estado_civil: true,
        nome_conjuge: true,
        date_casamento: true,
        has_filho: true,
        quantidade_de_filho: true,
        date_decisao: true,
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
        presencas_cultos: true,
        password: false,
      },
    });
    await disconnectPrisma()
    return result
  }

  async findByEmail(email: string) {
    const result = await prisma?.user.findFirst({
      where: {
        email: email,
      },
    });
    await disconnectPrisma()
    return result
  }

  async createUser(userDataForm: UserData) {
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
            })
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
    await disconnectPrisma()
    return user;
  }

  async updateUser(id: string, userDataForm: UserData) {
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
      ...userData
    } = userDataForm;

    const updateUserInput: UpdateUserInput = {
      ...userData,
      date_nascimento,
      date_batizado,
      date_casamento,
      password,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
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
      const escolaLideraIds = escola_lidera.map((escolaLideraId) => ({
        id: escolaLideraId,
      }));
      updateUserInput.escola_lidera = escolaLideraIds.map((escolaLideraId) => ({
        connect: {
          id: escolaLideraId.id,
        },
      }));
    }

    if (supervisoes_lidera !== undefined) {
      const supervisoesLideraIds = supervisoes_lidera.map(
        (supervisoesLideraId) => ({
          id: supervisoesLideraId,
        })
      );
      updateUserInput.supervisoes_lidera = supervisoesLideraIds.map(
        (supervisoesLideraId) => ({
          connect: {
            id: supervisoesLideraId.id,
          },
        })
      );
    }

    if (presencas_aulas_escolas !== undefined) {
      const presencasAulasEscolas = presencas_aulas_escolas.map(
        (presencasAulasEscolasId) => ({
          id: presencasAulasEscolasId,
        })
      );
      updateUserInput.presencas_aulas_escolas = presencasAulasEscolas.map(
        (presencasAulasEscolasId) => ({
          connect: {
            id: presencasAulasEscolasId.id,
          },
        })
      );
    }

    if (presencas_reuniao_celula !== undefined) {
      const presencasReuniaoCelulas = presencas_reuniao_celula.map(
        (presencasReuniaoCelulasId) => ({
          id: presencasReuniaoCelulasId,
        })
      );
      updateUserInput.presencas_reuniao_celula = presencasReuniaoCelulas.map(
        (presencasReuniaoCelulasId) => ({
          connect: {
            id: presencasReuniaoCelulasId.id,
          },
        })
      );
    }

    if (presencas_cultos !== undefined) {
      const presencasCultos = presencas_cultos.map((presencasCultosId) => ({
        id: presencasCultosId,
      }));
      updateUserInput.presencas_cultos = presencasCultos.map(
        (presencasCultosId) => ({
          connect: {
            id: presencasCultosId.id,
          },
        })
      );
    }

    if (escolas !== undefined) {
      const escolasIds = escolas.map((escolaId) => ({
        id: escolaId,
      }));
      updateUserInput.escolas = escolasIds.map((escolaId) => ({
        connect: {
          id: escolaId.id,
        },
      }));
    }

    if (encontros !== undefined) {
      const encontrosIds = encontros.map((encontroId) => ({
        id: encontroId,
      }));
      updateUserInput.encontros = encontrosIds.map((encontroId) => ({
        connect: {
          id: encontroId.id,
        },
      }));
    }

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

    const result = await prisma?.user.update({
      where: {
        id: id,
      },
      data: updateUserInput,
    });
    await disconnectPrisma()
    return result
  }

  async deleteUser(id: string) {
    const result = await prisma?.user.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma()
    return result
  }
}

export default new UserRepositorie();
