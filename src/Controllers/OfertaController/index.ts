import { EventoContribuicao, Prisma, TipoPagamento } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { OfertaRepository } from "../../Repositories/OfertaRepository";

type CreateManyOfertaDTO = {
  userId?: string | null;
  valor: string | number;
  data_ofertou: string; // "YYYY-MM-DD"
  evento?: EventoContribuicao;
  tipoPagamento?: TipoPagamento;
  cultoIndividualId?: string | null;
  celulaId?: string | null;
  descricao?: string | null;
};

function parseDateOnlyToLocal(dateString: string): Date {
  // espera "YYYY-MM-DD"
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // Date local, sem UTC implícito
}

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
          userId: registro.userId ?? null,
          valor: new Prisma.Decimal(registro.valor),
          data_ofertou: parseDateOnlyToLocal(registro.data_ofertou),

          evento: registro.evento ?? EventoContribuicao.CELULA,
          tipoPagamento: registro.tipoPagamento ?? TipoPagamento.PIX,

          cultoIndividualId: registro.cultoIndividualId ?? null,
          celulaId: registro.celulaId ?? null,
          descricao: registro.descricao ?? null,
        })
      );

      const newOferta = await ofertaRepository.createMany(dadosFormatados);

      return reply
        .status(201)
        .send({ message: "Registros criados com sucesso!", data: newOferta });
    } catch (error) {
      console.error(error);
      return reply
        .status(500)
        .send({ error: "Erro ao criar registros de oferta." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreateManyOfertaDTO;

      const newOferta = await ofertaRepository.create({
        userId: body.userId ?? null,
        valor: new Prisma.Decimal(body.valor),
        data_ofertou: parseDateOnlyToLocal(body.data_ofertou),

        evento: body.evento ?? EventoContribuicao.CELULA,
        tipoPagamento: body.tipoPagamento ?? TipoPagamento.PIX,

        cultoIndividualId: body.cultoIndividualId ?? null,
        celulaId: body.celulaId ?? null,
        descricao: body.descricao ?? null,
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
