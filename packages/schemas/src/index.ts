import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2).max(100),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  version: z.number().int().nonnegative(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
