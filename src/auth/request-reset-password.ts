import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

type ResetPasswordData = {
  email: string;
  password: string;
}

export async function requestResetPassword(fastify: FastifyInstance) {
  fastify
    .withTypeProvider<ZodTypeProvider>()
    .post(
      '/password/recorver',
      async (request, reply) => {
        const { email } = request.body as ResetPasswordData

        const userForEmail = await prisma?.user.findUnique({
          where: { email }
        })
        if (!userForEmail) {
          return reply.status(500).send()
        }
        const tokenCreated = await prisma?.token.create({
          data: {
            type: 'PASSWORD_RECOVER',
            userId: userForEmail.id
          },
        })

        console.log('Recover password token', tokenCreated?.id)
        return reply.status(201).send()
      }
    )
}
