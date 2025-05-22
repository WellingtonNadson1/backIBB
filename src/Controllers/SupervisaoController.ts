import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from "valibot";
import SupervisaoRepositorie from "../Repositories/SupervisaoRepositorie";

const SupervisaoDataSchema = object({
  nome: string(),
  cor: string(),
  supervisor: string(),
  celulas: array(string()),
  membros: array(string()),
});

export type SupervisaoData = Input<typeof SupervisaoDataSchema>;

interface SupervisaoParams {
  id: string;
}

class SupervisaoController {
  // Fazendo uso do Fastify
  async getSupervisionMetrics(request: FastifyRequest, reply: FastifyReply) {
    const metrics = await SupervisaoRepositorie.getSupervisionMetrics();
    if (!metrics) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(metrics);
  }

  async leadershipDistribution(request: FastifyRequest, reply: FastifyReply) {
    const distribution = await SupervisaoRepositorie.leadershipDistribution();
    if (!distribution) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(distribution);
  }

  async indexAll(request: FastifyRequest, reply: FastifyReply) {
    const supervisoes = await SupervisaoRepositorie.findAll();
    if (!supervisoes) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(supervisoes);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const supervisoes = await SupervisaoRepositorie.findAll();
    if (!supervisoes) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(supervisoes);
  }

  async show(
    request: FastifyRequest<{
      Params: SupervisaoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const supervisao = await SupervisaoRepositorie.findById(id);
    if (!supervisao) {
      return reply.code(404).send({ message: "Supervisao not found!" });
    }
    return reply.code(200).send(supervisao);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const supervisaoDataForm = request.body as SupervisaoData;
    const supervisao = await SupervisaoRepositorie.createSupervisao({
      ...supervisaoDataForm,
    });
    return reply.code(201).send(supervisao);
  }

  async update(
    request: FastifyRequest<{
      Params: SupervisaoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const supervisaoDataForm = request.body as SupervisaoData;
    const supervisao = await SupervisaoRepositorie.updateSupervisao(id, {
      ...supervisaoDataForm,
    });
    return reply.code(202).send(supervisao);
  }

  async delete(
    request: FastifyRequest<{
      Params: SupervisaoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await SupervisaoRepositorie.deleteSupervisao(id);
    return reply.code(204).send();
  }
}

export default new SupervisaoController();
