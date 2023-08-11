import { FastifyInstance } from 'fastify';
import AulaEscolaController from "../../Controllers/AulaEscolaController";

// const routerUser = Router();
const routerAulaEscola = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/aulaescolas", AulaEscolaController.index);
  fastify.get('/aulaescolas/:id', AulaEscolaController.show);
  fastify.post("/aulaescolas", AulaEscolaController.store);
  fastify.delete("/aulaescolas/:id", AulaEscolaController.delete);
  fastify.put("/aulaescolas/:id", AulaEscolaController.update);

};

export default routerAulaEscola;
