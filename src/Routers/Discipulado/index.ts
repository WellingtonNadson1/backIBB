import { FastifyInstance } from "fastify";
import RegisterDiscipuladoController from "../../Controllers/Discipulado"

const routerRegisterDiscipulado = async (fastify: FastifyInstance) => {
  fastify.get("/discipulados", RegisterDiscipuladoController.index);
  fastify.get('/discipulados/relatorios', RegisterDiscipuladoController.cultosRelatorios);
  fastify.post('/discipulados/relatorios/supervisores', RegisterDiscipuladoController.supervisores);
  fastify.get('/discipulados/:id', RegisterDiscipuladoController.show);
  fastify.get(`/discipuladosbycelula/:culto/:lider`, RegisterDiscipuladoController.searchByIdCulto);
  fastify.post("/discipulados/existing-register", RegisterDiscipuladoController.isregister);
  fastify.post("/discipulados", RegisterDiscipuladoController.store);
  fastify.delete("/discipulados/:id", RegisterDiscipuladoController.delete);
  fastify.put("/discipulados/:id", RegisterDiscipuladoController.update);

};

export default routerRegisterDiscipulado;
