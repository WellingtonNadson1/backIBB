import { PrismaClient } from "@prisma/client";
import { CelulaData } from "../Controllers/CelulaController";

const prisma = new PrismaClient();

class CelulaRepositorie {
  async findAll() {
    return await prisma.celula.findMany({
      select: {
        id: true,
        nome: true,
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        },
        supervisao: {
          select: {
            id: true,
            nome: true,
          }
        },
        membros: {
          select: {
            id: true,
            first_name: true,
          }
        },
        date_que_ocorre: true,
        reunioes_celula: {
          select: {
            id: true,
            data_reuniao: true,
            status: true,
            presencas_reuniao_celula: {
              select: {
                id: true,
                membro: true,
                status: true,
              }
            }
          }
        }
      }
    })
  }

  async findById(id: string){
    return await prisma.celula.findUnique({
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
            cargo_de_lideranca: {
              select : {
                id: true,
                nome: true
              }
            },
            situacao_no_reino: {
              select : {
                id: true,
                nome: true
              }
            }
          }
        },
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        },
        supervisao: {
          select: {
            id: true,
            nome: true,
          }
        },
        date_que_ocorre: true,
        reunioes_celula: {
          select: {
            id: true,
            data_reuniao: true,
            status: true,
            presencas_reuniao_celula: {
              select: {
                id: true,
                membro: true,
                status: true,
              }
            }
          }
        }
      }
    })
  }

  async createCelula(celulaDataForm: CelulaData) {
    const { membros, reunioes_celula, ...CelulaData } = celulaDataForm

    return await prisma.celula.create({
      data: {
        ...CelulaData,
        lider: {
          connect: {
            id: CelulaData.lider,
          }
        },
        supervisao: {
          connect: {
            id: CelulaData.supervisao,
          }
        },
        membros: {
          connect: membros ? membros.map((membroId) => ({id: membroId})) : []
        },
        reunioes_celula: {
          connect: reunioes_celula?.map((reuniaoCelulaId) => ({ id: reuniaoCelulaId })),
        },
      },
    })
  }

  async updateCelula(id: string, celulaDataForm: CelulaData) {
    const { nome, lider, reunioes_celula, supervisao, membros, ...CelulaData } = celulaDataForm
    return await prisma.celula.update({
      where: {
        id: id,
      },
      data: {
        ...CelulaData,
        nome,
        lider: {
          connect: {
            id: lider
          }
        },
        supervisao: {
          connect: {
            id: supervisao
          }
        },
        membros: {
          connect: membros?.map((membroId) => ({id: membroId}))
        },
        reunioes_celula: {
          connect: reunioes_celula?.map((reuniaoCelulaId) => ({ id: reuniaoCelulaId })),
        },
      },
    })

  }

  async deleteCelula(id: string) {
    await prisma.celula.delete({
      where: {
        id: id,
      },
    })
  }
}

export default new CelulaRepositorie();
