import { EventoContribuicao, Prisma, TipoPagamento } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { DizimoRelatorioRepository } from "../../Repositories/DizimoRelatorioRepository";

type RegistroDizimoBody = {
  userId: string;
  valor: number | string;
  data_dizimou: string; // "YYYY-MM-DD" vindo do front
  evento?: EventoContribuicao; // novo
  tipoPagamento?: TipoPagamento; // novo
  cultoIndividualId?: string | null;
  descricao?: string | null;
};

function parseDateOnlyToLocal(dateString: string): Date {
  // espera "YYYY-MM-DD"
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // Date local, sem UTC implícito
}

const dizimoRepository = new DizimoRelatorioRepository();

type TipoRelatorio = "SUPERVISAO" | "CELULA" | "FUNCAO" | "STATUS";

export class DizimoRelatorioController {
  async findRelatorioDetalhado(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { tipoRelatorio, dataInicio, dataFim, supervisaoId, celulaId } =
        request.query as {
          tipoRelatorio?: string;
          dataInicio?: string;
          dataFim?: string;
          supervisaoId?: string;
          celulaId?: string;
        };

      if (!tipoRelatorio) {
        return reply
          .status(400)
          .send({ error: "tipoRelatorio é obrigatório." });
      }

      if (
        !["SUPERVISAO", "CELULA", "FUNCAO", "STATUS"].includes(tipoRelatorio)
      ) {
        return reply.status(400).send({
          error:
            "tipoRelatorio inválido. Use SUPERVISAO, CELULA, FUNCAO ou STATUS.",
        });
      }

      if (!dataInicio || !dataFim) {
        return reply.status(400).send({
          error: "dataInicio e dataFim são obrigatórios.",
        });
      }

      const relatorio = await dizimoRepository.findRelatorioDetalhado({
        tipoRelatorio: tipoRelatorio as TipoRelatorio,
        dataInicio,
        dataFim,
        supervisaoId,
        celulaId,
      });

      return reply.send(relatorio);
    } catch (error) {
      console.error("Erro ao gerar relatório detalhado de dízimos:", error);
      return reply
        .status(500)
        .send({ error: "Erro ao gerar relatório detalhado de dízimos." });
    }
  }

  async createMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registros = request.body as RegistroDizimoBody[];

      if (!Array.isArray(registros) || registros.length === 0) {
        return reply
          .status(400)
          .send({ error: "Nenhum registro foi enviado." });
      }

      const dadosFormatados: Prisma.DizimoCreateManyInput[] = registros.map(
        (registro) => ({
          userId: registro.userId,
          valor: new Prisma.Decimal(registro.valor),
          data_dizimou: parseDateOnlyToLocal(registro.data_dizimou),

          evento: registro.evento ?? EventoContribuicao.CULTO,
          tipoPagamento: registro.tipoPagamento ?? TipoPagamento.PIX,

          cultoIndividualId: registro.cultoIndividualId ?? null,
          descricao: registro.descricao ?? null,
        })
      );

      const newDizimos = await dizimoRepository.createMany(dadosFormatados);

      return reply
        .status(201)
        .send({ message: "Registros criados com sucesso!", data: newDizimos });
    } catch (error) {
      console.error(error);
      return reply
        .status(500)
        .send({ error: "Erro ao criar registros de dízimo." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const {
        userId,
        valor,
        data_dizimou,
        evento,
        tipoPagamento,
        cultoIndividualId,
        descricao,
      } = request.body as RegistroDizimoBody;

      const newDizimo = await dizimoRepository.create({
        userId,
        valor: new Prisma.Decimal(valor),
        data_dizimou: parseDateOnlyToLocal(data_dizimou),

        evento: evento ?? EventoContribuicao.CULTO,
        tipoPagamento: tipoPagamento ?? TipoPagamento.PIX,

        cultoIndividualId: cultoIndividualId ?? null,
        descricao: descricao ?? null,
      });

      return reply.status(201).send(newDizimo);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Erro ao criar dízimo." });
    }
  }

  async findAllRelatorioCardsController(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const relatorio = await dizimoRepository.findAllRelatorioCards();
      return reply.send(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de dízimos:", error);
      return reply.status(500).send({ error: "Erro ao listar os dízimos." });
    }
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { page, limit } = request.query as {
        page?: string;
        limit?: string;
      };

      // Converte os valores de string para número, se forem passados
      const pageNumber = page ? parseInt(page, 10) : 1;
      const limitNumber = limit ? parseInt(limit, 10) : 20;

      console.log("pageNumber", pageNumber);
      console.log("limitNumber", limitNumber);

      const dizimos = await dizimoRepository.findAll(pageNumber, limitNumber);
      return reply.send(dizimos);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao listar os dízimos." });
    }
  }

  async findByIdSupervisao(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { idSupervisao } = request.params as { idSupervisao: string };
      const { dataInicio, dataFim } = request.query as {
        dataInicio: string;
        dataFim: string;
      };

      if (!dataInicio || !dataFim) {
        return reply.status(400).send({ error: "Datas são obrigatórias" });
      }

      const dizimistasSupervisao = await dizimoRepository.findByIdSupervisao(
        idSupervisao,
        dataInicio,
        dataFim
      );
      if (!dizimistasSupervisao)
        return reply.status(404).send({ error: "Dízimistas não encontrados." });
      return reply.send(dizimistasSupervisao);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar o dízimistas." });
    }
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const dizimo = await dizimoRepository.findById(id);
      if (!dizimo)
        return reply.status(404).send({ error: "Dízimo não encontrado." });
      return reply.send(dizimo);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar o dízimo." });
    }
  }

  async findRelatorioMensal(request: FastifyRequest, reply: FastifyReply) {
    try {
      // opcional: permitir override via query ?meses=6
      const { meses } = request.query as { meses?: string };
      const qtdMeses = meses ? parseInt(meses, 10) : 12;

      const relatorio = await dizimoRepository.findRelatorioMensal(qtdMeses);
      return reply.send(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório mensal de dízimos:", error);
      return reply
        .status(500)
        .send({ error: "Erro ao listar os dízimos mensais." });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const requestBody = request.body as Partial<{
        userId: string;
        valor: number;
        data_dizimou: string;
      }>;

      const data: Partial<{
        userId?: string;
        valor?: Prisma.Decimal;
        data_dizimou?: Date;
      }> = {};

      if (requestBody.userId) {
        data.userId = requestBody.userId;
      }

      if (requestBody.valor !== undefined) {
        data.valor = new Prisma.Decimal(requestBody.valor); // ✅ Conversão correta
      }

      if (requestBody.data_dizimou) {
        data.data_dizimou = new Date(requestBody.data_dizimou); // ✅ Mantém como Date
      }

      const updatedDizimo = await dizimoRepository.update(id, data);

      if (!updatedDizimo) {
        return reply.status(404).send({ error: "Dízimo não encontrado." });
      }

      return reply.send(updatedDizimo);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao atualizar o dízimo." });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const deletedDizimo = await dizimoRepository.delete(id);
      if (!deletedDizimo)
        return reply.status(404).send({ error: "Dízimo não encontrado." });
      return reply.send({ message: "Dízimo deletado com sucesso." });
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao deletar o dízimo." });
    }
  }
}
