const { pgTable, serial, text, integer, timestamp, boolean, jsonb, varchar, index } = require('drizzle-orm/pg-core');

// Session storage table for Replit Auth - REQUIRED
const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced users table for Replit Auth
const replitUsers = pgTable("replit_users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("student"), // student, teacher, admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API tokens for programmatic access
const apiTokens = pgTable("api_tokens", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").references(() => replitUsers.id),
  tokenName: varchar("token_name").notNull(),
  tokenHash: varchar("token_hash").notNull(),
  permissions: jsonb("permissions").default([]),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User roles and permissions
const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().notNull(),
  name: varchar("name").notNull().unique(),
  description: varchar("description"),
  permissions: jsonb("permissions").default([]),
  isSystemRole: boolean("is_system_role").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de usuários
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
  totalXP: integer('total_xp').default(0),
  currentStreak: integer('current_streak').default(0),
  isActive: boolean('is_active').default(true),
  profileData: jsonb('profile_data').default({})
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
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  moduleData: jsonb('module_data').default({})
});

// Tabela de lições
const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => courseModules.id),
  title: text('title').notNull(),
  type: text('lesson_type').notNull(),
  content: jsonb('content'),
  duration: text('duration'),
  xpReward: integer('xp_reward'),
  estimatedDurationMinutes: integer('estimated_duration_minutes'),
  orderIndex: integer('order_index').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Progresso do usuário por módulo
const userModuleProgress = pgTable('user_module_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  moduleId: integer('module_id').references(() => courseModules.id),
  isCompleted: boolean('is_completed').default(false),
  completionPercentage: integer('completion_percentage').default(0),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  xpEarned: integer('xp_earned').default(0),
  timeSpentMinutes: integer('time_spent_minutes').default(0)
});

// Progresso do usuário por lição
const userLessonProgress = pgTable('user_lesson_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  lessonId: integer('lesson_id').references(() => lessons.id),
  isCompleted: boolean('is_completed').default(false),
  completionPercentage: integer('completion_percentage').default(0),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  timeSpentMinutes: integer('time_spent_minutes').default(0),
  attempts: integer('attempts').default(0),
  bestScore: integer('best_score').default(0),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  progressData: jsonb('progress_data').default({})
});

// Conquistas
const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  achievementType: text('achievement_type').notNull(),
  conditions: jsonb('conditions').default({}),
  xpReward: integer('xp_reward').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Conquistas do usuário
const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  achievementId: integer('achievement_id').references(() => achievements.id),
  unlockedAt: timestamp('unlocked_at').defaultNow(),
  progressData: jsonb('progress_data').default({})
});

// Interações com Cody
const codyInteractions = pgTable('cody_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  interactionType: text('interaction_type').notNull(),
  context: text('context'),
  userMessage: text('user_message'),
  codyResponse: text('cody_response').notNull(),
  sentimentScore: integer('sentiment_score'),
  interactionData: jsonb('interaction_data').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

// Sessões de aprendizado
const learningSessions = pgTable('learning_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionStart: timestamp('session_start').defaultNow(),
  sessionEnd: timestamp('session_end'),
  totalMinutes: integer('total_minutes').default(0),
  lessonsCompleted: integer('lessons_completed').default(0),
  xpEarned: integer('xp_earned').default(0),
  sessionData: jsonb('session_data').default({})
});

// Sistema de Níveis
const userLevels = pgTable('user_levels', {
  id: serial('id').primaryKey(),
  level: integer('level').notNull().unique(),
  levelName: text('level_name').notNull(),
  xpRequired: integer('xp_required').notNull(),
  description: text('description'),
  rewards: jsonb('rewards').default({}),
  icon: text('icon'),
  color: text('color'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});

// Badges do Sistema
const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // study, achievement, streak, social, special
  icon: text('icon').notNull(),
  rarity: text('rarity').notNull(), // common, rare, epic, legendary
  color: text('color').default('#3498db'),
  conditions: jsonb('conditions').notNull(),
  xpReward: integer('xp_reward').default(0),
  coinsReward: integer('coins_reward').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Badges dos Usuários
const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  badgeId: integer('badge_id').references(() => badges.id),
  earnedAt: timestamp('earned_at').defaultNow(),
  progress: jsonb('progress').default({}),
  isVisible: boolean('is_visible').default(true),
  notificationSent: boolean('notification_sent').default(false)
});

// Sistema de Moedas/Pontos
const userWallet = pgTable('user_wallet', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).unique(),
  coins: integer('coins').default(0),
  gems: integer('gems').default(0),
  totalCoinsEarned: integer('total_coins_earned').default(0),
  totalCoinsSpent: integer('total_coins_spent').default(0),
  lastUpdated: timestamp('last_updated').defaultNow()
});

// Transações de Moedas
const coinTransactions = pgTable('coin_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  transactionType: text('transaction_type').notNull(), // earned, spent, bonus, penalty
  amount: integer('amount').notNull(),
  reason: text('reason').notNull(),
  source: text('source'), // lesson_complete, badge_earned, daily_bonus, store_purchase
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

// Streaks de Aprendizado
const userStreaks = pgTable('user_streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  streakType: text('streak_type').notNull(), // daily_login, daily_lesson, weekly_goal
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: timestamp('last_activity_date'),
  streakStartDate: timestamp('streak_start_date'),
  freezesUsed: integer('freezes_used').default(0),
  freezesAvailable: integer('freezes_available').default(2),
  metadata: jsonb('metadata').default({})
});

// Objetivos Diários/Semanais
const userGoals = pgTable('user_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  goalType: text('goal_type').notNull(), // daily, weekly, monthly
  goalCategory: text('goal_category').notNull(), // lessons, time, xp, streak
  targetValue: integer('target_value').notNull(),
  currentProgress: integer('current_progress').default(0),
  isCompleted: boolean('is_completed').default(false),
  goalDate: timestamp('goal_date').notNull(),
  completedAt: timestamp('completed_at'),
  rewards: jsonb('rewards').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

// Loja Virtual
const storeItems = pgTable('store_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // themes, avatars, streak_freeze, power_ups
  itemType: text('item_type').notNull(), // consumable, permanent, subscription
  price: integer('price').notNull(),
  currency: text('currency').default('coins'), // coins, gems, real_money
  icon: text('icon'),
  rarity: text('rarity').default('common'),
  isActive: boolean('is_active').default(true),
  limitPerUser: integer('limit_per_user'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow()
});

// Itens Comprados pelos Usuários
const userPurchases = pgTable('user_purchases', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  itemId: integer('item_id').references(() => storeItems.id),
  quantity: integer('quantity').default(1),
  totalPrice: integer('total_price').notNull(),
  currency: text('currency').notNull(),
  purchaseDate: timestamp('purchase_date').defaultNow(),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata').default({})
});

// Sistema de Ranking/Leaderboard
const leaderboards = pgTable('leaderboards', {
  id: serial('id').primaryKey(),
  leaderboardType: text('leaderboard_type').notNull(), // weekly_xp, monthly_streak, all_time_points
  timeframe: text('timeframe').notNull(), // daily, weekly, monthly, all_time
  userId: integer('user_id').references(() => users.id),
  score: integer('score').notNull(),
  rank: integer('rank'),
  previousRank: integer('previous_rank'),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Notifications do Sistema de Gamificação
const gamificationNotifications = pgTable('gamification_notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  notificationType: text('notification_type').notNull(), // badge_earned, level_up, streak_milestone, goal_completed
  title: text('title').notNull(),
  message: text('message').notNull(),
  icon: text('icon'),
  isRead: boolean('is_read').default(false),
  actionRequired: boolean('action_required').default(false),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  readAt: timestamp('read_at')
});

module.exports = {
  // Replit Auth tables
  sessions,
  replitUsers,
  apiTokens,
  userRoles,
  // Original tables
  users,
  courseModules,
  lessons,
  userModuleProgress,
  userLessonProgress,
  achievements,
  userAchievements,
  codyInteractions,
  learningSessions,
  userLevels,
  badges,
  userBadges,
  userWallet,
  coinTransactions,
  userStreaks,
  userGoals,
  storeItems,
  userPurchases,
  leaderboards,
  gamificationNotifications
};