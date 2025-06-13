const { dbManager } = require('../server/database');
const NotificationManager = require('../core/NotificationManager');
const BaseService = require('../core/BaseService');

class RefactoredGamificationService extends BaseService {
  constructor() {
    super('RefactoredGamificationService');
    this.notificationManager = new NotificationManager();
    this.rewardCalculator = new RewardCalculator();
    this.achievementProcessor = new AchievementProcessor();
    this.levelManager = new LevelManager();
  }

  async processLessonCompletion(userId, lessonData) {
    return this.executeWithMetrics(async () => {
      const client = await dbManager.pool.connect();
      
      try {
        await client.query('BEGIN');

        // Calculate base rewards
        const rewards = this.rewardCalculator.calculateRewards(lessonData);
        
        // Update user progress
        await this.updateUserData(client, userId, rewards);
        
        // Process achievements and level ups
        const achievements = await this.achievementProcessor.process(client, userId, lessonData, rewards);
        
        // Generate notification queue
        const notifications = this.notificationManager.generateNotificationQueue({
          ...rewards,
          ...achievements
        });

        await client.query('COMMIT');
        
        return {
          success: true,
          data: {
            ...rewards,
            ...achievements,
            notifications
          }
        };
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }, 'processLessonCompletion');
  }

  async getDashboard(userId) {
    return this.executeWithCache(`dashboard_${userId}`, async () => {
      const client = await dbManager.pool.connect();
      
      try {
        // Parallel data fetching for better performance
        const [userResult, walletResult, badgesResult, streakResult, goalsResult] = await Promise.all([
          client.query('SELECT * FROM users WHERE id = $1', [userId]),
          client.query('SELECT * FROM user_wallet WHERE user_id = $1', [userId]),
          client.query(`
            SELECT id, badge_name as "badgeName", badge_description as "badgeDescription",
                   badge_icon as "badgeIcon", earned_at as "unlockedAt"
            FROM user_badges WHERE user_id = $1 ORDER BY earned_at DESC LIMIT 10
          `, [userId]),
          client.query('SELECT * FROM user_streaks WHERE user_id = $1 AND streak_type = $2', [userId, 'daily_lesson']),
          client.query('SELECT * FROM daily_goals WHERE user_id = $1 AND goal_date = CURRENT_DATE', [userId])
        ]);

        const user = userResult.rows[0];
        if (!user) {
          throw new Error('User not found');
        }

        // Calculate level information
        const levelInfo = this.levelManager.calculateLevel(user.total_xp || 0);

        return {
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              totalXP: user.total_xp || 0,
              level: levelInfo.level,
              levelName: levelInfo.name,
              levelIcon: levelInfo.icon,
              xpToNext: levelInfo.xpToNext,
              xpProgress: levelInfo.progress
            },
            wallet: walletResult.rows[0] || { coins: 0, gems: 0 },
            badges: badgesResult.rows,
            streak: streakResult.rows[0] || { current_streak: 0, longest_streak: 0 },
            goals: goalsResult.rows
          }
        };
      } finally {
        client.release();
      }
    }, 300000); // 5-minute cache
  }

  async updateUserData(client, userId, rewards) {
    await Promise.all([
      client.query(
        'UPDATE users SET total_xp = COALESCE(total_xp, 0) + $1 WHERE id = $2',
        [rewards.xpAwarded, userId]
      ),
      client.query(`
        INSERT INTO user_wallet (user_id, coins, total_coins_earned)
        VALUES ($1, $2, $2)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          coins = user_wallet.coins + $2,
          total_coins_earned = user_wallet.total_coins_earned + $2
      `, [userId, rewards.coinsAwarded])
    ]);
  }
}

class RewardCalculator {
  calculateRewards(lessonData) {
    const { timeSpent = 15, score = 100, difficulty = 'medium' } = lessonData;
    
    const baseXP = this.getBaseXP(difficulty);
    const timeMultiplier = this.calculateTimeMultiplier(timeSpent);
    const scoreMultiplier = this.calculateScoreMultiplier(score);
    
    const finalXP = Math.round(baseXP * timeMultiplier * scoreMultiplier);
    const coins = Math.round(finalXP * 0.2);
    
    return {
      xpAwarded: finalXP,
      coinsAwarded: coins
    };
  }

  getBaseXP(difficulty) {
    const baseValues = {
      easy: 80,
      medium: 100,
      hard: 130,
      expert: 160
    };
    return baseValues[difficulty] || 100;
  }

  calculateTimeMultiplier(timeSpent) {
    const optimalTime = 20; // minutes
    const efficiency = optimalTime / timeSpent;
    return Math.max(0.6, Math.min(1.5, efficiency));
  }

  calculateScoreMultiplier(score) {
    return Math.max(0.5, score / 100);
  }
}

class AchievementProcessor {
  async process(client, userId, lessonData, rewards) {
    const results = {
      newBadges: [],
      levelUp: null,
      streakBonus: null
    };

    // Check for level up
    const levelUpResult = await this.checkLevelUp(client, userId);
    if (levelUpResult) {
      results.levelUp = levelUpResult;
    }

    // Check for new badges
    const badgeResults = await this.checkBadges(client, userId, lessonData);
    results.newBadges = badgeResults;

    // Update and check streak
    const streakResult = await this.updateStreak(client, userId);
    if (streakResult.bonusAwarded) {
      results.streakBonus = streakResult;
    }

    return results;
  }

  async checkLevelUp(client, userId) {
    const userResult = await client.query('SELECT total_xp FROM users WHERE id = $1', [userId]);
    const totalXP = userResult.rows[0]?.total_xp || 0;
    
    const levelManager = new LevelManager();
    const currentLevel = levelManager.calculateLevel(totalXP);
    
    // This would need to store previous level to detect level up
    // For now, simplified implementation
    return null;
  }

  async checkBadges(client, userId, lessonData) {
    // Badge checking logic would go here
    // For now, return empty array
    return [];
  }

  async updateStreak(client, userId) {
    const today = new Date().toISOString().split('T')[0];
    
    await client.query(`
      INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
      VALUES ($1, 'daily_lesson', 1, 1, $2)
      ON CONFLICT (user_id, streak_type)
      DO UPDATE SET 
        current_streak = CASE 
          WHEN DATE(user_streaks.last_activity_date) = DATE($2::date - INTERVAL '1 day') 
          THEN user_streaks.current_streak + 1
          WHEN DATE(user_streaks.last_activity_date) = DATE($2) 
          THEN user_streaks.current_streak
          ELSE 1
        END,
        longest_streak = GREATEST(
          user_streaks.longest_streak,
          CASE 
            WHEN DATE(user_streaks.last_activity_date) = DATE($2::date - INTERVAL '1 day') 
            THEN user_streaks.current_streak + 1
            WHEN DATE(user_streaks.last_activity_date) = DATE($2) 
            THEN user_streaks.current_streak
            ELSE 1
          END
        ),
        last_activity_date = $2
    `, [userId, today]);

    return { bonusAwarded: false };
  }
}

class LevelManager {
  constructor() {
    this.levels = [
      { level: 1, name: 'Iniciante Curioso', xpRequired: 0, icon: '🌱' },
      { level: 2, name: 'Explorador Digital', xpRequired: 100, icon: '🔍' },
      { level: 3, name: 'Aprendiz de Código', xpRequired: 300, icon: '📝' },
      { level: 4, name: 'Programador Novato', xpRequired: 600, icon: '💻' },
      { level: 5, name: 'Desenvolvedor Iniciante', xpRequired: 1000, icon: '🚀' },
      { level: 6, name: 'Codificador Experiente', xpRequired: 1500, icon: '⚡' },
      { level: 7, name: 'Mestre do Algoritmo', xpRequired: 2100, icon: '🧠' },
      { level: 8, name: 'Arquiteto de Software', xpRequired: 2800, icon: '🏗️' },
      { level: 9, name: 'Ninja do Código', xpRequired: 3600, icon: '🥷' },
      { level: 10, name: 'Lenda da Programação', xpRequired: 4500, icon: '👑' }
    ];
  }

  calculateLevel(totalXP) {
    let currentLevel = this.levels[0];
    let nextLevel = this.levels[1];

    for (let i = 0; i < this.levels.length - 1; i++) {
      if (totalXP >= this.levels[i].xpRequired && totalXP < this.levels[i + 1].xpRequired) {
        currentLevel = this.levels[i];
        nextLevel = this.levels[i + 1];
        break;
      } else if (totalXP >= this.levels[this.levels.length - 1].xpRequired) {
        currentLevel = this.levels[this.levels.length - 1];
        nextLevel = null;
        break;
      }
    }

    const xpToNext = nextLevel ? nextLevel.xpRequired - totalXP : 0;
    const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
    const xpForCurrentLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1;
    const progress = nextLevel ? Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100) : 100;

    return {
      level: currentLevel.level,
      name: currentLevel.name,
      icon: currentLevel.icon,
      xpToNext: Math.max(0, xpToNext),
      progress: Math.max(0, Math.min(100, progress)),
      currentLevelXP: xpInCurrentLevel,
      nextLevelXP: nextLevel ? nextLevel.xpRequired : totalXP,
      totalXP
    };
  }
}

module.exports = RefactoredGamificationService;