const BaseController = require('../core/BaseController');
const AIStudyCompanionService = require('../services/aiStudyCompanionService');

class AIStudyCompanionController extends BaseController {
  constructor() {
    super('AIStudyCompanionController');
    this.companionService = new AIStudyCompanionService();
  }

  async startSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const userId = this.extractUserId(req);
      const { subject, duration, difficulty, personalityType } = req.body;

      // Validate required fields
      this.validateRequest(req, ['subject', 'duration']);

      const sessionData = {
        subject,
        duration: this.parseIntParam(duration, 'duration', 45),
        difficulty: difficulty || 'intermediate',
        personalityType: personalityType || 'encouraging'
      };

      const session = await this.companionService.startStudySession(userId, sessionData);
      
      return this.createResponse(session, 'Study session started successfully', {
        sessionId: session.sessionId,
        companionName: session.companion
      });
    });
  }

  async provideLiveGuidance(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;
      const { userInput, currentActivity } = req.body;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      if (!userInput) {
        throw new Error('User input is required');
      }

      const guidance = await this.companionService.provideLiveGuidance(sessionId, userInput);
      
      return this.createResponse(guidance, 'Guidance provided successfully', {
        sessionId,
        responseType: 'live_guidance'
      });
    });
  }

  async getSessionStatus(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.companionService.getSessionById(sessionId);
      
      if (!session) {
        throw new Error('Study session not found');
      }

      const now = new Date();
      const elapsed = Math.round((now - session.startTime) / (1000 * 60)); // minutes
      const remaining = Math.max(0, session.duration - elapsed);

      const status = {
        sessionId: session.id,
        companion: session.companion.name,
        subject: session.subject,
        elapsedMinutes: elapsed,
        remainingMinutes: remaining,
        concentrationScore: session.concentrationScore,
        status: session.status,
        progress: Math.min(100, (elapsed / session.duration) * 100)
      };

      return this.createResponse(status, 'Session status retrieved successfully');
    });
  }

  async requestMotivation(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;
      const { currentMood, challenge } = req.body;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.companionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      // Generate motivational message based on current state
      const motivationInput = `I'm feeling ${currentMood || 'okay'} and struggling with ${challenge || 'staying focused'}`;
      const motivation = await this.companionService.provideLiveGuidance(sessionId, motivationInput);

      return this.createResponse({
        message: motivation.companionResponse,
        motivationType: 'encouragement',
        studyTips: motivation.studyTips,
        companion: session.companion.name
      }, 'Motivational guidance provided');
    });
  }

  async requestBreak(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;
      const { breakType } = req.body;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.companionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      const breakRecommendation = this.companionService.evaluateBreakNeed(session);
      
      // Update session to track break
      session.breaksSuggested += 1;
      session.lastBreak = new Date();

      const response = {
        breakRecommended: true,
        duration: breakType === 'extended' ? 15 : 5,
        activities: this.companionService.getBreakActivities(breakType || 'short'),
        message: `Great idea! Taking a ${breakType || 'short'} break will help you recharge and maintain focus.`,
        resumeTime: new Date(Date.now() + (breakType === 'extended' ? 15 : 5) * 60 * 1000)
      };

      return this.createResponse(response, 'Break recommendation provided');
    });
  }

  async endSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;
      const { completionPercentage, feedback, selfRating } = req.body;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const completionData = {
        completionPercentage: this.parseIntParam(completionPercentage, 'completionPercentage', 85),
        feedback: feedback || '',
        selfRating: this.parseIntParam(selfRating, 'selfRating', 7)
      };

      const summary = await this.companionService.endStudySession(sessionId, completionData);
      
      return this.createResponse(summary, 'Study session completed successfully', {
        sessionCompleted: true,
        duration: summary.duration
      });
    });
  }

  async getCompanionPersonalities(req, res) {
    await this.handleRequest(req, res, async () => {
      const personalities = {
        encouraging: {
          name: 'Alex',
          description: 'Warm, supportive, and patient. Perfect for building confidence.',
          traits: ['Supportive', 'Patient', 'Motivational'],
          bestFor: ['Building confidence', 'Overcoming challenges', 'Long study sessions']
        },
        analytical: {
          name: 'Morgan',
          description: 'Logical, detail-oriented, and systematic. Great for complex subjects.',
          traits: ['Logical', 'Detail-oriented', 'Systematic'],
          bestFor: ['Complex problem solving', 'Technical subjects', 'Structured learning']
        },
        friendly: {
          name: 'Sam',
          description: 'Casual, relatable, and fun. Makes learning enjoyable.',
          traits: ['Casual', 'Relatable', 'Humorous'],
          bestFor: ['Staying engaged', 'Creative subjects', 'Casual learning']
        }
      };

      return this.createResponse(personalities, 'Companion personalities retrieved successfully');
    });
  }

  async getStudyTips(req, res) {
    await this.handleRequest(req, res, async () => {
      const { subject, difficulty, duration } = req.query;
      
      const tips = await this.generateStudyTips(subject, difficulty, duration);
      
      return this.createResponse(tips, 'Study tips generated successfully');
    });
  }

  async generateStudyTips(subject, difficulty, duration) {
    const baseTips = {
      general: [
        'Start with a clear goal for your session',
        'Take regular breaks to maintain focus',
        'Ask yourself questions about the material',
        'Practice active recall by explaining concepts aloud'
      ],
      mathematics: [
        'Work through problems step by step',
        'Practice similar problems until concepts click',
        'Draw diagrams when possible',
        'Check your work by solving problems differently'
      ],
      science: [
        'Connect new concepts to real-world examples',
        'Create visual representations of processes',
        'Explain phenomena in your own words',
        'Practice with past exam questions'
      ],
      language: [
        'Practice speaking and listening regularly',
        'Use flashcards for vocabulary building',
        'Read diverse materials in the target language',
        'Write summaries to reinforce comprehension'
      ]
    };

    const subjectTips = baseTips[subject?.toLowerCase()] || baseTips.general;
    
    // Adjust tips based on difficulty and duration
    let selectedTips = [...subjectTips];
    
    if (difficulty === 'beginner') {
      selectedTips.unshift('Start with basic concepts and build up gradually');
    } else if (difficulty === 'advanced') {
      selectedTips.push('Challenge yourself with complex applications');
    }
    
    if (duration > 60) {
      selectedTips.push('Plan multiple focused segments with breaks between');
    }

    return {
      subject: subject || 'General',
      difficulty: difficulty || 'intermediate',
      duration: duration || 45,
      tips: selectedTips.slice(0, 6),
      personalizedMessage: `Here are some tailored tips for your ${subject || 'study'} session!`
    };
  }

  async getActiveSessionsStats(req, res) {
    await this.handleRequest(req, res, async () => {
      const activeCount = this.companionService.getActiveSessionsCount();
      
      const stats = {
        activeSessions: activeCount,
        timestamp: new Date(),
        status: activeCount > 0 ? 'active' : 'idle'
      };

      return this.createResponse(stats, 'Active sessions stats retrieved');
    });
  }

  async pauseSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;
      const { reason } = req.body;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.companionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      session.status = 'paused';
      session.pausedAt = new Date();
      session.pauseReason = reason || 'user_request';

      return this.createResponse({
        sessionId,
        status: 'paused',
        message: 'Session paused. Take your time and resume when ready!',
        pausedAt: session.pausedAt
      }, 'Session paused successfully');
    });
  }

  async resumeSession(req, res) {
    await this.handleRequest(req, res, async () => {
      const { sessionId } = req.params;

      if (!sessionId) {
        throw new Error('Session ID is required');
      }

      const session = this.companionService.getSessionById(sessionId);
      if (!session) {
        throw new Error('Study session not found');
      }

      if (session.status !== 'paused') {
        throw new Error('Session is not currently paused');
      }

      session.status = 'active';
      const pauseDuration = new Date() - session.pausedAt;
      session.totalPauseTime = (session.totalPauseTime || 0) + pauseDuration;

      // Generate welcome back message
      const resumeGuidance = await this.companionService.generateSessionGuidance(session, 'resume');

      return this.createResponse({
        sessionId,
        status: 'active',
        welcomeBackMessage: resumeGuidance.message,
        tips: resumeGuidance.tips,
        resumedAt: new Date()
      }, 'Session resumed successfully');
    });
  }
}

module.exports = AIStudyCompanionController;