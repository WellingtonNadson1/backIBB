import bcrypt from "bcryptjs";
import { FastifyReply, FastifyRequest } from "fastify";
import UserRepositorie from "../../Repositories/User/UserRepositorie";
import {
  TStatusUpdate,
  UserData,
  UserDataSchema,
  UserDataUpdate,
} from "./schema";
import { z } from "zod";

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

  // Get all users in a Id Supervision
  async indexDiscipulosSupervisor(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userDataForm = request.body as any;
      console.log("userDataForm Supervisor", userDataForm);
      const users =
        await UserRepositorie.findAllDiscipulosSupervisor(userDataForm);
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Get all users in a Id Supervision
  async indexDiscipuladoSupervisorSupervisao(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const userDataForm = request.body as any;
      console.log("userDataForm", userDataForm);
      const users =
        await UserRepositorie.findAllDiscipulosSupervisores(userDataForm);
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
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
  async getAllMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserRepositorie.findAllMembers();
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Get all users
  async simple(request: FastifyRequest, reply: FastifyReply) {
    try {
      const users = await UserRepositorie.findAllSimple();
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

  // Get all users available for disciplado
  async indexDiscipuladosAvailable(
    request: FastifyRequest,
    reply: FastifyReply,
  ) {
    try {
      const users = await UserRepositorie.findAllDiscipuladosAvailable();
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
  }

  // Show a user by ID in a cell
  async showcell(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
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
    reply: FastifyReply,
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
      // Valida os dados recebidos com o schema Zod
      const userDataForm = UserDataSchema.parse(request.body);

      const { email } = userDataForm;
      let { date_nascimento, date_batizado, date_casamento, date_decisao } =
        userDataForm;

      // Verifica se o usuário já existe
      const userExist = await UserRepositorie.findByEmail(email);
      if (userExist) {
        return reply
          .code(400)
          .send({ message: "User already exists. Please try another email!" });
      }

      // Formata as datas, se presentes
      if (date_nascimento)
        date_nascimento = formatDateToISO8601(date_nascimento);
      if (date_batizado) date_batizado = formatDateToISO8601(date_batizado);
      if (date_casamento) date_casamento = formatDateToISO8601(date_casamento);
      if (date_decisao) date_decisao = formatDateToISO8601(date_decisao);

      // Hash da senha
      const { password } = userDataForm;
      const saltRounds = 10;
      const hashPassword = bcrypt.hashSync(password, saltRounds);

      // Cria o usuário
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
      console.log("error ao criar user:", error);
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ errors: error.errors });
      }
      return reply.code(500).send({ error: "Failed to create user." });
    }
  }

  // Update a user
  async update(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
  ) {
    try {
      const id = request.params.id;
      const userDataForm = request.body as UserDataUpdate;

      // Extrair apenas os IDs de escolas e encontros
      const escolasIds = userDataForm.escolas?.map((escola) => escola);
      const encontrosIds = userDataForm.encontros?.map((encontro) => encontro);

      // Format dates (já estão em ISO 8601 do frontend, mas garantimos aqui)
      let { date_nascimento, date_batizado, date_casamento, date_decisao } =
        userDataForm;
      if (date_nascimento)
        date_nascimento = formatDateToISO8601(date_nascimento);
      if (date_batizado) date_batizado = formatDateToISO8601(date_batizado);
      if (date_casamento) date_casamento = formatDateToISO8601(date_casamento);
      if (date_decisao) date_decisao = formatDateToISO8601(date_decisao);

      // Update user
      const user = await UserRepositorie.updateUser(id, {
        ...userDataForm,
        escolas: escolasIds, // Substituímos os objetos pelos IDs
        encontros: encontrosIds, // Substituímos os objetos pelos IDs
        date_nascimento,
        date_batizado,
        date_casamento,
        date_decisao,
      });

      return reply.code(202).send(user);
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ error: "Failed to update user." });
    }
  }

  // Patch Status Membro
  async updateStatusMembro(request: FastifyRequest, reply: FastifyReply) {
    console.log("request.body", request.body);
    const { id: idMembro, status: statusMembro } =
      request.body as TStatusUpdate;

    if (!statusMembro && !idMembro) {
      return reply.send({ message: "STATUS and ID is required" }).code(400);
    }
    const membroUpdate = await UserRepositorie.patchStatusMembro({
      statusMembro,
      idMembro,
    });
    return reply.code(202).send(membroUpdate);
  }

  // Update discipulador ID
  async updateDiscipulo(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { id, discipuladorId } = request.body as any;
      if (discipuladorId) {
        console.log("id", id);
        console.log("discipuladorId", discipuladorId);
        const result = await UserRepositorie.updateDiscipuladorId(
          id,
          discipuladorId,
        );
        return reply.code(200).send(result);
      }
      return reply.code(400).send({ message: "Discipulador ID not provided." });
    } catch (error) {
      return reply
        .code(500)
        .send({ error: "Failed to update discipulador ID." });
    }
  }

  // Delete a user
  async delete(
    request: FastifyRequest<{ Params: UserParams }>,
    reply: FastifyReply,
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
