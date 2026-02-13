// app/api/mobile/auth/login/route.ts (Next.js)
// OU /login (Fastify - ajustar rota existente)

import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  deviceId: z.string().optional(),
});

export async function mobileLoginHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const body = loginSchema.parse(request.body);

  // 1. Buscar usuário
  const user = await request.prisma.user.findUnique({
    where: { email: body.email },
    include: {
      user_roles: {
        include: { rolenew: true },
      },
    },
  });

  if (!user || !user.password) {
    return reply.status(401).send({ message: "Credenciais inválidas" });
  }

  // 2. Validar senha
  const isValid = await compare(body.password, user.password);
  if (!isValid) {
    return reply.status(401).send({ message: "Credenciais inválidas" });
  }

  // 3. Extrair roles (adaptar de user_roles)
  const dbRoles = user.user_roles
    .map((ur) => ur.rolenew.name)
    .filter((name): name is string => Boolean(name));

  // Normalizar para mobile (unificar supervisores)
  const mobileRoles = normalizeMobileRoles(dbRoles);

  // 4. Gerar access token (15 min)
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, roles: mobileRoles },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" },
  );

  // 5. Gerar refresh token (30 dias)
  const refreshToken = randomUUID();
  const tokenHash = createHash("sha256").update(refreshToken).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // 6. Salvar refresh token (criar tabela)
  await request.prisma.refreshTokenMobile.upsert({
    where: {
      userId_deviceId: {
        userId: user.id,
        deviceId: body.deviceId || "unknown",
      },
    },
    update: {
      tokenHash,
      expiresAt,
      revoked: false,
      revokedAt: null,
      replacedById: null,
    },
    create: {
      userId: user.id,
      deviceId: body.deviceId || "unknown",
      tokenHash,
      expiresAt,
      revoked: false,
    },
  });

  // 7. Response
  return reply.send({
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      avatar: user.image_url,
    },
    roles: mobileRoles, // ['USERCENTRAL', 'USERLIDER']
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 min em segundos
  });
}
// Função helper
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
    // Ignorar roles fora do MVP (FINANCEIRO, ADMIN, etc.)
  }

  return Array.from(mobileRoles);
}
