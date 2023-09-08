import { FastifyInstance, FastifyReply } from "fastify";

import multer from "fastify-multer";
import LicoesCelulaController, { CustomFastifyRequest } from "../../Controllers/upLoads/LicoesCelulaController";
import multerConfig from "../../config/multerConfig";

const upload = multer(multerConfig);

const routerLicoesCelula = async (fastify: FastifyInstance) => {
  // LICOES_CELULA
    fastify.post(
    "/licoescelulas",
    { preHandler: upload.single("licao") },
    async (request: CustomFastifyRequest, reply: FastifyReply) => {
      await LicoesCelulaController.store(request, reply);
    }
  );
};


export default routerLicoesCelula;
