import { FastifyInstance } from 'fastify';
import multer from 'fastify-multer';
import LicoesCelulaController from '../../Controllers/upLoads/LicoesCelulaController';
import multerConfig from '../../config/multerConfig';

const upload = multer(multerConfig)

const routerLicoesCelula = async (fastify: FastifyInstance) => {
  fastify.register(multer.contentParser)
  // LICOES_CELULA
  // fastify.get("/licoescelulas", LicoesCelulaController.index);
  // fastify.get('/licoescelulas/:id', LicoesCelulaController.show);
  fastify.post("/licoescelulas", { preHandler: upload.single('licao') }, LicoesCelulaController.store);
  // fastify.delete("/licoescelulas/:id", LicoesCelulaController.delete);
  // fastify.put("/licoescelulas/:id", LicoesCelulaController.update);
};

export default routerLicoesCelula;
