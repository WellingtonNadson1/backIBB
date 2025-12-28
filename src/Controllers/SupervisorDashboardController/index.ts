// Controllers/SupervisorDashboardController.ts
import { FastifyReply, FastifyRequest } from "fastify";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { SupervisorDashboardRepository } from "../../Repositories/SupervisorDashboardRepository";

dayjs.extend(utc);
dayjs.extend(timezone);

const repo = new SupervisorDashboardRepository();

type AuthRequest = FastifyRequest & {
  user?: { id: string };
};

// ✅ normaliza o query status vindo do front
function normalizeStatus(
  input?: string
): "CRITICA" | "ATENCAO" | "OK" | undefined {
  if (!input) return undefined;

  const s = input.trim().toLowerCase();

  if (s === "todas" || s === "all") {
    // 👇 SEM filtro
    return undefined;
  }

  if (s === "criticas" || s === "critica") return "CRITICA";
  if (s === "atencao" || s === "atenção") return "ATENCAO";
  if (s === "ok") return "OK";

  // 👇 qualquer coisa inválida, ignora
  return undefined;
}

export class SupervisorDashboardController {
  async getDashboard(request: AuthRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: "Não autorizado" });

      const dashboard = await repo.getDashboardBySupervisor(userId);
      if (!dashboard) {
        return reply.status(404).send({
          error: "Nenhuma supervisão encontrada para este supervisor.",
        });
      }

      return reply.send(dashboard);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: "Erro ao carregar dashboard." });
    }
  }

  async cultosMes(request: AuthRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: "Não autorizado" });

      const { mes } = request.query as { mes?: string };
      const tz = "America/Sao_Paulo";
      const base = mes ? dayjs.tz(`${mes}-01`, tz) : dayjs().tz(tz);

      const inicioMes = base.startOf("month").toDate();
      const fimMes = base.endOf("month").toDate();

      const result = await repo.getFrequenciaCultosMesPorSupervisao({
        supervisorId: userId,
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

  // ✅ lista para /supervisor/celulas?status=criticas&q=...
  async listCelulas(request: AuthRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: "Não autorizado" });

      const { status, q, order } = request.query as {
        status?: string; // "criticas" | "atencao" | "ok" | undefined
        q?: string;
        order?: string; // opcional: "criticidade" | "dias" | "frequencia"
      };

      const normalized = normalizeStatus(status);

      const result = await repo.listCelulasBySupervisor({
        supervisorId: userId,
        // 🔥 aqui está o ponto: manda CRITICA/ATENCAO/OK pro repo
        status: normalized,
        q: q?.trim() || undefined,
        order: (order ??
          "criticidade") as import("../../Repositories/SupervisorDashboardRepository").CelulaOrder,
      });

      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply.status(500).send({ error: "Erro ao listar células" });
    }
  }

  async getCelulaDetail(request: AuthRequest, reply: FastifyReply) {
    try {
      const userId = request.user?.id;
      if (!userId) return reply.status(401).send({ error: "Não autorizado" });

      const { celulaId } = request.params as { celulaId: string };

      const result = await repo.getCelulaDetailBySupervisor({
        supervisorId: userId,
        celulaId,
      });

      if (!result)
        return reply.status(404).send({ error: "Célula não encontrada" });

      return reply.send(result);
    } catch (e) {
      request.log.error(e);
      return reply
        .status(500)
        .send({ error: "Erro ao carregar detalhes da célula" });
    }
  }
}
