import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from 'valibot';
import { CultoSemanalRepositorie } from "../../Repositories/Culto";

const CultoSemanalDataSchema = object ({
  nome: string(),
  descricao: string(),
  cultoGeral: string(),
  cultos: array(string()),
})

export type CultoSemanalData = Input<typeof CultoSemanalDataSchema>

interface CultoSemanalParams {
  id: string;
}

class CultoSemanalController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const cultosSemanais = await CultoSemanalRepositorie.findAll();
    if (!cultosSemanais) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosSemanais);
  }

  async show(
    request: FastifyRequest<{
      Params: CultoSemanalParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const CultoSemanal = await CultoSemanalRepositorie.findById(id);
    if (!CultoSemanal) {
      return reply.code(404).send({ message: "Culto Semanal not found!" });
    }
    return reply.code(200).send(CultoSemanal);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cultoSemanalDataForm = request.body as CultoSemanalData;
      const cultoSemanal = await CultoSemanalRepositorie.createCultoSemanal({
        ...cultoSemanalDataForm,
      });
      return reply.code(201).send(cultoSemanal);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: CultoSemanalParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cultoSemanalDataForm = request.body as CultoSemanalData;
    const cultoSemanal = await CultoSemanalRepositorie.updateCultoSemanal(id, {
      ...cultoSemanalDataForm,
    });
    return reply.code(202).send(cultoSemanal);
  }

  async delete(
    request: FastifyRequest<{
      Params: CultoSemanalParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await CultoSemanalRepositorie.deleteCultoSemanal(id);
    return reply.code(204).send();
  }
}

export default new CultoSemanalController();
