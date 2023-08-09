-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "image_url" TEXT,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "cpf" TEXT,
    "dateNasc" TIMESTAMP(3),
    "sexo" TEXT,
    "telefone" TEXT,
    "escolaridade" TEXT,
    "profissao" TEXT,
    "estado_civil" TEXT,
    "nome_conjuge" TEXT,
    "has_filho" BOOLEAN NOT NULL,
    "quantidade_de_filho" INTEGER,
    "batizado" BOOLEAN NOT NULL,
    "is_discipulado" BOOLEAN NOT NULL,
    "discipulador" TEXT,
    "date_casamento" TIMESTAMP(3),
    "date_batizado" TIMESTAMP(3),
    "date_decisao" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "celulaId" TEXT,
    "enderecoId" TEXT,
    "supervisaoId" TEXT,
    "situacaoNoReinoId" TEXT,
    "cargoDeLiderancaId" TEXT,
    "password" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" TEXT NOT NULL,
    "startDatetime" TIMESTAMP(3) NOT NULL,
    "endDatetime" TIMESTAMP(3) NOT NULL,
    "image_url" TEXT,
    "name" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "recorrencia" TEXT,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participacao" (
    "id" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL,
    "eventoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "endereco" (
    "id" TEXT NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "celula" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "endereco" TEXT,
    "numero" TEXT,
    "date_inicio" TIMESTAMP(3),
    "date_que_ocorre" TIMESTAMP(3),
    "date_multipicar" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "supervisaoId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "nivelSupervisaoId" TEXT,

    CONSTRAINT "supervisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nivel_supervisao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "nivel_supervisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_que_ocorre" TIMESTAMP(3),
    "date_inicio" TIMESTAMP(3),
    "date_conclusao" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encontros" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_que_ocorre" TIMESTAMP(3),
    "date_inicio" TIMESTAMP(3),
    "date_conclusao" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encontros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "situcacao_no_reno" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "situcacao_no_reno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cargo_de_lideranca" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cargo_de_lideranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EscolasToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EncontrosToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "_EscolasToUser_AB_unique" ON "_EscolasToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EscolasToUser_B_index" ON "_EscolasToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EncontrosToUser_AB_unique" ON "_EncontrosToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_EncontrosToUser_B_index" ON "_EncontrosToUser"("B");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_situacaoNoReinoId_fkey" FOREIGN KEY ("situacaoNoReinoId") REFERENCES "situcacao_no_reno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_cargoDeLiderancaId_fkey" FOREIGN KEY ("cargoDeLiderancaId") REFERENCES "cargo_de_lideranca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacao" ADD CONSTRAINT "participacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participacao" ADD CONSTRAINT "participacao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_nivelSupervisaoId_fkey" FOREIGN KEY ("nivelSupervisaoId") REFERENCES "nivel_supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolasToUser" ADD CONSTRAINT "_EscolasToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "escolas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolasToUser" ADD CONSTRAINT "_EscolasToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "encontros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
