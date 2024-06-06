import { FastifyReply, FastifyRequest } from "fastify";
import verify from "jsonwebtoken";


export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authToken = request.headers.authorization;
  const JWT_SECRET = process.env.JWT_SECRET || ""; // Use an empty string if JWT_SECRET is undefined

  // Routes that don't require authentication
  if (
    ["POST", "PUT"].includes(request.method) &&
    (
      request.url === "/login" ||
      request.url === "/password/recorver" ||
      request.url === "/password/reset" ||
      request.url === "/users" ||
      request.url === "/refresh-token"
    )
  ) {
    return;
  }

  // Validate token presence and format
  if (!authToken || !authToken.startsWith("Bearer ")) {
    reply.code(401).send({ error: "Unauthorized" });
    return;
  }

  const token = authToken.substring(7);

  try {
    // Explicitly specify validation for unsigned tokens using 'none' algorithm
    verify.verify(token, JWT_SECRET);

    // Token is valid, proceed with authenticated request handling
    // ...
  } catch (err) {
    // Handle invalid or expired tokens
    reply.code(401).send({ error: "Token invalid" });
  }
}
