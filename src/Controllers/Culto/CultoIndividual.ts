import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from "valibot";
import { CultoIndividualRepositorie } from "../../Repositories/Culto";

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
    reply: FastifyReply,
  ) {
    const { startDate, endDate, superVisionId } =
      request.body as CultoIndividualForDate;

    console.log("Received request with parameters:", {
      startDate,
      endDate,
      superVisionId,
    });

    const cultosIndividuaisForDate =
      await CultoIndividualRepositorie.findAllIntervall(
        startDate,
        endDate,
        superVisionId,
      );
    if (!cultosIndividuaisForDate) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosIndividuaisForDate);
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
    reply: FastifyReply,
  ) {
    const { firstDayOfMonth, lastDayOfMonth } =
      request.body as CultoIndividualParamsPerPeriod;
    const cultosIndividuaisPerPeriod =
      await CultoIndividualRepositorie.findPerPeriod(
        firstDayOfMonth,
        lastDayOfMonth,
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
    reply: FastifyReply,
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
        cultoIndividualDataForm,
      );

      console.log(
        "Data Início (antes de criar) Controller",
        cultoIndividualDataForm.data.data_inicio_culto,
      );
      console.log(
        "Data Término (antes de criar) Controller",
        cultoIndividualDataForm.data.data_termino_culto,
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
    reply: FastifyReply,
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
    reply: FastifyReply,
  ) {
    const id = request.params.id;
    await CultoIndividualRepositorie.deleteCultoIndividual(id);
    return reply.code(204).send();
  }
}

export default new CultoIndividualController();
