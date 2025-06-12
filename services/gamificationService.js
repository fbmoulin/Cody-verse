const { dbManager } = require('../server/database');
const gamificationDataInitializer = require('./gamificationDataInitializer');

class GamificationService {
  constructor() {
    this.badgeCache = new Map();
    this.levelCache = new Map();
    this.initializeBadges();
    this.initializeLevels();
  }

  // Initialize default badges and levels
  async initializeBadges() {
    const defaultBadges = [
      // Study Badges
      {
        name: 'First Steps',
        description: 'Complete your first lesson',
        category: 'study',
        icon: '🎯',
        rarity: 'common',
        color: '#27ae60',
        conditions: { lessonsCompleted: 1 },
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
        conditions: { lessonsCompleted: 10 },
        xpReward: 200,
        coinsReward: 50
      },
      {
        name: 'Learning Master',
        description: 'Complete 50 lessons',
        category: 'study',
        icon: '🎓',
        rarity: 'rare',
        color: '#9b59b6',
        conditions: { lessonsCompleted: 50 },
        xpReward: 500,
        coinsReward: 150
      },
      {
        name: 'Scholar',
        description: 'Complete 100 lessons',
        category: 'study',
        icon: '👨‍🎓',
        rarity: 'epic',
        color: '#e74c3c',
        conditions: { lessonsCompleted: 100 },
        xpReward: 1000,
        coinsReward: 300
      },
      // Streak Badges
      {
        name: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        category: 'streak',
        icon: '🔥',
        rarity: 'common',
        color: '#ff6b35',
        conditions: { dailyStreak: 7 },
        xpReward: 300,
        coinsReward: 75
      },
      {
        name: 'Dedication',
        description: 'Maintain a 30-day learning streak',
        category: 'streak',
        icon: '💎',
        rarity: 'rare',
        color: '#00d4aa',
        conditions: { dailyStreak: 30 },
        xpReward: 1000,
        coinsReward: 250
      },
      {
        name: 'Unstoppable',
        description: 'Maintain a 100-day learning streak',
        category: 'streak',
        icon: '⚡',
        rarity: 'legendary',
        color: '#ffd700',
        conditions: { dailyStreak: 100 },
        xpReward: 2500,
        coinsReward: 500
      },
      // Achievement Badges
      {
        name: 'Speed Demon',
        description: 'Complete 5 lessons in one day',
        category: 'achievement',
        icon: '🚀',
        rarity: 'rare',
        color: '#ff4757',
        conditions: { lessonsInDay: 5 },
        xpReward: 400,
        coinsReward: 100
      },
      {
        name: 'Night Owl',
        description: 'Complete lessons after 10 PM',
        category: 'achievement',
        icon: '🦉',
        rarity: 'common',
        color: '#5f27cd',
        conditions: { lateNightLessons: 10 },
        xpReward: 250,
        coinsReward: 60
      },
      {
        name: 'Early Bird',
        description: 'Complete lessons before 7 AM',
        category: 'achievement',
        icon: '🌅',
        rarity: 'common',
        color: '#ff9ff3',
        conditions: { earlyMorningLessons: 10 },
        xpReward: 250,
        coinsReward: 60
      },
      // Social Badges
      {
        name: 'Cody\'s Friend',
        description: 'Have 50 interactions with Cody',
        category: 'social',
        icon: '🤖',
        rarity: 'common',
        color: '#00d2d3',
        conditions: { codyInteractions: 50 },
        xpReward: 300,
        coinsReward: 80
      },
      {
        name: 'Conversation Expert',
        description: 'Have 200 interactions with Cody',
        category: 'social',
        icon: '💬',
        rarity: 'rare',
        color: '#ff6348',
        conditions: { codyInteractions: 200 },
        xpReward: 750,
        coinsReward: 200
      },
      // Special Badges
      {
        name: 'Weekend Warrior',
        description: 'Complete lessons on 10 weekends',
        category: 'special',
        icon: '⚔️',
        rarity: 'epic',
        color: '#2f3640',
        conditions: { weekendSessions: 10 },
        xpReward: 800,
        coinsReward: 180
      },
      {
        name: 'Perfect Week',
        description: 'Complete all daily goals for a week',
        category: 'special',
        icon: '✨',
        rarity: 'epic',
        color: '#ffa502',
        conditions: { perfectWeeks: 1 },
        xpReward: 1200,
        coinsReward: 300
      }
    ];

    // Check if badges already exist
    const existingBadges = await db.select().from(badges).limit(1);
    if (existingBadges.length === 0) {
      await db.insert(badges).values(defaultBadges);
    }
  }

  async initializeLevels() {
    const defaultLevels = [
      { level: 1, levelName: 'Novice', xpRequired: 0, description: 'Welcome to your learning journey!', icon: '🌱', color: '#27ae60' },
      { level: 2, levelName: 'Apprentice', xpRequired: 100, description: 'You\'re getting started!', icon: '📖', color: '#3498db' },
      { level: 3, levelName: 'Student', xpRequired: 300, description: 'Building knowledge steadily', icon: '🎒', color: '#9b59b6' },
      { level: 4, levelName: 'Learner', xpRequired: 600, description: 'Making real progress', icon: '📚', color: '#e67e22' },
      { level: 5, levelName: 'Scholar', xpRequired: 1000, description: 'Showing dedication', icon: '🎓', color: '#e74c3c' },
      { level: 6, levelName: 'Expert', xpRequired: 1500, description: 'Advanced knowledge', icon: '🔬', color: '#34495e' },
      { level: 7, levelName: 'Master', xpRequired: 2200, description: 'Mastering your craft', icon: '👨‍🏫', color: '#8e44ad' },
      { level: 8, levelName: 'Guru', xpRequired: 3000, description: 'Deep understanding', icon: '🧙‍♂️', color: '#2c3e50' },
      { level: 9, levelName: 'Sage', xpRequired: 4000, description: 'Wisdom incarnate', icon: '👨‍🎓', color: '#c0392b' },
      { level: 10, levelName: 'Legend', xpRequired: 5500, description: 'Legendary learner!', icon: '👑', color: '#f39c12' }
    ];

    const existingLevels = await db.select().from(userLevels).limit(1);
    if (existingLevels.length === 0) {
      await db.insert(userLevels).values(defaultLevels);
    }
  }

  // Award XP and handle level ups
  async awardXP(userId, amount, source = 'general') {
    try {
      // Update user's total XP
      await db.update(users)
        .set({ totalXP: sql`total_xp + ${amount}` })
        .where(eq(users.id, userId));

      // Add coin transaction
      await this.addCoins(userId, Math.floor(amount / 10), `XP reward: ${source}`);

      // Check for level up
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length > 0) {
        await this.checkLevelUp(userId, user[0].totalXP);
      }

      return true;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return false;
    }
  }

  // Check and handle level ups
  async checkLevelUp(userId, currentXP) {
    try {
      const levels = await db.select()
        .from(userLevels)
        .where(lte(userLevels.xpRequired, currentXP))
        .orderBy(desc(userLevels.level));

      if (levels.length > 0) {
        const newLevel = levels[0];
        
        // Check user's current level
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        const currentLevel = user[0]?.profileData?.level || 1;

        if (newLevel.level > currentLevel) {
          // Level up!
          await db.update(users)
            .set({ 
              profileData: sql`jsonb_set(profile_data, '{level}', '${newLevel.level}')`
            })
            .where(eq(users.id, userId));

          // Award level up rewards
          const coinReward = newLevel.level * 50;
          await this.addCoins(userId, coinReward, `Level ${newLevel.level} reward`);

          // Create notification
          await this.createNotification(userId, 'level_up', 
            `Level Up! 🎉`, 
            `Congratulations! You've reached level ${newLevel.level}: ${newLevel.levelName}!`,
            newLevel.icon,
            { level: newLevel.level, coinReward }
          );

          return { leveledUp: true, newLevel };
        }
      }

      return { leveledUp: false };
    } catch (error) {
      console.error('Error checking level up:', error);
      return { leveledUp: false };
    }
  }

  // Add coins to user wallet
  async addCoins(userId, amount, reason, source = 'system') {
    try {
      // Initialize wallet if doesn't exist
      await db.insert(userWallet)
        .values({ userId, coins: 0, gems: 0 })
        .onConflictDoNothing();

      // Update wallet
      await db.update(userWallet)
        .set({ 
          coins: sql`coins + ${amount}`,
          totalCoinsEarned: sql`total_coins_earned + ${amount}`,
          lastUpdated: new Date()
        })
        .where(eq(userWallet.userId, userId));

      // Record transaction
      await db.insert(coinTransactions).values({
        userId,
        transactionType: 'earned',
        amount,
        reason,
        source
      });

      return true;
    } catch (error) {
      console.error('Error adding coins:', error);
      return false;
    }
  }

  // Check and award badges
  async checkAndAwardBadges(userId) {
    try {
      const allBadges = await db.select().from(badges).where(eq(badges.isActive, true));
      const userBadgesList = await db.select({ badgeId: userBadges.badgeId })
        .from(userBadges)
        .where(eq(userBadges.userId, userId));
      
      const earnedBadgeIds = new Set(userBadgesList.map(ub => ub.badgeId));
      const newBadges = [];

      for (const badge of allBadges) {
        if (!earnedBadgeIds.has(badge.id)) {
          const meetsConditions = await this.checkBadgeConditions(userId, badge.conditions);
          if (meetsConditions) {
            // Award badge
            await db.insert(userBadges).values({
              userId,
              badgeId: badge.id,
              earnedAt: new Date()
            });

            // Award rewards
            if (badge.xpReward > 0) {
              await this.awardXP(userId, badge.xpReward, `Badge: ${badge.name}`);
            }
            if (badge.coinsReward > 0) {
              await this.addCoins(userId, badge.coinsReward, `Badge: ${badge.name}`, 'badge_earned');
            }

            // Create notification
            await this.createNotification(userId, 'badge_earned',
              `New Badge Earned! ${badge.icon}`,
              `You've earned the "${badge.name}" badge! ${badge.description}`,
              badge.icon,
              { 
                badgeId: badge.id, 
                badgeName: badge.name,
                xpReward: badge.xpReward,
                coinsReward: badge.coinsReward
              }
            );

            newBadges.push(badge);
          }
        }
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  // Check if user meets badge conditions
  async checkBadgeConditions(userId, conditions) {
    try {
      // Get user stats
      const userStats = await this.getUserStats(userId);

      for (const [condition, value] of Object.entries(conditions)) {
        switch (condition) {
          case 'lessonsCompleted':
            if (userStats.lessonsCompleted < value) return false;
            break;
          case 'dailyStreak':
            if (userStats.currentDailyStreak < value) return false;
            break;
          case 'lessonsInDay':
            if (userStats.maxLessonsInDay < value) return false;
            break;
          case 'codyInteractions':
            if (userStats.codyInteractions < value) return false;
            break;
          case 'lateNightLessons':
            if (userStats.lateNightLessons < value) return false;
            break;
          case 'earlyMorningLessons':
            if (userStats.earlyMorningLessons < value) return false;
            break;
          case 'weekendSessions':
            if (userStats.weekendSessions < value) return false;
            break;
          case 'perfectWeeks':
            if (userStats.perfectWeeks < value) return false;
            break;
          default:
            // Custom condition checking
            if (userStats[condition] && userStats[condition] < value) return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking badge conditions:', error);
      return false;
    }
  }

  // Get comprehensive user statistics
  async getUserStats(userId) {
    try {
      // Lessons completed
      const lessonsCompleted = await db.select({ count: count() })
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.isCompleted, true)
        ));

      // Daily streak
      const streakData = await db.select()
        .from(userStreaks)
        .where(and(
          eq(userStreaks.userId, userId),
          eq(userStreaks.streakType, 'daily_lesson')
        ))
        .limit(1);

      // Cody interactions
      const codyInteractionsCount = await db.select({ count: count() })
        .from(codyInteractions)
        .where(eq(codyInteractions.userId, userId));

      // Lessons by time of day
      const lessonTimes = await db.select()
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.isCompleted, true)
        ));

      let lateNightLessons = 0;
      let earlyMorningLessons = 0;
      let weekendSessions = 0;
      const dailyLessonCounts = new Map();

      lessonTimes.forEach(lesson => {
        const hour = new Date(lesson.completedAt).getHours();
        const dayOfWeek = new Date(lesson.completedAt).getDay();
        const dateKey = new Date(lesson.completedAt).toDateString();

        // Count lessons by time
        if (hour >= 22 || hour < 2) lateNightLessons++;
        if (hour >= 5 && hour < 7) earlyMorningLessons++;
        
        // Count weekend sessions
        if (dayOfWeek === 0 || dayOfWeek === 6) weekendSessions++;

        // Count daily lessons
        dailyLessonCounts.set(dateKey, (dailyLessonCounts.get(dateKey) || 0) + 1);
      });

      const maxLessonsInDay = Math.max(...Array.from(dailyLessonCounts.values()), 0);

      return {
        lessonsCompleted: lessonsCompleted[0]?.count || 0,
        currentDailyStreak: streakData[0]?.currentStreak || 0,
        codyInteractions: codyInteractionsCount[0]?.count || 0,
        lateNightLessons,
        earlyMorningLessons,
        weekendSessions,
        maxLessonsInDay,
        perfectWeeks: 0 // This would need more complex calculation
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {};
    }
  }

  // Update user streaks
  async updateStreak(userId, streakType = 'daily_lesson') {
    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

      let streak = await db.select()
        .from(userStreaks)
        .where(and(
          eq(userStreaks.userId, userId),
          eq(userStreaks.streakType, streakType)
        ))
        .limit(1);

      if (streak.length === 0) {
        // Create new streak
        await db.insert(userStreaks).values({
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
          streakStartDate: new Date()
        });
        return 1;
      } else {
        const lastActivity = new Date(streak[0].lastActivityDate).toDateString();
        
        if (lastActivity === today) {
          // Already counted today
          return streak[0].currentStreak;
        } else if (lastActivity === yesterday) {
          // Continue streak
          const newStreak = streak[0].currentStreak + 1;
          const newLongest = Math.max(newStreak, streak[0].longestStreak);
          
          await db.update(userStreaks)
            .set({
              currentStreak: newStreak,
              longestStreak: newLongest,
              lastActivityDate: new Date()
            })
            .where(eq(userStreaks.id, streak[0].id));

          // Check for streak milestones
          if (newStreak % 7 === 0) {
            await this.createNotification(userId, 'streak_milestone',
              `${newStreak} Day Streak! 🔥`,
              `Amazing! You've maintained your learning streak for ${newStreak} days!`,
              '🔥',
              { streak: newStreak }
            );
          }

          return newStreak;
        } else {
          // Streak broken
          await db.update(userStreaks)
            .set({
              currentStreak: 1,
              lastActivityDate: new Date(),
              streakStartDate: new Date()
            })
            .where(eq(userStreaks.id, streak[0].id));

          return 1;
        }
      }
    } catch (error) {
      console.error('Error updating streak:', error);
      return 0;
    }
  }

  // Create daily goals for user
  async createDailyGoals(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if goals already exist for today
      const existingGoals = await db.select()
        .from(userGoals)
        .where(and(
          eq(userGoals.userId, userId),
          eq(userGoals.goalType, 'daily'),
          gte(userGoals.goalDate, today)
        ));

      if (existingGoals.length > 0) {
        return existingGoals;
      }

      // Create default daily goals
      const goals = [
        {
          userId,
          goalType: 'daily',
          goalCategory: 'lessons',
          targetValue: 3,
          goalDate: today,
          rewards: { coins: 50, xp: 100 }
        },
        {
          userId,
          goalType: 'daily',
          goalCategory: 'time',
          targetValue: 30, // 30 minutes
          goalDate: today,
          rewards: { coins: 30, xp: 75 }
        },
        {
          userId,
          goalType: 'daily',
          goalCategory: 'xp',
          targetValue: 200,
          goalDate: today,
          rewards: { coins: 40, xp: 0 }
        }
      ];

      await db.insert(userGoals).values(goals);
      return goals;
    } catch (error) {
      console.error('Error creating daily goals:', error);
      return [];
    }
  }

  // Check and complete goals
  async checkGoalProgress(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeGoals = await db.select()
        .from(userGoals)
        .where(and(
          eq(userGoals.userId, userId),
          eq(userGoals.isCompleted, false),
          gte(userGoals.goalDate, today)
        ));

      const userStats = await this.getTodayStats(userId);
      const completedGoals = [];

      for (const goal of activeGoals) {
        let currentProgress = 0;

        switch (goal.goalCategory) {
          case 'lessons':
            currentProgress = userStats.lessonsToday;
            break;
          case 'time':
            currentProgress = userStats.timeToday;
            break;
          case 'xp':
            currentProgress = userStats.xpToday;
            break;
        }

        // Update progress
        await db.update(userGoals)
          .set({ currentProgress })
          .where(eq(userGoals.id, goal.id));

        // Check if completed
        if (currentProgress >= goal.targetValue && !goal.isCompleted) {
          await db.update(userGoals)
            .set({ 
              isCompleted: true,
              completedAt: new Date()
            })
            .where(eq(userGoals.id, goal.id));

          // Award rewards
          if (goal.rewards.coins) {
            await this.addCoins(userId, goal.rewards.coins, `Daily goal: ${goal.goalCategory}`, 'goal_completed');
          }
          if (goal.rewards.xp) {
            await this.awardXP(userId, goal.rewards.xp, `Daily goal: ${goal.goalCategory}`);
          }

          completedGoals.push(goal);

          // Create notification
          await this.createNotification(userId, 'goal_completed',
            `Goal Completed! ✅`,
            `You've completed your daily ${goal.goalCategory} goal!`,
            '🎯',
            { goalCategory: goal.goalCategory, rewards: goal.rewards }
          );
        }
      }

      return completedGoals;
    } catch (error) {
      console.error('Error checking goal progress:', error);
      return [];
    }
  }

  // Get today's statistics for a user
  async getTodayStats(userId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Lessons completed today
      const lessonsToday = await db.select({ count: count() })
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, userId),
          eq(userLessonProgress.isCompleted, true),
          gte(userLessonProgress.completedAt, today),
          lte(userLessonProgress.completedAt, tomorrow)
        ));

      // Time spent today
      const timeToday = await db.select({ total: sum(userLessonProgress.timeSpentMinutes) })
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, userId),
          gte(userLessonProgress.lastAccessedAt, today),
          lte(userLessonProgress.lastAccessedAt, tomorrow)
        ));

      // XP earned today (from coin transactions)
      const xpToday = await db.select({ total: sum(coinTransactions.amount) })
        .from(coinTransactions)
        .where(and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.source, 'xp_reward'),
          gte(coinTransactions.createdAt, today),
          lte(coinTransactions.createdAt, tomorrow)
        ));

      return {
        lessonsToday: lessonsToday[0]?.count || 0,
        timeToday: timeToday[0]?.total || 0,
        xpToday: (xpToday[0]?.total || 0) * 10 // Convert coins back to XP
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return { lessonsToday: 0, timeToday: 0, xpToday: 0 };
    }
  }

  // Create notification
  async createNotification(userId, type, title, message, icon, metadata = {}) {
    try {
      await db.insert(gamificationNotifications).values({
        userId,
        notificationType: type,
        title,
        message,
        icon,
        metadata
      });
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Get user's gamification dashboard data
  async getUserDashboard(userId) {
    try {
      // User basic info and level
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const userLevel = user[0]?.profileData?.level || 1;
      
      // Current level info
      const levelInfo = await db.select()
        .from(userLevels)
        .where(eq(userLevels.level, userLevel))
        .limit(1);

      // Next level info
      const nextLevelInfo = await db.select()
        .from(userLevels)
        .where(eq(userLevels.level, userLevel + 1))
        .limit(1);

      // User wallet
      const wallet = await db.select()
        .from(userWallet)
        .where(eq(userWallet.userId, userId))
        .limit(1);

      // Recent badges
      const recentBadges = await db.select({
        badge: badges,
        earnedAt: userBadges.earnedAt
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt))
      .limit(5);

      // Current streaks
      const streaks = await db.select()
        .from(userStreaks)
        .where(eq(userStreaks.userId, userId));

      // Today's goals
      const todayGoals = await db.select()
        .from(userGoals)
        .where(and(
          eq(userGoals.userId, userId),
          eq(userGoals.goalType, 'daily'),
          gte(userGoals.goalDate, new Date(new Date().setHours(0, 0, 0, 0)))
        ));

      // Recent notifications
      const notifications = await db.select()
        .from(gamificationNotifications)
        .where(eq(gamificationNotifications.userId, userId))
        .orderBy(desc(gamificationNotifications.createdAt))
        .limit(10);

      return {
        user: user[0],
        level: levelInfo[0],
        nextLevel: nextLevelInfo[0],
        wallet: wallet[0] || { coins: 0, gems: 0 },
        recentBadges,
        streaks,
        todayGoals,
        notifications,
        stats: await this.getUserStats(userId)
      };
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      return null;
    }
  }

  // Process lesson completion with full gamification
  async processLessonCompletion(userId, lessonId, timeSpent, score) {
    try {
      const results = {
        xpAwarded: 0,
        coinsAwarded: 0,
        newBadges: [],
        levelUp: false,
        streakUpdated: false,
        goalsCompleted: []
      };

      // Award base XP for lesson completion
      const baseXP = 100;
      const bonusXP = Math.floor(score * 0.5); // Bonus based on score
      const totalXP = baseXP + bonusXP;

      await this.awardXP(userId, totalXP, 'lesson_completion');
      results.xpAwarded = totalXP;

      // Award coins
      const coins = Math.floor(totalXP / 10) + 10;
      await this.addCoins(userId, coins, 'Lesson completion', 'lesson_complete');
      results.coinsAwarded = coins;

      // Update streak
      const newStreak = await this.updateStreak(userId);
      results.streakUpdated = newStreak > 0;

      // Check for new badges
      const newBadges = await this.checkAndAwardBadges(userId);
      results.newBadges = newBadges;

      // Check goals
      const completedGoals = await this.checkGoalProgress(userId);
      results.goalsCompleted = completedGoals;

      // Check for level up
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length > 0) {
        const levelUpResult = await this.checkLevelUp(userId, user[0].totalXP);
        results.levelUp = levelUpResult.leveledUp;
        if (levelUpResult.leveledUp) {
          results.newLevel = levelUpResult.newLevel;
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing lesson completion:', error);
      return null;
    }
  }
}

module.exports = new GamificationService();