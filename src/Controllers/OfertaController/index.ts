import { Prisma } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { OfertaRepository } from "../../Repositories/OfertaRepository";

type CreateManyOfertaDTO = {
  userId: string;
  valor: string | number;
  data_ofertou: string;
  origem?:
    | "CULTO"
    | "PIX"
    | "TRANSFERENCIA"
    | "CARTAO"
    | "SECRETARIA"
    | "CELULA"
    | "OUTRO";
  cultoIndividualId?: string | null;
  celulaId?: string | null;
  descricao?: string | null;
  // membroNome vem do front só pra UI, não vai pro DB
};

const ofertaRepository = new OfertaRepository();

export class OfertaController {
  async createMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registros = request.body as CreateManyOfertaDTO[];

      if (!Array.isArray(registros) || registros.length === 0) {
        return reply
          .status(400)
          .send({ error: "Nenhum registro foi enviado." });
      }

      const dadosFormatados: Prisma.OfertaCreateManyInput[] = registros.map(
        (registro) => ({
          userId: registro.userId,
          valor: new Prisma.Decimal(registro.valor), // aceita string ou number
          data_ofertou: new Date(registro.data_ofertou),

          // 🔹 CAMPOS QUE ESTAVAM SENDO PERDIDOS:
          origem: registro.origem ?? "PIX", // se não vier, cai no default
          cultoIndividualId: registro.cultoIndividualId ?? null,
          celulaId: registro.celulaId ?? null,
          descricao: registro.descricao ?? null,

          // opcional: já setar datas de criação/atualização aqui
          date_create: new Date(),
          date_update: new Date(),
        })
      );

      const newOferta = await ofertaRepository.createMany(dadosFormatados);

      return reply
        .status(201)
        .send({ message: "Registros criados com sucesso!", data: newOferta });
    } catch (error) {
      return reply
        .status(500)
        .send({ error: "Erro ao criar registros de dízimo." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreateManyOfertaDTO;

      const newOferta = await ofertaRepository.create({
        userId: body.userId,
        valor: new Prisma.Decimal(body.valor),
        data_ofertou: new Date(body.data_ofertou),
        origem: body.origem ?? "PIX",
        cultoIndividualId: body.cultoIndividualId ?? null,
        celulaId: body.celulaId ?? null,
        descricao: body.descricao ?? null,
        date_create: new Date(),
        date_update: new Date(),
      });

      return reply.status(201).send(newOferta);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: "Erro ao criar oferta." });
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

      const ofertas = await ofertaRepository.findAll(pageNumber, limitNumber);
      return reply.send(ofertas);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao listar os dízimos." });
    }
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const oferta = await ofertaRepository.findById(id);
      if (!oferta)
        return reply.status(404).send({ error: "Dízimo não encontrado." });
      return reply.send(oferta);
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
        data_ofertou: string;
      }>;

      const data: Partial<{
        userId?: string;
        valor?: Prisma.Decimal;
        data_ofertou?: Date;
      }> = {};

      if (requestBody.userId) {
        data.userId = requestBody.userId;
      }

      if (requestBody.valor !== undefined) {
        data.valor = new Prisma.Decimal(requestBody.valor); // ✅ Conversão correta
      }

      if (requestBody.data_ofertou) {
        data.data_ofertou = new Date(requestBody.data_ofertou); // ✅ Mantém como Date
      }

      const updatedDizimo = await ofertaRepository.update(id, data);

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
      const deletedOferta = await ofertaRepository.delete(id);
      if (!deletedOferta)
        return reply.status(404).send({ error: "Dízimo não encontrado." });
      return reply.send({ message: "Dízimo deletado com sucesso." });
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao deletar o dízimo." });
    }
  }
}
