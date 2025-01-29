import { FastifyReply, FastifyRequest } from "fastify";
import AgendaRepositorie from "../../Repositories/Agenda";

export interface ReuniaoCelulaData {
  data_reuniao: Date,
  status: string,
  presencas_membros_reuniao_celula: string[],
  celula: string,
  visitantes: number,
  almas_ganhas: number,
};

class AgendaController {
  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const reuniaoCelula = await AgendaRepositorie.findAll();
    if (!reuniaoCelula) {
      return reply.code(500).send({ error: "Internal Server Error" });
    }
    console.log('reuniaoCelula', reuniaoCelula)
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

  // async store(request: FastifyRequest, reply: FastifyReply) {
  //   try {
  //     const reuniaoCelulaDataForm = request.body as ReuniaoCelulaData;
  //     const { data_reuniao, celula } = reuniaoCelulaDataForm

  //     // Formatar a data para ignorar o horário
  //     const dataReuniaoFormatada = dayjs(data_reuniao).format('YYYY-MM-DD');

  //     const reuniaoCelulaExist = await ReuniaoCelulaRepositorie.reuniaoCelulaExist({
  //       data_reuniao: dataReuniaoFormatada, celula
  //     })
  //     if (reuniaoCelulaExist.length > 0) {
  //       return reply
  //         .code(409)
  //         .send(reuniaoCelulaExist);
  //     }
  //     // Se não existir, crie a reunião
  //     const presencaCulto = await ReuniaoCelulaRepositorie.createReuniaoCelula({
  //       ...reuniaoCelulaDataForm,
  //     });
  //     return reply.code(201).send(presencaCulto);
  //   } catch (error) {
  //     return reply.code(400).send(error);
  //   }
  // }

  // async update(
  //   request: FastifyRequest<{
  //     Params: ReuniaoCelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const { id } = request.params;
  //   const reuniaoCelulaDataForm = request.body as ReuniaoCelulaData;
  //   const reuniaoCelula = await ReuniaoCelulaRepositorie.updateReuniaoCelula(
  //     id,
  //     {
  //       ...reuniaoCelulaDataForm,
  //     }
  //   );
  //   return reply.code(202).send(reuniaoCelula);
  // }

  // async delete(
  //   request: FastifyRequest<{
  //     Params: ReuniaoCelulaParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const id = request.params.id;
  //   await ReuniaoCelulaRepositorie.deleteReuniaoCelula(id);
  //   return reply.code(204).send();
  // }
}

export default new AgendaController();
