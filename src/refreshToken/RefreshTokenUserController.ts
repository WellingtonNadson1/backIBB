import { FastifyReply, FastifyRequest } from "fastify";
import { refreshTokenSchema } from "../schemas/refresh-token.schema";
import { RefreshTokenUserUseCase } from "./RefreshTokenUserUseCase";

class RefreshTokenUserController {
  async handle(request: FastifyRequest, reply: FastifyReply) {
    const parsed = refreshTokenSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: "Campo inválido" });
    }

    try {
      const useCase = new RefreshTokenUserUseCase();
      const result = await useCase.execute(
        parsed.data.refresh_token,
        request.prisma
      );

      return reply.code(200).send(result);
    } catch {
      // não vaza se expirou, se não existe, etc
      return reply.code(401).send({ error: "Não autorizado" });
    }
  }
}

export { RefreshTokenUserController };
