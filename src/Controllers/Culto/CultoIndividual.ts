import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from 'valibot';
import { CultoIndividualRepositorie } from "../../Repositories/Culto";

const CultoIndividualDataSchema = object ({
  data_inicio_culto: date(),
  data_termino_culto: date(),
  status: string(), // status (realizada, cancelada, etc.)
  presencas_culto: array(string()),
  culto_semana: string(),
})

export type CultoIndividualData = Input<typeof CultoIndividualDataSchema>

interface CultoIndividualParams {
  id: string;
}

class CultoIndividualController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const cultosIndividuais = await CultoIndividualRepositorie.findAll();
    if (!cultosIndividuais) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosIndividuais);
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
      const cultoIndividual = await CultoIndividualRepositorie.createCultoIndividual({
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
    const cultoIndividual = await CultoIndividualRepositorie.updateCultoIndividual(id, {
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
    return reply.code(204);
  }
}

export default new CultoIndividualController();
