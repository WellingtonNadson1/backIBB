-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('ios', 'android');

-- CreateEnum
CREATE TYPE "PushEnvironment" AS ENUM ('DEV', 'PROD');

-- CreateEnum
CREATE TYPE "SupervisaoTipo" AS ENUM ('SUPERVISAO_TOPO', 'DISTRITO', 'AREA', 'SETOR');

-- CreateEnum
CREATE TYPE "EventoContribuicao" AS ENUM ('CULTO', 'CELULA', 'CAMPANHA_PROJETO', 'SECRETARIA', 'PRIMICIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('DINHEIRO', 'PIX', 'TRANSFERENCIA', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USERLIDER', 'USERSUPERVISOR', 'USERCENTRAL', 'USERPASTOR', 'MEMBER', 'ADMIN', 'OUTRAIGREJA', 'AFASTADO');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('PASSWORD_RECOVER');

-- CreateEnum
CREATE TYPE "role" AS ENUM ('USERLIDER', 'USERSUPERVISOR', 'USERCENTRAL', 'USERPASTOR', 'MEMBER', 'ADMIN', 'OUTRAIGREJA', 'AFASTADO');

-- CreateTable
CREATE TABLE "AulaEscola" (
    "id" TEXT NOT NULL,
    "data_aula" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "turmaEscolaId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AulaEscola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaCulto" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "cultoIndividualId" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresencaCulto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaEscola" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT,
    "aulaEscolaId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresencaEscola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresencaReuniaoCelula" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL,
    "userId" TEXT NOT NULL,
    "reuniaoCelulaId" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresencaReuniaoCelula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleNew" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "RoleNew_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "celula" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cep" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "endereco" TEXT,
    "date_inicio" TIMESTAMP(3),
    "date_que_ocorre" TEXT,
    "date_multipicar" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "supervisaoId" TEXT NOT NULL,
    "userId" TEXT,
    "numero_casa" TEXT,
    "bairro" TEXT,

    CONSTRAINT "celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culto_geral" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culto_geral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culto_individual" (
    "id" TEXT NOT NULL,
    "data_inicio_culto" TIMESTAMP(3) NOT NULL,
    "data_termino_culto" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "cultoSemanalId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culto_individual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "culto_semanal" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "cultoGeralId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "culto_semanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discipulado" (
    "discipulado_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usuario_id" TEXT NOT NULL,
    "discipulador_id" TEXT NOT NULL,
    "data_ocorreu" DATE NOT NULL,

    CONSTRAINT "discipulado_pkey" PRIMARY KEY ("discipulado_id")
);

-- CreateTable
CREATE TABLE "discipulador_usuario" (
    "usuario_id" TEXT NOT NULL,
    "discipulador_id" TEXT NOT NULL,

    CONSTRAINT "discipulador_usuario_pkey" PRIMARY KEY ("usuario_id","discipulador_id")
);

-- CreateTable
CREATE TABLE "encontros" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encontros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "userId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licao_celula" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "versiculo_chave" TEXT NOT NULL,
    "link_objeto_aws" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_termino" TIMESTAMP(3) NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "temaLicaoCelulaId" TEXT,
    "licao_lancando_redes" BOOLEAN DEFAULT false,

    CONSTRAINT "licao_celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nivel_supervisao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nivel_supervisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "expiresIn" INTEGER NOT NULL,
    "userIdRefresh" TEXT NOT NULL,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reuniao_celula" (
    "id" TEXT NOT NULL,
    "data_reuniao" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "celulaId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "visitantes" INTEGER,
    "almas_ganhas" INTEGER,

    CONSTRAINT "reuniao_celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rolenew" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,

    CONSTRAINT "rolenew_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "situacao_no_reino" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "situacao_no_reino_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "nivelSupervisaoId" TEXT,
    "userId" TEXT,
    "tipo" "SupervisaoTipo" NOT NULL DEFAULT 'SUPERVISAO_TOPO',
    "parentId" TEXT,

    CONSTRAINT "supervisao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisao_closure" (
    "ancestorId" TEXT NOT NULL,
    "descendantId" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,

    CONSTRAINT "supervisao_closure_pkey" PRIMARY KEY ("ancestorId","descendantId")
);

-- CreateTable
CREATE TABLE "dizimo" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(65,30),
    "data_dizimou" TIMESTAMP(3) NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "cultoIndividualId" TEXT,
    "descricao" TEXT,
    "evento" "EventoContribuicao" NOT NULL DEFAULT 'CULTO',
    "tipoPagamento" "TipoPagamento" NOT NULL DEFAULT 'PIX',

    CONSTRAINT "dizimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oferta" (
    "id" TEXT NOT NULL,
    "valor" DECIMAL(65,30),
    "data_ofertou" TIMESTAMP(3) NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "cultoIndividualId" TEXT,
    "descricao" TEXT,
    "celulaId" TEXT,
    "evento" "EventoContribuicao" NOT NULL DEFAULT 'CELULA',
    "tipoPagamento" "TipoPagamento" NOT NULL DEFAULT 'PIX',

    CONSTRAINT "oferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda" (
    "status" BOOLEAN NOT NULL DEFAULT false,
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_termino" TIMESTAMP(3) NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tema_licao_celula" (
    "id" TEXT NOT NULL,
    "tema" TEXT NOT NULL,
    "link_folder_aws" TEXT,
    "data_inicio" TIMESTAMP(3) NOT NULL,
    "data_termino" TIMESTAMP(3) NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "folderName" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "versiculo_chave" TEXT DEFAULT 'versiculo',

    CONSTRAINT "tema_licao_celula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_escola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "date_inicio" TIMESTAMP(3),
    "date_conclusao" TIMESTAMP(3),
    "userId" TEXT,
    "escolaId" TEXT,
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turma_escola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "image_url" TEXT,
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "cpf" TEXT,
    "date_nascimento" TIMESTAMP(3),
    "sexo" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "escolaridade" TEXT,
    "profissao" TEXT,
    "estado_civil" TEXT NOT NULL,
    "nome_conjuge" TEXT,
    "has_filho" BOOLEAN,
    "batizado" BOOLEAN,
    "is_discipulado" BOOLEAN,
    "discipuladorId" TEXT,
    "date_casamento" TIMESTAMP(3),
    "date_batizado" TIMESTAMP(3),
    "date_decisao" TIMESTAMP(3),
    "date_create" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_update" TIMESTAMP(3) NOT NULL,
    "password" TEXT,
    "turmaEscolaId" TEXT,
    "cep" TEXT,
    "cidade" TEXT,
    "endereco" TEXT,
    "estado" TEXT,
    "numero_casa" TEXT,
    "bairro" TEXT,
    "cargoDeLiderancaId" TEXT NOT NULL,
    "celulaId" TEXT,
    "situacaoNoReinoId" TEXT NOT NULL,
    "supervisaoId" TEXT NOT NULL,
    "quantidade_de_filho" INTEGER,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "userIdRefresh" TEXT,
    "role_id" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "refresh_token_mobile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_mobile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_token" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "environment" "PushEnvironment" NOT NULL DEFAULT 'PROD',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appVersion" TEXT,
    "osVersion" TEXT,
    "locale" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EncontrosToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EncontrosToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EscolaToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EscolaToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "PresencaCulto_culto_user_unique" ON "PresencaCulto"("cultoIndividualId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "PresencaReuniaoCelula_reuniao_user_unique" ON "PresencaReuniaoCelula"("reuniaoCelulaId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_userIdRefresh_key" ON "refresh_token"("userIdRefresh");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "supervisao_parentId_idx" ON "supervisao"("parentId");

-- CreateIndex
CREATE INDEX "supervisao_tipo_idx" ON "supervisao"("tipo");

-- CreateIndex
CREATE INDEX "supervisao_userId_idx" ON "supervisao"("userId");

-- CreateIndex
CREATE INDEX "supervisao_closure_descendantId_idx" ON "supervisao_closure"("descendantId");

-- CreateIndex
CREATE INDEX "supervisao_closure_ancestorId_depth_idx" ON "supervisao_closure"("ancestorId", "depth");

-- CreateIndex
CREATE INDEX "supervisao_closure_descendantId_depth_idx" ON "supervisao_closure"("descendantId", "depth");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "refresh_token_mobile_userId_idx" ON "refresh_token_mobile"("userId");

-- CreateIndex
CREATE INDEX "refresh_token_mobile_deviceId_idx" ON "refresh_token_mobile"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_mobile_userId_deviceId_key" ON "refresh_token_mobile"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "push_token_expoPushToken_idx" ON "push_token"("expoPushToken");

-- CreateIndex
CREATE INDEX "push_token_deviceId_idx" ON "push_token"("deviceId");

-- CreateIndex
CREATE INDEX "push_token_userId_enabled_idx" ON "push_token"("userId", "enabled");

-- CreateIndex
CREATE INDEX "push_token_lastSeenAt_idx" ON "push_token"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "push_token_userId_deviceId_key" ON "push_token"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "_EncontrosToUser_B_index" ON "_EncontrosToUser"("B");

-- CreateIndex
CREATE INDEX "_EscolaToUser_B_index" ON "_EscolaToUser"("B");

-- AddForeignKey
ALTER TABLE "AulaEscola" ADD CONSTRAINT "AulaEscola_turmaEscolaId_fkey" FOREIGN KEY ("turmaEscolaId") REFERENCES "turma_escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_cultoIndividualId_fkey" FOREIGN KEY ("cultoIndividualId") REFERENCES "culto_individual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaCulto" ADD CONSTRAINT "PresencaCulto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PresencaEscola" ADD CONSTRAINT "PresencaEscola_aulaEscolaId_fkey" FOREIGN KEY ("aulaEscolaId") REFERENCES "AulaEscola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaEscola" ADD CONSTRAINT "PresencaEscola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_reuniaoCelulaId_fkey" FOREIGN KEY ("reuniaoCelulaId") REFERENCES "reuniao_celula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresencaReuniaoCelula" ADD CONSTRAINT "PresencaReuniaoCelula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "celula" ADD CONSTRAINT "celula_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culto_individual" ADD CONSTRAINT "culto_individual_cultoSemanalId_fkey" FOREIGN KEY ("cultoSemanalId") REFERENCES "culto_semanal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "culto_semanal" ADD CONSTRAINT "culto_semanal_cultoGeralId_fkey" FOREIGN KEY ("cultoGeralId") REFERENCES "culto_geral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discipulado" ADD CONSTRAINT "discipulado_usuario_id_discipulador_id_fkey" FOREIGN KEY ("usuario_id", "discipulador_id") REFERENCES "discipulador_usuario"("usuario_id", "discipulador_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipulador_usuario" ADD CONSTRAINT "discipulador_usuario_discipulador_id_fkey" FOREIGN KEY ("discipulador_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discipulador_usuario" ADD CONSTRAINT "discipulador_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "escola" ADD CONSTRAINT "escola_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licao_celula" ADD CONSTRAINT "licao_celula_temaLicaoCelulaId_fkey" FOREIGN KEY ("temaLicaoCelulaId") REFERENCES "tema_licao_celula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_userIdRefresh_fkey" FOREIGN KEY ("userIdRefresh") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reuniao_celula" ADD CONSTRAINT "reuniao_celula_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_nivelSupervisaoId_fkey" FOREIGN KEY ("nivelSupervisaoId") REFERENCES "nivel_supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao" ADD CONSTRAINT "supervisao_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "supervisao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao_closure" ADD CONSTRAINT "supervisao_closure_ancestorId_fkey" FOREIGN KEY ("ancestorId") REFERENCES "supervisao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisao_closure" ADD CONSTRAINT "supervisao_closure_descendantId_fkey" FOREIGN KEY ("descendantId") REFERENCES "supervisao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dizimo" ADD CONSTRAINT "dizimo_cultoIndividualId_fkey" FOREIGN KEY ("cultoIndividualId") REFERENCES "culto_individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dizimo" ADD CONSTRAINT "dizimo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_cultoIndividualId_fkey" FOREIGN KEY ("cultoIndividualId") REFERENCES "culto_individual"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta" ADD CONSTRAINT "oferta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_escola" ADD CONSTRAINT "turma_escola_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_cargoDeLiderancaId_fkey" FOREIGN KEY ("cargoDeLiderancaId") REFERENCES "cargo_de_lideranca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_celulaId_fkey" FOREIGN KEY ("celulaId") REFERENCES "celula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_discipuladorid_fkey" FOREIGN KEY ("discipuladorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_situacaoNoReinoId_fkey" FOREIGN KEY ("situacaoNoReinoId") REFERENCES "situacao_no_reino"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_supervisaoId_fkey" FOREIGN KEY ("supervisaoId") REFERENCES "supervisao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_turmaEscolaId_fkey" FOREIGN KEY ("turmaEscolaId") REFERENCES "turma_escola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "rolenew"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_token_mobile" ADD CONSTRAINT "refresh_token_mobile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_token" ADD CONSTRAINT "push_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "encontros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EncontrosToUser" ADD CONSTRAINT "_EncontrosToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "escola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EscolaToUser" ADD CONSTRAINT "_EscolaToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
