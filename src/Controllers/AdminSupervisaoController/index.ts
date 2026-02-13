import { Prisma, SupervisaoTipo } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import AdminSupervisaoRepository, {
  AdminSupervisaoNotFoundError,
  AdminSupervisaoValidationError,
} from "../../Repositories/AdminSupervisaoRepository";
import { createPrismaInstance } from "../../services/prisma";
import {
  SupervisaoTreeService,
  SupervisaoTreeValidationError,
} from "../../services/SupervisaoTreeService";

const prisma = createPrismaInstance();
const supervisaoTreeService = new SupervisaoTreeService();
const adminSupervisaoRepository = new AdminSupervisaoRepository();

type AuthRequest = FastifyRequest & { user?: { id: string } };

const createNodeBodySchema = z.object({
  nome: z.string().trim().min(1, "nome é obrigatório"),
  cor: z.string().trim().min(1, "cor é obrigatória"),
  tipo: z.nativeEnum(SupervisaoTipo),
  parentId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

const updateNodeParamsSchema = z.object({
  nodeId: z.string().uuid(),
});

const updateNodeBodySchema = z
  .object({
    nome: z.string().trim().min(1).optional(),
    cor: z.string().trim().min(1).optional(),
    tipo: z.nativeEnum(SupervisaoTipo).optional(),
    parentId: z.union([z.string().uuid(), z.null()]).optional(),
    userId: z.union([z.string().uuid(), z.null()]).optional(),
    supervisor: z.union([z.string().uuid(), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualização.",
  })
  .refine(
    (data) =>
      data.userId === undefined ||
      data.supervisor === undefined ||
      data.userId === data.supervisor,
    {
      message:
        "userId e supervisor devem ter o mesmo valor quando ambos forem enviados.",
      path: ["supervisor"],
    },
  );

const listSetoresQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const listHierarchyCardsQuerySchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const ADMIN_HIERARCHY_ROLES = new Set(["ADMIN", "USERCENTRAL", "USER_CENTRAL"]);

const REPORT_HIERARCHY_VIEW_ROLES = new Set([
  ...ADMIN_HIERARCHY_ROLES,
  "USERSUPERVISOR",
  "USERSUPERVISORAREA",
  "USERSUPERVISORSETOR",
  "USER_SUPERVISOR",
  "USER_SUPERVISOR_AREA",
  "USER_SUPERVISOR_SETOR",
]);

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

async function isAdminUser(userId: string) {
  return hasAnyRole(userId, ADMIN_HIERARCHY_ROLES);
}

async function canViewReportHierarchy(userId: string) {
  return hasAnyRole(userId, REPORT_HIERARCHY_VIEW_ROLES);
}

function handleKnownErrors(reply: FastifyReply, error: unknown) {
  if (
    error instanceof SupervisaoTreeValidationError ||
    error instanceof AdminSupervisaoValidationError
  ) {
    return reply.status(400).send({ error: error.message });
  }

  if (error instanceof AdminSupervisaoNotFoundError) {
    return reply.status(404).send({ error: error.message });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return reply.status(400).send({
      error: "Falha ao processar supervisão.",
      code: error.code,
    });
  }

  return null;
}

export class AdminSupervisaoController {
  async createNode(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await isAdminUser(requesterId))) {
      return reply.status(403).send({ error: "Acesso restrito a ADMIN" });
    }

    const parsed = createNodeBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Payload inválido",
        details: parsed.error.flatten(),
      });
    }

    const { nome, cor, tipo, parentId, userId } = parsed.data;

    try {
      const created = await supervisaoTreeService.createSupervisaoNode({
        nome,
        cor,
        tipo,
        parentId: parentId ?? undefined,
        userId: userId ?? undefined,
      });

      return reply.status(201).send({
        id: created.node.id,
        nome: created.node.nome,
        tipo: created.node.tipo,
        parentId: created.node.parentId,
        closure: created.closure,
      });
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply
        .status(500)
        .send({ error: "Erro interno ao criar nó de supervisão" });
    }
  }

  async updateNode(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await isAdminUser(requesterId))) {
      return reply.status(403).send({ error: "Acesso restrito a ADMIN" });
    }

    const parsedParams = updateNodeParamsSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.status(400).send({
        error: "Parâmetros inválidos",
        details: parsedParams.error.flatten(),
      });
    }

    const parsedBody = updateNodeBodySchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.status(400).send({
        error: "Payload inválido",
        details: parsedBody.error.flatten(),
      });
    }

    const resolvedUserId =
      parsedBody.data.userId !== undefined
        ? parsedBody.data.userId
        : parsedBody.data.supervisor;

    try {
      const result = await adminSupervisaoRepository.updateHierarchyNode({
        nodeId: parsedParams.data.nodeId,
        nome: parsedBody.data.nome,
        cor: parsedBody.data.cor,
        tipo: parsedBody.data.tipo,
        parentId: parsedBody.data.parentId,
        userId: resolvedUserId,
      });

      return reply.send(result);
    } catch (error) {
      const handled = handleKnownErrors(reply, error);
      if (handled) return handled;

      request.log.error(error as Error);
      return reply
        .status(500)
        .send({ error: "Erro interno ao atualizar nó de supervisão." });
    }
  }

  async listSetores(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await isAdminUser(requesterId))) {
      return reply.status(403).send({ error: "Acesso restrito a ADMIN" });
    }

    const parsed = listSetoresQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Query inválida",
        details: parsed.error.flatten(),
      });
    }

    const setores = await supervisaoTreeService.listSetores({
      q: parsed.data.q,
      limit: parsed.data.limit,
    });

    return reply.send({ items: setores, total: setores.length });
  }

  async listHierarchyCards(request: AuthRequest, reply: FastifyReply) {
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    if (!(await canViewReportHierarchy(requesterId))) {
      return reply
        .status(403)
        .send({ error: "Acesso restrito a ADMIN/USERCENTRAL/SUPERVISOR" });
    }

    const parsed = listHierarchyCardsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Query inválida",
        details: parsed.error.flatten(),
      });
    }

    try {
      const result = await adminSupervisaoRepository.listHierarchyCards({
        q: parsed.data.q,
        limit: parsed.data.limit,
      });

      return reply.send(result);
    } catch (error) {
      request.log.error(error as Error);
      return reply
        .status(500)
        .send({ error: "Erro interno ao listar hierarquia de supervisões." });
    }
  }
}
