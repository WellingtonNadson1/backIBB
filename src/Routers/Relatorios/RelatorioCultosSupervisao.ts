import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";
import dayjs from "dayjs";
import { CultoIndividualForDate } from "../../Controllers/Culto/CultoIndividual";
import { CultoIndividualRepositorie } from "../../Repositories/Culto";


const routerRelatorioPresencaCulto = async (fastify: FastifyInstance) => {
  fastify.post("/relatorio/presencacultos", async (request: FastifyRequest, reply: FastifyReply) => {

    try {
      const prisma = createPrismaInstance();

      const { startDate, endDate, superVisionId } = request.body as CultoIndividualForDate

      const dataInicio = dayjs(startDate).toISOString();
      const dataFim = dayjs(endDate).toISOString();

      // Consulta para buscar membros da supervisão que compareceram aos cultos no intervalo de tempo
      const membrosCompareceramCultos = await prisma?.user.findMany({
        where: {
          supervisaoId: superVisionId,
        },
        // Use a opção 'select' para selecionar apenas os campos desejados
        select: {
          id: true, // Inclua os campos que você deseja
          first_name: true,
          last_name: true,
          // Adicione outros campos necessários
          presencas_cultos: {
            where: {
              presenca_culto: {
                AND: [
                  { data_inicio_culto: { gte: dataInicio } },
                  { data_termino_culto: { lte: dataFim } }
                ]
              }
            },
            select: {
              // Selecione apenas os campos relevantes em 'presencas_cultos'
              status: true,
              cultoIndividualId: true,
              date_create: true,
              presenca_culto: {
                select: {
                  data_inicio_culto: true,
                  culto_semana: {
                    select: {
                      id: true
                    }
                  }
                }
              }
            },
          },
          celula: {
            select: {
              id: true, // Id da célula
              nome: true, // Nome da célula
              lider: {
                select: {
                  id: true,
                  first_name: true,
                }
              }
            },
          },
        },
      });

      const cultosIndividuaisForDate = await CultoIndividualRepositorie.findAllIntervall(startDate, endDate, superVisionId);

      const totalCultosPeriodo = cultosIndividuaisForDate.totalCultosPeriodo
      const cultoQuarta = cultosIndividuaisForDate.cultoQuarta
      const cultoPrimicia = cultosIndividuaisForDate.cultoPrimicia
      const cultoDomingoSacrificio = cultosIndividuaisForDate.cultoDomingoSacrificio
      const cultoSabado = cultosIndividuaisForDate.cultoSabado
      const totalCultosDomingoManha = cultosIndividuaisForDate.cultoDomingoManha
      const totalCultosDomingoTarde = cultosIndividuaisForDate.cultoDomingoTarde

      // Filtrar as presenças dentro do intervalo de datas
      const membrosCompareceramCultosFiltrados = membrosCompareceramCultos.map((membro) => {
        const presencasFiltradas = membro.presencas_cultos.filter((presenca) => {
          const dataPresenca = dayjs(presenca.date_create).utcOffset(0);
          return (
            dataPresenca.isAfter(dayjs(dataInicio).utcOffset(0)) &&
            dataPresenca.isBefore(dayjs(dataFim).utcOffset(0))
          );
        });

        const quantidadeCultosPresentes = presencasFiltradas.reduce((total, presente) => {
          return total + (presente.status === true ? 1 : 0);
        }, 0);

        const quantidadeCultosPresentePrimicia = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'bffb62af-8d03-473a-ba20-ab5a9d7dafbe') ? 1 : 0);
        }, 0);

        const quantidadeCultosPresenteDomingoSacrificio = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'e7bc72d1-8faa-4bbe-9c24-475b64f956cf') ? 1 : 0);
        }, 0);

        const quantidadeCultosPresenteQuarta = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === '4064be1d-bf55-4851-9f76-99c4554a6265') ? 1 : 0);
        }, 0);

        const quantidadeCultosPresenteSabado = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === '84acfbe4-c7e0-4841-813c-04731ffa9c67') ? 1 : 0);
        }, 0);

        const quantidadeCultosPresenteDomingoManha = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'cab02f30-cade-46ca-b118-930461013d53') ? 1 : 0);
        }, 0);

        const quantidadeCultosPresenteDomingoTarde = presencasFiltradas.reduce((total, presente) => {
          return total + ((presente.status === true && presente.presenca_culto?.culto_semana?.id === 'ea08ec9b-3d1b-42f3-818a-ec53ef99b78f') ? 1 : 0);
        }, 0);

        const porcentagemPresencaTotal = ((quantidadeCultosPresentes / totalCultosPeriodo) * 100).toFixed(2).slice(0, 5);

        const porcentagemPresencaQuarta = ((quantidadeCultosPresenteQuarta / cultoQuarta) * 100).toFixed(2).slice(0, 5);

        let porcentagemPresencaPrimicia = undefined

        if (quantidadeCultosPresentePrimicia !== 0) {
          porcentagemPresencaPrimicia = ((quantidadeCultosPresentePrimicia / cultoPrimicia) * 100).toFixed(2).slice(0, 5);
        } else {
          porcentagemPresencaPrimicia = 0.00.toFixed(2)
        }

        let porcentagemPresencaDomingoSacrificio = undefined

        if (quantidadeCultosPresenteDomingoSacrificio !== 0) {
          porcentagemPresencaDomingoSacrificio = ((quantidadeCultosPresenteDomingoSacrificio / cultoDomingoSacrificio) * 100).toFixed(2).slice(0, 5);
        } else {
          porcentagemPresencaDomingoSacrificio = 0.00.toFixed(2)
        }

        const porcentagemPresencaSabado = ((quantidadeCultosPresenteSabado / cultoSabado) * 100).toFixed(2).slice(0, 5);

        const porcentagemPresencaTotalDomingoManha = ((quantidadeCultosPresenteDomingoManha / totalCultosDomingoManha) * 100).toFixed(2).slice(0, 5);

        const porcentagemPresencaTotalDomingoTarde = ((quantidadeCultosPresenteDomingoTarde / totalCultosDomingoTarde) * 100).toFixed(2).slice(0, 5);

        const cultos = {
          porcentagemPresencaTotal,
          porcentagemPresencaQuarta,
          porcentagemPresencaPrimicia,
          porcentagemPresencaDomingoSacrificio,
          porcentagemPresencaSabado,
          porcentagemPresencaTotalDomingoManha,
          porcentagemPresencaTotalDomingoTarde,
        }

        return {
          ...membro,
          presencasFiltradas,
          cultos: cultos

        };
      });

      reply.send(membrosCompareceramCultosFiltrados);
    } catch (error) {
      console.error('Erro:', error);
      reply.status(500).send('Erro interno do servidor');
    }
    finally {
      await disconnectPrisma();
    }
  });
};

export default routerRelatorioPresencaCulto;
