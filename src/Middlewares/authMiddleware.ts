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
  const JWT_SECRET = process.env.JWT_SECRET || "";
  const pathname = getPathname(request.url);

  // ✅ Rotas públicas (ajuste conforme seu backend)
  const publicRoutes = new Set([
    "/login",
    "/refresh-token",
    "/password/recorver",
    "/password/reset",
    "/users",
  ]);

  // ✅ Libera se for rota pública (independente de método)
  // Se você quiser restringir método, eu te mostro abaixo.
  if (publicRoutes.has(pathname)) {
    return;
  }

  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded?.sub) {
      return reply.status(401).send({ error: "Token sem sub (userId)" });
    }

    // ✅ salva user no request (agora o controller consegue ler)
    request.user = {
      id: decoded.sub,
      email: decoded.email,
      roles: decoded.roles,
    };
  } catch (err) {
    return reply.status(401).send({ error: "Token invalid" });
  }
}
