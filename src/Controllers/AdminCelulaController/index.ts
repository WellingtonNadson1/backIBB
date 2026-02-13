import { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { createPrismaInstance } from "../../services/prisma";
import {
  AdminCelulaNotFoundError,
  AdminCelulaService,
  AdminCelulaValidationError,
} from "../../services/AdminCelulaService";

const prisma = createPrismaInstance();
const adminCelulaService = new AdminCelulaService();

type AuthRequest = FastifyRequest & { user?: { id: string } };

const paramsSchema = z.object({
  celulaId: z.string().uuid(),
});

const assignSetorBodySchema = z.object({
  setorId: z.string().uuid(),
});

const listUnassignedQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const assignSetorBulkBodySchema = z.object({
  setorId: z.string().uuid(),
  celulaIds: z.array(z.string().uuid()).min(1),
});

const ADMIN_CELULA_ROLES = new Set(["ADMIN", "USERCENTRAL", "USER_CENTRAL"]);

function normalizeRoleName(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/__+/g, "_");

  return normalized.length > 0 ? normalized : null;
}

async function getRequesterRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      user_roles: {
        select: {
          rolenew: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const roles = new Set<string>();
  const primaryRole = normalizeRoleName(user?.role);
  if (primaryRole) {
    roles.add(primaryRole);
  }

  for (const roleLink of user?.user_roles ?? []) {
    const roleName = normalizeRoleName(roleLink.rolenew?.name ?? null);
    if (roleName) {
      roles.add(roleName);
    }
  }

  return roles;
}

async function hasAnyRole(userId: string, allowedRoles: Set<string>) {
  const requesterRoles = await getRequesterRoles(userId);

  for (const role of requesterRoles) {
    if (allowedRoles.has(role)) {
      return true;
    }
  }

  return false;
}

async function canManageAdminCelula(userId: string) {
  return hasAnyRole(userId, ADMIN_CELULA_ROLES);
}

function handleKnownErrors(reply: FastifyReply, error: unknown) {
  if (error instanceof AdminCelulaValidationError) {
    return reply.status(400).send({ error: error.message });
  }

  if (error instanceof AdminCelulaNotFoundError) {
    return reply.status(404).send({ error: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return reply
      .status(400)
      .send({ error: "Falha ao atualizar célula.", code: error.code });
  }

  return null;
}

export class AdminCelulaController {
  async assignSetor(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await canManageAdminCelula(requesterId))) {
      return reply
        .status(403)
        .send({ error: "Acesso restrito a ADMIN/USERCENTRAL" });
    }

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply
        .status(400)
        .send({ error: "Parâmetros inválidos", details: parsedParams.error.flatten() });
    }

    const parsedBody = assignSetorBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply
        .status(400)
        .send({ error: "Payload inválido", details: parsedBody.error.flatten() });
    }

    try {
      const result = await adminCelulaService.assignCelulaToSetor({
        celulaId: parsedParams.data.celulaId,
        setorId: parsedBody.data.setorId,
      });

      return reply.send(result);
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply.status(500).send({ error: "Erro interno ao atribuir setor." });
    }
  }

  async showCelula(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await canManageAdminCelula(requesterId))) {
      return reply
        .status(403)
        .send({ error: "Acesso restrito a ADMIN/USERCENTRAL" });
    }

    const parsedParams = paramsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply
        .status(400)
        .send({ error: "Parâmetros inválidos", details: parsedParams.error.flatten() });
    }

    try {
      const result = await adminCelulaService.getCelulaForAdmin(
        parsedParams.data.celulaId,
      );
      return reply.send(result);
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply.status(500).send({ error: "Erro interno ao buscar célula." });
    }
  }

  async listUnassigned(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await canManageAdminCelula(requesterId))) {
      return reply
        .status(403)
        .send({ error: "Acesso restrito a ADMIN/USERCENTRAL" });
    }

    const parsedQuery = listUnassignedQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply
        .status(400)
        .send({ error: "Query inválida", details: parsedQuery.error.flatten() });
    }

    try {
      const result = await adminCelulaService.listUnassignedCelulas({
        q: parsedQuery.data.q,
        limit: parsedQuery.data.limit,
      });

      return reply.send(result);
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply
        .status(500)
        .send({ error: "Erro interno ao listar células não atribuídas." });
    }
  }

  async assignSetorBulk(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await canManageAdminCelula(requesterId))) {
      return reply
        .status(403)
        .send({ error: "Acesso restrito a ADMIN/USERCENTRAL" });
    }

    const parsedBody = assignSetorBulkBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply
        .status(400)
        .send({ error: "Payload inválido", details: parsedBody.error.flatten() });
    }

    try {
      const result = await adminCelulaService.assignCelulasToSetorBulk({
        setorId: parsedBody.data.setorId,
        celulaIds: parsedBody.data.celulaIds,
      });

      return reply.send(result);
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply.status(500).send({
        error: "Erro interno ao atribuir setor em lote.",
      });
    }
  }
}
