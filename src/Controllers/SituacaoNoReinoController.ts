import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from "valibot";
import SituacaoNoReinoRepositorie from "../Repositories/SituacaoNoReinoRepositorie";

const SituacaoNoReinoDataSchema = object({
  nome: string(),
  membros: array(string()),
});

export type SituacaoNoReinoData = Input<typeof SituacaoNoReinoDataSchema>;

interface SituacaoNoReinoParams {
  id: string;
}

class SituacaoNoReinoController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const situacoesNoReino = await SituacaoNoReinoRepositorie.findAll();
    if (!situacoesNoReino) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(situacoesNoReino);
  }

  async show(
    request: FastifyRequest<{
      Params: SituacaoNoReinoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const situacaoNoReino = await SituacaoNoReinoRepositorie.findById(id);
    if (!situacaoNoReino) {
      return reply.code(404).send({ message: "Situacao No Reino not found!" });
    }
    return reply.code(200).send(situacaoNoReino);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const situacaoNoReinoDataForm = request.body as SituacaoNoReinoData;
    const situacaoNoReino =
      await SituacaoNoReinoRepositorie.createSituacaoNoReino({
        ...situacaoNoReinoDataForm
      })
    return reply.code(201).send(situacaoNoReino);
  }

  async update(
    request: FastifyRequest<{
      Params: SituacaoNoReinoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const situacaoNoReinoDataForm = request.body as SituacaoNoReinoData;
    const situacaoNoReino =
      await SituacaoNoReinoRepositorie.updateSituacaoNoReino(id, {
        ...situacaoNoReinoDataForm,
      });
    return reply.code(202).send(situacaoNoReino);
  }

  async delete(
    request: FastifyRequest<{
      Params: SituacaoNoReinoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await SituacaoNoReinoRepositorie.deleteSituacaoNoReino(id);
    return reply.code(204).send();
  }
}

export default new SituacaoNoReinoController();
