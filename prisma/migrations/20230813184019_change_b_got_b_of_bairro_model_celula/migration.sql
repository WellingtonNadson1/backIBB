/*
  Warnings:

  - You are about to drop the column `Bairro` on the `celula` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "celula" DROP COLUMN "Bairro",
ADD COLUMN     "bairro" TEXT;
