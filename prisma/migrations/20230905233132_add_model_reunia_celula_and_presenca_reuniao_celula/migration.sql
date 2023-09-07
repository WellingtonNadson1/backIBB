-- CreateTable
CREATE TABLE "reuniao_celula" (
    "id" TEXT NOT NULL,
    "data_reuniao" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "celulaId" TEXT,

    CONSTRAINT "reuniao_celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaReuniaoCelula" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "userId" TEXT,
    "reuniaoCelulaId" TEXT,

    CONSTRAINT "PresencaReuniaoCelula_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reuniao_celula" ADD CONSTRAINT "reuniao_celula_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_reuniaoCelulaId_fkey" FOREIGN KEY ("reuniaoCelulaId") REFERENCES "reuniao_celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
