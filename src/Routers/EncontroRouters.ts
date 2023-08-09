import { FastifyInstance } from 'fastify';
import EncontroController from "../Controllers/EncontroController";

// const routerUser = Router();
const routerEncontro = async (fastify: FastifyInstance) => {
  // CELULA
  fastify.get("/encontros", EncontroController.index);
  fastify.get('/encontros/:id', EncontroController.show);
  fastify.post("/encontros", EncontroController.store);
  fastify.delete("/encontros/:id", EncontroController.delete);
  fastify.put("/encontros/:id", EncontroController.update);

};

export default routerEncontro;
