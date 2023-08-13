import { FastifyInstance } from 'fastify';
import CargosliderancaController from '../Controllers/CargosliderancaController';

// const routerUser = Router();
const routerCargoslideranca = async (fastify: FastifyInstance) => {
  // SUPERVISAO
  fastify.get("/cargoslideranca", CargosliderancaController.index);
  fastify.get('/cargoslideranca/:id', CargosliderancaController.show);
  fastify.post("/cargoslideranca", CargosliderancaController.store);
  fastify.delete("/cargoslideranca/:id", CargosliderancaController.delete);
  fastify.put("/cargoslideranca/:id", CargosliderancaController.update);
};

export default routerCargoslideranca;
