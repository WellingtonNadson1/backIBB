import { FastifyInstance } from "fastify";
import { DizimoController } from "../../Controllers/DizimoController";

const dizimoController = new DizimoController();

export async function dizimoRoutes(app: FastifyInstance) {
  app.post("/ofertas/multiple", dizimoController.createMany);
  app.post("/ofertas", dizimoController.create);
  app.get("/ofertas", dizimoController.findAll);
  app.get("/ofertas/:id", dizimoController.findById);
  app.put("/ofertas/:id", dizimoController.update);
  app.delete("/ofertas/:id", dizimoController.delete);
}
