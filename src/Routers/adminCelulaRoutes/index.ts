import { FastifyInstance } from "fastify";
import { AdminCelulaController } from "../../Controllers/AdminCelulaController";

const controller = new AdminCelulaController();

export async function adminCelulaRoutes(app: FastifyInstance) {
  app.get("/admin/celulas/unassigned", controller.listUnassigned);
  app.patch("/admin/celulas/assign-setor-bulk", controller.assignSetorBulk);
  app.patch("/admin/celulas/:celulaId/setor", controller.assignSetor);
  app.get("/admin/celulas/:celulaId", controller.showCelula);
}
