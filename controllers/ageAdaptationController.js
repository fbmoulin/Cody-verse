const BaseController = require('../core/BaseController');
const AgeAdaptationService = require('../services/ageAdaptationService');

class AgeAdaptationController extends BaseController {
  constructor() {
    super('AgeAdaptationController');
    this.ageAdaptationService = new AgeAdaptationService();
  }

  async registerUserWithAge(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { name, email, birthDate, preferences = {} } = req.body;
      
      if (!name || !email || !birthDate) {
        throw new Error('Name, email, and birth date are required');
      }

      const ageGroup = this.ageAdaptationService.determineAgeGroup(birthDate);
      const age = this.ageAdaptationService.calculateAge(birthDate);

      if (age < 7) {
        throw new Error('Users must be at least 7 years old to register');
      }

      return this.createResponse({
        user: {
          name,
          email,
          ageGroup,
          age,
          birthDate
        },
        adaptations: this.ageAdaptationService.getUIAdaptations(ageGroup),
        languageTemplates: this.ageAdaptationService.getLanguageTemplates(ageGroup),
        welcomeMessage: this.ageAdaptationService.getLanguageTemplates(ageGroup).welcome,
        initialSetup: {
          startingCoins: ageGroup === 'child' ? 100 : ageGroup === 'teen' ? 50 : 25,
          recommendedSessionTime: ageGroup === 'child' ? 15 : ageGroup === 'teen' ? 25 : 45,
          maxQuestionsPerSession: ageGroup === 'child' ? 5 : ageGroup === 'teen' ? 10 : 15
        }
      }, 'User registered successfully with age adaptations');
    });
  }

  async getAgeAdaptedContent(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId');
      const { contentType = 'lesson', topic = 'programming', ageGroup = 'adult' } = req.query;

      const baseContent = {
        id: Date.now(),
        title: `${topic} - Lesson`,
        description: `Learn about ${topic}`,
        content: `This is educational content about ${topic}`
      };

      const adaptedContent = this.ageAdaptationService.adaptContent(baseContent, ageGroup, contentType);
      const exercises = this.ageAdaptationService.generateAgeAppropriateExercises(topic, ageGroup);

      return this.createResponse({
        originalContent: baseContent,
        adaptedContent,
        exercises,
        ageGroup,
        adaptations: {
          ui: this.ageAdaptationService.getUIAdaptations(ageGroup),
          language: this.ageAdaptationService.getLanguageTemplates(ageGroup)
        }
      }, 'Age-adapted content generated successfully');
    });
  }

  async generateAgeBasedExercises(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { topic, ageGroup = 'adult', difficulty = 'medium' } = req.body;

      if (!topic) {
        throw new Error('Topic is required');
      }

      const exercises = this.ageAdaptationService.generateAgeAppropriateExercises(topic, ageGroup, difficulty);

      return this.createResponse({
        exercises,
        ageGroup,
        topic,
        difficulty,
        metadata: {
          totalExercises: exercises.length,
          estimatedTime: exercises.length * (ageGroup === 'child' ? 3 : ageGroup === 'teen' ? 5 : 8),
          adaptations: this.ageAdaptationService.getUIAdaptations(ageGroup),
          motivation: this.ageAdaptationService.generateAgeBasedMotivation(ageGroup, { completed: 0, total: exercises.length })
        }
      }, 'Age-based exercises generated successfully');
    });
  }

  async getAgeProfile(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { birthDate, currentAgeGroup } = req.query;

      let ageGroup = currentAgeGroup || 'adult';
      let age = null;

      if (birthDate) {
        ageGroup = this.ageAdaptationService.determineAgeGroup(birthDate);
        age = this.ageAdaptationService.calculateAge(birthDate);
      }

      return this.createResponse({
        ageGroup,
        age,
        adaptations: {
          ui: this.ageAdaptationService.getUIAdaptations(ageGroup),
          language: this.ageAdaptationService.getLanguageTemplates(ageGroup),
          exercises: this.ageAdaptationService.exerciseAdaptations[ageGroup]
        },
        recommendations: this.generateAgeBasedRecommendations(ageGroup),
        gamificationSettings: {
          pointsMultiplier: ageGroup === 'child' ? 2.0 : ageGroup === 'teen' ? 1.5 : 1.0,
          celebrationStyle: ageGroup === 'child' ? 'high_energy' : ageGroup === 'teen' ? 'motivational' : 'professional',
          maxSessionTime: ageGroup === 'child' ? 15 : ageGroup === 'teen' ? 25 : 45
        }
      }, 'Age profile retrieved successfully');
    });
  }

  async adaptGamificationRewards(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { ageGroup, achievement } = req.body;

      if (!ageGroup || !achievement) {
        throw new Error('Age group and achievement data are required');
      }

      const adaptedRewards = this.ageAdaptationService.adaptGamificationRewards(ageGroup, achievement);

      return this.createResponse({
        originalAchievement: achievement,
        adaptedRewards,
        ageGroup,
        motivationalMessage: this.ageAdaptationService.generateAgeBasedMotivation(ageGroup, achievement)
      }, 'Gamification rewards adapted successfully');
    });
  }

  generateAgeBasedRecommendations(ageGroup) {
    const recommendations = {
      child: [
        'Faça pausas frequentes durante os estudos',
        'Use cores e desenhos para ajudar a lembrar',
        'Peça ajuda quando precisar',
        'Comemore cada conquista!'
      ],
      teen: [
        'Defina metas de estudo realistas',
        'Use técnicas de memorização ativa',
        'Conecte o aprendizado com seus interesses',
        'Compartilhe conhecimento com colegas'
      ],
      adult: [
        'Estabeleça rotinas de estudo consistentes',
        'Aplique conhecimentos em contextos práticos',
        'Mantenha foco nos objetivos profissionais',
        'Monitore seu progresso regularmente'
      ]
    };

    return recommendations[ageGroup] || recommendations.adult;
  }
}

module.exports = AgeAdaptationController;