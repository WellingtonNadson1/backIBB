import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from 'valibot';
import { CultoGeralRepositorie } from "../../Repositories/Culto";

const CultoGeralDataSchema = object ({
  nome: string(),
  descricao: string(),
  lista_cultos_semanais: array(string()),
})

export type CultoGeralData = Input<typeof CultoGeralDataSchema>

interface CultoGeralParams {
  id: string;
}

class CultoGeralController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const cultosGerais = await CultoGeralRepositorie.findAll();
    if (!cultosGerais) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(cultosGerais);
  }

  async show(
    request: FastifyRequest<{
      Params: CultoGeralParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cultoGeral = await CultoGeralRepositorie.findById(id);
    if (!cultoGeral) {
      return reply.code(404).send({ message: "Culto Geral not found!" });
    }
    return reply.code(200).send(cultoGeral);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const cultoGeralDataForm = request.body as CultoGeralData;
      const cultoGeral = await CultoGeralRepositorie.createCultoGeral({
        ...cultoGeralDataForm,
      });
      return reply.code(201).send(cultoGeral);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: CultoGeralParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const cultoGeralDataForm = request.body as CultoGeralData;
    const cultoGeral = await CultoGeralRepositorie.updateCultoGerala(id, {
      ...cultoGeralDataForm,
    });
    return reply.code(202).send(cultoGeral);
  }

  async delete(
    request: FastifyRequest<{
      Params: CultoGeralParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await CultoGeralRepositorie.deleteCultoGeral(id);
    return reply.code(204);
  }
}

export default new CultoGeralController();
