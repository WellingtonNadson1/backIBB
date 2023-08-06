import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from 'fastify';
import UserRepositorie from "../Repositories/UserRepositorie";

interface Escolas {
  id: string
  nome: string
}

interface Encontros {
  id: string
  nome: string
}

export interface UserData {
  email: string
  password: string
  first_name: string
  last_name: string
  cpf: string
  dateNasc: string | Date
  sexo: string
  telefone: string
  escolaridade: string
  profissao: string
  batizado: string
  date_batizado: string | Date
  is_discipulado: string
  discipulador: string
  supervisao:  string
  celula: string  | undefined
  escolas: Escolas[]
  encontros: Encontros[]
  estado_civil: string
  nomeConjuge: string
  date_casamento: string | Date
  has_filho: string
  quantidade_de_filho: number
  endereco: string | undefined
  date_decisao: string | Date
  situacao_no_reino: string
  cargo_de_lideranca: string
}

export interface UserParams {
  id: string
}

class UserController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const users = await UserRepositorie.findAll();
    if (!users) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.send(users);
  }

  async show(request: FastifyRequest <{
    Params: UserParams }>, reply: FastifyReply) {
    const id = request.params.id
    const user = await UserRepositorie.findById(id);
    if (!user) {
      return reply.code(404).send({ message: "User not found!" });
    }
    return reply.code(200).send(user);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const userDataForm = request.body as UserData;
    const { email } = userDataForm;
    const userExist = await UserRepositorie.findByEmail(email);
    if (userExist) {
      return reply
        .code(404)
        .send({ message: "User already exist, please try other email!" });
    }

    const { password } = userDataForm;
    const saltRounds = 10;

    const hashPassword: string = bcrypt.hashSync(password, saltRounds)


    const user = await UserRepositorie.createUser({
      ...userDataForm, password: hashPassword
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser  } = user
    return reply.code(201).send(newUser);
  }

  async update(request: FastifyRequest <{
    Params: UserParams }>, reply: FastifyReply) {
    const id = request.params.id;
    const userDataForm = request.body as UserData;
    const user = await UserRepositorie.updateUser(id, {
      ...userDataForm,
    });
    return reply.code(202).send(user);
  }

  async delete(request: FastifyRequest <{
    Params: UserParams }>, reply: FastifyReply) {
    const id = request.params.id;
    await UserRepositorie.deleteUser(id);
    return reply.code(204).send();
  }
}

export default new UserController();
