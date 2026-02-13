import { Prisma, PrismaClient, SupervisaoTipo } from "@prisma/client";
import { createPrismaInstance } from "../../services/prisma";

type ListHierarchyCardsInput = {
  q?: string;
  limit?: number;
};

type HierarchyCounts = {
  distritos: number;
  areas: number;
  setores: number;
};

type HierarchyCardItem = {
  id: string;
  nome: string;
  cor: string;
  tipo: SupervisaoTipo;
  parentId: string | null;
  supervisor: {
    id: string;
    first_name: string;
    image_url: string | null;
    cargo_de_lideranca: {
      id: string;
      nome: string;
    } | null;
  } | null;
  quantidadeCelulas: number;
  quantidadeMembros: number;
  hierarchy: HierarchyCounts;
};

type ListHierarchyCardsResult = {
  total: number;
  items: HierarchyCardItem[];
};

type DescendantTypeRow = {
  ancestorId: string;
  tipo: SupervisaoTipo;
  total: number;
};

type CelulasRow = {
  ancestorId: string;
  totalCelulas: number;
};

type MembrosRow = {
  ancestorId: string;
  totalMembros: number;
};

type UpdateHierarchyNodeInput = {
  nodeId: string;
  nome?: string;
  cor?: string;
  tipo?: SupervisaoTipo;
  parentId?: string | null;
  userId?: string | null;
};

type UpdateHierarchyNodeResult = {
  node: {
    id: string;
    nome: string;
    cor: string;
    tipo: SupervisaoTipo;
    parentId: string | null;
    userId: string | null;
  };
  closure: {
    relinked: boolean;
    removedLinks: number;
    insertedLinks: number;
  };
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

export class AdminSupervisaoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminSupervisaoValidationError";
  }
}

export class AdminSupervisaoNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminSupervisaoNotFoundError";
  }
}

class AdminSupervisaoRepository {
  constructor(private readonly prisma: PrismaClient = createPrismaInstance()) {}

  async listHierarchyCards(
    input: ListHierarchyCardsInput,
  ): Promise<ListHierarchyCardsResult> {
    const limit = Math.min(Math.max(input.limit ?? 200, 1), 500);
    const search = input.q?.trim();

    const where: Prisma.SupervisaoWhereInput = search
      ? {
          nome: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const [total, supervisoes] = await this.prisma.$transaction([
      this.prisma.supervisao.count({ where }),
      this.prisma.supervisao.findMany({
        where,
        take: limit,
        orderBy: [{ tipo: "asc" }, { nome: "asc" }],
        select: {
          id: true,
          nome: true,
          cor: true,
          tipo: true,
          parentId: true,
          supervisor: {
            select: {
              id: true,
              first_name: true,
              image_url: true,
              cargo_de_lideranca: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          _count: {
            select: {
              celulas: true,
            },
          },
        },
      }),
    ]);

    if (!supervisoes.length) {
      return { total, items: [] };
    }

    const ancestorIds = supervisoes.map((item) => item.id);
    const ancestorIdsSql = Prisma.join(ancestorIds);

    const [descendantTypeRows, celulasRows, membrosRows] =
      await this.prisma.$transaction([
        this.prisma.$queryRaw<DescendantTypeRow[]>(Prisma.sql`
          SELECT
            sc."ancestorId" AS "ancestorId",
            s."tipo" AS "tipo",
            COUNT(*)::int AS "total"
          FROM "supervisao_closure" sc
          JOIN "supervisao" s ON s."id" = sc."descendantId"
          WHERE sc."depth" > 0
            AND sc."ancestorId" IN (${ancestorIdsSql})
          GROUP BY sc."ancestorId", s."tipo"
        `),
        this.prisma.$queryRaw<CelulasRow[]>(Prisma.sql`
          SELECT
            sc."ancestorId" AS "ancestorId",
            COUNT(c."id")::int AS "totalCelulas"
          FROM "supervisao_closure" sc
          JOIN "celula" c ON c."supervisaoId" = sc."descendantId"
          WHERE sc."ancestorId" IN (${ancestorIdsSql})
          GROUP BY sc."ancestorId"
        `),
        this.prisma.$queryRaw<MembrosRow[]>(Prisma.sql`
          SELECT
            sc."ancestorId" AS "ancestorId",
            COUNT(u."id")::int AS "totalMembros"
          FROM "supervisao_closure" sc
          JOIN "celula" c ON c."supervisaoId" = sc."descendantId"
          JOIN "user" u ON u."celulaId" = c."id"
          WHERE sc."ancestorId" IN (${ancestorIdsSql})
          GROUP BY sc."ancestorId"
        `),
      ]);

    const hierarchyMap = new Map<string, HierarchyCounts>();
    for (const row of descendantTypeRows) {
      const current =
        hierarchyMap.get(row.ancestorId) ?? { distritos: 0, areas: 0, setores: 0 };

      if (row.tipo === SupervisaoTipo.DISTRITO) {
        current.distritos = Number(row.total) || 0;
      }

      if (row.tipo === SupervisaoTipo.AREA) {
        current.areas = Number(row.total) || 0;
      }

      if (row.tipo === SupervisaoTipo.SETOR) {
        current.setores = Number(row.total) || 0;
      }

      hierarchyMap.set(row.ancestorId, current);
    }

    const celulasMap = new Map<string, number>();
    for (const row of celulasRows) {
      celulasMap.set(row.ancestorId, Number(row.totalCelulas) || 0);
    }

    const membrosMap = new Map<string, number>();
    for (const row of membrosRows) {
      membrosMap.set(row.ancestorId, Number(row.totalMembros) || 0);
    }

    const items: HierarchyCardItem[] = supervisoes.map((supervisao) => ({
      id: supervisao.id,
      nome: supervisao.nome,
      cor: supervisao.cor,
      tipo: supervisao.tipo,
      parentId: supervisao.parentId,
      supervisor: supervisao.supervisor
        ? {
            id: supervisao.supervisor.id,
            first_name: supervisao.supervisor.first_name,
            image_url: supervisao.supervisor.image_url ?? null,
            cargo_de_lideranca: supervisao.supervisor.cargo_de_lideranca
              ? {
                  id: supervisao.supervisor.cargo_de_lideranca.id,
                  nome: supervisao.supervisor.cargo_de_lideranca.nome,
                }
              : null,
          }
        : null,
      quantidadeCelulas:
        celulasMap.get(supervisao.id) ?? Number(supervisao._count.celulas) ?? 0,
      quantidadeMembros: membrosMap.get(supervisao.id) ?? 0,
      hierarchy:
        hierarchyMap.get(supervisao.id) ?? {
          distritos: 0,
          areas: 0,
          setores: 0,
        },
    }));

    return {
      total,
      items,
    };
  }

  async updateHierarchyNode(
    input: UpdateHierarchyNodeInput,
  ): Promise<UpdateHierarchyNodeResult> {
    const { nodeId } = input;

    const hasAnyChange =
      input.nome !== undefined ||
      input.cor !== undefined ||
      input.tipo !== undefined ||
      input.parentId !== undefined ||
      input.userId !== undefined;

    if (!hasAnyChange) {
      throw new AdminSupervisaoValidationError(
        "Informe ao menos um campo para atualização.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const currentNode = await tx.supervisao.findUnique({
        where: { id: nodeId },
        select: {
          id: true,
          nome: true,
          cor: true,
          tipo: true,
          parentId: true,
          userId: true,
          children: {
            select: {
              id: true,
              tipo: true,
            },
          },
        },
      });

      if (!currentNode) {
        throw new AdminSupervisaoNotFoundError(
          "Nó de supervisão não encontrado.",
        );
      }

      const nextNome =
        input.nome !== undefined ? input.nome.trim() : currentNode.nome;
      const nextCor = input.cor !== undefined ? input.cor.trim() : currentNode.cor;
      const nextTipo = input.tipo ?? currentNode.tipo;
      const nextParentId =
        input.parentId !== undefined ? input.parentId : currentNode.parentId;
      const nextUserId = input.userId !== undefined ? input.userId : currentNode.userId;

      if (!nextNome) {
        throw new AdminSupervisaoValidationError(
          "nome não pode ser vazio.",
        );
      }

      if (!nextCor) {
        throw new AdminSupervisaoValidationError(
          "cor não pode ser vazia.",
        );
      }

      if (nextTipo === SupervisaoTipo.SUPERVISAO_TOPO && nextParentId) {
        throw new AdminSupervisaoValidationError(
          "SUPERVISAO_TOPO não pode ter parentId.",
        );
      }

      if (nextTipo !== SupervisaoTipo.SUPERVISAO_TOPO && !nextParentId) {
        throw new AdminSupervisaoValidationError(
          `${nextTipo} exige parentId válido.`,
        );
      }

      if (nextParentId && nextParentId === currentNode.id) {
        throw new AdminSupervisaoValidationError(
          "Um nó não pode ser pai dele mesmo.",
        );
      }

      if (nextParentId) {
        const parentNode = await tx.supervisao.findUnique({
          where: { id: nextParentId },
          select: { id: true, tipo: true },
        });

        if (!parentNode) {
          throw new AdminSupervisaoValidationError("parentId não encontrado.");
        }

        const allowedParentTypes = allowedParentsByType[nextTipo];
        if (
          allowedParentTypes !== null &&
          !allowedParentTypes.includes(parentNode.tipo)
        ) {
          throw new AdminSupervisaoValidationError(
            `${nextTipo} exige parent tipo ${allowedParentTypes.join(" ou ")}, recebido ${parentNode.tipo}.`,
          );
        }

        const cycleCheck = await tx.supervisaoClosure.findUnique({
          where: {
            ancestorId_descendantId: {
              ancestorId: currentNode.id,
              descendantId: nextParentId,
            },
          },
          select: { ancestorId: true },
        });

        if (cycleCheck) {
          throw new AdminSupervisaoValidationError(
            "parentId inválido: criaria ciclo na hierarquia.",
          );
        }
      }

      for (const child of currentNode.children) {
        const childAllowedParents = allowedParentsByType[child.tipo];

        if (
          childAllowedParents === null ||
          !childAllowedParents.includes(nextTipo)
        ) {
          throw new AdminSupervisaoValidationError(
            `Tipo ${nextTipo} é incompatível com o filho ${child.id} (${child.tipo}).`,
          );
        }
      }

      const parentChanged = nextParentId !== currentNode.parentId;

      const updatedNode = await tx.supervisao.update({
        where: { id: currentNode.id },
        data: {
          nome: nextNome,
          cor: nextCor,
          tipo: nextTipo,
          parentId: nextParentId,
          userId: nextUserId,
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

      if (!parentChanged) {
        return {
          node: updatedNode,
          closure: {
            relinked: false,
            removedLinks: 0,
            insertedLinks: 0,
          },
        };
      }

      const closure = await this.relinkSubtreeToNewParent(tx, {
        nodeId: currentNode.id,
        newParentId: nextParentId,
      });

      return {
        node: updatedNode,
        closure,
      };
    });
  }

  private async relinkSubtreeToNewParent(
    tx: Prisma.TransactionClient,
    input: { nodeId: string; newParentId: string | null },
  ) {
    const descendantsRaw = await tx.supervisaoClosure.findMany({
      where: { ancestorId: input.nodeId },
      select: {
        descendantId: true,
        depth: true,
      },
    });

    const descendants = descendantsRaw.length
      ? descendantsRaw
      : [{ descendantId: input.nodeId, depth: 0 }];

    const subtreeIds = descendants.map((item) => item.descendantId);

    const oldAncestors = await tx.supervisaoClosure.findMany({
      where: {
        descendantId: input.nodeId,
        ancestorId: {
          notIn: subtreeIds,
        },
      },
      select: {
        ancestorId: true,
      },
    });

    let removedLinks = 0;
    if (oldAncestors.length > 0) {
      const removeResult = await tx.supervisaoClosure.deleteMany({
        where: {
          ancestorId: {
            in: oldAncestors.map((item) => item.ancestorId),
          },
          descendantId: {
            in: subtreeIds,
          },
        },
      });

      removedLinks = removeResult.count;
    }

    let insertedLinks = 0;
    if (input.newParentId) {
      const newAncestors = await tx.supervisaoClosure.findMany({
        where: {
          descendantId: input.newParentId,
        },
        select: {
          ancestorId: true,
          depth: true,
        },
      });

      if (newAncestors.length > 0) {
        const data: Array<{
          ancestorId: string;
          descendantId: string;
          depth: number;
        }> = [];

        for (const ancestor of newAncestors) {
          for (const descendant of descendants) {
            data.push({
              ancestorId: ancestor.ancestorId,
              descendantId: descendant.descendantId,
              depth: ancestor.depth + 1 + descendant.depth,
            });
          }
        }

        if (data.length > 0) {
          const insertResult = await tx.supervisaoClosure.createMany({
            data,
            skipDuplicates: true,
          });

          insertedLinks = insertResult.count;
        }
      }
    }

    return {
      relinked: true,
      removedLinks,
      insertedLinks,
    };
  }
}

export default AdminSupervisaoRepository;

export type {
  ListHierarchyCardsInput,
  ListHierarchyCardsResult,
  HierarchyCardItem,
  UpdateHierarchyNodeInput,
  UpdateHierarchyNodeResult,
};
