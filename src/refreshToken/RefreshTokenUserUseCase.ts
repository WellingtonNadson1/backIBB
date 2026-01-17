import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";
import { GenerateToken } from "../provider/GenerateToken";
import { GenerateRfreshToken } from "../provider/GenerateRefreshToken";

type TokenPayload = {
  role: string;
  avatar: string | null;
  email: string;
  name: string | null;
  supervisao_pertence: string | null;
  cargo_de_lideranca: string | null;
  celula_lidera: string | null;
};

export class RefreshTokenUserUseCase {
  async execute(refreshTokenId: string, prisma: PrismaClient) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { id: refreshTokenId },
      include: { user: true },
    });

    if (!refreshToken || !refreshToken.user) {
      throw new Error("INVALID_REFRESH");
    }

    const isExpired = dayjs().unix() > refreshToken.expiresIn;
    if (isExpired) {
      // apaga token expirado
      await prisma.refreshToken
        .delete({ where: { id: refreshTokenId } })
        .catch(() => {});
      throw new Error("EXPIRED_REFRESH");
    }

    const user = refreshToken.user;

    const payload: TokenPayload = {
      role: user.role,
      email: user.email,
      name: user.first_name,
      avatar: user.image_url,
      supervisao_pertence: user.supervisaoId,
      cargo_de_lideranca: user.cargoDeLiderancaId,
      celula_lidera: user.celulaId,
    };

    // 1) Gera novo access token
    const token = await new GenerateToken().execute(user.id, payload);

    // 2) Rotaciona refresh token (como userIdRefresh é UNIQUE)
    // apaga o refresh atual
    await prisma.refreshToken.delete({ where: { id: refreshTokenId } });

    // cria um novo refresh para o usuário
    const newRefresh = await new GenerateRfreshToken().execute(user.id, prisma);

    return { token, refreshToken: newRefresh };
  }
}
