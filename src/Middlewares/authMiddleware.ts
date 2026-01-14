import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

type JwtPayload = {
  sub: string; // userId
  email?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email?: string;
      roles?: string[];
    };
  }
}

function getPathname(url: string) {
  // remove querystring se existir
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // ✅ libera preflight
  if (request.method === "OPTIONS") return;

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    request.log.error("JWT_SECRET is missing");
    return reply.status(500).send({ error: "Server misconfigured" });
  }

  const pathname = getPathname(request.url);

  const publicRoutes = new Set([
    "/login",
    "/refresh-token",
    "/password/recorver",
    "/password/reset",
    "/users",
  ]);

  if (publicRoutes.has(pathname)) return;

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded?.sub) {
      return reply.status(401).send({ error: "Token sem sub (userId)" });
    }

    request.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };
  } catch (err) {
    request.log.error({ err }, "jwt verify failed");
    return reply.status(401).send({ error: "Token invalid" });
  }
}
