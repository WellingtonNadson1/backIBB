import { FastifyInstance } from "fastify";
import multer from "fastify-multer";
import LicoesCelulaController from "../../Controllers/upLoads/LicoesCelulaController";
import multerConfig from "../../config/multerConfig";

const upload = multer(multerConfig);

const routerLicoesCelula = async (fastify: FastifyInstance) => {
  // LICOES_CELULA
  fastify.post(
    "/licoescelulas",
    { preHandler: upload.single("licao") },
    LicoesCelulaController.store
  );
};

export default routerLicoesCelula;
