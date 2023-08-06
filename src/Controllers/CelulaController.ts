import { FastifyReply, FastifyRequest } from "fastify";
import CelulaRepositorie from "../Repositories/CelulaRepositorie";

export interface CelulaData {
  nome: string;
  lider: string;
  supervisao: string;
  membros: {
    id: string;
  }[];
  date_inicio: string;
  date_multipicar: string;
  cep: string;
  cidade: string;
  estado: string;
  endereco: string;
  numero: string;
}

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

  async update(
    request: FastifyRequest<{
      Params: CelulaParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const celulaDataForm = request.body as CelulaData;
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
    return reply.code(204);
  }
}

export default new CelulaController();
