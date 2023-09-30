import { Prisma, PrismaClient } from "@prisma/client";
import { ReuniaoCelulaData } from "../../Controllers/ReuniaoCelula";

const prisma = new PrismaClient();

type UpdateReuniaCelulaInput = Prisma.ReuniaoCelulaUpdateInput & {
  presencas_membros_reuniao_celula?: { connect: { id: string } }[];
};

interface ReuniaCelulaConnect {
  connect: { id: string };
}

class ReuniaoCelulaRepositorie {
  async findAll() {
    return await prisma.reuniaoCelula.findMany({
      select: {
        id: true,
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }



  async findFirst({
    data_reuniao,
    celula,
  }: {
    data_reuniao: Date,
    celula: string,
  } ) {
    return await prisma.reuniaoCelula.findFirst({
      where: {
        data_reuniao: data_reuniao,
        celula: {id: celula },
      },
      select: {
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findById(id: string) {
    return await prisma.reuniaoCelula.findUnique({
      where: {
        id: id,
      },
      select: {
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async findByDate(id: string, data_reuniao: Date) {
    return await prisma.reuniaoCelula.findUnique({
      where: {
        id: id,
        data_reuniao: data_reuniao,
      },
      select: {
        data_reuniao: true,
        status: true,
        presencas_membros_reuniao_celula: {
          select: {
            status: true,
            membro: {
              select: {
                id: true,
                first_name: true,
                supervisao_pertence: true,
              }
            },
          }
        },
        celula: {
          select: {
            id: true,
            nome: true
          },
        },
      },
    });
  }

  async createReuniaoCelula(reuniaoCelulaDataForm: ReuniaoCelulaData) {
    const { presencas_membros_reuniao_celula, celula, status, data_reuniao } = reuniaoCelulaDataForm;
    const currentDate = new Date()
    const reuniaoCelula = await prisma.reuniaoCelula.create({
      data: {
        celula: {
          connect: {
            id: celula
          }
        },
        data_reuniao: data_reuniao,
        date_update: currentDate,
        status: status,
    }});
    // Conecte os relacionamentos opcionais, se fornecidos
    if (presencas_membros_reuniao_celula) {
      await prisma.reuniaoCelula.update({
        where: { id: reuniaoCelula.id },
        data: {
          presencas_membros_reuniao_celula: { connect: presencas_membros_reuniao_celula.map((reuniaoCelulaId) => ({ id: reuniaoCelulaId })) },
        },
      });
    }
    return reuniaoCelula
  }

  async updateReuniaoCelula(id: string, reuniaoCelulaDataForm: ReuniaoCelulaData) {
    const { presencas_membros_reuniao_celula, celula, ...ReuniaoCelulaData } = reuniaoCelulaDataForm;
    const updateReuniaoCelulaInput: UpdateReuniaCelulaInput = {
      ...ReuniaoCelulaData,
    };

    // Conecte os relacionamentos opcionais apenas se forem fornecidos
    if (celula !== undefined) {
      updateReuniaoCelulaInput.celula = {
        connect: {
          id: celula,
        },
      };
    }

    if (presencas_membros_reuniao_celula !== undefined) {
      updateReuniaoCelulaInput.presencas_membros_reuniao_celula = presencas_membros_reuniao_celula.map((presencaReuniaCelulaId) => ({
        connect: {
          id: presencaReuniaCelulaId,
        },
      })) as ReuniaCelulaConnect[];
    }
    return await prisma.reuniaoCelula.update({
      where: {
        id: id,
      },
      data: updateReuniaoCelulaInput,
    });
  }

  async deleteReuniaoCelula(id: string) {
    return await prisma.reuniaoCelula.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new ReuniaoCelulaRepositorie();
