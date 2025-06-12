const BaseController = require('../core/BaseController');
const gamificationService = require('../services/simplifiedGamificationService');
const AgeAdaptationService = require('../services/ageAdaptationService');

class SimplifiedGamificationController extends BaseController {
  constructor() {
    super('SimplifiedGamificationController');
    this.ageAdaptationService = new AgeAdaptationService();
  }
  async getDashboard(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId', 1);
      
      const cacheKey = `dashboard:${userId}`;
      const dashboard = await this.executeWithCache(
        cacheKey,
        async () => {
          const baseDashboard = await gamificationService.getUserDashboard(userId);
          
          // Get user's age group and adapt content
          const userAgeGroup = baseDashboard.user?.age_group || 'adult';
          const adaptedContent = this.ageAdaptationService.adaptContent(baseDashboard, userAgeGroup);
          const languageTemplates = this.ageAdaptationService.getLanguageTemplates(userAgeGroup);
          const uiAdaptations = this.ageAdaptationService.getUIAdaptations(userAgeGroup);
          
          return {
            ...baseDashboard,
            ...adaptedContent,
            ageGroup: userAgeGroup,
            languageTemplates,
            uiAdaptations,
            adaptedMessages: {
              welcome: languageTemplates.welcome,
              encouragement: languageTemplates.encouragement,
              progress: languageTemplates.progress
            }
          };
        },
        180000
      );
      
      return this.createResponse(dashboard, 'Dashboard retrieved successfully');
    });
  }

  // Process lesson completion with gamification rewards
  async processLessonCompletion(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      const { lessonId, timeSpent = 15, score = 100 } = req.body;

      const results = await gamificationService.processLessonCompletion(
        userId, 
        lessonId, 
        timeSpent, 
        score
      );

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Error processing lesson completion:', error);
      res.status(500).json({ 
        error: 'Failed to process lesson completion',
        message: error.message 
      });
    }
  }

  // Get user badges
  async getUserBadges(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const dashboard = await gamificationService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: {
          badges: dashboard.badges,
          totalEarned: dashboard.badges.length
        }
      });

    } catch (error) {
      console.error('Error getting user badges:', error);
      res.status(500).json({ 
        error: 'Failed to get badges',
        message: error.message 
      });
    }
  }

  // Get user wallet
  async getWallet(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const dashboard = await gamificationService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: {
          wallet: dashboard.wallet
        }
      });

    } catch (error) {
      console.error('Error getting wallet:', error);
      res.status(500).json({ 
        error: 'Failed to get wallet',
        message: error.message 
      });
    }
  }

  // Get user streaks
  async getStreaks(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const dashboard = await gamificationService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: {
          streak: dashboard.streak
        }
      });

    } catch (error) {
      console.error('Error getting streaks:', error);
      res.status(500).json({ 
        error: 'Failed to get streaks',
        message: error.message 
      });
    }
  }

  // Get user goals
  async getGoals(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const dashboard = await gamificationService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: {
          goals: dashboard.goals
        }
      });

    } catch (error) {
      console.error('Error getting goals:', error);
      res.status(500).json({ 
        error: 'Failed to get goals',
        message: error.message 
      });
    }
  }

  // Get notifications
  async getNotifications(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      const dashboard = await gamificationService.getUserDashboard(userId);
      
      res.json({
        success: true,
        data: {
          notifications: dashboard.notifications,
          unreadCount: dashboard.notifications.filter(n => !n.is_read).length
        }
      });

    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ 
        error: 'Failed to get notifications',
        message: error.message 
      });
    }
  }

  // Demo endpoint to simulate lesson completion
  async simulateLessonCompletion(req, res) {
    try {
      const userId = req.params.userId || req.user?.id || 1;
      
      // Simulate completing a lesson with random values
      const simulatedData = {
        lessonId: Math.floor(Math.random() * 10) + 1,
        timeSpent: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        score: Math.floor(Math.random() * 30) + 70 // 70-100 score
      };

      const results = await gamificationService.processLessonCompletion(
        userId,
        simulatedData.lessonId,
        simulatedData.timeSpent,
        simulatedData.score
      );

      res.json({
        success: true,
        message: 'Lesson completion simulated successfully!',
        simulatedData,
        results
      });

    } catch (error) {
      console.error('Error simulating lesson completion:', error);
      res.status(500).json({ 
        error: 'Failed to simulate lesson completion',
        message: error.message 
      });
    }
  }
}

module.exports = new SimplifiedGamificationController();