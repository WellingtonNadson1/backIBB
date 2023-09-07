import { FastifyInstance } from 'fastify';
import ReuniaoSemanalCelulaController from "../../Controllers/ReuniaoCelula";

const routerReuniaoSemanalCelula = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.get("/reunioessemanaiscelulas", ReuniaoSemanalCelulaController.index);
  fastify.get('/reunioessemanaiscelulas/:id', ReuniaoSemanalCelulaController.show);
  fastify.post("/reunioessemanaiscelulas", ReuniaoSemanalCelulaController.store);
  fastify.delete("/reunioessemanaiscelulas/:id", ReuniaoSemanalCelulaController.delete);
  fastify.put("/reunioessemanaiscelulas/:id", ReuniaoSemanalCelulaController.update);

};

export default routerReuniaoSemanalCelula;
