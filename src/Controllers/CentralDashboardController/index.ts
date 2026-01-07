import { FastifyReply, FastifyRequest } from "fastify";
import { CentralDashboardRepository } from "../../Repositories/CentralDashboardRepository";

const repo = new CentralDashboardRepository();

type AuthRequest = FastifyRequest & { user?: { id: string; role?: string } };

function parseDateOnlyOrThrow(value: unknown, field: string): Date {
  if (!value || typeof value !== "string") {
    throw new Error(`Missing "${field}"`);
  }

  // Espera YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`Invalid "${field}" format. Use YYYY-MM-DD`);

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  // Date em UTC (meia-noite UTC)
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (Number.isNaN(dt.getTime())) throw new Error(`Invalid "${field}" date`);

  return dt;
}

function startOfDayUTC(d: Date) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function addDaysUTC(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export class CentralDashboardController {
  async getDashboard(request: AuthRequest, reply: FastifyReply) {
    try {
      const { from, to, supervisaoId, cultoSemanalId } = request.query as {
        from?: string;
        to?: string;
        supervisaoId?: string;
        cultoSemanalId?: string;
      };

      // ✅ defaults seguros (se não vier, usa YTD até hoje)
      const now = new Date();
      const defaultFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
      const defaultTo = startOfDayUTC(now); // "hoje" em UTC

      const fromDate = from ? parseDateOnlyOrThrow(from, "from") : defaultFrom;
      const toDate = to ? parseDateOnlyOrThrow(to, "to") : defaultTo;

      // ✅ normaliza para início do dia e faz toExclusive = dia seguinte ao "to"
      const fromDay = startOfDayUTC(fromDate);
      const toDay = startOfDayUTC(toDate);
      const toExclusive = addDaysUTC(toDay, 1);

      if (fromDay >= toExclusive) {
        return reply.code(400).send({ message: `"from" must be before "to"` });
      }

      const payload = await repo.getCentralDashboard({
        from: fromDay,
        toExclusive,
        supervisaoId:
          supervisaoId && supervisaoId !== "all" ? supervisaoId : undefined,
        cultoSemanalId:
          cultoSemanalId && cultoSemanalId !== "all"
            ? cultoSemanalId
            : undefined,
      });

      return reply.send(payload);
    } catch (err: any) {
      // ✅ erro de validação -> 400; resto -> 500
      const msg = String(err?.message ?? "Unknown error");
      const isBadRequest =
        msg.includes('Missing "') ||
        msg.includes('Invalid "') ||
        msg.includes("must be before");

      return reply.code(isBadRequest ? 400 : 500).send({ message: msg });
    }
  }
}
