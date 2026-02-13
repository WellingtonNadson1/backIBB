import { z } from "zod";
import { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { refreshToken } = z
    .object({ refreshToken: z.string().min(20) })
    .parse(request.body);

  const deviceId = String(request.headers["x-device-id"] ?? "").trim();
  if (!deviceId)
    return reply.code(400).send({ message: "x-device-id obrigatório" });

  const tokenHash = sha256(refreshToken);

  await request.prisma.refreshTokenMobile.updateMany({
    where: { deviceId, tokenHash, revoked: false },
    data: { revoked: true, revokedAt: new Date() },
  });

  return reply.send({ message: "Logout realizado" });
}
