import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import { FastifyReply } from "fastify";
import { GenerateRfreshToken } from "../provider/GenerateRefreshToken";
import { GenerateToken } from "../provider/GenerateToken";

const prisma = new PrismaClient();

type TokenPayload = {
  role: string;
  avatar: string | null;
  email: string;
  name: string | null;
  supervisao_pertence: string | null;
  cargo_de_lideranca: string | null;
  celula_lidera: string | null;
};

class RefreshTokenUserUseCase {
  async execute(refresh_token: string, reply: FastifyReply) {
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        id: refresh_token,
      },
    });
    if (!refreshToken) {
      throw new Error("Refresh token invalid!");
    }

    const user = await prisma.user.findFirst({
      where: {
        id: refreshToken.userIdRefresh,
      },
    });

    if (!user) {
      return reply
        .code(402)
        .send({ message: "Email or password invalid, please try again!" });
    }

    const refreshTokenExpired = dayjs().isAfter(
      dayjs.unix(refreshToken.expiresIn)
    );

    const tokenPayload: TokenPayload = {
      role: user.role,
      email: user.email,
      name: user.first_name,
      avatar: user.image_url,
      supervisao_pertence: user.supervisaoId,
      cargo_de_lideranca: user.cargoDeLiderancaId,
      celula_lidera: user.celulaId,
    };

    const generateToken = new GenerateToken();
    const token = await generateToken.execute(
      refreshToken.userIdRefresh,
      tokenPayload
    );

    if (refreshTokenExpired) {
      await prisma.refreshToken.deleteMany({
        where: {
          userIdRefresh: refreshToken.userIdRefresh,
        },
      });
      const generateRefreshToken = new GenerateRfreshToken();
      const newRefreshToken = await generateRefreshToken.execute(
        refreshToken.userIdRefresh
      );

      return { token, newRefreshToken };
    }

    return { token };
  }
}

export { RefreshTokenUserUseCase };
