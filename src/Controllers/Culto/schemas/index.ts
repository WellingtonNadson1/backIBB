import { z } from "zod";

export const PresencaCultoSpeedSchema = z.object({
  presence_culto: z.string().uuid("presence_culto inválido"),
  membro: z
    .array(
      z.object({
        id: z.string().uuid("id do membro inválido"),
        status: z.boolean(),
      }),
    )
    .min(1, "Envie ao menos 1 membro"),
});
