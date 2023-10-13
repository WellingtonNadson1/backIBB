import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from "valibot";
import { PresencaCultoRepositorie } from "../../Repositories/Culto";

const PresencaCultoDataSchema = object({
  status: boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
  membro: string(),
  presenca_culto: string(),
});

export type PresencaCultoData = Input<typeof PresencaCultoDataSchema>;

interface PresencaCultoParams {
  id: string;
  lider: string;
  culto: string;
}

class PresencaCultoController {
  // Fazendo uso do Fastify
  findLog(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = PresencaCultoRepositorie.findLog();
    return reply.send(presencasCultos);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = await PresencaCultoRepositorie.findAll();
    if (!presencasCultos) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencasCultos);
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaCulto = await PresencaCultoRepositorie.findById(id);
    if (!presencaCulto) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencaCulto);
  }

  async searchByIdCulto(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const {culto, lider} = request.params as PresencaCultoParams;
    console.log('culto: ', culto)
    console.log('lider: ', lider)

    const presencaCultoIsRegister =
      await PresencaCultoRepositorie.findByIdCulto(culto, lider);
    if (!presencaCultoIsRegister) {
      return reply.code(404).send({ message: "Presença not Register!" });
    }
    return reply.code(200).send(presencaCultoIsRegister);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencaCultoDataForm = request.body as PresencaCultoData;

      const { presenca_culto, membro } = presencaCultoDataForm;
      // Verifique se já existe uma presença registrada para o membro e culto
      const existingPresenca = await PresencaCultoRepositorie.findFirst({
        presenca_culto: presenca_culto,
        membro: membro,
      });

      if (existingPresenca) {
        return reply
          .code(409)
          .send({ message: "Presença de Culto já registrada para hoje!" });
      }

      // Se não existir, crie a presença
      const presencaCulto = await PresencaCultoRepositorie.createPresencaCulto({
        ...presencaCultoDataForm,
      });

      return reply.code(201).send(presencaCulto);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaCultoDataForm = request.body as PresencaCultoData;
    const presencaCulto = await PresencaCultoRepositorie.updatePresencaCulto(
      id,
      {
        ...presencaCultoDataForm,
      }
    );
    return reply.code(202).send(presencaCulto);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await PresencaCultoRepositorie.deletePresencaCulto(id);
    return reply.code(204).send();
  }
}

export default new PresencaCultoController();
