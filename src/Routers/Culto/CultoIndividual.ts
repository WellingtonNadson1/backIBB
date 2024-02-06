import { FastifyInstance } from 'fastify';
import { CultoIndividualController } from '../../Controllers/Culto';

const routerCultoIndividual = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.post("/cultosindividuais/fordate", CultoIndividualController.forDate);
  fastify.get("/cultosindividuais", CultoIndividualController.index);
  fastify.get("/cultosindividuais/perperiodo", CultoIndividualController.perperiod);
  fastify.get('/cultosindividuais/:id', CultoIndividualController.show);
  fastify.post("/cultosindividuais", CultoIndividualController.store);
  fastify.delete("/cultosindividuais/:id", CultoIndividualController.delete);
  fastify.put("/cultosindividuais/:id", CultoIndividualController.update);

};

export default routerCultoIndividual;
