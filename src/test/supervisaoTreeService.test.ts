import { SupervisaoTipo } from "@prisma/client";
import {
  createSupervisaoNode,
  SupervisaoTreeValidationError,
} from "../services/SupervisaoTreeService";

function buildMockPrisma(tx: any) {
  return {
    $transaction: jest.fn(async (fn: any) => fn(tx)),
    supervisao: { findMany: jest.fn() },
  } as any;
}

describe("createSupervisaoNode", () => {
  it("creates SETOR node, self-link and ancestor links with depth+1", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "area-1", tipo: SupervisaoTipo.AREA }),
        create: jest.fn().mockResolvedValue({
          id: "setor-1",
          nome: "Setor A",
          cor: "#123456",
          tipo: SupervisaoTipo.SETOR,
          parentId: "area-1",
          userId: null,
        }),
      },
      supervisaoClosure: {
        createMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 3 }),
        findMany: jest.fn().mockResolvedValue([
          { ancestorId: "area-1", depth: 0 },
          { ancestorId: "distrito-1", depth: 1 },
          { ancestorId: "topo-1", depth: 2 },
        ]),
      },
    };

    const prisma = buildMockPrisma(tx);

    const result = await createSupervisaoNode(
      {
        nome: "Setor A",
        cor: "#123456",
        tipo: SupervisaoTipo.SETOR,
        parentId: "area-1",
      },
      prisma,
    );

    expect(tx.supervisao.create).toHaveBeenCalled();
    expect(tx.supervisaoClosure.createMany).toHaveBeenNthCalledWith(1, {
      data: [{ ancestorId: "setor-1", descendantId: "setor-1", depth: 0 }],
      skipDuplicates: true,
    });
    expect(tx.supervisaoClosure.createMany).toHaveBeenNthCalledWith(2, {
      data: [
        { ancestorId: "area-1", descendantId: "setor-1", depth: 1 },
        { ancestorId: "distrito-1", descendantId: "setor-1", depth: 2 },
        { ancestorId: "topo-1", descendantId: "setor-1", depth: 3 },
      ],
      skipDuplicates: true,
    });

    expect(result.closure).toEqual({
      selfLinksAttempted: 1,
      selfLinksInserted: 1,
      ancestorLinksAttempted: 3,
      ancestorLinksInserted: 3,
    });
  });

  it("accepts AREA under SUPERVISAO_TOPO", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: "topo-1",
            tipo: SupervisaoTipo.SUPERVISAO_TOPO,
          }),
        create: jest.fn().mockResolvedValue({
          id: "area-1",
          nome: "Area A",
          cor: "#654321",
          tipo: SupervisaoTipo.AREA,
          parentId: "topo-1",
          userId: null,
        }),
      },
      supervisaoClosure: {
        createMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([{ ancestorId: "topo-1", depth: 0 }]),
      },
    };

    const prisma = buildMockPrisma(tx);

    await expect(
      createSupervisaoNode(
        {
          nome: "Área A",
          cor: "#654321",
          tipo: SupervisaoTipo.AREA,
          parentId: "topo-1",
        },
        prisma,
      ),
    ).resolves.toBeDefined();
  });

  it("accepts SETOR under SUPERVISAO_TOPO", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: "topo-1",
            tipo: SupervisaoTipo.SUPERVISAO_TOPO,
          }),
        create: jest.fn().mockResolvedValue({
          id: "setor-topo-1",
          nome: "Setor Topo",
          cor: "#111111",
          tipo: SupervisaoTipo.SETOR,
          parentId: "topo-1",
          userId: null,
        }),
      },
      supervisaoClosure: {
        createMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([{ ancestorId: "topo-1", depth: 0 }]),
      },
    };

    const prisma = buildMockPrisma(tx);

    await expect(
      createSupervisaoNode(
        {
          nome: "Setor Topo",
          cor: "#111111",
          tipo: SupervisaoTipo.SETOR,
          parentId: "topo-1",
        },
        prisma,
      ),
    ).resolves.toBeDefined();
  });

  it("accepts SETOR under DISTRITO", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "distrito-1", tipo: SupervisaoTipo.DISTRITO }),
        create: jest.fn().mockResolvedValue({
          id: "setor-3",
          nome: "Setor Distrito",
          cor: "#333333",
          tipo: SupervisaoTipo.SETOR,
          parentId: "distrito-1",
          userId: null,
        }),
      },
      supervisaoClosure: {
        createMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          { ancestorId: "distrito-1", depth: 0 },
        ]),
      },
    };

    const prisma = buildMockPrisma(tx);

    await expect(
      createSupervisaoNode(
        {
          nome: "Setor Distrito",
          cor: "#333333",
          tipo: SupervisaoTipo.SETOR,
          parentId: "distrito-1",
        },
        prisma,
      ),
    ).resolves.toBeDefined();
  });

  it("rejects invalid parent-type combinations", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({
            id: "area-1",
            tipo: SupervisaoTipo.AREA,
          }),
        create: jest.fn(),
      },
      supervisaoClosure: {
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const prisma = buildMockPrisma(tx);

    await expect(
      createSupervisaoNode(
        {
          nome: "Distrito A",
          cor: "#654321",
          tipo: SupervisaoTipo.DISTRITO,
          parentId: "area-1",
        },
        prisma,
      ),
    ).rejects.toThrow(SupervisaoTreeValidationError);
  });

  it("rejects SUPERVISAO_TOPO with parentId", async () => {
    const tx = {
      supervisao: { findUnique: jest.fn(), create: jest.fn() },
      supervisaoClosure: { createMany: jest.fn(), findMany: jest.fn() },
    };

    const prisma = buildMockPrisma(tx);

    await expect(
      createSupervisaoNode(
        {
          nome: "Topo 1",
          cor: "#000000",
          tipo: SupervisaoTipo.SUPERVISAO_TOPO,
          parentId: "should-not-exist",
        },
        prisma,
      ),
    ).rejects.toThrow(SupervisaoTreeValidationError);
  });

  it("falls back to direct parent link when parent has no closure rows", async () => {
    const tx = {
      supervisao: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: "area-2", tipo: SupervisaoTipo.AREA }),
        create: jest.fn().mockResolvedValue({
          id: "setor-2",
          nome: "Setor B",
          cor: "#222222",
          tipo: SupervisaoTipo.SETOR,
          parentId: "area-2",
          userId: null,
        }),
      },
      supervisaoClosure: {
        createMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const prisma = buildMockPrisma(tx);

    await createSupervisaoNode(
      {
        nome: "Setor B",
        cor: "#222222",
        tipo: SupervisaoTipo.SETOR,
        parentId: "area-2",
      },
      prisma,
    );

    expect(tx.supervisaoClosure.createMany).toHaveBeenNthCalledWith(2, {
      data: [{ ancestorId: "area-2", descendantId: "setor-2", depth: 1 }],
      skipDuplicates: true,
    });
  });
});
