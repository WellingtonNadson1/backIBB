import { FastifyInstance } from "fastify";
import { OfertaController } from "../../Controllers/OfertaController";

const ofertaController = new OfertaController();

export async function ofertaRoutes(app: FastifyInstance) {
  app.post("/ofertas/multiple", ofertaController.createMany);
  app.post("/ofertas", ofertaController.create);
  app.get("/ofertas", ofertaController.findAll);
  app.get("/ofertas/:id", ofertaController.findById);
  app.put("/ofertas/:id", ofertaController.update);
  app.delete("/ofertas/:id", ofertaController.delete);
}
