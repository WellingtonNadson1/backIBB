import { SupervisaoTipo } from "@prisma/client";

jest.mock("../services/prisma", () => ({
  createPrismaInstance: jest.fn(),
}));

import { resolveSetorIdsForSupervisor } from "../services/SupervisaoCoverageService";

describe("resolveSetorIdsForSupervisor", () => {
  it("returns [] when supervisor has no root node", async () => {
    const prisma = {
      supervisao: { findFirst: jest.fn().mockResolvedValue(null) },
      supervisaoClosure: { findMany: jest.fn() },
    } as any;

    const result = await resolveSetorIdsForSupervisor("user-1", prisma);

    expect(result).toEqual([]);
    expect(prisma.supervisaoClosure.findMany).not.toHaveBeenCalled();
  });

  it("returns root id when root tipo is SETOR", async () => {
    const prisma = {
      supervisao: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: "setor-root", tipo: SupervisaoTipo.SETOR }),
      },
      supervisaoClosure: { findMany: jest.fn() },
    } as any;

    const result = await resolveSetorIdsForSupervisor("user-2", prisma);

    expect(result).toEqual(["setor-root"]);
    expect(prisma.supervisaoClosure.findMany).not.toHaveBeenCalled();
  });

  it("queries closure descendants filtered by tipo=SETOR for non-SETOR root", async () => {
    const prisma = {
      supervisao: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: "area-1", tipo: SupervisaoTipo.AREA }),
      },
      supervisaoClosure: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ descendantId: "setor-1" }, { descendantId: "setor-2" }]),
      },
    } as any;

    const result = await resolveSetorIdsForSupervisor("user-3", prisma);

    expect(prisma.supervisaoClosure.findMany).toHaveBeenCalledWith({
      where: {
        ancestorId: "area-1",
        descendant: { tipo: SupervisaoTipo.SETOR },
      },
      select: { descendantId: true },
    });
    expect(result).toEqual(["setor-1", "setor-2"]);
  });

  it("deduplicates setor ids returned by closure query", async () => {
    const prisma = {
      supervisao: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: "distrito-1", tipo: SupervisaoTipo.DISTRITO }),
      },
      supervisaoClosure: {
        findMany: jest.fn().mockResolvedValue([
          { descendantId: "setor-1" },
          { descendantId: "setor-1" },
          { descendantId: "setor-2" },
        ]),
      },
    } as any;

    const result = await resolveSetorIdsForSupervisor("user-4", prisma);

    expect(result).toEqual(["setor-1", "setor-2"]);
  });
});
