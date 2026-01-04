import { FastifyInstance } from "fastify";
import { LiderMembroController } from "../../Controllers/LiderMembroController";

const controller = new LiderMembroController();

export async function liderMembrosRoutes(app: FastifyInstance) {
  app.get("/lider/membros/:id", controller.show);
  app.get("/lider/membros/:id/presencas", controller.presencas);
}
