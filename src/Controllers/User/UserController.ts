import bcrypt from "bcrypt";
import { FastifyReply, FastifyRequest } from "fastify";
import UserRepositorie from "../../Repositories/User/UserRepositorie";
import { UserData } from "./schema";

export interface UserParams {
  id: string;
}

const formatDateToISO8601 = (dateString: string) => {
  const dateObj = new Date(dateString);
  return dateObj.toISOString();
};

class UserController {
  // Combine requests
  async combinationRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await UserRepositorie.getCombinedData();
      return reply.code(200).send(data);
    } catch (error) {
      return reply.code(500).send({ error: "Failed to fetch combined data." });
    }
  }

  // Get all users in a cell
  async indexcell(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserRepositorie.findAllCell();
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Get all users
  async index(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserRepositorie.findAll();
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Get all users with disciplado
  async indexDiscipulados(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserRepositorie.findAllDiscipulados();
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Show a user by ID in a cell
  async showcell(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    try {
      const id = request.params.id;
      const user = await UserRepositorie.findByIdCell(id);
      if (!user) {
        return reply.code(404).send({ message: "User not found!" });
      }
      return reply.code(200).send(user);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Show a user by ID
  async show(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    try {
      const id = request.params.id;
      const user = await UserRepositorie.findById(id);
      if (!user) {
        return reply.code(404).send({ message: "User not found!" });
      }
      return reply.code(200).send(user);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Create a new user
  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userDataForm = request.body as UserData;
      const { email } = userDataForm;
      let { date_nascimento, date_batizado, date_casamento, date_decisao } = userDataForm;

      // Check if user already exists
      const userExist = await UserRepositorie.findByEmail(email);
      if (userExist) {
        return reply.code(400).send({ message: "User already exists. Please try another email!" });
      }

      // Format dates
      if (date_nascimento) date_nascimento = formatDateToISO8601(date_nascimento);
      if (date_batizado) date_batizado = formatDateToISO8601(date_batizado);
      if (date_casamento) date_casamento = formatDateToISO8601(date_casamento);
      if (date_decisao) date_decisao = formatDateToISO8601(date_decisao);

      // Hash password
      const { password } = userDataForm;
      const saltRounds = 10;
      const hashPassword = bcrypt.hashSync(password, saltRounds);

      // Create user
      const user = await UserRepositorie.createUser({
        ...userDataForm,
        date_nascimento,
        date_batizado,
        date_casamento,
        date_decisao,
        password: hashPassword,
      });

      const { password: _, ...newUser } = user;
      return reply.code(201).send(newUser);
    } catch (error) {
      return reply.code(500).send({ error: "Failed to create user." });
    }
  }

  // Update a user
  async update(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    try {
      const id = request.params.id;
      const userDataForm = request.body as UserData;
      let { date_nascimento, date_batizado, date_casamento, date_decisao } = userDataForm;

      // Format dates
      if (date_nascimento) date_nascimento = formatDateToISO8601(date_nascimento);
      if (date_batizado) date_batizado = formatDateToISO8601(date_batizado);
      if (date_casamento) date_casamento = formatDateToISO8601(date_casamento);
      if (date_decisao) date_decisao = formatDateToISO8601(date_decisao);

      // Update user
      const user = await UserRepositorie.updateUser(id, {
        ...userDataForm,
        date_nascimento,
        date_batizado,
        date_casamento,
        date_decisao,
      });

      return reply.code(202).send(user);
    } catch (error) {
      return reply.code(500).send({ error: "Failed to update user." });
    }
  }

  // Update discipulador ID
  async updateDiscipulo(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id, discipuladorId } = request.body as UserData;
      if (discipuladorId) {
        const result = await UserRepositorie.updateDiscipuladorId(id, discipuladorId);
        return reply.code(200).send(result);
      }
      return reply.code(400).send({ message: "Discipulador ID not provided." });
    } catch (error) {
      return reply.code(500).send({ error: "Failed to update discipulador ID." });
    }
  }

  // Delete a user
  async delete(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply
  ) {
    try {
      const id = request.params.id;
      await UserRepositorie.deleteUser(id);
      return reply.code(204).send();
    } catch (error) {
      return reply.code(500).send({ error: "Failed to delete user." });
    }
  }
}

export default new UserController();
