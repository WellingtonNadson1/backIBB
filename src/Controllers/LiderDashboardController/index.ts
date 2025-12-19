import { FastifyReply, FastifyRequest } from "fastify";
import { LiderDashboardRepository } from "../../Repositories/LiderDashboardRepository";
import dayjs from "dayjs";

const repo = new LiderDashboardRepository();

// ✅ adapte ao seu tipo real do request.user (JWT)
type AuthRequest = FastifyRequest & {
  user?: { id: string; celulaId?: string | null };
};

export class LiderDashboardController {
  async getDashboard(request: AuthRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;

      console.log("userId", userId);

      if (!userId) {
        return reply.status(401).send({ error: "Não autorizado" });
      }

      const dashboard = await repo.getDashboardByLider(userId);

      if (!dashboard) {
        return reply.status(404).send({
          error: "Nenhuma célula encontrada para este líder.",
        });
      }

      return reply.send(dashboard);
    } catch (error) {
      console.error("Erro ao carregar dashboard do líder:", error);
      return reply
        .status(500)
        .send({ error: "Erro ao carregar dashboard do líder." });
    }
  }

  async cultosMes(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: "Unauthorized" });

      // opcional: permitir mês/ano via query ?mes=2025-12
      const { mes } = request.query as { mes?: string };

      const tz = "America/Sao_Paulo";
      const base = mes ? dayjs.tz(`${mes}-01`, tz) : dayjs().tz(tz);

      const inicioMes = base.startOf("month").toDate();
      const fimMes = base.endOf("month").toDate();

      const result = await repo.getFrequenciaCultosMesPorCelula({
        userId,
        inicio: inicioMes,
        fim: fimMes,
      });

      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply
        .status(500)
        .send({ error: "Erro ao gerar frequência do mês" });
    }
  }
}
