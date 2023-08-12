/*
  Warnings:

  - You are about to drop the column `numero` on the `celula` table. All the data in the column will be lost.
  - You are about to drop the column `enderecoId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `endereco` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_enderecoId_fkey";

-- AlterTable
ALTER TABLE "celula" DROP COLUMN "numero",
ADD COLUMN     "Bairro" TEXT,
ADD COLUMN     "numero_casa" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "enderecoId",
ADD COLUMN     "Bairro" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "numero_casa" TEXT;

-- DropTable
DROP TABLE "endereco";
