import { hash } from "bcrypt";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

type ResetPasswordData = {
  email: string;
  password: string;
  code: string;
}

export async function ResetPassword(fastify: FastifyInstance) {
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .put(
      '/password/reset',
      async (request, reply) => {
        const { code, password } = request.body as ResetPasswordData

        const tokenFromCode = await prisma?.token.findUnique({
          where: { id: code }
        })
        if (!tokenFromCode) {
          return reply.status(501).send()
        }
        const passwordHash = await hash(password, 10)
        await prisma?.user.update({
          where: {
            id: tokenFromCode.userId
          },
          data: {
            password: passwordHash,
          },
        })

        return reply.status(204).send()
      }
    )
}
