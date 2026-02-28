import { z } from 'zod';

/**
 * Common reusable pieces
 */
export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createUserBodySchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),

  email: z.email(),

  password: z.string().min(8).max(255),

  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),

  is_active: z.boolean().optional(),
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;

export const updateUserBodySchema = z
  .object({
    username: z
      .string()
      .min(3)
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),

    email: z.email().optional(),

    password: z.string().min(8).max(255).optional(),

    first_name: z.string().max(100).nullable().optional(),
    last_name: z.string().max(100).nullable().optional(),

    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;

export const getUserParamsSchema = userIdParamSchema;
