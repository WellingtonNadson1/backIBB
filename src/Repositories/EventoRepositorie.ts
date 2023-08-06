import { PrismaClient } from "@prisma/client";
import { EventoData } from "../Controllers/EventoController";

const prisma = new PrismaClient();

class EventoRepositorie {
  async findAll() {
    return await prisma.evento.findMany({
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        image_url: true,
        name: true,
        descricao: true,
        recorrencia: true,
      }
    });
  }

  async findById(id: string){
    const eventoExistById = await prisma.evento.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        startDatetime: true,
        endDatetime: true,
        image_url: true,
        name: true,
        descricao: true,
        recorrencia: true,
      }
    })
    return eventoExistById
  }

  async createEvento(eventoDataForm: EventoData) {
    const { startDatetime, endDatetime, image_url, name, descricao, recorrencia } = eventoDataForm
    return await prisma.evento.create({
      data: {
        startDatetime,
        endDatetime,
        image_url,
        name,
        descricao,
        recorrencia,
      },
    });
  }

  async updateEvento(id: string, eventoDataForm: EventoData) {
    const { startDatetime, endDatetime, image_url, name, descricao, recorrencia } = eventoDataForm
    return await prisma.evento.update({
      where: {
        id: id,
      },
      data: {
        startDatetime,
        endDatetime,
        image_url,
        name,
        descricao,
        recorrencia,
      },
    });
  }

  async deleteEvento(id: string) {
    await prisma.evento.delete({
      where: {
        id: id,
      },
    });
  }
}

export default new EventoRepositorie();
