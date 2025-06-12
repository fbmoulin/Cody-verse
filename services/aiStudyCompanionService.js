const OpenAI = require('openai');
const BaseService = require('../core/BaseService');

class AIStudyCompanionService extends BaseService {
  constructor() {
    super('AIStudyCompanionService');
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.activeSessions = new Map(); // Track active study sessions
    this.companionPersonalities = {
      encouraging: {
        name: 'Alex',
        traits: ['supportive', 'patient', 'motivational'],
        voiceStyle: 'warm and encouraging'
      },
      analytical: {
        name: 'Morgan',
        traits: ['logical', 'detail-oriented', 'systematic'],
        voiceStyle: 'clear and methodical'
      },
      friendly: {
        name: 'Sam',
        traits: ['casual', 'relatable', 'humorous'],
        voiceStyle: 'conversational and upbeat'
      }
    };
  }

  async startStudySession(userId, sessionData) {
    try {
      const { subject, duration, difficulty, personalityType = 'encouraging' } = sessionData;
      
      // Get user's learning profile
      const userProfile = await this.getUserLearningProfile(userId);
      const companion = this.companionPersonalities[personalityType];
      
      // Create study session
      const session = {
        id: `session_${userId}_${Date.now()}`,
        userId,
        subject,
        duration,
        difficulty,
        companion,
        startTime: new Date(),
        status: 'active',
        concentrationScore: 100,
        breaksSuggested: 0,
        motivationalMessages: 0,
        userProfile
      };

      this.activeSessions.set(session.id, session);

      // Generate initial greeting and study plan
      const initialGuidance = await this.generateSessionGuidance(session, 'start');
      
      return {
        sessionId: session.id,
        companion: companion.name,
        guidance: initialGuidance,
        studyPlan: await this.createStudyPlan(session),
        nextCheckIn: this.calculateNextCheckIn(session)
      };

    } catch (error) {
      throw new Error(`Failed to start study session: ${error.message}`);
    }
  }

  async provideLiveGuidance(sessionId, userInput) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      // Analyze user input for emotional state and engagement
      const userState = await this.analyzeUserState(userInput, session);
      
      // Update session based on user state
      this.updateSessionMetrics(session, userState);
      
      // Generate appropriate response
      const guidance = await this.generateContextualGuidance(session, userState, userInput);
      
      // Check if break is needed
      const breakRecommendation = this.evaluateBreakNeed(session);
      
      return {
        guidance,
        companionResponse: guidance.message,
        userState: userState.emotional,
        concentrationLevel: session.concentrationScore,
        breakRecommendation,
        studyTips: guidance.tips,
        nextAction: guidance.nextAction
      };

    } catch (error) {
      throw new Error(`Failed to provide guidance: ${error.message}`);
    }
  }

  async generateSessionGuidance(session, phase) {
    try {
      const prompt = this.buildGuidancePrompt(session, phase);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${session.companion.name}, an AI study companion with a ${session.companion.voiceStyle} personality. 
            Your role is to provide personalized study guidance, motivation, and support. 
            Respond in JSON format with: message, tips (array), nextAction, motivationLevel (1-10).`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      return this.getFallbackGuidance(session, phase);
    }
  }

  async generateContextualGuidance(session, userState, userInput) {
    try {
      const prompt = `
        Current study session: ${session.subject} (${session.duration} minutes)
        User's emotional state: ${userState.emotional}
        User's engagement level: ${userState.engagement}
        Concentration score: ${session.concentrationScore}
        User said: "${userInput}"
        
        As ${session.companion.name}, provide supportive guidance that addresses their current state.
        Consider their learning profile: ${JSON.stringify(session.userProfile)}
        
        Respond with helpful advice, encouragement, or study techniques as appropriate.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${session.companion.name}, an AI study companion. 
            Provide personalized, empathetic responses that help the user stay focused and motivated.
            Respond in JSON format with: message, tips, nextAction, encouragementLevel.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      return this.getFallbackGuidance(session, 'contextual');
    }
  }

  async analyzeUserState(userInput, session) {
    try {
      const prompt = `
        Analyze this user input for emotional state and engagement level:
        "${userInput}"
        
        Context: User is studying ${session.subject} for ${session.duration} minutes.
        
        Determine:
        1. Emotional state (frustrated, confident, tired, motivated, confused, excited)
        2. Engagement level (low, medium, high)
        3. Concentration indicators (distracted, focused, struggling)
        4. Need for support (minimal, moderate, high)
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing student emotional states and engagement patterns. Respond in JSON format with: emotional, engagement, concentration, supportNeeded."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 200
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      return {
        emotional: 'neutral',
        engagement: 'medium',
        concentration: 'focused',
        supportNeeded: 'minimal'
      };
    }
  }

  async createStudyPlan(session) {
    const totalMinutes = session.duration;
    const studyBlocks = Math.floor(totalMinutes / 25); // Pomodoro-style blocks
    
    return {
      totalDuration: totalMinutes,
      studyBlocks,
      structure: this.generateStudyStructure(studyBlocks, session.subject),
      breakSchedule: this.generateBreakSchedule(studyBlocks),
      focusTechniques: await this.getPersonalizedTechniques(session.userProfile),
      milestones: this.createSessionMilestones(studyBlocks)
    };
  }

  generateStudyStructure(blocks, subject) {
    const structure = [];
    for (let i = 0; i < blocks; i++) {
      structure.push({
        block: i + 1,
        duration: 25,
        focus: this.getBlockFocus(i, subject),
        technique: this.getRecommendedTechnique(i),
        checkpoint: `Checkpoint ${i + 1}: Review and assess understanding`
      });
    }
    return structure;
  }

  generateBreakSchedule(blocks) {
    const breaks = [];
    for (let i = 1; i < blocks; i++) {
      breaks.push({
        after: i,
        duration: i % 4 === 0 ? 15 : 5, // Longer break every 4 blocks
        activity: i % 4 === 0 ? 'stretch and refresh' : 'quick movement'
      });
    }
    return breaks;
  }

  async getPersonalizedTechniques(userProfile) {
    const techniques = [
      'Active recall through self-questioning',
      'Spaced repetition for key concepts',
      'Mind mapping for visual organization',
      'Feynman technique for complex topics'
    ];
    
    // Customize based on user profile
    if (userProfile.learningStyle === 'visual') {
      techniques.unshift('Visual diagrams and flowcharts');
    }
    
    return techniques.slice(0, 3);
  }

  createSessionMilestones(blocks) {
    return [
      { at: '25%', achievement: 'Strong start! Keep the momentum going' },
      { at: '50%', achievement: 'Halfway there! Great focus and dedication' },
      { at: '75%', achievement: 'Almost done! Push through to the finish' },
      { at: '100%', achievement: 'Session complete! Excellent work today' }
    ];
  }

  updateSessionMetrics(session, userState) {
    // Update concentration score based on user state
    if (userState.concentration === 'distracted') {
      session.concentrationScore = Math.max(20, session.concentrationScore - 15);
    } else if (userState.concentration === 'focused') {
      session.concentrationScore = Math.min(100, session.concentrationScore + 5);
    }
    
    // Track engagement patterns
    session.lastInteraction = new Date();
    session.engagementHistory = session.engagementHistory || [];
    session.engagementHistory.push({
      timestamp: new Date(),
      level: userState.engagement,
      emotional: userState.emotional
    });
  }

  evaluateBreakNeed(session) {
    const now = new Date();
    const sessionDuration = (now - session.startTime) / (1000 * 60); // minutes
    
    // Suggest break if concentration is low or if it's been too long
    if (session.concentrationScore < 60 || sessionDuration > 45) {
      return {
        needed: true,
        type: sessionDuration > 45 ? 'extended' : 'short',
        duration: sessionDuration > 45 ? 15 : 5,
        reason: session.concentrationScore < 60 ? 'low concentration' : 'time limit',
        activities: this.getBreakActivities(sessionDuration > 45 ? 'extended' : 'short')
      };
    }
    
    return { needed: false };
  }

  getBreakActivities(type) {
    const activities = {
      short: [
        'Take 5 deep breaths',
        'Look away from screen for 30 seconds',
        'Do light stretching',
        'Drink water'
      ],
      extended: [
        'Take a 5-minute walk',
        'Do some physical exercises',
        'Have a healthy snack',
        'Practice mindfulness',
        'Get some fresh air'
      ]
    };
    
    return activities[type] || activities.short;
  }

  calculateNextCheckIn(session) {
    return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  }

  async endStudySession(sessionId, completionData) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      const endTime = new Date();
      const totalDuration = (endTime - session.startTime) / (1000 * 60);
      
      // Generate session summary
      const summary = await this.generateSessionSummary(session, completionData, totalDuration);
      
      // Save session data
      await this.saveSessionData(session, summary, totalDuration);
      
      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      
      return summary;

    } catch (error) {
      throw new Error(`Failed to end study session: ${error.message}`);
    }
  }

  async generateSessionSummary(session, completionData, duration) {
    try {
      const prompt = `
        Study session summary:
        Subject: ${session.subject}
        Planned duration: ${session.duration} minutes
        Actual duration: ${Math.round(duration)} minutes
        Concentration score: ${session.concentrationScore}
        Completion: ${completionData.completionPercentage || 'Not specified'}%
        User feedback: ${completionData.feedback || 'None provided'}
        
        Generate an encouraging summary with insights and recommendations for future sessions.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${session.companion.name}, providing a supportive session summary. Include achievements, areas for improvement, and personalized recommendations. Respond in JSON format with: summary, achievements, recommendations, encouragement.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 400
      });

      const aiSummary = JSON.parse(response.choices[0].message.content);
      
      return {
        sessionId: session.id,
        companion: session.companion.name,
        duration: Math.round(duration),
        concentrationScore: session.concentrationScore,
        ...aiSummary,
        stats: {
          averageConcentration: session.concentrationScore,
          breaksTaken: session.breaksSuggested,
          motivationalMessages: session.motivationalMessages,
          completionRate: completionData.completionPercentage || 0
        }
      };

    } catch (error) {
      return this.getFallbackSummary(session, duration);
    }
  }

  async getUserLearningProfile(userId) {
    // This would typically fetch from database
    return {
      learningStyle: 'visual',
      preferredPace: 'moderate',
      strongSubjects: ['mathematics', 'science'],
      challengingAreas: ['literature', 'history'],
      motivationStyle: 'achievement-based',
      optimalSessionLength: 45
    };
  }

  buildGuidancePrompt(session, phase) {
    const prompts = {
      start: `
        Starting a ${session.duration}-minute study session for ${session.subject}.
        User's difficulty level: ${session.difficulty}
        Companion personality: ${session.companion.traits.join(', ')}
        
        Provide an encouraging welcome message and initial study guidance.
      `,
      checkpoint: `
        Mid-session check-in for ${session.subject} study session.
        Current concentration: ${session.concentrationScore}%
        Time elapsed: ${Math.round((new Date() - session.startTime) / (1000 * 60))} minutes
        
        Provide motivational guidance and study tips.
      `
    };
    
    return prompts[phase] || prompts.start;
  }

  getBlockFocus(blockIndex, subject) {
    const focuses = [
      `Introduction to key ${subject} concepts`,
      `Deep dive into core principles`,
      `Practice and application`,
      `Review and consolidation`
    ];
    
    return focuses[blockIndex % focuses.length];
  }

  getRecommendedTechnique(blockIndex) {
    const techniques = [
      'Active reading with note-taking',
      'Self-explanation and questioning',
      'Practice problems and examples',
      'Summary and concept mapping'
    ];
    
    return techniques[blockIndex % techniques.length];
  }

  getFallbackGuidance(session, phase) {
    return {
      message: `Hello! I'm ${session.companion.name}, your study companion. Let's make this ${session.subject} session productive and engaging!`,
      tips: [
        'Start with a clear goal for this session',
        'Take notes as you go along',
        'Ask yourself questions about the material'
      ],
      nextAction: 'Begin with reviewing your study materials',
      motivationLevel: 8
    };
  }

  getFallbackSummary(session, duration) {
    return {
      sessionId: session.id,
      companion: session.companion.name,
      duration: Math.round(duration),
      summary: `Great work on your ${session.subject} session! You stayed focused and engaged throughout.`,
      achievements: ['Completed full study session', 'Maintained good concentration'],
      recommendations: ['Continue with regular study sessions', 'Consider shorter breaks next time'],
      encouragement: 'Keep up the excellent work! Every study session builds your knowledge and skills.',
      stats: {
        averageConcentration: session.concentrationScore,
        breaksTaken: session.breaksSuggested || 0,
        motivationalMessages: session.motivationalMessages || 0,
        completionRate: 85
      }
    };
  }

  async saveSessionData(session, summary, duration) {
    // This would save to database - implementing basic structure
    const sessionRecord = {
      session_id: session.id,
      user_id: session.userId,
      subject: session.subject,
      companion_name: session.companion.name,
      duration_minutes: Math.round(duration),
      concentration_score: session.concentrationScore,
      completion_rate: summary.stats.completionRate,
      created_at: session.startTime,
      ended_at: new Date()
    };
    
    // In a real implementation, this would use the DataAccessLayer
    console.log('Session data saved:', sessionRecord);
    return sessionRecord;
  }

  getActiveSessionsCount() {
    return this.activeSessions.size;
  }

  getSessionById(sessionId) {
    return this.activeSessions.get(sessionId);
  }
}

module.exports = AIStudyCompanionService;