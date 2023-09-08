import { FastifyReply, FastifyRequest } from 'fastify';
import ParticipacaoRepositorie from '../Repositories/ParticipacaoRepositorie';

export interface ParticipacaoData {
  presente:   boolean
  eventoId:   string
  membroId:   string
}

interface ParticipacaoParams {
  id: string
  eventoIdParams: string
  membroIdParams: string
}

class ParticipacaoController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const participacoes = await ParticipacaoRepositorie.findAll();
    if (!participacoes) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.code(200).send(participacoes);
  }

  async show(request: FastifyRequest <{
    Params: ParticipacaoParams }>, reply: FastifyReply) {
    const { eventoIdParams, membroIdParams } = request.params
    const participacao = await ParticipacaoRepositorie.findById(eventoIdParams, membroIdParams);
    if (!participacao) {
      return reply.code(404).send({ message: "Participacao not found!" });
    }
    return reply.code(200).send(participacao);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const participacaoDataForm = request.body as ParticipacaoData;
    const participacao = await ParticipacaoRepositorie.createParticipacao({
      ...participacaoDataForm,
    });
    return reply.code(201).send(participacao);
  }

  async update(request: FastifyRequest <{
    Params: ParticipacaoParams }>, reply: FastifyReply) {
    const { id } = request.params
    const participacaoDataForm = request.body as ParticipacaoData;
    const participacao = await ParticipacaoRepositorie.updateParticipacao( id, {...participacaoDataForm,});
    return reply.code(202).send(participacao);
  }

  async delete(request: FastifyRequest <{
    Params: ParticipacaoParams }>, reply: FastifyReply) {
    const { id } = request.params
    await ParticipacaoRepositorie.deleteParticipacao( id );
    return reply.code(204).send();
  }
}

export default new ParticipacaoController();
