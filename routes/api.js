const express = require('express');
const router = express.Router();

// Controllers
const courseController = require('../controllers/courseController');
const progressController = require('../controllers/progressController');
const codyController = require('../controllers/codyController');
const userController = require('../controllers/userController');
const gamificationController = require('../controllers/simplifiedGamificationController');
const ageAdaptationController = require('../controllers/ageAdaptationController');

// Advanced AI Services
const learningAnalyticsService = require('../services/learningAnalyticsService');
const aiContentGenerationService = require('../services/aiContentGenerationService');
const performanceAnalyzer = require('../services/performanceAnalyzer');
const errorMonitoring = require('../services/errorMonitoringService');

// Controllers
const studyTechniquesController = require('../controllers/studyTechniquesController');

// Middleware de autenticação básica
const authenticateUser = require('../server/auth');

// Rotas de curso
router.get('/courses', courseController.getAllCourses);
router.get('/courses/:id', courseController.getCourseById);
router.get('/courses/:id/lessons', courseController.getCourseLessons);
router.get('/lessons/:id', courseController.getLessonById);

// Rotas de progresso do usuário
router.get('/progress/:userId', authenticateUser, progressController.getUserProgress);
router.post('/progress/lesson', authenticateUser, progressController.updateLessonProgress);
router.post('/progress/module', authenticateUser, progressController.updateModuleProgress);
router.get('/progress/:userId/achievements', authenticateUser, progressController.getUserAchievements);

// Rotas do Cody (IA Assistant) - bind methods to preserve context
router.post('/cody/interact', codyController.handleInteraction.bind(codyController));
router.get('/cody/context/:userId', authenticateUser, codyController.getUserContext.bind(codyController));
router.post('/cody/feedback', codyController.provideFeedback.bind(codyController));

// Rotas de usuário
router.post('/users', userController.createUser);
router.get('/users/:id', authenticateUser, userController.getUserById);
router.put('/users/:id', authenticateUser, userController.updateUser);
router.get('/users/:id/stats', authenticateUser, userController.getUserStats);

// Advanced AI Analytics Routes
router.get('/analytics/difficulty/:userId/:lessonId', authenticateUser, async (req, res) => {
  try {
    const { userId, lessonId } = req.params;
    const assessment = await learningAnalyticsService.assessLearningDifficulty(userId, lessonId);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assess learning difficulty' });
  }
});

router.get('/analytics/intervention/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const prediction = await learningAnalyticsService.predictLearnerStruggles(userId);
    res.json({ success: true, data: prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to predict learner struggles' });
  }
});

router.get('/analytics/schedule/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const schedule = await learningAnalyticsService.optimizeStudySchedule(userId);
    res.json({ success: true, data: schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to optimize study schedule' });
  }
});

router.get('/analytics/insights/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const insights = await learningAnalyticsService.generatePerformanceInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate performance insights' });
  }
});

// Enhanced Cody AI Routes
router.post('/cody/analyze-state', authenticateUser, async (req, res) => {
  try {
    const { userId, message, context } = req.body;
    const analysis = await codyController.analyzeUserState(userId, message, context);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to analyze user state' });
  }
});

router.get('/cody/learning-recommendations/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const userAnalysis = await codyController.analyzeUserState(userId, null, null);
    const suggestions = await codyController.getAdaptiveSuggestions('recommendations', userAnalysis);
    res.json({ success: true, data: { suggestions, userState: userAnalysis } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get learning recommendations' });
  }
});

// AI Content Generation Routes
router.post('/ai/generate-content', authenticateUser, async (req, res) => {
  try {
    const { userId, topic, userLevel, learningStyle } = req.body;
    const content = await aiContentGenerationService.generatePersonalizedContent(userId, topic, userLevel, learningStyle);
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate personalized content' });
  }
});

router.post('/ai/generate-quiz', authenticateUser, async (req, res) => {
  try {
    const { userId, topic, performanceHistory } = req.body;
    const quiz = await aiContentGenerationService.generateAdaptiveQuiz(userId, topic, performanceHistory);
    res.json({ success: true, data: quiz });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate adaptive quiz' });
  }
});

router.post('/ai/case-study', authenticateUser, async (req, res) => {
  try {
    const { topic, industryContext, complexity } = req.body;
    const caseStudy = await aiContentGenerationService.generateRealWorldCaseStudy(topic, industryContext, complexity);
    res.json({ success: true, data: caseStudy });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate case study' });
  }
});

router.post('/ai/explain', authenticateUser, async (req, res) => {
  try {
    const { concept, userQuestion, userId } = req.body;
    const userProgress = await learningAnalyticsService.getUserRecentActivity(userId);
    const explanation = await aiContentGenerationService.generateContextualExplanation(concept, userQuestion, userProgress);
    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate explanation' });
  }
});

router.post('/ai/motivate', authenticateUser, async (req, res) => {
  try {
    const { userId, userState, achievements, strugglingAreas } = req.body;
    const motivation = await aiContentGenerationService.generateMotivationalContent(userState, achievements, strugglingAreas);
    res.json({ success: true, data: motivation });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate motivational content' });
  }
});

// Advanced Study Techniques Routes
router.get('/study-techniques/profile/:userId', authenticateUser, studyTechniquesController.analyzeStudyProfile.bind(studyTechniquesController));
router.get('/study-techniques/recommendations/:userId', authenticateUser, studyTechniquesController.getPersonalizedTechniques.bind(studyTechniquesController));
router.post('/study-techniques/pomodoro/start/:userId', authenticateUser, studyTechniquesController.startPomodoroSession.bind(studyTechniquesController));
router.post('/study-techniques/session/end/:sessionId', authenticateUser, studyTechniquesController.endStudySession.bind(studyTechniquesController));
router.post('/study-techniques/active-recall/:userId', authenticateUser, studyTechniquesController.generateActiveRecall.bind(studyTechniquesController));
router.post('/study-techniques/feynman/:userId', authenticateUser, studyTechniquesController.implementFeynman.bind(studyTechniquesController));
router.post('/study-techniques/mind-map/:userId', authenticateUser, studyTechniquesController.createMindMap.bind(studyTechniquesController));
router.post('/study-techniques/spaced-repetition/:userId', authenticateUser, studyTechniquesController.setupSpacedRepetition.bind(studyTechniquesController));
router.get('/study-techniques/analytics/:userId', authenticateUser, studyTechniquesController.getStudyAnalytics.bind(studyTechniquesController));

// Gamification Routes
router.get('/gamification/dashboard/:userId', gamificationController.getDashboard.bind(gamificationController));
router.get('/gamification/badges/:userId', gamificationController.getUserBadges.bind(gamificationController));
router.get('/gamification/wallet/:userId', gamificationController.getWallet.bind(gamificationController));
router.get('/gamification/streaks/:userId', gamificationController.getStreaks.bind(gamificationController));
router.get('/gamification/goals/:userId', gamificationController.getGoals.bind(gamificationController));
router.get('/gamification/notifications/:userId', gamificationController.getNotifications.bind(gamificationController));
router.post('/gamification/lesson-complete/:userId', gamificationController.processLessonCompletion.bind(gamificationController));
router.post('/gamification/simulate-lesson/:userId', gamificationController.simulateLessonCompletion.bind(gamificationController));

// Age Adaptation Routes
const ageController = new (require('../controllers/ageAdaptationController'))();
router.post('/age-adaptation/register', ageController.registerUserWithAge.bind(ageController));
router.get('/age-adaptation/content/:userId', ageController.getAgeAdaptedContent.bind(ageController));
router.post('/age-adaptation/exercises', ageController.generateAgeBasedExercises.bind(ageController));
router.get('/age-adaptation/profile', ageController.getAgeProfile.bind(ageController));
router.post('/age-adaptation/rewards', ageController.adaptGamificationRewards.bind(ageController));

// Performance monitoring endpoints
router.get('/performance/metrics', async (req, res) => {
  try {
    const cacheService = require('../core/services/cache_service');
    const report = performanceAnalyzer.getPerformanceReport();
    const cacheStats = cacheService.getStats();
    
    res.json({
      success: true,
      data: {
        queryPerformance: report,
        cacheStats: {
          size: cacheStats.size,
          hitRate: Math.round((cacheStats.hits || 0) / Math.max((cacheStats.hits || 0) + (cacheStats.misses || 0), 1) * 100),
          memoryUsage: cacheStats.memoryUsage
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error monitoring and logging endpoints
router.get('/monitoring/errors', async (req, res) => {
  try {
    const errorMonitoring = require('../services/errorMonitoringService');
    const timeRange = req.query.timeRange || '24h';
    const report = errorMonitoring.generateErrorReport(timeRange);
    
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitoring/status', async (req, res) => {
  try {
    const errorMonitoring = require('../services/errorMonitoringService');
    const logger = require('../server/logger');
    
    const status = {
      errorMonitoring: errorMonitoring.getMonitoringStatus(),
      logging: logger.healthCheck(),
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitoring/logs/health', async (req, res) => {
  try {
    const logger = require('../server/logger');
    const health = logger.healthCheck();
    
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitoring/errors/summary', async (req, res) => {
  try {
    const logger = require('../server/logger');
    const errorSummary = logger.getErrorSummary();
    
    res.json({ success: true, data: errorSummary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/database', async (req, res) => {
  try {
    const analysis = await performanceAnalyzer.analyzeQueryPerformance();
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/performance/clear-cache', (req, res) => {
  try {
    const cacheService = require('../core/services/cache_service');
    cacheService.clear();
    res.json({ success: true, message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/performance/health', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: await performanceAnalyzer.executeQuery('SELECT NOW() as timestamp'),
      services: {
        cache: 'operational',
        database: 'operational',
        api: 'operational'
      }
    };
    res.json({ success: true, data: healthData });
  } catch (error) {
    res.status(503).json({ 
      success: false, 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error monitoring endpoints
router.get('/monitoring/dashboard', (req, res) => {
  try {
    const dashboardData = errorMonitoring.getDashboardData();
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitoring/alerts', (req, res) => {
  try {
    const alerts = errorMonitoring.recentAlerts || [];
    const limit = parseInt(req.query.limit) || 50;
    res.json({ 
      success: true, 
      data: alerts.slice(0, limit),
      total: alerts.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/monitoring/system-health', (req, res) => {
  try {
    const health = errorMonitoring.getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/monitoring/test-error', (req, res) => {
  try {
    const { type = 'critical', message = 'Test error' } = req.body;
    
    const testError = new Error(message);
    testError.name = 'TestError';
    
    if (type === 'critical') {
      errorMonitoring.trackCriticalError(testError, { source: 'manual_test' });
    } else if (type === 'warning') {
      errorMonitoring.trackWarningError(testError, { source: 'manual_test' });
    } else if (type === 'database') {
      errorMonitoring.trackDatabaseError(testError, 'test_operation');
    }
    
    res.json({ 
      success: true, 
      message: `${type} error tracked successfully`,
      error: testError.message
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/monitoring/thresholds', (req, res) => {
  try {
    const thresholds = req.body;
    errorMonitoring.updateThresholds(thresholds);
    
    res.json({ 
      success: true, 
      message: 'Thresholds updated successfully',
      thresholds: errorMonitoring.errorThresholds
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs/summary', (req, res) => {
  try {
    const logger = require('../server/logger');
    const errorSummary = logger.getErrorSummary();
    const logHealth = logger.healthCheck();
    
    res.json({
      success: true,
      data: {
        errorSummary,
        logHealth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UX Enhancement Routes
const UXController = require('../controllers/uxController');
const uxController = new UXController();

// Loading States
router.get('/ux/loading-states', (req, res) => uxController.getLoadingStates(req, res));
router.post('/ux/loading/start', (req, res) => uxController.startLoading(req, res));
router.post('/ux/loading/stop', (req, res) => uxController.stopLoading(req, res));

// Skeleton Components
router.get('/ux/skeleton/:type', (req, res) => uxController.getSkeletonComponent(req, res));
router.get('/ux/skeleton.css', (req, res) => uxController.getSkeletonCSS(req, res));

// Offline Mode
router.get('/ux/offline/status', (req, res) => uxController.getOfflineStatus(req, res));
router.get('/ux/offline/cache/:key', (req, res) => uxController.getCachedData(req, res));
router.post('/ux/offline/mode', (req, res) => uxController.setOfflineMode(req, res));
router.post('/ux/offline/queue', (req, res) => uxController.queueOfflineAction(req, res));
router.post('/ux/offline/sync', (req, res) => uxController.syncOfflineActions(req, res));

// Progress Indicators
router.post('/ux/progress', (req, res) => uxController.createProgressIndicator(req, res));
router.put('/ux/progress/:id', (req, res) => uxController.updateProgress(req, res));
router.get('/ux/progress/:id', (req, res) => uxController.getProgressIndicator(req, res));
router.get('/ux/progress/:id/html', (req, res) => uxController.getProgressHTML(req, res));

// Enhanced Loading Routes
router.get('/ux/courses/enhanced', (req, res) => uxController.getEnhancedCourseList(req, res));
router.get('/ux/course/:courseId/load', (req, res) => uxController.loadCourseWithStates(req, res));

// UX Metrics
router.get('/ux/metrics', (req, res) => uxController.getUXMetrics(req, res));

// Advanced Learning Features Routes
const AdvancedLearningController = require('../controllers/advancedLearningController');
const advancedLearningController = new AdvancedLearningController();

// Learning Path Generation
router.post('/learning/path/generate', (req, res) => advancedLearningController.generateLearningPath(req, res));
router.get('/learning/profile', (req, res) => advancedLearningController.getLearningProfile(req, res));
router.put('/learning/profile', (req, res) => advancedLearningController.updateLearningProfile(req, res));

// Study Techniques
router.get('/learning/techniques', (req, res) => advancedLearningController.getStudyTechniques(req, res));
router.post('/learning/techniques/implement', (req, res) => advancedLearningController.implementStudyTechnique(req, res));

// Spaced Repetition
router.post('/learning/spaced-repetition/schedule', (req, res) => advancedLearningController.scheduleSpacedRepetition(req, res));
router.get('/learning/spaced-repetition/due', (req, res) => advancedLearningController.getConceptsDueForReview(req, res));
router.get('/learning/spaced-repetition/stats', (req, res) => advancedLearningController.getSpacedRepetitionStats(req, res));

// Content Adaptation
router.post('/learning/content/adapt', (req, res) => advancedLearningController.adaptContent(req, res));

// Learning Analytics
router.post('/learning/insights/generate', (req, res) => advancedLearningController.generateLearningInsights(req, res));

// Advanced Learning Sessions
router.post('/learning/session/start', (req, res) => advancedLearningController.startAdvancedLearningSession(req, res));
router.post('/learning/session/complete', (req, res) => advancedLearningController.completeLearningSession(req, res));

// Demo Endpoints
router.post('/learning/demo/session', (req, res) => advancedLearningController.createDemoLearningSession(req, res));

// Integration Health Monitoring Routes
const IntegrationHealthController = require('../controllers/integrationHealthController');
const integrationHealthController = new IntegrationHealthController();

router.get('/integrations/health', (req, res) => integrationHealthController.getSystemHealth(req, res));
router.get('/integrations/health/:integrationId', (req, res) => integrationHealthController.getIntegrationHealth(req, res));
router.post('/integrations/health/check-all', (req, res) => integrationHealthController.runAllHealthChecks(req, res));
router.post('/integrations/recovery/:integrationId', (req, res) => integrationHealthController.recoverIntegration(req, res));
router.get('/integrations/issues/critical', (req, res) => integrationHealthController.getCriticalIssues(req, res));
router.get('/integrations/availability/:integrationId', (req, res) => integrationHealthController.checkIntegrationAvailability(req, res));
router.get('/integrations/circuit-breakers', (req, res) => integrationHealthController.getCircuitBreakerStatus(req, res));
router.post('/integrations/circuit-breakers/:integrationId/reset', (req, res) => integrationHealthController.resetCircuitBreaker(req, res));
router.get('/integrations/metrics', (req, res) => integrationHealthController.getIntegrationMetrics(req, res));
router.get('/integrations/report/detailed', (req, res) => integrationHealthController.getDetailedHealthReport(req, res));
router.post('/integrations/test/recovery/:integrationId', (req, res) => integrationHealthController.testIntegrationRecovery(req, res));

// Debug and Memory Optimization Routes
router.get('/debug/memory', async (req, res) => {
  try {
    const memoryOptimizer = require('../core/MemoryOptimizer');
    const optimizer = new memoryOptimizer();
    const report = optimizer.getMemoryReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/debug/memory/optimize', async (req, res) => {
  try {
    const memoryOptimizer = require('../core/MemoryOptimizer');
    const optimizer = new memoryOptimizer();
    const result = await optimizer.optimizeMemoryUsage();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/debug/system', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      data: {
        memory: memoryUsage,
        uptime: uptime,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rota de health check
router.get('/health', require('../server/database').healthCheck);

module.exports = router;