import { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { DizimoRepository } from "../../Repositories/DizimoRepository";

const dizimoRepository = new DizimoRepository();

export class DizimoController {
  async createMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registros = request.body as Array<{
        userId: string;
        valor: number;
        data_dizimou: string;
      }>;

      if (!Array.isArray(registros) || registros.length === 0) {
        return reply
          .status(400)
          .send({ error: "Nenhum registro foi enviado." });
      }

      // Convertendo os valores para os tipos corretos
      const dadosFormatados = registros.map((registro) => ({
        userId: registro.userId,
        valor: new Prisma.Decimal(registro.valor), // ✅ Convertendo para Decimal
        data_dizimou: new Date(registro.data_dizimou), // ✅ Convertendo para Date
      }));

      const newDizimos = await dizimoRepository.createMany(dadosFormatados);

      return reply
        .status(201)
        .send({ message: "Registros criados com sucesso!", data: newDizimos });
    } catch (error) {
      return reply
        .status(500)
        .send({ error: "Erro ao criar registros de dízimo." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId, valor, data_dizimou } = request.body as {
        userId: string;
        valor: number;
        data_dizimou: string;
      };
      const newDizimo = await dizimoRepository.create({
        userId,
        valor: new Prisma.Decimal(valor),
        data_dizimou: new Date(data_dizimou),
      });
      return reply.status(201).send(newDizimo);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao criar dízimo." });
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
