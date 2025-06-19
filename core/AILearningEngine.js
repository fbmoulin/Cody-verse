const BaseService = require('./BaseService');
const OpenAI = require('openai');
const logger = require('../server/logger');

/**
 * AI Learning Engine - Powers personalized learning experiences with OpenAI
 */
class AILearningEngine extends BaseService {
  constructor() {
    super('AILearningEngine');
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.learningProfiles = new Map();
    this.studyTechniques = new Map();
    this.spacedRepetitionSchedules = new Map();
    this.initializeLearningEngine();
  }

  initializeLearningEngine() {
    this.setupStudyTechniques();
    this.setupLearningStyleAnalysis();
    this.setupSpacedRepetitionAlgorithm();
    logger.info('AI Learning Engine initialized', {
      category: 'ai_learning',
      techniques: this.studyTechniques.size,
      openaiModel: 'gpt-4o'
    });
  }

  setupStudyTechniques() {
    this.studyTechniques.set('pomodoro', {
      name: 'Técnica Pomodoro',
      description: 'Períodos focados de 25 minutos com pausas de 5 minutos',
      effectiveness: 0.85,
      adaptableFor: ['visual', 'kinesthetic'],
      phases: ['focus', 'short_break', 'focus', 'long_break']
    });

    this.studyTechniques.set('feynman', {
      name: 'Técnica Feynman',
      description: 'Explicar conceitos em linguagem simples para verificar compreensão',
      effectiveness: 0.92,
      adaptableFor: ['auditory', 'logical'],
      phases: ['understand', 'explain', 'identify_gaps', 'simplify']
    });

    this.studyTechniques.set('spaced_repetition', {
      name: 'Repetição Espaçada',
      description: 'Revisão de conceitos em intervalos crescentes para retenção',
      effectiveness: 0.95,
      adaptableFor: ['all'],
      phases: ['initial_learning', 'first_review', 'spaced_reviews', 'mastery']
    });

    this.studyTechniques.set('active_recall', {
      name: 'Recordação Ativa',
      description: 'Testar conhecimento sem consultar material de estudo',
      effectiveness: 0.88,
      adaptableFor: ['logical', 'verbal'],
      phases: ['study', 'close_book', 'recall', 'verify']
    });

    this.studyTechniques.set('mind_mapping', {
      name: 'Mapas Mentais',
      description: 'Visualização de conceitos e suas conexões',
      effectiveness: 0.78,
      adaptableFor: ['visual', 'spatial'],
      phases: ['central_concept', 'branch_topics', 'connections', 'review']
    });

    this.studyTechniques.set('interleaving', {
      name: 'Intercalação',
      description: 'Alternância entre diferentes tipos de problemas',
      effectiveness: 0.82,
      adaptableFor: ['logical', 'kinesthetic'],
      phases: ['topic_a', 'topic_b', 'topic_c', 'mixed_practice']
    });
  }

  setupLearningStyleAnalysis() {
    this.learningStyles = {
      visual: {
        preferences: ['diagrams', 'charts', 'videos', 'infographics'],
        techniques: ['mind_mapping', 'visual_notes'],
        weakness: 'audio_only_content'
      },
      auditory: {
        preferences: ['lectures', 'discussions', 'podcasts', 'verbal_explanations'],
        techniques: ['feynman', 'group_discussion'],
        weakness: 'silent_reading'
      },
      kinesthetic: {
        preferences: ['hands_on', 'experiments', 'movement', 'practice'],
        techniques: ['pomodoro', 'interleaving'],
        weakness: 'theoretical_only'
      },
      logical: {
        preferences: ['patterns', 'systems', 'analysis', 'problem_solving'],
        techniques: ['active_recall', 'spaced_repetition'],
        weakness: 'unstructured_content'
      }
    };
  }

  setupSpacedRepetitionAlgorithm() {
    // SM-2 algorithm implementation
    this.spacedRepetitionParams = {
      initialInterval: 1, // days
      easyBonus: 1.3,
      intervalModifier: 2.5,
      minimumEF: 1.3,
      maximumInterval: 365
    };
  }

  // AI-Powered Learning Path Generation
  async generatePersonalizedLearningPath(userId, userProfile, courseId) {
    try {
      const prompt = `
        Create a personalized learning path for a student with the following profile:
        
        User Profile:
        - Learning Style: ${userProfile.learningStyle || 'mixed'}
        - Experience Level: ${userProfile.experienceLevel || 'beginner'}
        - Available Study Time: ${userProfile.studyTime || '1-2 hours/day'}
        - Preferred Difficulty Progression: ${userProfile.difficultyPreference || 'gradual'}
        - Areas of Interest: ${userProfile.interests?.join(', ') || 'general AI concepts'}
        - Previous Knowledge: ${userProfile.previousKnowledge || 'none'}
        
        Course: AI Fundamentals
        
        Generate a structured learning path with:
        1. Recommended lesson sequence
        2. Study technique for each lesson
        3. Estimated time allocation
        4. Milestone checkpoints
        5. Adaptive difficulty adjustments
        
        Format the response as JSON with the following structure:
        {
          "learningPath": {
            "totalDuration": "estimated weeks",
            "phases": [
              {
                "phase": "Foundation",
                "lessons": ["lesson1", "lesson2"],
                "techniques": ["technique1", "technique2"],
                "timeAllocation": "hours per lesson",
                "checkpoints": ["milestone1", "milestone2"]
              }
            ],
            "adaptations": {
              "forStrengths": "customizations for user strengths",
              "forWeaknesses": "support for user weaknesses"
            }
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert educational AI that creates personalized learning paths. Respond with valid JSON only."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const learningPath = JSON.parse(response.choices[0].message.content);
      
      // Store the learning path
      this.learningProfiles.set(userId, {
        ...userProfile,
        learningPath,
        createdAt: Date.now(),
        lastUpdated: Date.now()
      });

      logger.info('Personalized learning path generated', {
        userId,
        courseId,
        pathDuration: learningPath.learningPath?.totalDuration,
        category: 'ai_learning'
      });

      return learningPath;

    } catch (error) {
      logger.error('Failed to generate learning path', {
        userId,
        error: error.message,
        category: 'ai_learning'
      });
      throw new Error('Unable to generate personalized learning path');
    }
  }

  // Advanced Study Technique Implementation
  async implementAdvancedStudyTechnique(userId, technique, content, userProgress) {
    try {
      const techniqueConfig = this.studyTechniques.get(technique);
      if (!techniqueConfig) {
        throw new Error(`Unknown study technique: ${technique}`);
      }

      const prompt = `
        Implement the ${techniqueConfig.name} study technique for the following content:
        
        Content: ${content.title}
        Description: ${content.description}
        User Progress: ${userProgress.completionPercentage}% complete
        Learning Style: ${userProgress.learningStyle}
        
        Create a detailed implementation with:
        1. Step-by-step instructions
        2. Timing and intervals
        3. Assessment checkpoints
        4. Adaptive modifications based on progress
        5. Success metrics
        
        Format as JSON:
        {
          "implementation": {
            "technique": "${technique}",
            "steps": [
              {
                "phase": "phase name",
                "duration": "time in minutes",
                "instructions": "detailed instructions",
                "checkpoints": ["checkpoint1", "checkpoint2"]
              }
            ],
            "adaptations": {
              "forProgress": "modifications based on current progress",
              "forLearningStyle": "customizations for learning style"
            },
            "successMetrics": ["metric1", "metric2"]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in educational psychology and study techniques. Create detailed, practical implementations."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const implementation = JSON.parse(response.choices[0].message.content);

      logger.info('Study technique implementation created', {
        userId,
        technique,
        steps: implementation.implementation?.steps?.length || 0,
        category: 'ai_learning'
      });

      return implementation;

    } catch (error) {
      logger.error('Failed to implement study technique', {
        userId,
        technique,
        error: error.message,
        category: 'ai_learning'
      });
      throw new Error('Unable to implement study technique');
    }
  }

  // Spaced Repetition Scheduler
  calculateSpacedRepetitionSchedule(userId, conceptId, performance) {
    const now = Date.now();
    const scheduleKey = `${userId}_${conceptId}`;
    
    let schedule = this.spacedRepetitionSchedules.get(scheduleKey) || {
      conceptId,
      userId,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: now,
      lastReview: null,
      performance: []
    };

    // Update based on performance (0-5 scale)
    const quality = Math.max(0, Math.min(5, performance.quality || 3));
    schedule.performance.push({
      quality,
      timestamp: now,
      responseTime: performance.responseTime || 0
    });

    // SM-2 Algorithm implementation
    if (quality >= 3) {
      if (schedule.repetitions === 0) {
        schedule.interval = 1;
      } else if (schedule.repetitions === 1) {
        schedule.interval = 6;
      } else {
        schedule.interval = Math.round(schedule.interval * schedule.easeFactor);
      }
      schedule.repetitions++;
    } else {
      schedule.repetitions = 0;
      schedule.interval = 1;
    }

    // Update ease factor
    schedule.easeFactor = Math.max(
      this.spacedRepetitionParams.minimumEF,
      schedule.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Calculate next review date
    schedule.lastReview = now;
    schedule.nextReview = now + (schedule.interval * 24 * 60 * 60 * 1000); // Convert days to milliseconds

    // Store updated schedule
    this.spacedRepetitionSchedules.set(scheduleKey, schedule);

    logger.info('Spaced repetition schedule updated', {
      userId,
      conceptId,
      interval: schedule.interval,
      easeFactor: schedule.easeFactor.toFixed(2),
      nextReview: new Date(schedule.nextReview).toISOString(),
      category: 'spaced_repetition'
    });

    return schedule;
  }

  // Get concepts due for review
  getConceptsDueForReview(userId) {
    const now = Date.now();
    const userSchedules = [];

    for (const [key, schedule] of this.spacedRepetitionSchedules.entries()) {
      if (schedule.userId === userId && schedule.nextReview <= now) {
        userSchedules.push(schedule);
      }
    }

    // Sort by urgency (overdue items first)
    userSchedules.sort((a, b) => a.nextReview - b.nextReview);

    return userSchedules;
  }

  // AI-Powered Content Adaptation
  async adaptContentForLearner(userId, content, learningProfile) {
    try {
      const profile = this.learningProfiles.get(userId) || learningProfile;
      
      const prompt = `
        Adapt the following educational content for a learner with this profile:
        
        Original Content:
        Title: ${content.title}
        Description: ${content.description}
        Content: ${content.body || content.text || 'Not provided'}
        
        Learner Profile:
        - Learning Style: ${profile.learningStyle}
        - Experience Level: ${profile.experienceLevel}
        - Preferred Pace: ${profile.preferredPace || 'moderate'}
        - Strengths: ${profile.strengths?.join(', ') || 'analytical thinking'}
        - Areas for Improvement: ${profile.weaknesses?.join(', ') || 'practical application'}
        
        Create an adapted version that:
        1. Matches the learner's style and pace
        2. Provides appropriate scaffolding
        3. Includes relevant examples and analogies
        4. Suggests interactive elements
        5. Offers extension activities for advanced learners
        
        Format as JSON:
        {
          "adaptedContent": {
            "title": "adapted title",
            "introduction": "engaging introduction",
            "mainContent": "adapted main content",
            "examples": ["example1", "example2"],
            "interactiveElements": ["element1", "element2"],
            "assessmentQuestions": ["question1", "question2"],
            "extensionActivities": ["activity1", "activity2"]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert educational content designer who creates personalized learning materials."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const adaptedContent = JSON.parse(response.choices[0].message.content);

      logger.info('Content adapted for learner', {
        userId,
        originalTitle: content.title,
        adaptedTitle: adaptedContent.adaptedContent?.title,
        category: 'ai_learning'
      });

      return adaptedContent;

    } catch (error) {
      logger.error('Failed to adapt content', {
        userId,
        contentId: content.id,
        error: error.message,
        category: 'ai_learning'
      });
      throw new Error('Unable to adapt content for learner');
    }
  }

  // Learning Analytics and Insights
  async generateLearningInsights(userId, learningData) {
    try {
      const prompt = `
        Analyze the following learning data and provide insights:
        
        Learning Data:
        - Sessions Completed: ${learningData.sessionsCompleted || 0}
        - Average Session Duration: ${learningData.avgSessionDuration || 0} minutes
        - Concepts Mastered: ${learningData.conceptsMastered || 0}
        - Quiz Scores: [${learningData.quizScores?.join(', ') || 'No scores yet'}]
        - Preferred Study Times: [${learningData.studyTimes?.join(', ') || 'Not tracked'}]
        - Completion Rate: ${learningData.completionRate || 0}%
        - Time Spent per Topic: ${JSON.stringify(learningData.timePerTopic || {})}
        
        Provide insights and recommendations in JSON format:
        {
          "insights": {
            "strengths": ["strength1", "strength2"],
            "areasForImprovement": ["area1", "area2"],
            "learningPatterns": ["pattern1", "pattern2"],
            "recommendedActions": ["action1", "action2"],
            "progressSummary": "overall progress summary",
            "nextSteps": ["step1", "step2"]
          }
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert learning analytics specialist who provides actionable insights."
          },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      const insights = JSON.parse(response.choices[0].message.content);

      logger.info('Learning insights generated', {
        userId,
        strengthsCount: insights.insights?.strengths?.length || 0,
        recommendationsCount: insights.insights?.recommendedActions?.length || 0,
        category: 'ai_learning'
      });

      return insights;

    } catch (error) {
      logger.error('Failed to generate learning insights', {
        userId,
        error: error.message,
        category: 'ai_learning'
      });
      throw new Error('Unable to generate learning insights');
    }
  }

  // Get learning profile
  getLearningProfile(userId) {
    return this.learningProfiles.get(userId);
  }

  // Update learning profile
  updateLearningProfile(userId, updates) {
    const existing = this.learningProfiles.get(userId) || {};
    const updated = {
      ...existing,
      ...updates,
      lastUpdated: Date.now()
    };
    
    this.learningProfiles.set(userId, updated);
    
    logger.info('Learning profile updated', {
      userId,
      updatedFields: Object.keys(updates),
      category: 'ai_learning'
    });
    
    return updated;
  }

  // Get available study techniques
  getStudyTechniques() {
    return Array.from(this.studyTechniques.entries()).map(([id, technique]) => ({
      id,
      ...technique
    }));
  }

  // Get spaced repetition statistics
  getSpacedRepetitionStats(userId) {
    const userSchedules = [];
    const now = Date.now();

    for (const [key, schedule] of this.spacedRepetitionSchedules.entries()) {
      if (schedule.userId === userId) {
        userSchedules.push(schedule);
      }
    }

    const dueNow = userSchedules.filter(s => s.nextReview <= now).length;
    const totalConcepts = userSchedules.length;
    const masteredConcepts = userSchedules.filter(s => s.repetitions >= 3 && s.easeFactor >= 2.5).length;

    return {
      totalConcepts,
      dueNow,
      masteredConcepts,
      retentionRate: totalConcepts > 0 ? (masteredConcepts / totalConcepts * 100).toFixed(1) : 0,
      averageInterval: userSchedules.length > 0 
        ? (userSchedules.reduce((sum, s) => sum + s.interval, 0) / userSchedules.length).toFixed(1) 
        : 0
    };
  }
}

module.exports = AILearningEngine;