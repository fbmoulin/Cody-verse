const { db } = require('../server/database');
const { codyInteractions, userLessonProgress, users, learningSessions } = require('../shared/schema');
const { eq, desc, and, gte, sql } = require('drizzle-orm');

class CodyController {
  constructor() {
    this.responses = {
      course: [
        "Nosso curso é uma jornada estruturada! Começamos com IA Básica, depois Prompt Engineering, Assistentes de IA, Agentes de IA e finalmente o Model Context Protocol.",
        "É como construir uma casa - primeiro fazemos a fundação com conceitos básicos, depois adicionamos as paredes com técnicas avançadas!",
        "Temos 27 lições totais com mais de 390 minutos de conteúdo. Você ganhará 215 pontos XP no total!"
      ],
      progress: [
        "Seu progresso é medido através de pontos XP, lições concluídas e conquistas desbloqueadas!",
        "Cada lição dá pontos baseados na dificuldade. Você também pode ganhar badges especiais!",
        "Não se preocupe com a velocidade - aprenda no seu ritmo. Eu estarei aqui para ajudar!"
      ],
      tips: [
        "Pratique imediatamente o que aprender! Cada lição interativa tem exercícios práticos.",
        "Explique os conceitos de volta para mim - ensinar é a melhor forma de aprender!",
        "Faça pausas regulares. O cérebro precisa de tempo para processar novos conceitos."
      ],
      encouragement: [
        "Você está indo muito bem! Cada passo é um progresso real.",
        "Lembre-se: todo especialista já foi iniciante. Continue persistindo!",
        "O aprendizado é uma jornada, não uma corrida. Você está no caminho certo!"
      ],
      technical: [
        "IA é sobre padrões e aprendizado. Como humanos reconhecem rostos, máquinas reconhecem dados!",
        "Prompt Engineering é como falar a língua da IA - quanto mais específico, melhor a resposta.",
        "Agentes de IA são como assistentes autônomos que podem tomar decisões baseadas em objetivos."
      ]
    };

    // Advanced AI capabilities
    this.learningAnalytics = {
      difficultyThresholds: {
        struggling: 0.4,    // Below 40% completion rate
        average: 0.7,       // 40-70% completion rate
        excelling: 0.9      // Above 90% completion rate
      },
      interventionTriggers: {
        timeSpentExcessive: 30,     // Minutes spent on single lesson
        lowScoreStreak: 3,          // Consecutive low scores
        inactivityDays: 2           // Days without activity
      }
    };

    this.emotionalStates = {
      frustrated: {
        indicators: ['difícil', 'não entendo', 'confuso', 'impossível'],
        responses: [
          "Vejo que está encontrando alguns desafios. Isso é completamente normal no aprendizado!",
          "Sei que pode parecer complicado agora, mas cada dificuldade é uma oportunidade de crescimento.",
          "Que tal darmos um passo atrás e revisarmos os conceitos fundamentais?"
        ]
      },
      confident: {
        indicators: ['fácil', 'entendi', 'claro', 'simples'],
        responses: [
          "Excelente! Vejo que está dominando bem esses conceitos.",
          "Ótimo progresso! Está pronto para desafios mais avançados?",
          "Perfeito! Sua compreensão está sólida neste tópico."
        ]
      },
      curious: {
        indicators: ['como', 'por que', 'o que acontece', 'e se'],
        responses: [
          "Adoro sua curiosidade! Vamos explorar isso mais profundamente.",
          "Excelente pergunta! Isso mostra que está pensando criticamente.",
          "Sua curiosidade é o combustível do aprendizado. Vamos investigar juntos!"
        ]
      }
    };
  }

  // Handle user interaction
  async handleInteraction(req, res) {
    const logger = require('../server/logger');
    
    try {
      const { userId, interactionType, context, userMessage } = req.body;

      if (!interactionType) {
        logger.warn('Cody interaction missing interactionType', { body: req.body });
        return res.status(400).json({
          success: false,
          error: 'interactionType is required'
        });
      }

      // Analyze user state and generate intelligent response
      const userAnalysis = await this.analyzeUserState(userId, userMessage, context);
      const response = await this.generateIntelligentResponse(interactionType, context, userMessage, userAnalysis);
      
      // Calculate sentiment score for tracking
      const sentimentScore = this.calculateSentimentScore(userMessage);
      
      logger.api('Cody interaction processed', { 
        interactionType, 
        context, 
        responseLength: response?.length || 0,
        userState: userAnalysis.state,
        sentimentScore
      });

      // Save interaction to database if userId provided  
      if (userId) {
        try {
          const { db } = require('../server/database');
          const { codyInteractions } = require('../shared/schema');
          await db.insert(codyInteractions).values({
            userId: parseInt(userId),
            interactionType,
            context: context || null,
            userMessage: userMessage || null,
            codyResponse: response,
            sentimentScore: sentimentScore,
            interactionData: {
              userState: userAnalysis.state,
              emotionalIndicators: userAnalysis.emotions,
              interventionTriggered: userAnalysis.needsIntervention
            },
            createdAt: new Date()
          });
          
          logger.database('Cody interaction saved', { userId, interactionType });
        } catch (dbError) {
          logger.warn('Could not save interaction to database', { error: dbError.message });
        }
      }

      // Simulate Cody "thinking" delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      res.json({
        success: true,
        data: {
          response,
          emotion: this.getEmotionForContext(interactionType),
          suggestions: await this.getAdaptiveSuggestions(interactionType, userAnalysis),
          userInsights: {
            learningState: userAnalysis.state,
            recommendedAction: userAnalysis.recommendedAction,
            nextOptimalStudyTime: userAnalysis.nextOptimalStudyTime
          }
        }
      });
    } catch (error) {
      logger.error('Error in Cody interaction', { 
        error: error.message,
        stack: error.stack,
        interactionType: req.body?.interactionType 
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error in Cody interaction'
      });
    }
  }

  // Advanced user state analysis
  async analyzeUserState(userId, userMessage, context) {
    const analysis = {
      state: 'neutral',
      emotions: [],
      needsIntervention: false,
      recommendedAction: 'continue',
      nextOptimalStudyTime: null,
      performancePattern: 'stable'
    };

    if (!userId) return analysis;

    try {
      // Get recent user progress and interactions
      const recentProgress = await this.getUserRecentActivity(userId);
      const recentInteractions = await this.getUserRecentInteractions(userId);
      
      // Analyze emotional state from message
      if (userMessage) {
        analysis.emotions = this.detectEmotionalIndicators(userMessage);
        analysis.state = this.determineEmotionalState(analysis.emotions);
      }

      // Analyze learning performance patterns
      if (recentProgress.length > 0) {
        analysis.performancePattern = this.analyzePerformancePattern(recentProgress);
        analysis.needsIntervention = this.shouldTriggerIntervention(recentProgress, recentInteractions);
        
        if (analysis.needsIntervention) {
          analysis.recommendedAction = this.getRecommendedIntervention(analysis.performancePattern);
        }
      }

      // Calculate optimal study time based on user patterns
      analysis.nextOptimalStudyTime = this.calculateOptimalStudyTime(recentProgress);

      return analysis;
    } catch (error) {
      const logger = require('../server/logger');
      logger.warn('Error analyzing user state', { userId, error: error.message });
      return analysis;
    }
  }

  // Enhanced response generation with AI intelligence
  async generateIntelligentResponse(type, context, userMessage, userAnalysis) {
    // Use emotional intelligence to select appropriate response style
    let response = '';
    
    // Priority: Handle emotional state first
    if (userAnalysis.emotions.length > 0) {
      const dominantEmotion = userAnalysis.emotions[0];
      if (this.emotionalStates[dominantEmotion]) {
        const emotionalResponses = this.emotionalStates[dominantEmotion].responses;
        response = emotionalResponses[Math.floor(Math.random() * emotionalResponses.length)];
      }
    }
    
    // Fallback to standard responses if no emotional state detected
    if (!response) {
      const baseResponses = this.responses[type] || this.responses.encouragement;
      response = baseResponses[Math.floor(Math.random() * baseResponses.length)];
    }

    // Add performance-based contextual information
    if (userAnalysis.needsIntervention) {
      response = await this.addInterventionGuidance(response, userAnalysis);
    }

    // Personalizar resposta baseada no contexto
    if (context) {
      switch (context) {
        case 'ai-basics':
          response += " No módulo de IA Básica, focamos em entender como as máquinas 'pensam' e aprendem.";
          break;
        case 'prompt-engineering':
          response += " Prompt Engineering é fundamental - é como você se comunica efetivamente com a IA.";
          break;
        case 'quiz':
          response += " Nos quizzes, não se preocupe em acertar tudo na primeira tentativa. O importante é aprender!";
          break;
        case 'completed':
          response = "Parabéns por completar essa etapa! Cada conquista é um passo importante na sua jornada de aprendizado.";
          break;
      }
    }

    // Adicionar toque pessoal baseado na mensagem do usuário
    if (userMessage) {
      if (userMessage.toLowerCase().includes('difícil')) {
        response += " Sei que pode parecer desafiador no início, mas você está se saindo muito bem!";
      } else if (userMessage.toLowerCase().includes('ajuda')) {
        response += " Estou sempre aqui para ajudar! Pode me perguntar qualquer coisa sobre o curso.";
      }
    }

    return response;
  }

  // Get recent user activity for analysis
  async getUserRecentActivity(userId) {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const progress = await db.select()
        .from(userLessonProgress)
        .where(and(
          eq(userLessonProgress.userId, parseInt(userId)),
          gte(userLessonProgress.lastAccessedAt, oneWeekAgo)
        ))
        .orderBy(desc(userLessonProgress.lastAccessedAt))
        .limit(20);

      return progress;
    } catch (error) {
      return [];
    }
  }

  // Get recent user interactions with Cody
  async getUserRecentInteractions(userId) {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const interactions = await db.select()
        .from(codyInteractions)
        .where(and(
          eq(codyInteractions.userId, parseInt(userId)),
          gte(codyInteractions.createdAt, threeDaysAgo)
        ))
        .orderBy(desc(codyInteractions.createdAt))
        .limit(10);

      return interactions;
    } catch (error) {
      return [];
    }
  }

  // Detect emotional indicators in user message
  detectEmotionalIndicators(message) {
    const emotions = [];
    const lowercaseMessage = message.toLowerCase();

    for (const [emotion, data] of Object.entries(this.emotionalStates)) {
      for (const indicator of data.indicators) {
        if (lowercaseMessage.includes(indicator)) {
          emotions.push(emotion);
          break;
        }
      }
    }

    return emotions;
  }

  // Determine dominant emotional state
  determineEmotionalState(emotions) {
    if (emotions.length === 0) return 'neutral';
    
    // Priority order: frustrated > curious > confident
    if (emotions.includes('frustrated')) return 'frustrated';
    if (emotions.includes('curious')) return 'curious';
    if (emotions.includes('confident')) return 'confident';
    
    return emotions[0];
  }

  // Analyze performance patterns
  analyzePerformancePattern(recentProgress) {
    if (recentProgress.length === 0) return 'stable';

    const avgCompletionRate = recentProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / recentProgress.length;
    const avgTimeSpent = recentProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0) / recentProgress.length;

    if (avgCompletionRate < this.learningAnalytics.difficultyThresholds.struggling * 100) {
      return 'struggling';
    } else if (avgCompletionRate > this.learningAnalytics.difficultyThresholds.excelling * 100) {
      return 'excelling';
    } else if (avgTimeSpent > this.learningAnalytics.interventionTriggers.timeSpentExcessive) {
      return 'slow_but_thorough';
    }

    return 'stable';
  }

  // Determine if intervention is needed
  shouldTriggerIntervention(recentProgress, recentInteractions) {
    // Check for excessive time on lessons
    const excessiveTime = recentProgress.some(p => 
      p.timeSpentMinutes > this.learningAnalytics.interventionTriggers.timeSpentExcessive
    );

    // Check for consecutive low scores
    let lowScoreStreak = 0;
    for (const progress of recentProgress.slice(0, 5)) {
      if (progress.bestScore < 70) {
        lowScoreStreak++;
      } else {
        break;
      }
    }
    const hasLowScoreStreak = lowScoreStreak >= this.learningAnalytics.interventionTriggers.lowScoreStreak;

    // Check for inactivity
    const lastActivity = recentProgress[0]?.lastAccessedAt;
    const daysSinceActivity = lastActivity ? 
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24) : 
      999;
    const hasInactivity = daysSinceActivity > this.learningAnalytics.interventionTriggers.inactivityDays;

    return excessiveTime || hasLowScoreStreak || hasInactivity;
  }

  // Get recommended intervention based on pattern
  getRecommendedIntervention(performancePattern) {
    const interventions = {
      struggling: 'review_fundamentals',
      slow_but_thorough: 'adjust_pace',
      excelling: 'advanced_challenges',
      stable: 'continue'
    };

    return interventions[performancePattern] || 'continue';
  }

  // Calculate optimal study time based on user patterns
  calculateOptimalStudyTime(recentProgress) {
    if (recentProgress.length === 0) return null;

    // Analyze when user is most active and successful
    const hourlyPerformance = {};
    
    recentProgress.forEach(progress => {
      const hour = new Date(progress.lastAccessedAt).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { count: 0, totalCompletion: 0 };
      }
      hourlyPerformance[hour].count++;
      hourlyPerformance[hour].totalCompletion += progress.completionPercentage;
    });

    // Find the hour with best average performance
    let bestHour = null;
    let bestAvgPerformance = 0;

    for (const [hour, data] of Object.entries(hourlyPerformance)) {
      const avgPerformance = data.totalCompletion / data.count;
      if (avgPerformance > bestAvgPerformance && data.count >= 2) {
        bestAvgPerformance = avgPerformance;
        bestHour = parseInt(hour);
      }
    }

    if (bestHour !== null) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(bestHour, 0, 0, 0);
      return tomorrow.toISOString();
    }

    return null;
  }

  // Add intervention guidance to response
  async addInterventionGuidance(response, userAnalysis) {
    const guidance = {
      review_fundamentals: " Que tal revisarmos alguns conceitos básicos antes de continuar? Isso pode ajudar a solidificar sua base.",
      adjust_pace: " Vejo que você está sendo muito detalhista - isso é ótimo! Talvez possamos ajustar o ritmo para ser mais eficiente.",
      advanced_challenges: " Você está indo muito bem! Está pronto para alguns desafios mais avançados?",
      continue: " Continue com o excelente trabalho!"
    };

    const interventionText = guidance[userAnalysis.recommendedAction] || guidance.continue;
    return response + interventionText;
  }

  // Calculate sentiment score from user message
  calculateSentimentScore(message) {
    if (!message) return 0;

    const positiveWords = ['ótimo', 'excelente', 'gosto', 'fácil', 'claro', 'entendi', 'legal', 'bom'];
    const negativeWords = ['difícil', 'ruim', 'não entendo', 'confuso', 'impossível', 'chato', 'complicado'];

    let score = 0;
    const words = message.toLowerCase().split(' ');

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    });

    return Math.max(-5, Math.min(5, score));
  }

  // Get adaptive suggestions based on user analysis
  async getAdaptiveSuggestions(interactionType, userAnalysis) {
    const baseSuggestions = this.getSuggestions(interactionType);
    
    // Add personalized suggestions based on user state
    const adaptiveSuggestions = [...baseSuggestions];

    if (userAnalysis.performancePattern === 'struggling') {
      adaptiveSuggestions.unshift("Revisar conceitos fundamentais");
      adaptiveSuggestions.unshift("Praticar com exemplos mais simples");
    } else if (userAnalysis.performancePattern === 'excelling') {
      adaptiveSuggestions.push("Explorar tópicos avançados");
      adaptiveSuggestions.push("Tentar desafios extras");
    }

    if (userAnalysis.nextOptimalStudyTime) {
      const time = new Date(userAnalysis.nextOptimalStudyTime);
      adaptiveSuggestions.push(`Seu melhor horário de estudo: ${time.getHours()}:00`);
    }

    return adaptiveSuggestions.slice(0, 4); // Limit to 4 suggestions
  }

  // Obter emoção apropriada para o contexto
  getEmotionForContext(type) {
    const emotions = {
      course: 'happy',
      progress: 'proud',
      tips: 'thinking',
      encouragement: 'encouraging',
      help: 'supportive',
      quiz: 'focused',
      completed: 'excited'
    };
    
    return emotions[type] || 'happy';
  }

  // Obter sugestões para continuar a conversa
  getSuggestions(type) {
    const suggestions = {
      course: [
        "Conte-me sobre progresso",
        "Dicas de aprendizado",
        "Preciso de motivação"
      ],
      progress: [
        "Como ganhar mais XP?",
        "Sobre conquistas",
        "Próximos passos"
      ],
      tips: [
        "Estratégias avançadas",
        "Como revisar conteúdo",
        "Plano de estudos"
      ]
    };

    return suggestions[type] || [
      "Conte sobre o curso",
      "Como acompanhar progresso",
      "Dicas de aprendizado"
    ];
  }

  // Obter contexto do usuário (histórico recente)
  async getUserContext(req, res) {
    try {
      const { userId } = req.params;
      
      const recentInteractions = await db
        .select()
        .from(codyInteractions)
        .where(eq(codyInteractions.userId, parseInt(userId)))
        .orderBy(desc(codyInteractions.timestamp))
        .limit(5);

      res.json({
        success: true,
        data: {
          recentInteractions,
          context: this.analyzeUserContext(recentInteractions)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar contexto do usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar contexto'
      });
    }
  }

  // Analisar padrões do usuário
  analyzeUserContext(interactions) {
    if (interactions.length === 0) {
      return { type: 'new_user', suggestion: 'welcome' };
    }

    const recentTypes = interactions.map(i => i.interactionType);
    const mostCommon = recentTypes.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );

    return {
      type: 'returning_user',
      mostCommonInteraction: mostCommon,
      lastInteraction: interactions[0].timestamp,
      suggestion: this.getContextualSuggestion(mostCommon)
    };
  }

  // Sugestão baseada no padrão de uso
  getContextualSuggestion(commonType) {
    const suggestions = {
      course: 'Explore um novo módulo!',
      progress: 'Vamos continuar de onde parou?',
      tips: 'Pronto para técnicas avançadas?',
      help: 'Que tal um desafio hoje?'
    };

    return suggestions[commonType] || 'Continue sua jornada de aprendizado!';
  }

  // Fornecer feedback sobre performance
  async provideFeedback(req, res) {
    try {
      const { userId, lessonId, performance, feedback } = req.body;

      // Analisar performance e gerar feedback personalizado
      const personalizedFeedback = this.generatePerformanceFeedback(performance);

      // Salvar feedback
      if (userId) {
        await db.insert(codyInteractions).values({
          userId: parseInt(userId),
          interactionType: 'feedback',
          context: `lesson_${lessonId}`,
          userMessage: `Performance: ${performance}`,
          codyResponse: personalizedFeedback,
          timestamp: new Date()
        });
      }

      res.json({
        success: true,
        data: {
          feedback: personalizedFeedback,
          encouragement: this.getEncouragementMessage(performance),
          nextSteps: this.getNextSteps(performance)
        }
      });
    } catch (error) {
      console.error('Erro ao fornecer feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao fornecer feedback'
      });
    }
  }

  // Gerar feedback baseado na performance
  generatePerformanceFeedback(performance) {
    if (performance >= 90) {
      return "Excelente trabalho! Você demonstrou domínio completo do conteúdo. Continue assim!";
    } else if (performance >= 70) {
      return "Muito bom! Você está no caminho certo. Algumas pequenas revisões podem ajudar a solidificar o conhecimento.";
    } else if (performance >= 50) {
      return "Bom progresso! Recomendo revisar alguns conceitos-chave antes de continuar para o próximo tópico.";
    } else {
      return "Não se desanime! Aprendizado leva tempo. Vamos revisar juntos os pontos principais desta lição.";
    }
  }

  // Mensagem de encorajamento baseada na performance
  getEncouragementMessage(performance) {
    if (performance >= 70) {
      return "Você está se destacando! Sua dedicação está dando frutos.";
    } else {
      return "Lembre-se: cada erro é uma oportunidade de aprender. Você está evoluindo!";
    }
  }

  // Próximos passos sugeridos
  getNextSteps(performance) {
    if (performance >= 80) {
      return ["Avançar para próxima lição", "Explorar conteúdo avançado", "Tentar um desafio prático"];
    } else if (performance >= 60) {
      return ["Revisar conceitos principais", "Praticar exercícios", "Buscar exemplos adicionais"];
    } else {
      return ["Revisar lição completa", "Estudar material de apoio", "Conversar comigo sobre dúvidas"];
    }
  }
}

module.exports = new CodyController();