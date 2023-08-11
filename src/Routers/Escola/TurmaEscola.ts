import { FastifyInstance } from 'fastify';
import { TurmaEscolaController } from '../../Controllers/Escola';

const routerTurmaEscola = async (fastify: FastifyInstance) => {
  // TURMA ESCOLA
  fastify.get("/turmaescolas", TurmaEscolaController.index);
  fastify.get('/turmaescolas/:id', TurmaEscolaController.show);
  fastify.post("/turmaescolas", TurmaEscolaController.store);
  fastify.delete("/turmaescolas/:id", TurmaEscolaController.delete);
  fastify.put("/turmaescolas/:id", TurmaEscolaController.update);

};

export default routerTurmaEscola;
