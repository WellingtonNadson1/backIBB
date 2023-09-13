import { FastifyInstance } from "fastify";
import RelatorioPresencaCultoController from "../../Controllers/RelatorioPresencaCultoController";

const routerRelatorioPresencaCulto = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/relatorio/presencacultos", RelatorioPresencaCultoController.index);
  fastify.get('/relatorio/presencacultos/:id', RelatorioPresencaCultoController.show);
  fastify.get('/relatorio/presencacultosbycelula/:id', RelatorioPresencaCultoController.searchByIdCulto);

};

export default routerRelatorioPresencaCulto;
