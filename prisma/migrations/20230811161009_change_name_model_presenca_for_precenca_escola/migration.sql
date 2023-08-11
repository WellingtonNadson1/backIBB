/*
  Warnings:

  - You are about to drop the `Presenca` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Presenca" DROP CONSTRAINT "Presenca_aulaEscolaId_fkey";

-- DropForeignKey
ALTER TABLE "Presenca" DROP CONSTRAINT "Presenca_userId_fkey";

-- DropTable
DROP TABLE "Presenca";

-- CreateTable
CREATE TABLE "PresencaEscola" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT,
    "aulaEscolaId" TEXT,

    CONSTRAINT "PresencaEscola_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PresencaEscola" ADD CONSTRAINT "PresencaEscola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaEscola" ADD CONSTRAINT "PresencaEscola_aulaEscolaId_fkey" FOREIGN KEY ("aulaEscolaId") REFERENCES "AulaEscola"("id") ON DELETE SET NULL ON UPDATE CASCADE;
