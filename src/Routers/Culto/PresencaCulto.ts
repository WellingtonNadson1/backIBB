import { FastifyInstance } from "fastify";
import { PresencaCultoController } from '../../Controllers/Culto';

const routerPresencaCulto = async (fastify: FastifyInstance) => {
  fastify.get("/presencacultos/log", PresencaCultoController.findLog);
  fastify.get("/presencacultos", PresencaCultoController.index);
  fastify.get('/presencacultos/:id', PresencaCultoController.show);
  fastify.get(`/presencacultosbycelula/:culto`, PresencaCultoController.searchByIdCulto);
  fastify.post("/presencacultos", PresencaCultoController.store);
  fastify.delete("/presencacultos/:id", PresencaCultoController.delete);
  fastify.put("/presencacultos/:id", PresencaCultoController.update);

};

export default routerPresencaCulto;
