const express = require('express');
const { dbManager } = require('./database');
const router = express.Router();

// Optimized cache with memory management
class OptimizedCache {
  constructor(defaultTTL = 30000) {
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = defaultTTL;
    this.hitCount = 0;
    this.missCount = 0;
  }

  set(key, value, ttl = this.defaultTTL) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);
    
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);
    
    this.timers.set(key, timer);
  }

  get(key) {
    if (this.cache.has(key)) {
      this.hitCount++;
      return this.cache.get(key);
    }
    this.missCount++;
    return null;
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hits: this.hitCount,
      misses: this.missCount
    };
  }
}

const cache = new OptimizedCache(30000);

// Level calculation utilities
const LevelCalculator = {
  calculateLevel(totalXP) {
    if (totalXP < 100) return 1;
    if (totalXP < 500) return Math.floor(2 + (totalXP - 100) / 100);
    if (totalXP < 1500) return Math.floor(6 + (totalXP - 500) / 200);
    if (totalXP < 5000) return Math.floor(11 + (totalXP - 1500) / 350);
    return Math.min(50, Math.floor(21 + (totalXP - 5000) / 500));
  },

  getLevelInfo(level) {
    if (level <= 5) return { name: 'Iniciante', icon: '🌱', color: '#10B981' };
    if (level <= 15) return { name: 'Explorador', icon: '🔍', color: '#22D3EE' };
    if (level <= 30) return { name: 'Aventureiro', icon: '⚔️', color: '#F59E0B' };
    if (level <= 45) return { name: 'Expert', icon: '🏆', color: '#8B5CF6' };
    return { name: 'Mestre', icon: '👑', color: '#EF4444' };
  },

  calculateXPForLevel(level) {
    if (level <= 1) return 0;
    if (level <= 5) return 100 + (level - 2) * 100;
    if (level <= 10) return 500 + (level - 6) * 200;
    if (level <= 20) return 1500 + (level - 11) * 350;
    return 5000 + (level - 21) * 500;
  },

  getProgressToNextLevel(totalXP, currentLevel) {
    const currentLevelXP = this.calculateXPForLevel(currentLevel);
    const nextLevelXP = this.calculateXPForLevel(currentLevel + 1);
    const progress = Math.max(0, totalXP - currentLevelXP);
    const required = nextLevelXP - currentLevelXP;
    
    return {
      progress,
      required,
      percentage: Math.min(100, (progress / required) * 100)
    };
  }
};

// Corrected database queries using actual schema
class QueryOptimizer {
  static async getDashboardData(userId) {
    const query = `
      WITH user_data AS (
        SELECT 
          id, 
          name, 
          COALESCE(total_xp, 0) as total_xp,
          age_group,
          current_streak
        FROM users 
        WHERE id = $1
      ),
      wallet_data AS (
        SELECT 
          COALESCE(coins, 0) as coins,
          COALESCE(gems, 0) as gems,
          COALESCE(total_coins_earned, 0) as total_coins_earned,
          COALESCE(total_coins_spent, 0) as total_coins_spent,
          last_updated
        FROM user_wallet 
        WHERE user_id = $1
      ),
      streak_data AS (
        SELECT 
          COALESCE(current_streak, 0) as current_streak,
          COALESCE(longest_streak, 0) as longest_streak,
          last_activity_date
        FROM user_streaks 
        WHERE user_id = $1 AND streak_type = 'daily_lesson'
        LIMIT 1
      ),
      goals_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'goal_type', goal_type,
              'target_value', target_value,
              'current_progress', current_progress,
              'is_completed', is_completed,
              'rewards_coins', rewards_coins,
              'rewards_xp', rewards_xp
            ) ORDER BY created_at
          ), '[]'::json
        ) as goals
        FROM daily_goals 
        WHERE user_id = $1 AND goal_date = CURRENT_DATE
      ),
      notifications_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'notification_type', notification_type,
              'title', title,
              'message', message,
              'icon', icon,
              'is_read', is_read,
              'created_at', created_at
            ) ORDER BY created_at DESC
          ), '[]'::json
        ) as notifications
        FROM (
          SELECT * FROM gamification_notifications 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 5
        ) recent_notifications
      ),
      badges_data AS (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'name', badge_name,
              'description', badge_description,
              'icon', badge_icon,
              'category', badge_category,
              'unlocked_at', earned_at,
              'is_locked', false
            ) ORDER BY earned_at DESC
          ), '[]'::json
        ) as badges
        FROM user_badges
        WHERE user_id = $1
        LIMIT 6
      )
      SELECT 
        u.id, u.name, u.total_xp, u.age_group, u.current_streak,
        COALESCE(w.coins, 0) as coins,
        COALESCE(w.gems, 0) as gems,
        COALESCE(w.total_coins_earned, 0) as total_coins_earned,
        COALESCE(w.total_coins_spent, 0) as total_coins_spent,
        w.last_updated as wallet_updated,
        COALESCE(s.current_streak, u.current_streak, 0) as streak_current,
        COALESCE(s.longest_streak, 0) as longest_streak,
        s.last_activity_date,
        g.goals,
        n.notifications,
        b.badges
      FROM user_data u
      LEFT JOIN wallet_data w ON true
      LEFT JOIN streak_data s ON true
      LEFT JOIN goals_data g ON true
      LEFT JOIN notifications_data n ON true
      LEFT JOIN badges_data b ON true;
    `;

    return await dbManager.query(query, [userId]);
  }

  static async getCoursesData() {
    const query = `
      SELECT 
        cm.id, 
        cm.title, 
        cm.description, 
        cm.difficulty, 
        cm.duration, 
        cm.total_xp, 
        cm.order_index, 
        cm.is_active,
        COUNT(l.id) as lesson_count
      FROM course_modules cm
      LEFT JOIN lessons l ON cm.id = l.module_id
      WHERE cm.is_active = true
      GROUP BY cm.id, cm.title, cm.description, cm.difficulty, 
               cm.duration, cm.total_xp, cm.order_index, cm.is_active
      ORDER BY cm.order_index NULLS LAST, cm.id
      LIMIT 20;
    `;

    return await dbManager.query(query);
  }

  static async getBadgesData(userId) {
    const query = `
      WITH unlocked_badges AS (
        SELECT 
          id,
          badge_name as name,
          badge_description as description,
          badge_icon as icon,
          'common' as rarity,
          badge_category as category,
          earned_at as unlocked_at,
          false as is_locked
        FROM user_badges
        WHERE user_id = $1
      ),
      sample_locked_badges AS (
        SELECT 
          ROW_NUMBER() OVER (ORDER BY RANDOM()) as id,
          'Conquista Futura' as name,
          'Continue aprendendo para desbloquear!' as description,
          '🔒' as icon,
          'common' as rarity,
          'achievement' as category,
          null as unlocked_at,
          true as is_locked
        FROM generate_series(1, 5)
      )
      SELECT * FROM unlocked_badges
      UNION ALL
      SELECT * FROM sample_locked_badges
      ORDER BY is_locked, unlocked_at DESC NULLS LAST;
    `;

    return await dbManager.query(query, [userId]);
  }
}

// Enhanced dashboard endpoint
router.get('/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  const cacheKey = `dashboard_${userId}`;
  
  try {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await QueryOptimizer.getDashboardData(userId);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const row = result.rows[0];
    
    // Calculate level and progress
    const totalXP = parseInt(row.total_xp) || 0;
    const level = LevelCalculator.calculateLevel(totalXP);
    const levelInfo = LevelCalculator.getLevelInfo(level);
    const progressInfo = LevelCalculator.getProgressToNextLevel(totalXP, level);
    
    const dashboardData = {
      success: true,
      data: {
        user: {
          id: parseInt(row.id),
          name: row.name || `User ${row.id}`,
          totalXP,
          level,
          levelName: levelInfo.name,
          levelIcon: levelInfo.icon,
          levelColor: levelInfo.color,
          xpToNext: progressInfo.required - progressInfo.progress,
          xpProgress: progressInfo.progress,
          progressPercentage: Math.round(progressInfo.percentage),
          ageGroup: row.age_group
        },
        wallet: {
          id: parseInt(row.id),
          user_id: parseInt(row.id),
          coins: parseInt(row.coins) || 0,
          gems: parseInt(row.gems) || 0,
          total_coins_earned: parseInt(row.total_coins_earned) || 0,
          total_coins_spent: parseInt(row.total_coins_spent) || 0,
          last_updated: row.wallet_updated
        },
        streak: {
          id: parseInt(row.id),
          user_id: parseInt(row.id),
          streak_type: 'daily_lesson',
          current_streak: parseInt(row.streak_current) || 0,
          longest_streak: parseInt(row.longest_streak) || 0,
          last_activity_date: row.last_activity_date
        },
        goals: row.goals || [],
        notifications: (row.notifications || []).map(n => ({
          ...n,
          timeAgo: getTimeAgo(n.created_at)
        })),
        badges: row.badges || []
      },
      meta: {
        cached: false,
        timestamp: new Date().toISOString(),
        performanceOptimized: true
      }
    };

    cache.set(cacheKey, dashboardData);
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enhanced courses endpoint
router.get('/courses', async (req, res) => {
  const cacheKey = 'courses_all';
  
  try {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await QueryOptimizer.getCoursesData();
    
    const coursesData = {
      success: true,
      data: result.rows.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        duration: course.duration,
        total_xp: course.total_xp,
        lesson_count: parseInt(course.lesson_count) || 0,
        is_active: course.is_active,
        order_index: course.order_index
      })),
      meta: {
        total: result.rows.length,
        cached: false,
        timestamp: new Date().toISOString()
      }
    };
    
    cache.set(cacheKey, coursesData);
    res.json(coursesData);
    
  } catch (error) {
    console.error('Courses API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load courses'
    });
  }
});

// Enhanced badges endpoint
router.get('/badges/:userId', async (req, res) => {
  const { userId } = req.params;
  const cacheKey = `badges_${userId}`;
  
  try {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await QueryOptimizer.getBadgesData(userId);
    
    const badgesData = {
      success: true,
      data: result.rows.map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        category: badge.category,
        unlocked_at: badge.unlocked_at,
        is_locked: badge.is_locked,
        timeAgo: badge.unlocked_at ? getTimeAgo(badge.unlocked_at) : null
      })),
      meta: {
        total: result.rows.length,
        unlocked: result.rows.filter(b => !b.is_locked).length,
        locked: result.rows.filter(b => b.is_locked).length,
        cached: false,
        timestamp: new Date().toISOString()
      }
    };
    
    cache.set(cacheKey, badgesData);
    res.json(badgesData);
    
  } catch (error) {
    console.error('Badges API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load badges'
    });
  }
});

// Enhanced lesson completion
router.post('/lesson-complete/:userId', async (req, res) => {
  const { userId } = req.params;
  const { lessonId = 1, timeSpent = 300, score = 85, moduleId } = req.body;
  
  try {
    const baseXP = Math.floor(score * 1.2) + Math.floor(timeSpent * 0.3);
    const timeBonus = timeSpent > 600 ? 50 : timeSpent > 300 ? 25 : 0;
    const scoreBonus = score >= 90 ? 100 : score >= 80 ? 50 : score >= 70 ? 25 : 0;
    const xpAwarded = baseXP + timeBonus + scoreBonus;
    const coinsAwarded = Math.floor(xpAwarded * 0.15);

    await dbManager.query('BEGIN');

    // Update user XP
    const userUpdate = await dbManager.query(`
      UPDATE users 
      SET total_xp = COALESCE(total_xp, 0) + $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING total_xp
    `, [userId, xpAwarded]);

    // Update wallet
    await dbManager.query(`
      INSERT INTO user_wallet (user_id, coins, total_coins_earned)
      VALUES ($1, $2, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        coins = user_wallet.coins + $2,
        total_coins_earned = user_wallet.total_coins_earned + $2,
        last_updated = CURRENT_TIMESTAMP
    `, [userId, coinsAwarded]);

    // Add notification
    await dbManager.query(`
      INSERT INTO gamification_notifications (user_id, notification_type, title, message, icon)
      VALUES ($1, 'lesson_complete', 'Lição Concluída!', $2, '✅')
    `, [userId, `Parabéns! Você ganhou ${xpAwarded} XP e ${coinsAwarded} moedas.`]);

    await dbManager.query('COMMIT');

    // Clear cache
    cache.set(`dashboard_${userId}`, null, 0);

    const newTotalXP = userUpdate.rows[0]?.total_xp || 0;
    const newLevel = LevelCalculator.calculateLevel(newTotalXP);
    
    res.json({
      success: true,
      data: {
        xpAwarded,
        coinsAwarded,
        bonuses: {
          time: timeBonus,
          score: scoreBonus
        },
        lessonId,
        timeSpent,
        score,
        newLevel,
        newTotalXP,
        message: `Excelente! Você ganhou ${xpAwarded} XP e ${coinsAwarded} moedas!`
      }
    });
    
  } catch (error) {
    await dbManager.query('ROLLBACK');
    console.error('Lesson completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lesson'
    });
  }
});

// Cache stats endpoint
router.get('/cache-stats', (req, res) => {
  res.json({
    success: true,
    data: cache.getStats()
  });
});

// Utility function for time formatting
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} dias atrás`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} semanas atrás`;
}

module.exports = router;