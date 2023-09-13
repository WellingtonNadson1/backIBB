import { FastifyReply } from 'fastify'
import PDFPrinter from 'pdfmake'
import { TDocumentDefinitions } from 'pdfmake/interfaces'

export default function createPDFRelatorioPresenceCultoSupervision(reply: FastifyReply) {
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    },
  }
  const printer = new PDFPrinter(fonts)

  const docDefinitions: TDocumentDefinitions = {
    defaultStyle: { font: "Helvetica" },
    content: [
      { text: "Meu Segundo Relatório!" }
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
    return reply.code(201).send(result);
  })
}
