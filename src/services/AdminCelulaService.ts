import {
  PrismaClient,
  SupervisaoTipo,
  type Celula,
  type Supervisao,
} from "@prisma/client";
import { createPrismaInstance } from "./prisma";

type PrismaAdminCelulaClient = Pick<
  PrismaClient,
  "$transaction" | "celula" | "supervisao"
>;

type AssignCelulaSetorInput = {
  celulaId: string;
  setorId: string;
};

type AssignedSetor = Pick<Supervisao, "id" | "nome">;

type AssignCelulaSetorResult = {
  celula: Pick<Celula, "id" | "nome" | "supervisaoId">;
  setor: AssignedSetor;
};

type CelulaSetorSummary = {
  id: string;
  nome: string;
  label: string;
  areaNome: string | null;
  distritoNome: string | null;
  topoNome: string | null;
};

type AdminCelulaDetailsResult = {
  celula: Pick<Celula, "id" | "nome" | "supervisaoId">;
  setor: CelulaSetorSummary | null;
  assignmentStatus: "ASSIGNED" | "UNASSIGNED";
};

type ListUnassignedCelulasInput = {
  q?: string;
  limit?: number;
};

type ListUnassignedCelulasResult = {
  total: number;
  celulas: Array<{
    id: string;
    nome: string;
    supervisaoAtual: {
      id: string;
      nome: string;
      tipo: SupervisaoTipo;
    } | null;
  }>;
};

type AssignCelulasToSetorBulkInput = {
  setorId: string;
  celulaIds: string[];
};

type AssignCelulasToSetorBulkResult = {
  setor: AssignedSetor;
  updatedCount: number;
};

export class AdminCelulaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminCelulaValidationError";
  }
}

export class AdminCelulaNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminCelulaNotFoundError";
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

export class AdminCelulaService {
  constructor(
    private readonly prisma: PrismaAdminCelulaClient = createPrismaInstance(),
  ) {}

  async assignCelulaToSetor(
    input: AssignCelulaSetorInput,
  ): Promise<AssignCelulaSetorResult> {
    const { celulaId, setorId } = input;

    return this.prisma.$transaction(async (tx) => {
      const celula = await tx.celula.findUnique({
        where: { id: celulaId },
        select: { id: true, nome: true, supervisaoId: true },
      });

      if (!celula) {
        throw new AdminCelulaNotFoundError("Célula não encontrada.");
      }

      const setor = await tx.supervisao.findUnique({
        where: { id: setorId },
        select: { id: true, nome: true, tipo: true },
      });

      if (!setor || setor.tipo !== SupervisaoTipo.SETOR) {
        throw new AdminCelulaValidationError(
          "setorId inválido: nó inexistente ou tipo diferente de SETOR.",
        );
      }

      const updatedCelula = await tx.celula.update({
        where: { id: celulaId },
        data: { supervisaoId: setor.id },
        select: { id: true, nome: true, supervisaoId: true },
      });

      return {
        celula: updatedCelula,
        setor: { id: setor.id, nome: setor.nome },
      };
    });
  }

  async getCelulaForAdmin(celulaId: string): Promise<AdminCelulaDetailsResult> {
    const celula = await this.prisma.celula.findUnique({
      where: { id: celulaId },
      select: {
        id: true,
        nome: true,
        supervisaoId: true,
        supervisao: {
          select: {
            id: true,
            nome: true,
            tipo: true,
            parent: {
              select: {
                nome: true,
                parent: {
                  select: {
                    nome: true,
                    parent: {
                      select: { nome: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!celula) {
      throw new AdminCelulaNotFoundError("Célula não encontrada.");
    }

    if (celula.supervisao.tipo !== SupervisaoTipo.SETOR) {
      return {
        celula: {
          id: celula.id,
          nome: celula.nome,
          supervisaoId: celula.supervisaoId,
        },
        setor: null,
        assignmentStatus: "UNASSIGNED",
      };
    }

    const areaNome = celula.supervisao.parent?.nome ?? null;
    const distritoNome = celula.supervisao.parent?.parent?.nome ?? null;
    const topoNome = celula.supervisao.parent?.parent?.parent?.nome ?? null;

    return {
      celula: {
        id: celula.id,
        nome: celula.nome,
        supervisaoId: celula.supervisaoId,
      },
      setor: {
        id: celula.supervisao.id,
        nome: celula.supervisao.nome,
        areaNome,
        distritoNome,
        topoNome,
        label: buildSetorLabel({
          setorNome: celula.supervisao.nome,
          areaNome,
          distritoNome,
          topoNome,
        }),
      },
      assignmentStatus: "ASSIGNED",
    };
  }

  async listUnassignedCelulas(
    input: ListUnassignedCelulasInput,
  ): Promise<ListUnassignedCelulasResult> {
    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    const search = input.q?.trim();

    const where = {
      ...(search
        ? {
            nome: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
      NOT: {
        supervisao: {
          is: {
            tipo: SupervisaoTipo.SETOR,
          },
        },
      },
    };

    const [total, celulas] = await this.prisma.$transaction([
      this.prisma.celula.count({ where }),
      this.prisma.celula.findMany({
        where,
        take: limit,
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          supervisao: {
            select: {
              id: true,
              nome: true,
              tipo: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      celulas: celulas.map((celula) => ({
        id: celula.id,
        nome: celula.nome,
        supervisaoAtual: celula.supervisao
          ? {
              id: celula.supervisao.id,
              nome: celula.supervisao.nome,
              tipo: celula.supervisao.tipo,
            }
          : null,
      })),
    };
  }

  async assignCelulasToSetorBulk(
    input: AssignCelulasToSetorBulkInput,
  ): Promise<AssignCelulasToSetorBulkResult> {
    const { setorId, celulaIds } = input;

    if (!celulaIds.length) {
      throw new AdminCelulaValidationError(
        "celulaIds não pode ser vazio para atribuição em lote.",
      );
    }

    const uniqueCelulaIds = new Set(celulaIds);
    if (uniqueCelulaIds.size !== celulaIds.length) {
      throw new AdminCelulaValidationError(
        "celulaIds não pode conter IDs duplicados.",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const setor = await tx.supervisao.findUnique({
        where: { id: setorId },
        select: { id: true, nome: true, tipo: true },
      });

      if (!setor) {
        throw new AdminCelulaValidationError("setorId não encontrado.");
      }

      if (setor.tipo !== SupervisaoTipo.SETOR) {
        throw new AdminCelulaValidationError(
          "setorId inválido: tipo diferente de SETOR.",
        );
      }

      const existingCelulas = await tx.celula.findMany({
        where: { id: { in: Array.from(uniqueCelulaIds) } },
        select: { id: true },
      });

      const existingIds = new Set(existingCelulas.map((celula) => celula.id));
      const missingIds = Array.from(uniqueCelulaIds).filter(
        (id) => !existingIds.has(id),
      );

      if (missingIds.length > 0) {
        throw new AdminCelulaValidationError(
          `celulaIds contém IDs inexistentes: ${missingIds.join(", ")}`,
        );
      }

      const updated = await tx.celula.updateMany({
        where: { id: { in: Array.from(uniqueCelulaIds) } },
        data: { supervisaoId: setor.id },
      });

      return {
        setor: { id: setor.id, nome: setor.nome },
        updatedCount: updated.count,
      };
    });
  }
}

export type {
  AssignCelulaSetorInput,
  AssignCelulaSetorResult,
  AdminCelulaDetailsResult,
  ListUnassignedCelulasInput,
  ListUnassignedCelulasResult,
  AssignCelulasToSetorBulkInput,
  AssignCelulasToSetorBulkResult,
};
