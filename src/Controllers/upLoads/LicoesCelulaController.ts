// import { FastifyReply, FastifyRequest } from 'fastify';
// import { Input, array, date, object, string } from 'valibot';
// import UploadLicoesCelulasService from "../../services/UploadLicoesCelulasService";
// import CelulaRepositorie from "../Repositories/CelulaRepositorie";

import { FastifyReply, FastifyRequest } from "fastify";
import UploadLicoesCelulasService from "../../services/UploadLicoesCelulasService";

// const CelulaDataSchema = object ({
//   nome: string(),
//   lider: string(),
//   supervisao: string(),
//   membros: array(string()),
//   date_que_ocorre: string(),
//   date_inicio: date(),
//   date_multipicar: date(),
//   cep: string(),
//   cidade: string(),
//   estado: string(),
//   bairro: string(),
//   endereco: string(),
//   numero_casa: string(),
// })

// export type CelulaData = Input<typeof CelulaDataSchema>

// interface CelulaParams {
//   id: string;
// }

// Defina uma interface personalizada para estender FastifyRequest
interface CustomFastifyRequest extends FastifyRequest {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
    // Outras propriedades, se aplicável
  };
}

class LicoesCelulaController {
  // Fazendo uso do Fastify
  // async index(request: FastifyRequest, reply: FastifyReply) {
  //   const celulas = await CelulaRepositorie.findAll();
  //   if (!celulas) {
  //     return reply.code(500).send({ error: "Internal Server Error" });
  //   }
  //   return reply.send(celulas);
  // }

  // async show(
  //   request: FastifyRequest<{
  //     Params: CelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const id = request.params.id;
  //   const celula = await CelulaRepositorie.findById(id);
  //   if (!celula) {
  //     return reply.code(404).send({ message: "Celula not found!" });
  //   }
  //   return reply.code(200).send(celula);
  // }

  async store(request: CustomFastifyRequest, reply: FastifyReply) {
    try {
      const file = request.file
      const uploadLicaoCelula = new UploadLicoesCelulasService();
      await uploadLicaoCelula.execute(file)
      return reply.code(201).send('SUCESSO!');
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  // async update(
  //   request: FastifyRequest<{
  //     Params: CelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const id = request.params.id;
  //   const celulaDataForm = request.body as CelulaData;
  //   const celula = await CelulaRepositorie.updateCelula(id, {
  //     ...celulaDataForm,
  //   });
  //   return reply.code(202).send(celula);
  // }

  // async delete(
  //   request: FastifyRequest<{
  //     Params: CelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const id = request.params.id;
  //   await CelulaRepositorie.deleteCelula(id);
  //   return reply.code(204);
  // }
}

export default new LicoesCelulaController();
