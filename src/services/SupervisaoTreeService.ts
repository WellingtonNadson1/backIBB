import {
  Prisma,
  PrismaClient,
  SupervisaoTipo,
  type Supervisao,
} from "@prisma/client";
import { createPrismaInstance } from "./prisma";

type PrismaTreeClient = Pick<PrismaClient, "$transaction" | "supervisao">;

type CreateSupervisaoNodeInput = {
  nome: string;
  cor: string;
  tipo: SupervisaoTipo;
  parentId?: string;
  userId?: string;
};

type CreateSupervisaoNodeResult = {
  node: Pick<Supervisao, "id" | "nome" | "cor" | "tipo" | "parentId" | "userId">;
  closure: {
    selfLinksAttempted: number;
    selfLinksInserted: number;
    ancestorLinksAttempted: number;
    ancestorLinksInserted: number;
  };
};

type ListSetoresInput = {
  q?: string;
  limit?: number;
};

type SetorListItem = {
  id: string;
  nome: string;
  tipo: SupervisaoTipo;
  parentId: string | null;
  areaNome: string | null;
  distritoNome: string | null;
  topoNome: string | null;
  label: string;
};

const allowedParentsByType: Record<SupervisaoTipo, SupervisaoTipo[] | null> = {
  SUPERVISAO_TOPO: null,
  DISTRITO: [SupervisaoTipo.SUPERVISAO_TOPO],
  AREA: [SupervisaoTipo.DISTRITO, SupervisaoTipo.SUPERVISAO_TOPO],
  SETOR: [
    SupervisaoTipo.AREA,
    SupervisaoTipo.DISTRITO,
    SupervisaoTipo.SUPERVISAO_TOPO,
  ],
};

export class SupervisaoTreeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupervisaoTreeValidationError";
  }
}

function buildSetorLabel(parts: {
  setorNome: string;
  areaNome: string | null;
  distritoNome: string | null;
  topoNome: string | null;
}) {
  return [
    parts.setorNome,
    parts.areaNome,
    parts.distritoNome,
    parts.topoNome,
  ]
    .filter(Boolean)
    .join(" — ");
}

export async function createSupervisaoNode(
  input: CreateSupervisaoNodeInput,
  prisma: PrismaTreeClient = createPrismaInstance(),
): Promise<CreateSupervisaoNodeResult> {
  const { nome, cor, tipo, parentId, userId } = input;

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const allowedParentTypes = allowedParentsByType[tipo];

    if (allowedParentTypes === null && parentId) {
      throw new SupervisaoTreeValidationError(
        "SUPERVISAO_TOPO não pode ter parentId.",
      );
    }

    if (allowedParentTypes !== null && !parentId) {
      throw new SupervisaoTreeValidationError(
        `${tipo} exige parentId com tipo ${allowedParentTypes.join(" ou ")}.`,
      );
    }

    let parent: { id: string; tipo: SupervisaoTipo } | null = null;

    if (parentId) {
      parent = await tx.supervisao.findUnique({
        where: { id: parentId },
        select: { id: true, tipo: true },
      });

      if (!parent) {
        throw new SupervisaoTreeValidationError("parentId não encontrado.");
      }

      if (
        allowedParentTypes !== null &&
        !allowedParentTypes.includes(parent.tipo)
      ) {
        throw new SupervisaoTreeValidationError(
          `${tipo} exige parent tipo ${allowedParentTypes.join(
            " ou ",
          )}, recebido ${parent.tipo}.`,
        );
      }
    }

    const node = await tx.supervisao.create({
      data: {
        nome,
        cor,
        tipo,
        parentId: parent?.id,
        userId: userId ?? null,
      },
      select: {
        id: true,
        nome: true,
        cor: true,
        tipo: true,
        parentId: true,
        userId: true,
      },
    });

    const selfLinkInsert = await tx.supervisaoClosure.createMany({
      data: [{ ancestorId: node.id, descendantId: node.id, depth: 0 }],
      skipDuplicates: true,
    });

    let ancestorLinksAttempted = 0;
    let ancestorLinksInserted = 0;

    if (parent?.id) {
      const parentAncestors = await tx.supervisaoClosure.findMany({
        where: { descendantId: parent.id },
        select: { ancestorId: true, depth: true },
      });

      const ancestorsSource =
        parentAncestors.length > 0
          ? parentAncestors
          : [{ ancestorId: parent.id, depth: 0 }];

      const ancestorLinksData = ancestorsSource.map((ancestor) => ({
        ancestorId: ancestor.ancestorId,
        descendantId: node.id,
        depth: ancestor.depth + 1,
      }));

      ancestorLinksAttempted = ancestorLinksData.length;

      const ancestorInsert = await tx.supervisaoClosure.createMany({
        data: ancestorLinksData,
        skipDuplicates: true,
      });

      ancestorLinksInserted = ancestorInsert.count;
    }

    return {
      node,
      closure: {
        selfLinksAttempted: 1,
        selfLinksInserted: selfLinkInsert.count,
        ancestorLinksAttempted,
        ancestorLinksInserted,
      },
    };
  });
}

export class SupervisaoTreeService {
  constructor(private readonly prisma: PrismaTreeClient = createPrismaInstance()) {}

  async createSupervisaoNode(input: CreateSupervisaoNodeInput) {
    return createSupervisaoNode(input, this.prisma);
  }

  async listSetores(input: ListSetoresInput): Promise<SetorListItem[]> {
    const limit = Math.min(Math.max(input.limit ?? 100, 1), 100);
    const search = input.q?.trim();

    const setores = await this.prisma.supervisao.findMany({
      where: {
        tipo: SupervisaoTipo.SETOR,
        ...(search
          ? {
              nome: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            }
          : {}),
      },
      orderBy: { nome: "asc" },
      take: limit,
      select: {
        id: true,
        nome: true,
        tipo: true,
        parentId: true,
        parent: {
          select: {
            nome: true,
            parent: {
              select: {
                nome: true,
                parent: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return setores.map((setor) => {
      const areaNome = setor.parent?.nome ?? null;
      const distritoNome = setor.parent?.parent?.nome ?? null;
      const topoNome = setor.parent?.parent?.parent?.nome ?? null;

      return {
        id: setor.id,
        nome: setor.nome,
        tipo: setor.tipo,
        parentId: setor.parentId,
        areaNome,
        distritoNome,
        topoNome,
        label: buildSetorLabel({
          setorNome: setor.nome,
          areaNome,
          distritoNome,
          topoNome,
        }),
      };
    });
  }
}

export type {
  CreateSupervisaoNodeInput,
  CreateSupervisaoNodeResult,
  ListSetoresInput,
  SetorListItem,
};
