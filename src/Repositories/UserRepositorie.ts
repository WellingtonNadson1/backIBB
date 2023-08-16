import { Prisma, PrismaClient } from "@prisma/client";
import { UserData } from "../Controllers/UserController";

const prisma = new PrismaClient();

type UpdateUserInput = Prisma.UserUpdateInput & {
  supervisao_pertence?: { connect: { id: string } };
  celula?: { connect: { id: string } };
  escolas?: { connect: { id: string } }[];
  encontros?: { connect: { id: string } }[];
  situacao_no_reino?: { connect: { id: string } };
  cargo_de_lideranca?: { connect: { id: string } };
};

interface EscolaConnect {
  connect: { id: string };
}

interface EncontrConnect {
  connect: { id: string };
}

class UserRepositorie {
  async findAll() {
    return await prisma.user.findMany({
      select: {
        id: true,
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
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      ...userData
    } = userDataForm;

    // Crie o usuário sem os relacionamentos
  const user = await prisma.user.create({
    data: {
      ...userData,
      password,
    },
  });

  // Conecte os relacionamentos opcionais, se fornecidos
  if (supervisao_pertence) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        supervisao_pertence: { connect: { id: supervisao_pertence } },
      },
    });
  }

  if (celula) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        celula: { connect: { id: celula } },
      },
    });
  }

  if (escolas) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        escolas: { connect: escolas.map((escolaId) => ({ id: escolaId })) },
      },
    });
  }

  if (encontros) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        encontros: { connect: encontros.map((encontId) => ({ id: encontId })) },
      },
    });
  }

    return user;
  }

  async updateUser(id: string, userDataForm: UserData) {
    const {
      password,
      supervisao_pertence,
      celula,
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      ...userData
    } = userDataForm;

    const updateUserInput: UpdateUserInput = {
      ...userData,
      password,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
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
