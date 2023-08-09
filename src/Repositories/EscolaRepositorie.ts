import { PrismaClient } from "@prisma/client";
import { EscolaData } from "../Controllers/EscolaController";

const prisma = new PrismaClient();

class EscolaRepositorie {
  async findAll() {
    return await prisma.escolas.findMany({
      select: {
        id: true,
        nome: true,
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        },
        alunos: {
          select: {
            id: true,
            first_name: true,
          }
        },
        date_inicio: true,
        date_que_ocorre: true,
        date_conclusao: true
      }
    })
  }

  async findById(id: string){
    return await prisma.escolas.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        nome: true,
        alunos: {
          select: {
            first_name: true,
          }
        },
        lider: {
          select: {
            id: true,
            first_name: true,
          }
        },
        date_inicio: true,
        date_que_ocorre: true,
        date_conclusao: true
      }
    })
  }

  async createEscola(escolaDataForm: EscolaData) {
    const { alunos, ...EscolaData } = escolaDataForm
    return await prisma.escolas.create({
      data: {
        ...EscolaData,
        lider: {
          connect: {
            id: EscolaData.lider,
          }
        },
        alunos: {
          connect: alunos ? alunos.map((alunoId) => ({id: alunoId})) : []

        },
      },
    })
  }

  async updateEscola(id: string, escolaDataForm: EscolaData) {
    const { lider, alunos, ...EscolaData } = escolaDataForm
    return await prisma.escolas.update({
      where: {
        id: id,
      },
      data: {
        ...EscolaData,
        lider: {
          connect: {
            id: lider
          }
        },
        alunos: {
          connect: alunos?.map((alunoId) => ({id: alunoId}))

        },
      },
    })

  }

  async deleteEscola(id: string) {
    await prisma.escolas.delete({
      where: {
        id: id,
      },
    })
  }
}

export default new EscolaRepositorie();
