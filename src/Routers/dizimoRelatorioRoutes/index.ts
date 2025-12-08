import { FastifyInstance } from "fastify";
import { DizimoRelatorioController } from "../../Controllers/DizimoRelatorioController";

const dizimoRelatoriosController = new DizimoRelatorioController();

export async function dizimoRelatorioRoutes(app: FastifyInstance) {
  // app.post("/dizimos/multiple", dizimoRelatoriosController.createMany);
  // app.post("/dizimos", dizimoRelatoriosController.create);
  app.get(
    "/dizimos/relatorio/cards",
    dizimoRelatoriosController.findAllRelatorioCardsController
  );
  // 🔹 NOVO: relatório detalhado (para sua tela de filtros)
  app.get(
    "/dizimos/relatorio/detalhado",
    dizimoRelatoriosController.findRelatorioDetalhado
  );
  app.get(
    "/dizimos/relatorio/:idSupervisao",
    dizimoRelatoriosController.findByIdSupervisao
  );
  app.get(
    "/dizimos/relatorio/:idSupervisao/:idCelula",
    dizimoRelatoriosController.findById
  );
  app.get(
    "/dizimos/relatorio/mensal",
    dizimoRelatoriosController.findRelatorioMensal
  );
}
