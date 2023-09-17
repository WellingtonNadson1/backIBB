import { FastifyInstance } from "fastify";
import { PresencaCultoController } from '../../Controllers/Culto';

const routerPresencaCulto = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencacultos", PresencaCultoController.index);
  fastify.get('/presencacultos/:id', PresencaCultoController.show);
  fastify.get(`/presencacultosbycelula/:culto/:lider`, PresencaCultoController.searchByIdCulto);
  fastify.post("/presencacultos", PresencaCultoController.store);
  fastify.delete("/presencacultos/:id", PresencaCultoController.delete);
  fastify.put("/presencacultos/:id", PresencaCultoController.update);
  // fastify.post("/presencamembros", PresencaCultoController.many);

};

export default routerPresencaCulto;
