import { sign } from "jsonwebtoken";

type TokenPayload = {
  role: string;
  avatar: string | null;
  email: string;
  name: string | null;
  supervisao_pertence: string | null;
  cargo_de_lideranca: string | null;
  celula_lidera: string | null;
};

class GenerateToken {
  async execute(userId: string, payload: TokenPayload) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

    return sign(payload, JWT_SECRET, {
      subject: userId,
      expiresIn: "15m", // ✅ bem melhor que 180d
    });
  }
}

export { GenerateToken };
