import { FastifyInstance } from "fastify";
import { CultoIndividualController } from "../../Controllers/Culto";

const routerCultoIndividual = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.post("/cultosindividuais/fordate", CultoIndividualController.forDate);
  fastify.get(
    "/cultosindividuais/presenca-por-tipo",
    CultoIndividualController.getPresencaPorTipo
  );
  fastify.get("/cultosindividuais", CultoIndividualController.index);
  fastify.post(
    "/cultosindividuais/perperiodo",
    CultoIndividualController.perperiod
  );
  fastify.get("/cultosindividuais/:id", CultoIndividualController.show);
  fastify.post("/cultosindividuais", CultoIndividualController.store);
  fastify.delete("/cultosindividuais/:id", CultoIndividualController.delete);
  fastify.put("/cultosindividuais/:id", CultoIndividualController.update);

  // Nova rota para os dados de atendimento do frontend
  fastify.get(
    "/cultosindividuais/attendance",
    CultoIndividualController.getAttendanceData
  );
};

export default routerCultoIndividual;
