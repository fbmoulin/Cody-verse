const BaseController = require('../core/BaseController');
const gamificationService = require('../services/simplifiedGamificationService');
const AgeAdaptationService = require('../services/ageAdaptationService');

class SimplifiedGamificationController extends BaseController {
  constructor() {
    super('SimplifiedGamificationController');
    this.ageAdaptationService = new AgeAdaptationService();
  }
  async getDashboard(req, res) {
    try {
      const userId = this.parseIntParam(req.params.userId, 'userId', 1);
      
      // Validate user ID
      if (!userId || userId <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid user ID provided'
        });
      }

      const cacheKey = `dashboard:${userId}`;
      const dashboard = await this.executeWithCache(
        cacheKey,
        async () => {
          try {
            const baseDashboard = await gamificationService.getUserDashboard(userId);
            
            if (!baseDashboard) {
              // Return default dashboard for new users
              return {
                user: { id: userId, name: 'Usuário', level: 1, xp: 0, age_group: 'adult' },
                stats: { totalXP: 0, level: 1, completedLessons: 0, streak: 0 },
                badges: [],
                wallet: { coins: 0, gems: 0 },
                streaks: { current: 0, longest: 0, lastActivity: null },
                goals: [],
                notifications: []
              };
            }
            
            // Simplified age adaptation to improve performance
            const userAgeGroup = baseDashboard.user?.age_group || 'adult';
            const languageTemplates = this.ageAdaptationService.getLanguageTemplates(userAgeGroup);
            const uiAdaptations = this.ageAdaptationService.getUIAdaptations(userAgeGroup);
            
            // Return lightweight response without heavy content adaptation
            return {
              ...baseDashboard,
              ageGroup: userAgeGroup,
              languageTemplates,
              uiAdaptations,
              adaptedMessages: {
                welcome: languageTemplates?.welcome || 'Bem-vindo!',
                encouragement: languageTemplates?.encouragement || 'Continue assim!',
                progress: languageTemplates?.progress || 'Progresso excelente!'
              }
            };
          } catch (serviceError) {
            console.error('Gamification service error:', serviceError);
            // Return fallback dashboard
            return {
              user: { id: userId, name: 'Usuário', level: 1, xp: 0, age_group: 'adult' },
              stats: { totalXP: 0, level: 1, completedLessons: 0, streak: 0 },
              badges: [],
              wallet: { coins: 0, gems: 0 },
              streaks: { current: 0, longest: 0, lastActivity: null },
              goals: [],
              notifications: [],
              error: 'Service temporarily unavailable'
            };
          }
        },
        300000 // Increased cache time to 5 minutes
      );
      
      res.json({
        success: true,
        data: dashboard,
        message: 'Dashboard retrieved successfully'
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve dashboard',
        message: error.message
      });
    }
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