const BaseService = require('./BaseService');
const cacheService = require('../services/cacheService');

class NotificationManager extends BaseService {
  constructor() {
    super('NotificationManager');
    this.queue = [];
    this.cacheNamespace = 'notifications';
    this.notificationTypes = {
      XP_GAIN: 'xp_gain',
      LEVEL_UP: 'level_up',
      BADGE_UNLOCK: 'badge_unlock',
      COIN_REWARD: 'coin_reward',
      STREAK_BONUS: 'streak_bonus',
      GOAL_COMPLETE: 'goal_complete'
    };
    
    this.templates = this.initializeTemplates();
  }

  initializeTemplates() {
    return {
      [this.notificationTypes.XP_GAIN]: {
        icon: '🎯',
        title: '+{amount} XP Ganhos!',
        message: '{context}',
        duration: 3000,
        sound: 'xp_gain',
        animation: 'floating_number'
      },
      [this.notificationTypes.LEVEL_UP]: {
        icon: '🚀',
        title: 'LEVEL UP!',
        message: 'Parabéns! Você alcançou o nível {level}: {levelName}!',
        duration: 4000,
        sound: 'level_up',
        animation: 'confetti'
      },
      [this.notificationTypes.BADGE_UNLOCK]: {
        icon: '🏆',
        title: 'Nova Medalha!',
        message: 'Medalha "{badgeName}" desbloqueada!',
        duration: 4000,
        sound: 'badge_unlock',
        animation: 'badge_popup'
      },
      [this.notificationTypes.COIN_REWARD]: {
        icon: '💰',
        title: '+{amount} Moedas!',
        message: 'Total: {total} moedas',
        duration: 3000,
        sound: 'coin_collect',
        animation: 'coin_bounce'
      },
      [this.notificationTypes.STREAK_BONUS]: {
        icon: '🔥',
        title: 'Sequência de {days} Dias!',
        message: 'Bônus de +{xp} XP por consistência!',
        duration: 3500,
        sound: 'streak_bonus',
        animation: 'fire_effect'
      },
      [this.notificationTypes.GOAL_COMPLETE]: {
        icon: '🎯',
        title: 'Meta Completada!',
        message: '{goalType}: {progress}/{target} - +{reward} moedas!',
        duration: 3000,
        sound: 'goal_complete',
        animation: 'checkmark'
      }
    };
  }

  createNotification(type, data = {}) {
    const template = this.templates[type];
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const notification = {
      id: this.generateNotificationId(),
      type,
      icon: template.icon,
      title: this.interpolateTemplate(template.title, data),
      message: this.interpolateTemplate(template.message, data),
      duration: template.duration,
      sound: template.sound,
      animation: template.animation,
      timestamp: new Date().toISOString(),
      data
    };

    // Store in cache and queue
    cacheService.set(`${this.cacheNamespace}:${notification.id}`, notification);
    this.queue.push(notification);

    return notification;
  }

  interpolateTemplate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create specific notification types
  createXPNotification(amount, context = 'Lição completada com sucesso!') {
    return this.createNotification(this.notificationTypes.XP_GAIN, {
      amount,
      context
    });
  }

  createLevelUpNotification(level, levelName) {
    return this.createNotification(this.notificationTypes.LEVEL_UP, {
      level,
      levelName
    });
  }

  createBadgeNotification(badgeName, badgeDescription) {
    return this.createNotification(this.notificationTypes.BADGE_UNLOCK, {
      badgeName,
      badgeDescription
    });
  }

  createCoinNotification(amount, total) {
    return this.createNotification(this.notificationTypes.COIN_REWARD, {
      amount,
      total
    });
  }

  createStreakNotification(days, xp) {
    return this.createNotification(this.notificationTypes.STREAK_BONUS, {
      days,
      xp
    });
  }

  createGoalNotification(goalType, progress, target, reward) {
    return this.createNotification(this.notificationTypes.GOAL_COMPLETE, {
      goalType,
      progress,
      target,
      reward
    });
  }

  // Batch notification creation for multiple events
  createBatchNotifications(events) {
    const notifications = [];
    
    events.forEach((event, index) => {
      const notification = this.createNotification(event.type, event.data);
      notification.delay = index * 1000; // Stagger notifications
      notifications.push(notification);
    });
    
    return notifications;
  }

  // Priority system for notifications
  prioritizeNotifications(notifications) {
    const priorities = {
      [this.notificationTypes.LEVEL_UP]: 1,
      [this.notificationTypes.BADGE_UNLOCK]: 2,
      [this.notificationTypes.STREAK_BONUS]: 3,
      [this.notificationTypes.GOAL_COMPLETE]: 4,
      [this.notificationTypes.XP_GAIN]: 5,
      [this.notificationTypes.COIN_REWARD]: 6
    };

    return notifications.sort((a, b) => {
      const priorityA = priorities[a.type] || 999;
      const priorityB = priorities[b.type] || 999;
      return priorityA - priorityB;
    });
  }

  // Generate notification queue with proper timing
  generateNotificationQueue(gamificationResults) {
    const notifications = [];
    const { xpAwarded, coinsAwarded, newBadges, levelUp, streakBonus, goalsCompleted } = gamificationResults;

    // XP notification (always first)
    if (xpAwarded > 0) {
      notifications.push({
        type: this.notificationTypes.XP_GAIN,
        data: { amount: xpAwarded, context: 'Lição completada com sucesso!' },
        delay: 0
      });
    }

    // Coin notification
    if (coinsAwarded > 0) {
      notifications.push({
        type: this.notificationTypes.COIN_REWARD,
        data: { amount: coinsAwarded, total: gamificationResults.totalCoins || coinsAwarded },
        delay: 1000
      });
    }

    // Level up (highest priority, shows after XP with dramatic effect)
    if (levelUp) {
      notifications.push({
        type: this.notificationTypes.LEVEL_UP,
        data: { level: levelUp.newLevel, levelName: levelUp.levelName },
        delay: 2000
      });
    }

    // Badge notifications (staggered)
    if (newBadges && newBadges.length > 0) {
      newBadges.forEach((badge, index) => {
        notifications.push({
          type: this.notificationTypes.BADGE_UNLOCK,
          data: { badgeName: badge.name, badgeDescription: badge.description },
          delay: 3000 + (index * 1500)
        });
      });
    }

    // Streak bonus
    if (streakBonus) {
      notifications.push({
        type: this.notificationTypes.STREAK_BONUS,
        data: { days: streakBonus.days, xp: streakBonus.xp },
        delay: notifications.length * 1000
      });
    }

    // Goal completions
    if (goalsCompleted && goalsCompleted.length > 0) {
      goalsCompleted.forEach((goal, index) => {
        notifications.push({
          type: this.notificationTypes.GOAL_COMPLETE,
          data: {
            goalType: goal.type,
            progress: goal.progress,
            target: goal.target,
            reward: goal.reward
          },
          delay: (notifications.length + index) * 1000
        });
      });
    }

    return notifications;
  }

  getNotification(id) {
    return cacheService.get(`${this.cacheNamespace}:${id}`);
  }

  getCacheStats() {
    return cacheService.getStats();
  }

  // Convert to client-side format
  formatForClient(notifications) {
    return notifications.map(notification => ({
      ...this.createNotification(notification.type, notification.data),
      delay: notification.delay || 0
    }));
  }
}

module.exports = NotificationManager;