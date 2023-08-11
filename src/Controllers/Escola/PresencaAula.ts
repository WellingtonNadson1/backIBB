import { FastifyReply, FastifyRequest } from "fastify";
import { Input, object, string } from 'valibot';
import PresencaAulaRepositorie from "../../Repositories/PresencaAulaRepositorie";

const PresencaAulaDataSchema = object ({
  status: string(), //Pode ter um status (presente, ausente, justificado, etc.)
  aluno: string(),
  aula_presenca_qual_escola: string(),
})

export type PresencaAulaData = Input<typeof PresencaAulaDataSchema>

interface PresencaAulaParams {
  id: string;
}

class PresencaAulaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencaAula = await PresencaAulaRepositorie.findAll();
    if (!presencaAula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencaAula);
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaAulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const PresencaAula = await PresencaAulaRepositorie.findById(id);
    if (!PresencaAula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(PresencaAula);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencaAulaDataForm = request.body as PresencaAulaData;
      const presencaAula = await PresencaAulaRepositorie.createPresencaAula({
        ...presencaAulaDataForm,
      });
      return reply.code(201).send(presencaAula);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaAulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaAulaDataForm = request.body as PresencaAulaData;
    const presencaAula = await PresencaAulaRepositorie.updatePresencaAula(id, {
      ...presencaAulaDataForm,
    });
    return reply.code(202).send(presencaAula);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaAulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await PresencaAulaRepositorie.deletePresencaAula(id);
    return reply.code(204);
  }
}

export default new PresencaAulaController();
