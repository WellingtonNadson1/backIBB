-- DropForeignKey
ALTER TABLE "PresencaCulto" DROP CONSTRAINT "PresencaCulto_cultoIndividualId_fkey";

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_cultoIndividualId_fkey" FOREIGN KEY ("cultoIndividualId") REFERENCES "culto_individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;
