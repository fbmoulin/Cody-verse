const { db } = require('../server/database');
const { 
  userLessonProgress, 
  userModuleProgress, 
  codyInteractions, 
  learningSessions,
  users 
} = require('../shared/schema');
const { eq, desc, and, gte, sql, avg, count } = require('drizzle-orm');

class LearningAnalyticsService {
  constructor() {
    this.performanceMetrics = {
      retention: {
        daily: 0.8,
        weekly: 0.6,
        monthly: 0.4
      },
      engagement: {
        optimal_session_minutes: 25,
        max_daily_sessions: 4,
        ideal_completion_rate: 0.85
      }
    };
  }

  // Real-time difficulty assessment
  async assessLearningDifficulty(userId, lessonId) {
    try {
      const userProgress = await db.select()
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, parseInt(userId)),
          eq(userLessonProgress.lessonId, parseInt(lessonId))
        ))
        .limit(1);

      if (userProgress.length === 0) {
        return { difficulty: 'unknown', confidence: 0 };
      }

      const progress = userProgress[0];
      const difficultyScore = this.calculateDifficultyScore(progress);
      
      return {
        difficulty: this.categorizedifficulty(difficultyScore),
        confidence: this.calculateConfidence(progress),
        timeEfficiency: this.calculateTimeEfficiency(progress),
        recommendedNextAction: this.getRecommendedAction(difficultyScore)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error assessing learning difficulty', { userId, lessonId, error: error.message });
      return { difficulty: 'unknown', confidence: 0 };
    }
  }

  // Predictive intervention system
  async predictLearnerStruggles(userId) {
    try {
      const recentActivity = await this.getRecentLearningActivity(userId);
      const interactionPatterns = await this.analyzeCodyInteractionPatterns(userId);
      
      const riskFactors = {
        timeSpentIncreasing: this.detectTimeSpentTrend(recentActivity),
        completionRateDecreasing: this.detectCompletionTrend(recentActivity),
        frustrationIndicators: this.detectFrustrationPatterns(interactionPatterns),
        engagementDropping: this.detectEngagementDrop(recentActivity)
      };

      const riskScore = this.calculateRiskScore(riskFactors);
      const interventionType = this.determineInterventionType(riskFactors);

      return {
        riskScore,
        riskLevel: this.categorizeRiskLevel(riskScore),
        interventionType,
        recommendedActions: this.getInterventionActions(interventionType),
        confidence: this.calculatePredictionConfidence(recentActivity.length)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error predicting learner struggles', { userId, error: error.message });
      return { riskScore: 0, riskLevel: 'low', interventionType: 'none' };
    }
  }

  // Personalized study schedule optimization
  async optimizeStudySchedule(userId) {
    try {
      const learningPatterns = await this.analyzeLearningPatterns(userId);
      const performanceByTime = await this.analyzePerformanceByTimeOfDay(userId);
      const sessionLengthOptimization = await this.analyzeOptimalSessionLength(userId);

      return {
        optimalStudyTimes: this.getOptimalStudyTimes(performanceByTime),
        recommendedSessionLength: sessionLengthOptimization.optimal,
        studyFrequency: this.calculateOptimalFrequency(learningPatterns),
        personalizedBreaks: this.recommendBreakSchedule(sessionLengthOptimization),
        weeklyGoals: this.generateWeeklyGoals(learningPatterns)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error optimizing study schedule', { userId, error: error.message });
      return null;
    }
  }

  // Advanced performance analytics
  async generatePerformanceInsights(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const performanceData = await db.select({
        completionRate: avg(userLessonProgress.completionPercentage),
        averageScore: avg(userLessonProgress.bestScore),
        totalTimeSpent: sql`SUM(${userLessonProgress.timeSpentMinutes})`,
        lessonsCompleted: count(userLessonProgress.id),
        averageAttempts: avg(userLessonProgress.attempts)
      })
      .from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, parseInt(userId)),
        gte(userLessonProgress.lastAccessedAt, thirtyDaysAgo)
      ))
      .groupBy(userLessonProgress.userId);

      if (performanceData.length === 0) {
        return this.getDefaultInsights();
      }

      const data = performanceData[0];
      return {
        learningVelocity: this.calculateLearningVelocity(data),
        knowledgeRetention: await this.estimateKnowledgeRetention(userId),
        strengthsAndWeaknesses: await this.identifyStrengthsWeaknesses(userId),
        progressPrediction: this.predictFutureProgress(data),
        benchmarkComparison: await this.compareToBenchmarks(data),
        improvementRecommendations: this.generateImprovementRecommendations(data)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating performance insights', { userId, error: error.message });
      return this.getDefaultInsights();
    }
  }

  // Helper methods for difficulty assessment
  calculateDifficultyScore(progress) {
    const factors = {
      timeSpent: Math.min(progress.timeSpentMinutes / 30, 2), // Normalize to 0-2
      attempts: Math.min(progress.attempts / 3, 2), // Normalize to 0-2
      completionRate: (100 - progress.completionPercentage) / 50, // Invert and normalize
      scorePerformance: (100 - (progress.bestScore || 0)) / 50 // Invert and normalize
    };

    return (factors.timeSpent + factors.attempts + factors.completionRate + factors.scorePerformance) / 4;
  }

  categorizedifficulty(score) {
    if (score < 0.3) return 'easy';
    if (score < 0.7) return 'moderate';
    if (score < 1.2) return 'challenging';
    return 'difficult';
  }

  calculateConfidence(progress) {
    const factors = [
      progress.timeSpentMinutes > 0 ? 0.3 : 0,
      progress.attempts > 0 ? 0.3 : 0,
      progress.completionPercentage > 0 ? 0.2 : 0,
      progress.bestScore > 0 ? 0.2 : 0
    ];
    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  calculateTimeEfficiency(progress) {
    if (progress.timeSpentMinutes === 0) return 0;
    return Math.min(progress.completionPercentage / progress.timeSpentMinutes * 10, 1);
  }

  getRecommendedAction(difficultyScore) {
    const actions = {
      easy: 'accelerate',
      moderate: 'continue',
      challenging: 'reinforce',
      difficult: 'review_and_support'
    };
    return actions[this.categorizedifficulty(difficultyScore)];
  }

  // Helper methods for predictive intervention
  async getRecentLearningActivity(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await db.select()
      .from(userLessonProgress)
      .where(and(
        eq(userLessonProgress.userId, parseInt(userId)),
        gte(userLessonProgress.lastAccessedAt, sevenDaysAgo)
      ))
      .orderBy(desc(userLessonProgress.lastAccessedAt))
      .limit(20);
  }

  async analyzeCodyInteractionPatterns(userId) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await db.select()
      .from(codyInteractions)
      .where(and(
        eq(codyInteractions.userId, parseInt(userId)),
        gte(codyInteractions.createdAt, threeDaysAgo)
      ))
      .orderBy(desc(codyInteractions.createdAt))
      .limit(15);
  }

  detectTimeSpentTrend(activities) {
    if (activities.length < 3) return false;
    
    const recentAvg = activities.slice(0, 3).reduce((sum, a) => sum + a.timeSpentMinutes, 0) / 3;
    const olderAvg = activities.slice(-3).reduce((sum, a) => sum + a.timeSpentMinutes, 0) / 3;
    
    return recentAvg > olderAvg * 1.5; // 50% increase indicates struggle
  }

  detectCompletionTrend(activities) {
    if (activities.length < 4) return false;
    
    const recentAvg = activities.slice(0, 4).reduce((sum, a) => sum + a.completionPercentage, 0) / 4;
    const olderAvg = activities.slice(-4).reduce((sum, a) => sum + a.completionPercentage, 0) / 4;
    
    return recentAvg < olderAvg * 0.8; // 20% decrease indicates struggle
  }

  detectFrustrationPatterns(interactions) {
    const frustrationKeywords = ['difícil', 'não entendo', 'confuso', 'impossível', 'não consigo'];
    let frustrationCount = 0;
    
    interactions.forEach(interaction => {
      if (interaction.userMessage) {
        const message = interaction.userMessage.toLowerCase();
        if (frustrationKeywords.some(keyword => message.includes(keyword))) {
          frustrationCount++;
        }
      }
    });
    
    return frustrationCount > interactions.length * 0.3; // 30% of interactions show frustration
  }

  detectEngagementDrop(activities) {
    if (activities.length === 0) return true;
    
    const lastActivity = new Date(activities[0].lastAccessedAt);
    const daysSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceLastActivity > 2; // More than 2 days of inactivity
  }

  calculateRiskScore(riskFactors) {
    const weights = {
      timeSpentIncreasing: 0.3,
      completionRateDecreasing: 0.4,
      frustrationIndicators: 0.2,
      engagementDropping: 0.1
    };
    
    let score = 0;
    Object.entries(riskFactors).forEach(([factor, isPresent]) => {
      if (isPresent) {
        score += weights[factor] || 0;
      }
    });
    
    return Math.min(score, 1);
  }

  categorizeRiskLevel(score) {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    return 'high';
  }

  determineInterventionType(riskFactors) {
    if (riskFactors.frustrationIndicators) return 'emotional_support';
    if (riskFactors.completionRateDecreasing) return 'content_review';
    if (riskFactors.timeSpentIncreasing) return 'study_technique';
    if (riskFactors.engagementDropping) return 'motivation_boost';
    return 'none';
  }

  getInterventionActions(type) {
    const actions = {
      emotional_support: [
        'Oferecer encorajamento personalizado',
        'Sugerir break ou mudança de ritmo',
        'Conectar com mentor ou comunidade'
      ],
      content_review: [
        'Revisar conceitos fundamentais',
        'Oferecer exemplos adicionais',
        'Sugerir exercícios de prática extra'
      ],
      study_technique: [
        'Recomendar técnicas de estudo alternativas',
        'Sugerir sessões mais curtas',
        'Implementar técnica Pomodoro'
      ],
      motivation_boost: [
        'Mostrar progresso alcançado',
        'Definir metas de curto prazo',
        'Gamificar próximos desafios'
      ],
      none: ['Continuar monitorando']
    };
    return actions[type] || actions.none;
  }

  calculatePredictionConfidence(dataPoints) {
    if (dataPoints < 3) return 0.3;
    if (dataPoints < 7) return 0.6;
    if (dataPoints < 15) return 0.8;
    return 0.9;
  }

  // Helper methods for study schedule optimization
  async analyzeLearningPatterns(userId) {
    const patterns = await this.getRecentLearningActivity(userId);
    
    return {
      averageSessionLength: patterns.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / patterns.length || 0,
      studyFrequency: patterns.length,
      preferredDifficulty: this.calculatePreferredDifficulty(patterns),
      consistencyScore: this.calculateConsistencyScore(patterns)
    };
  }

  async analyzePerformanceByTimeOfDay(userId) {
    const activities = await this.getRecentLearningActivity(userId);
    const hourlyPerformance = {};
    
    activities.forEach(activity => {
      const hour = new Date(activity.lastAccessedAt).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { sessions: 0, totalCompletion: 0, totalScore: 0 };
      }
      hourlyPerformance[hour].sessions++;
      hourlyPerformance[hour].totalCompletion += activity.completionPercentage;
      hourlyPerformance[hour].totalScore += activity.bestScore || 0;
    });
    
    return hourlyPerformance;
  }

  async analyzeOptimalSessionLength(userId) {
    const activities = await this.getRecentLearningActivity(userId);
    const sessionPerformance = {};
    
    activities.forEach(activity => {
      const lengthCategory = this.categorizeSessionLength(activity.timeSpentMinutes);
      if (!sessionPerformance[lengthCategory]) {
        sessionPerformance[lengthCategory] = { count: 0, totalCompletion: 0, totalScore: 0 };
      }
      sessionPerformance[lengthCategory].count++;
      sessionPerformance[lengthCategory].totalCompletion += activity.completionPercentage;
      sessionPerformance[lengthCategory].totalScore += activity.bestScore || 0;
    });
    
    let bestCategory = 'medium';
    let bestPerformance = 0;
    
    Object.entries(sessionPerformance).forEach(([category, data]) => {
      const avgPerformance = (data.totalCompletion + data.totalScore) / (2 * data.count);
      if (avgPerformance > bestPerformance) {
        bestPerformance = avgPerformance;
        bestCategory = category;
      }
    });
    
    return {
      optimal: bestCategory,
      performance: sessionPerformance,
      recommendation: this.getSessionLengthRecommendation(bestCategory)
    };
  }

  categorizeSessionLength(minutes) {
    if (minutes < 15) return 'short';
    if (minutes < 30) return 'medium';
    if (minutes < 60) return 'long';
    return 'extended';
  }

  getSessionLengthRecommendation(category) {
    const recommendations = {
      short: '10-15 minutos por sessão',
      medium: '20-30 minutos por sessão',
      long: '45-60 minutos por sessão',
      extended: '60+ minutos por sessão'
    };
    return recommendations[category];
  }

  getOptimalStudyTimes(performanceByTime) {
    const sortedHours = Object.entries(performanceByTime)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgPerformance: (data.totalCompletion + data.totalScore) / (2 * data.sessions)
      }))
      .sort((a, b) => b.avgPerformance - a.avgPerformance)
      .slice(0, 3);
    
    return sortedHours.map(item => `${item.hour}:00`);
  }

  calculateOptimalFrequency(patterns) {
    const consistency = patterns.consistencyScore;
    if (consistency > 0.8) return 'daily';
    if (consistency > 0.5) return 'every_other_day';
    return 'flexible';
  }

  recommendBreakSchedule(sessionOptimization) {
    const breakSchedules = {
      short: 'Pause de 5 minutos a cada 15 minutos',
      medium: 'Pause de 5-10 minutos a cada 25 minutos',
      long: 'Pause de 10-15 minutos a cada 45 minutos',
      extended: 'Pause de 15-20 minutos a cada hora'
    };
    return breakSchedules[sessionOptimization.optimal];
  }

  generateWeeklyGoals(patterns) {
    const baseGoal = Math.max(patterns.studyFrequency, 3);
    return {
      sessionsPerWeek: Math.min(baseGoal + 1, 7),
      totalMinutesPerWeek: patterns.averageSessionLength * (baseGoal + 1),
      improvementTarget: 'Aumentar consistência em 10%'
    };
  }

  // Helper methods for performance insights
  calculateLearningVelocity(data) {
    const velocity = (data.lessonsCompleted || 0) / Math.max((data.totalTimeSpent || 1) / 60, 1);
    return {
      lessonsPerHour: velocity,
      category: velocity > 2 ? 'fast' : velocity > 1 ? 'moderate' : 'methodical'
    };
  }

  async estimateKnowledgeRetention(userId) {
    // Simplified retention estimation based on review patterns
    const activities = await this.getRecentLearningActivity(userId);
    const reviewAttempts = activities.filter(a => a.attempts > 1);
    
    const retentionScore = reviewAttempts.length > 0 ? 
      reviewAttempts.reduce((sum, a) => sum + (a.bestScore || 0), 0) / reviewAttempts.length : 0;
    
    return {
      estimatedRetention: retentionScore,
      category: retentionScore > 80 ? 'excellent' : retentionScore > 60 ? 'good' : 'needs_improvement'
    };
  }

  async identifyStrengthsWeaknesses(userId) {
    // This would need lesson/topic categorization to be more specific
    const activities = await this.getRecentLearningActivity(userId);
    
    const strengths = [];
    const weaknesses = [];
    
    if (activities.length > 0) {
      const avgCompletion = activities.reduce((sum, a) => sum + a.completionPercentage, 0) / activities.length;
      const avgScore = activities.reduce((sum, a) => sum + (a.bestScore || 0), 0) / activities.length;
      
      if (avgCompletion > 85) strengths.push('Alta taxa de conclusão');
      if (avgScore > 80) strengths.push('Bom desempenho em avaliações');
      
      if (avgCompletion < 70) weaknesses.push('Dificuldade em concluir lições');
      if (avgScore < 60) weaknesses.push('Pontuação abaixo da média');
    }
    
    return { strengths, weaknesses };
  }

  predictFutureProgress(data) {
    const completionTrend = (data.completionRate || 0) / 100;
    const scoreTrend = (data.averageScore || 0) / 100;
    
    return {
      expectedCompletionRate: Math.min(completionTrend * 1.1, 1),
      expectedScoreImprovement: Math.min(scoreTrend * 1.05, 1),
      timeToMastery: this.estimateTimeToMastery(completionTrend, scoreTrend)
    };
  }

  estimateTimeToMastery(completionRate, scoreRate) {
    const masteryThreshold = 0.9;
    const currentPerformance = (completionRate + scoreRate) / 2;
    
    if (currentPerformance >= masteryThreshold) return 'Já alcançado';
    
    const improvementRate = 0.05; // 5% improvement per week
    const weeksToMastery = Math.ceil((masteryThreshold - currentPerformance) / improvementRate);
    
    return `${weeksToMastery} semanas`;
  }

  async compareToBenchmarks(data) {
    // These would be calculated from aggregate user data in a real system
    const benchmarks = {
      completionRate: 75,
      averageScore: 72,
      timeSpent: 180, // minutes per week
      lessonsCompleted: 8 // per week
    };
    
    return {
      completionRatePercentile: this.calculatePercentile(data.completionRate || 0, benchmarks.completionRate),
      scorePercentile: this.calculatePercentile(data.averageScore || 0, benchmarks.averageScore),
      timeSpentComparison: (data.totalTimeSpent || 0) / benchmarks.timeSpent,
      lessonsCompletedComparison: (data.lessonsCompleted || 0) / benchmarks.lessonsCompleted
    };
  }

  calculatePercentile(userValue, benchmarkValue) {
    return Math.min(Math.round((userValue / benchmarkValue) * 100), 100);
  }

  generateImprovementRecommendations(data) {
    const recommendations = [];
    
    if ((data.completionRate || 0) < 70) {
      recommendations.push('Foque em completar lições antes de avançar');
    }
    
    if ((data.averageScore || 0) < 70) {
      recommendations.push('Dedique mais tempo à revisão de conceitos');
    }
    
    if ((data.averageAttempts || 0) > 2.5) {
      recommendations.push('Considere estudar materiais de apoio antes dos exercícios');
    }
    
    if ((data.totalTimeSpent || 0) > 300) { // More than 5 hours per week
      recommendations.push('Considere sessões mais curtas e frequentes');
    }
    
    return recommendations.length > 0 ? recommendations : ['Continue com o excelente trabalho!'];
  }

  getDefaultInsights() {
    return {
      learningVelocity: { lessonsPerHour: 0, category: 'new_learner' },
      knowledgeRetention: { estimatedRetention: 0, category: 'starting' },
      strengthsAndWeaknesses: { strengths: [], weaknesses: [] },
      progressPrediction: { expectedCompletionRate: 0.5, expectedScoreImprovement: 0.5, timeToMastery: 'A determinar' },
      benchmarkComparison: { completionRatePercentile: 0, scorePercentile: 0 },
      improvementRecommendations: ['Comece sua jornada de aprendizado!']
    };
  }

  calculatePreferredDifficulty(patterns) {
    if (patterns.length === 0) return 'moderate';
    
    const avgScore = patterns.reduce((sum, p) => sum + (p.bestScore || 0), 0) / patterns.length;
    const avgTime = patterns.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / patterns.length;
    
    if (avgScore > 85 && avgTime < 20) return 'challenging';
    if (avgScore < 60 || avgTime > 40) return 'easy';
    return 'moderate';
  }

  calculateConsistencyScore(patterns) {
    if (patterns.length < 2) return 0;
    
    const dates = patterns.map(p => new Date(p.lastAccessedAt).toDateString());
    const uniqueDates = new Set(dates);
    
    return uniqueDates.size / 7; // Consistency over the past week
  }
}

module.exports = new LearningAnalyticsService();