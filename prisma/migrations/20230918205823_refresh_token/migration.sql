/*
  Warnings:

  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PresencaCulto" DROP CONSTRAINT "PresencaCulto_userId_fkey";

-- DropForeignKey
ALTER TABLE "PresencaEscola" DROP CONSTRAINT "PresencaEscola_userId_fkey";

-- DropForeignKey
ALTER TABLE "PresencaReuniaoCelula" DROP CONSTRAINT "PresencaReuniaoCelula_userId_fkey";

-- DropForeignKey
ALTER TABLE "_EncontrosToUser" DROP CONSTRAINT "_EncontrosToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "_EscolaToUser" DROP CONSTRAINT "_EscolaToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "celula" DROP CONSTRAINT "celula_userId_fkey";

-- DropForeignKey
ALTER TABLE "escola" DROP CONSTRAINT "escola_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "supervisao" DROP CONSTRAINT "supervisao_userId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_cargoDeLiderancaId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_celulaId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_situacaoNoReinoId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_supervisaoId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_turmaEscolaId_fkey";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "account";

-- DropTable
DROP TABLE "user";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "image_url" TEXT,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "cpf" TEXT,
    "date_nascimento" TIMESTAMP(3),
    "sexo" TEXT,
    "telefone" TEXT,
    "escolaridade" TEXT,
    "profissao" TEXT,
    "estado_civil" TEXT,
    "nome_conjuge" TEXT,
    "has_filho" BOOLEAN NOT NULL,
    "quantidade_de_filho" INTEGER,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "bairro" TEXT,
    "endereco" TEXT,
    "numero_casa" TEXT,
    "batizado" BOOLEAN NOT NULL,
    "is_discipulado" BOOLEAN NOT NULL,
    "discipulador" TEXT,
    "celulaId" TEXT,
    "supervisaoId" TEXT,
    "turmaEscolaId" TEXT,
    "situacaoNoReinoId" TEXT,
    "cargoDeLiderancaId" TEXT,
    "userId" TEXT NOT NULL DEFAULT '',
    "password" TEXT,
    "date_casamento" TIMESTAMP(3),
    "date_batizado" TIMESTAMP(3),
    "date_decisao" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_userId_key" ON "users"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_turmaEscolaId_fkey" FOREIGN KEY ("turmaEscolaId") REFERENCES "turma_escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_situacaoNoReinoId_fkey" FOREIGN KEY ("situacaoNoReinoId") REFERENCES "situacao_no_reino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_cargoDeLiderancaId_fkey" FOREIGN KEY ("cargoDeLiderancaId") REFERENCES "cargo_de_lideranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escola" ADD CONSTRAINT "escola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaEscola" ADD CONSTRAINT "PresencaEscola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
