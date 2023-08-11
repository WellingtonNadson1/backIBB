import cors from "@fastify/cors";
import Fastify, { FastifyInstance } from "fastify";
import { requireAuth } from "./Middlewares/authMiddleware";
import routerAccount from "./Routers/AccountRouters";
import routerCelula from "./Routers/CelulaRouters";
import routerEncontro from "./Routers/EncontroRouters";
import registerEscolaRoutes from "./Routers/Escola";
import routerEvento from "./Routers/Evento";
import routerLogin from "./Routers/LoginRouter";
import routerParticipacao from "./Routers/Participacao";
import routerSupervisao from "./Routers/SupervisaoRouters";
import routerUser from "./Routers/UserRouters";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3333;

const app: FastifyInstance = Fastify({logger: true});

app.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
})

app.addHook("onRequest", requireAuth)

const start = async () => {
  try {
    app.register(routerLogin)
    app.register(routerEvento)
    await registerEscolaRoutes(app)
    app.register(routerEncontro)
    app.register(routerParticipacao)
    app.register(routerAccount)
    app.register(routerSupervisao)
    app.register(routerCelula)
    app.register(routerUser) // tipo um middleware do express
    await app.listen({
      host: '0.0.0.0',
      port: PORT })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}
start()
