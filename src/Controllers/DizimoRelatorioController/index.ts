import { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { DizimoRelatorioRepository } from "../../Repositories/DizimoRelatorioRepository";

type RegistroDizimoBody = {
  userId: string;
  valor: number | string;
  data_dizimou: string;
  origem:
    | "CULTO"
    | "PIX"
    | "TRANSFERENCIA"
    | "CARTAO"
    | "SECRETARIA"
    | "CELULA"
    | "OUTRO";
  cultoIndividualId?: string | null;
  descricao?: string | null;
};

const dizimoRepository = new DizimoRelatorioRepository();

export class DizimoRelatorioController {
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
          data_dizimou: new Date(registro.data_dizimou),
          origem: registro.origem ?? "PIX", // default seguro
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
        origem,
        cultoIndividualId,
        descricao,
      } = request.body as RegistroDizimoBody;

      const newDizimo = await dizimoRepository.create({
        userId,
        valor: new Prisma.Decimal(valor),
        data_dizimou: new Date(data_dizimou),
        origem: origem ?? "PIX",
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
