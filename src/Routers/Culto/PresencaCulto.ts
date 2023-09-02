import { PrismaClient } from "@prisma/client";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PresencaCultoController } from '../../Controllers/Culto';
const prisma = new PrismaClient()

const routerPresencaCulto = async (fastify: FastifyInstance) => {
  // ESCOLA
  fastify.get("/presencacultos", PresencaCultoController.index);
  fastify.get('/presencacultos/:id', PresencaCultoController.show);
  fastify.post("/presencacultos", PresencaCultoController.store);
  fastify.delete("/presencacultos/:id", PresencaCultoController.delete);
  fastify.put("/presencacultos/:id", PresencaCultoController.update);
  fastify.post("/presencamembros", async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as { status: boolean; membro: string; presenca_culto: string; }[];
    const presencaCulto = await prisma.presencaCulto.createMany({
      data: data.map((item ) => ({
        status: item.status,
        membroId: item.membro,
        presenca_cultoId: item.presenca_culto,
      })),
    });
    return { presencaCulto };
  });

};

export default routerPresencaCulto;
