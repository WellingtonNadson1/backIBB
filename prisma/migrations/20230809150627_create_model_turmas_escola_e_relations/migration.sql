/*
  Warnings:

  - You are about to drop the column `date_conclusao` on the `encontros` table. All the data in the column will be lost.
  - You are about to drop the column `date_inicio` on the `encontros` table. All the data in the column will be lost.
  - You are about to drop the column `date_que_ocorre` on the `encontros` table. All the data in the column will be lost.
  - You are about to drop the `_EscolasToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `escolas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `situcacao_no_reno` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EscolasToUser" DROP CONSTRAINT "_EscolasToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EscolasToUser" DROP CONSTRAINT "_EscolasToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "escolas" DROP CONSTRAINT "escolas_userId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_situacaoNoReinoId_fkey";

-- AlterTable
ALTER TABLE "encontros" DROP COLUMN "date_conclusao",
DROP COLUMN "date_inicio",
DROP COLUMN "date_que_ocorre";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "turmaEscolaId" TEXT;

-- DropTable
DROP TABLE "_EscolasToUser";

-- DropTable
DROP TABLE "escolas";

-- DropTable
DROP TABLE "situcacao_no_reno";

-- CreateTable
CREATE TABLE "escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "userId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_aulas_marcadas" TIMESTAMP(3)[],
    "date_inicio" TIMESTAMP(3),
    "date_conclusao" TIMESTAMP(3),
    "userId" TEXT,
    "escolaId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AulaEscola" (
    "id" TEXT NOT NULL,
    "data_aula" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "turmaEscolaId" TEXT,

    CONSTRAINT "AulaEscola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presenca" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT,
    "aulaEscolaId" TEXT,

    CONSTRAINT "Presenca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situacao_no_reino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "situacao_no_reino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EscolaToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EscolaToUser_AB_unique" ON "_EscolaToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EscolaToUser_B_index" ON "_EscolaToUser"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_turmaEscolaId_fkey" FOREIGN KEY ("turmaEscolaId") REFERENCES "turma_escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_situacaoNoReinoId_fkey" FOREIGN KEY ("situacaoNoReinoId") REFERENCES "situacao_no_reino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escola" ADD CONSTRAINT "escola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_escola" ADD CONSTRAINT "turma_escola_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AulaEscola" ADD CONSTRAINT "AulaEscola_turmaEscolaId_fkey" FOREIGN KEY ("turmaEscolaId") REFERENCES "turma_escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Presenca" ADD CONSTRAINT "Presenca_aulaEscolaId_fkey" FOREIGN KEY ("aulaEscolaId") REFERENCES "AulaEscola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
