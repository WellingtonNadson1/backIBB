import { FastifyReply, FastifyRequest } from "fastify";
import { RefreshTokenUserUseCase } from "./RefreshTokenUserUseCase";

class RefreshTokenUserController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const { refresh_token } = request.body as { refresh_token: string };

    const refreshTokenUserUseCase = new RefreshTokenUserUseCase();
    const token = await refreshTokenUserUseCase.execute(refresh_token, reply);

    return reply.status(200).send(token);
  }
}

export { RefreshTokenUserController };
