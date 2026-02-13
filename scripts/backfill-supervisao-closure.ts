import "dotenv/config";

import { createPrismaInstance, disconnectPrisma } from "../src/services/prisma";

async function runBackfill() {
  const prisma = createPrismaInstance();

  console.log("[backfill] Starting Supervisao -> SupervisaoClosure backfill (LOCAL ONLY)");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const totalSupervisoes = await tx.supervisao.count();

      // Legacy safety: if old rows still have NULL tipo, normalize them.
      // With NOT NULL + DEFAULT this will normally affect 0 rows.
      const updatedLegacyTipo = await tx.$executeRaw`
        UPDATE "supervisao"
        SET "tipo" = 'SUPERVISAO_TOPO'::"SupervisaoTipo"
        WHERE "tipo" IS NULL
      `;

      const supervisaoIds = await tx.supervisao.findMany({
        select: { id: true },
      });

      const selfLinksData = supervisaoIds.map(({ id }) => ({
        ancestorId: id,
        descendantId: id,
        depth: 0,
      }));

      const createManyResult =
        selfLinksData.length > 0
          ? await tx.supervisaoClosure.createMany({
              data: selfLinksData,
              skipDuplicates: true,
            })
          : { count: 0 };

      const selfLinkCountRows = await tx.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "supervisao_closure"
        WHERE "depth" = 0 AND "ancestorId" = "descendantId"
      `;

      const selfLinkCount = Number(selfLinkCountRows[0]?.count ?? 0);

      return {
        totalSupervisoes,
        updatedLegacyTipo: Number(updatedLegacyTipo),
        attemptedSelfLinks: selfLinksData.length,
        insertedSelfLinks: createManyResult.count,
        totalSelfLinksDepth0: selfLinkCount,
      };
    });

    console.log(`[backfill] supervisoes found: ${result.totalSupervisoes}`);
    console.log(`[backfill] legacy tipo rows updated: ${result.updatedLegacyTipo}`);
    console.log(`[backfill] closure self-links attempted: ${result.attemptedSelfLinks}`);
    console.log(`[backfill] closure self-links inserted: ${result.insertedSelfLinks}`);
    console.log(
      `[backfill] closure self-links total (depth=0, ancestorId=descendantId): ${result.totalSelfLinksDepth0}`,
    );

    if (result.totalSupervisoes !== result.totalSelfLinksDepth0) {
      console.warn(
        `[backfill] WARNING: expected ${result.totalSupervisoes} self-links, found ${result.totalSelfLinksDepth0}`,
      );
    } else {
      console.log("[backfill] Verification OK: counts match.");
    }
  } catch (error) {
    console.error("[backfill] Failed:", error);
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
  }
}

void runBackfill();
