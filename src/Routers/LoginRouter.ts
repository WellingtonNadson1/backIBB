import { FastifyInstance } from "fastify";
import LoginController from "../Controllers/LoginController";
import { RefreshTokenUserController } from "../refreshToken/RefreshTokenUserController";

const refresfTokenUserController = new RefreshTokenUserController();

// const routerUser = Router();
const routerLogin = async (fastify: FastifyInstance) => {
  // CELULA
  // fastify.get("/celulas", LoginController.index);
  // fastify.get('/celulas/:id', LoginController.show);
  fastify.post("/login", LoginController.login);
  fastify.post("/refresh-token", refresfTokenUserController.handle);
  // fastify.delete("/celulas/:id", LoginController.delete);
  // fastify.put("/celulas/:id", LoginController.update);
};

export default routerLogin;
