import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, object, string } from "valibot";
import EncontroRepositorie from "../Repositories/EncontroRepositorie";

const EncontroDataSchema = object({
  nome: string(),
  descricao: string(),
  participantes: array(string()),
});

export type EncontroData = Input<typeof EncontroDataSchema>;

interface EncontroParams {
  id: string;
}

class EncontroController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const encontros = await EncontroRepositorie.findAll();
    if (!encontros) {
      return reply
        .code(500)
        .send({ error: "Internal Server Error - Encontro Controller" });
    }
    return reply.send(encontros);
  }

  async show(
    request: FastifyRequest<{
      Params: EncontroParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const encontro = await EncontroRepositorie.findById(id);
    if (!encontro) {
      return reply.code(404).send({ message: "Encontro not found!" });
    }
    return reply.code(200).send(encontro);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const encontroDataForm = request.body as EncontroData;
      const encontro = await EncontroRepositorie.createEncontro({
        ...encontroDataForm,
      });
      return reply.code(201).send({ message: "Encontro created" });
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: EncontroParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const encontroDataForm = request.body as EncontroData;
    const encontro = await EncontroRepositorie.updateEncontro(id, {
      ...encontroDataForm,
    });
    return reply.code(202).send({ message: "Encontro updated" });
  }

  async delete(
    request: FastifyRequest<{
      Params: EncontroParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await EncontroRepositorie.deleteEncontro(id);
    return reply.code(204).send();
  }
}

export default new EncontroController();
