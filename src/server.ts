// import "../registro.js"

import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import multer from "fastify-multer";
import { requireAuth } from "./Middlewares/authMiddleware";
// import routerAccount from "./Routers/AccountRouters";
import { PrismaClient } from "@prisma/client";
import routerAgenda from "./Routers/Agenda";
import routerCargoslideranca from "./Routers/Cargoslideranca";
import routerCelula from "./Routers/CelulaRouters";
import registerCultoRoutes from "./Routers/Culto";
import routerRegisterDiscipulado from "./Routers/DiscipuladosIBB";
import routerEncontro from "./Routers/EncontroRouters";
import registerEscolaRoutes from "./Routers/Escola";
import routerLogin from "./Routers/LoginRouter";
import routerPresencaReuniaCelula from "./Routers/PresencaReuniaoCelula";
import routerRelatorioPresencaCulto from "./Routers/Relatorios/RelatorioCultosSupervisao";
import routerRelatorioPresencaCelula from "./Routers/Relatorios/RelatorioPresencaCelulaSupervisao";
import routerReuniaoSemanalCelula from "./Routers/ReuniaoCelula";
import routerSituacaoNoReino from "./Routers/SituacaoNoReino";
import routerSupervisao from "./Routers/SupervisaoRouters";
import routerUser from "./Routers/UserRouters";
import { dizimoRelatorioRoutes } from "./Routers/dizimoRelatorioRoutes";
import { dizimoRoutes } from "./Routers/dizimoRoutes";
import routerLicoesCelula from "./Routers/upLoads/LicoesCelula";
import { requestResetPassword } from "./auth/request-reset-password";
import { ResetPassword } from "./auth/reset-password";
import { createPrismaInstance, disconnectPrisma } from "./services/prisma";
import { ofertaRoutes } from "./Routers/ofertaRoutes";
import { ofertaRelatorioRoutes } from "./Routers/ofertaRelatorioRoutes";
import { liderDashboardRoutes } from "./Routers/liderDashboardRoutes";
import { supervisorDashboardRoutes } from "./Routers/supervisorDashboardRoutes";
import { liderMembrosRoutes } from "./Routers/liderMembrosRoutes";
import { centralDashboardRoutes } from "./Routers/centralDashboardRoutes";
import { cultoRoutes } from "./Routers/cultoRoutes";
// import routerLicoesCelula from "./Routers/upLoads/LicoesCelula";

declare module "fastify" {
  export interface FastifyRequest {
    prisma: PrismaClient;
  }
}

const PORT = process.env.PORT ? Number(process.env.PORT) : 8888;

const app: FastifyInstance = Fastify({ logger: true });

app.register(cors, {
  origin: ["http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
});

app.addHook("onRequest", requireAuth);

app.addHook("onRequest", async (request, reply) => {
  request.prisma = createPrismaInstance();
});

app.addHook("onResponse", async (request, reply) => {
  if (request.prisma) {
    await disconnectPrisma();
  }
});

const start = async () => {
  try {
    await app.register(multer.contentParser);
    await app.register(supervisorDashboardRoutes);
    await app.register(centralDashboardRoutes);
    await app.register(liderDashboardRoutes);
    await app.register(liderMembrosRoutes);
    await app.register(routerLogin);
    await app.register(dizimoRoutes);
    await app.register(dizimoRelatorioRoutes);
    await app.register(ofertaRoutes);
    await app.register(ofertaRelatorioRoutes);
    // await app.register(routerEvento)
    await registerEscolaRoutes(app);
    await registerCultoRoutes(app);
    app.register(cultoRoutes);
    await app.register(routerRelatorioPresencaCulto);
    await app.register(routerReuniaoSemanalCelula);
    await app.register(routerPresencaReuniaCelula);
    await app.register(routerLicoesCelula);
    await app.register(routerEncontro);
    // await app.register(routerAccount);
    await app.register(routerSupervisao);
    await app.register(routerSituacaoNoReino);
    await app.register(routerCargoslideranca);
    await app.register(routerCelula);
    await app.register(routerUser); // tipo um middleware do express
    await app.register(routerRegisterDiscipulado);
    await app.register(routerRelatorioPresencaCelula);
    await app.register(requestResetPassword);
    await app.register(ResetPassword);
    await app.register(routerAgenda);
    // console.log('server', app.register(routerRegisterDiscipulado))

    await app.listen({
      port: PORT,
      host: "0.0.0.0",
    });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
