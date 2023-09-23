import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import RelatorioPresencaCultoController from "../../Controllers/RelatorioPresencaCultoController";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { Writable } from "stream";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient()

const routerRelatorioPresencaCulto = async (fastify: FastifyInstance) => {
  const res = async () => { return await prisma.supervisao.
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

  // ESCOLA
  fastify.get("/relatorio/presencacultos", async (request: FastifyRequest, reply: FastifyReply) => {
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
      pageOrientation: 'landscape',
      content: [
        {text: 'Relatório de Frequência de Membros aos Cultos', style: 'subheader'},
        {
          table: {
            widths: [60, 'auto', 'auto', 'auto', 'auto', 'auto',
            'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto',
            'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto',
            'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            headerRows: 2,
            body: [
              [{text: `SUPERVISOR(A): ${res()}`, style: 'tableHeader', colSpan: 15, fillColor: '#FF0000', alignment: 'center'}, {}, {text: `MÊS: ${dayjs().month()} - ${dayjs().year()}`, style: 'tableHeader', alignment: 'center'}],
              [{text: `CÉLULAS: 12`, style: 'tableHeader', colSpan: 15, fillColor: '#FF0000', alignment: 'center'}, {}, {text: `QNT. CULTOS - DOM: 08, QUA: 04, CPD's: 04`, style: 'tableHeader', alignment: 'center'}],
              [{text: `CÉLULAS: 12`, style: 'tableHeader', colSpan: 10, fillColor: '#FFD9D9', alignment: 'center'}, {}, {text: `1ª SEM`, style: 'tableHeader', colSpan: 5, fillColor: '#FFD9D9', alignment: 'center'}, {},
               {text: `2ª SEM`, style: 'tableHeader', colSpan: 5, fillColor: '#FFD9D9', alignment: 'center'}, {}, {text: `3ª SEM`, style: 'tableHeader', colSpan: 5, fillColor: '#FFD9D9', alignment: 'center'}, {},
               {text: `4ª SEM`, style: 'tableHeader', colSpan: 5, fillColor: '#FFD9D9', alignment: 'center'},],

            ]
          }
        }
      ],
    }

    const pdfDoc = printer.createPdfKitDocument(docDefinitions)

    const buffer = await new Promise((resolve, reject) => {
      const chunks:  Buffer[] = [];
      const stream = new Writable({
         write: (chunk, _, next) => {
            chunks.push(chunk);
            next();
         }
      });
      stream.once('error', (err) => reject(err));
      stream.once('close', () => resolve(Buffer.concat(chunks)));

      pdfDoc.pipe(stream);
      pdfDoc.end();
    });

    reply.type('application/pdf').code(200).send(buffer);

    // const chunks = []

    // pdfDoc.on("data", (chunk) => {
    //   chunks.push(chunk)
    // })
    // pdfDoc.end()

    // pdfDoc.on("end", () => {
    //   const result = Buffer.concat(chunks)
    //   reply.header('Content-Type', 'application/octet-stream')
    //   reply.send(result); // Removido o "return" aqui
    //   console.log(result)
    //   return
    // })
  });

//  fastify.get('/relatorio/presencacultos/:id', RelatorioPresencaCultoController.show);
//  fastify.get('/relatorio/presencacultosbycelula/:id', RelatorioPresencaCultoController.searchByIdCulto);

};

export default routerRelatorioPresencaCulto;

