const BaseController = require('../core/BaseController');
const AgeAdaptationService = require('../services/ageAdaptationService');
const { Pool } = require('pg');

class AgeAdaptationController extends BaseController {
  constructor() {
    super('AgeAdaptationController');
    this.ageAdaptationService = new AgeAdaptationService();
  }

  async registerUser(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { name, email, birthDate, preferences = {} } = req.body;
      
      if (!name || !email || !birthDate) {
        throw new Error('Name, email, and birth date are required');
      }

      const ageGroup = this.ageAdaptationService.determineAgeGroup(birthDate);
      const age = this.ageAdaptationService.calculateAge(birthDate);

      // Validate age group
      if (age < 7) {
        throw new Error('Users must be at least 7 years old to register');
      }

      const client = await db.pool.connect();
      try {
        // Create user with age information
        const userResult = await client.query(`
          INSERT INTO users (name, email, birth_date, age_group, content_preferences, profile_data)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          name,
          email,
          birthDate,
          ageGroup,
          JSON.stringify(preferences),
          JSON.stringify({
            registrationDate: new Date().toISOString(),
            initialAgeGroup: ageGroup,
            age: age
          })
        ]);

        const user = userResult.rows[0];

        // Initialize gamification data with age-appropriate settings
        await this.initializeAgeBasedGamification(user.id, ageGroup, client);

        return this.createResponse({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            ageGroup: user.age_group,
            age: age
          },
          adaptations: this.ageAdaptationService.getUIAdaptations(ageGroup),
          languageTemplates: this.ageAdaptationService.getLanguageTemplates(ageGroup),
          welcomeMessage: this.ageAdaptationService.getLanguageTemplates(ageGroup).welcome
        }, 'User registered successfully with age adaptations');

      } finally {
        client.release();
      }
    });
  }

  async updateUserAge(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId');
      const { birthDate } = req.body;

      if (!birthDate) {
        throw new Error('Birth date is required');
      }

      const newAgeGroup = this.ageAdaptationService.determineAgeGroup(birthDate);
      const age = this.ageAdaptationService.calculateAge(birthDate);

      const client = await db.pool.connect();
      try {
        // Update user age information
        await client.query(`
          UPDATE users 
          SET birth_date = $1, age_group = $2, updated_at = NOW()
          WHERE id = $3
        `, [birthDate, newAgeGroup, userId]);

        // Update gamification settings if age group changed
        const currentUserResult = await client.query('SELECT age_group FROM users WHERE id = $1', [userId]);
        const currentAgeGroup = currentUserResult.rows[0]?.age_group;

        if (currentAgeGroup !== newAgeGroup) {
          await this.updateGamificationForAgeGroup(userId, newAgeGroup, client);
        }

        return this.createResponse({
          userId,
          newAgeGroup,
          age,
          adaptations: this.ageAdaptationService.getUIAdaptations(newAgeGroup),
          languageTemplates: this.ageAdaptationService.getLanguageTemplates(newAgeGroup)
        }, 'User age updated successfully');

      } finally {
        client.release();
      }
    });
  }

  async getAgeAdaptedContent(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId');
      const { contentType, contentId } = req.query;

      const client = await db.pool.connect();
      try {
        // Get user's age group
        const userResult = await client.query('SELECT age_group FROM users WHERE id = $1', [userId]);
        const ageGroup = userResult.rows[0]?.age_group || 'adult';

        // Get original content
        let originalContent;
        if (contentType === 'lesson') {
          const lessonResult = await client.query('SELECT * FROM lessons WHERE id = $1', [contentId]);
          originalContent = lessonResult.rows[0];
        } else if (contentType === 'module') {
          const moduleResult = await client.query('SELECT * FROM course_modules WHERE id = $1', [contentId]);
          originalContent = moduleResult.rows[0];
        }

        if (!originalContent) {
          throw new Error('Content not found');
        }

        // Check for existing adapted content
        const adaptedResult = await client.query(`
          SELECT * FROM age_adapted_content 
          WHERE original_content_id = $1 AND content_type = $2 AND age_group = $3
        `, [contentId, contentType, ageGroup]);

        let adaptedContent;
        if (adaptedResult.rows.length > 0) {
          adaptedContent = adaptedResult.rows[0];
        } else {
          // Create new adapted content
          adaptedContent = this.ageAdaptationService.adaptContent(originalContent, ageGroup, contentType);
          
          // Save adapted content
          await client.query(`
            INSERT INTO age_adapted_content 
            (original_content_id, content_type, age_group, adapted_title, adapted_description, adapted_instructions, adapted_exercises)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            contentId,
            contentType,
            ageGroup,
            adaptedContent.adaptedLanguage,
            adaptedContent.adaptedLanguage,
            adaptedContent.adaptedLanguage,
            JSON.stringify(adaptedContent.exercises || {})
          ]);
        }

        return this.createResponse({
          originalContent,
          adaptedContent,
          ageGroup,
          adaptations: this.ageAdaptationService.getUIAdaptations(ageGroup)
        }, 'Age-adapted content retrieved successfully');

      } finally {
        client.release();
      }
    });
  }

  async generateAgeBasedExercises(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId');
      const { topic, difficulty = 'medium' } = req.body;

      if (!topic) {
        throw new Error('Topic is required');
      }

      const client = await db.pool.connect();
      try {
        // Get user's age group
        const userResult = await client.query('SELECT age_group FROM users WHERE id = $1', [userId]);
        const ageGroup = userResult.rows[0]?.age_group || 'adult';

        // Generate age-appropriate exercises
        const exercises = this.ageAdaptationService.generateAgeAppropriateExercises(topic, ageGroup, difficulty);

        return this.createResponse({
          exercises,
          ageGroup,
          topic,
          difficulty,
          metadata: {
            totalExercises: exercises.length,
            estimatedTime: exercises.length * (ageGroup === 'child' ? 3 : ageGroup === 'teen' ? 5 : 8),
            adaptations: this.ageAdaptationService.getUIAdaptations(ageGroup)
          }
        }, 'Age-based exercises generated successfully');

      } finally {
        client.release();
      }
    });
  }

  async getUserAgeProfile(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const userId = this.parseIntParam(req.params.userId, 'userId');

      const client = await db.pool.connect();
      try {
        const userResult = await client.query(`
          SELECT id, name, email, birth_date, age_group, content_preferences, profile_data
          FROM users WHERE id = $1
        `, [userId]);

        const user = userResult.rows[0];
        if (!user) {
          throw new Error('User not found');
        }

        const age = user.birth_date ? this.ageAdaptationService.calculateAge(user.birth_date) : null;
        const ageGroup = user.age_group || 'adult';

        return this.createResponse({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            age,
            ageGroup,
            preferences: user.content_preferences || {}
          },
          adaptations: {
            ui: this.ageAdaptationService.getUIAdaptations(ageGroup),
            language: this.ageAdaptationService.getLanguageTemplates(ageGroup),
            exercises: this.ageAdaptationService.exerciseAdaptations[ageGroup]
          },
          recommendations: this.generateAgeBasedRecommendations(ageGroup, age)
        }, 'User age profile retrieved successfully');

      } finally {
        client.release();
      }
    });
  }

  async initializeAgeBasedGamification(userId, ageGroup, client) {
    // Initialize wallet with age-appropriate starting values
    const startingCoins = ageGroup === 'child' ? 100 : ageGroup === 'teen' ? 50 : 25;
    
    await client.query(`
      INSERT INTO user_wallet (user_id, coins, gems)
      VALUES ($1, $2, 0)
      ON CONFLICT (user_id) DO NOTHING
    `, [userId, startingCoins]);

    // Initialize streaks
    await client.query(`
      INSERT INTO user_streaks (user_id, streak_type, current_streak, longest_streak)
      VALUES ($1, 'daily_lesson', 0, 0)
      ON CONFLICT (user_id, streak_type) DO NOTHING
    `, [userId]);

    // Create age-appropriate initial goals
    await this.createAgeBasedGoals(userId, ageGroup, client);
  }

  async createAgeBasedGoals(userId, ageGroup, client) {
    const goals = {
      child: [
        { type: 'lessons_completed', target: 3, coins: 50, xp: 100 },
        { type: 'daily_streak', target: 2, coins: 30, xp: 50 }
      ],
      teen: [
        { type: 'lessons_completed', target: 5, coins: 75, xp: 150 },
        { type: 'daily_streak', target: 3, coins: 50, xp: 100 },
        { type: 'quiz_score', target: 80, coins: 100, xp: 200 }
      ],
      adult: [
        { type: 'lessons_completed', target: 8, coins: 100, xp: 250 },
        { type: 'daily_streak', target: 5, coins: 75, xp: 150 },
        { type: 'quiz_score', target: 90, coins: 150, xp: 300 },
        { type: 'module_completion', target: 1, coins: 200, xp: 500 }
      ]
    };

    const ageGoals = goals[ageGroup] || goals.adult;
    
    for (const goal of ageGoals) {
      await client.query(`
        INSERT INTO daily_goals (user_id, goal_type, target_value, current_progress, goal_date, rewards_coins, rewards_xp)
        VALUES ($1, $2, $3, 0, CURRENT_DATE, $4, $5)
        ON CONFLICT (user_id, goal_type, goal_date) DO NOTHING
      `, [userId, goal.type, goal.target, goal.coins, goal.xp]);
    }
  }

  async updateGamificationForAgeGroup(userId, newAgeGroup, client) {
    // Update wallet based on new age group
    const coinMultiplier = newAgeGroup === 'child' ? 2.0 : newAgeGroup === 'teen' ? 1.5 : 1.0;
    
    await client.query(`
      UPDATE user_wallet 
      SET coins = CEIL(coins * $1), last_updated = NOW()
      WHERE user_id = $2
    `, [coinMultiplier, userId]);

    // Create new age-appropriate goals
    await this.createAgeBasedGoals(userId, newAgeGroup, client);
  }

  generateAgeBasedRecommendations(ageGroup, age) {
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