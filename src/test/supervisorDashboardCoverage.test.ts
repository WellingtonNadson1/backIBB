jest.mock("../services/prisma", () => ({
  createPrismaInstance: jest.fn(() => ({})),
}));

import { SupervisorDashboardRepository } from "../Repositories/SupervisorDashboardRepository";

describe("SupervisorDashboardRepository coverage", () => {
  it("constrains listCelulasBySupervisor query to resolved setorIds", async () => {
    const db = {
      supervisao: {
        findFirst: jest.fn().mockResolvedValue({
          id: "sup-1",
          nome: "Supervisao 1",
          cor: "#123456",
        }),
      },
      celula: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;

    const resolveSetorIds = jest
      .fn()
      .mockResolvedValue(["setor-1", "setor-2"]);

    const repo = new SupervisorDashboardRepository(db, resolveSetorIds);
    await repo.listCelulasBySupervisor({ supervisorId: "user-1" });

    expect(resolveSetorIds).toHaveBeenCalledWith("user-1", db);
    expect(db.celula.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { supervisaoId: { in: ["setor-1", "setor-2"] } },
      }),
    );
  });

  it("constrains getCelulaDetailBySupervisor by setorIds", async () => {
    const db = {
      supervisao: {
        findFirst: jest.fn().mockResolvedValue({
          id: "sup-1",
          nome: "Supervisao 1",
          cor: "#123456",
        }),
      },
      celula: { findFirst: jest.fn().mockResolvedValue(null) },
    } as any;

    const resolveSetorIds = jest
      .fn()
      .mockResolvedValue(["setor-coverage"]);

    const repo = new SupervisorDashboardRepository(db, resolveSetorIds);
    const result = await repo.getCelulaDetailBySupervisor({
      supervisorId: "user-2",
      celulaId: "celula-1",
    });

    expect(result).toBeNull();
    expect(db.celula.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "celula-1",
          supervisaoId: { in: ["setor-coverage"] },
        },
      }),
    );
  });

  it("returns null detail when supervisor has no covered setorIds", async () => {
    const db = {
      supervisao: {
        findFirst: jest.fn().mockResolvedValue({
          id: "sup-1",
          nome: "Supervisao 1",
          cor: "#123456",
        }),
      },
      celula: { findFirst: jest.fn() },
    } as any;

    const resolveSetorIds = jest.fn().mockResolvedValue([]);

    const repo = new SupervisorDashboardRepository(db, resolveSetorIds);
    const result = await repo.getCelulaDetailBySupervisor({
      supervisorId: "user-2",
      celulaId: "celula-1",
    });

    expect(result).toBeNull();
    expect(db.celula.findFirst).not.toHaveBeenCalled();
  });
});
