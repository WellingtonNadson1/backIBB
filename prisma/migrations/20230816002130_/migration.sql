/*
  Warnings:

  - You are about to drop the column `nivelSupervisaoId` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `cargoDeLiderancaId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `celulaId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `situacaoNoReinoId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `supervisaoId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_EncontrosToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EscolaToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_EncontrosToUser" DROP CONSTRAINT "_EncontrosToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EncontrosToUser" DROP CONSTRAINT "_EncontrosToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "_EscolaToUser" DROP CONSTRAINT "_EscolaToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_EscolaToUser" DROP CONSTRAINT "_EscolaToUser_B_fkey";

-- DropForeignKey
ALTER TABLE "celula" DROP CONSTRAINT "celula_supervisaoId_fkey";

-- DropForeignKey
ALTER TABLE "celula" DROP CONSTRAINT "celula_userId_fkey";

-- DropForeignKey
ALTER TABLE "escola" DROP CONSTRAINT "escola_userId_fkey";

-- DropForeignKey
ALTER TABLE "supervisao" DROP CONSTRAINT "supervisao_nivelSupervisaoId_fkey";

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

-- AlterTable
ALTER TABLE "cargo_de_lideranca" ADD COLUMN     "membros" TEXT[];

-- AlterTable
ALTER TABLE "celula" ADD COLUMN     "lider" TEXT,
ADD COLUMN     "membros" TEXT[],
ADD COLUMN     "supervisao" TEXT;

-- AlterTable
ALTER TABLE "encontros" ADD COLUMN     "participantes" TEXT[];

-- AlterTable
ALTER TABLE "escola" ADD COLUMN     "alunos" TEXT[],
ADD COLUMN     "lider" TEXT;

-- AlterTable
ALTER TABLE "nivel_supervisao" ADD COLUMN     "supervisao" TEXT[];

-- AlterTable
ALTER TABLE "situacao_no_reino" ADD COLUMN     "membros" TEXT[];

-- AlterTable
ALTER TABLE "supervisao" DROP COLUMN "nivelSupervisaoId",
DROP COLUMN "userId",
ADD COLUMN     "celulas" TEXT[],
ADD COLUMN     "membros" TEXT[],
ADD COLUMN     "nivelSupervisao" TEXT,
ADD COLUMN     "supervisor" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "cargoDeLiderancaId",
DROP COLUMN "celulaId",
DROP COLUMN "situacaoNoReinoId",
DROP COLUMN "supervisaoId",
ADD COLUMN     "cargo_de_lideranca" TEXT,
ADD COLUMN     "celula" TEXT,
ADD COLUMN     "celula_lidera" TEXT[],
ADD COLUMN     "encontros" TEXT[],
ADD COLUMN     "escola_lidera" TEXT[],
ADD COLUMN     "escolas" TEXT[],
ADD COLUMN     "situacao_no_reino" TEXT,
ADD COLUMN     "supervisao_pertence" TEXT,
ADD COLUMN     "supervisoes_lidera" TEXT[];

-- DropTable
DROP TABLE "_EncontrosToUser";

-- DropTable
DROP TABLE "_EscolaToUser";
