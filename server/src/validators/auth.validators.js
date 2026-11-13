import { z } from 'zod';

export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(6, 'Password must be at least 6 characters')
  .max(72, 'Password must be at most 72 characters');

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60).optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => data.name || data.password, {
    message: 'Provide a name or a new password',
  });
