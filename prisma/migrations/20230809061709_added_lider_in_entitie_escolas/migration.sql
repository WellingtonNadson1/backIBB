-- DropForeignKey
ALTER TABLE "celula" DROP CONSTRAINT "celula_userId_fkey";

-- AlterTable
ALTER TABLE "escolas" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escolas" ADD CONSTRAINT "escolas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
