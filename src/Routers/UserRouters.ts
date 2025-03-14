import { FastifyInstance } from "fastify";
import UserController from "../Controllers/User/UserController";

const routerUser = async (fastify: FastifyInstance) => {
  // USERS
  fastify.get("/users/all", UserController.combinationRequests);
  fastify.get("/users/allmembers", UserController.getAllMembers);
  fastify.get("/users", UserController.index);
  fastify.get("/users/simple", UserController.simple);
  fastify.get("/users/alldiscipulados", UserController.indexDiscipulados);
  fastify.post(
    "/users/alldiscipulossupervisor",
    UserController.indexDiscipulosSupervisor
  );
  fastify.post(
    "/users/alldiscipuladossupervisores",
    UserController.indexDiscipuladoSupervisorSupervisao
  );
  fastify.get("/users/cell", UserController.indexcell);
  fastify.get("/users/cell/:id", UserController.showcell);
  fastify.get("/users/:id", UserController.show);
  fastify.post("/users", UserController.store);
  fastify.delete("/users/:id", UserController.delete);
  fastify.put("/users/:id", UserController.update);
  // ALTERAR STATUS DO MEMBRO
  fastify.patch("/users/status", UserController.updateStatusMembro);
  fastify.put("/users/discipulador", UserController.updateDiscipulo);
};

export default routerUser;
