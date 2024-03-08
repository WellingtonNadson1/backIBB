// import "../registro.js"

import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import multer from "fastify-multer";
import { requireAuth } from "./Middlewares/authMiddleware";
// import routerAccount from "./Routers/AccountRouters";
import routerCargoslideranca from "./Routers/Cargoslideranca";
import routerCelula from "./Routers/CelulaRouters";
import registerCultoRoutes from "./Routers/Culto";
import routerEncontro from "./Routers/EncontroRouters";
import registerEscolaRoutes from "./Routers/Escola";
import routerLogin from "./Routers/LoginRouter";
import routerPresencaReuniaCelula from "./Routers/PresencaReuniaoCelula";
import routerRelatorioPresencaCulto from "./Routers/Relatorios/RelatorioCultosSupervisao";
import routerReuniaoSemanalCelula from "./Routers/ReuniaoCelula";
import routerSituacaoNoReino from "./Routers/SituacaoNoReino";
import routerSupervisao from "./Routers/SupervisaoRouters";
import routerUser from "./Routers/UserRouters";
import routerLicoesCelula from "./Routers/upLoads/LicoesCelula";
import { createPrismaInstance, disconnectPrisma } from "./services/prisma";
import { PrismaClient } from "@prisma/client";
import routerRegisterDiscipulado from "./Routers/Discipulado";
// import routerLicoesCelula from "./Routers/upLoads/LicoesCelula";

declare module 'fastify' {
  export interface FastifyRequest {
    prisma: PrismaClient;
  }
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 6060;

const app: FastifyInstance = Fastify({ logger: true });

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

app.addHook('onRequest', async (request, reply) => {
  request.prisma = createPrismaInstance();
});

app.addHook('onResponse', async (request, reply) => {
  if (request.prisma) {
    await disconnectPrisma();
  }
});

app.register(multer.contentParser);

app.addHook("onRequest", requireAuth);

const start = async () => {
  try {
    app.register(routerLogin);
    // app.register(routerEvento)
    await registerEscolaRoutes(app);
    await registerCultoRoutes(app);
    app.register(routerRelatorioPresencaCulto);
    app.register(routerReuniaoSemanalCelula);
    app.register(routerRegisterDiscipulado);
    app.register(routerPresencaReuniaCelula);
    app.register(routerLicoesCelula);
    app.register(routerEncontro);
    // app.register(routerAccount);
    app.register(routerSupervisao);
    app.register(routerSituacaoNoReino);
    app.register(routerCargoslideranca);
    app.register(routerCelula);
    app.register(routerUser); // tipo um middleware do express
    await app.listen({
      host: "0.0.0.0",
      port: PORT,
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
