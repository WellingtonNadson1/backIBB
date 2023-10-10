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

    if (typeof JWT_SECRET === "undefined") {
      throw new Error("JWT_TOKEN is not defined in the enviroment");
    }

    const token = sign(payload, JWT_SECRET, {
      subject: userId,
      expiresIn: "180d",
    });
    return token;
  }
}

export { GenerateToken };
