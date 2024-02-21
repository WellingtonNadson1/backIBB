import { FastifyReply, FastifyRequest } from "fastify";
import RegisterDiscipuladoRepositorie from "../../Repositories/Discipulado";
import dayjs from "dayjs";
import { CultoIndividual, PresencaCultoData, PresencaCultoParams, dataSchemaCreateDiscipulado, dataSchemaCreateDiscipuladoCell } from "./schema";

class RegisterDiscipuladoController {
  // Fazendo uso do Fastify
  findLog(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = RegisterDiscipuladoRepositorie.findLog();
    return reply.send(presencasCultos);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const presencasCultos = await RegisterDiscipuladoRepositorie.findAll();
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
    const presencaCulto = await RegisterDiscipuladoRepositorie.findById(id);
    if (!presencaCulto) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencaCulto);
  }

  // Relatorio de presenca nos cultos
  async supervisores(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { startDate, endDate, superVisionId, cargoLideranca } = request.body as CultoIndividual


    const resultRelatorioCultos = await RegisterDiscipuladoRepositorie.cultosRelatoriosSupervisor(
      startDate, endDate, superVisionId, cargoLideranca
    );

    if (!resultRelatorioCultos) {
      return reply.code(404).send({ message: "Relatorio Cultos Error!" });
    }

    return reply.code(200).send(resultRelatorioCultos);

  }

  // Relatorio de presenca nos cultos
  async cultosRelatorios(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const params = {
      startOfInterval: dayjs('2023-10-01').toISOString(),
      endOfInterval: dayjs('2023-10-28').toISOString(),
      supervisaoId: '5e392d1b-f425-4865-a730-5191bc0821cd'
    };

    const resultRelatorioCultos = await RegisterDiscipuladoRepositorie.cultosRelatorios(params);

    if (!resultRelatorioCultos) {
      return reply.code(404).send({ message: "Relatorio Cultos Error!" });
    }

    const groupedForSupervision = resultRelatorioCultos
      .flatMap(culto =>
        culto.presencas_culto
          .filter(presenca => presenca.membro?.supervisao_pertence?.id === params.supervisaoId)
          .map(presenca => ({
            culto,
            membro: presenca.membro
          }))
      );

    console.log(resultRelatorioCultos);

    return reply.code(200).send(resultRelatorioCultos);

  }

  async searchByIdCulto(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { culto, lider } = request.params as PresencaCultoParams;
    console.log('culto: ', culto)

    const presencaCultoIsRegister =
      await RegisterDiscipuladoRepositorie.findByIdCulto(culto, lider);
    if (!presencaCultoIsRegister) {
      return reply.code(404).send({ message: "Presença not Register!" });
    }
    return reply.code(200).send(presencaCultoIsRegister);
  }

  async isMembersCellRegister(request: FastifyRequest, reply: FastifyReply) {
    // console.log('request', request.body)
    try {
      const registerDiscipuladoDataCellForm = request.body as dataSchemaCreateDiscipuladoCell;

      const { cell_id, data_ocorreu } = registerDiscipuladoDataCellForm;
      const dataOcorreu = new Date(data_ocorreu)
      const firstDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth(), 1);
      const lastDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth() + 1, 0);

      // Verifique se já existe discipulados registrados para o membro
      const existingTwoRegister = await RegisterDiscipuladoRepositorie.findAllMembersCellForPeriod({
        cell_id, firstDayOfMonth, lastDayOfMonth
      });
      // console.log('existingTwoRegister', existingTwoRegister)

      return reply.code(200).send(existingTwoRegister);
    } catch (error: any) {
      console.error(error); // Log o erro no console para depuração
      return reply.code(400).send(error.message || 'Erro interno do servidor');
    }
  }

  async isregister(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registerDiscipuladoDataForm = request.body as dataSchemaCreateDiscipulado;

      const { usuario_id, discipulador_id, data_ocorreu } = registerDiscipuladoDataForm;
      const dataOcorreu = new Date(data_ocorreu)
      const firstDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth(), 1);
      const lastDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth() + 1, 0);

      // Verifique se já existe discipulados registrados para o membro
      const existingTwoRegister = await RegisterDiscipuladoRepositorie.findAllForPeriod({
        usuario_id, discipulador_id, firstDayOfMonth, lastDayOfMonth
      });

      return reply.code(200).send(existingTwoRegister);
    } catch (error: any) {
      console.error(error); // Log o erro no console para depuração
      return reply.code(400).send(error.message || 'Erro interno do servidor');
    }
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const registerDiscipuladoDataForm = request.body as dataSchemaCreateDiscipulado;

      const { usuario_id, discipulador_id, data_ocorreu } = registerDiscipuladoDataForm;
      const dataOcorreu = new Date(data_ocorreu)
      const firstDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth(), 1);
      const lastDayOfMonth = new Date(dataOcorreu.getFullYear(), dataOcorreu.getMonth() + 1, 0);

      // Verifique se já existe discipulados registrados para o membro
      const existingTwoRegister = await RegisterDiscipuladoRepositorie.findAllForPeriod({
        usuario_id, discipulador_id, firstDayOfMonth, lastDayOfMonth
      });
      console.log('firstDayOfMonth', firstDayOfMonth)
      console.log('lastDayOfMonth', lastDayOfMonth)
      console.log('existingTwoRegister', existingTwoRegister)

      if (existingTwoRegister.quantidadeDiscipuladoRealizado >= 2) {
        return reply
          .code(409)
          .send({ message: "Já exitem os dois discipulados do mês cadastrados!" });
      }



      // Se não, crie o registro
      const registerDiscipulado = await RegisterDiscipuladoRepositorie.createRegisterDiscipulado({
        usuario_id, discipulador_id, data_ocorreu,
      });

      return reply.code(201).send(registerDiscipulado);
    } catch (error: any) {
      console.error(error); // Log o erro no console para depuração
      return reply.code(400).send(error.message || 'Erro interno do servidor');
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
    const presencaCulto = await RegisterDiscipuladoRepositorie.updatePresencaCulto(
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
    await RegisterDiscipuladoRepositorie.deletePresencaCulto(id);
    return reply.code(204).send();
  }
}

export default new RegisterDiscipuladoController();
