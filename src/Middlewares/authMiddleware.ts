import { FastifyReply, FastifyRequest } from "fastify";
import { verify } from "jsonwebtoken";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authToken = request.headers.authorization;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (["POST"].includes(request.method) && request.url === "/login") {
    return;
  }
  if (["POST"].includes(request.method) && request.url === "/users") {
    return;
  }

  if (!authToken || !authToken.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const token = authToken.substring(7);

  try {
    if (typeof JWT_SECRET === "undefined") {
      throw new Error("JWT_TOKEN is not defined in the environment");
    }

    verify(token, JWT_SECRET);
  } catch (err) {
    reply.code(401).send({ error: "Token invalid" });
  }
}
