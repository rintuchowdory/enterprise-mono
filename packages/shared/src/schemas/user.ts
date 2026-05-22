import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
  createdAt: z.string().datetime(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export const UpdateUserSchema = CreateUserSchema.partial();

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
