import { FastifyInstance } from 'fastify';
import EscolaController from "../../Controllers/EscolaController";

// const routerUser = Router();
const routerEscola = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/escolas", EscolaController.index);
  fastify.get('/escolas/:id', EscolaController.show);
  fastify.post("/escolas", EscolaController.store);
  fastify.delete("/escolas/:id", EscolaController.delete);
  fastify.put("/escolas/:id", EscolaController.update);

};

export default routerEscola;
