import { SupervisaoTipo } from "@prisma/client";
import {
  AdminCelulaNotFoundError,
  AdminCelulaService,
  AdminCelulaValidationError,
} from "../services/AdminCelulaService";

function buildMockPrisma(tx: any, root?: any) {
  return {
    $transaction: jest.fn(async (arg: any) => {
      if (typeof arg === "function") {
        return arg(tx);
      }

      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }

      return arg;
    }),
    celula: root?.celula ?? { findUnique: jest.fn() },
    supervisao: root?.supervisao ?? { findUnique: jest.fn() },
  } as any;
}

describe("AdminCelulaService", () => {
  it("returns 400-style validation error when setor does not exist", async () => {
    const tx = {
      celula: {
        findUnique: jest.fn().mockResolvedValue({
          id: "celula-1",
          nome: "Celula A",
          supervisaoId: "legacy-supervisao",
        }),
        update: jest.fn(),
      },
      supervisao: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulaToSetor({ celulaId: "celula-1", setorId: "x" }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("returns 400-style validation error when supervisao tipo is not SETOR", async () => {
    const tx = {
      celula: {
        findUnique: jest.fn().mockResolvedValue({
          id: "celula-1",
          nome: "Celula A",
          supervisaoId: "legacy-supervisao",
        }),
        update: jest.fn(),
      },
      supervisao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "area-1",
          nome: "Area 1",
          tipo: SupervisaoTipo.AREA,
        }),
      },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulaToSetor({ celulaId: "celula-1", setorId: "area-1" }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("updates celula.supervisaoId when setor is valid", async () => {
    const tx = {
      celula: {
        findUnique: jest.fn().mockResolvedValue({
          id: "celula-1",
          nome: "Celula A",
          supervisaoId: "legacy-supervisao",
        }),
        update: jest.fn().mockResolvedValue({
          id: "celula-1",
          nome: "Celula A",
          supervisaoId: "setor-1",
        }),
      },
      supervisao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "setor-1",
          nome: "Setor Norte",
          tipo: SupervisaoTipo.SETOR,
        }),
      },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));
    const result = await service.assignCelulaToSetor({
      celulaId: "celula-1",
      setorId: "setor-1",
    });

    expect(tx.celula.update).toHaveBeenCalledWith({
      where: { id: "celula-1" },
      data: { supervisaoId: "setor-1" },
      select: { id: true, nome: true, supervisaoId: true },
    });

    expect(result).toEqual({
      celula: { id: "celula-1", nome: "Celula A", supervisaoId: "setor-1" },
      setor: { id: "setor-1", nome: "Setor Norte" },
    });
  });

  it("returns unassigned when celula.supervisao.tipo is not SETOR", async () => {
    const prisma = buildMockPrisma(
      { celula: {}, supervisao: {} },
      {
        celula: {
          findUnique: jest.fn().mockResolvedValue({
            id: "celula-1",
            nome: "Celula A",
            supervisaoId: "topo-1",
            supervisao: {
              id: "topo-1",
              nome: "Topo 1",
              tipo: SupervisaoTipo.SUPERVISAO_TOPO,
              parent: null,
            },
          }),
        },
      },
    );

    const service = new AdminCelulaService(prisma);
    const result = await service.getCelulaForAdmin("celula-1");

    expect(result.assignmentStatus).toBe("UNASSIGNED");
    expect(result.setor).toBeNull();
  });

  it("returns not found when celula is missing", async () => {
    const prisma = buildMockPrisma(
      { celula: {}, supervisao: {} },
      { celula: { findUnique: jest.fn().mockResolvedValue(null) } },
    );

    const service = new AdminCelulaService(prisma);

    await expect(service.getCelulaForAdmin("missing")).rejects.toThrow(
      AdminCelulaNotFoundError,
    );
  });

  it("lists unassigned celulas (supervisao atual tipo diferente de SETOR)", async () => {
    const prisma = buildMockPrisma(
      { celula: {}, supervisao: {} },
      {
        celula: {
          count: jest.fn().mockResolvedValue(2),
          findMany: jest.fn().mockResolvedValue([
            {
              id: "cel-1",
              nome: "Celula A",
              supervisao: {
                id: "area-1",
                nome: "Area 1",
                tipo: SupervisaoTipo.AREA,
              },
            },
            {
              id: "cel-2",
              nome: "Celula B",
              supervisao: {
                id: "topo-1",
                nome: "Topo 1",
                tipo: SupervisaoTipo.SUPERVISAO_TOPO,
              },
            },
          ]),
        },
      },
    );

    const service = new AdminCelulaService(prisma);
    const result = await service.listUnassignedCelulas({ q: "cel", limit: 50 });

    expect(result.total).toBe(2);
    expect(result.celulas).toEqual([
      {
        id: "cel-1",
        nome: "Celula A",
        supervisaoAtual: {
          id: "area-1",
          nome: "Area 1",
          tipo: SupervisaoTipo.AREA,
        },
      },
      {
        id: "cel-2",
        nome: "Celula B",
        supervisaoAtual: {
          id: "topo-1",
          nome: "Topo 1",
          tipo: SupervisaoTipo.SUPERVISAO_TOPO,
        },
      },
    ]);
  });

  it("bulk assignment rejects invalid setor", async () => {
    const tx = {
      supervisao: { findUnique: jest.fn().mockResolvedValue(null) },
      celula: { findMany: jest.fn(), updateMany: jest.fn() },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulasToSetorBulk({
        setorId: "setor-x",
        celulaIds: ["cel-1"],
      }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("bulk assignment rejects setor with tipo different from SETOR", async () => {
    const tx = {
      supervisao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "area-1",
          nome: "Area 1",
          tipo: SupervisaoTipo.AREA,
        }),
      },
      celula: { findMany: jest.fn(), updateMany: jest.fn() },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulasToSetorBulk({
        setorId: "area-1",
        celulaIds: ["cel-1"],
      }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("bulk assignment rejects when some celulaIds do not exist", async () => {
    const tx = {
      supervisao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "setor-1",
          nome: "Setor 1",
          tipo: SupervisaoTipo.SETOR,
        }),
      },
      celula: {
        findMany: jest.fn().mockResolvedValue([{ id: "cel-1" }]),
        updateMany: jest.fn(),
      },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulasToSetorBulk({
        setorId: "setor-1",
        celulaIds: ["cel-1", "cel-2"],
      }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("bulk assignment rejects duplicate celulaIds", async () => {
    const tx = {
      supervisao: { findUnique: jest.fn() },
      celula: { findMany: jest.fn(), updateMany: jest.fn() },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));

    await expect(
      service.assignCelulasToSetorBulk({
        setorId: "setor-1",
        celulaIds: ["cel-1", "cel-1"],
      }),
    ).rejects.toThrow(AdminCelulaValidationError);
  });

  it("bulk assignment updates all requested celulas", async () => {
    const tx = {
      supervisao: {
        findUnique: jest.fn().mockResolvedValue({
          id: "setor-1",
          nome: "Setor Norte",
          tipo: SupervisaoTipo.SETOR,
        }),
      },
      celula: {
        findMany: jest.fn().mockResolvedValue([{ id: "cel-1" }, { id: "cel-2" }]),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    const service = new AdminCelulaService(buildMockPrisma(tx));
    const result = await service.assignCelulasToSetorBulk({
      setorId: "setor-1",
      celulaIds: ["cel-1", "cel-2"],
    });

    expect(tx.celula.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["cel-1", "cel-2"] } },
      data: { supervisaoId: "setor-1" },
    });
    expect(result).toEqual({
      setor: { id: "setor-1", nome: "Setor Norte" },
      updatedCount: 2,
    });
  });
});
