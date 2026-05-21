import { EventoContribuicao, Prisma, TipoPagamento } from "@prisma/client";
import { FastifyReply, FastifyRequest } from "fastify";
import { OfertaRelatorioRepository } from "../../Repositories/OfertaRelatorioRepository";

const ofertaRepository = new OfertaRelatorioRepository();

type CreateOfertaRelatorioDTO = {
  userId?: string | null;
  valor: string | number;
  data_ofertou: string;
  evento?: EventoContribuicao;
  tipoPagamento?: TipoPagamento;
  cultoIndividualId?: string | null;
  celulaId?: string | null;
  descricao?: string | null;
};

export class OfertaRelatorioController {
  async createMany(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registros = request.body as CreateOfertaRelatorioDTO[];

      if (!Array.isArray(registros) || registros.length === 0) {
        return reply
          .status(400)
          .send({ error: "Nenhum registro foi enviado." });
      }

      // Convertendo os valores para os tipos corretos
      const dadosFormatados: Prisma.OfertaCreateManyInput[] = registros.map(
        (registro) => ({
          userId: registro.userId ?? null,
          valor: new Prisma.Decimal(registro.valor), // ✅ Convertendo para Decimal
          data_ofertou: new Date(registro.data_ofertou), // ✅ Convertendo para Date
          evento: registro.evento ?? EventoContribuicao.CELULA,
          tipoPagamento: registro.tipoPagamento ?? TipoPagamento.PIX,
          cultoIndividualId: registro.cultoIndividualId ?? null,
          celulaId: registro.celulaId ?? null,
          descricao: registro.descricao ?? null,
        }),
      );

      const newOfertas = await ofertaRepository.createMany(dadosFormatados);

      return reply
        .status(201)
        .send({ message: "Registros criados com sucesso!", data: newOfertas });
    } catch (error) {
      return reply
        .status(500)
        .send({ error: "Erro ao criar registros de oferta." });
    }
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreateOfertaRelatorioDTO;
      const data: Prisma.OfertaUncheckedCreateInput = {
        userId: body.userId ?? null,
        valor: new Prisma.Decimal(body.valor),
        data_ofertou: new Date(body.data_ofertou),
        evento: body.evento ?? EventoContribuicao.CELULA,
        tipoPagamento: body.tipoPagamento ?? TipoPagamento.PIX,
        cultoIndividualId: body.cultoIndividualId ?? null,
        celulaId: body.celulaId ?? null,
        descricao: body.descricao ?? null,
      };
      const newOferta = await ofertaRepository.create({
        ...data,
      });
      return reply.status(201).send(newOferta);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao criar oferta." });
    }
  }

  async findAllRelatorioCardsController(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const relatorio = await ofertaRepository.findAllRelatorioCards();
      return reply.send(relatorio);
    } catch (error) {
      console.error("Erro ao buscar relatório de ofertas:", error);
      return reply.status(500).send({ error: "Erro ao listar os ofertas." });
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

      const dizimos = await ofertaRepository.findAll(pageNumber, limitNumber);
      return reply.send(dizimos);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao listar os ofertas." });
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

      const dizimistasSupervisao = await ofertaRepository.findByIdSupervisao(
        idSupervisao,
        dataInicio,
        dataFim
      );
      if (!dizimistasSupervisao)
        return reply.status(404).send({ error: "Ofertantes não encontrados." });
      return reply.send(dizimistasSupervisao);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar o ofertantes." });
    }
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const dizimo = await ofertaRepository.findById(id);
      if (!dizimo)
        return reply.status(404).send({ error: "Oferta não encontrado." });
      return reply.send(dizimo);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao buscar Oferta." });
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
        return reply.status(404).send({ error: "Oferta não encontrado." });
      }

      return reply.send(updatedDizimo);
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao atualizar o Oferta." });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const deletedOferta = await ofertaRepository.delete(id);
      if (!deletedOferta)
        return reply.status(404).send({ error: "Oferta não encontrado." });
      return reply.send({ message: "Oferta deletado com sucesso." });
    } catch (error) {
      return reply.status(500).send({ error: "Erro ao deletar o Oferta." });
    }
  }
}
