import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    file: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
      // Outras propriedades, se aplicável
    };
  }
}
