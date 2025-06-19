const BaseController = require('../core/BaseController');
const AILearningEngine = require('../core/AILearningEngine');

/**
 * Advanced Learning Controller - Manages AI-powered learning features
 */
class AdvancedLearningController extends BaseController {
  constructor() {
    super('AdvancedLearningController');
    this.aiLearningEngine = new AILearningEngine();
  }

  // Generate personalized learning path
  async generateLearningPath(req, res) {
    await this.handleRequest(req, res, async () => {
      const { courseId, userProfile } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!courseId || !userProfile) {
        return res.status(400).json(this.createErrorResponse('Course ID and user profile are required', 400));
      }

      const learningPath = await this.aiLearningEngine.generatePersonalizedLearningPath(
        userId, 
        userProfile, 
        courseId
      );

      return this.createResponse(learningPath, 'Personalized learning path generated successfully');
    });
  }

  // Get study techniques
  async getStudyTechniques(req, res) {
    await this.handleRequest(req, res, async () => {
      const techniques = this.aiLearningEngine.getStudyTechniques();
      
      return this.createResponse(techniques, 'Study techniques retrieved successfully');
    });
  }

  // Implement advanced study technique
  async implementStudyTechnique(req, res) {
    await this.handleRequest(req, res, async () => {
      const { technique, content, userProgress } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!technique || !content) {
        return res.status(400).json(this.createErrorResponse('Technique and content are required', 400));
      }

      const implementation = await this.aiLearningEngine.implementAdvancedStudyTechnique(
        userId,
        technique,
        content,
        userProgress || {}
      );

      return this.createResponse(implementation, 'Study technique implementation created successfully');
    });
  }

  // Spaced repetition endpoints
  async scheduleSpacedRepetition(req, res) {
    await this.handleRequest(req, res, async () => {
      const { conceptId, performance } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!conceptId || !performance) {
        return res.status(400).json(this.createErrorResponse('Concept ID and performance data are required', 400));
      }

      const schedule = this.aiLearningEngine.calculateSpacedRepetitionSchedule(
        userId,
        conceptId,
        performance
      );

      return this.createResponse(schedule, 'Spaced repetition schedule updated successfully');
    });
  }

  async getConceptsDueForReview(req, res) {
    await this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req) || 'demo_user';
      
      const dueConceptsData = this.aiLearningEngine.getConceptsDueForReview(userId);
      
      return this.createResponse(dueConceptsData, 'Concepts due for review retrieved successfully');
    });
  }

  async getSpacedRepetitionStats(req, res) {
    await this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req) || 'demo_user';
      
      const stats = this.aiLearningEngine.getSpacedRepetitionStats(userId);
      
      return this.createResponse(stats, 'Spaced repetition statistics retrieved successfully');
    });
  }

  // Content adaptation
  async adaptContent(req, res) {
    await this.handleRequest(req, res, async () => {
      const { content, learningProfile } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!content) {
        return res.status(400).json(this.createErrorResponse('Content is required', 400));
      }

      const adaptedContent = await this.aiLearningEngine.adaptContentForLearner(
        userId,
        content,
        learningProfile || {}
      );

      return this.createResponse(adaptedContent, 'Content adapted for learner successfully');
    });
  }

  // Learning analytics
  async generateLearningInsights(req, res) {
    await this.handleRequest(req, res, async () => {
      const { learningData } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!learningData) {
        return res.status(400).json(this.createErrorResponse('Learning data is required', 400));
      }

      const insights = await this.aiLearningEngine.generateLearningInsights(userId, learningData);

      return this.createResponse(insights, 'Learning insights generated successfully');
    });
  }

  // Learning profile management
  async getLearningProfile(req, res) {
    await this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req) || 'demo_user';
      
      const profile = this.aiLearningEngine.getLearningProfile(userId);
      
      if (!profile) {
        return res.status(404).json(this.createErrorResponse('Learning profile not found', 404));
      }

      return this.createResponse(profile, 'Learning profile retrieved successfully');
    });
  }

  async updateLearningProfile(req, res) {
    await this.handleRequest(req, res, async () => {
      const { profileUpdates } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!profileUpdates) {
        return res.status(400).json(this.createErrorResponse('Profile updates are required', 400));
      }

      const updatedProfile = this.aiLearningEngine.updateLearningProfile(userId, profileUpdates);

      return this.createResponse(updatedProfile, 'Learning profile updated successfully');
    });
  }

  // Comprehensive learning session
  async startAdvancedLearningSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionType, content, preferences } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!sessionType || !content) {
        return res.status(400).json(this.createErrorResponse('Session type and content are required', 400));
      }

      try {
        // Get or create learning profile
        let profile = this.aiLearningEngine.getLearningProfile(userId);
        if (!profile && preferences) {
          profile = this.aiLearningEngine.updateLearningProfile(userId, preferences);
        }

        // Adapt content for the learner
        const adaptedContent = await this.aiLearningEngine.adaptContentForLearner(
          userId,
          content,
          profile
        );

        // Get appropriate study technique
        const techniques = this.aiLearningEngine.getStudyTechniques();
        const recommendedTechnique = this.selectOptimalTechnique(techniques, profile, sessionType);

        // Create study technique implementation
        const implementation = await this.aiLearningEngine.implementAdvancedStudyTechnique(
          userId,
          recommendedTechnique.id,
          content,
          { learningStyle: profile?.learningStyle || 'mixed', completionPercentage: 0 }
        );

        // Get spaced repetition concepts due for review
        const dueForReview = this.aiLearningEngine.getConceptsDueForReview(userId);

        const session = {
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          sessionType,
          adaptedContent: adaptedContent.adaptedContent,
          recommendedTechnique,
          implementation: implementation.implementation,
          conceptsForReview: dueForReview.slice(0, 5), // Limit to 5 concepts
          startTime: Date.now(),
          estimatedDuration: this.calculateSessionDuration(implementation, dueForReview.length)
        };

        return this.createResponse(session, 'Advanced learning session started successfully');

      } catch (error) {
        throw new Error(`Failed to start learning session: ${error.message}`);
      }
    });
  }

  // Complete learning session with results
  async completeLearningSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId, results, conceptPerformances } = req.body;
      const userId = this.extractUserId(req) || 'demo_user';

      if (!sessionId || !results) {
        return res.status(400).json(this.createErrorResponse('Session ID and results are required', 400));
      }

      try {
        // Update spaced repetition schedules based on concept performances
        const updatedSchedules = [];
        if (conceptPerformances && Array.isArray(conceptPerformances)) {
          for (const performance of conceptPerformances) {
            const schedule = this.aiLearningEngine.calculateSpacedRepetitionSchedule(
              userId,
              performance.conceptId,
              performance
            );
            updatedSchedules.push(schedule);
          }
        }

        // Generate learning insights based on session results
        const learningData = {
          sessionsCompleted: (results.previousSessions || 0) + 1,
          avgSessionDuration: results.sessionDuration || 0,
          conceptsMastered: results.conceptsMastered || 0,
          quizScores: results.quizScores || [],
          completionRate: results.completionRate || 0,
          timePerTopic: results.timePerTopic || {},
          sessionResults: results
        };

        const insights = await this.aiLearningEngine.generateLearningInsights(userId, learningData);

        // Update learning profile based on session performance
        const profileUpdates = {
          lastSessionDate: Date.now(),
          totalSessions: (results.previousSessions || 0) + 1,
          averagePerformance: results.averageScore || 0,
          preferredSessionDuration: results.sessionDuration || 0,
          strongAreas: results.strongAreas || [],
          improvementAreas: results.improvementAreas || []
        };

        const updatedProfile = this.aiLearningEngine.updateLearningProfile(userId, profileUpdates);

        const completionResult = {
          sessionId,
          completedAt: Date.now(),
          duration: results.sessionDuration,
          performance: results,
          updatedSchedules,
          insights: insights.insights,
          updatedProfile,
          recommendations: this.generateSessionRecommendations(results, insights.insights)
        };

        return this.createResponse(completionResult, 'Learning session completed successfully');

      } catch (error) {
        throw new Error(`Failed to complete learning session: ${error.message}`);
      }
    });
  }

  // Helper methods
  selectOptimalTechnique(techniques, profile, sessionType) {
    // Default to spaced repetition for review sessions
    if (sessionType === 'review') {
      return techniques.find(t => t.id === 'spaced_repetition') || techniques[0];
    }

    // Select based on learning style
    const learningStyle = profile?.learningStyle || 'mixed';
    const suitableTechniques = techniques.filter(t => 
      t.adaptableFor.includes(learningStyle) || t.adaptableFor.includes('all')
    );

    // Return highest effectiveness technique for the learning style
    return suitableTechniques.sort((a, b) => b.effectiveness - a.effectiveness)[0] || techniques[0];
  }

  calculateSessionDuration(implementation, reviewConceptsCount) {
    const baseDuration = implementation?.steps?.reduce((total, step) => {
      const stepDuration = parseInt(step.duration) || 15;
      return total + stepDuration;
    }, 0) || 30;

    const reviewTime = reviewConceptsCount * 3; // 3 minutes per concept
    
    return baseDuration + reviewTime;
  }

  generateSessionRecommendations(results, insights) {
    const recommendations = [];

    if (results.completionRate < 70) {
      recommendations.push({
        type: 'technique_adjustment',
        message: 'Consider breaking content into smaller segments',
        priority: 'high'
      });
    }

    if (results.averageScore < 60) {
      recommendations.push({
        type: 'review_needed',
        message: 'Schedule additional review sessions for difficult concepts',
        priority: 'high'
      });
    }

    if (insights.recommendedActions) {
      insights.recommendedActions.forEach((action, index) => {
        recommendations.push({
          type: 'ai_insight',
          message: action,
          priority: index === 0 ? 'medium' : 'low'
        });
      });
    }

    return recommendations;
  }

  // Demo endpoints for testing
  async createDemoLearningSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const demoContent = {
        title: "Fundamentos de Redes Neurais",
        description: "Introdução aos conceitos básicos de redes neurais artificiais",
        body: `As redes neurais artificiais são modelos computacionais inspirados no funcionamento do cérebro humano. 
               Elas consistem em neurônios artificiais conectados que processam informações de forma paralela.
               
               Conceitos principais:
               1. Neurônios artificiais (perceptrons)
               2. Camadas (input, hidden, output)
               3. Pesos e bias
               4. Funções de ativação
               5. Algoritmo de backpropagation
               
               As redes neurais são fundamentais para o aprendizado de máquina moderno e inteligência artificial.`
      };

      const demoProfile = {
        learningStyle: req.body.learningStyle || 'visual',
        experienceLevel: req.body.experienceLevel || 'beginner',
        studyTime: '1-2 hours/day',
        interests: ['inteligência artificial', 'programação', 'matemática'],
        preferredPace: 'moderate'
      };

      const session = await this.startAdvancedLearningSession({
        body: {
          sessionType: 'learning',
          content: demoContent,
          preferences: demoProfile
        }
      }, { json: (data) => data });

      return this.createResponse(session.data, 'Demo learning session created successfully');
    });
  }
}

module.exports = AdvancedLearningController;