import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

class GenerateRfreshToken {
  async execute(userId: string, prisma: PrismaClient) {
    const expiresIn = dayjs().add(30, "day").unix();

    return prisma.refreshToken.upsert({
      where: { userIdRefresh: userId },
      create: {
        userIdRefresh: userId,
        expiresIn,
      },
      update: {
        expiresIn,
      },
    });
  }
}

export { GenerateRfreshToken };
