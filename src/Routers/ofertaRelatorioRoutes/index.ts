import { FastifyInstance } from "fastify";
import { OfertaRelatorioController } from "../../Controllers/OfertaRelatorioController";

const ofertaRelatoriosController = new OfertaRelatorioController();

export async function dizimoRelatorioRoutes(app: FastifyInstance) {
  // app.post("/ofertas/multiple", ofertaRelatoriosController.createMany);
  // app.post("/ofertas", ofertaRelatoriosController.create);
  app.get("/ofertas/relatorio/cards", ofertaRelatoriosController.findAllRelatorioCardsController);
  app.get(
    "/ofertas/relatorio/:idSupervisao",
    ofertaRelatoriosController.findByIdSupervisao
  );
  app.get(
    "/ofertas/relatorio/:idSupervisao/:idCelula",
    ofertaRelatoriosController.findById
  );
  // app.put("/ofertas/:id", ofertaRelatoriosController.update);
  // app.delete("/ofertas/:id", ofertaRelatoriosController.delete);
}
