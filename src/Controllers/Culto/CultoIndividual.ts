import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from "valibot";
import { CultoIndividualRepositorie } from "../../Repositories/Culto";
import dayjs from "dayjs";
import {
  resolveEffectiveCoverageNodeId,
  resolveReportNodeId,
  resolveSetorIdsForNode,
} from "../../services/SupervisaoCoverageService";
import { createPrismaInstance } from "../../services/prisma";

const CultoIndividualDataSchema = object({
  data: object({
    data_inicio_culto: date(),
    data_termino_culto: date(),
    status: string(), // status (realizada, cancelada, etc.)
    presencas_culto: array(string()),
    culto_semana: string(),
  }),
});

const CultoIndividualForDateSchema = object({
  startDate: date(),
  endDate: date(),
  superVisionId: string(),
});

export type CultoIndividualData = Input<typeof CultoIndividualDataSchema>;
export type CultoIndividualForDate = Input<typeof CultoIndividualForDateSchema>;

interface CultoIndividualParams {
  id: string;
}

const CultoIndividualDatePeriodSchema = object({
  firstDayOfMonth: date(),
  lastDayOfMonth: date(),
});

export type CultoIndividualParamsPerPeriod = Input<
  typeof CultoIndividualDatePeriodSchema
>;

class CultoIndividualController {
  // Fazendo uso do Fastify
  async forDate(
    request: FastifyRequest<{
      Params: CultoIndividualForDate;
    }>,
    reply: FastifyReply
  ) {
    const payload = request.body as CultoIndividualForDate & {
      nodeId?: string;
      supervisionNodeId?: string;
      supervisaoId?: string;
    };
    const requesterId = request.user?.id;
    if (!requesterId) {
      return reply.status(401).send({ error: "Não autorizado" });
    }

    const { startDate, endDate } = payload;
    const requestedNodeId = resolveReportNodeId(payload);
    const coverageNodeId = await resolveEffectiveCoverageNodeId(
      {
        requesterUserId: requesterId,
        requestedNodeId,
      },
      createPrismaInstance(),
    );

    if (!coverageNodeId) {
      return reply.status(403).send({
        error: "Usuário sem supervisão vinculada para o escopo do relatório.",
      });
    }

    const coverageSetorIds = await resolveSetorIdsForNode(
      coverageNodeId,
      createPrismaInstance(),
    );

    console.log("Received request with parameters:", {
      startDate,
      endDate,
      coverageNodeId,
      coverageSetorIdsCount: coverageSetorIds.length,
    });

    const cultosIndividuaisForDate =
      await CultoIndividualRepositorie.findAllIntervall(
        startDate,
        endDate,
        coverageSetorIds
      );
    if (!cultosIndividuaisForDate) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosIndividuaisForDate);
  }

  async getPresencaPorTipo(
    request: FastifyRequest<{
      Params: CultoIndividualForDate;
    }>,
    reply: FastifyReply
  ) {
    try {
      const tiposPermitidos = [
        "Culto de Ceia",
        "Culto de Edificação",
        "Capacitação Para Discípulos - CPD",
        "Culto de Primícias",
        "Culto de Celebração - Manhã",
        "Culto de Celebração - Tarde",
        "Domingo de Sacrifício",
      ];
      const dados =
        await CultoIndividualRepositorie.getCultosPresencaPorTipoEAno(
          tiposPermitidos
        );
      return reply.status(200).send(dados);
    } catch (error) {
      console.error("Erro ao buscar dados de presença:", error);
      return reply
        .status(500)
        .send({ error: "Erro ao buscar dados de presença." });
    }
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const {
      year,
      month,
      limit = 25,
      page = 1,
    } = request.query as {
      year?: number;
      month?: number;
      limit?: number;
      page?: number;
    };

    const date = new Date();
    const currentYear = year || date.getFullYear();
    const currentMonth = month || date.getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 1);

    const offset = (page - 1) * limit;

    const cultosIndividuais = await CultoIndividualRepositorie.findAll({
      startDate,
      endDate,
      limit,
      offset,
    });

    if (!cultosIndividuais) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosIndividuais);
  }

  async perperiod(
    request: FastifyRequest<{
      Params: CultoIndividualParamsPerPeriod;
    }>,
    reply: FastifyReply
  ) {
    const { firstDayOfMonth, lastDayOfMonth } =
      request.body as CultoIndividualParamsPerPeriod;
    const cultosIndividuaisPerPeriod =
      await CultoIndividualRepositorie.findPerPeriod(
        firstDayOfMonth,
        lastDayOfMonth
      );
    if (!cultosIndividuaisPerPeriod) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosIndividuaisPerPeriod);
  }

  async show(
    request: FastifyRequest<{
      Params: CultoIndividualParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cultoIndividual = await CultoIndividualRepositorie.findById(id);
    if (!cultoIndividual) {
      return reply.code(404).send({ message: "Culto not found!" });
    }
    return reply.code(200).send(cultoIndividual);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cultoIndividualDataForm = request.body as CultoIndividualData;
      console.log(
        "Dados recebidos do frontend - Controller",
        cultoIndividualDataForm
      );

      console.log(
        "Data Início (antes de criar) Controller",
        cultoIndividualDataForm.data.data_inicio_culto
      );
      console.log(
        "Data Término (antes de criar) Controller",
        cultoIndividualDataForm.data.data_termino_culto
      );

      const cultoIndividual =
        await CultoIndividualRepositorie.createCultoIndividual({
          ...cultoIndividualDataForm,
        });
      return reply.code(201).send(cultoIndividual);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: CultoIndividualParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cultoIndividualDataForm = request.body as CultoIndividualData;
    const cultoIndividual =
      await CultoIndividualRepositorie.updateCultoIndividual(id, {
        ...cultoIndividualDataForm,
      });
    return reply.code(202).send(cultoIndividual);
  }

  async delete(
    request: FastifyRequest<{
      Params: CultoIndividualParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await CultoIndividualRepositorie.deleteCultoIndividual(id);
    return reply.code(204).send();
  }

  async getAttendanceData(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate, superVisionId } = request.query as {
      startDate?: string;
      endDate?: string;
      superVisionId?: string;
    };

    try {
      const attendanceData = await CultoIndividualRepositorie.getAttendanceData(
        {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        }
      );

      if (!attendanceData) {
        return reply
          .code(500)
          .send({ error: "Erro ao buscar dados de atendimento" });
      }

      return reply.code(200).send(attendanceData);
    } catch (error) {
      return reply.code(500).send({ error: "Erro interno do servidor" });
    }
  }

  async getByDate(
    request: FastifyRequest<{ Querystring: { date?: string } }>,
    reply: FastifyReply
  ) {
    const { date } = request.query;

    if (!date) {
      return reply
        .status(400)
        .send({ error: "Parâmetro 'date' é obrigatório (YYYY-MM-DD)" });
    }

    const parsed = dayjs(date, "YYYY-MM-DD", true);
    if (!parsed.isValid()) {
      return reply
        .status(400)
        .send({ error: "Formato de data inválido. Use YYYY-MM-DD." });
    }

    const cultos = await CultoIndividualRepositorie.findByDate(parsed.toDate());
    return reply.status(200).send(cultos);
  }
}

export default new CultoIndividualController();
