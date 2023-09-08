-- DropForeignKey
ALTER TABLE "PresencaReuniaoCelula" DROP CONSTRAINT "PresencaReuniaoCelula_reuniaoCelulaId_fkey";

-- DropForeignKey
ALTER TABLE "reuniao_celula" DROP CONSTRAINT "reuniao_celula_celulaId_fkey";

-- AddForeignKey
ALTER TABLE "reuniao_celula" ADD CONSTRAINT "reuniao_celula_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_reuniaoCelulaId_fkey" FOREIGN KEY ("reuniaoCelulaId") REFERENCES "reuniao_celula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
