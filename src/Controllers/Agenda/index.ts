import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import AgendaRepositorie from "../../Repositories/Agenda";

const agendaSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().min(1, { message: "A comment is required." }),
  date: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .refine((date) => {
      return !!date.from;
    }),
});

export type TAgenda = z.infer<typeof agendaSchema>;

const agendaReturnSchema = z.object({
  id: z.string(),
  status: z.boolean(),
  title: z.string(),
  description: z.string().min(1, { message: "A comment is required." }),
  date: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .refine((date) => {
      return !!date.from;
    }),
});

export type TAgendaReturn = z.infer<typeof agendaReturnSchema>;

interface AgendaParams {
  eventoAgendaId: string;
}

interface AgendaReturnParams {
  idEventoAgenda: string;
  status: boolean;
}

class AgendaController {
  // Fazendo uso do Fastify
  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const reuniaoCelula = await AgendaRepositorie.findAll();
    if (!reuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    console.log("reuniaoCelula all", reuniaoCelula);
    return reply.send(reuniaoCelula);
  }

  async index(request: FastifyRequest, reply: FastifyReply) {
    const reuniaoCelula = await AgendaRepositorie.find();
    if (!reuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    console.log("reuniaoCelula", reuniaoCelula);
    return reply.send(reuniaoCelula);
  }

  // async show(
  //   request: FastifyRequest<{
  //     Params: ReuniaoCelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const id = request.params.id;
  //   const reuniaoCelula = await ReuniaoCelulaRepositorie.findById(id);
  //   if (!reuniaoCelula) {
  //     return reply.code(404).send({ message: "Reunião de Célula not found!" });
  //   }
  //   return reply.code(200).send(reuniaoCelula);
  // }

  // async getReunionForDate(request: FastifyRequest, reply: FastifyReply) {
  //   try {
  //     const { data_reuniao, celula } = request.body as ReuniaoCelulaData
  //   }
  //   catch (error) {
  //     return reply.code(400).send(error);
  //   }
  // }

  async store(request: FastifyRequest, reply: FastifyReply) {
    try {
      console.log("request.body: ", request.body);
      const agendaDataForm = request.body as TAgenda;
      console.log("agendaDataForm: ", agendaDataForm);
      const { title } = agendaDataForm;

      if (!title) {
        return reply.send({ message: "Title name is required" }).code(400);
      }

      // Se não existir, crie a reunião
      const agendaCreate = await AgendaRepositorie.createAgenda({
        ...agendaDataForm,
      });
      return reply.code(201).send(agendaCreate);
    } catch (error) {
      return reply.code(400).send(error);
    }
  }

  async patch(request: FastifyRequest, reply: FastifyReply) {
    console.log("request.body", request.body);
    const { id: idEventoAgenda, status: statusDataForm } =
      request.body as TAgendaReturn;

    if (!statusDataForm && !idEventoAgenda) {
      return reply.send({ message: "STATUS and ID is required" }).code(400);
    }
    const reuniaoCelula = await AgendaRepositorie.patchAgenda({
      statusDataForm,
      idEventoAgenda,
    });
    return reply.code(202).send(reuniaoCelula);
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const reuniaoCelulaDataForm = request.body as TAgenda;
    const { id } = reuniaoCelulaDataForm;
    if (!id) {
      return reply.send({ message: "ID is required" }).code(400);
    }
    const reuniaoCelula = await AgendaRepositorie.updateAgenda(id, {
      ...reuniaoCelulaDataForm,
    });
    return reply.code(202).send(reuniaoCelula);
  }

  async delete(
    request: FastifyRequest<{
      Params: AgendaParams;
    }>,
    reply: FastifyReply
  ) {
    console.log("request.params", request.params.eventoAgendaId);
    const id = request.params.eventoAgendaId;
    await AgendaRepositorie.deleteAgenda(id);
    return reply.code(204).send();
  }
}

export default new AgendaController();
