const express = require('express');
const router = express.Router();

// Controllers
const courseController = require('../controllers/courseController');
const progressController = require('../controllers/progressController');
const codyController = require('../controllers/codyController');
const userController = require('../controllers/userController');

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

// Rotas do Cody (IA Assistant)
router.post('/cody/interact', codyController.handleInteraction);
router.get('/cody/context/:userId', authenticateUser, codyController.getUserContext);
router.post('/cody/feedback', codyController.provideFeedback);

// Rotas de usuário
router.post('/users', userController.createUser);
router.get('/users/:id', authenticateUser, userController.getUserById);
router.put('/users/:id', authenticateUser, userController.updateUser);
router.get('/users/:id/stats', authenticateUser, userController.getUserStats);

// Rota de health check
router.get('/health', require('../server/database').healthCheck);

module.exports = router;