// routes/cultoRoutes.ts
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

const prisma = new PrismaClient();

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
