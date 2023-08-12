import { FastifyInstance } from 'fastify';
import CultoSemanalController from "../../Controllers/Culto/CultoSemanal";


// const routerUser = Router();
const routerCultoSemanal = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/cultossemanais", CultoSemanalController.index);
  fastify.get('/cultossemanais/:id', CultoSemanalController.show);
  fastify.post("/cultossemanais", CultoSemanalController.store);
  fastify.delete("/cultossemanais/:id", CultoSemanalController.delete);
  fastify.put("/cultossemanais/:id", CultoSemanalController.update);

};

export default routerCultoSemanal;
