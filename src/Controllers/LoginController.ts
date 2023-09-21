import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import UserRepositorie from "../Repositories/UserRepositorie";
import { GenerateRfreshToken } from "../provider/GenerateRefreshToken";
import { GenerateToken } from "../provider/GenerateToken";
import { UserData } from "./UserController";

type TokenPayload = {
  role: string;
  avatar: string | null;
  email: string;
  name: string | null;
  supervisao_pertence: string | null;
  cargo_de_lideranca: string | null;
  celula_lidera: string | null;
};

const prisma = new PrismaClient();

class LoginController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    // Dados de credenciais vindas do FrontEnd
    const { email, password } = request.body as UserData;

    const user = await UserRepositorie.findByEmail(email.toLowerCase());

    if (!user) {
      return reply
        .code(402)
        .send({ message: "Email or password invalid, please try again!" });
    }

    const verifyPass = await bcrypt.compare(password, user.password ?? "");
    if (!verifyPass) {
      return reply
        .code(404)
        .send({ message: "Email or password invalid, please try again!" });
    }

    const tokenPayload: TokenPayload = {
      role: user.role,
      email: user.email,
      name: user.first_name,
      avatar: user.image_url,
      supervisao_pertence: user.supervisaoId,
      cargo_de_lideranca: user.cargoDeLiderancaId,
      celula_lidera: user.celulaId,
    };

    // Function for generation token JWT after sing in
    const generateToken = new GenerateToken();
    const token = await generateToken.execute(user.id, tokenPayload);

    await prisma.refreshToken.deleteMany({
      where: {
        userIdRefresh: user.id,
      },
    });

    const generateRefreshToken = new GenerateRfreshToken();
    const refreshToken = await generateRefreshToken.execute(user.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser } = user;
    const userWithToken = { ...newUser, token, refreshToken };

    return reply.code(200).send(userWithToken);
  }
}

export default new LoginController();
