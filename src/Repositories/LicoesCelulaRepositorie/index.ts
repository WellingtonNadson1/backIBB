import { createPrismaInstance } from "../../services/prisma";

class LicoesCelulaRepositorie {
  async findById(id: string) {
    try {
      const prisma = createPrismaInstance();

      if (!prisma) {
        throw new Error("Prisma instance is null");
      }

      const allLicoes = await prisma?.licaoCelula.findMany({
        where: {
          temaLicaoCelulaId: id,
        },
        select: {
          id: true,
          titulo: true,
          licao_lancando_redes: true,
          versiculo_chave: true,
          link_objeto_aws: true,
          data_inicio: true,
          data_termino: true,
        },
      });

      return allLicoes;
    } catch (error) {
      console.error("Ocorreu um error ao buscar as licoes: ", error);
    }
  }

  async findMany() {
    try {
      const prisma = createPrismaInstance();

      if (!prisma) {
        throw new Error("Prisma instance is null");
      }

      const temaMonth = await prisma?.temaLicaoCelula.findMany({
        where: {
          status: true,
        },
        select: {
          status: true,
          id: true,
          tema: true,
          versiculo_chave: true,
          data_inicio: true,
          data_termino: true,
        },
      });
      console.log("temaMonth", temaMonth);

      return temaMonth;
    } catch (error) {
      console.error("Ocorreu um erro ao buscar o tema", error);
      return error;
    }
  }
}

export default new LicoesCelulaRepositorie();
