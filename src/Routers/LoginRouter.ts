import { FastifyInstance } from "fastify";
import LoginController from "../Controllers/LoginController";

// const routerUser = Router();
const routerLogin = async (fastify: FastifyInstance) => {
  // CELULA
  // fastify.get("/celulas", LoginController.index);
  // fastify.get('/celulas/:id', LoginController.show);
  fastify.post("/login", LoginController.login);
  // fastify.delete("/celulas/:id", LoginController.delete);
  // fastify.put("/celulas/:id", LoginController.update);
};

export default routerLogin;
