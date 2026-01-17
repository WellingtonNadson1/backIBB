import { FastifyInstance } from "fastify";
import LoginController from "../Controllers/LoginController";
import { RefreshTokenUserController } from "../refreshToken/RefreshTokenUserController";

const refresfTokenUserController = new RefreshTokenUserController();

const routerLogin = async (fastify: FastifyInstance) => {
  fastify.post(
    "/login",
    {
      config: {
        rateLimit: {
          max: 8,
          timeWindow: "10 minutes",
          keyGenerator: (req) => {
            const body = (req.body ?? {}) as any;
            const email =
              typeof body.email === "string" ? body.email.toLowerCase() : "";
            return `login:${req.ip}:${email}`;
          },
        },
      },
    },
    (req, reply) => LoginController.login(req, reply)
  );

  fastify.post(
    "/refresh-token",
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: "10 minutes",
          keyGenerator: (req) => `refresh:${req.ip}`,
        },
      },
    },
    (req, reply) => refresfTokenUserController.handle(req, reply)
  );
};

export default routerLogin;
