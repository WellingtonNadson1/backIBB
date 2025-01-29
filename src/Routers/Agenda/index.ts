import { FastifyInstance } from 'fastify';
import AgendaController from "../../Controllers/Agenda";

const routerAgenda = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.get("/agenda-ibb-service/create-evento-agenda", AgendaController.index);
};

export default routerAgenda;
