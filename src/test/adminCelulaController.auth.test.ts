const UUID_A = "11111111-1111-1111-1111-111111111111";
const UUID_B = "22222222-2222-2222-2222-222222222222";

type MockReply = {
  status: jest.Mock;
  send: jest.Mock;
};

function createReply(): MockReply {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
}

describe("AdminCelulaController authorization", () => {
  let mockPrisma: {
    user: {
      findUnique: jest.Mock;
    };
  };

  let mockAdminCelulaService: {
    assignCelulaToSetor: jest.Mock;
    getCelulaForAdmin: jest.Mock;
    listUnassignedCelulas: jest.Mock;
    assignCelulasToSetorBulk: jest.Mock;
  };

  let AdminCelulaController: {
    new (): {
      assignSetor: (request: any, reply: any) => Promise<any>;
      showCelula: (request: any, reply: any) => Promise<any>;
      listUnassigned: (request: any, reply: any) => Promise<any>;
      assignSetorBulk: (request: any, reply: any) => Promise<any>;
    };
  };

  beforeEach(async () => {
    jest.resetModules();

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    mockAdminCelulaService = {
      assignCelulaToSetor: jest.fn(),
      getCelulaForAdmin: jest.fn(),
      listUnassignedCelulas: jest.fn(),
      assignCelulasToSetorBulk: jest.fn(),
    };

    jest.doMock("../services/prisma", () => ({
      createPrismaInstance: jest.fn(() => mockPrisma),
    }));

    jest.doMock("../services/AdminCelulaService", () => ({
      AdminCelulaService: jest
        .fn()
        .mockImplementation(() => mockAdminCelulaService),
      AdminCelulaValidationError: class AdminCelulaValidationError extends Error {},
      AdminCelulaNotFoundError: class AdminCelulaNotFoundError extends Error {},
    }));

    const module = await import("../Controllers/AdminCelulaController");
    AdminCelulaController = module.AdminCelulaController as typeof AdminCelulaController;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("allows assignSetor for role=ADMIN without user_roles", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      role: "ADMIN",
      user_roles: [],
    });

    mockAdminCelulaService.assignCelulaToSetor.mockResolvedValue({
      celula: { id: UUID_A, nome: "Celula A", supervisaoId: UUID_B },
      setor: { id: UUID_B, nome: "Setor B" },
    });

    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.assignSetor(
      {
        user: { id: UUID_A },
        params: { celulaId: UUID_A },
        body: { setorId: UUID_B },
      },
      reply,
    );

    expect(mockAdminCelulaService.assignCelulaToSetor).toHaveBeenCalledWith({
      celulaId: UUID_A,
      setorId: UUID_B,
    });
    expect(reply.send).toHaveBeenCalled();
    expect(reply.status).not.toHaveBeenCalledWith(403);
  });

  it("allows assignSetor for role=MEMBER when user_roles contains USERCENTRAL", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      role: "MEMBER",
      user_roles: [{ rolenew: { name: "USERCENTRAL" } }],
    });

    mockAdminCelulaService.assignCelulaToSetor.mockResolvedValue({
      celula: { id: UUID_A, nome: "Celula A", supervisaoId: UUID_B },
      setor: { id: UUID_B, nome: "Setor B" },
    });

    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.assignSetor(
      {
        user: { id: UUID_A },
        params: { celulaId: UUID_A },
        body: { setorId: UUID_B },
      },
      reply,
    );

    expect(mockAdminCelulaService.assignCelulaToSetor).toHaveBeenCalled();
    expect(reply.status).not.toHaveBeenCalledWith(403);
  });

  it("allows showCelula for role=USERCENTRAL", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      role: "USERCENTRAL",
      user_roles: [],
    });

    mockAdminCelulaService.getCelulaForAdmin.mockResolvedValue({
      celula: { id: UUID_A, nome: "Celula A", supervisaoId: UUID_B },
      setor: null,
      assignmentStatus: "UNASSIGNED",
    });

    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.showCelula(
      {
        user: { id: UUID_A },
        params: { celulaId: UUID_A },
      },
      reply,
    );

    expect(mockAdminCelulaService.getCelulaForAdmin).toHaveBeenCalledWith(UUID_A);
    expect(reply.status).not.toHaveBeenCalledWith(403);
  });

  it("denies listUnassigned for role=MEMBER without authorized roles", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      role: "MEMBER",
      user_roles: [],
    });

    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.listUnassigned(
      {
        user: { id: UUID_A },
        query: { q: "cel", limit: "10" },
      },
      reply,
    );

    expect(mockAdminCelulaService.listUnassignedCelulas).not.toHaveBeenCalled();
    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({
      error: "Acesso restrito a ADMIN/USERCENTRAL",
    });
  });

  it("returns 401 when request.user is missing", async () => {
    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.assignSetor(
      {
        params: { celulaId: UUID_A },
        body: { setorId: UUID_B },
      },
      reply,
    );

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: "Não autorizado" });
  });

  it("allows assignSetorBulk when user_roles contains ADMIN", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      role: "MEMBER",
      user_roles: [{ rolenew: { name: "ADMIN" } }],
    });

    mockAdminCelulaService.assignCelulasToSetorBulk.mockResolvedValue({
      setor: { id: UUID_B, nome: "Setor B" },
      updatedCount: 2,
    });

    const controller = new AdminCelulaController();
    const reply = createReply();

    await controller.assignSetorBulk(
      {
        user: { id: UUID_A },
        body: {
          setorId: UUID_B,
          celulaIds: [UUID_A, "33333333-3333-3333-3333-333333333333"],
        },
      },
      reply,
    );

    expect(mockAdminCelulaService.assignCelulasToSetorBulk).toHaveBeenCalled();
    expect(reply.status).not.toHaveBeenCalledWith(403);
  });
});
