// Repository
import { PrismaClient } from "@prisma/client";

type Args = {
  prisma: PrismaClient;
  liderId: string;
  membroId: string;
  inicio: Date;
  fim: Date;
  mesRef: string; // YYYY-MM
};

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function pct(presentes: number, total: number) {
  if (!total) return 0;
  return clampPercent(Math.round((presentes / total) * 100));
}

export class LiderMembroRepository {
  /**
   * Regra de acesso (simples e segura):
   * - USERLIDER só vê membros da mesma célula
   * - papéis acima podem ver (ajuste conforme sua regra real)
   */
  private async assertPodeVerMembro(
    prisma: PrismaClient,
    liderId: string,
    membroId: string
  ) {
    const lider = await prisma.user.findUnique({
      where: { id: liderId },
      select: { id: true, role: true, celulaId: true },
    });
    if (!lider) throw new Error("Forbidden");

    const isPrivilegiado =
      lider.role === "ADMIN" ||
      lider.role === "USERPASTOR" ||
      lider.role === "USERCENTRAL" ||
      lider.role === "USERSUPERVISOR";

    if (isPrivilegiado) return;

    const membro = await prisma.user.findUnique({
      where: { id: membroId },
      select: { id: true, celulaId: true },
    });

    if (!membro) return; // 404 tratado depois
    if (!lider.celulaId || lider.celulaId !== membro.celulaId) {
      throw new Error("Forbidden");
    }
  }

  async getDetalheMembro(args: Args) {
    const { prisma, liderId, membroId, inicio, fim, mesRef } = args;

    await this.assertPodeVerMembro(prisma, liderId, membroId);

    // =========================
    // 1) PERFIL
    // =========================
    const perfil = await prisma.user.findUnique({
      where: { id: membroId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        telefone: true,
        email: true,
        image_url: true,
        role: true,

        celulaId: true,
        celula: { select: { id: true, nome: true } },

        supervisao_pertence: { select: { id: true, nome: true } },
        situacao_no_reino: { select: { id: true, nome: true } },
        cargo_de_lideranca: { select: { id: true, nome: true } },

        is_discipulado: true,
        discipuladorId: true,
        user: { select: { id: true, first_name: true, last_name: true } }, // discipuladorId -> User
      },
    });

    if (!perfil) return null;

    // =========================
    // 2) CULTOS DO MÊS + PRESENÇA
    // =========================
    const cultosMes = await prisma.cultoIndividual.findMany({
      where: {
        data_inicio_culto: { gte: inicio, lte: fim },
      },
      select: {
        id: true,
        data_inicio_culto: true,
        data_termino_culto: true,
        status: true,
        culto_semana: {
          select: {
            nome: true,
            cultoGeral: { select: { nome: true } },
          },
        },
      },
      orderBy: { data_inicio_culto: "asc" },
    });

    const presencasCulto = await prisma.presencaCulto.findMany({
      where: {
        userId: membroId,
        presenca_culto: {
          data_inicio_culto: { gte: inicio, lte: fim },
        },
      },
      select: {
        cultoIndividualId: true,
        status: true,
      },
    });

    const mapCulto = new Map(
      presencasCulto.map((p) => [p.cultoIndividualId!, !!p.status])
    );

    const presentesCultoMes = cultosMes.filter((c) =>
      mapCulto.get(c.id)
    ).length;

    const cultoResumo = {
      mesRef,
      totalCultosMes: cultosMes.length,
      presentesMes: presentesCultoMes,
      percentual: pct(presentesCultoMes, cultosMes.length),
      itens: cultosMes.map((c) => {
        const titulo =
          c.culto_semana?.nome || c.culto_semana?.cultoGeral?.nome || "Culto";

        // OBS: se não tiver registro, "presente" fica false, e o front resolve (FUTURO/NAO_REGISTRADO)
        const hasRegistro = mapCulto.has(c.id);

        return {
          id: c.id,
          dataInicio: c.data_inicio_culto,
          dataTermino: c.data_termino_culto,
          titulo,
          presente: hasRegistro ? !!mapCulto.get(c.id) : null, // 👈 melhor pro front: null = não lançado
        };
      }),
    };

    // =========================
    // 3) REUNIÕES DA CÉLULA DO MÊS + PRESENÇA
    // =========================
    const celulaId = perfil.celulaId;

    const reunioesMes = await prisma.reuniaoCelula.findMany({
      where: {
        celulaId: celulaId ?? undefined,
        data_reuniao: { gte: inicio, lte: fim },
      },
      select: {
        id: true,
        data_reuniao: true,
        status: true,
        visitantes: true,
        almas_ganhas: true,
      },
      orderBy: { data_reuniao: "asc" },
    });

    const presencasReuniao = await prisma.presencaReuniaoCelula.findMany({
      where: {
        userId: membroId,
        which_reuniao_celula: {
          data_reuniao: { gte: inicio, lte: fim },
        },
      },
      select: {
        reuniaoCelulaId: true,
        status: true,
      },
    });

    const mapReuniao = new Map(
      presencasReuniao.map((p) => [p.reuniaoCelulaId!, !!p.status])
    );

    const presentesCelulaMes = reunioesMes.filter((r) =>
      mapReuniao.get(r.id)
    ).length;

    const celulaResumo = {
      mesRef,
      totalReunioesMes: reunioesMes.length,
      presentesMes: presentesCelulaMes,
      percentual: pct(presentesCelulaMes, reunioesMes.length),
      itens: reunioesMes.map((r) => {
        const hasRegistro = mapReuniao.has(r.id);
        return {
          id: r.id,
          data: r.data_reuniao,
          presente: hasRegistro ? !!mapReuniao.get(r.id) : null, // 👈 null = não lançado
          status: r.status,
          visitantes: r.visitantes ?? 0,
          almasGanhas: r.almas_ganhas ?? 0,
        };
      }),
    };

    // =========================
    // 4) DISCIPULADO (último + contagem no mês + meta)
    // =========================
    const META_DISCIPULADO_MES = 2;

    const discipuladoNoMes = await prisma.discipulado.count({
      where: {
        usuario_id: membroId,
        data_ocorreu: { gte: inicio, lte: fim },
      },
    });

    const ultimoDiscipulado = await prisma.discipulado.findFirst({
      where: { usuario_id: membroId },
      orderBy: { data_ocorreu: "desc" },
      select: {
        discipulado_id: true,
        data_ocorreu: true,
        discipulador_id: true,
        discipulador_usuario: {
          select: {
            user_discipulador: {
              select: { id: true, first_name: true, last_name: true },
            },
          },
        },
      },
    });

    const discipuladorDoRegistro =
      ultimoDiscipulado?.discipulador_usuario?.user_discipulador ?? null;

    const faltam = Math.max(0, META_DISCIPULADO_MES - discipuladoNoMes);
    const discipuladoPct = clampPercent(
      Math.round((discipuladoNoMes / META_DISCIPULADO_MES) * 100)
    );

    return {
      perfil: {
        id: perfil.id,
        nome: `${perfil.first_name} ${perfil.last_name}`.trim(),
        telefone: perfil.telefone,
        email: perfil.email,
        image_url: perfil.image_url,

        celula: perfil.celula,
        supervisao: perfil.supervisao_pertence,
        situacaoNoReino: perfil.situacao_no_reino,
        cargo: perfil.cargo_de_lideranca,

        discipulador: perfil.user
          ? {
              id: perfil.user.id,
              nome: `${perfil.user.first_name} ${perfil.user.last_name}`.trim(),
            }
          : null,
      },

      cultoResumo,
      celulaResumo,

      discipuladoResumo: {
        mesRef,
        metaMes: META_DISCIPULADO_MES,
        noMes: discipuladoNoMes,
        faltam,
        percentual: discipuladoPct,
        ultimo: ultimoDiscipulado
          ? {
              id: ultimoDiscipulado.discipulado_id,
              data: ultimoDiscipulado.data_ocorreu,
              discipulador: discipuladorDoRegistro
                ? {
                    id: discipuladorDoRegistro.id,
                    nome: `${discipuladorDoRegistro.first_name} ${discipuladorDoRegistro.last_name}`.trim(),
                  }
                : null,
            }
          : null,
      },
    };
  }

  async getPresencasMembro(args: Args) {
    const full = await this.getDetalheMembro(args);
    if (!full) return null;
    return {
      cultoResumo: full.cultoResumo,
      celulaResumo: full.celulaResumo,
      discipuladoResumo: full.discipuladoResumo,
    };
  }
}
