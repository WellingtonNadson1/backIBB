import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from 'valibot';
import TurmaEscolaRepositorie from "../Repositories/TurmaEscolaRepositorie";

const TurmaEscolaDataSchema = object ({
  nome: string(),
  descricao: string(),
  lider: string(),
  escola: string(),
  alunos: array(string()),
  aulas: array(string()),
  date_inicio: date(),
  date_conclusao: date(),
  date_aulas_marcadas: array(date()),
})

export type TurmaEscolaData = Input<typeof TurmaEscolaDataSchema>

interface TurmaEscolaParams {
  id: string;
}

class TurmaEscolaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const turmasescolas = await TurmaEscolaRepositorie.findAll();
    if (!turmasescolas) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(turmasescolas);
  }

  async show(
    request: FastifyRequest<{
      Params: TurmaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const turmaEscola = await TurmaEscolaRepositorie.findById(id);
    if (!turmaEscola) {
      return reply.code(404).send({ message: "Turma of Escola not found!" });
    }
    return reply.code(200).send(turmaEscola);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const turmaEscolaDataForm = request.body as TurmaEscolaData;
      const turmaEscola = await TurmaEscolaRepositorie.createTurmaEscola({
        ...turmaEscolaDataForm,
      });
      return reply.code(201).send(turmaEscola);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: TurmaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const turmaEscolaDataForm = request.body as TurmaEscolaData;
    const turmaEscola = await TurmaEscolaRepositorie.updateTurmaEscola(id, {
      ...turmaEscolaDataForm,
    });
    return reply.code(202).send(turmaEscola);
  }

  async delete(
    request: FastifyRequest<{
      Params: TurmaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await TurmaEscolaRepositorie.deleteTurmaEscola(id);
    return reply.code(204);
  }
}

export default new TurmaEscolaController();
