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
          presencas_cultos: {
            some: {
              AND: [
                { presenca_culto: { data_inicio_culto: { gte: dataInicio } } },
                { presenca_culto: { data_termino_culto: { lte: dataFim } } }
              ]
            },
          },
        },
        // Use a opção 'select' para selecionar apenas os campos desejados
        select: {
          id: true, // Inclua os campos que você deseja
          first_name: true,
          last_name: true,
          // Adicione outros campos necessários
          presencas_cultos: {
            select: {
              // Selecione apenas os campos relevantes em 'presencas_cultos'
              status: true,
              cultoIndividualId: true,
              date_create: true,
              presenca_culto: {
                select: {
                  data_inicio_culto: true,
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

if (cultosIndividuaisForDate) {
  console.log('cultosIndividuaisForDate', cultosIndividuaisForDate)

}
      const totalCultosPeriodo = cultosIndividuaisForDate.totalCultosPeriodo

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



        const porcentagemPresenca = (quantidadeCultosPresentes / totalCultosPeriodo) * 100;

        console.log('quantidadePresentes', quantidadeCultosPresentes)
        console.log('totalCultosPeriodo', totalCultosPeriodo)
        console.log('porcentagemPresenca', porcentagemPresenca)

        return {
          ...membro,
          presencas_cultos: presencasFiltradas,
          quantidadeCultos: totalCultosPeriodo,
          quantidadePresente: quantidadeCultosPresentes,
          porcentagemPresenca: porcentagemPresenca.toFixed(2)
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
