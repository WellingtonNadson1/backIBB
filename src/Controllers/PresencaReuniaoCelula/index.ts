import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from 'valibot';
import PresencaReuniaoCelulaRepositorie from "../../Repositories/PresencaReuniaoCelula";

const PresencaReuniaoCelulaDataSchema = object ({
  status: boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
  membro: string(),
  presencas_reuniao_celula: string(),
})

export type PresencaReuniaoCelulaData = Input<typeof PresencaReuniaoCelulaDataSchema>

interface PresencaReuniaoCelulaParams {
  id: string;
}

class PresencaReuniaoCelulaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasReuniaoCelula = await PresencaReuniaoCelulaRepositorie.findAll();
    if (!presencasReuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencasReuniaoCelula);
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencasReuniaoCelula = await PresencaReuniaoCelulaRepositorie.findById(id);
    if (!presencasReuniaoCelula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencasReuniaoCelula);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencasReuniaoCelulaDataForm = request.body as PresencaReuniaoCelulaData;
      const presencasReuniaoCelula = await PresencaReuniaoCelulaRepositorie.createPresencaReuniaCelula({
        ...presencasReuniaoCelulaDataForm,
      });
      return reply.code(201).send(presencasReuniaoCelula);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaReuniaoCelulaDataForm = request.body as PresencaReuniaoCelulaData;
    const presencaReuniaoCelula = await PresencaReuniaoCelulaRepositorie.updatePresencaReuniaoCelula(id, {
      ...presencaReuniaoCelulaDataForm,
    });
    return reply.code(202).send(presencaReuniaoCelula);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await PresencaReuniaoCelulaRepositorie.deletePresencaReuniaoCelula(id);
    return reply.code(204);
  }
}

export default new PresencaReuniaoCelulaController();
