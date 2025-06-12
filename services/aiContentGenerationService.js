const { OpenAI } = require('openai');

class AIContentGenerationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    this.contentTemplates = {
      practice_problems: {
        ai_basics: [
          "Explique como uma rede neural artificial processa informações, usando uma analogia com o cérebro humano.",
          "Descreva três aplicações práticas de machine learning que você usa no dia a dia sem perceber.",
          "Compare algoritmos supervisionados e não supervisionados com exemplos concretos."
        ],
        prompt_engineering: [
          "Crie um prompt eficaz para gerar um resumo de artigo científico sobre IA.",
          "Desenvolva uma estratégia de prompt para obter respostas mais precisas sobre tópicos técnicos.",
          "Analise este prompt e sugira melhorias: 'Me fale sobre IA'."
        ]
      },
      adaptive_explanations: {
        struggling: "Vamos simplificar este conceito. Imagine que...",
        average: "Para entender melhor, considere este exemplo prático...",
        advanced: "Expandindo este conceito para aplicações mais complexas..."
      }
    };

    this.difficultyLevels = {
      beginner: { complexity: 0.3, vocabulary: 'simple', examples: 'concrete' },
      intermediate: { complexity: 0.6, vocabulary: 'technical', examples: 'practical' },
      advanced: { complexity: 0.9, vocabulary: 'expert', examples: 'abstract' }
    };
  }

  async generatePersonalizedContent(userId, topic, userLevel, learningStyle) {
    try {
      const userContext = await this.getUserLearningContext(userId);
      const contentSpecs = this.difficultyLevels[userLevel] || this.difficultyLevels.intermediate;

      const prompt = this.buildContentPrompt(topic, contentSpecs, userContext, learningStyle);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em educação adaptativa e IA. Crie conteúdo educacional personalizado que se adapta ao nível e estilo de aprendizado do usuário."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      });

      return {
        content: response.choices[0].message.content,
        difficulty: userLevel,
        adaptations: this.identifyAdaptations(response.choices[0].message.content),
        followUpQuestions: await this.generateFollowUpQuestions(topic, userLevel)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating personalized content', { userId, topic, error: error.message });
      return this.getFallbackContent(topic, userLevel);
    }
  }

  async generateAdaptiveQuiz(userId, topic, performanceHistory) {
    try {
      const difficultyAdjustment = this.calculateDifficultyAdjustment(performanceHistory);
      const questionTypes = this.selectQuestionTypes(performanceHistory);

      const prompt = `
        Crie um quiz adaptativo sobre ${topic} com as seguintes especificações:
        - Nível de dificuldade: ${difficultyAdjustment}
        - Tipos de questões: ${questionTypes.join(', ')}
        - 5 questões no formato JSON
        - Incluir explicações detalhadas para cada resposta
        - Adaptar à performance anterior do usuário
        
        Formato de resposta:
        {
          "questions": [
            {
              "id": 1,
              "question": "texto da pergunta",
              "options": ["a", "b", "c", "d"],
              "correct": 0,
              "explanation": "explicação detalhada",
              "difficulty": "easy|medium|hard",
              "type": "multiple_choice|true_false|fill_blank"
            }
          ]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em avaliação educacional. Crie quizzes adaptativos baseados na performance do usuário."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating adaptive quiz', { userId, topic, error: error.message });
      return this.getFallbackQuiz(topic);
    }
  }

  async generateRealWorldCaseStudy(topic, industryContext, complexity) {
    try {
      const prompt = `
        Crie um estudo de caso real sobre ${topic} no contexto de ${industryContext}.
        Complexidade: ${complexity}
        
        Inclua:
        1. Cenário real e desafiador
        2. Dados específicos e métricas
        3. Múltiplas soluções possíveis
        4. Considerações éticas
        5. Resultados esperados
        6. Pontos de discussão
        
        Formato: Narrativa envolvente com elementos práticos
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um consultor sênior especializado em implementações práticas de IA em diversos setores industriais."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.8
      });

      return {
        caseStudy: response.choices[0].message.content,
        industry: industryContext,
        complexity: complexity,
        discussionPoints: await this.generateDiscussionPoints(topic, industryContext)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating case study', { topic, industryContext, error: error.message });
      return this.getFallbackCaseStudy(topic);
    }
  }

  async generateContextualExplanation(concept, userQuestion, currentProgress) {
    try {
      const context = await this.buildExplanationContext(currentProgress);
      
      const prompt = `
        O usuário perguntou: "${userQuestion}"
        Conceito: ${concept}
        Contexto do progresso: ${context}
        
        Forneça uma explicação:
        1. Diretamente relacionada à pergunta
        2. Adaptada ao nível atual do usuário
        3. Com exemplos práticos
        4. Conectando com conhecimento anterior
        5. Sugerindo próximos passos
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é Cody, um assistente de IA educacional especializado em criar explicações personalizadas e contextualmente relevantes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.6
      });

      return {
        explanation: response.choices[0].message.content,
        relatedConcepts: await this.identifyRelatedConcepts(concept),
        suggestedActions: await this.generateSuggestedActions(concept, currentProgress)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating contextual explanation', { concept, userQuestion, error: error.message });
      return this.getFallbackExplanation(concept);
    }
  }

  async generateMotivationalContent(userState, achievements, strugglingAreas) {
    try {
      const prompt = `
        Estado do usuário: ${userState}
        Conquistas recentes: ${achievements.join(', ')}
        Áreas de dificuldade: ${strugglingAreas.join(', ')}
        
        Crie uma mensagem motivacional que:
        1. Reconheça os progressos alcançados
        2. Normalize as dificuldades
        3. Forneça estratégias específicas
        4. Inspire confiança
        5. Sugira metas alcançáveis
        
        Tom: Encorajador, empático e prático
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Você é um mentor experiente em educação que entende profundamente a psicologia do aprendizado e sabe como motivar estudantes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      return {
        message: response.choices[0].message.content,
        suggestedGoals: await this.generatePersonalizedGoals(userState, strugglingAreas),
        encouragementLevel: this.calculateEncouragementLevel(userState)
      };
    } catch (error) {
      const logger = require('../server/logger');
      logger.error('Error generating motivational content', { userState, error: error.message });
      return this.getFallbackMotivation(userState);
    }
  }

  // Helper methods
  buildContentPrompt(topic, contentSpecs, userContext, learningStyle) {
    return `
      Tópico: ${topic}
      Nível de complexidade: ${contentSpecs.complexity}
      Vocabulário: ${contentSpecs.vocabulary}
      Estilo de exemplos: ${contentSpecs.examples}
      Estilo de aprendizado preferido: ${learningStyle}
      Contexto do usuário: ${userContext}
      
      Crie conteúdo educacional que:
      1. Seja apropriado para o nível especificado
      2. Use o vocabulário adequado
      3. Inclua exemplos relevantes
      4. Adapte-se ao estilo de aprendizado
      5. Conecte com o conhecimento anterior
    `;
  }

  async getUserLearningContext(userId) {
    // This would integrate with the learning analytics service
    try {
      const learningAnalytics = require('./learningAnalyticsService');
      const recentActivity = await learningAnalytics.getUserRecentActivity(userId);
      
      return {
        recentTopics: this.extractRecentTopics(recentActivity),
        performanceLevel: this.calculatePerformanceLevel(recentActivity),
        preferredPace: this.calculatePreferredPace(recentActivity)
      };
    } catch (error) {
      return { recentTopics: [], performanceLevel: 'intermediate', preferredPace: 'moderate' };
    }
  }

  calculateDifficultyAdjustment(performanceHistory) {
    if (!performanceHistory || performanceHistory.length === 0) return 'medium';
    
    const avgScore = performanceHistory.reduce((sum, p) => sum + (p.bestScore || 0), 0) / performanceHistory.length;
    
    if (avgScore > 85) return 'hard';
    if (avgScore < 60) return 'easy';
    return 'medium';
  }

  selectQuestionTypes(performanceHistory) {
    const types = ['multiple_choice'];
    
    if (performanceHistory && performanceHistory.length > 3) {
      const avgAttempts = performanceHistory.reduce((sum, p) => sum + (p.attempts || 1), 0) / performanceHistory.length;
      
      if (avgAttempts < 1.5) {
        types.push('true_false', 'fill_blank');
      }
    }
    
    return types;
  }

  identifyAdaptations(content) {
    const adaptations = [];
    
    if (content.includes('exemplo')) adaptations.push('practical_examples');
    if (content.includes('analogia')) adaptations.push('analogies');
    if (content.includes('passo a passo')) adaptations.push('step_by_step');
    
    return adaptations;
  }

  async generateFollowUpQuestions(topic, userLevel) {
    const questions = {
      beginner: [
        `Como você aplicaria ${topic} em uma situação do dia a dia?`,
        `Qual parte de ${topic} você gostaria de explorar mais?`,
        `Você consegue pensar em um exemplo prático de ${topic}?`
      ],
      intermediate: [
        `Quais são as limitações principais de ${topic}?`,
        `Como ${topic} se relaciona com outros conceitos que você já aprendeu?`,
        `Que problemas reais você resolveria usando ${topic}?`
      ],
      advanced: [
        `Quais são as implicações éticas de ${topic}?`,
        `Como você otimizaria a implementação de ${topic}?`,
        `Que inovações futuras você prevê para ${topic}?`
      ]
    };
    
    return questions[userLevel] || questions.intermediate;
  }

  async generateDiscussionPoints(topic, industryContext) {
    return [
      `Quais são os principais desafios de implementar ${topic} em ${industryContext}?`,
      `Como medir o ROI desta solução?`,
      `Que resistências organizacionais podem surgir?`,
      `Quais competências a equipe precisa desenvolver?`
    ];
  }

  async buildExplanationContext(currentProgress) {
    if (!currentProgress || currentProgress.length === 0) {
      return 'Usuário iniciante sem histórico anterior';
    }
    
    const recentLessons = currentProgress.slice(0, 3).map(p => p.lessonTitle || 'Lição').join(', ');
    const avgCompletion = currentProgress.reduce((sum, p) => sum + p.completionPercentage, 0) / currentProgress.length;
    
    return `Lições recentes: ${recentLessons}. Taxa de conclusão média: ${avgCompletion.toFixed(0)}%`;
  }

  async identifyRelatedConcepts(concept) {
    const conceptMap = {
      'machine_learning': ['algoritmos', 'dados', 'treinamento', 'validação'],
      'neural_networks': ['perceptron', 'backpropagation', 'deep_learning', 'ativação'],
      'prompt_engineering': ['contexto', 'instruções', 'exemplos', 'temperatura']
    };
    
    return conceptMap[concept] || ['fundamentos', 'aplicações', 'limitações'];
  }

  async generateSuggestedActions(concept, currentProgress) {
    return [
      'Praticar com exemplos interativos',
      'Revisar conceitos fundamentais',
      'Explorar aplicações práticas',
      'Fazer exercícios de fixação'
    ];
  }

  async generatePersonalizedGoals(userState, strugglingAreas) {
    const goals = [];
    
    if (strugglingAreas.includes('completion')) {
      goals.push('Completar pelo menos 80% da próxima lição');
    }
    
    if (strugglingAreas.includes('time_management')) {
      goals.push('Estudar por 20 minutos consecutivos sem interrupção');
    }
    
    goals.push('Fazer uma pergunta sobre o conteúdo estudado');
    goals.push('Aplicar um conceito aprendido em um exemplo próprio');
    
    return goals;
  }

  calculateEncouragementLevel(userState) {
    const encouragementMap = {
      frustrated: 'high',
      struggling: 'medium',
      neutral: 'low',
      confident: 'minimal'
    };
    
    return encouragementMap[userState] || 'medium';
  }

  // Fallback methods for when OpenAI is not available
  getFallbackContent(topic, userLevel) {
    return {
      content: `Conteúdo sobre ${topic} adaptado para nível ${userLevel}. Este é um placeholder que seria substituído por conteúdo gerado por IA.`,
      difficulty: userLevel,
      adaptations: ['practical_examples'],
      followUpQuestions: [`Como você aplicaria ${topic} na prática?`]
    };
  }

  getFallbackQuiz(topic) {
    return {
      questions: [
        {
          id: 1,
          question: `Qual é o conceito principal de ${topic}?`,
          options: ["Opção A", "Opção B", "Opção C", "Opção D"],
          correct: 0,
          explanation: "Explicação do conceito principal.",
          difficulty: "medium",
          type: "multiple_choice"
        }
      ]
    };
  }

  getFallbackCaseStudy(topic) {
    return {
      caseStudy: `Estudo de caso sobre ${topic}: Este é um exemplo prático de como ${topic} é aplicado em situações reais.`,
      industry: 'tecnologia',
      complexity: 'medium',
      discussionPoints: [`Como implementar ${topic} efetivamente?`]
    };
  }

  getFallbackExplanation(concept) {
    return {
      explanation: `${concept} é um conceito importante que envolve vários aspectos práticos e teóricos.`,
      relatedConcepts: ['fundamentos', 'aplicações'],
      suggestedActions: ['Estudar mais sobre o tema', 'Praticar com exercícios']
    };
  }

  getFallbackMotivation(userState) {
    return {
      message: 'Você está fazendo um ótimo progresso! Continue focado em seus objetivos de aprendizado.',
      suggestedGoals: ['Completar a próxima lição', 'Fazer perguntas quando tiver dúvidas'],
      encouragementLevel: 'medium'
    };
  }

  extractRecentTopics(recentActivity) {
    // Extract topics from recent lesson activity
    return recentActivity.map(activity => activity.lessonTitle || 'Tópico Geral').slice(0, 3);
  }

  calculatePerformanceLevel(recentActivity) {
    if (recentActivity.length === 0) return 'beginner';
    
    const avgScore = recentActivity.reduce((sum, activity) => sum + (activity.bestScore || 0), 0) / recentActivity.length;
    
    if (avgScore > 80) return 'advanced';
    if (avgScore > 60) return 'intermediate';
    return 'beginner';
  }

  calculatePreferredPace(recentActivity) {
    if (recentActivity.length === 0) return 'moderate';
    
    const avgTime = recentActivity.reduce((sum, activity) => sum + (activity.timeSpentMinutes || 0), 0) / recentActivity.length;
    
    if (avgTime > 30) return 'thorough';
    if (avgTime < 15) return 'fast';
    return 'moderate';
  }
}

module.exports = new AIContentGenerationService();