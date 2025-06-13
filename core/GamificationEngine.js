const BaseService = require('./BaseService');
const NotificationManager = require('./NotificationManager');

class GamificationEngine extends BaseService {
  constructor() {
    super('GamificationEngine');
    this.notificationManager = new NotificationManager();
    this.xpCalculator = new XPCalculator();
    this.levelSystem = new LevelSystem();
    this.badgeSystem = new BadgeSystem();
    this.streakManager = new StreakManager();
  }

  async processUserAction(userId, actionType, actionData) {
    const results = {
      xpAwarded: 0,
      coinsAwarded: 0,
      newBadges: [],
      levelUp: null,
      streakBonus: null,
      goalsCompleted: [],
      notifications: []
    };

    try {
      // Calculate base rewards
      const rewards = await this.calculateRewards(actionType, actionData);
      results.xpAwarded = rewards.xp;
      results.coinsAwarded = rewards.coins;

      // Update user progress
      await this.updateUserProgress(userId, rewards);

      // Check for level up
      const levelUpResult = await this.checkLevelUp(userId);
      if (levelUpResult.leveledUp) {
        results.levelUp = levelUpResult;
      }

      // Check for new badges
      const newBadges = await this.checkBadgeUnlocks(userId, actionType, actionData);
      results.newBadges = newBadges;

      // Update streak
      const streakResult = await this.updateStreak(userId, actionType);
      if (streakResult.bonusAwarded) {
        results.streakBonus = streakResult;
        results.xpAwarded += streakResult.xp;
        results.coinsAwarded += streakResult.coins;
      }

      // Check goal completion
      const goalResults = await this.checkGoalCompletion(userId, actionType, actionData);
      results.goalsCompleted = goalResults;

      // Generate notifications
      results.notifications = this.notificationManager.generateNotificationQueue(results);

      return results;
    } catch (error) {
      console.error('Error processing user action:', error);
      throw error;
    }
  }

  calculateRewards(actionType, actionData) {
    return this.xpCalculator.calculate(actionType, actionData);
  }

  async updateUserProgress(userId, rewards) {
    // Implementation would update database
    return true;
  }

  async checkLevelUp(userId) {
    return this.levelSystem.checkLevelUp(userId);
  }

  async checkBadgeUnlocks(userId, actionType, actionData) {
    return this.badgeSystem.checkUnlocks(userId, actionType, actionData);
  }

  async updateStreak(userId, actionType) {
    return this.streakManager.updateStreak(userId, actionType);
  }

  async checkGoalCompletion(userId, actionType, actionData) {
    // Check daily goals, challenges, etc.
    return [];
  }
}

class XPCalculator {
  calculate(actionType, actionData) {
    const baseRewards = {
      lesson_completion: { xp: 100, coins: 20 },
      exercise_completion: { xp: 50, coins: 10 },
      quiz_completion: { xp: 75, coins: 15 },
      project_submission: { xp: 200, coins: 40 }
    };

    const base = baseRewards[actionType] || { xp: 50, coins: 10 };
    
    // Apply multipliers based on performance
    const multipliers = this.calculateMultipliers(actionData);
    
    return {
      xp: Math.round(base.xp * multipliers.xp),
      coins: Math.round(base.coins * multipliers.coins)
    };
  }

  calculateMultipliers(actionData) {
    let xpMultiplier = 1.0;
    let coinMultiplier = 1.0;

    // Score-based multiplier
    if (actionData.score) {
      const scorePercent = actionData.score / 100;
      xpMultiplier *= (0.5 + scorePercent); // 50% to 150% based on score
    }

    // Time-based multiplier (bonus for efficiency)
    if (actionData.timeSpent && actionData.expectedTime) {
      const efficiency = actionData.expectedTime / actionData.timeSpent;
      if (efficiency > 1.2) xpMultiplier *= 1.2; // 20% bonus for fast completion
      if (efficiency < 0.8) xpMultiplier *= 0.9; // 10% penalty for slow completion
    }

    // Difficulty multiplier
    if (actionData.difficulty) {
      const difficultyMultipliers = { easy: 0.8, medium: 1.0, hard: 1.3, expert: 1.5 };
      xpMultiplier *= difficultyMultipliers[actionData.difficulty] || 1.0;
    }

    return { xp: xpMultiplier, coins: coinMultiplier };
  }
}

class LevelSystem {
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

    return {
      current: currentLevel,
      next: nextLevel,
      progress: this.calculateProgress(totalXP, currentLevel, nextLevel)
    };
  }

  calculateProgress(totalXP, currentLevel, nextLevel) {
    if (!nextLevel) return 100;
    
    const xpInCurrentLevel = totalXP - currentLevel.xpRequired;
    const xpForCurrentLevel = nextLevel.xpRequired - currentLevel.xpRequired;
    
    return Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100);
  }

  async checkLevelUp(userId) {
    // This would check user's current XP and determine if they leveled up
    // Implementation would query database
    return { leveledUp: false };
  }
}

class BadgeSystem {
  constructor() {
    this.badges = [
      {
        id: 'first_steps',
        name: 'Primeiros Passos',
        description: 'Complete sua primeira lição',
        icon: '🎯',
        condition: { type: 'lesson_count', value: 1 },
        rewards: { xp: 50, coins: 10 }
      },
      {
        id: 'knowledge_seeker',
        name: 'Buscador de Conhecimento',
        description: 'Complete 10 lições',
        icon: '📚',
        condition: { type: 'lesson_count', value: 10 },
        rewards: { xp: 200, coins: 50 }
      },
      {
        id: 'consistent_learner',
        name: 'Aprendiz Consistente',
        description: 'Mantenha uma sequência de 7 dias',
        icon: '🔥',
        condition: { type: 'streak_days', value: 7 },
        rewards: { xp: 300, coins: 75 }
      },
      {
        id: 'perfectionist',
        name: 'Perfeccionista',
        description: 'Obtenha pontuação perfeita em 5 exercícios',
        icon: '⭐',
        condition: { type: 'perfect_scores', value: 5 },
        rewards: { xp: 150, coins: 30 }
      },
      {
        id: 'speed_demon',
        name: 'Demônio da Velocidade',
        description: 'Complete uma lição em menos de 5 minutos',
        icon: '⚡',
        condition: { type: 'fast_completion', value: 300 }, // seconds
        rewards: { xp: 100, coins: 25 }
      }
    ];
  }

  async checkUnlocks(userId, actionType, actionData) {
    const newBadges = [];
    
    for (const badge of this.badges) {
      if (await this.checkBadgeCondition(userId, badge, actionType, actionData)) {
        const hasBadge = await this.userHasBadge(userId, badge.id);
        if (!hasBadge) {
          newBadges.push(badge);
        }
      }
    }
    
    return newBadges;
  }

  async checkBadgeCondition(userId, badge, actionType, actionData) {
    // Implementation would check specific conditions
    // This is a simplified version
    return false;
  }

  async userHasBadge(userId, badgeId) {
    // Check if user already has this badge
    return false;
  }
}

class StreakManager {
  async updateStreak(userId, actionType) {
    // Implementation would update user's streak
    return { bonusAwarded: false };
  }

  calculateStreakBonus(streakDays) {
    const bonuses = {
      3: { xp: 50, coins: 10 },
      7: { xp: 150, coins: 30 },
      14: { xp: 300, coins: 60 },
      30: { xp: 500, coins: 100 }
    };
    
    return bonuses[streakDays] || { xp: 0, coins: 0 };
  }
}

module.exports = GamificationEngine;