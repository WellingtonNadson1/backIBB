// Routers/Cultos/index.ts
import { FastifyInstance } from 'fastify';
import routerCultoGeral from './CultoGeral';
import routerCultoIndividual from './CultoIndividual';
import routerCultoSemanal from './CultoSemanal';
import routerPresencaCulto from './PresencaCulto';

const registerCultoRoutes = async (fastify: FastifyInstance) => {
  await fastify.register(routerCultoGeral);
  await fastify.register(routerCultoIndividual);
  await fastify.register(routerCultoSemanal);
  await fastify.register(routerPresencaCulto);
};

export default registerCultoRoutes;
