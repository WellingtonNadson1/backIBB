import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, date, object, string } from "valibot";
import CelulaRepositorie from "../Repositories/CelulaRepositorie";

import { z } from "zod";

export const CelulaDataFormSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  membros: z.array(z.string().uuid()),
  lider: z.object({
    id: z.string().uuid(),
    first_name: z.string(),
  }),
  supervisao: z.object({
    id: z.string().uuid(),
    nome: z.string(),
  }),
  cep: z.string().length(8),
  cidade: z.string(),
  estado: z.string().length(2),
  bairro: z.string(),
  endereco: z.string(),
  numero_casa: z.string(),
  date_que_ocorre: z.string(),
  date_inicio: z.string().datetime(),
  date_multipicar: z.string().datetime(),
  reunioes_celula: z.array(
    z.object({
      id: z.string().uuid(),
      data_reuniao: z.string().datetime(),
      status: z.string(),
      presencas_membros_reuniao_celula: z.array(z.string().uuid()),
    })
  ),
});

export type CelulaDataForm = z.infer<typeof CelulaDataFormSchema>;

const CelulaDataSchema = object({
  nome: string(),
  lider: string(),
  supervisao: string(),
  membros: array(string()),
  reunioes_celula: array(string()),
  date_que_ocorre: string(),
  date_inicio: date(),
  date_multipicar: date(),
  cep: string(),
  cidade: string(),
  estado: string(),
  bairro: string(),
  endereco: string(),
  numero_casa: string(),
});

export type CelulaData = Input<typeof CelulaDataSchema>;

const CelulaChangeDateSchema = object({
  id: string(),
  date_que_ocorre: string(),
});

export type CelulaChangeDate = Input<typeof CelulaChangeDateSchema>;

interface CelulaParams {
  id: string;
}

class CelulaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const celulas = await CelulaRepositorie.findAll();
    if (!celulas) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(celulas);
  }

  async getPresenceByCultoIndividual(
    request: FastifyRequest<{
      Params: CelulaParams;
      Body: { idsCultos: string[] };
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const { idsCultos } = request.body;

    console.log("IDs dos cultos:", idsCultos);

    const celula = await CelulaRepositorie.PresenceByCultoIndividual(
      id,
      idsCultos
    );
    if (!celula) {
      return reply.code(404).send({ message: "Celula not found!" });
    }
    return reply.code(200).send(celula);
  }

  async show(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const celula = await CelulaRepositorie.findById(id);
    if (!celula) {
      return reply.code(404).send({ message: "Celula not found!" });
    }
    return reply.code(200).send(celula);
  }
  async showDetails(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const celula = await CelulaRepositorie.findByIdDetails(id);
    if (!celula) {
      return reply.code(404).send({ message: "Celula not found!" });
    }
    return reply.code(200).send(celula);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const celulaDataForm = request.body as CelulaData;
      const celula = await CelulaRepositorie.createCelula({
        ...celulaDataForm,
      });
      return reply.code(201).send(celula);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async updateForDate(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const { id, date_que_ocorre } = request.body as CelulaChangeDate;
    const celula = await CelulaRepositorie.updateDateCelula(
      id,
      date_que_ocorre
    );
    return reply.code(202).send(celula);
  }

  async update(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const celulaDataForm = request.body as CelulaDataForm;
    console.log("celulaDataForm ID:", id);
    console.log("celulaDataForm:", celulaDataForm);
    const celula = await CelulaRepositorie.updateCelula(id, {
      ...celulaDataForm,
    });
    return reply.code(202).send(celula);
  }

  async delete(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await CelulaRepositorie.deleteCelula(id);
    return reply.code(204).send();
  }
}

export default new CelulaController();
