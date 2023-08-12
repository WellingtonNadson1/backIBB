import { FastifyInstance } from 'fastify';
import SituacaoNoReinoController from "../Controllers/SituacaoNoReinoController";

// const routerUser = Router();
const routerSituacaoNoReino = async (fastify: FastifyInstance) => {
  // SUPERVISAO
  fastify.get("/situacoesnoreino", SituacaoNoReinoController.index);
  fastify.get('/situacoesnoreino/:id', SituacaoNoReinoController.show);
  fastify.post("/situacoesnoreino", SituacaoNoReinoController.store);
  fastify.delete("/situacoesnoreino/:id", SituacaoNoReinoController.delete);
  fastify.put("/situacoesnoreino/:id", SituacaoNoReinoController.update);
};

export default routerSituacaoNoReino;
