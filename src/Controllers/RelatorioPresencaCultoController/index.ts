import { FastifyReply, FastifyRequest } from "fastify";
import { Input, boolean, object, string } from "valibot";
import { PresencaCultoRepositorie } from "../../Repositories/Culto";
// import createPDFRelatorioPresenceCultoSupervision from "../../functions/createPDFRelatorioPresenceCultoSupervision";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import PdfPrinter from "pdfmake";
import dayjs from "dayjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

const RelatorioPresencaCultoDataSchema = object({
  status: boolean(),
  membro: string(),
  which_reuniao_celula: string(),
});

export type RelatorioPresencaCultoData = Input<
  typeof RelatorioPresencaCultoDataSchema
>;

interface RelatorioPresencaCultoParams {
  id: string;
}

const res = async () => { await prisma.supervisao.
  findFirst({
    where: {
      supervisor: {
        id: '31c33e5e-282a-45ed-a00f-6a7a40abb6b2'
      },
    },
  select: {
  supervisor: {
    select: {
      first_name: true
    }
  }
  }
})
}

class RelatorioPresencaCultoController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
    }
    const printer = new PdfPrinter(fonts)

    const docDefinitions: TDocumentDefinitions = {
      defaultStyle: { font: "Helvetica" },
      content: [
        {
          pageOrientation: 'landscape',
          table: {
            body: [
            res && [`SUPERVISOR(A): ${res}`, `MÊS: ${dayjs().month()} - ${dayjs().year()}`]
            ]
          }
        }
      ],
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinitions)

    const chunks: any[] = []

    pdfDoc.on("data", (chunk) => {
      chunks.push(chunk)
    })
    pdfDoc.end()

    pdfDoc.on("end", () => {
      const result = Buffer.concat(chunks)
      reply.header('Content-Type', 'application/pdf')
      return reply.code(201).send(result);
    })
  }

  async show(
    request: FastifyRequest<{
      Params: RelatorioPresencaCultoParams;
    }>,
    reply: FastifyReply
  ) {
    const id = request.params.id;
    const presencasReuniaoCelula =
      await PresencaCultoRepositorie.findById(id);
    if (!presencasReuniaoCelula) {
      return reply.code(404).send({ message: "Presença not found!" });
    }
    return reply.code(200).send(presencasReuniaoCelula);
  }

  // async searchByIdCulto(
  //   request: FastifyRequest<{
  //     Params: RelatorioPresencaCultoParams;
  //   }>,
  //   reply: FastifyReply
  // ) {
  //   const presenca_culto = request.params.id;

  //   const presencaCultoIsRegister =
  //     await PresencaCultoRepositorie.findByIdCulto(presenca_culto);
  //   if (!presencaCultoIsRegister) {
  //     return reply.code(404).send({ message: "Presença not Register!" });
  //   }
  //   return reply.code(200).send(presencaCultoIsRegister);
  // }

}

export default new RelatorioPresencaCultoController()
