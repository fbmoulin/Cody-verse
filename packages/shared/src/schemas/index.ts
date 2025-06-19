/**
 * Schemas de validação Zod compartilhados
 */

import { z } from 'zod';

// Schema base de usuário
export const UserRoleSchema = z.enum(['student', 'teacher', 'admin']);

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']).default('pt-BR'),
  notifications: z.boolean().default(true),
  emailUpdates: z.boolean().default(true)
});

export const BaseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().max(254),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  profileImageUrl: z.string().url().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const UserSchema = BaseUserSchema.extend({
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  preferences: UserPreferencesSchema
});

// Schema de curso
export const CourseDifficultySchema = z.enum(['Iniciante', 'Intermediário', 'Avançado']);

export const CourseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  difficulty: CourseDifficultySchema,
  category: z.string().min(2).max(50),
  duration: z.number().int().min(1).max(10080),
  price: z.number().min(0).max(9999.99).optional(),
  tags: z.array(z.string().min(2).max(30)).max(10),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().uuid()
});

export const CreateCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  difficulty: CourseDifficultySchema,
  category: z.string().min(2).max(50),
  duration: z.number().int().min(1).max(10080).optional(),
  price: z.number().min(0).max(9999.99).optional(),
  tags: z.array(z.string().min(2).max(30)).max(10).default([])
});

// Schema de paginação
export const PaginationSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  limit: z.number().int().min(1).max(100).default(10)
});

// Schema de resposta da API
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
    value: z.any().optional()
  })).optional()
});

// Export de tipos inferidos
export type UserType = z.infer<typeof UserSchema>;
export type CreateCourseType = z.infer<typeof CreateCourseSchema>;
export type CourseType = z.infer<typeof CourseSchema>;
export type PaginationType = z.infer<typeof PaginationSchema>;
export type ApiResponseType = z.infer<typeof ApiResponseSchema>;