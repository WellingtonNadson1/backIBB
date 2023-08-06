import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import jwt from 'jsonwebtoken';
import UserRepositorie from "../Repositories/UserRepositorie";
import { UserData } from "./UserController";

class LoginController {
  async login(request: FastifyRequest, reply: FastifyReply){
    // Dados de credenciais vindas do FrontEnd
    const { email, password } = request.body as UserData
    const JWT_SECRET = process.env.JWT_TOKEN

    interface TokenPayload {
      userId: string;
      avatar: string | null;
      email: string;
      name: string | null;
    }

    // Function for generation token JWT after sing in
    const generateToken = (payload: TokenPayload): string => {
      if (typeof JWT_SECRET === 'undefined') {
        throw new Error('JWT_TOKEN is not defined in the enviroment')
      }
      return jwt.sign(payload, JWT_SECRET, { expiresIn: '3h'})
    }

    const user = await UserRepositorie.findByEmail(email);

    if (!user) {
      return reply
        .code(404)
        .send({ message: "Email or password invalid, please try again!" });
    }

    const verifyPass = await bcrypt.compare(password, user.password ?? '')
    if (!verifyPass) {
      return reply
        .code(404)
        .send({ message: "Email or password invalid, please try again!" });
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.first_name,
      avatar: user.image_url
    }

    const token = generateToken(tokenPayload)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser  } = user
    const userWithToken = {...newUser, token}

    return reply
        .code(200)
        .send(userWithToken);
  }
}

export default new LoginController()
