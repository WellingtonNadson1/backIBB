import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from "valibot";
import { z } from "zod";
import PresencaReuniaoCelulaRepositorie from "../../Repositories/PresencaReuniaoCelula";

const PresencaReuniaoCelulaDataSchema = object({
  status: boolean(),
  membro: string(),
  which_reuniao_celula: string(),
});

export type PresencaReuniaoCelulaData = Input<
  typeof PresencaReuniaoCelulaDataSchema
>;

const NewPresencaReuniaoCelulaDataSchema = z.object({
  which_reuniao_celula: z.string(),
  membro: z.array(
    z.object({
      id: z.string(),
      status: z.boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
    }),
  ),
});

export type NewPresencaReuniaoCelulaDataSchema = z.infer<typeof NewPresencaReuniaoCelulaDataSchema>;

interface PresencaReuniaoCelulaParams {
  id: string;
}

class PresencaReuniaoCelulaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasReuniaoCelula =
      await PresencaReuniaoCelulaRepositorie.findAll();
    if (!presencasReuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencasReuniaoCelula);
  }

  async isregister(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply) {
    const { id } = request.params;
    console.log('Id mandado do front', id)
    const presencasReuniaoCelula =
      await PresencaReuniaoCelulaRepositorie.findPresenceRegistered(id);
    if (!presencasReuniaoCelula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencasReuniaoCelula);
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencasReuniaoCelula =
      await PresencaReuniaoCelulaRepositorie.findById(id);
    if (!presencasReuniaoCelula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencasReuniaoCelula);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencasReuniaoCelulaDataForm =
        request.body as PresencaReuniaoCelulaData;

      const { which_reuniao_celula, membro } = presencasReuniaoCelulaDataForm;
      // Verifique se já existe uma presença registrada para o membro e culto
      const existingPresenca = await PresencaReuniaoCelulaRepositorie.findFirst({
        which_reuniao_celula: which_reuniao_celula,
        membro: membro,
      });

      if (existingPresenca) {
        return reply
          .code(409)
          .send({ message: "Presença de Culto já registrada para hoje!" });
      }

      const presencaCelula =
        await PresencaReuniaoCelulaRepositorie.createPresencaReuniaCelula({
          ...presencasReuniaoCelulaDataForm,
        });
      return reply.code(201).send(presencaCelula);

    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async newstore(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencasReuniaoCelulaDataForm =
        request.body as NewPresencaReuniaoCelulaDataSchema;

      const { which_reuniao_celula, membro } = presencasReuniaoCelulaDataForm;
      // Verifique se já existe uma presença registrada para o membro e culto
      const existingPresenca = await PresencaReuniaoCelulaRepositorie.findFirst({
        which_reuniao_celula: which_reuniao_celula,
        membro: membro[0].id,
      });

      if (existingPresenca) {
        return reply
          .code(409)
          .send({ message: "Presença de Célula já registrada para hoje!" });
      }

      const presencaCelula =
        await PresencaReuniaoCelulaRepositorie.createNewPresencaReuniaCelula({
          ...presencasReuniaoCelulaDataForm,
        });

      return reply.code(201).send({
        presencaCelula,
        message: "Presença Registrada!",
      });

    } catch (error: any) {
      console.error(error); // Log o erro no console para depuração
      return reply.code(400).send(error.message || "Erro interno do servidor");
    }
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaReuniaoCelulaDataForm =
      request.body as PresencaReuniaoCelulaData;
    const presencaReuniaoCelula =
      await PresencaReuniaoCelulaRepositorie.updatePresencaReuniaoCelula(id, {
        ...presencaReuniaoCelulaDataForm,
      });
    return reply.code(202).send(presencaReuniaoCelula);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await PresencaReuniaoCelulaRepositorie.deletePresencaReuniaoCelula(id);
    return reply.code(204).send();
  }
}

export default new PresencaReuniaoCelulaController();
