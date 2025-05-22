import { FastifyInstance } from "fastify";
import { RegisterDiscipuladoController } from "../../Controllers/Discipulado";

const routerRegisterDiscipulado = async (fastify: FastifyInstance) => {
  fastify.get(
    "/discipuladosibb/metrics",
    RegisterDiscipuladoController.getDiscipleMetrics
  );
  // fastify.get('/discipuladosibb/relatorios', RegisterDiscipuladoController.cultosRelatorios);
  fastify.post(
    "/discipuladosibb/supervisao/relatorio",
    RegisterDiscipuladoController.discipuladosRelatorioSupervisao
  );
  fastify.post(
    "/discipuladosibb/supervisor/relatorio",
    RegisterDiscipuladoController.discipuladosRelatorioSupervisor
  );
  // fastify.get('/discipuladosibb/:id', RegisterDiscipuladoController.show);
  // fastify.get(`/discipuladosibbbycelula/:culto/:lider`, RegisterDiscipuladoController.searchByIdCulto);
  fastify.post(
    "/discipuladosibb/existing-register",
    RegisterDiscipuladoController.isregister
  );
  fastify.post(
    "/discipuladosibb/allmemberscell/existing-register",
    RegisterDiscipuladoController.isMembersCellRegister
  );
  fastify.post(
    "/discipuladosibb/allmemberssupervisor/existing-register",
    RegisterDiscipuladoController.isMembersDiscipuladoSupervisorRegister
  );
  fastify.post("/discipuladosibb", RegisterDiscipuladoController.store);
  fastify.delete("/discipuladosibb/:id", RegisterDiscipuladoController.delete);
  fastify.put("/discipuladosibb/:id", RegisterDiscipuladoController.update);
};

export default routerRegisterDiscipulado;
