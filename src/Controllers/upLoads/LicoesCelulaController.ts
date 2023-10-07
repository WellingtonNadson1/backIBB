import { FastifyReply, FastifyRequest } from "fastify";
import UploadLicoesCelulasService from "../../services/UploadLicoesCelulasService";
import S3GetStorageLesson from "../../utils/S3GetStorageLesson";

// Defina uma interface personalizada para estender FastifyRequest
export interface CustomFastifyRequest extends FastifyRequest {
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
  async store(request: CustomFastifyRequest, reply: FastifyReply) {
    try {
      const file = request.file;
      const uploadLicaoCelula = new UploadLicoesCelulasService();
      await uploadLicaoCelula.execute(file);
      return reply.code(201).send("SUCESSO!");
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async getLessons(request: FastifyRequest, reply: FastifyReply) {
    try {
      const getLicaoCelula = new S3GetStorageLesson();
      const lessons = await getLicaoCelula.getFile();
      return reply.code(201).send(lessons);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }
}

export default new LicoesCelulaController();
