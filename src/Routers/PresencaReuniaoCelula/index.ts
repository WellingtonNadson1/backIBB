import { FastifyInstance } from "fastify";
import PresencaReuniaoCelulaController from "../../Controllers/PresencaReuniaoCelula";

const routerPresencaReuniaCelula = async (fastify: FastifyInstance) => {
  fastify.get(
    "/presencareuniaocelulas/cell-metrics",
    PresencaReuniaoCelulaController.getCellMetrics,
  );
  fastify.get("/presencareuniaocelulas", PresencaReuniaoCelulaController.index);
  fastify.get(
    "/presencareuniaocelulas/:id",
    PresencaReuniaoCelulaController.show,
  );
  fastify.post(
    "/presencareuniaocelulas",
    PresencaReuniaoCelulaController.store,
  );
  fastify.post(
    "/presencareuniaocelulas/newroute",
    PresencaReuniaoCelulaController.newstore,
  );
  fastify.post(
    "/presencareuniaocelulas/idempotent",
    PresencaReuniaoCelulaController.createManyIdempotent,
  );
  fastify.get(
    "/presencareuniaocelulas/byreuniao/:reuniaoId",
    PresencaReuniaoCelulaController.listByReuniao,
  );
  fastify.get(
    "/presencareuniaocelulas/isregister/:id",
    PresencaReuniaoCelulaController.isregister,
  );
  fastify.delete(
    "/presencareuniaocelulas/:id",
    PresencaReuniaoCelulaController.delete,
  );
  fastify.put(
    "/presencareuniaocelulas/:id",
    PresencaReuniaoCelulaController.update,
  );
};

export default routerPresencaReuniaCelula;
