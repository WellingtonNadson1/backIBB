import { FastifyInstance } from "fastify";
import { AdminSupervisaoController } from "../../Controllers/AdminSupervisaoController";

const controller = new AdminSupervisaoController();

export async function adminSupervisaoRoutes(app: FastifyInstance) {
  app.post("/admin/supervisoes/nodes", controller.createNode);
  app.patch("/admin/supervisoes/nodes/:nodeId", controller.updateNode);
  app.get("/admin/setores", controller.listSetores);
  app.get("/admin/supervisoes/hierarchy-cards", controller.listHierarchyCards);
}
