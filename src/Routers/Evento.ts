import { FastifyInstance } from 'fastify';
import EventoController from "../Controllers/EventoController";

const routerEvento = async (fastify: FastifyInstance) => {
  // EVENTS
  fastify.get("/eventos", EventoController.index);
  fastify.get("/eventos/:id", EventoController.show);
  fastify.post("/eventos", EventoController.store);
  fastify.delete("/eventos/:id", EventoController.delete);
  fastify.put("/eventos/:id", EventoController.update);
};

export default routerEvento;
