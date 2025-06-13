const BaseController = require('../core/BaseController');
const RefactoredGamificationService = require('../services/refactoredGamificationService');
const NotificationManager = require('../core/NotificationManager');
const UIComponentFactory = require('../core/UIComponentFactory');

class RefactoredGamificationController extends BaseController {
  constructor() {
    super('RefactoredGamificationController');
    this.gamificationService = new RefactoredGamificationService();
    this.notificationManager = new NotificationManager();
    this.uiFactory = new UIComponentFactory();
  }

  async getDashboard(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      const ageGroup = req.query.ageGroup || 'teen';
      
      const dashboardData = await this.executeWithCache(
        `dashboard_${userId}_${ageGroup}`,
        () => this.gamificationService.getDashboard(userId),
        300000 // 5 minutes
      );

      // Apply age-specific UI adaptations
      const adaptedData = this.adaptDashboardForAge(dashboardData.data, ageGroup);
      
      return this.createResponse(adaptedData, 'Dashboard loaded successfully');
    });
  }

  async processLessonCompletion(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      const lessonData = this.validateLessonData(req.body);
      
      const results = await this.gamificationService.processLessonCompletion(userId, lessonData);
      
      // Clear relevant caches
      this.clearUserCaches(userId);
      
      return this.createResponse(results.data, 'Lesson completed successfully', {
        performance: {
          xpGained: results.data.xpAwarded,
          coinsEarned: results.data.coinsAwarded,
          achievementsUnlocked: results.data.newBadges?.length || 0
        }
      });
    });
  }

  async getUserBadges(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      
      const badges = await this.executeWithCache(
        `badges_${userId}`,
        () => this.gamificationService.getUserBadges(userId),
        600000 // 10 minutes
      );
      
      return this.createResponse(badges, 'Badges retrieved successfully');
    });
  }

  async getNotifications(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      const limit = this.parseIntParam(req.query.limit, 'limit', 10);
      
      const notifications = await this.gamificationService.getNotifications(userId, limit);
      
      return this.createResponse(notifications, 'Notifications retrieved successfully');
    });
  }

  async simulateLessonCompletion(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      
      // Generate realistic lesson data for simulation
      const simulatedLessonData = {
        lessonId: Math.floor(Math.random() * 20) + 1,
        timeSpent: Math.floor(Math.random() * 30) + 10,
        score: Math.floor(Math.random() * 30) + 70,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)]
      };
      
      const results = await this.gamificationService.processLessonCompletion(userId, simulatedLessonData);
      
      return this.createResponse(results.data, 'Lesson simulation completed', {
        simulation: true,
        lessonData: simulatedLessonData
      });
    });
  }

  async getLeaderboard(req, res) {
    return this.handleRequest(req, res, async () => {
      const timeframe = req.query.timeframe || 'weekly';
      const limit = this.parseIntParam(req.query.limit, 'limit', 10);
      
      const leaderboard = await this.gamificationService.getLeaderboard(timeframe, limit);
      
      return this.createResponse(leaderboard, 'Leaderboard retrieved successfully');
    });
  }

  async getUserStats(req, res) {
    return this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      const timeframe = req.query.timeframe || 'all';
      
      const stats = await this.executeWithCache(
        `stats_${userId}_${timeframe}`,
        () => this.gamificationService.getUserStats(userId, timeframe),
        900000 // 15 minutes
      );
      
      return this.createResponse(stats, 'User statistics retrieved successfully');
    });
  }

  // Helper methods
  validateLessonData(data) {
    const required = ['lessonId'];
    const validation = this.validateRequest({ body: data }, required);
    if (!validation.isValid) {
      throw new Error(`Missing required fields: ${validation.missingFields.join(', ')}`);
    }
    
    return {
      lessonId: parseInt(data.lessonId),
      timeSpent: parseInt(data.timeSpent) || 15,
      score: parseInt(data.score) || 100,
      difficulty: data.difficulty || 'medium'
    };
  }

  adaptDashboardForAge(data, ageGroup) {
    const themeConfig = this.uiFactory.themes[ageGroup] || this.uiFactory.themes.teen;
    
    return {
      ...data,
      ui: {
        theme: ageGroup,
        components: {
          levelDisplay: this.uiFactory.createLevelDisplay(data.user, ageGroup),
          progressBar: this.uiFactory.createProgressBar(data.user.xpProgress, ageGroup),
          badges: data.badges.map(badge => this.uiFactory.createBadge(badge, ageGroup)),
          stats: this.createStatsCards(data, ageGroup)
        },
        css: this.uiFactory.generateCSS(ageGroup)
      }
    };
  }

  createStatsCards(data, ageGroup) {
    const stats = [
      { icon: '🏆', number: data.badges.length, label: 'Medalhas' },
      { icon: '🔥', number: data.streak.current_streak, label: 'Sequência' },
      { icon: '💰', number: data.wallet.coins, label: 'Moedas' },
      { icon: '💎', number: data.wallet.gems, label: 'Gemas' }
    ];
    
    return stats.map(stat => this.uiFactory.createStatCard(stat, ageGroup));
  }

  clearUserCaches(userId) {
    const cacheKeys = [
      `dashboard_${userId}_child`,
      `dashboard_${userId}_teen`,
      `dashboard_${userId}_adult`,
      `badges_${userId}`,
      `stats_${userId}_all`,
      `stats_${userId}_weekly`,
      `stats_${userId}_monthly`
    ];
    
    // Clear caches (implementation would depend on cache service)
    cacheKeys.forEach(key => {
      // this.cacheService.delete(key);
    });
  }

  extractUserId(req) {
    return parseInt(req.params.userId) || parseInt(req.user?.id) || 1;
  }
}

module.exports = RefactoredGamificationController;