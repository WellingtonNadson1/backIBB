import { FastifyReply, FastifyRequest } from 'fastify';
import SupervisaoRepositorie from '../Repositories/SupervisaoRepositorie';

interface Celula {
  id: string
  nome: string
}

interface User {
  id: string
  nome: string
}

export interface SupervisaoData {
  nome: string;
  cor: string
  supervisor: {
    id: string
    nome: string
  };
  celulas: Celula[];
  membros: User[];
}

interface SupervisaoParams {
  id: string;
}

class SupervisaoController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const supervisoes = await SupervisaoRepositorie.findAll();
    if (!supervisoes) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.code(200).send(supervisoes);
  }

  async show(request: FastifyRequest <{
    Params: SupervisaoParams }>, reply: FastifyReply) {
    const id = request.params.id
    const supervisao = await SupervisaoRepositorie.findById(id);
    if (!supervisao) {
      return reply.code(404).send({ message: "Supervisao not found!" });
    }
    return reply.code(200).send(supervisao);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const supervisaoDataForm = request.body as SupervisaoData;
    const supervisao = await SupervisaoRepositorie.createSupervisao({
      ...supervisaoDataForm,
    });
    return reply.code(201).send(supervisao);
  }

  async update(request: FastifyRequest <{
    Params: SupervisaoParams }>, reply: FastifyReply) {
    const id = request.params.id;
    const supervisaoDataForm = request.body as SupervisaoData;
    const supervisao = await SupervisaoRepositorie.updateSupervisao(id, {
      ...supervisaoDataForm,
    });
    return reply.code(202).send(supervisao);
  }

  async delete(request: FastifyRequest <{
    Params: SupervisaoParams }>, reply: FastifyReply) {
    const id = request.params.id;
    await SupervisaoRepositorie.deleteSupervisao(id);
    return reply.code(204);
  }
}

export default new SupervisaoController();
