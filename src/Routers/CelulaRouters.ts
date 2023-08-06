import { FastifyInstance } from 'fastify';
import CelulaController from "../Controllers/CelulaController";

// const routerUser = Router();
const routerCelula = async (fastify: FastifyInstance) => {
  // CELULA
  fastify.get("/celulas", CelulaController.index);
  fastify.get('/celulas/:id', CelulaController.show);
  fastify.post("/celulas", CelulaController.store);
  fastify.delete("/celulas/:id", CelulaController.delete);
  fastify.put("/celulas/:id", CelulaController.update);

};

export default routerCelula;
