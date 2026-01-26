import { z } from "zod";

export const NewPresencaReuniaoCelulaDataSchema = z.object({
  which_reuniao_celula: z.string().uuid().or(z.string()),
  membro: z
    .array(
      z.object({
        id: z.string().uuid().or(z.string()),
        status: z.boolean(),
      }),
    )
    .min(1),
});

export const UpsertPresencaReuniaoCelulaSchema = z.object({
  which_reuniao_celula: z.string().min(1),
  membro: z
    .array(z.object({ id: z.string().min(1), status: z.boolean() }))
    .min(1),
  allowUpdate: z.boolean().optional().default(false), // 👈 IMPORTANTÍSSIMO
});

export type UpsertPresencaReuniaoCelulaInput = z.infer<
  typeof UpsertPresencaReuniaoCelulaSchema
>;
