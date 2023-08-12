import { FastifyInstance } from 'fastify';
import { PresencaCultoController } from '../../Controllers/Culto';

const routerPresencaCulto = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencacultos", PresencaCultoController.index);
  fastify.get('/presencacultos/:id', PresencaCultoController.show);
  fastify.post("/presencacultos", PresencaCultoController.store);
  fastify.delete("/presencacultos/:id", PresencaCultoController.delete);
  fastify.put("/presencacultos/:id", PresencaCultoController.update);

};

export default routerPresencaCulto;
