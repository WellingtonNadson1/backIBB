import { FastifyInstance } from 'fastify';
import { PresencaAulaController } from '../../Controllers/Escola';

// const routerUser = Router();
const routerPresencaAula = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencaaulas", PresencaAulaController.index);
  fastify.get('/presencaaulas/:id', PresencaAulaController.show);
  fastify.post("/presencaaulas", PresencaAulaController.store);
  fastify.delete("/presencaaulas/:id", PresencaAulaController.delete);
  fastify.put("/presencaaulas/:id", PresencaAulaController.update);

};

export default routerPresencaAula;
