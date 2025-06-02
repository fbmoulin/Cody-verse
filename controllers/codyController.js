const { db } = require('../server/database');
const { codyInteractions } = require('../shared/schema');
const { eq, desc } = require('drizzle-orm');

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
  }

  // Lidar com interação do usuário
  async handleInteraction(req, res) {
    try {
      const { userId, interactionType, context, userMessage } = req.body;

      // Gerar resposta do Cody baseada no tipo de interação
      const response = this.generateResponse(interactionType, context, userMessage);

      // Salvar interação no banco de dados se userId fornecido
      if (userId) {
        await db.insert(codyInteractions).values({
          userId: parseInt(userId),
          interactionType,
          context: context || null,
          userMessage: userMessage || null,
          codyResponse: response,
          timestamp: new Date()
        });
      }

      // Simular delay de "pensamento" do Cody
      await new Promise(resolve => setTimeout(resolve, 1200));

      res.json({
        success: true,
        data: {
          response,
          emotion: this.getEmotionForContext(interactionType),
          suggestions: this.getSuggestions(interactionType)
        }
      });
    } catch (error) {
      console.error('Erro na interação com Cody:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno na interação com Cody'
      });
    }
  }

  // Gerar resposta contextual
  generateResponse(type, context, userMessage) {
    const baseResponses = this.responses[type] || this.responses.encouragement;
    let response = baseResponses[Math.floor(Math.random() * baseResponses.length)];

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