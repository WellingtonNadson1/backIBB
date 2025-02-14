import { FastifyInstance } from "fastify";
import AgendaController from "../../Controllers/Agenda";

const routerAgenda = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.get(
    "/agenda-ibb-service/create-evento-agenda/all",
    AgendaController.getAll
  );
  fastify.get(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.index
  );
  fastify.post(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.store
  );
  fastify.patch(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.patch
  );
  fastify.put(
    "/agenda-ibb-service/create-evento-agenda",
    AgendaController.update
  );
  fastify.delete(
    "/agenda-ibb-service/create-evento-agenda/:eventoAgendaId",
    AgendaController.delete
  );
};

export default routerAgenda;
