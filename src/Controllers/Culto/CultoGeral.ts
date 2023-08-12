import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from 'valibot';
import { EscolaRepositorie } from "../../Repositories/Escola";

const EscolaDataSchema = object ({
  nome: string(),
  descricao: string(),
  lider: string(),
  turmas: array(string()),
  alunos: array(string()),
})

export type EscolaData = Input<typeof EscolaDataSchema>

interface EscolaParams {
  id: string;
}

class CultoGeralController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const escolas = await EscolaRepositorie.findAll();
    if (!escolas) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(escolas);
  }

  async show(
    request: FastifyRequest<{
      Params: EscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const escola = await EscolaRepositorie.findById(id);
    if (!escola) {
      return reply.code(404).send({ message: "Escola not found!" });
    }
    return reply.code(200).send(escola);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const escolaDataForm = request.body as EscolaData;
      const escola = await EscolaRepositorie.createEscola({
        ...escolaDataForm,
      });
      return reply.code(201).send(escola);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: EscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const escolaDataForm = request.body as EscolaData;
    const escola = await EscolaRepositorie.updateEscola(id, {
      ...escolaDataForm,
    });
    return reply.code(202).send(escola);
  }

  async delete(
    request: FastifyRequest<{
      Params: EscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await EscolaRepositorie.deleteEscola(id);
    return reply.code(204);
  }
}

export default new CultoGeralController();
