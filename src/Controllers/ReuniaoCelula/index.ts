import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from "valibot";
import ReuniaoCelulaRepositorie from "../../Repositories/ReuniaoCelula";

const ReuniaoCelulaDataSchema = object({
  data_reuniao: date(),
  status: string(), // status (realizada, cancelada, etc.)
  presencas_membros_reuniao_celula: array(string()),
  celula: string(),
});

export type ReuniaoCelulaData = Input<typeof ReuniaoCelulaDataSchema>;

interface ReuniaoCelulaParams {
  id: string;
}

class ReuniaoSemanalCelulaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const reuniaoCelula = await ReuniaoCelulaRepositorie.findAll();
    if (!reuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(reuniaoCelula);
  }

  async show(
    request: FastifyRequest<{
      Params: ReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const reuniaoCelula = await ReuniaoCelulaRepositorie.findById(id);
    if (!reuniaoCelula) {
      return reply.code(404).send({ message: "Reunião de Célula not found!" });
    }
    return reply.code(200).send(reuniaoCelula);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const reuniaoCelulaDataForm = request.body as ReuniaoCelulaData;

      const { data_reuniao, celula } = reuniaoCelulaDataForm

      const reuniaoCelulaExist = await ReuniaoCelulaRepositorie.findFirst({
        data_reuniao: data_reuniao,
        celula: celula,
      });

      if (reuniaoCelulaExist) {
        return reply
          .code(409)
          .send({ message: "Presença de Culto já registrada para hoje!" });
      }

      // Se não existir, crie a presença
      const presencaCulto = await ReuniaoCelulaRepositorie.createReuniaoCelula({
        ...reuniaoCelulaDataForm,
      });

      return reply.code(201).send(presencaCulto);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: ReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const reuniaoCelulaDataForm = request.body as ReuniaoCelulaData;
    const reuniaoCelula = await ReuniaoCelulaRepositorie.updateReuniaoCelula(
      id,
      {
        ...reuniaoCelulaDataForm,
      }
    );
    return reply.code(202).send(reuniaoCelula);
  }

  async delete(
    request: FastifyRequest<{
      Params: ReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await ReuniaoCelulaRepositorie.deleteReuniaoCelula(id);
    return reply.code(204).send();
  }
}

export default new ReuniaoSemanalCelulaController();
