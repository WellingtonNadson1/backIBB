// routes/supervisorDashboardRoutes.ts
import { FastifyInstance } from "fastify";
import { SupervisorDashboardController } from "../../Controllers/SupervisorDashboardController";

const controller = new SupervisorDashboardController();

export async function supervisorDashboardRoutes(app: FastifyInstance) {
  app.get("/supervisor/dashboard", controller.getDashboard);
  app.get("/supervisor/dashboard/cultos-mes", controller.cultosMes);

  // ✅ NOVO: página de células (lista + filtros)
  app.get("/supervisor/celulas", controller.listCelulas);

  // ✅ NOVO: detalhes da célula (para acompanhar e agir)
  app.get("/supervisor/celulas/:celulaId", controller.getCelulaDetail);
}
