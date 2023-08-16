/*
  Warnings:

  - You are about to drop the column `membros` on the `cargo_de_lideranca` table. All the data in the column will be lost.
  - You are about to drop the column `lider` on the `celula` table. All the data in the column will be lost.
  - You are about to drop the column `membros` on the `celula` table. All the data in the column will be lost.
  - You are about to drop the column `supervisao` on the `celula` table. All the data in the column will be lost.
  - You are about to drop the column `participantes` on the `encontros` table. All the data in the column will be lost.
  - You are about to drop the column `alunos` on the `escola` table. All the data in the column will be lost.
  - You are about to drop the column `lider` on the `escola` table. All the data in the column will be lost.
  - You are about to drop the column `supervisao` on the `nivel_supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `membros` on the `situacao_no_reino` table. All the data in the column will be lost.
  - You are about to drop the column `celulas` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `membros` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `nivelSupervisao` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `supervisor` on the `supervisao` table. All the data in the column will be lost.
  - You are about to drop the column `cargo_de_lideranca` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `celula` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `celula_lidera` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `encontros` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `escola_lidera` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `escolas` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `situacao_no_reino` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `supervisao_pertence` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `supervisoes_lidera` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cargo_de_lideranca" DROP COLUMN "membros";

-- AlterTable
ALTER TABLE "celula" DROP COLUMN "lider",
DROP COLUMN "membros",
DROP COLUMN "supervisao";

-- AlterTable
ALTER TABLE "encontros" DROP COLUMN "participantes";

-- AlterTable
ALTER TABLE "escola" DROP COLUMN "alunos",
DROP COLUMN "lider";

-- AlterTable
ALTER TABLE "nivel_supervisao" DROP COLUMN "supervisao";

-- AlterTable
ALTER TABLE "situacao_no_reino" DROP COLUMN "membros";

-- AlterTable
ALTER TABLE "supervisao" DROP COLUMN "celulas",
DROP COLUMN "membros",
DROP COLUMN "nivelSupervisao",
DROP COLUMN "supervisor",
ADD COLUMN     "nivelSupervisaoId" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "cargo_de_lideranca",
DROP COLUMN "celula",
DROP COLUMN "celula_lidera",
DROP COLUMN "encontros",
DROP COLUMN "escola_lidera",
DROP COLUMN "escolas",
DROP COLUMN "situacao_no_reino",
DROP COLUMN "supervisao_pertence",
DROP COLUMN "supervisoes_lidera",
ADD COLUMN     "cargoDeLiderancaId" TEXT,
ADD COLUMN     "celulaId" TEXT,
ADD COLUMN     "situacaoNoReinoId" TEXT,
ADD COLUMN     "supervisaoId" TEXT;

-- CreateTable
CREATE TABLE "_EscolaToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EncontrosToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_EscolaToUser_AB_unique" ON "_EscolaToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EscolaToUser_B_index" ON "_EscolaToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EncontrosToUser_AB_unique" ON "_EncontrosToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EncontrosToUser_B_index" ON "_EncontrosToUser"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_situacaoNoReinoId_fkey" FOREIGN KEY ("situacaoNoReinoId") REFERENCES "situacao_no_reino"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_cargoDeLiderancaId_fkey" FOREIGN KEY ("cargoDeLiderancaId") REFERENCES "cargo_de_lideranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_nivelSupervisaoId_fkey" FOREIGN KEY ("nivelSupervisaoId") REFERENCES "nivel_supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escola" ADD CONSTRAINT "escola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "encontros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
