/*
  Warnings:

  - You are about to drop the `evento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `participacao` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "participacao" DROP CONSTRAINT "participacao_eventoId_fkey";

-- DropForeignKey
ALTER TABLE "participacao" DROP CONSTRAINT "participacao_userId_fkey";

-- DropTable
DROP TABLE "evento";

-- DropTable
DROP TABLE "participacao";

-- CreateTable
CREATE TABLE "culto_geral" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culto_geral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culto_semanal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cultoGeralId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culto_semanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culto_individual" (
    "id" TEXT NOT NULL,
    "data_inicio_culto" TIMESTAMP(3) NOT NULL,
    "data_termino_culto" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "cultoSemanalId" TEXT,

    CONSTRAINT "culto_individual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaCulto" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "userId" TEXT,
    "cultoIndividualId" TEXT,

    CONSTRAINT "PresencaCulto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "culto_semanal" ADD CONSTRAINT "culto_semanal_cultoGeralId_fkey" FOREIGN KEY ("cultoGeralId") REFERENCES "culto_geral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culto_individual" ADD CONSTRAINT "culto_individual_cultoSemanalId_fkey" FOREIGN KEY ("cultoSemanalId") REFERENCES "culto_semanal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_cultoIndividualId_fkey" FOREIGN KEY ("cultoIndividualId") REFERENCES "culto_individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;
