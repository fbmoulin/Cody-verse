const express = require('express');
const { dbManager } = require('./database');
const router = express.Router();

// In-memory cache for fast access
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

// Optimized dashboard endpoint
router.get('/gamification/dashboard/:userId', async (req, res) => {
  const { userId } = req.params;
  const cacheKey = `dashboard_${userId}`;
  
  try {
    // Check cache first
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Optimized query using actual database schema
    const query = `
      WITH user_data AS (
        SELECT id, name, 
               COALESCE(total_xp, 0) as total_xp,
               -- Calculate level from XP (simple progression system)
               LEAST(50, GREATEST(1, FLOOR(SQRT(COALESCE(total_xp, 0)) / 10) + 1)) as level,
               age_group,
               current_streak
        FROM users WHERE id = $1
      ),
      wallet_data AS (
        SELECT COALESCE(balance, 0) as coins,
               COALESCE(total_earned, 0) as total_coins_earned,
               COALESCE(total_spent, 0) as total_coins_spent,
               updated_at as last_updated
        FROM user_wallet WHERE user_id = $1
      ),
      streak_data AS (
        SELECT COALESCE(current_streak, 0) as current_streak,
               COALESCE(longest_streak, 0) as longest_streak,
               last_activity_date
        FROM user_streaks 
        WHERE user_id = $1 AND streak_type = 'daily_lesson'
      ),
      goals_data AS (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', id,
            'goal_type', goal_type,
            'target_value', target_value,
            'current_progress', current_progress,
            'is_completed', is_completed,
            'rewards_coins', rewards_coins,
            'rewards_xp', rewards_xp
          )
        ), '[]'::json) as goals
        FROM daily_goals 
        WHERE user_id = $1 AND goal_date = CURRENT_DATE
      ),
      notifications_data AS (
        SELECT COALESCE(json_agg(
          json_build_object(
            'id', id,
            'notification_type', notification_type,
            'title', title,
            'message', message,
            'icon', icon,
            'is_read', is_read,
            'created_at', created_at
          ) ORDER BY created_at DESC
        ), '[]'::json) as notifications
        FROM (
          SELECT * FROM gamification_notifications 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 10
        ) recent_notifications
      )
      SELECT 
        u.id, u.name, u.total_xp, u.level, u.age_group, u.current_streak,
        COALESCE(w.coins, 0) as coins,
        COALESCE(w.total_coins_earned, 0) as total_coins_earned,
        COALESCE(w.total_coins_spent, 0) as total_coins_spent,
        w.last_updated,
        COALESCE(s.current_streak, u.current_streak, 0) as streak_current,
        COALESCE(s.longest_streak, 0) as longest_streak,
        s.last_activity_date,
        g.goals,
        n.notifications
      FROM user_data u
      LEFT JOIN wallet_data w ON true
      LEFT JOIN streak_data s ON true
      LEFT JOIN goals_data g ON true
      LEFT JOIN notifications_data n ON true;
    `;

    const result = await dbManager.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const row = result.rows[0];
    
    // Calculate level progression data
    const level = parseInt(row.level) || 1;
    const currentXP = parseInt(row.total_xp) || 0;
    const xpForCurrentLevel = Math.pow((level - 1) * 10, 2);
    const xpForNextLevel = Math.pow(level * 10, 2);
    const xpToNext = xpForNextLevel - currentXP;
    const xpProgress = Math.max(0, currentXP - xpForCurrentLevel);
    
    // Determine level name and icon based on level
    const getLevelInfo = (level) => {
      if (level <= 5) return { name: 'Iniciante', icon: '🌱' };
      if (level <= 15) return { name: 'Explorador', icon: '🔍' };
      if (level <= 30) return { name: 'Aventureiro', icon: '⚔️' };
      if (level <= 45) return { name: 'Expert', icon: '🏆' };
      return { name: 'Mestre', icon: '👑' };
    };
    
    const levelInfo = getLevelInfo(level);
    
    const dashboardData = {
      success: true,
      data: {
        user: {
          id: parseInt(row.id),
          name: row.name || 'User',
          totalXP: currentXP,
          level: level,
          levelName: levelInfo.name,
          levelIcon: levelInfo.icon,
          xpToNext: Math.max(0, xpToNext),
          xpProgress: xpProgress
        },
        wallet: {
          id: parseInt(row.id),
          user_id: parseInt(row.id),
          coins: parseInt(row.coins) || 0,
          gems: 0, // Not in current schema
          total_coins_earned: parseInt(row.total_coins_earned) || 0,
          total_coins_spent: parseInt(row.total_coins_spent) || 0,
          last_updated: row.last_updated
        },
        badges: [], // Will be populated separately if needed
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
        }))
      }
    };

    // Cache the result
    setCache(cacheKey, dashboardData);
    
    res.json(dashboardData);
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Optimized lesson completion endpoint
router.post('/gamification/lesson-complete/:userId', async (req, res) => {
  const { userId } = req.params;
  const { lessonId, timeSpent, score } = req.body;
  
  try {
    const xpAwarded = Math.floor(score * 1.5) + Math.floor(timeSpent * 0.5);
    const coinsAwarded = Math.floor(xpAwarded * 0.15);
    
    // Update user progress in a single transaction
    await dbManager.query('BEGIN');
    
    // Update user XP and wallet
    await dbManager.query(`
      UPDATE users 
      SET total_xp = COALESCE(total_xp, 0) + $2,
          level = LEAST(50, GREATEST(1, FLOOR(SQRT(COALESCE(total_xp, 0) + $2) / 10) + 1))
      WHERE id = $1
    `, [userId, xpAwarded]);
    
    await dbManager.query(`
      INSERT INTO user_wallets (user_id, coins, total_coins_earned)
      VALUES ($1, $2, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        coins = user_wallets.coins + $2,
        total_coins_earned = user_wallets.total_coins_earned + $2,
        last_updated = CURRENT_TIMESTAMP
    `, [userId, coinsAwarded]);
    
    // Add notification
    await dbManager.query(`
      INSERT INTO notifications (user_id, notification_type, title, message, icon)
      VALUES ($1, 'lesson_complete', 'Lesson Completed!', $2, '✅')
    `, [userId, `Great job! You earned ${xpAwarded} XP and ${coinsAwarded} coins.`]);
    
    await dbManager.query('COMMIT');
    
    // Clear cache for this user
    cache.delete(`dashboard_${userId}`);
    
    res.json({
      success: true,
      data: {
        xpAwarded,
        coinsAwarded,
        lessonId,
        timeSpent,
        score
      }
    });
    
  } catch (error) {
    await dbManager.query('ROLLBACK');
    console.error('Lesson completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete lesson',
      error: error.message
    });
  }
});

// Optimized courses endpoint
router.get('/courses', async (req, res) => {
  const cacheKey = 'all_courses';
  
  try {
    const cached = getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await dbManager.query(`
      SELECT c.*, 
             COUNT(l.id) as lesson_count,
             COALESCE(AVG(l.difficulty_level), 1) as avg_difficulty
      FROM courses c
      LEFT JOIN lessons l ON c.id = l.course_id
      GROUP BY c.id
      ORDER BY c.order_index, c.id
      LIMIT 20
    `);
    
    const coursesData = {
      success: true,
      data: result.rows.map(course => ({
        ...course,
        lessons: parseInt(course.lesson_count) || 0,
        difficulty: course.avg_difficulty > 2 ? 'Avançado' : course.avg_difficulty > 1.5 ? 'Intermediário' : 'Iniciante'
      }))
    };
    
    setCache(cacheKey, coursesData);
    res.json(coursesData);
    
  } catch (error) {
    console.error('Courses API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load courses',
      error: error.message
    });
  }
});

// Helper function for time formatting
function getTimeAgo(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} horas atrás`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} dias atrás`;
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60000); // Clean every minute

module.exports = router;