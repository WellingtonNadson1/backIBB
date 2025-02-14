import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { TAgenda } from "../../Controllers/Agenda";
import { createPrismaInstance, disconnectPrisma } from "../../services/prisma";

interface ReuniaoCelulaResult {
  data_reuniao: string;
  celula: string;
  status: string;
  presencas_membros_reuniao_celula: null | any; // Substitua 'any' pelo tipo apropriado se possível
}

const prisma = createPrismaInstance();

dayjs.extend(utc);
dayjs.extend(timezone);

type UpdateReuniaCelulaInput = Prisma.ReuniaoCelulaUpdateInput & {
  presencas_membros_reuniao_celula?: { connect: { id: string } }[];
};

interface ReuniaCelulaConnect {
  connect: { id: string };
}

class AgendaRepositorie {
  // async reuniaoCelulaExist({
  //   data_reuniao,
  //   celula,
  // }: {
  //   data_reuniao: string;
  //   celula: string;
  // }): Promise<ReuniaoCelulaResult[]> {
  //   console.log("Data Reunia: ", data_reuniao);
  //   if (prisma) {
  //     const query = await prisma.$queryRaw<
  //       ReuniaoCelulaResult[]
  //     >`SELECT * FROM reuniao_celula WHERE DATE(data_reuniao) = DATE(${data_reuniao}) AND "celulaId" = ${celula}`;
  //     console.log("QUERY Retorno: ", query);
  //     await disconnectPrisma();
  //     return query;
  //   } else {
  //     // Trate o caso em que prisma é undefined, se necessário
  //     await disconnectPrisma();
  //     return [];
  //   }
  // }

  async findAll() {
    const result = await prisma?.agenda.findMany({
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        data_inicio: true,
        data_termino: true,
      },
    });
    await disconnectPrisma();
    return result;
  }

  async find() {
    const result = await prisma?.agenda.findMany({
      where: {
        status: {
          equals: true,
        },
      },
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        data_inicio: true,
        data_termino: true,
      },
    });
    await disconnectPrisma();
    return result;
  }

  // async findFirst({
  //   data_reuniao,
  //   celula,
  // }: {
  //   data_reuniao: Date;
  //   celula: string;
  // }) {
  //   const dataReuniaoModify = dayjs(data_reuniao)
  //     .toISOString()
  //     .substring(0, 10);
  //   const result = await prisma?.reuniaoCelula.findFirst({
  //     where: {
  //       data_reuniao: dataReuniaoModify,
  //       celula: { id: celula },
  //     },
  //     select: {
  //       id: true,
  //       data_reuniao: true,
  //       status: true,
  //       presencas_membros_reuniao_celula: {
  //         select: {
  //           status: true,
  //           membro: {
  //             select: {
  //               id: true,
  //               first_name: true,
  //               supervisao_pertence: true,
  //             },
  //           },
  //         },
  //       },
  //       celula: {
  //         select: {
  //           id: true,
  //           nome: true,
  //         },
  //       },
  //     },
  //   });
  //   await disconnectPrisma();
  //   return result;
  // }

  // async findById(id: string) {
  //   const result = await prisma?.reuniaoCelula.findUnique({
  //     where: {
  //       id: id,
  //     },
  //     select: {
  //       data_reuniao: true,
  //       status: true,
  //       presencas_membros_reuniao_celula: {
  //         select: {
  //           status: true,
  //           membro: {
  //             select: {
  //               id: true,
  //               first_name: true,
  //               supervisao_pertence: true,
  //             },
  //           },
  //         },
  //       },
  //       celula: {
  //         select: {
  //           id: true,
  //           nome: true,
  //         },
  //       },
  //     },
  //   });
  //   await disconnectPrisma();
  //   return result;
  // }

  // async findByDate(id: string, data_reuniao: Date) {
  //   const result = await prisma?.reuniaoCelula.findUnique({
  //     where: {
  //       id: id,
  //       data_reuniao: data_reuniao,
  //     },
  //     select: {
  //       data_reuniao: true,
  //       status: true,
  //       presencas_membros_reuniao_celula: {
  //         select: {
  //           status: true,
  //           membro: {
  //             select: {
  //               id: true,
  //               first_name: true,
  //               supervisao_pertence: true,
  //             },
  //           },
  //         },
  //       },
  //       celula: {
  //         select: {
  //           id: true,
  //           nome: true,
  //         },
  //       },
  //     },
  //   });
  //   await disconnectPrisma();
  //   return result;
  // }

  async createAgenda(reuniaoCelulaDataForm: TAgenda) {
    try {
      const prisma = createPrismaInstance();

      if (!prisma) {
        throw new Error("Prisma instance is null");
      }

      const resultCreateEventoAgenda = await prisma?.agenda.create({
        data: {
          title: reuniaoCelulaDataForm.title,
          description: reuniaoCelulaDataForm.description,
          data_inicio: new Date(
            reuniaoCelulaDataForm.date.from as unknown as string
          ),
          data_termino: new Date(
            reuniaoCelulaDataForm.date.to as unknown as string
          ),
        },
      });

      console.log("resultCreateEventoAgenda", resultCreateEventoAgenda);

      return resultCreateEventoAgenda;
    } catch (error) {
      console.error("Error creating aagenda:", error);
    }
  }

  async patchAgenda({
    idEventoAgenda,
    statusDataForm,
  }: {
    idEventoAgenda: string;
    statusDataForm: boolean;
  }) {
    const eventoAgenda = await prisma?.agenda.findUnique({
      where: {
        id: idEventoAgenda,
      },
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        data_inicio: true,
        data_termino: true,
      },
    });

    if (!eventoAgenda) {
      throw new Error("Evento not found.");
    }

    const result = await prisma?.agenda.update({
      where: {
        id: idEventoAgenda,
      },
      data: {
        status: statusDataForm,
      },
    });

    await disconnectPrisma();
    return result;
  }

  async updateAgenda(id: string, agendaDataForm: TAgenda) {
    const { title, description, date } = agendaDataForm;

    const result = await prisma?.agenda.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        description: description,
        data_inicio: date.from,
        data_termino: date.to,
      },
    });

    await disconnectPrisma();
    return result;
  }

  async deleteAgenda(id: string) {
    const result = await prisma?.agenda.delete({
      where: {
        id: id,
      },
    });
    await disconnectPrisma();
    return result;
  }
}

export default new AgendaRepositorie();
