import { PrismaClient } from "@prisma/client";
import { PresencaCultoData } from "../../Controllers/Culto/PresencaCulto";

const prisma = new PrismaClient();

class PresencaCultoRepositorie {
  async findAll() {
    return await prisma.presencaCulto.findMany({
      select: {
        id: true,
        status: true,
        membro: true,
        presenca_culto: true,
      },
    });
  }

  async findById(id: string) {
    return await prisma.presencaCulto.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        status: true,
        membro: true,
        presenca_culto: true,
      },
    });
  }

  async createPresencaCulto(presencaCultoDataForm: PresencaCultoData) {
    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    return await prisma.presencaCulto.create({
      data: {
        ...presencaCultoData,
        membro: {
          connect: {
            id: membro
          }
        },
        presenca_culto: {
          connect: {
            id: presencaCultoData.presenca_culto
          }
        }
      },
    });
  }

  async createPresencaMembrosCulto(presencaMembrosCultoData: PresencaCultoData[]){
    const presencaMembrosCulto = presencaMembrosCultoData.map(item => ({
      ...item,
      userId: item.membro
    }))
    return await prisma.presencaCulto.createMany({ data: presencaMembrosCulto })
  }


  async updatePresencaCulto(id: string, presencaCultoDataForm: PresencaCultoData) {
    const { membro, ...presencaCultoData } = presencaCultoDataForm;
    return await prisma.presencaCulto.update({
      where: {
        id: id,
      },
      data: {
        ...presencaCultoData,
        membro: {
          connect: {
            id: membro
          }
        },
        presenca_culto: {
          connect: {
            id: presencaCultoData.presenca_culto
          }
        }
      },
    });
  }

  async deletePresencaCulto(id: string) {
    await prisma.presencaCulto.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new PresencaCultoRepositorie();
