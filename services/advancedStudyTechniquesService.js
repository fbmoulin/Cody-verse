const learningAnalyticsService = require('./learningAnalyticsService');
const aiContentGenerationService = require('./aiContentGenerationService');

class AdvancedStudyTechniquesService {
  constructor() {
    this.studyTechniques = {
      spaced_repetition: {
        name: 'Repetição Espaçada',
        description: 'Técnica baseada na curva do esquecimento de Ebbinghaus',
        effectiveness: 0.95,
        timeRequired: 'Médio',
        difficulty: 'Fácil',
        bestFor: ['memorização', 'vocabulário', 'conceitos'],
        implementation: {
          intervals: [1, 3, 7, 14, 30], // dias
          algorithm: 'sm2_modified'
        }
      },
      pomodoro: {
        name: 'Técnica Pomodoro',
        description: 'Sessões de estudo focadas com intervalos regulares',
        effectiveness: 0.85,
        timeRequired: 'Baixo',
        difficulty: 'Muito Fácil',
        bestFor: ['concentração', 'produtividade', 'gestão_tempo'],
        implementation: {
          workTime: 25,
          shortBreak: 5,
          longBreak: 15,
          cyclesBeforeLongBreak: 4
        }
      },
      active_recall: {
        name: 'Recordação Ativa',
        description: 'Testar conhecimento sem consultar material',
        effectiveness: 0.92,
        timeRequired: 'Médio',
        difficulty: 'Médio',
        bestFor: ['compreensão', 'retenção', 'autoavaliação'],
        implementation: {
          methods: ['flashcards', 'auto_questionamento', 'explicação_verbal'],
          frequency: 'diária'
        }
      },
      feynman: {
        name: 'Técnica Feynman',
        description: 'Explicar conceitos com linguagem simples',
        effectiveness: 0.90,
        timeRequired: 'Alto',
        difficulty: 'Médio',
        bestFor: ['compreensão_profunda', 'conceitos_complexos', 'ensino'],
        implementation: {
          steps: ['escolher_conceito', 'explicar_simples', 'identificar_lacunas', 'revisar_estudar'],
          targetAudience: 'leigo'
        }
      },
      mind_mapping: {
        name: 'Mapas Mentais',
        description: 'Organização visual de informações e conexões',
        effectiveness: 0.80,
        timeRequired: 'Médio',
        difficulty: 'Fácil',
        bestFor: ['organização', 'criatividade', 'visão_geral'],
        implementation: {
          structure: 'radial',
          elements: ['cores', 'imagens', 'palavras_chave'],
          tools: ['digital', 'papel']
        }
      },
      interleaving: {
        name: 'Intercalação',
        description: 'Alternar entre diferentes tópicos durante estudo',
        effectiveness: 0.88,
        timeRequired: 'Médio',
        difficulty: 'Difícil',
        bestFor: ['discriminação', 'transferência', 'flexibilidade'],
        implementation: {
          pattern: 'ABCABC',
          minTopics: 2,
          maxTopics: 4
        }
      },
      elaborative_interrogation: {
        name: 'Interrogação Elaborativa',
        description: 'Fazer perguntas "por que" para compreender causas',
        effectiveness: 0.87,
        timeRequired: 'Alto',
        difficulty: 'Médio',
        bestFor: ['compreensão_causal', 'análise_crítica', 'conexões'],
        implementation: {
          questionTypes: ['por_que', 'como', 'o_que_aconteceria_se'],
          depth: 3 // níveis de profundidade
        }
      },
      dual_coding: {
        name: 'Codificação Dupla',
        description: 'Combinar informações visuais e verbais',
        effectiveness: 0.83,
        timeRequired: 'Médio',
        difficulty: 'Fácil',
        bestFor: ['memorização', 'compreensão', 'retenção_longo_prazo'],
        implementation: {
          modalities: ['visual', 'verbal', 'cinestésico'],
          ratio: '60_40' // visual para verbal
        }
      }
    };

    this.metacognitiveTechniques = {
      self_explanation: 'Explicar o próprio processo de pensamento',
      error_analysis: 'Analisar e aprender com erros cometidos',
      goal_setting: 'Definir objetivos específicos e mensuráveis',
      self_monitoring: 'Monitorar próprio progresso e compreensão',
      strategy_selection: 'Escolher estratégias apropriadas para cada situação'
    };

    this.learningStyles = {
      visual: ['mind_mapping', 'dual_coding', 'diagramas', 'cores'],
      auditivo: ['explicação_verbal', 'discussões', 'gravações', 'música'],
      cinestésico: ['prática_hands_on', 'movimento', 'manipulação', 'experimentos'],
      leitura_escrita: ['anotações', 'resumos', 'listas', 'texto']
    };
  }

  async analyzeUserStudyProfile(userId) {
    try {
      const userProgress = await learningAnalyticsService.getUserRecentActivity(userId);
      const performanceInsights = await learningAnalyticsService.generatePerformanceInsights(userId);
      
      return {
        learningPattern: this.identifyLearningPattern(userProgress),
        preferredStyle: this.detectPreferredLearningStyle(userProgress),
        currentChallenges: this.identifyCurrentChallenges(performanceInsights),
        optimalTechniques: await this.recommendOptimalTechniques(userId, userProgress),
        personalizedPlan: await this.createPersonalizedStudyPlan(userId, userProgress)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error analyzing user study profile', { userId, error: error.message });
      return this.getDefaultStudyProfile();
    }
  }

  async recommendOptimalTechniques(userId, userProgress) {
    const userChallenges = this.identifyCurrentChallenges(userProgress);
    const learningStyle = this.detectPreferredLearningStyle(userProgress);
    const timeAvailable = this.estimateAvailableStudyTime(userProgress);
    
    const recommendations = [];
    
    // Selecionar técnicas baseadas nos desafios
    if (userChallenges.includes('concentração')) {
      recommendations.push({
        technique: this.studyTechniques.pomodoro,
        reason: 'Melhora concentração com sessões focadas',
        priority: 'alta',
        implementation: this.customizePomodoro(userId)
      });
    }
    
    if (userChallenges.includes('retenção')) {
      recommendations.push({
        technique: this.studyTechniques.spaced_repetition,
        reason: 'Otimiza retenção de longo prazo',
        priority: 'alta',
        implementation: this.customizeSpacedRepetition(userId)
      });
      
      recommendations.push({
        technique: this.studyTechniques.active_recall,
        reason: 'Fortalece memória através de testes',
        priority: 'média',
        implementation: this.customizeActiveRecall(userId)
      });
    }
    
    if (userChallenges.includes('compreensão')) {
      recommendations.push({
        technique: this.studyTechniques.feynman,
        reason: 'Desenvolve compreensão profunda',
        priority: 'alta',
        implementation: this.customizeFeynman(userId)
      });
      
      recommendations.push({
        technique: this.studyTechniques.elaborative_interrogation,
        reason: 'Melhora análise crítica',
        priority: 'média',
        implementation: this.customizeElaborativeInterrogation(userId)
      });
    }
    
    // Adicionar técnicas baseadas no estilo de aprendizado
    const styleBasedTechniques = this.getStyleBasedTechniques(learningStyle);
    styleBasedTechniques.forEach(technique => {
      if (!recommendations.find(r => r.technique.name === technique.name)) {
        recommendations.push({
          technique: technique,
          reason: `Adequado ao seu estilo de aprendizado ${learningStyle}`,
          priority: 'média',
          implementation: this.customizeTechnique(technique, userId)
        });
      }
    });
    
    return recommendations.slice(0, 5); // Máximo 5 recomendações
  }

  async createPersonalizedStudyPlan(userId, userProgress) {
    const availableTime = this.estimateAvailableStudyTime(userProgress);
    const techniques = await this.recommendOptimalTechniques(userId, userProgress);
    
    const plan = {
      dailySchedule: await this.createDailySchedule(userId, availableTime, techniques),
      weeklyGoals: await this.createWeeklyGoals(userId, userProgress),
      monthlyMilestones: await this.createMonthlyMilestones(userId),
      adaptiveElements: await this.createAdaptiveElements(userId),
      progressTracking: this.createProgressTrackingPlan()
    };
    
    return plan;
  }

  async implementSpacedRepetition(userId, content, difficulty) {
    const userHistory = await this.getUserSpacedRepetitionHistory(userId);
    const intervals = this.calculateOptimalIntervals(userHistory, difficulty);
    
    return {
      contentId: content.id,
      nextReviewDate: this.calculateNextReviewDate(intervals[0]),
      intervals: intervals,
      currentInterval: 0,
      easinessFactor: this.calculateInitialEasiness(difficulty),
      repetitions: 0,
      lastReview: null,
      performance: []
    };
  }

  async trackPomodoroSession(userId, sessionData) {
    const session = {
      userId: userId,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      type: sessionData.type, // work, short_break, long_break
      interruptions: sessionData.interruptions || 0,
      productivity: sessionData.productivity || null,
      notes: sessionData.notes || '',
      effectiveness: this.calculateSessionEffectiveness(sessionData)
    };
    
    // Salvar sessão no banco de dados
    await this.savePomodoroSession(session);
    
    // Analisar padrões e sugerir otimizações
    const optimization = await this.analyzePomodoroPatterns(userId);
    
    return {
      session: session,
      totalSessionsToday: await this.getTodaySessionCount(userId),
      recommendedAdjustments: optimization.suggestions,
      nextSessionRecommendation: optimization.nextSession
    };
  }

  async generateActiveRecallQuestions(userId, topic, content) {
    try {
      const userLevel = await this.getUserKnowledgeLevel(userId, topic);
      const questionTypes = this.selectQuestionTypes(userLevel);
      
      const questions = [];
      
      for (const type of questionTypes) {
        const question = await this.generateQuestionByType(type, content, userLevel);
        questions.push({
          type: type,
          question: question.text,
          expectedAnswer: question.expectedAnswer,
          difficulty: question.difficulty,
          evaluationCriteria: question.criteria
        });
      }
      
      return {
        questions: questions,
        recommendedSequence: this.optimizeQuestionSequence(questions),
        selfEvaluationGuidance: this.createSelfEvaluationGuidance(userLevel)
      };
    } catch (error) {
      return this.getFallbackActiveRecallQuestions(topic);
    }
  }

  async implementFeynmanTechnique(userId, concept) {
    const steps = [
      {
        step: 1,
        title: 'Escolha o Conceito',
        description: `Escreva "${concept}" no topo de uma folha`,
        timeEstimate: '2 minutos',
        guidance: 'Tenha certeza de que entende o que será explicado'
      },
      {
        step: 2,
        title: 'Explique com Linguagem Simples',
        description: 'Explique o conceito como se fosse para uma criança de 12 anos',
        timeEstimate: '10-15 minutos',
        guidance: 'Use analogias, exemplos do dia a dia, evite jargões técnicos'
      },
      {
        step: 3,
        title: 'Identifique Lacunas',
        description: 'Marque pontos onde teve dificuldade ou incerteza',
        timeEstimate: '5 minutos',
        guidance: 'Seja honesto sobre o que não conseguiu explicar claramente'
      },
      {
        step: 4,
        title: 'Revise e Estude',
        description: 'Volte ao material para preencher as lacunas identificadas',
        timeEstimate: '15-20 minutos',
        guidance: 'Foque especificamente nos pontos de dificuldade'
      },
      {
        step: 5,
        title: 'Repita o Processo',
        description: 'Explique novamente até conseguir fazer de forma fluida',
        timeEstimate: '10 minutos',
        guidance: 'A fluidez indica compreensão real'
      }
    ];
    
    return {
      concept: concept,
      steps: steps,
      evaluationCriteria: await this.createFeynmanEvaluationCriteria(concept),
      improvementSuggestions: await this.generateFeynmanImprovements(userId, concept)
    };
  }

  async createMindMap(userId, topic, content) {
    const structure = {
      centralTopic: topic,
      mainBranches: await this.identifyMainBranches(content),
      subBranches: await this.createSubBranches(content),
      connections: await this.identifyConnections(content),
      visualElements: await this.suggestVisualElements(userId, topic)
    };
    
    return {
      structure: structure,
      creationSteps: this.getMindMapCreationSteps(),
      digitalTools: this.recommendMindMapTools(),
      evaluationGuidance: this.createMindMapEvaluation()
    };
  }

  async implementInterleaving(userId, topics) {
    const schedule = await this.createInterleavingSchedule(topics);
    const patterns = this.optimizeInterleavingPattern(topics.length);
    
    return {
      topics: topics,
      schedule: schedule,
      patterns: patterns,
      benefits: this.explainInterleavingBenefits(),
      implementation: await this.createInterleavingImplementation(userId, topics)
    };
  }

  // Análise e identificação de padrões
  identifyLearningPattern(userProgress) {
    if (!userProgress || userProgress.length === 0) return 'iniciante';
    
    const avgSessionLength = userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / userProgress.length;
    const avgCompletion = userProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / userProgress.length;
    const consistency = this.calculateConsistency(userProgress);
    
    if (avgSessionLength > 45 && avgCompletion > 85 && consistency > 0.8) {
      return 'detalhista_consistente';
    } else if (avgSessionLength < 20 && avgCompletion > 75) {
      return 'eficiente_rapido';
    } else if (consistency < 0.4) {
      return 'irregular_inconsistente';
    } else if (avgCompletion < 60) {
      return 'lutando_dificuldades';
    }
    
    return 'progresso_estavel';
  }

  detectPreferredLearningStyle(userProgress) {
    // Análise baseada em tempo gasto em diferentes tipos de conteúdo
    const styleIndicators = {
      visual: 0,
      auditivo: 0,
      cinestésico: 0,
      leitura_escrita: 0
    };
    
    userProgress.forEach(progress => {
      if (progress.lessonType === 'theory') styleIndicators.leitura_escrita += 1;
      if (progress.lessonType === 'interactive') styleIndicators.cinestésico += 1;
      if (progress.lessonType === 'video') styleIndicators.auditivo += 1;
      if (progress.lessonType === 'visual') styleIndicators.visual += 1;
    });
    
    return Object.keys(styleIndicators).reduce((a, b) => 
      styleIndicators[a] > styleIndicators[b] ? a : b
    );
  }

  identifyCurrentChallenges(performanceInsights) {
    const challenges = [];
    
    if (!performanceInsights) return ['avaliação_inicial'];
    
    if (performanceInsights.learningVelocity?.category === 'methodical') {
      challenges.push('velocidade');
    }
    
    if (performanceInsights.knowledgeRetention?.category === 'needs_improvement') {
      challenges.push('retenção');
    }
    
    if (performanceInsights.strengthsAndWeaknesses?.weaknesses.includes('Dificuldade em concluir lições')) {
      challenges.push('concentração');
    }
    
    if (performanceInsights.strengthsAndWeaknesses?.weaknesses.includes('Pontuação abaixo da média')) {
      challenges.push('compreensão');
    }
    
    return challenges.length > 0 ? challenges : ['melhoria_geral'];
  }

  estimateAvailableStudyTime(userProgress) {
    if (!userProgress || userProgress.length === 0) return 60; // padrão 1 hora
    
    const avgSessionLength = userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / userProgress.length;
    const frequency = userProgress.length / 7; // sessões por dia na semana
    
    return Math.round(avgSessionLength * frequency);
  }

  getStyleBasedTechniques(learningStyle) {
    const techniques = [];
    
    switch (learningStyle) {
      case 'visual':
        techniques.push(this.studyTechniques.mind_mapping);
        techniques.push(this.studyTechniques.dual_coding);
        break;
      case 'auditivo':
        techniques.push(this.studyTechniques.feynman);
        techniques.push(this.studyTechniques.elaborative_interrogation);
        break;
      case 'cinestésico':
        techniques.push(this.studyTechniques.active_recall);
        techniques.push(this.studyTechniques.pomodoro);
        break;
      case 'leitura_escrita':
        techniques.push(this.studyTechniques.spaced_repetition);
        techniques.push(this.studyTechniques.elaborative_interrogation);
        break;
    }
    
    return techniques;
  }

  // Métodos de customização de técnicas
  async customizePomodoro(userId) {
    const userProgress = await learningAnalyticsService.getUserRecentActivity(userId);
    const avgFocusTime = this.calculateAverageFocusTime(userProgress);
    
    let workTime = 25; // padrão
    if (avgFocusTime < 15) workTime = 15;
    else if (avgFocusTime > 35) workTime = 35;
    
    return {
      workTime: workTime,
      shortBreak: Math.round(workTime * 0.2),
      longBreak: Math.round(workTime * 0.6),
      cyclesBeforeLongBreak: avgFocusTime > 30 ? 3 : 4
    };
  }

  async customizeSpacedRepetition(userId) {
    const userHistory = await this.getUserPerformanceHistory(userId);
    const retentionRate = this.calculateRetentionRate(userHistory);
    
    let multiplier = 2.5; // padrão
    if (retentionRate < 0.7) multiplier = 2.0; // intervalos mais curtos
    else if (retentionRate > 0.9) multiplier = 3.0; // intervalos mais longos
    
    return {
      initialInterval: 1,
      multiplier: multiplier,
      minEasiness: 1.3,
      maxEasiness: 2.5,
      algorithm: 'sm2_adaptive'
    };
  }

  async customizeActiveRecall(userId) {
    const userLevel = await this.getUserOverallLevel(userId);
    
    return {
      questionTypes: this.selectQuestionTypes(userLevel),
      frequency: userLevel === 'beginner' ? 'daily' : 'every_other_day',
      selfEvaluationDepth: userLevel === 'advanced' ? 'deep' : 'basic',
      progressiveComplexity: true
    };
  }

  async customizeFeynman(userId) {
    const communicationStyle = await this.getUserCommunicationStyle(userId);
    
    return {
      targetAudience: communicationStyle === 'technical' ? 'colleague' : 'child',
      analogyPreference: communicationStyle === 'creative' ? 'high' : 'medium',
      detailLevel: communicationStyle === 'thorough' ? 'comprehensive' : 'essential',
      timeAllocation: {
        explanation: 15,
        gapIdentification: 5,
        revision: 20
      }
    };
  }

  async customizeElaborativeInterrogation(userId) {
    const cognitiveStyle = await this.getUserCognitiveStyle(userId);
    
    return {
      questionDepth: cognitiveStyle === 'analytical' ? 5 : 3,
      questionTypes: ['why', 'how', 'what_if', 'when', 'where'],
      scaffolding: cognitiveStyle === 'beginner' ? 'high' : 'low',
      connectionEmphasis: 'high'
    };
  }

  async customizeTechnique(technique, userId) {
    // Generic technique customization
    return {
      adaptedFor: 'user_preferences',
      difficulty: 'medium',
      timeAllocation: technique.timeRequired,
      implementation: 'gradual'
    };
  }

  // Métodos auxiliares
  calculateConsistency(userProgress) {
    if (userProgress.length < 2) return 0;
    
    const dates = userProgress.map(p => new Date(p.lastAccessedAt).toDateString());
    const uniqueDates = new Set(dates);
    const daySpan = Math.max(1, (Date.now() - new Date(userProgress[userProgress.length - 1].lastAccessedAt).getTime()) / (1000 * 60 * 60 * 24));
    
    return uniqueDates.size / daySpan;
  }

  calculateAverageFocusTime(userProgress) {
    if (!userProgress || userProgress.length === 0) return 25;
    return userProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / userProgress.length;
  }

  calculateRetentionRate(userHistory) {
    if (!userHistory || userHistory.length === 0) return 0.8;
    
    const retention = userHistory.filter(h => h.bestScore > 70).length / userHistory.length;
    return Math.max(0.5, Math.min(1.0, retention));
  }

  selectQuestionTypes(userLevel) {
    const types = {
      beginner: ['multiple_choice', 'true_false', 'fill_blank'],
      intermediate: ['short_answer', 'explanation', 'compare_contrast'],
      advanced: ['analysis', 'synthesis', 'evaluation', 'application']
    };
    
    return types[userLevel] || types.intermediate;
  }

  getDefaultStudyProfile() {
    return {
      learningPattern: 'iniciante',
      preferredStyle: 'visual',
      currentChallenges: ['estabelecer_rotina'],
      optimalTechniques: [
        {
          technique: this.studyTechniques.pomodoro,
          reason: 'Ideal para estabelecer disciplina de estudo',
          priority: 'alta'
        }
      ],
      personalizedPlan: {
        dailySchedule: 'Sessões de 25 minutos, 2x por dia',
        weeklyGoals: 'Completar 3 lições por semana',
        monthlyMilestones: 'Estabelecer rotina de estudo consistente'
      }
    };
  }

  // Métodos placeholder para integração futura
  async getUserSpacedRepetitionHistory(userId) { return []; }
  async savePomodoroSession(session) { return true; }
  async getTodaySessionCount(userId) { return 0; }
  async getUserKnowledgeLevel(userId, topic) { return 'intermediate'; }
  async getUserPerformanceHistory(userId) { return []; }
  async getUserOverallLevel(userId) { return 'intermediate'; }
  async getUserCommunicationStyle(userId) { return 'balanced'; }
  async getUserCognitiveStyle(userId) { return 'analytical'; }
}

module.exports = new AdvancedStudyTechniquesService();