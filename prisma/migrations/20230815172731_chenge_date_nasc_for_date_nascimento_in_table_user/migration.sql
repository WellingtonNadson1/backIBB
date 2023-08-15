/*
  Warnings:

  - You are about to drop the column `Bairro` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "Bairro",
ADD COLUMN     "bairro" TEXT;
