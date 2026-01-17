import { z } from "zod";

export const refreshTokenSchema = z.object({
  refresh_token: z.string().uuid("Refresh token inválido"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
