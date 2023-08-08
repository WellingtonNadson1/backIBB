import { FastifyReply, FastifyRequest } from 'fastify';
import { Input, date, object, string } from 'valibot';
import EventoRepositorie from '../Repositories/EventoRepositorie';

const EventoDataSchema = object({
  startDatetime: date(),
  endDatetime:   date(),
  image_url:     string(),
  name:          string(),
  descricao:     string(),
  recorrencia:  string(),
})

export type EventoData = Input<typeof EventoDataSchema>

interface EventoParams {
  id: string;
}

class EventoController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const supervisoes = await EventoRepositorie.findAll();
    if (!supervisoes) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.code(200).send(supervisoes);
  }

  async show(request: FastifyRequest <{
    Params: EventoParams }>, reply: FastifyReply) {
    const id = request.params.id
    const evento = await EventoRepositorie.findById(id);
    if (!evento) {
      return reply.code(404).send({ message: "Evento not found!" });
    }
    return reply.code(200).send(evento);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const eventoDataForm = request.body as EventoData;
    const evento = await EventoRepositorie.createEvento({
      ...eventoDataForm,
    });
    return reply.code(201).send(evento);
  }

  async update(request: FastifyRequest <{
    Params: EventoParams }>, reply: FastifyReply) {
    const id = request.params.id;
    const eventoDataForm = request.body as EventoData;
    const supervisao = await EventoRepositorie.updateEvento(id, {
      ...eventoDataForm,
    });
    return reply.code(202).send(supervisao);
  }

  async delete(request: FastifyRequest <{
    Params: EventoParams }>, reply: FastifyReply) {
    const id = request.params.id;
    await EventoRepositorie.deleteEvento(id);
    return reply.code(204);
  }
}

export default new EventoController();
