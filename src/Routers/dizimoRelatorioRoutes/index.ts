import { FastifyInstance } from "fastify";
import { DizimoRelatorioController } from "../../Controllers/DizimoRelatorioController";

const dizimoRelatoriosController = new DizimoRelatorioController();

export async function dizimoRelatorioRoutes(app: FastifyInstance) {
  // app.post("/dizimos/multiple", dizimoRelatoriosController.createMany);
  // app.post("/dizimos", dizimoRelatoriosController.create);
  // app.get("/dizimos", dizimoRelatoriosController.findAll);
  app.get(
    "/dizimos/relatorio/:idSupervisao",
    dizimoRelatoriosController.findByIdSupervisao
  );
  app.get(
    "/dizimos/relatorio/:idSupervisao/:idCelula",
    dizimoRelatoriosController.findById
  );
  // app.put("/dizimos/:id", dizimoRelatoriosController.update);
  // app.delete("/dizimos/:id", dizimoRelatoriosController.delete);
}
