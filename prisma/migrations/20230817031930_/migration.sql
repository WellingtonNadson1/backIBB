/*
  Warnings:

  - The `quantidade_de_filho` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "quantidade_de_filho",
ADD COLUMN     "quantidade_de_filho" INTEGER;
