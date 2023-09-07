import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from "zod";
import UserRepositorie from "../Repositories/UserRepositorie";

enum Role {
  USERLIDER = 'USERLIDER',
  USERSUPERVISOR = 'USERSUPERVISOR',
  USERCENTRAL = 'USERCENTRAL',
  USERPASTOR = 'USERPASTOR',
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

const roleEnumValidator = (val: string): val is Role => Object.values(Role).includes(val as Role)

const UserDataSchema = z.object({
  supervisao_pertence:  z.string().optional(),
  role: z.string().refine(roleEnumValidator, { message: 'Valor de role inválido' }),
  celula: z.string().optional(),
  image_url: z.string().optional(),
  escolas: z.string().array().optional(),
  encontros: z.string().array().optional(),
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  cpf: z.string().optional(),
  date_nascimento: z.string().datetime(),
  sexo: z.string(),
  telefone: z.string(),
  escolaridade: z.string(),
  profissao: z.string().optional(),
  batizado: z.boolean(),
  date_batizado: z.string().datetime().optional(),
  is_discipulado: z.boolean(),
  discipulador: z.string().optional(),
  estado_civil: z.string(),
  nome_conjuge: z.string().optional(),
  date_casamento: z.string().datetime().optional(),
  has_filho: z.boolean(),
  quantidade_de_filho: z.number().optional(),
  cep: z.string(),
  cidade: z.string(),
  estado: z.string(),
  bairro: z.string(),
  endereco: z.string(),
  numero_casa: z.string(),
  date_decisao: z.string().datetime().optional(),
  situacao_no_reino: z.string().optional(),
  cargo_de_lideranca: z.string().optional(),
  celula_lidera: z.string().array().optional(),
  escola_lidera: z.string().array().optional(),
  supervisoes_lidera: z.string().array().optional(),
  presencas_aulas_escolas: z.string().array().optional(),
  presencas_reuniao_celula: z.string().array().optional(),
  presencas_cultos: z.string().array().optional(),
  TurmaEscola: z.string().optional(),
})

export type UserData = z.infer<typeof UserDataSchema>

export interface UserParams {
  id: string
}

const formatDatatoISO8601 = (dataString: string) => {
    const dataObj = new Date(dataString)
    return dataObj.toISOString()
  }

class UserController {
  // Fazendo uso do Fastify
  async combinationRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await UserRepositorie.getCombinedData();
      return reply.code(200).send(data);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to fetch combined data.' });
    }
  }

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
    let { date_nascimento, date_batizado, date_casamento, date_decisao } = userDataForm;
    const userExist = await UserRepositorie.findByEmail(email);
    if (userExist) {
      return reply
        .code(404)
        .send({ message: "User already exist, please try other email!" });
    }

    if (date_nascimento) {
      date_nascimento = formatDatatoISO8601(date_nascimento)
    }
    if (date_batizado) {
      date_batizado = formatDatatoISO8601(date_batizado)
    }
    if (date_casamento) {
      date_casamento = formatDatatoISO8601(date_casamento)
    }
    if (date_decisao) {
      date_decisao = formatDatatoISO8601(date_decisao)
    }

    const { password } = userDataForm;
    const saltRounds = 10;

    const hashPassword: string = bcrypt.hashSync(password, saltRounds)

    const user = await UserRepositorie.createUser({
      ...userDataForm, date_nascimento, date_batizado, date_casamento, password: hashPassword
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser  } = user
    return reply.code(201).send(newUser);
  }

  async update(request: FastifyRequest <{
    Params: UserParams }>, reply: FastifyReply) {
    const id = request.params.id;
    const userDataForm = request.body as UserData;
    let { date_nascimento, date_batizado, date_casamento, date_decisao } = userDataForm;

    if (date_nascimento) {
      date_nascimento = formatDatatoISO8601(date_nascimento)
    }
    if (date_batizado) {
      date_batizado = formatDatatoISO8601(date_batizado)
    }
    if (date_casamento) {
      date_casamento = formatDatatoISO8601(date_casamento)
    }
    if (date_decisao) {
      date_decisao = formatDatatoISO8601(date_decisao)
    }
    const { password } = userDataForm;
    const saltRounds = 10;

    const hashPassword: string = bcrypt.hashSync(password, saltRounds)
    const user = await UserRepositorie.updateUser(id, {
      ...userDataForm, date_nascimento, date_batizado, date_casamento, password: hashPassword
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...newUser  } = user
    return reply.code(202).send(newUser);
  }

  async delete(request: FastifyRequest <{
    Params: UserParams }>, reply: FastifyReply) {
    const id = request.params.id;
    await UserRepositorie.deleteUser(id);
    return reply.code(204).send();
  }
}

export default new UserController();
