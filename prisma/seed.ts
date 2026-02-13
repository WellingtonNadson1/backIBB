import {
  PrismaClient,
  SupervisaoTipo,
  Role,
  TipoPagamento,
  EventoContribuicao,
  PushPlatform,
  PushEnvironment,
  TokenType,
} from "@prisma/client";
import { randomUUID } from "crypto";

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL não definido no ambiente.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function atHour(baseDate: Date, hour: number, minute = 0): Date {
  const date = new Date(baseDate);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function asUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function toDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

async function resetDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "PresencaCulto",
      "PresencaReuniaoCelula",
      "PresencaEscola",
      "discipulado",
      "discipulador_usuario",
      "dizimo",
      "oferta",
      "tokens",
      "session",
      "refresh_token",
      "refresh_token_mobile",
      "push_token",
      "user_roles",
      "AulaEscola",
      "reuniao_celula",
      "culto_individual",
      "culto_semanal",
      "culto_geral",
      "licao_celula",
      "tema_licao_celula",
      "turma_escola",
      "escola",
      "agenda",
      "encontros",
      "celula",
      "supervisao_closure",
      "user",
      "supervisao",
      "nivel_supervisao",
      "situacao_no_reino",
      "cargo_de_lideranca",
      "rolenew",
      "RoleNew"
    RESTART IDENTITY CASCADE;
  `);
}

type UserRoleName =
  | "ADMIN"
  | "USERCENTRAL"
  | "USERSUPERVISOR"
  | "USERLIDER"
  | "USERPASTOR"
  | "MEMBER"
  | "AFASTADO"
  | "OUTRAIGREJA";

async function main() {
  await resetDatabase();

  // 1) Catálogos de roles (model antigo e model vigente)
  const legacyRoleNames: UserRoleName[] = [
    "ADMIN",
    "USERCENTRAL",
    "USERSUPERVISOR",
    "USERLIDER",
    "USERPASTOR",
    "MEMBER",
    "AFASTADO",
    "OUTRAIGREJA",
  ];

  await prisma.roleNew.createMany({
    data: legacyRoleNames.map((name) => ({ id: randomUUID(), name })),
    skipDuplicates: true,
  });

  await prisma.rolenew.createMany({
    data: legacyRoleNames.map((name) => ({ id: randomUUID(), name })),
    skipDuplicates: true,
  });

  const rolenewRows = await prisma.rolenew.findMany();
  const roleIdByName = new Map<string, string>();
  for (const role of rolenewRows) {
    if (role.name) roleIdByName.set(role.name, role.id);
  }

  // 2) Dimensões de domínio
  const [cargoPastor, cargoSupervisor, cargoLider, cargoMembro] =
    await Promise.all([
      prisma.cargoDeLideranca.create({ data: { nome: "Pastor" } }),
      prisma.cargoDeLideranca.create({ data: { nome: "Supervisor" } }),
      prisma.cargoDeLideranca.create({ data: { nome: "Líder" } }),
      prisma.cargoDeLideranca.create({ data: { nome: "Membro" } }),
    ]);

  const [situacaoAtivo, situacaoAfastado] = await Promise.all([
    prisma.situacaoNoReino.create({ data: { nome: "Ativo" } }),
    prisma.situacaoNoReino.create({ data: { nome: "Afastado" } }),
  ]);

  const [nivelTopo, nivelDistrito, nivelArea, nivelSetor] = await Promise.all([
    prisma.nivelSupervisao.create({
      data: {
        nome: "Topo",
        descricao: "Nível máximo da hierarquia de supervisão",
      },
    }),
    prisma.nivelSupervisao.create({
      data: {
        nome: "Distrito",
        descricao: "Nível de distrito",
      },
    }),
    prisma.nivelSupervisao.create({
      data: {
        nome: "Área",
        descricao: "Nível de área",
      },
    }),
    prisma.nivelSupervisao.create({
      data: {
        nome: "Setor",
        descricao: "Nível operacional para alocação de células",
      },
    }),
  ]);

  // 3) Hierarquia de supervisão
  const supervisaoTopo = await prisma.supervisao.create({
    data: {
      nome: "SUPERVISÃO TOPO SÃO LUÍS",
      cor: "#1E3A8A",
      tipo: SupervisaoTipo.SUPERVISAO_TOPO,
      nivelSupervisaoId: nivelTopo.id,
    },
  });

  const distritoNorte = await prisma.supervisao.create({
    data: {
      nome: "DISTRITO NORTE",
      cor: "#4F46E5",
      tipo: SupervisaoTipo.DISTRITO,
      nivelSupervisaoId: nivelDistrito.id,
      parentId: supervisaoTopo.id,
    },
  });

  const distritoLeste = await prisma.supervisao.create({
    data: {
      nome: "DISTRITO LESTE",
      cor: "#7C3AED",
      tipo: SupervisaoTipo.DISTRITO,
      nivelSupervisaoId: nivelDistrito.id,
      parentId: supervisaoTopo.id,
    },
  });

  const areaNorteA = await prisma.supervisao.create({
    data: {
      nome: "ÁREA NORTE A",
      cor: "#0EA5E9",
      tipo: SupervisaoTipo.AREA,
      nivelSupervisaoId: nivelArea.id,
      parentId: distritoNorte.id,
    },
  });

  const areaLesteA = await prisma.supervisao.create({
    data: {
      nome: "ÁREA LESTE A",
      cor: "#14B8A6",
      tipo: SupervisaoTipo.AREA,
      nivelSupervisaoId: nivelArea.id,
      parentId: distritoLeste.id,
    },
  });

  const setor01 = await prisma.supervisao.create({
    data: {
      nome: "SETOR 01",
      cor: "#F59E0B",
      tipo: SupervisaoTipo.SETOR,
      nivelSupervisaoId: nivelSetor.id,
      parentId: areaNorteA.id,
    },
  });

  const setor02 = await prisma.supervisao.create({
    data: {
      nome: "SETOR 02",
      cor: "#EF4444",
      tipo: SupervisaoTipo.SETOR,
      nivelSupervisaoId: nivelSetor.id,
      parentId: areaLesteA.id,
    },
  });

  const hierarchyByDescendant = new Map<string, string[]>();
  hierarchyByDescendant.set(supervisaoTopo.id, [supervisaoTopo.id]);
  hierarchyByDescendant.set(distritoNorte.id, [supervisaoTopo.id, distritoNorte.id]);
  hierarchyByDescendant.set(distritoLeste.id, [supervisaoTopo.id, distritoLeste.id]);
  hierarchyByDescendant.set(areaNorteA.id, [supervisaoTopo.id, distritoNorte.id, areaNorteA.id]);
  hierarchyByDescendant.set(areaLesteA.id, [supervisaoTopo.id, distritoLeste.id, areaLesteA.id]);
  hierarchyByDescendant.set(setor01.id, [
    supervisaoTopo.id,
    distritoNorte.id,
    areaNorteA.id,
    setor01.id,
  ]);
  hierarchyByDescendant.set(setor02.id, [
    supervisaoTopo.id,
    distritoLeste.id,
    areaLesteA.id,
    setor02.id,
  ]);

  const closureRows: Array<{ ancestorId: string; descendantId: string; depth: number }> = [];
  for (const [descendantId, ancestors] of hierarchyByDescendant.entries()) {
    ancestors.forEach((ancestorId, depthIndex) => {
      closureRows.push({
        ancestorId,
        descendantId,
        depth: ancestors.length - depthIndex - 1,
      });
    });
  }

  await prisma.supervisaoClosure.createMany({
    data: closureRows,
    skipDuplicates: true,
  });

  // 4) Usuários e papéis
  const passwordHash = await bcrypt.hash("dev1234567", 10);

  const commonUserFields = {
    sexo: "M",
    telefone: "98999990000",
    estado_civil: "SOLTEIRO",
    situacaoNoReinoId: situacaoAtivo.id,
    password: passwordHash,
  };

  const admin = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "admin@app.dev",
      first_name: "Admin",
      last_name: "Local",
      role: Role.ADMIN,
      supervisaoId: supervisaoTopo.id,
      cargoDeLiderancaId: cargoMembro.id,
    },
  });

  const central = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "central@app.dev",
      first_name: "Central",
      last_name: "Local",
      role: Role.USERCENTRAL,
      supervisaoId: supervisaoTopo.id,
      cargoDeLiderancaId: cargoMembro.id,
    },
  });

  const pastor = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "pastor@app.dev",
      first_name: "Pastor",
      last_name: "Local",
      role: Role.USERPASTOR,
      supervisaoId: supervisaoTopo.id,
      cargoDeLiderancaId: cargoPastor.id,
    },
  });

  const supervisorNorte = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "supervisor.norte@app.dev",
      first_name: "Supervisor",
      last_name: "Norte",
      role: Role.USERSUPERVISOR,
      supervisaoId: distritoNorte.id,
      cargoDeLiderancaId: cargoSupervisor.id,
    },
  });

  const supervisorLeste = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "supervisor.leste@app.dev",
      first_name: "Supervisor",
      last_name: "Leste",
      role: Role.USERSUPERVISOR,
      supervisaoId: distritoLeste.id,
      cargoDeLiderancaId: cargoSupervisor.id,
    },
  });

  const liderSetor01 = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "lider@app.dev",
      first_name: "Líder",
      last_name: "Setor01",
      role: Role.USERLIDER,
      supervisaoId: setor01.id,
      cargoDeLiderancaId: cargoLider.id,
    },
  });

  const liderSetor02 = await prisma.user.create({
    data: {
      ...commonUserFields,
      email: "lider2@app.dev",
      first_name: "Líder",
      last_name: "Setor02",
      role: Role.USERLIDER,
      supervisaoId: setor02.id,
      cargoDeLiderancaId: cargoLider.id,
    },
  });

  const membroRowsSetor01 = await Promise.all(
    Array.from({ length: 10 }).map((_, index) =>
      prisma.user.create({
        data: {
          ...commonUserFields,
          email: `membro.s01.${index + 1}@app.dev`,
          first_name: `MembroS01_${index + 1}`,
          last_name: "Local",
          role: index === 9 ? Role.AFASTADO : Role.MEMBER,
          supervisaoId: setor01.id,
          cargoDeLiderancaId: cargoMembro.id,
          situacaoNoReinoId:
            index === 9 ? situacaoAfastado.id : situacaoAtivo.id,
          discipuladorId: liderSetor01.id,
        },
      }),
    ),
  );

  const membroRowsSetor02 = await Promise.all(
    Array.from({ length: 8 }).map((_, index) =>
      prisma.user.create({
        data: {
          ...commonUserFields,
          email: `membro.s02.${index + 1}@app.dev`,
          first_name: `MembroS02_${index + 1}`,
          last_name: "Local",
          role: index === 7 ? Role.OUTRAIGREJA : Role.MEMBER,
          supervisaoId: setor02.id,
          cargoDeLiderancaId: cargoMembro.id,
          discipuladorId: liderSetor02.id,
        },
      }),
    ),
  );

  // Atualiza responsáveis na árvore de supervisão
  await prisma.supervisao.update({
    where: { id: distritoNorte.id },
    data: { userId: supervisorNorte.id },
  });
  await prisma.supervisao.update({
    where: { id: distritoLeste.id },
    data: { userId: supervisorLeste.id },
  });
  await prisma.supervisao.update({
    where: { id: areaNorteA.id },
    data: { userId: supervisorNorte.id },
  });
  await prisma.supervisao.update({
    where: { id: areaLesteA.id },
    data: { userId: supervisorLeste.id },
  });
  await prisma.supervisao.update({
    where: { id: setor01.id },
    data: { userId: liderSetor01.id },
  });
  await prisma.supervisao.update({
    where: { id: setor02.id },
    data: { userId: liderSetor02.id },
  });

  // 5) Células + membros
  const celulaBetel = await prisma.celula.create({
    data: {
      nome: "Betel",
      supervisaoId: setor01.id,
      userId: liderSetor01.id,
      cidade: "Paço do Lumiar",
      estado: "MA",
      bairro: "Maiobão",
      endereco: "Avenida 13",
      numero_casa: "101",
      date_que_ocorre: "QUARTA",
      date_inicio: daysFromNow(-180),
      membros: {
        connect: membroRowsSetor01.slice(0, 8).map((user) => ({ id: user.id })),
      },
    },
  });

  const celulaManancial = await prisma.celula.create({
    data: {
      nome: "Manancial",
      supervisaoId: setor02.id,
      userId: liderSetor02.id,
      cidade: "São Luís",
      estado: "MA",
      bairro: "Cohama",
      endereco: "Rua das Palmeiras",
      numero_casa: "45",
      date_que_ocorre: "SEXTA",
      date_inicio: daysFromNow(-120),
      membros: {
        connect: membroRowsSetor02.slice(0, 6).map((user) => ({ id: user.id })),
      },
    },
  });

  // Líder também é membro da própria célula (cenário de produção esperado)
  await prisma.user.update({
    where: { id: liderSetor01.id },
    data: { celulaId: celulaBetel.id },
  });
  await prisma.user.update({
    where: { id: liderSetor02.id },
    data: { celulaId: celulaManancial.id },
  });

  // 6) Reuniões de célula + presença
  const reunioesBetel = await Promise.all(
    [0, -7, -14].map((offset) =>
      prisma.reuniaoCelula.create({
        data: {
          celulaId: celulaBetel.id,
          status: "REALIZADA",
          data_reuniao: atHour(daysFromNow(offset), 20, 0),
          visitantes: offset === 0 ? 3 : 1,
          almas_ganhas: offset === 0 ? 1 : 0,
        },
      }),
    ),
  );

  const reunioesManancial = await Promise.all(
    [0, -7].map((offset) =>
      prisma.reuniaoCelula.create({
        data: {
          celulaId: celulaManancial.id,
          status: "REALIZADA",
          data_reuniao: atHour(daysFromNow(offset), 20, 30),
          visitantes: 2,
          almas_ganhas: 0,
        },
      }),
    ),
  );

  const membrosBetel = [liderSetor01, ...membroRowsSetor01.slice(0, 8)];
  const membrosManancial = [liderSetor02, ...membroRowsSetor02.slice(0, 6)];

  for (const [meetingIndex, reuniao] of reunioesBetel.entries()) {
    await prisma.presencaReuniaoCelula.createMany({
      data: membrosBetel.map((member, memberIndex) => ({
        reuniaoCelulaId: reuniao.id,
        userId: member.id,
        status: (memberIndex + meetingIndex) % 4 !== 0,
      })),
      skipDuplicates: true,
    });
  }

  for (const [meetingIndex, reuniao] of reunioesManancial.entries()) {
    await prisma.presencaReuniaoCelula.createMany({
      data: membrosManancial.map((member, memberIndex) => ({
        reuniaoCelulaId: reuniao.id,
        userId: member.id,
        status: (memberIndex + meetingIndex) % 3 !== 0,
      })),
      skipDuplicates: true,
    });
  }

  // 7) Cultos + presença + contribuições
  const cultoCelebracao = await prisma.cultoGeral.create({
    data: {
      nome: "Culto de Celebração",
      descricao: "Culto principal de domingo",
    },
  });

  const cultoJovens = await prisma.cultoGeral.create({
    data: {
      nome: "Culto de Jovens",
      descricao: "Culto de sábado",
    },
  });

  const domingoNoite = await prisma.cultoSemanal.create({
    data: {
      nome: "Domingo Noite",
      descricao: "Domingo 19h",
      cultoGeralId: cultoCelebracao.id,
    },
  });

  const sabadoJovem = await prisma.cultoSemanal.create({
    data: {
      nome: "Sábado Jovem",
      descricao: "Sábado 19h30",
      cultoGeralId: cultoJovens.id,
    },
  });

  const cultoIndividualRows = await Promise.all([
    prisma.cultoIndividual.create({
      data: {
        cultoSemanalId: domingoNoite.id,
        status: "REALIZADO",
        data_inicio_culto: atHour(daysFromNow(-14), 19, 0),
        data_termino_culto: atHour(daysFromNow(-14), 21, 0),
      },
    }),
    prisma.cultoIndividual.create({
      data: {
        cultoSemanalId: domingoNoite.id,
        status: "REALIZADO",
        data_inicio_culto: atHour(daysFromNow(-7), 19, 0),
        data_termino_culto: atHour(daysFromNow(-7), 21, 0),
      },
    }),
    prisma.cultoIndividual.create({
      data: {
        cultoSemanalId: domingoNoite.id,
        status: "REALIZADO",
        data_inicio_culto: atHour(daysFromNow(0), 19, 0),
        data_termino_culto: atHour(daysFromNow(0), 21, 0),
      },
    }),
    prisma.cultoIndividual.create({
      data: {
        cultoSemanalId: sabadoJovem.id,
        status: "REALIZADO",
        data_inicio_culto: atHour(daysFromNow(-1), 19, 30),
        data_termino_culto: atHour(daysFromNow(-1), 21, 30),
      },
    }),
  ]);

  const pessoasCulto = [
    pastor,
    supervisorNorte,
    supervisorLeste,
    liderSetor01,
    liderSetor02,
    ...membroRowsSetor01.slice(0, 6),
    ...membroRowsSetor02.slice(0, 4),
  ];

  for (const [cultoIndex, culto] of cultoIndividualRows.entries()) {
    await prisma.presencaCulto.createMany({
      data: pessoasCulto.map((person, personIndex) => ({
        cultoIndividualId: culto.id,
        userId: person.id,
        status: (personIndex + cultoIndex) % 5 !== 0,
      })),
      skipDuplicates: true,
    });
  }

  const ultimoCulto = cultoIndividualRows[2];

  await prisma.dizimo.createMany({
    data: [
      {
        userId: liderSetor01.id,
        cultoIndividualId: ultimoCulto.id,
        data_dizimou: atHour(daysFromNow(0), 20, 0),
        valor: 80,
        descricao: "Dízimo mensal",
        evento: EventoContribuicao.CULTO,
        tipoPagamento: TipoPagamento.PIX,
      },
      {
        userId: membroRowsSetor01[0].id,
        cultoIndividualId: ultimoCulto.id,
        data_dizimou: atHour(daysFromNow(0), 20, 5),
        valor: 45,
        descricao: "Dízimo seed",
        evento: EventoContribuicao.CULTO,
        tipoPagamento: TipoPagamento.DINHEIRO,
      },
      {
        userId: pastor.id,
        data_dizimou: atHour(daysFromNow(-2), 10, 0),
        valor: 120,
        descricao: "Contribuição em secretaria",
        evento: EventoContribuicao.SECRETARIA,
        tipoPagamento: TipoPagamento.TRANSFERENCIA,
      },
    ],
  });

  await prisma.oferta.createMany({
    data: [
      {
        userId: liderSetor01.id,
        cultoIndividualId: ultimoCulto.id,
        data_ofertou: atHour(daysFromNow(0), 20, 10),
        valor: 25,
        descricao: "Oferta de culto",
        evento: EventoContribuicao.CULTO,
        tipoPagamento: TipoPagamento.PIX,
      },
      {
        userId: membroRowsSetor02[0].id,
        celulaId: celulaManancial.id,
        data_ofertou: atHour(daysFromNow(-3), 20, 50),
        valor: 15,
        descricao: "Oferta na célula",
        evento: EventoContribuicao.CELULA,
        tipoPagamento: TipoPagamento.PIX,
      },
      {
        userId: central.id,
        data_ofertou: atHour(daysFromNow(-10), 8, 30),
        valor: 200,
        descricao: "Oferta para campanha",
        evento: EventoContribuicao.CAMPANHA_PROJETO,
        tipoPagamento: TipoPagamento.BOLETO,
      },
    ],
  });

  // 8) Escola + turma + aulas + presença
  const escolaBiblica = await prisma.escola.create({
    data: {
      nome: "Escola Bíblica Local",
      descricao: "Turmas para formação de líderes",
      userId: liderSetor01.id,
      alunos: {
        connect: [
          ...membroRowsSetor01.slice(0, 6).map((user) => ({ id: user.id })),
          ...membroRowsSetor02.slice(0, 4).map((user) => ({ id: user.id })),
        ],
      },
    },
  });

  const turmaFundamentos = await prisma.turmaEscola.create({
    data: {
      nome: "Fundamentos 2026/1",
      descricao: "Fundamentos da fé cristã",
      date_inicio: daysFromNow(-45),
      date_conclusao: daysFromNow(45),
      escolaId: escolaBiblica.id,
      userId: liderSetor01.id,
      alunos: {
        connect: [
          ...membroRowsSetor01.slice(0, 6).map((user) => ({ id: user.id })),
          ...membroRowsSetor02.slice(0, 2).map((user) => ({ id: user.id })),
        ],
      },
    },
  });

  const aulasTurma = await Promise.all(
    [0, -7, -14, -21].map((offset, index) =>
      prisma.aulaEscola.create({
        data: {
          turmaEscolaId: turmaFundamentos.id,
          data_aula: atHour(daysFromNow(offset), 9, 0),
          status: index === 0 ? "ABERTA" : "FINALIZADA",
        },
      }),
    ),
  );

  const alunosTurma = [...membroRowsSetor01.slice(0, 6), ...membroRowsSetor02.slice(0, 2)];

  for (const [aulaIndex, aula] of aulasTurma.entries()) {
    await prisma.presencaEscola.createMany({
      data: alunosTurma.map((student, studentIndex) => ({
        aulaEscolaId: aula.id,
        userId: student.id,
        status: (studentIndex + aulaIndex) % 6 === 0 ? "FALTOU" : "PRESENTE",
      })),
    });
  }

  // 9) Tema/Lição de célula
  const temaComunhao = await prisma.temaLicaoCelula.create({
    data: {
      tema: "Comunhão e Serviço",
      link_folder_aws: "s3://seed/tema-comunhao",
      folderName: "tema-comunhao",
      data_inicio: daysFromNow(-30),
      data_termino: daysFromNow(30),
      status: true,
      versiculo_chave: "Atos 2:42",
    },
  });

  await prisma.licaoCelula.createMany({
    data: [
      {
        titulo: "Vida no Corpo",
        versiculo_chave: "Romanos 12:5",
        data_inicio: daysFromNow(-14),
        data_termino: daysFromNow(-8),
        temaLicaoCelulaId: temaComunhao.id,
        licao_lancando_redes: false,
      },
      {
        titulo: "Discipulado Intencional",
        versiculo_chave: "Mateus 28:19",
        data_inicio: daysFromNow(-7),
        data_termino: daysFromNow(0),
        temaLicaoCelulaId: temaComunhao.id,
        licao_lancando_redes: true,
      },
    ],
  });

  // 10) Agenda
  await prisma.agenda.createMany({
    data: [
      {
        status: true,
        title: "Treinamento de Líderes",
        description: "Capacitação mensal dos líderes de célula",
        data_inicio: atHour(daysFromNow(5), 19, 30),
        data_termino: atHour(daysFromNow(5), 21, 30),
      },
      {
        status: false,
        title: "Conferência de Supervisão",
        description: "Reunião trimestral de supervisão",
        data_inicio: atHour(daysFromNow(20), 8, 0),
        data_termino: atHour(daysFromNow(20), 12, 0),
      },
      {
        status: true,
        title: "Vigília de Oração",
        description: "Evento de oração para toda a igreja",
        data_inicio: atHour(daysFromNow(12), 22, 0),
        data_termino: atHour(daysFromNow(13), 2, 0),
      },
    ],
  });

  // 11) Encontros
  const encontroCasais = await prisma.encontros.create({
    data: {
      nome: "Encontro de Casais",
      descricao: "Edição local de fevereiro",
      participantes: {
        connect: [
          { id: pastor.id },
          { id: liderSetor01.id },
          { id: liderSetor02.id },
          { id: membroRowsSetor01[0].id },
          { id: membroRowsSetor02[0].id },
        ],
      },
    },
  });

  const encontroJovens = await prisma.encontros.create({
    data: {
      nome: "Encontro de Jovens",
      descricao: "Edição local de março",
      participantes: {
        connect: [
          { id: supervisorNorte.id },
          { id: supervisorLeste.id },
          { id: membroRowsSetor01[1].id },
          { id: membroRowsSetor01[2].id },
          { id: membroRowsSetor02[1].id },
        ],
      },
    },
  });

  // 12) Discipulado (pivot + registros)
  await prisma.discipulador_usuario.createMany({
    data: [
      {
        usuario_id: membroRowsSetor01[0].id,
        discipulador_id: liderSetor01.id,
      },
      {
        usuario_id: membroRowsSetor01[1].id,
        discipulador_id: liderSetor01.id,
      },
      {
        usuario_id: membroRowsSetor02[0].id,
        discipulador_id: liderSetor02.id,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.discipulado.createMany({
    data: [
      {
        usuario_id: membroRowsSetor01[0].id,
        discipulador_id: liderSetor01.id,
        data_ocorreu: toDateOnly(daysFromNow(-21)),
      },
      {
        usuario_id: membroRowsSetor01[0].id,
        discipulador_id: liderSetor01.id,
        data_ocorreu: toDateOnly(daysFromNow(-7)),
      },
      {
        usuario_id: membroRowsSetor01[1].id,
        discipulador_id: liderSetor01.id,
        data_ocorreu: toDateOnly(daysFromNow(-14)),
      },
      {
        usuario_id: membroRowsSetor02[0].id,
        discipulador_id: liderSetor02.id,
        data_ocorreu: toDateOnly(daysFromNow(-10)),
      },
    ],
  });

  // 13) user_roles
  async function attachRole(userId: string, roleName: UserRoleName) {
    const roleId = roleIdByName.get(roleName);
    if (!roleId) return;

    await prisma.user_roles.upsert({
      where: { user_id_role_id: { user_id: userId, role_id: roleId } },
      update: {},
      create: { user_id: userId, role_id: roleId },
    });
  }

  await attachRole(admin.id, "ADMIN");
  await attachRole(central.id, "USERCENTRAL");
  await attachRole(pastor.id, "USERPASTOR");
  await attachRole(supervisorNorte.id, "USERSUPERVISOR");
  await attachRole(supervisorLeste.id, "USERSUPERVISOR");
  await attachRole(liderSetor01.id, "USERLIDER");
  await attachRole(liderSetor02.id, "USERLIDER");

  for (const member of [...membroRowsSetor01, ...membroRowsSetor02]) {
    if (member.role === Role.AFASTADO) {
      await attachRole(member.id, "AFASTADO");
      continue;
    }

    if (member.role === Role.OUTRAIGREJA) {
      await attachRole(member.id, "OUTRAIGREJA");
      continue;
    }

    await attachRole(member.id, "MEMBER");
  }

  // 14) Token/session/refresh/mobile/push
  await prisma.token.createMany({
    data: [
      {
        userId: admin.id,
        type: TokenType.PASSWORD_RECOVER,
      },
      {
        userId: liderSetor01.id,
        type: TokenType.PASSWORD_RECOVER,
      },
    ],
  });

  await prisma.session.createMany({
    data: [
      {
        userId: admin.id,
        sessionToken: `sess-${randomUUID()}`,
        expires: daysFromNow(7),
      },
      {
        userId: liderSetor01.id,
        sessionToken: `sess-${randomUUID()}`,
        expires: daysFromNow(7),
      },
      {
        userId: supervisorNorte.id,
        sessionToken: `sess-${randomUUID()}`,
        expires: daysFromNow(7),
      },
    ],
  });

  await prisma.refreshToken.createMany({
    data: [
      {
        userIdRefresh: admin.id,
        expiresIn: asUnixSeconds(daysFromNow(30)),
      },
      {
        userIdRefresh: liderSetor01.id,
        expiresIn: asUnixSeconds(daysFromNow(30)),
      },
      {
        userIdRefresh: supervisorNorte.id,
        expiresIn: asUnixSeconds(daysFromNow(30)),
      },
    ],
  });

  await prisma.refreshTokenMobile.createMany({
    data: [
      {
        userId: liderSetor01.id,
        deviceId: "ios-lider-01",
        tokenHash: `hash-${randomUUID()}`,
        expiresAt: daysFromNow(30),
        revoked: false,
      },
      {
        userId: supervisorNorte.id,
        deviceId: "android-supervisor-01",
        tokenHash: `hash-${randomUUID()}`,
        expiresAt: daysFromNow(30),
        revoked: false,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.pushToken.createMany({
    data: [
      {
        userId: liderSetor01.id,
        deviceId: "ios-lider-01",
        expoPushToken: "ExponentPushToken[SEED_LEADER_01]",
        platform: PushPlatform.ios,
        environment: PushEnvironment.DEV,
        enabled: true,
        appVersion: "1.0.0-seed",
        osVersion: "17",
        locale: "pt-BR",
        timezone: "America/Fortaleza",
      },
      {
        userId: supervisorNorte.id,
        deviceId: "android-supervisor-01",
        expoPushToken: "ExponentPushToken[SEED_SUPERVISOR_01]",
        platform: PushPlatform.android,
        environment: PushEnvironment.DEV,
        enabled: true,
        appVersion: "1.0.0-seed",
        osVersion: "14",
        locale: "pt-BR",
        timezone: "America/Fortaleza",
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completo finalizado (todos os models cobertos).");
  console.log("Logins locais de referência (senha: dev1234567):");
  console.log("- admin@app.dev");
  console.log("- central@app.dev");
  console.log("- pastor@app.dev");
  console.log("- supervisor.norte@app.dev");
  console.log("- supervisor.leste@app.dev");
  console.log("- lider@app.dev");
  console.log("- lider2@app.dev");
  console.log("Outros: membro.s01.1@app.dev ... membro.s02.8@app.dev");
  console.log(`Encontros criados: ${encontroCasais.nome}, ${encontroJovens.nome}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
