import { Prisma, PrismaClient } from "@prisma/client";
import { UserData } from "../Controllers/UserController";

const prisma = new PrismaClient();

type UpdateUserInput = Prisma.UserUpdateInput & {
  supervisao_pertence?: { connect: { id: string } };
  role?:  string;
  celula?: { connect: { id: string } };
  celula_lidera?: { connect: { id: string } }[];
  escola_lidera?: { connect: { id: string } }[];
  supervisoes_lidera?: { connect: { id: string } }[];
  presencas_aulas_escolas?: { connect: { id: string } }[];
  presencas_cultos?: { connect: { id: string } }[];
  escolas?: { connect: { id: string } }[];
  encontros?: { connect: { id: string } }[];
  situacao_no_reino?: { connect: { id: string } };
  cargo_de_lideranca?: { connect: { id: string } };
  TurmaEscola?: { connect: { id: string } };
};

interface CelulaLideraConnect {
  connect: { id: string };
}

interface EscolaLideraConnect {
  connect: { id: string };
}

interface SupervisoesLideraConnect {
  connect: { id: string };
}

interface PresencasAulasEscolasConnect {
  connect: { id: string };
}

interface PresencasCultosConnect {
  connect: { id: string };
}

interface EscolaConnect {
  connect: { id: string };
}

interface EncontrConnect {
  connect: { id: string };
}

class UserRepositorie {

  async getCombinedData() {
    const combinedData = await prisma.$transaction([
      prisma.supervisao.findMany({
        select: {
          celulas: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      }),
      prisma.escola.findMany(),
      prisma.encontros.findMany(),
      prisma.situacaoNoReino.findMany(),
      prisma.cargoDeLideranca.findMany(),
    ]);

    return combinedData;
  }

  async findAll() {
    return await prisma.user.findMany({
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
            nome: true,
          },
        },
        celula: {
          select: {
            nome: true,
          },
        },
        celula_lidera: {
          select: {
            nome: true,
          },
        },
        situacao_no_reino: {
          select: {
            nome: true,
          },
        },
        cargo_de_lideranca: {
          select: {
            nome: true,
          },
        },
        escolas: {
          select: {
            nome: true,
          },
        },
        encontros: {
          select: {
            nome: true,
          },
        },
        presencas_aulas_escolas: true,
        presencas_cultos: true,
        password: false,
      },
    });
  }

  async findById(id: string) {
    return await prisma.user.findUnique({
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
            nome: true,
          },
        },
        celula: {
          select: {
            nome: true,
          },
        },
        celula_lidera: {
          select: {
            nome: true,
          },
        },
        situacao_no_reino: {
          select: {
            nome: true,
          },
        },
        cargo_de_lideranca: {
          select: {
            nome: true,
          },
        },
        escolas: {
          select: {
            nome: true,
          },
        },
        encontros: {
          select: {
            nome: true,
          },
        },
        presencas_aulas_escolas: true,
        presencas_cultos: true,
        password: false,
      },
    });
  }
  async findByEmail(email: string) {
    return await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
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
      presencas_cultos,
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      TurmaEscola,
      date_nascimento,
      date_batizado,
      date_casamento,
      ...userData
    } = userDataForm;

    const user = await prisma.user.create({
      data: {
        ...userData,
        date_nascimento,
        date_batizado,
        date_casamento,
        password,
        TurmaEscola: TurmaEscola
          ? { connect: { id: TurmaEscola } }
          : undefined,
        supervisao_pertence: supervisao_pertence
          ? { connect: { id: supervisao_pertence } }
          : undefined,
        celula: celula
          ? { connect: { id: celula } }
          : undefined,
        celula_lidera: {
          connect: celula_lidera?.map((celulaLideraId) => ({
            id: celulaLideraId,
          })),
        },
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
        escolas: {
          connect: escolas?.map((escolaId) => ({ id: escolaId })),
        },
        encontros: {
          connect: encontros?.map((encontId) => ({ id: encontId })),
        },
        situacao_no_reino: situacao_no_reino
          ? { connect: { id: situacao_no_reino } }
          : undefined,
        cargo_de_lideranca: cargo_de_lideranca
          ? { connect: { id: cargo_de_lideranca } }
          : undefined,
      },
    });

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
      updateUserInput.celula_lidera = celula_lidera.map((celulaLideraId) => ({
        connect: {
          id: celulaLideraId,
        },
      })) as CelulaLideraConnect[];
    }

    if (escola_lidera !== undefined) {
      updateUserInput.escola_lidera = escola_lidera.map((escolaLideraId) => ({
        connect: {
          id: escolaLideraId,
        },
      })) as EscolaLideraConnect[];
    }

    if (supervisoes_lidera !== undefined) {
      updateUserInput.supervisoes_lidera = supervisoes_lidera.map((supervisoesLideraId) => ({
        connect: {
          id: supervisoesLideraId,
        },
      })) as SupervisoesLideraConnect[];
    }

    if (presencas_aulas_escolas !== undefined) {
      updateUserInput.presencas_aulas_escolas = presencas_aulas_escolas.map((presencasAulasEscolasId) => ({
        connect: {
          id: presencasAulasEscolasId,
        },
      })) as PresencasAulasEscolasConnect[];
    }

    if (presencas_cultos !== undefined) {
      updateUserInput.presencas_cultos = presencas_cultos.map((presencasCultosId) => ({
        connect: {
          id: presencasCultosId,
        },
      })) as PresencasCultosConnect[];
    }

    if (escolas !== undefined) {
      updateUserInput.escolas = escolas.map((escolaId) => ({
        connect: {
          id: escolaId,
        },
      })) as EscolaConnect[];
    }

    if (encontros !== undefined) {
      updateUserInput.encontros = encontros.map((escolaId) => ({
        connect: {
          id: escolaId,
        },
      })) as EncontrConnect[];
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

    return await prisma.user.update({
      where: {
        id: id,
      },
      data: updateUserInput,
    });
  }

  async deleteUser(id: string) {
    return await prisma.user.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new UserRepositorie();
