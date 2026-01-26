// routes/cultoRoutes.ts
import { FastifyInstance } from "fastify";
import { createPrismaInstance } from "../../services/prisma";

const prisma = createPrismaInstance();

export async function cultoRoutes(app: FastifyInstance) {
  app.get("/cultos/semanais", async () => {
    const cultos = await prisma.cultoSemanal.findMany({
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
      },
    });

    return cultos;
  });
}
