import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

class GenerateRfreshToken {
  async execute(userId: string, prisma: PrismaClient) {
    const expiresIn = dayjs().add(30, "day").unix();

    // como userIdRefresh é unique, podemos fazer upsert também.
    // mas como a rotação já deleta antes, create é ok.
    return prisma.refreshToken.create({
      data: {
        user: { connect: { id: userId } },
        expiresIn,
      },
    });
  }
}

export { GenerateRfreshToken };
