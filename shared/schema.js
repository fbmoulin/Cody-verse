const { pgTable, serial, text, integer, timestamp, boolean, jsonb } = require('drizzle-orm/pg-core');

// Tabela de usuários
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  totalXP: integer('total_xp').default(0),
  currentStreak: integer('current_streak').default(0),
  isActive: boolean('is_active').default(true)
});

// Tabela de módulos do curso
const courseModules = pgTable('course_modules', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  difficulty: text('difficulty').notNull(),
  duration: text('duration').notNull(),
  totalXP: integer('total_xp').notNull(),
  orderIndex: integer('order_index').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Tabela de lições
const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => courseModules.id),
  title: text('title').notNull(),
  type: text('type').notNull(),
  content: jsonb('content'),
  duration: text('duration'),
  xpReward: integer('xp_reward'),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Progresso do usuário por módulo
const userModuleProgress = pgTable('user_module_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  moduleId: integer('module_id').references(() => courseModules.id),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  xpEarned: integer('xp_earned').default(0),
  startedAt: timestamp('started_at').defaultNow()
});

// Progresso do usuário por lição
const userLessonProgress = pgTable('user_lesson_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  lessonId: integer('lesson_id').references(() => lessons.id),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  timeSpent: integer('time_spent_minutes').default(0),
  attempts: integer('attempts').default(0),
  bestScore: integer('best_score').default(0),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow()
});

// Conquistas
const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  condition: jsonb('condition'),
  xpReward: integer('xp_reward').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Conquistas do usuário
const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  achievementId: integer('achievement_id').references(() => achievements.id),
  unlockedAt: timestamp('unlocked_at').defaultNow()
});

// Interações com Cody
const codyInteractions = pgTable('cody_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  interactionType: text('interaction_type').notNull(),
  context: text('context'),
  userMessage: text('user_message'),
  codyResponse: text('cody_response'),
  timestamp: timestamp('timestamp').defaultNow()
});

// Sessões de aprendizado
const learningSessions = pgTable('learning_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at'),
  totalMinutes: integer('total_minutes').default(0),
  lessonsCompleted: integer('lessons_completed').default(0),
  xpEarned: integer('xp_earned').default(0)
});

module.exports = {
  users,
  courseModules,
  lessons,
  userModuleProgress,
  userLessonProgress,
  achievements,
  userAchievements,
  codyInteractions,
  learningSessions
};