import { PrismaClient, SupervisaoTipo } from "@prisma/client";
import { createPrismaInstance } from "./prisma";

type PrismaCoverageClient = Pick<
  PrismaClient,
  "supervisao" | "supervisaoClosure" | "user"
>;

export type ReportCoverageNodePayload = {
  nodeId?: unknown;
  supervisionNodeId?: unknown;
  supervisaoId?: unknown;
  superVisionId?: unknown;
};

const REPORT_FULL_SCOPE_ROLES = new Set([
  "ADMIN",
  "USERCENTRAL",
  "USER_CENTRAL",
  "USERSUPERVISOR",
  "USERSUPERVISORAREA",
  "USERSUPERVISORSETOR",
  "USER_SUPERVISOR",
  "USER_SUPERVISOR_AREA",
  "USER_SUPERVISOR_SETOR",
]);

function sanitizeNodeId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveReportNodeId(
  payload: ReportCoverageNodePayload | null | undefined,
): string | null {
  if (!payload) {
    return null;
  }

  const candidates = [
    sanitizeNodeId(payload.nodeId),
    sanitizeNodeId(payload.supervisionNodeId),
    sanitizeNodeId(payload.supervisaoId),
    sanitizeNodeId(payload.superVisionId),
  ];

  return candidates.find(Boolean) ?? null;
}

function normalizeRoleName(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .replace(/__+/g, "_");

  return normalized.length > 0 ? normalized : null;
}

async function getUserRoles(
  userId: string,
  prismaClient: PrismaCoverageClient,
): Promise<Set<string>> {
  const user = await prismaClient.user.findUnique({
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

export async function canViewAllCoverageNodes(
  userId: string,
  prismaClient: PrismaCoverageClient = createPrismaInstance(),
): Promise<boolean> {
  const roles = await getUserRoles(userId, prismaClient);
  for (const role of roles) {
    if (REPORT_FULL_SCOPE_ROLES.has(role)) {
      return true;
    }
  }

  return false;
}

export async function resolveEffectiveCoverageNodeId(
  params: {
    requesterUserId: string;
    requestedNodeId?: string | null;
  },
  prismaClient: PrismaCoverageClient = createPrismaInstance(),
): Promise<string | null> {
  const requester = await prismaClient.user.findUnique({
    where: { id: params.requesterUserId },
    select: {
      supervisaoId: true,
    },
  });

  if (!requester) {
    return null;
  }

  const requestedNodeId = sanitizeNodeId(params.requestedNodeId ?? null);
  const ownSupervisaoId = sanitizeNodeId(requester.supervisaoId);

  if (!requestedNodeId) {
    return ownSupervisaoId;
  }

  const canViewAllNodes = await canViewAllCoverageNodes(
    params.requesterUserId,
    prismaClient,
  );

  if (canViewAllNodes) {
    return requestedNodeId;
  }

  return ownSupervisaoId;
}

async function resolveSetorIdsFromNode(
  nodeId: string,
  nodeTipo: SupervisaoTipo,
  prismaClient: PrismaCoverageClient,
): Promise<string[]> {
  if (nodeTipo === SupervisaoTipo.SETOR) {
    return [nodeId];
  }

  const descendants = await prismaClient.supervisaoClosure.findMany({
    where: {
      ancestorId: nodeId,
      descendant: { tipo: SupervisaoTipo.SETOR },
    },
    select: { descendantId: true },
  });

  return Array.from(new Set(descendants.map((row) => row.descendantId)));
}

export async function resolveSetorIdsForNode(
  nodeId: string,
  prismaClient: PrismaCoverageClient = createPrismaInstance(),
): Promise<string[]> {
  const cleanNodeId = sanitizeNodeId(nodeId);
  if (!cleanNodeId) {
    return [];
  }

  const node = await prismaClient.supervisao.findUnique({
    where: { id: cleanNodeId },
    select: { id: true, tipo: true },
  });

  if (!node) {
    return [];
  }

  return resolveSetorIdsFromNode(node.id, node.tipo, prismaClient);
}

export async function resolveSetorIdsForSupervisor(
  supervisorUserId: string,
  prismaClient: PrismaCoverageClient = createPrismaInstance(),
): Promise<string[]> {
  const rootNode = await prismaClient.supervisao.findFirst({
    where: { userId: supervisorUserId },
    select: { id: true, tipo: true },
  });

  if (!rootNode) {
    return [];
  }

  return resolveSetorIdsFromNode(rootNode.id, rootNode.tipo, prismaClient);
}
