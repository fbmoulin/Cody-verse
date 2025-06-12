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

// Rota de health check
router.get('/health', require('../server/database').healthCheck);

module.exports = router;