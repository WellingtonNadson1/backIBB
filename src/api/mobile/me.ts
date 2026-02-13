import { FastifyReply, FastifyRequest } from "fastify";

// Usar middleware existente (requireAuth já valida JWT)
export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request as any).user?.id; // ou request.user se você tipou
  if (!userId) return reply.status(401).send({ message: "Não autenticado" });

  const user = await request.prisma.user.findUnique({
    where: { id: userId },
    include: { user_roles: { include: { rolenew: true } } },
  });

  if (!user)
    return reply.status(404).send({ message: "Usuário não encontrado" });

  const roles = user.user_roles
    .map((ur) => ur.rolenew?.name)
    .filter((r): r is string => Boolean(r)); // evita null

  return reply.send({
    user: {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      avatar: user.image_url,
    },
    roles,
  });
}
