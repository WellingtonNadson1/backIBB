import dayjs from "dayjs";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CultoIndividualForDate } from "../../Controllers/Culto/CultoIndividual";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

const routerRelatorioPresencaCelula = async (fastify: FastifyInstance) => {
  fastify.post(
    "/relatorio/presencacelula",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const prisma = createPrismaInstance();

        const { startDate, endDate, superVisionId } =
          request.body as CultoIndividualForDate;

        const dataFim = dayjs(endDate).endOf("day").toISOString();

        const supervisionData = await prisma.supervisao.findUnique({
          where: {
            id: superVisionId,
          },
          select: {
            nome: true,
            supervisor: { select: { first_name: true } },
            celulas: {
              select: {
                id: true,
                nome: true,
                membros: {
                  select: { id: true, first_name: true, image_url: true },
                },
                lider: { select: { first_name: true } },
                _count: { select: { membros: true } },
                reunioes_celula: {
                  where: {
                    data_reuniao: {
                      gte: new Date(startDate),
                      lte: new Date(dataFim),
                    },
                  },
                  select: {
                    id: true,
                    data_reuniao: true,
                    visitantes: true,
                    almas_ganhas: true,
                    presencas_membros_reuniao_celula: {
                      select: {
                        status: true,
                        membro: {
                          select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        reply.send({
          supervisionData,
        });
      } catch (error) {
        console.error("Erro:", error);
        reply.status(500).send("Erro interno do servidor");
      } finally {
        await disconnectPrisma();
      }
    }
  );
};

export default routerRelatorioPresencaCelula;
