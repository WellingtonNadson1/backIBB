import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { loginSchema } from "../schemas/login.schema";
import UserRepositorie from "../Repositories/User/UserRepositorie";
import { GenerateRfreshToken } from "../provider/GenerateRefreshToken";
import { GenerateToken } from "../provider/GenerateToken";

type TokenPayload = {
  role: string;
  avatar: string | null;
  email: string;
  name: string | null;
  supervisao_pertence: string | null;
  cargo_de_lideranca: string | null;
  celula_lidera: string | null;
};

class LoginController {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const parsed = loginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: "Campo inválido" });
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const user = await UserRepositorie.findByEmail(email);

    // resposta genérica (não revela se user existe)
    if (!user || !user.password) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
    }

    const verifyPass = await bcrypt.compare(password, user.password);
    if (!verifyPass) {
      return reply.code(401).send({ error: "Credenciais inválidas" });
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

    const generateToken = new GenerateToken();
    // ⛔️ recomendo reduzir esse tempo (ver abaixo)
    const token = await generateToken.execute(user.id, tokenPayload);

    // ✅ use request.prisma (não PrismaClient global)
    await request.prisma.refreshToken.deleteMany({
      where: { userIdRefresh: user.id },
    });

    const generateRefreshToken = new GenerateRfreshToken();
    const refreshToken = await generateRefreshToken.execute(
      user.id,
      request.prisma
    );

    const { password: _pw, ...newUser } = user as any;
    return reply.code(200).send({ ...newUser, token, refreshToken });
  }
}

export default new LoginController();
