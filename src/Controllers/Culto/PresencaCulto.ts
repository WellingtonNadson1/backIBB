import dayjs from "dayjs";
import { FastifyReply, FastifyRequest } from "fastify";
import { Input, array, boolean, object, string } from "valibot";
import { PresencaCultoRepositorie } from "../../Repositories/Culto";

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
    })
  ),
});

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
    reply: FastifyReply
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
        cargoLideranca
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
            presenca.membro?.supervisao_pertence?.id === params.supervisaoId
        )
        .map((presenca) => ({
          culto,
          membro: presenca.membro,
        }))
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
    try {
      const presencaCultoDataForm = request.body as PresencaCultoDataNew;
      const { presence_culto, membro } = presencaCultoDataForm;

      const membrosIds = membro.map((m) => m.id);

      // Consulta em lote
      const membrosJaRegistrados =
        await PresencaCultoRepositorie.findPresencasRegistradas(
          presence_culto,
          membrosIds
        );

      // Filtra quem ainda não está registrado
      const membrosParaRegistrar = membro.filter(
        (m) => !membrosJaRegistrados.includes(m.id)
      );

      // Registra em lote quem não estava
      if (membrosParaRegistrar.length > 0) {
        await PresencaCultoRepositorie.createPresencaCultoNew({
          presence_culto,
          membro: membrosParaRegistrar,
        });
      }

      // Monta resultado de todos
      const resultados = membro.map((m) => ({
        membro: m.id,
        status: membrosJaRegistrados.includes(m.id)
          ? "já registrado"
          : "registrado",
      }));

      return reply.code(201).send({
        resultados,
        message: "Processamento concluído.",
      });
    } catch (error: any) {
      console.error(error);
      return reply.code(400).send(error.message || "Erro interno do servidor");
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
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencaCultoDataForm = request.body as PresencaCultoData;
    const presencaCulto = await PresencaCultoRepositorie.updatePresencaCulto(
      id,
      {
        ...presencaCultoDataForm,
      }
    );
    return reply.code(202).send(presencaCulto);
  }

  async delete(
    request: FastifyRequest<{
      Params: PresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await PresencaCultoRepositorie.deletePresencaCulto(id);
    return reply.code(204).send();
  }
}

export default new PresencaCultoController();
