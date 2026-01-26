import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from "valibot";
import { z } from "zod";
import PresencaReuniaoCelulaRepositorie from "../../Repositories/PresencaReuniaoCelula";
import { UpsertPresencaReuniaoCelulaSchema } from "../../Repositories/PresencaReuniaoCelula/schemas";

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

export type NewPresencaReuniaoCelulaDataSchema = z.infer<
  typeof NewPresencaReuniaoCelulaDataSchema
>;

interface PresencaReuniaoCelulaParams {
  id: string;
}

class PresencaReuniaoCelulaController {
  // Fazendo uso do Fastify
  async getCellMetrics(request: FastifyRequest, reply: FastifyReply) {
    const metrics = await PresencaReuniaoCelulaRepositorie.getCellMetrics();
    if (!metrics) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(metrics);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasReuniaoCelula =
      await PresencaReuniaoCelulaRepositorie.findAll();
    if (!presencasReuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencasReuniaoCelula);
  }

  async isregister(
    request: FastifyRequest<{ Params: PresencaReuniaoCelulaParams }>,
    reply: FastifyReply,
  ) {
    const { id } = request.params;

    const exists = await PresencaReuniaoCelulaRepositorie.existsByReuniaoId(id);

    return reply.code(200).send({ exists });
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply,
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
      const existingPresenca = await PresencaReuniaoCelulaRepositorie.findFirst(
        {
          which_reuniao_celula: which_reuniao_celula,
          membro: membro,
        },
      );

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
      const body = NewPresencaReuniaoCelulaDataSchema.parse(request.body);

      const result =
        await PresencaReuniaoCelulaRepositorie.createManyIdempotent(body);

      return reply.code(200).send({
        message: "Processado com sucesso",
        ...result, // { total, created, skipped }
      });
    } catch (error: any) {
      return reply
        .code(400)
        .send({ message: error?.message ?? "Erro ao processar presença" });
    }
  }

  async createManyIdempotent(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = UpsertPresencaReuniaoCelulaSchema.parse(request.body);

      const exists = await PresencaReuniaoCelulaRepositorie.existsByReuniaoId(
        body.which_reuniao_celula,
      );

      // ✅ regra: se já existe e não autorizou retificação -> BLOQUEIA
      if (exists && !body.allowUpdate) {
        return reply.code(409).send({
          message:
            "Presença já cadastrada. Ative o modo Retificar para alterar.",
          exists: true,
        });
      }

      const result =
        await PresencaReuniaoCelulaRepositorie.upsertManyIdempotent(body);

      return reply.code(200).send({
        message: "Processado com sucesso",
        exists,
        ...result,
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return reply
          .code(400)
          .send({ message: "Payload inválido", issues: error.flatten() });
      }
      return reply
        .code(400)
        .send({ message: error?.message ?? "Erro ao processar presença" });
    }
  }

  async listByReuniao(
    request: FastifyRequest<{ Params: { reuniaoId: string } }>,
    reply: FastifyReply,
  ) {
    const { reuniaoId } = request.params;

    const rows =
      await PresencaReuniaoCelulaRepositorie.listByReuniaoId(reuniaoId);

    return reply.code(200).send({ items: rows });
    // items: [{ userId, status }]
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaReuniaoCelulaParams;
    }>,
    reply: FastifyReply,
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
    reply: FastifyReply,
  ) {
    const id = request.params.id;
    await PresencaReuniaoCelulaRepositorie.deletePresencaReuniaoCelula(id);
    return reply.code(204).send();
  }
}

export default new PresencaReuniaoCelulaController();
