import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from 'valibot';
import { TurmaEscolaRepositorie } from "../../Repositories/Escola";

const TurmaEscolaDataSchema = object ({
  nome: string(),
  descricao: string(),
  escola: string(),
  aulas_marcadas: array(string()),
  alunos: array(string()),
  date_inicio: date(),
  date_conclusao: date(),
})

export type TrumaEscolaData = Input<typeof TurmaEscolaDataSchema>

interface TurmaEscolaParams {
  id: string;
}

class TurmaEscolaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const turmasEscolas = await TurmaEscolaRepositorie.findAll();
    if (!turmasEscolas) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(turmasEscolas);
  }

  async show(
    request: FastifyRequest<{
      Params: TurmaEscolaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const TurmaEscola = await TurmaEscolaRepositorie.findById(id);
    if (!TurmaEscola) {
      return reply.code(404).send({ message: "Turma of Aula not found!" });
    }
    return reply.code(200).send(TurmaEscola);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const turmaEscolaDataForm = request.body as TrumaEscolaData;
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
    const turmaEscolaDataForm = request.body as TrumaEscolaData;
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
