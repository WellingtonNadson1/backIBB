import { FastifyInstance } from "fastify";
import { DizimoController } from "../../Controllers/DizimoController";

const dizimoController = new DizimoController();

export async function dizimoRoutes(app: FastifyInstance) {
  app.post("/dizimos/multiple", dizimoController.createMany);
  app.post("/dizimos", dizimoController.create);
  app.get("/dizimos", dizimoController.findAll);
  app.get("/dizimos/:id", dizimoController.findById);
  app.put("/dizimos/:id", dizimoController.update);
  app.delete("/dizimos/:id", dizimoController.delete);
}
