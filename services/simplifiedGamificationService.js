const { dbManager } = require('../server/database');

class SimplifiedGamificationService {
  constructor() {
    this.initialized = false;
    this.initializationPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializationPromise) return this.initializationPromise;
    
    this.initializationPromise = this._performInitialization();
    await this.initializationPromise;
  }

  async _performInitialization() {
    
    try {
      const client = await dbManager.pool.connect();
      
      // Create essential gamification tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_wallet (
          id SERIAL PRIMARY KEY,
          user_id INTEGER UNIQUE,
          coins INTEGER DEFAULT 0,
          gems INTEGER DEFAULT 0,
          total_coins_earned INTEGER DEFAULT 0,
          total_coins_spent INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          badge_name TEXT NOT NULL,
          badge_description TEXT,
          badge_icon TEXT,
          badge_category TEXT,
          earned_at TIMESTAMP DEFAULT NOW(),
          xp_reward INTEGER DEFAULT 0,
          coins_reward INTEGER DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_streaks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          streak_type TEXT DEFAULT 'daily_lesson',
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_activity_date TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS daily_goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          goal_type TEXT NOT NULL,
          target_value INTEGER NOT NULL,
          current_progress INTEGER DEFAULT 0,
          is_completed BOOLEAN DEFAULT FALSE,
          goal_date DATE DEFAULT CURRENT_DATE,
          rewards_coins INTEGER DEFAULT 0,
          rewards_xp INTEGER DEFAULT 0
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS gamification_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          notification_type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          icon TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      client.release();
      this.initialized = true;
      this.initializationPromise = null;
      console.log('Simplified gamification tables initialized');
      
    } catch (error) {
      console.error('Error initializing gamification tables:', error);
      this.initializationPromise = null;
      throw error;
    }
  }

  async getUserDashboard(userId) {
    // Only initialize once
    if (!this.initialized) {
      await this.initialize();
    }
    const client = await dbManager.pool.connect();
    
    try {
      // Single optimized query to get/create user and initialize gamification data
      const userResult = await client.query(`
        WITH user_upsert AS (
          INSERT INTO users (id, email, name, total_xp, is_active, profile_data) 
          VALUES ($1, $2, $3, 0, true, $4)
          ON CONFLICT (id) DO NOTHING
          RETURNING *
        ),
        wallet_upsert AS (
          INSERT INTO user_wallet (user_id, coins, gems)
          VALUES ($1, 0, 0)
          ON CONFLICT (user_id) DO NOTHING
          RETURNING *
        ),
        streak_upsert AS (
          INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak)
          VALUES ($1, 'daily_lesson', 0, 0)
          ON CONFLICT (user_id, streak_type) DO NOTHING
          RETURNING *
        )
        SELECT * FROM users WHERE id = $1
      `, [userId, `user${userId}@codyverse.edu`, `User ${userId}`, '{"preferences": {"language": "pt-BR"}}']);
      
      const user = userResult.rows[0];

      // Optimized parallel queries for better performance
      const [walletResult, streakResult, goalsResult] = await Promise.all([
        client.query('SELECT * FROM user_wallet WHERE user_id = $1', [userId]),
        client.query('SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2', [userId, 'daily_lesson']),
        client.query('SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = CURRENT_DATE', [userId])
      ]);

      const wallet = walletResult.rows[0] || { coins: 0, gems: 0, total_coins_earned: 0, total_coins_spent: 0 };
      const streak = streakResult.rows[0] || { current_streak: 0, longest_streak: 0, last_activity_date: new Date() };
      let goals = goalsResult.rows;

      // Create default goals if none exist (optimized)
      if (goals.length === 0) {
        goals = await this.createDailyGoalsOptimized(userId, client);
      }

      // Get notifications efficiently
      const notificationsResult = await client.query(`
        SELECT id, user_id, notification_type, title, message, icon, is_read, created_at
        FROM gamification_notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 10
      `, [userId]);
      
      const notifications = notificationsResult.rows;

      // Calculate level based on XP
      const currentXP = user.total_xp || 0;
      const level = this.calculateLevel(currentXP);

      return {
        user: {
          id: user.id,
          name: user.name,
          totalXP: currentXP,
          level: level.level,
          levelName: level.name,
          levelIcon: level.icon,
          xpToNext: level.xpToNext,
          xpProgress: level.progress
        },
        wallet,
        badges: await this.getCachedUserBadges(userId, client),
        streak,
        goals,
        notifications: notifications.map(n => ({
          ...n,
          timeAgo: this.getTimeAgo(n.created_at)
        }))
      };

    } catch (error) {
      console.error('Error getting user dashboard:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureUserGamificationData(userId, client) {
    // Batch initialize all gamification data in a single transaction
    await client.query(`
      WITH wallet_insert AS (
        INSERT INTO user_wallet (user_id, coins, gems)
        VALUES ($1, 0, 0)
        ON CONFLICT (user_id) DO NOTHING
        RETURNING user_id
      ),
      streak_insert AS (
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak)
        VALUES ($1, 'daily_lesson', 0, 0)
        ON CONFLICT (user_id, streak_type) DO NOTHING
        RETURNING user_id
      )
      SELECT 1
    `, [userId]);
  }

  async createDailyGoals(userId, client) {
    const defaultGoals = [
      { type: 'lessons', target: 3, rewardCoins: 50, rewardXP: 100 },
      { type: 'time_minutes', target: 30, rewardCoins: 30, rewardXP: 75 },
      { type: 'xp', target: 200, rewardCoins: 40, rewardXP: 0 }
    ];

    for (const goal of defaultGoals) {
      await client.query(`
        INSERT INTO daily_goals (user_id, goal_type, target_value, rewards_coins, rewards_xp)
        VALUES ($1, $2, $3, $4, $5)
      `, [userId, goal.type, goal.target, goal.rewardCoins, goal.rewardXP]);
    }
  }

  async createDailyGoalsOptimized(userId, client) {
    const result = await client.query(`
      INSERT INTO daily_goals (user_id, goal_type, target_value, rewards_coins, rewards_xp)
      VALUES 
        ($1, 'lessons', 3, 50, 100),
        ($1, 'time_minutes', 30, 30, 75),
        ($1, 'xp', 200, 40, 0)
      RETURNING *
    `, [userId]);
    return result.rows;
  }

  async getCachedUserBadges(userId, client) {
    const result = await client.query(`
      SELECT 
        id, badge_name as "badgeName", badge_description as "badgeDescription",
        badge_icon as "badgeIcon", 'achievement' as "badgeType", 
        earned_at as "unlockedAt"
      FROM user_badges 
      WHERE user_id = $1 
      ORDER BY earned_at DESC
      LIMIT 10
    `, [userId]);

    return result.rows;
  }

  async processLessonCompletion(userId, lessonId, timeSpent = 15, score = 100) {
    await this.initialize();
    const client = await dbManager.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Award base XP and coins
      const baseXP = 100;
      const bonusXP = Math.floor(score * 0.5);
      const totalXP = baseXP + bonusXP;
      const coinsEarned = Math.floor(totalXP / 10) + 10;

      // Update user total XP
      await client.query(
        'UPDATE users SET total_xp = COALESCE(total_xp, 0) + $1 WHERE id = $2',
        [totalXP, userId]
      );

      // Update wallet
      await client.query(`
        UPDATE user_wallet 
        SET coins = coins + $1, total_coins_earned = total_coins_earned + $1
        WHERE user_id = $2
      `, [coinsEarned, userId]);

      // Update streak
      await this.updateStreak(userId, client);

      // Update goals progress
      await this.updateGoalsProgress(userId, 1, timeSpent, totalXP, client);

      // Check for new badges
      const newBadges = await this.checkAndAwardBadges(userId, client);

      // Create completion notification
      await client.query(`
        INSERT INTO gamification_notifications (user_id, notification_type, title, message, icon)
        VALUES ($1, 'lesson_complete', 'Lesson Completed!', $2, '✅')
      `, [userId, `Great job! You earned ${totalXP} XP and ${coinsEarned} coins.`]);

      await client.query('COMMIT');

      return {
        xpAwarded: totalXP,
        coinsAwarded: coinsEarned,
        newBadges,
        streakUpdated: true
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing lesson completion:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStreak(userId, client) {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    const streakResult = await client.query(
      'SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2',
      [userId, 'daily_lesson']
    );

    if (streakResult.rows.length === 0) {
      await client.query(`
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak)
        VALUES ($1, 'daily_lesson', 1, 1)
      `, [userId]);
      return 1;
    }

    const streak = streakResult.rows[0];
    const lastActivity = new Date(streak.last_activity_date).toDateString();

    if (lastActivity === today) {
      return streak.current_streak;
    } else if (lastActivity === yesterday) {
      const newStreak = streak.current_streak + 1;
      const newLongest = Math.max(newStreak, streak.longest_streak);
      
      await client.query(`
        UPDATE user_streaks 
        SET current_streak = $1, longest_streak = $2, last_activity_date = NOW()
        WHERE id = $3
      `, [newStreak, newLongest, streak.id]);

      // Check for streak milestones
      if (newStreak % 7 === 0) {
        await client.query(`
          INSERT INTO gamification_notifications (user_id, notification_type, title, message, icon)
          VALUES ($1, 'streak_milestone', 'Streak Milestone!', $2, '🔥')
        `, [userId, `Amazing! You've maintained your learning streak for ${newStreak} days!`]);
      }

      return newStreak;
    } else {
      await client.query(`
        UPDATE user_streaks 
        SET current_streak = 1, last_activity_date = NOW()
        WHERE id = $1
      `, [streak.id]);
      return 1;
    }
  }

  async updateGoalsProgress(userId, lessonsCompleted, timeSpent, xpEarned, client) {
    const goals = await client.query(
      'SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = CURRENT_DATE AND is_completed = FALSE',
      [userId]
    );

    for (const goal of goals.rows) {
      let progressToAdd = 0;
      
      switch (goal.goal_type) {
        case 'lessons':
          progressToAdd = lessonsCompleted;
          break;
        case 'time_minutes':
          progressToAdd = timeSpent;
          break;
        case 'xp':
          progressToAdd = xpEarned;
          break;
      }

      const newProgress = goal.current_progress + progressToAdd;
      const isCompleted = newProgress >= goal.target_value;

      await client.query(`
        UPDATE daily_goals 
        SET current_progress = $1, is_completed = $2
        WHERE id = $3
      `, [Math.min(newProgress, goal.target_value), isCompleted, goal.id]);

      if (isCompleted && !goal.is_completed) {
        // Award goal completion rewards
        if (goal.rewards_coins > 0) {
          await client.query(`
            UPDATE user_wallet 
            SET coins = coins + $1, total_coins_earned = total_coins_earned + $1
            WHERE user_id = $2
          `, [goal.rewards_coins, userId]);
        }

        if (goal.rewards_xp > 0) {
          await client.query(
            'UPDATE users SET total_xp = COALESCE(total_xp, 0) + $1 WHERE id = $2',
            [goal.rewards_xp, userId]
          );
        }

        // Create goal completion notification
        await client.query(`
          INSERT INTO gamification_notifications (user_id, notification_type, title, message, icon)
          VALUES ($1, 'goal_completed', 'Goal Completed!', $2, '🎯')
        `, [userId, `You completed your daily ${goal.goal_type} goal!`]);
      }
    }
  }

  async checkAndAwardBadges(userId, client) {
    const newBadges = [];

    // Get user lesson completion count
    const lessonsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM user_lesson_progress 
      WHERE user_id = $1 AND is_completed = TRUE
    `, [userId]);
    
    const lessonsCompleted = parseInt(lessonsResult.rows[0]?.count || 0);

    // Get current streak
    const streakResult = await client.query(`
      SELECT current_streak 
      FROM user_streaks 
      WHERE user_id = $1 AND streak_type = 'daily_lesson'
    `, [userId]);
    
    const currentStreak = streakResult.rows[0]?.current_streak || 0;

    // Define badge conditions
    const badgeConditions = [
      { name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', condition: lessonsCompleted >= 1, xp: 50, coins: 10 },
      { name: 'Knowledge Seeker', description: 'Complete 10 lessons', icon: '📚', condition: lessonsCompleted >= 10, xp: 200, coins: 50 },
      { name: 'Learning Master', description: 'Complete 25 lessons', icon: '🎓', condition: lessonsCompleted >= 25, xp: 500, coins: 150 },
      { name: 'Consistent Learner', description: 'Maintain a 7-day learning streak', icon: '🔥', condition: currentStreak >= 7, xp: 300, coins: 75 },
      { name: 'Dedication', description: 'Maintain a 15-day learning streak', icon: '💎', condition: currentStreak >= 15, xp: 600, coins: 150 }
    ];

    for (const badge of badgeConditions) {
      if (badge.condition) {
        // Check if user already has this badge
        const existingBadge = await client.query(
          'SELECT id FROM user_badges WHERE user_id = $1 AND badge_name = $2',
          [userId, badge.name]
        );

        if (existingBadge.rows.length === 0) {
          // Award the badge
          await client.query(`
            INSERT INTO user_badges (user_id, badge_name, badge_description, badge_icon, xp_reward, coins_reward)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [userId, badge.name, badge.description, badge.icon, badge.xp, badge.coins]);

          // Award rewards
          await client.query(`
            UPDATE user_wallet 
            SET coins = coins + $1, total_coins_earned = total_coins_earned + $1
            WHERE user_id = $2
          `, [badge.coins, userId]);

          await client.query(
            'UPDATE users SET total_xp = COALESCE(total_xp, 0) + $1 WHERE id = $2',
            [badge.xp, userId]
          );

          // Create badge notification
          await client.query(`
            INSERT INTO gamification_notifications (user_id, notification_type, title, message, icon)
            VALUES ($1, 'badge_earned', 'New Badge Earned!', $2, $3)
          `, [userId, `You've earned the "${badge.name}" badge! ${badge.description}`, badge.icon]);

          newBadges.push(badge);
        }
      }
    }

    return newBadges;
  }

  calculateLevel(xp) {
    const levels = [
      { level: 1, name: 'Iniciante Curioso', icon: '🌱', xpRequired: 0 },
      { level: 2, name: 'Explorador Digital', icon: '🔍', xpRequired: 100 },
      { level: 3, name: 'Aprendiz de Código', icon: '📝', xpRequired: 300 },
      { level: 4, name: 'Programador Novato', icon: '💻', xpRequired: 600 },
      { level: 5, name: 'Desenvolvedor Iniciante', icon: '🚀', xpRequired: 1000 },
      { level: 6, name: 'Codificador Experiente', icon: '⚡', xpRequired: 1500 },
      { level: 7, name: 'Mestre do Algoritmo', icon: '🧠', xpRequired: 2100 },
      { level: 8, name: 'Arquiteto de Software', icon: '🏗️', xpRequired: 2800 },
      { level: 9, name: 'Ninja do Código', icon: '🥷', xpRequired: 3600 },
      { level: 10, name: 'Lenda da Programação', icon: '👑', xpRequired: 4500 }
    ];

    let currentLevel = levels[0];
    let nextLevel = levels[1];

    for (let i = 0; i < levels.length - 1; i++) {
      if (xp >= levels[i].xpRequired && xp < levels[i + 1].xpRequired) {
        currentLevel = levels[i];
        nextLevel = levels[i + 1];
        break;
      } else if (xp >= levels[levels.length - 1].xpRequired) {
        currentLevel = levels[levels.length - 1];
        nextLevel = levels[levels.length - 1];
        break;
      }
    }

    const xpToNext = nextLevel ? nextLevel.xpRequired - xp : 0;
    const xpInCurrentLevel = xp - currentLevel.xpRequired;
    const xpForCurrentLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1;
    const progress = nextLevel ? Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100) : 100;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      icon: currentLevel.icon,
      xpToNext: Math.max(0, xpToNext),
      progress: Math.max(0, Math.min(100, progress)),
      currentLevelXP: xpInCurrentLevel,
      nextLevelXP: nextLevel ? nextLevel.xpRequired : xp,
      totalXP: xp
    };
  }

  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} minutos atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} horas atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} dias atrás`;
  }
}

module.exports = new SimplifiedGamificationService();