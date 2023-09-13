import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from "valibot";
import { PresencaCultoRepositorie } from "../../Repositories/Culto";
import createPDFRelatorioPresenceCultoSupervision from "../../functions/createPDFRelatorioPresenceCultoSupervision";

const RelatorioPresencaCultoDataSchema = object({
  status: boolean(),
  membro: string(),
  which_reuniao_celula: string(),
});

export type RelatorioPresencaCultoData = Input<
  typeof RelatorioPresencaCultoDataSchema
>;

interface RelatorioPresencaCultoParams {
  id: string;
}

class RelatorioPresencaCultoController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    createPDFRelatorioPresenceCultoSupervision(reply)
    // const presencasReuniaoCelula =
    //   await PresencaCultoRepositorie.findAll();
    // if (!presencasReuniaoCelula) {
    //   return reply.code(500).send({ error: "Internal Server Error" });
    // }
    // return reply.send(presencasReuniaoCelula);
  }

  async show(
    request: FastifyRequest<{
      Params: RelatorioPresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencasReuniaoCelula =
      await PresencaCultoRepositorie.findById(id);
    if (!presencasReuniaoCelula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencasReuniaoCelula);
  }

  async searchByIdCulto(
    request: FastifyRequest<{
      Params: RelatorioPresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const presenca_culto = request.params.id;

    const presencaCultoIsRegister =
      await PresencaCultoRepositorie.findByIdCulto(presenca_culto);
    if (!presencaCultoIsRegister) {
      return reply.code(404).send({ message: "Presença not Register!" });
    }
    return reply.code(200).send(presencaCultoIsRegister);
  }

}

export default new RelatorioPresencaCultoController()
