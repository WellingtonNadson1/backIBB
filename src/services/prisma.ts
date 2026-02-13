// src/services/prisma.ts
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var pgPool: Pool | undefined;
}

function maskDbUrl(url: string) {
  try {
    const u = new URL(url);
    const user = u.username ? `${u.username}:***@` : "";
    const host = u.host; // host:port
    const db = u.pathname || "";
    return `${u.protocol}//${user}${host}${db}`;
  } catch {
    return "[invalid-url]";
  }
}

function getDatabaseUrl() {
  // ✅ prioridade: DIRECT_URL (Prisma 7 + migrate normalmente usa isso)
  const direct = process.env.DIRECT_URL;
  if (direct) {
    console.log("[DB] Usando DIRECT_URL:", maskDbUrl(direct));
    return direct;
  }

  // fallback: DATABASE_URL (muito comum)
  const db = process.env.DATABASE_URL;
  if (db) {
    console.log("[DB] Usando DATABASE_URL:", maskDbUrl(db));
    return db;
  }

  throw new Error(
    "[Prisma] DIRECT_URL/DATABASE_URL não definido. Verifique .env e variáveis do processo.",
  );
}

const pool =
  global.pgPool ??
  new Pool({
    connectionString: getDatabaseUrl(),
    // Supabase geralmente requer SSL no deploy.
    // No local (NODE_ENV=development) costuma funcionar sem.
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

if (!global.pgPool) {
  global.pgPool = pool;
  console.log("[PG] Pool criado");
}

const createPrismaInstance = () => {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      adapter: new PrismaPg(pool),
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });

    console.log("[Prisma] Client criado (adapter-pg)");
  }

  return global.prisma;
};

/**
 * ⚠️ Só usar no shutdown do servidor.
 * NÃO chame em cada repository.
 */
let disconnecting = false;

const disconnectPrisma = async () => {
  if (disconnecting) return;
  disconnecting = true;

  console.log("[Prisma] Disconnect solicitado");

  try {
    if (global.prisma) {
      await global.prisma.$disconnect();
      global.prisma = undefined;
      console.log("[Prisma] Client desconectado");
    }
  } finally {
    if (global.pgPool) {
      await global.pgPool.end();
      global.pgPool = undefined;
      console.log("[PG] Pool finalizado");
    }
  }
};

export { createPrismaInstance, disconnectPrisma };
