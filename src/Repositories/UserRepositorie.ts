import { PrismaClient } from "@prisma/client";
import { UserData } from "../Controllers/UserController";

const prisma = new PrismaClient();

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
        dateNasc: true,
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
        Bairro: false,
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
        dateNasc: true,
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
        Bairro: true,
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
      supervisao,
      celula,
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      ...userData
    } = userDataForm;
    const user = await prisma.user.create({
      data: {
        ...userData,
        password,
        supervisao_pertence: {
          connect: {
            id: supervisao,
          },
        },
        celula: {
          connect: {
            id: celula,
          },
        },
        escolas: {
          connect: escolas.map((escolaId) => ({ id: escolaId })),
        },
        encontros: {
          connect: encontros.map((encontId) => ({ id: encontId })),
        },
        situacao_no_reino: {
          connect: {
            id: situacao_no_reino,
          },
        },
        cargo_de_lideranca: {
          connect: {
            id: cargo_de_lideranca,
          },
        },
      },
    });

    return user;
  }

  async updateUser(id: string, userDataForm: UserData) {
    const {
      password,
      supervisao,
      celula,
      escolas,
      encontros,
      situacao_no_reino,
      cargo_de_lideranca,
      ...userData
    } = userDataForm;
    return await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        ...userData,
        password,
        supervisao_pertence: {
          connect: {
            id: supervisao,
          },
        },
        celula: {
          connect: {
            id: celula,
          },
        },
        escolas: {
          connect: escolas.map((escolaId) => ({ id: escolaId })),
        },
        encontros: {
          connect: encontros.map((encontId) => ({ id: encontId })),
        },
        situacao_no_reino: {
          connect: {
            id: situacao_no_reino,
          },
        },
        cargo_de_lideranca: {
          connect: {
            id: cargo_de_lideranca,
          },
        },
      },
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
