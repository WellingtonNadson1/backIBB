// Controller
import { FastifyReply, FastifyRequest } from "fastify";
import dayjs from "dayjs";
import { LiderMembroRepository } from "../../Repositories/LiderMembroRepository";

type Params = { id: string };
type Query = { mesRef?: string }; // YYYY-MM

function resolveMonthRange(mesRef?: string) {
  const base = mesRef ? dayjs(`${mesRef}-01`) : dayjs();
  const inicio = base.startOf("month").toDate();
  const fim = base.endOf("month").toDate();
  return { inicio, fim, mesRef: base.format("YYYY-MM") };
}

const repo = new LiderMembroRepository();

export class LiderMembroController {
  async show(
    request: FastifyRequest<{ Params: Params; Querystring: Query }>,
    reply: FastifyReply
  ) {
    try {
      const membroId = request.params.id;
      const { inicio, fim, mesRef } = resolveMonthRange(request.query.mesRef);

      const liderId = (request as any).user?.id;

      const data = await repo.getDetalheMembro({
        prisma: request.prisma,
        liderId,
        membroId,
        inicio,
        fim,
        mesRef,
      });

      if (!data)
        return reply.code(404).send({ message: "Membro não encontrado." });

      return reply.code(200).send(data);
    } catch (error) {
      console.error(error);
      const msg = (error as any)?.message;
      if (msg === "Forbidden") {
        return reply.code(403).send({ message: "Forbidden" });
      }
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  async presencas(
    request: FastifyRequest<{ Params: Params; Querystring: Query }>,
    reply: FastifyReply
  ) {
    try {
      const membroId = request.params.id;
      const { inicio, fim, mesRef } = resolveMonthRange(request.query.mesRef);

      const liderId = (request as any).user?.id;

      const data = await repo.getPresencasMembro({
        prisma: request.prisma,
        liderId,
        membroId,
        inicio,
        fim,
        mesRef,
      });

      if (!data)
        return reply.code(404).send({ message: "Membro não encontrado." });

      return reply.code(200).send(data);
    } catch (error) {
      console.error(error);
      const msg = (error as any)?.message;
      if (msg === "Forbidden") {
        return reply.code(403).send({ message: "Forbidden" });
      }
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }
}
