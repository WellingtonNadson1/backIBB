import { FastifyInstance } from "fastify";
import SupervisaoController from "../Controllers/SupervisaoController";

// const routerUser = Router();
const routerSupervisao = async (fastify: FastifyInstance) => {
  // SUPERVISAO
  fastify.get(
    "/supervisoes/metrics-supervision",
    SupervisaoController.getSupervisionMetrics
  );
  fastify.get(
    "/supervisoes/leadership/distribution",
    SupervisaoController.leadershipDistribution
  );
  fastify.get("/supervisoes/allIds", SupervisaoController.indexAll);
  fastify.get("/supervisoes", SupervisaoController.index);
  fastify.get("/supervisoes/:id", SupervisaoController.show);
  fastify.post("/supervisoes", SupervisaoController.store);
  fastify.delete("/supervisoes/:id", SupervisaoController.delete);
  fastify.put("/supervisoes/:id", SupervisaoController.update);
};

export default routerSupervisao;
