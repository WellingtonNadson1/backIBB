import { CelulaData } from "../Controllers/CelulaController";
import prisma from ".././services/prisma";
import { Prisma } from "@prisma/client";

class CelulaRepositorie {
  async findAll() {
    return await prisma?.celula.findMany({
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
            presencas_membros_reuniao_celula: {
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
    return await prisma?.celula.findUnique({
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
          }
        },
        supervisao: {
          select: {
            id: true,
          }
        },
        date_que_ocorre: true,
        date_inicio: true,
        date_multipicar: true,
        reunioes_celula: {
          select: {
            id: true,
            data_reuniao: true,
            status: true,
            presencas_membros_reuniao_celula: {
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

    return await prisma?.celula.create({
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
    return await prisma?.celula.update({
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

  async updateDateCelula(id: string, newDate: string) {
    // Consulte a célula existente para obter os dados atuais
    const existingCelula = await prisma?.celula.findUnique({
      where: {
        id: id,
      },
      include: {
        // Inclua as relações que você deseja manter sem modificação
        lider: true,
        supervisao: true,
        membros: true,
        reunioes_celula: true,
      },
    });
  
    if (!existingCelula) {
      throw new Error(`Célula com ID ${id} não encontrada.`);
    }
  
    // Crie um objeto de dados de atualização que inclui a nova data
    const updateData: Prisma.CelulaUpdateInput = {
      date_que_ocorre: newDate,
    };
  
    // Mantenha as relações existentes sem modificação
  if (existingCelula.lider) {
    updateData.lider = {
      connect: {
        id: existingCelula.lider.id,
      },
    };
  }

  if (existingCelula.supervisao) {
    updateData.supervisao = {
      connect: {
        id: existingCelula.supervisao.id,
      },
    };
  }

  if (existingCelula.membros) {
    updateData.membros = {
      connect: existingCelula.membros.map((membro) => ({
        id: membro.id,
      })),
    };
  }

  if (existingCelula.reunioes_celula) {
    updateData.reunioes_celula = {
      connect: existingCelula.reunioes_celula.map((reuniao) => ({
        id: reuniao.id,
      })),
    };
  }

  // Atualize a célula com os novos dados de data
  const updatedCelula = await prisma?.celula.update({
    where: {
      id: id,
    },
    data: updateData,
  });

  return updatedCelula;
  }

  async deleteCelula(id: string) {
    await prisma?.celula.delete({
      where: {
        id: id,
      },
    })
  }
}

export default new CelulaRepositorie();
