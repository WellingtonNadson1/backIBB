import { FastifyInstance } from "fastify";
import { CentralDashboardController } from "../../Controllers/CentralDashboardController";

const controller = new CentralDashboardController();

export async function centralDashboardRoutes(app: FastifyInstance) {
  app.get("/central/dashboard", controller.getDashboard);
}
