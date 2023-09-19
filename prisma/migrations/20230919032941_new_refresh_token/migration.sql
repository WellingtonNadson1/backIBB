/*
  Warnings:

  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `account` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userIdRefresh` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "userIdRefresh" TEXT NOT NULL;

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "account";

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "userIdRefresh" TEXT NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_userIdRefresh_key" ON "refresh_token"("userIdRefresh");

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userIdRefresh_fkey" FOREIGN KEY ("userIdRefresh") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
