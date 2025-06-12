const { dbManager } = require('../server/database');

class GamificationDataInitializer {
  async initializeGamificationTables() {
    const client = await dbManager.pool.connect();
    
    try {
      // Create gamification tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_levels (
          id SERIAL PRIMARY KEY,
          level INTEGER NOT NULL UNIQUE,
          level_name TEXT NOT NULL,
          xp_required INTEGER NOT NULL,
          description TEXT,
          rewards JSONB DEFAULT '{}',
          icon TEXT,
          color TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS badges (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          category TEXT NOT NULL,
          icon TEXT NOT NULL,
          rarity TEXT NOT NULL,
          color TEXT DEFAULT '#3498db',
          conditions JSONB NOT NULL,
          xp_reward INTEGER DEFAULT 0,
          coins_reward INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_badges (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          badge_id INTEGER REFERENCES badges(id),
          earned_at TIMESTAMP DEFAULT NOW(),
          progress JSONB DEFAULT '{}',
          is_visible BOOLEAN DEFAULT TRUE,
          notification_sent BOOLEAN DEFAULT FALSE
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_wallet (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) UNIQUE,
          coins INTEGER DEFAULT 0,
          gems INTEGER DEFAULT 0,
          total_coins_earned INTEGER DEFAULT 0,
          total_coins_spent INTEGER DEFAULT 0,
          last_updated TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS coin_transactions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          transaction_type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          reason TEXT NOT NULL,
          source TEXT,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_streaks (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          streak_type TEXT NOT NULL,
          current_streak INTEGER DEFAULT 0,
          longest_streak INTEGER DEFAULT 0,
          last_activity_date TIMESTAMP,
          streak_start_date TIMESTAMP,
          freezes_used INTEGER DEFAULT 0,
          freezes_available INTEGER DEFAULT 2,
          metadata JSONB DEFAULT '{}'
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS user_goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          goal_type TEXT NOT NULL,
          goal_category TEXT NOT NULL,
          target_value INTEGER NOT NULL,
          current_progress INTEGER DEFAULT 0,
          is_completed BOOLEAN DEFAULT FALSE,
          goal_date TIMESTAMP NOT NULL,
          completed_at TIMESTAMP,
          rewards JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS gamification_notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          notification_type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          icon TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          action_required BOOLEAN DEFAULT FALSE,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW(),
          read_at TIMESTAMP
        );
      `);

      console.log('Gamification tables created successfully');
      await this.initializeDefaultData(client);
      
    } catch (error) {
      console.error('Error creating gamification tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async initializeDefaultData(client) {
    // Initialize default levels
    const defaultLevels = [
      { level: 1, levelName: 'Novice', xpRequired: 0, description: 'Welcome to your learning journey!', icon: '🌱', color: '#27ae60' },
      { level: 2, levelName: 'Apprentice', xpRequired: 100, description: 'You are getting started!', icon: '📖', color: '#3498db' },
      { level: 3, levelName: 'Student', xpRequired: 300, description: 'Building knowledge steadily', icon: '🎒', color: '#9b59b6' },
      { level: 4, levelName: 'Learner', xpRequired: 600, description: 'Making real progress', icon: '📚', color: '#e67e22' },
      { level: 5, levelName: 'Scholar', xpRequired: 1000, description: 'Showing dedication', icon: '🎓', color: '#e74c3c' }
    ];

    for (const level of defaultLevels) {
      await client.query(`
        INSERT INTO user_levels (level, level_name, xp_required, description, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (level) DO NOTHING
      `, [level.level, level.levelName, level.xpRequired, level.description, level.icon, level.color]);
    }

    // Initialize default badges
    const defaultBadges = [
      {
        name: 'First Steps',
        description: 'Complete your first lesson',
        category: 'study',
        icon: '🎯',
        rarity: 'common',
        color: '#27ae60',
        conditions: JSON.stringify({ lessonsCompleted: 1 }),
        xpReward: 50,
        coinsReward: 10
      },
      {
        name: 'Knowledge Seeker',
        description: 'Complete 10 lessons',
        category: 'study',
        icon: '📚',
        rarity: 'common',
        color: '#3498db',
        conditions: JSON.stringify({ lessonsCompleted: 10 }),
        xpReward: 200,
        coinsReward: 50
      },
      {
        name: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        category: 'streak',
        icon: '🔥',
        rarity: 'common',
        color: '#ff6b35',
        conditions: JSON.stringify({ dailyStreak: 7 }),
        xpReward: 300,
        coinsReward: 75
      },
      {
        name: 'Speed Demon',
        description: 'Complete 5 lessons in one day',
        category: 'achievement',
        icon: '🚀',
        rarity: 'rare',
        color: '#ff4757',
        conditions: JSON.stringify({ lessonsInDay: 5 }),
        xpReward: 400,
        coinsReward: 100
      }
    ];

    for (const badge of defaultBadges) {
      await client.query(`
        INSERT INTO badges (name, description, category, icon, rarity, color, conditions, xp_reward, coins_reward)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [badge.name, badge.description, badge.category, badge.icon, badge.rarity, badge.color, badge.conditions, badge.xpReward, badge.coinsReward]);
    }

    console.log('Default gamification data initialized');
  }

  async ensureUserGamificationData(userId) {
    const client = await dbManager.pool.connect();
    
    try {
      // Initialize user wallet
      await client.query(`
        INSERT INTO user_wallet (user_id, coins, gems)
        VALUES ($1, 0, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);

      // Initialize daily streak
      await client.query(`
        INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak)
        VALUES ($1, 'daily_lesson', 0, 0)
        ON CONFLICT DO NOTHING
      `, [userId]);

      console.log(`Gamification data initialized for user ${userId}`);
      
    } catch (error) {
      console.error('Error initializing user gamification data:', error);
    } finally {
      client.release();
    }
  }
}

module.exports = new GamificationDataInitializer();