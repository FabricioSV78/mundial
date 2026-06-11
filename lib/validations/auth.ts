import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un email valido"),
  password: z.string().min(6, "Minimo 6 caracteres"),
});

export const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Minimo 3 caracteres"),
  favoriteCountry: z.string().min(2, "Elige un pais"),
});
