// src/Routers/MobileAuth.ts (NOVO)
import { FastifyInstance } from "fastify";
import { mobileLoginHandler } from "../../api/mobile/auth/login";
import { refreshTokenHandler } from "../../api/mobile/auth/refresh";
import { logoutHandler } from "../../api/mobile/auth/logout";
import { meHandler } from "../../api/mobile/me";

// src/Routers/MobileAuth.ts
export default async function mobileAuthRoutes(app: FastifyInstance) {
  app.post("/mobile/auth/login", {
    config: {
      rateLimit: {
        max: 5, // 5 tentativas
        timeWindow: "15 minutes",
      },
    },
    handler: mobileLoginHandler,
  });

  app.post("/mobile/auth/refresh", {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: "1 hour",
      },
    },
    handler: refreshTokenHandler,
  });

  app.post("/mobile/auth/logout", logoutHandler);
  app.get("/mobile/me", meHandler);
}
