// Routers/Escolas/index.ts
import { FastifyInstance } from 'fastify';
import routerAulaEscola from './AulaEscola';
import routerEscola from './Escola';
import routerPresencaAulaEscola from './PresencaEscola';
import routerTurmaEscola from './TurmaEscola';

const registerEscolaRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(routerEscola);
  await fastify.register(routerTurmaEscola);
  await fastify.register(routerAulaEscola);
  await fastify.register(routerPresencaAulaEscola);
};

export default registerEscolaRoutes;
