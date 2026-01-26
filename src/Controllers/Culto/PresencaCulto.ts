import dayjs from "dayjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, boolean, object, string } from "valibot";
import { PresencaCultoRepositorie } from "../../Repositories/Culto";
import { PresencaCultoSpeedSchema } from "./schemas";

type CultoIndividual = {
  startDate: Date;
  endDate: Date;
  superVisionId: string;
  cargoLideranca: string[];
};

const PresencaCultoDataNewSchema = object({
  presence_culto: string(),
  membro: array(
    object({
      id: string(),
      status: boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
    }),
  ),
});

function nowMs() {
  return Number(process.hrtime.bigint() / BigInt(1_000_000));
}

function isPrismaError(e: any) {
  return e && typeof e === "object" && typeof e.code === "string";
}

function safeJson(obj: unknown) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "[unserializable]";
  }
}

export type PresencaCultoDataNew = Input<typeof PresencaCultoDataNewSchema>;

const PresencaCultoDataSchema = object({
  status: boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
  membro: string(),
  presenca_culto: string(),
});

export type PresencaCultoData = Input<typeof PresencaCultoDataSchema>;

interface PresencaCultoParams {
  id: string;
  lider: string;
  culto: string;
}

interface RelatorioCultosParams {
  supervisaoId: string;
  startOfInterval: string;
  endOfInterval: string;
}

class PresencaCultoController {
  // Fazendo uso do Fastify
  findLog(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = PresencaCultoRepositorie.findLog();
    return reply.send(presencasCultos);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = await PresencaCultoRepositorie.findAll();
    if (!presencasCultos) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.send(presencasCultos);
  }

  async show(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply,
  ) {
    const id = request.params.id;
    const presencaCulto = await PresencaCultoRepositorie.findById(id);
    if (!presencaCulto) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencaCulto);
  }

  // Relatorio de presenca nos cultos
  async supervisores(request: FastifyRequest, reply: FastifyReply) {
    const { startDate, endDate, superVisionId, cargoLideranca } =
      request.body as CultoIndividual;

    const resultRelatorioCultos =
      await PresencaCultoRepositorie.cultosRelatoriosSupervisor(
        startDate,
        endDate,
        superVisionId,
        cargoLideranca,
      );

    if (!resultRelatorioCultos) {
      return reply.code(404).send({ message: "Relatorio Cultos Error!" });
    }

    return reply.code(200).send(resultRelatorioCultos);
  }

  // Relatorio de presenca nos cultos
  async cultosRelatorios(request: FastifyRequest, reply: FastifyReply) {
    const params = {
      startOfInterval: dayjs("2023-10-01").toISOString(),
      endOfInterval: dayjs("2023-10-28").toISOString(),
      supervisaoId: "5e392d1b-f425-4865-a730-5191bc0821cd",
    };

    const resultRelatorioCultos =
      await PresencaCultoRepositorie.cultosRelatorios(params);

    if (!resultRelatorioCultos) {
      return reply.code(404).send({ message: "Relatorio Cultos Error!" });
    }

    // Adicione uma assinatura de tipo explícita para cultosAgrupados
    // const cultosAgrupados: { [supervisao: string]: { [celula: string]: any[] } } = {};

    // resultRelatorioCultos.forEach((culto) => {
    //   const supervisao = culto.presencas_culto[0]?.membro?.supervisao_pertence?.nome || 'Sem Supervisão';
    //   const celula = culto.presencas_culto[0]?.membro?.celula?.nome || 'Sem Célula';

    //   if (!cultosAgrupados[supervisao]) {
    //     cultosAgrupados[supervisao] = {};
    //   }

    //   if (!cultosAgrupados[supervisao][celula]) {
    //     cultosAgrupados[supervisao][celula] = [];
    //   }

    //   cultosAgrupados[supervisao][celula].push(culto);
    // });
    const groupedForSupervision = resultRelatorioCultos.flatMap((culto) =>
      culto.presencas_culto
        .filter(
          (presenca) =>
            presenca.membro?.supervisao_pertence?.id === params.supervisaoId,
        )
        .map((presenca) => ({
          culto,
          membro: presenca.membro,
        })),
    );

    console.log(resultRelatorioCultos);

    return reply.code(200).send(resultRelatorioCultos);
  }

  async searchByIdCulto(request: FastifyRequest, reply: FastifyReply) {
    const { culto, lider } = request.params as PresencaCultoParams;
    const presencaCultoIsRegister =
      await PresencaCultoRepositorie.findByIdCulto(culto, lider);
    if (!presencaCultoIsRegister) {
      return reply.code(404).send({ message: "Presença not Register!" });
    }
    return reply.code(200).send(presencaCultoIsRegister);
  }

  async storeRefactored(request: FastifyRequest, reply: FastifyReply) {
    const reqId = (request as any).id ?? "no-request-id";
    const t0 = nowMs();

    // ✅ 2) Validar
    const parsed = PresencaCultoSpeedSchema.safeParse(request.body);
    if (!parsed.success) {
      console.error(
        `[PresencaCultoSpeed][${reqId}] Payload inválido`,
        parsed.error.flatten(),
      );

      return reply.code(400).send({
        message: "Payload inválido",
        issues: parsed.error.flatten(),
      });
    }

    const { presence_culto, membro } = parsed.data;

    // ✅ 3) Deduplicar por id (se o front mandar repetido, não explode e não gera ruído)
    const uniqueById = Array.from(
      new Map(membro.map((m) => [m.id, m])).values(),
    );

    // ✅ 4) Logs iniciais (úteis)
    console.log(`[PresencaCultoSpeed][${reqId}] START`);
    console.log(
      `[PresencaCultoSpeed][${reqId}] presence_culto=${presence_culto}`,
    );
    console.log(
      `[PresencaCultoSpeed][${reqId}] membros (raw=${membro.length} unique=${uniqueById.length}) ids=${safeJson(
        uniqueById.map((m) => m.id),
      )}`,
    );

    try {
      const membrosIds = uniqueById.map((m) => m.id);

      // 5) Consulta em lote (quem já existe)
      const tFind0 = nowMs();
      const membrosJaRegistrados =
        await PresencaCultoRepositorie.findPresencasRegistradas(
          presence_culto,
          membrosIds,
        );
      const tFind1 = nowMs();

      console.log(
        `[PresencaCultoSpeed][${reqId}] findPresencasRegistradas: ${membrosJaRegistrados.length} encontrados em ${
          tFind1 - tFind0
        }ms`,
      );

      // 6) Filtrar quem falta
      const jaSet = new Set(membrosJaRegistrados);
      const membrosParaRegistrar = uniqueById.filter((m) => !jaSet.has(m.id));

      console.log(
        `[PresencaCultoSpeed][${reqId}] membrosParaRegistrar=${membrosParaRegistrar.length} ids=${safeJson(
          membrosParaRegistrar.map((m) => m.id),
        )}`,
      );

      // 7) Registrar em lote
      let createManyCount = 0;
      if (membrosParaRegistrar.length > 0) {
        const tCreate0 = nowMs();
        const res = await PresencaCultoRepositorie.createPresencaCultoNew({
          presence_culto,
          membro: membrosParaRegistrar,
        });
        const tCreate1 = nowMs();

        // seu repo retorna createMany result (com count)
        createManyCount = (res as any)?.count ?? 0;

        console.log(
          `[PresencaCultoSpeed][${reqId}] createMany: count=${createManyCount} em ${tCreate1 - tCreate0}ms (skipDuplicates=true)`,
        );
      } else {
        console.log(
          `[PresencaCultoSpeed][${reqId}] createMany: pulado (todos já registrados)`,
        );
      }

      // 8) Resultado final (opcional: reconsultar para confirmar)
      const tAfter0 = nowMs();
      const registradosDepois =
        await PresencaCultoRepositorie.findPresencasRegistradas(
          presence_culto,
          membrosIds,
        );
      const tAfter1 = nowMs();

      console.log(
        `[PresencaCultoSpeed][${reqId}] confirm registradosDepois=${registradosDepois.length} em ${tAfter1 - tAfter0}ms`,
      );

      // 9) Status por membro (com base no BEFORE; se quiser base no AFTER, eu te ajusto)
      const resultados = uniqueById.map((m) => ({
        membro: m.id,
        status: jaSet.has(m.id) ? "já registrado" : "registrado",
        payload_status: m.status, // ajuda debug (o boolean que veio do front)
      }));

      const t1 = nowMs();
      console.log(`[PresencaCultoSpeed][${reqId}] DONE totalTime=${t1 - t0}ms`);

      return reply.code(201).send({
        cultoIndividualId: presence_culto,
        totalRecebidos: membro.length,
        totalUnicos: uniqueById.length,
        totalJaRegistrados: membrosJaRegistrados.length,
        totalCriados: createManyCount,
        totalRegistradosDepois: registradosDepois.length,
        registrados: registradosDepois,
        resultados,
        message: "Processamento concluído.",
      });
    } catch (error: any) {
      // ✅ Tratamento melhor de erros do Prisma
      if (isPrismaError(error)) {
        // P2002: Unique constraint failed
        if (error.code === "P2002") {
          console.error(
            `[PresencaCultoSpeed][${reqId}] Prisma P2002 (unique)`,
            error,
          );
          return reply.code(409).send({
            message: "Presença já registrada (unique).",
            details: error.meta ?? undefined,
          });
        }

        // P2003: Foreign key constraint failed
        if (error.code === "P2003") {
          console.error(
            `[PresencaCultoSpeed][${reqId}] Prisma P2003 (FK)`,
            error,
          );
          return reply.code(400).send({
            message:
              "IDs inválidos: culto ou membro não existem (violação de chave estrangeira).",
            details: error.meta ?? undefined,
          });
        }
      }

      console.error(`[PresencaCultoSpeed][${reqId}] ERRO`, error);
      return reply.code(500).send({
        message: "Erro interno do servidor",
      });
    }
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const presencaCultoDataForm = request.body as PresencaCultoData;

      const { presenca_culto, membro } = presencaCultoDataForm;
      // Verifique se já existe uma presença registrada para o membro e culto
      const existingPresenca = await PresencaCultoRepositorie.findFirst({
        presenca_culto: presenca_culto,
        membro: membro,
      });

      if (existingPresenca) {
        return reply
          .code(409)
          .send({ message: "Presença de Culto já registrada para hoje!" });
      }

      // Se não existir, crie a presença
      const presencaCulto = await PresencaCultoRepositorie.createPresencaCulto({
        ...presencaCultoDataForm,
      });

      return reply.code(201).send(presencaCulto);
    } catch (error: any) {
      console.error(error); // Log o erro no console para depuração
      return reply.code(400).send(error.message || "Erro interno do servidor");
    }
  }

  async update(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply,
  ) {
    const id = request.params.id;
    const presencaCultoDataForm = request.body as PresencaCultoData;
    const presencaCulto = await PresencaCultoRepositorie.updatePresencaCulto(
      id,
      {
        ...presencaCultoDataForm,
      },
    );
    return reply.code(202).send(presencaCulto);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply,
  ) {
    const id = request.params.id;
    await PresencaCultoRepositorie.deletePresencaCulto(id);
    return reply.code(204).send();
  }
}

export default new PresencaCultoController();
