import { FastifyInstance } from "fastify";
import PresencaReuniaoCelulaController from '../../Controllers/PresencaReuniaoCelula';

const routerPresencaReuniaCelula = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencareuniaocelulas", PresencaReuniaoCelulaController.index);
  fastify.get('/presencareuniaocelulas/:id', PresencaReuniaoCelulaController.show);
  fastify.post("/presencareuniaocelulas", PresencaReuniaoCelulaController.store);
  fastify.post("/presencareuniaocelulas/isregister", PresencaReuniaoCelulaController.isregister);
  fastify.delete("/presencareuniaocelulas/:id", PresencaReuniaoCelulaController.delete);
  fastify.put("/presencareuniaocelulas/:id", PresencaReuniaoCelulaController.update);

};

export default routerPresencaReuniaCelula;
