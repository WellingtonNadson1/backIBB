import { FastifyInstance } from "fastify";
import AgendaController from "../../Controllers/Agenda";

const routerAgenda = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.get(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.index
  );
  fastify.post(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.store
  );
  fastify.put(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.update
  );
  fastify.delete(
    "/agenda-ibb-service/create-evento-agenda/?eventoAgendaId=${eventoAgendaId}",
    AgendaController.delete
  );
};

export default routerAgenda;
