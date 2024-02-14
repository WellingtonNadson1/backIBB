import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import { UserData } from "./schema";
import UserRepositorie from "../../Repositories/User/UserRepositorie";

export interface UserParams {
  id: string;
}

const formatDatatoISO8601 = (dataString: string) => {
  const dataObj = new Date(dataString);
  return dataObj.toISOString();
};

class UserController {
  // Fazendo uso do Fastify
  async combinationRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await UserRepositorie.getCombinedData();
      return reply.code(200).send(data);
    } catch (error) {
      return reply.code(500).send({ error: "Failed to fetch combined data." });
    }
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const users = await UserRepositorie.findAll();
    if (!users) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    return reply.code(200).send(users);
  }

  async show(
    request: FastifyRequest<{
      Params: UserParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const user = await UserRepositorie.findById(id);
    if (!user) {
      return reply.code(404).send({ message: "User not found!" });
    }
    return reply.code(200).send(user);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const userDataForm = request.body as UserData;
    const { email } = userDataForm;
    let { date_nascimento, date_batizado, date_casamento, date_decisao } =
      userDataForm;
    const userExist = await UserRepositorie.findByEmail(email);
    if (userExist) {
      return reply
        .code(404)
        .send({ message: "User already exist, please try other email!" });
    }

    if (date_nascimento) {
      date_nascimento = formatDatatoISO8601(date_nascimento);
    }
    if (date_batizado) {
      date_batizado = formatDatatoISO8601(date_batizado);
    }
    if (date_casamento) {
      date_casamento = formatDatatoISO8601(date_casamento);
    }
    if (date_decisao) {
      date_decisao = formatDatatoISO8601(date_decisao);
    }

    const { password } = userDataForm;
    const saltRounds = 10;

    const hashPassword: string = bcrypt.hashSync(password, saltRounds);

    const user = await UserRepositorie.createUser({
      ...userDataForm,
      date_nascimento,
      date_batizado,
      date_casamento,
      date_decisao,
      password: hashPassword,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser } = user;
    return reply.code(201).send(newUser);
  }

  async update(
    request: FastifyRequest<{
      Params: UserParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const userDataForm = request.body as UserData;
    let { date_nascimento, date_batizado, date_casamento, date_decisao } =
      userDataForm;

    if (date_nascimento) {
      date_nascimento = formatDatatoISO8601(date_nascimento);
    }
    if (date_batizado) {
      date_batizado = formatDatatoISO8601(date_batizado);
    }
    if (date_casamento) {
      date_casamento = formatDatatoISO8601(date_casamento);
    }
    if (date_decisao) {
      date_decisao = formatDatatoISO8601(date_decisao);
    }
    const { password } = userDataForm;
    const saltRounds = 10;

    const hashPassword: string = bcrypt.hashSync(password, saltRounds);
    const user = await UserRepositorie.updateUser(id, {
      ...userDataForm,
      date_nascimento,
      date_batizado,
      date_casamento,
      date_decisao,
      password: hashPassword,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser } = user;
    return reply.code(202).send(newUser);
  }

  async updateDisicipulo(
    request: FastifyRequest<{
      Params: UserParams
    }>,
    reply: FastifyReply) {
      const { id, discipuladorId } = request.body as UserData
      if (discipuladorId) {
        const result = await UserRepositorie.updateDiscipuladorId(id, discipuladorId)
        return result
      }
      return null;
  }

  async delete(
    request: FastifyRequest<{
      Params: UserParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    await UserRepositorie.deleteUser(id);
    return reply.code(204).send();
  }
}

export default new UserController();
