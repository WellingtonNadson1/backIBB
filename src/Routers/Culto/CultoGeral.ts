import { FastifyInstance } from 'fastify';
import CultoGeralController from "../../Controllers/Culto/CultoGeral";

const routerCultoGeral = async (fastify: FastifyInstance) => {
  // CULTOS
  fastify.get("/cultos", CultoGeralController.index);
  fastify.get('/cultos/:id', CultoGeralController.show);
  fastify.post("/cultos", CultoGeralController.store);
  fastify.delete("/cultos/:id", CultoGeralController.delete);
  fastify.put("/cultos/:id", CultoGeralController.update);

};

export default routerCultoGeral;
