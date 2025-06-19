/**
 * Tipos compartilhados da plataforma CodyVerse
 */

// Tipos base de usuário
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseUser {
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences: UserPreferences;
}

export type UserRole = 'student' | 'teacher' | 'admin';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  notifications: boolean;
  emailUpdates: boolean;
}

// Tipos de curso
export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  category: string;
  duration: number; // em minutos
  price?: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // user ID
}

export type CourseDifficulty = 'Iniciante' | 'Intermediário' | 'Avançado';

// Tipos de lição
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string;
  order: number;
  duration: number; // em minutos
  type: LessonType;
  difficulty: 'easy' | 'medium' | 'hard';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LessonType = 'video' | 'text' | 'quiz' | 'exercise' | 'assignment';

// Tipos de resposta da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Constantes de tipo
export const USER_ROLES = ['student', 'teacher', 'admin'] as const;
export const COURSE_DIFFICULTIES = ['Iniciante', 'Intermediário', 'Avançado'] as const;
export const LESSON_TYPES = ['video', 'text', 'quiz', 'exercise', 'assignment'] as const;