// Core Application Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  age?: number;
  ageGroup: 'child' | 'teen' | 'adult';
  theme: 'child' | 'teen' | 'adult' | 'professional' | 'dark';
  createdAt: string;
  lastActive: string;
}

export interface UserStats {
  totalXp: number;
  level: number;
  streak: number;
  completedLessons: number;
  badges: number;
  coins: number;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: number;
  completedLessons: number;
  progress: number;
  thumbnail: string;
  category: string;
  rating: number;
  enrolledUsers: number;
  isUnlocked: boolean;
  estimatedTime: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  duration: number;
  type: 'video' | 'interactive' | 'quiz' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  order: number;
  prerequisites?: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'course' | 'streak' | 'xp' | 'time' | 'social';
  points: number;
  unlockedAt?: string;
  progress: number;
  target: number;
  isCompleted: boolean;
}

export interface Notification {
  id: string;
  type: 'xp' | 'badge' | 'level' | 'streak' | 'goal' | 'achievement';
  title: string;
  message: string;
  icon?: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface GamificationData {
  user: User;
  stats: UserStats;
  badges: Badge[];
  achievements: Achievement[];
  notifications: Notification[];
  leaderboard?: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  streak: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  code?: number;
  details?: any;
}

// Component Props Types
export interface ProgressBarProps {
  progress: number;
  total?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Utility Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';