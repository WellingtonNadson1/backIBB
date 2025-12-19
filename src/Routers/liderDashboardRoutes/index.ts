import { FastifyInstance } from "fastify";
import { LiderDashboardController } from "../../Controllers/LiderDashboardController";

const controller = new LiderDashboardController();

export async function liderDashboardRoutes(app: FastifyInstance) {
  app.get("/lider/dashboard", controller.getDashboard);

  // ✅ novo: card de frequência do mês
  app.get("/lider/dashboard/cultos-mes", controller.cultosMes);
}
