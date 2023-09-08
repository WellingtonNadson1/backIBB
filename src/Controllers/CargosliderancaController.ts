import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from "valibot";
import CargosliderancaRepositorie from "../Repositories/CargosliderancaRepositorie";

const CargosliderancaDataSchema = object({
  nome: string(),
  membros: array(string()),
});

export type CargosliderancaData = Input<typeof CargosliderancaDataSchema>;

interface CargosliderancaParams {
  id: string;
}

class CargosliderancaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const cargosDeLideranca = await CargosliderancaRepositorie.findAll();
    if (!cargosDeLideranca) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(cargosDeLideranca);
  }

  async show(
    request: FastifyRequest<{
      Params: CargosliderancaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const situacaoNoReino = await CargosliderancaRepositorie.findById(id);
    if (!situacaoNoReino) {
      return reply.code(404).send({ message: "Situacao No Reino not found!" });
    }
    return reply.code(200).send(situacaoNoReino);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const cargosLiderancaDataForm = request.body as CargosliderancaData;
    const cargosLideranca =
      await CargosliderancaRepositorie.createCargoslideranca({
        ...cargosLiderancaDataForm
      })
    return reply.code(201).send(cargosLideranca);
  }

  async update(
    request: FastifyRequest<{
      Params: CargosliderancaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cargosLiderancaDataForm = request.body as CargosliderancaData;
    const cargosLideranca =
      await CargosliderancaRepositorie.updateCargoslideranca(id, {
        ...cargosLiderancaDataForm,
      });
    return reply.code(202).send(cargosLideranca);
  }

  async delete(
    request: FastifyRequest<{
      Params: CargosliderancaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await CargosliderancaRepositorie.deleteCargoslideranca(id);
    return reply.code(204).send();
  }
}

export default new CargosliderancaController();
