import { FastifyInstance } from 'fastify';
import UserController from '../Controllers/User/UserController';

const routerUser = async (fastify: FastifyInstance) => {
  // USERS
  fastify.get("/users/all", UserController.combinationRequests);
  fastify.get("/users", UserController.index);
  fastify.get("/users/cell", UserController.indexcell);
  fastify.get("/users/cell/:id", UserController.showcell);
  fastify.get("/users/:id", UserController.show);
  fastify.post("/users", UserController.store);
  fastify.delete("/users/:id", UserController.delete);
  fastify.put("/users/:id", UserController.update);
  fastify.put("/users/discipulador", UserController.updateDisicipulo);
};

export default routerUser;
