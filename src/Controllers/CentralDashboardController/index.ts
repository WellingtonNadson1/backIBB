import { FastifyReply, FastifyRequest } from "fastify";
import { CentralDashboardRepository } from "../../Repositories/CentralDashboardRepository";

const repo = new CentralDashboardRepository();

type AuthRequest = FastifyRequest & { user?: { id: string; role?: string } };

export class CentralDashboardController {
  async getDashboard(request: AuthRequest, reply: FastifyReply) {
    const { from, to, supervisaoId, cultoSemanalId } = request.query as {
      from?: string;
      to?: string;
      supervisaoId?: string;
      cultoSemanalId?: string;
    };

    // (opcional) validar role USERCENTRAL/ADMIN
    // if (!["ADMIN","USERCENTRAL"].includes(request.user?.role ?? "")) return reply.status(403).send({error:"Forbidden"});

    const result = await repo.getCentralDashboard({
      from: from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1),
      to: to ? new Date(to) : new Date(),
      supervisaoId,
      cultoSemanalId,
    });

    return reply.send(result);
  }
}
