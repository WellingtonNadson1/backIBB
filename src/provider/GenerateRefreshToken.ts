import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

class GenerateRfreshToken {
  async execute(userId: string) {
    const expiresIn = dayjs().add(24, "hour").unix();
    const generateRefreshToken = await prisma.refreshToken.create({
      data: {
        user: {
          connect: { id: userId },
        },
        expiresIn,
      },
    });
    return generateRefreshToken;
  }
}

export { GenerateRfreshToken };
