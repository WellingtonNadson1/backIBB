import { FastifyInstance } from 'fastify';
import PresencaAulaAulaEscolaController from "../../Controllers/PresencaAulaAulaEscolaController";

// const routerUser = Router();
const routerPresencaAulaEscola = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencaaulaescolas", PresencaAulaAulaEscolaController.index);
  fastify.get('/presencaaulaescolas/:id', PresencaAulaAulaEscolaController.show);
  fastify.post("/presencaaulaescolas", PresencaAulaAulaEscolaController.store);
  fastify.delete("/presencaaulaescolas/:id", PresencaAulaAulaEscolaController.delete);
  fastify.put("/presencaaulaescolas/:id", PresencaAulaAulaEscolaController.update);

};

export default routerPresencaAulaEscola;
