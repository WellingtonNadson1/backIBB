import dayjs from "dayjs";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CultoIndividualForDate } from "../../Controllers/Culto/CultoIndividual";
import { createPrismaInstance } from "../../services/prisma";
import {
  resolveEffectiveCoverageNodeId,
  resolveReportNodeId,
  resolveSetorIdsForNode,
} from "../../services/SupervisaoCoverageService";

const routerRelatorioPresencaCelula = async (fastify: FastifyInstance) => {
  fastify.post(
    "/relatorio/presencacelula",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const prisma = createPrismaInstance();
        const requesterId = request.user?.id;
        if (!requesterId) {
          return reply.status(401).send({ error: "Não autorizado" });
        }

        const payload = request.body as CultoIndividualForDate & {
          nodeId?: string;
          supervisionNodeId?: string;
          supervisaoId?: string;
        };
        const { startDate, endDate } = payload;
        const requestedNodeId = resolveReportNodeId(payload);
        const coverageNodeId = await resolveEffectiveCoverageNodeId(
          {
            requesterUserId: requesterId,
            requestedNodeId,
          },
          prisma,
        );

        if (!coverageNodeId) {
          return reply.status(403).send({
            error:
              "Usuário sem supervisão vinculada para o escopo do relatório.",
          });
        }

        const dataFim = dayjs(endDate).endOf("day").toISOString();
        const coverageSetorIds = await resolveSetorIdsForNode(
          coverageNodeId,
          prisma,
        );

        const supervisionNode = await prisma.supervisao.findUnique({
          where: {
            id: coverageNodeId,
          },
          select: {
            id: true,
            nome: true,
            tipo: true,
            supervisor: { select: { first_name: true, image_url: true } },
          },
        });

        if (!supervisionNode) {
          return reply.status(404).send({
            error: "Nó de supervisão não encontrado para o relatório.",
          });
        }

        const celulas = coverageSetorIds.length
          ? await prisma.celula.findMany({
              where: {
                supervisaoId: { in: coverageSetorIds },
              },
              select: {
                id: true,
                nome: true,
                membros: {
                  select: { id: true, first_name: true, image_url: true },
                },
                lider: { select: { first_name: true, image_url: true } },
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
            })
          : [];

        reply.send({
          coverage: {
            nodeId: supervisionNode.id,
            tipo: supervisionNode.tipo,
            setorIds: coverageSetorIds,
          },
          nodeType: supervisionNode.tipo,
          supervisionData: {
            nome: supervisionNode.nome,
            tipo: supervisionNode.tipo,
            supervisor: supervisionNode.supervisor,
            celulas,
          },
        });
      } catch (error) {
        console.error("Erro:", error);
        reply.status(500).send("Erro interno do servidor");
      }
    },
  );
};

export default routerRelatorioPresencaCelula;
