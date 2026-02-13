import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// mesma regra do seu login
function normalizeMobileRoles(dbRoles: string[]): string[] {
  const mobileRoles = new Set<string>();

  for (const role of dbRoles) {
    if (role === "USER_CENTRAL") mobileRoles.add("USER_CENTRAL");
    else if (
      [
        "USER_SUPERVISOR_AREA",
        "USER_SUPERVISOR_SETOR",
        "USER_SUPERVISOR_DISTRITO",
      ].includes(role)
    ) {
      mobileRoles.add("USER_SUPERVISOR");
    } else if (role === "USER_LIDER") mobileRoles.add("USER_LIDER");
  }

  return Array.from(mobileRoles);
}

export async function refreshTokenHandler(
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

  // ✅ procurar pelo par (deviceId + tokenHash)
  const tokenRecord = await request.prisma.refreshTokenMobile.findFirst({
    where: { deviceId, tokenHash },
    include: {
      user: {
        include: { user_roles: { include: { rolenew: true } } },
      },
    },
  });

  if (
    !tokenRecord ||
    tokenRecord.revoked ||
    tokenRecord.expiresAt < new Date()
  ) {
    return reply
      .code(401)
      .send({ message: "Refresh token inválido ou expirado" });
  }

  // ✅ corrigir nulls
  const dbRoles = tokenRecord.user.user_roles
    .map((ur) => ur.rolenew.name)
    .filter((name): name is string => Boolean(name));

  const mobileRoles = normalizeMobileRoles(dbRoles);

  const accessToken = jwt.sign(
    {
      sub: tokenRecord.userId,
      email: tokenRecord.user.email,
      roles: mobileRoles,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" },
  );

  // ✅ rotação SEM criar novo row (porque existe @@unique([userId, deviceId]))
  const newRefreshToken = crypto.randomUUID();
  const newHash = sha256(newRefreshToken);
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + 30);

  // importante: updateMany pra ficar seguro contra corrida (token já trocado)
  const result = await request.prisma.refreshTokenMobile.updateMany({
    where: { id: tokenRecord.id, deviceId, tokenHash, revoked: false },
    data: {
      tokenHash: newHash,
      expiresAt: newExpiresAt,
      revoked: false,
      revokedAt: null,
      // lastSeenAt: new Date(), // se você quiser (mas seu model tem lastSeenAt só no PushToken)
    },
  });

  if (result.count !== 1) {
    // alguém já rotacionou esse token (ou replay)
    return reply.code(401).send({ message: "Refresh token já utilizado" });
  }

  return reply.send({
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
    roles: mobileRoles,
  });
}
