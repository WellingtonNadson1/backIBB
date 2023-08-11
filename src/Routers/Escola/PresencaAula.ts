import { FastifyInstance } from 'fastify';
import { PresencaAulaController } from '../../Controllers/Escola';

// const routerUser = Router();
const routerPresencaAula = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencaaula", PresencaAulaController.index);
  fastify.get('/presencaaula/:id', PresencaAulaController.show);
  fastify.post("/presencaaula", PresencaAulaController.store);
  fastify.delete("/presencaaula/:id", PresencaAulaController.delete);
  fastify.put("/presencaaula/:id", PresencaAulaController.update);

};

export default routerPresencaAula;
