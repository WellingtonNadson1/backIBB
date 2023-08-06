import { FastifyInstance } from 'fastify';
import ParticipacaoController from '../Controllers/ParticipacaoController';

const routerParticipacao = async (fastify: FastifyInstance) => {
  // PARTICIPACAO
  fastify.get("/participacoes", ParticipacaoController.index);
  fastify.get('/participacoes/:id', ParticipacaoController.show);
  fastify.post("/participacoes", ParticipacaoController.store);
  fastify.delete("/participacoes/:id", ParticipacaoController.delete);
  fastify.put("/participacoes/:id", ParticipacaoController.update);
};

export default routerParticipacao;
