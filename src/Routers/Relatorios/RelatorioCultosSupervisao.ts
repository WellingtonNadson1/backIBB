import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import RelatorioPresencaCultoController from "../../Controllers/RelatorioPresencaCultoController";
import PdfPrinter from "pdfmake";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { Writable } from "stream";

const routerRelatorioPresencaCulto = async (fastify: FastifyInstance) => {
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
      content: [
        { text: "Meu Terceiro Relatório!" }
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
  
  fastify.get('/relatorio/presencacultos/:id', RelatorioPresencaCultoController.show);
  fastify.get('/relatorio/presencacultosbycelula/:id', RelatorioPresencaCultoController.searchByIdCulto);

};

export default routerRelatorioPresencaCulto;
