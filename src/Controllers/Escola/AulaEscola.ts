import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from 'valibot';
import { AulaEscolaRepositorie } from "../../Repositories/Escola";

const AulaEscolaDataSchema = object ({
  data_aula: date(),
  date_update: date(),
  status: string(), // status (realizada, cancelada, etc.)
  presencas: array(string()),
  turma: string(),
})

export type AulaEscolaData = Input<typeof AulaEscolaDataSchema>

interface AulaEscolaParams {
  id: string;
}

class AulaEscolaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const aulaescolas = await AulaEscolaRepositorie.findAll();
    if (!aulaescolas) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(aulaescolas);
  }

  async show(
    request: FastifyRequest<{
      Params: AulaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const aulaEscola = await AulaEscolaRepositorie.findById(id);
    if (!aulaEscola) {
      return reply.code(404).send({ message: "Aula not found!" });
    }
    return reply.code(200).send(aulaEscola);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const aulaEscolaDataForm = request.body as AulaEscolaData;
      const aulaEscola = await AulaEscolaRepositorie.createAulaEscola({
        ...aulaEscolaDataForm,
      });
      return reply.code(201).send(aulaEscola);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: AulaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const aulaEscolaDataForm = request.body as AulaEscolaData;
    const aulaEscola = await AulaEscolaRepositorie.updateAulaEscola(id, {
      ...aulaEscolaDataForm,
    });
    return reply.code(202).send(aulaEscola);
  }

  async delete(
    request: FastifyRequest<{
      Params: AulaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await AulaEscolaRepositorie.deleteAulaEscola(id);
    return reply.code(204);
  }
}

export default new AulaEscolaController();
