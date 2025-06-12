const BaseService = require('../core/BaseService');

class AgeAdaptationService extends BaseService {
  constructor() {
    super('AgeAdaptationService');
    
    this.ageGroups = {
      CHILD: { min: 7, max: 12, key: 'child' },
      TEEN: { min: 13, max: 18, key: 'teen' },
      ADULT: { min: 19, max: 120, key: 'adult' }
    };

    this.contentAdaptations = {
      child: {
        language: {
          level: 'simple',
          vocabulary: 'basic',
          sentenceLength: 'short',
          examples: 'concrete'
        },
        tone: {
          style: 'encouraging',
          formality: 'informal',
          enthusiasm: 'high',
          supportiveness: 'very_high'
        },
        exercises: {
          complexity: 'basic',
          duration: 'short',
          gameification: 'high',
          visualElements: 'many'
        },
        ui: {
          colors: 'bright',
          fonts: 'large',
          animations: 'playful',
          navigation: 'simple'
        }
      },
      teen: {
        language: {
          level: 'intermediate',
          vocabulary: 'expanding',
          sentenceLength: 'medium',
          examples: 'relatable'
        },
        tone: {
          style: 'motivational',
          formality: 'casual',
          enthusiasm: 'medium',
          supportiveness: 'high'
        },
        exercises: {
          complexity: 'intermediate',
          duration: 'medium',
          gameification: 'medium',
          visualElements: 'balanced'
        },
        ui: {
          colors: 'modern',
          fonts: 'medium',
          animations: 'smooth',
          navigation: 'intuitive'
        }
      },
      adult: {
        language: {
          level: 'advanced',
          vocabulary: 'comprehensive',
          sentenceLength: 'varied',
          examples: 'professional'
        },
        tone: {
          style: 'professional',
          formality: 'formal',
          enthusiasm: 'balanced',
          supportiveness: 'moderate'
        },
        exercises: {
          complexity: 'advanced',
          duration: 'flexible',
          gameification: 'subtle',
          visualElements: 'minimal'
        },
        ui: {
          colors: 'professional',
          fonts: 'standard',
          animations: 'subtle',
          navigation: 'comprehensive'
        }
      }
    };

    this.languageTemplates = {
      child: {
        welcome: "Olá! Que bom te ver aqui! 🌟",
        encouragement: "Você está indo muito bem! Continue assim!",
        lessonStart: "Vamos começar uma nova aventura de aprendizado!",
        lessonComplete: "Parabéns! Você completou mais uma lição!",
        badgeEarned: "Uau! Você ganhou uma nova medalha!",
        errorMessage: "Ops! Vamos tentar de novo juntos!",
        instructions: "Clique aqui para começar",
        progress: "Olha só como você está crescendo!"
      },
      teen: {
        welcome: "E aí! Pronto para mais uma sessão de estudos?",
        encouragement: "Você está arrasando! Bora continuar!",
        lessonStart: "Vamos mergulhar neste conteúdo!",
        lessonComplete: "Mandou bem! Mais uma lição concluída!",
        badgeEarned: "Conquista desbloqueada! 🏆",
        errorMessage: "Sem problemas, todo mundo erra. Vamos tentar novamente!",
        instructions: "Toque para começar",
        progress: "Seu progresso está incrível!"
      },
      adult: {
        welcome: "Bem-vindo de volta. Vamos continuar seu desenvolvimento?",
        encouragement: "Excelente progresso. Continue focado em seus objetivos.",
        lessonStart: "Iniciando módulo de aprendizado.",
        lessonComplete: "Módulo concluído com sucesso.",
        badgeEarned: "Certificação obtida.",
        errorMessage: "Resposta incorreta. Revise o conteúdo e tente novamente.",
        instructions: "Selecione para prosseguir",
        progress: "Acompanhe seu desenvolvimento profissional"
      }
    };

    this.exerciseAdaptations = {
      child: {
        types: ['drag_drop', 'matching', 'coloring', 'simple_quiz', 'story_completion'],
        instructions: 'visual_heavy',
        feedback: 'immediate_positive',
        hints: 'always_available',
        timeLimit: false,
        maxQuestions: 5
      },
      teen: {
        types: ['multiple_choice', 'fill_blanks', 'coding_challenges', 'projects', 'peer_discussions'],
        instructions: 'balanced',
        feedback: 'constructive',
        hints: 'available_on_request',
        timeLimit: 'optional',
        maxQuestions: 10
      },
      adult: {
        types: ['case_studies', 'simulations', 'research_projects', 'presentations', 'certifications'],
        instructions: 'text_based',
        feedback: 'detailed_analytical',
        hints: 'minimal',
        timeLimit: 'enforced',
        maxQuestions: 15
      }
    };
  }

  determineAgeGroup(birthDate) {
    if (!birthDate) return 'adult'; // Default to adult if no birth date
    
    const age = this.calculateAge(birthDate);
    
    for (const [groupName, group] of Object.entries(this.ageGroups)) {
      if (age >= group.min && age <= group.max) {
        return group.key;
      }
    }
    
    return 'adult'; // Default to adult for ages outside defined ranges
  }

  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  adaptContent(content, ageGroup, contentType = 'general') {
    const adaptations = this.contentAdaptations[ageGroup];
    if (!adaptations) return content;

    return {
      ...content,
      adaptedLanguage: this.adaptLanguage(content.text || content.description || '', ageGroup),
      tone: adaptations.tone,
      complexity: adaptations.exercises.complexity,
      ageGroup: ageGroup,
      originalContent: content
    };
  }

  adaptLanguage(text, ageGroup) {
    const templates = this.languageTemplates[ageGroup];
    const adaptations = this.contentAdaptations[ageGroup].language;
    
    // Apply language adaptations based on age group
    switch (ageGroup) {
      case 'child':
        return this.simplifyForChildren(text);
      case 'teen':
        return this.adaptForTeens(text);
      case 'adult':
        return this.formalizeForAdults(text);
      default:
        return text;
    }
  }

  simplifyForChildren(text) {
    return text
      .replace(/\b(utilizar|empregar)\b/gi, 'usar')
      .replace(/\b(compreender|entender)\b/gi, 'saber')
      .replace(/\b(implementar)\b/gi, 'fazer')
      .replace(/\b(desenvolver)\b/gi, 'criar')
      .replace(/\b(complexo|complicado)\b/gi, 'difícil')
      .replace(/\b(simples|básico)\b/gi, 'fácil')
      .replace(/\.{2,}/g, '!')
      .replace(/\b(Vamos|Vamos lá)\b/gi, 'Bora');
  }

  adaptForTeens(text) {
    return text
      .replace(/\b(excelente)\b/gi, 'incrível')
      .replace(/\b(parabéns)\b/gi, 'mandou bem')
      .replace(/\b(muito bom)\b/gi, 'massa')
      .replace(/\b(interessante)\b/gi, 'legal')
      .replace(/\b(vamos)\b/gi, 'bora');
  }

  formalizeForAdults(text) {
    return text
      .replace(/\b(legal|massa|incrível)\b/gi, 'excelente')
      .replace(/\b(bora)\b/gi, 'vamos')
      .replace(/!/g, '.')
      .replace(/\b(mandou bem)\b/gi, 'parabéns');
  }

  generateAgeAppropriateExercises(topic, ageGroup, difficulty = 'medium') {
    const exerciseConfig = this.exerciseAdaptations[ageGroup];
    const exercises = [];

    for (let i = 0; i < Math.min(exerciseConfig.maxQuestions, 10); i++) {
      const exerciseType = exerciseConfig.types[Math.floor(Math.random() * exerciseConfig.types.length)];
      
      exercises.push({
        id: `${topic}_${ageGroup}_${i + 1}`,
        type: exerciseType,
        topic: topic,
        ageGroup: ageGroup,
        difficulty: this.mapDifficultyToAge(difficulty, ageGroup),
        instructions: this.getInstructionsStyle(exerciseConfig.instructions),
        feedback: exerciseConfig.feedback,
        hints: exerciseConfig.hints,
        timeLimit: exerciseConfig.timeLimit,
        content: this.generateExerciseContent(exerciseType, topic, ageGroup)
      });
    }

    return exercises;
  }

  mapDifficultyToAge(difficulty, ageGroup) {
    const difficultyMap = {
      child: { easy: 'very_easy', medium: 'easy', hard: 'medium' },
      teen: { easy: 'easy', medium: 'medium', hard: 'hard' },
      adult: { easy: 'medium', medium: 'hard', hard: 'very_hard' }
    };

    return difficultyMap[ageGroup][difficulty] || difficulty;
  }

  getInstructionsStyle(style) {
    const styles = {
      visual_heavy: 'Use imagens e ícones para explicar cada passo',
      balanced: 'Combine texto claro com elementos visuais',
      text_based: 'Instruções detalhadas em formato de texto'
    };

    return styles[style] || styles.balanced;
  }

  generateExerciseContent(exerciseType, topic, ageGroup) {
    const baseContent = {
      topic: topic,
      ageGroup: ageGroup,
      type: exerciseType
    };

    switch (exerciseType) {
      case 'drag_drop':
        return {
          ...baseContent,
          instruction: 'Arraste os itens para o lugar correto!',
          items: this.generateDragDropItems(topic, ageGroup),
          targets: this.generateDragDropTargets(topic, ageGroup)
        };

      case 'multiple_choice':
        return {
          ...baseContent,
          question: this.generateQuestion(topic, ageGroup),
          options: this.generateMultipleChoiceOptions(topic, ageGroup),
          correctAnswer: 0
        };

      case 'case_studies':
        return {
          ...baseContent,
          scenario: this.generateCaseStudy(topic, ageGroup),
          questions: this.generateCaseStudyQuestions(topic),
          expectedOutcomes: this.generateExpectedOutcomes(topic)
        };

      default:
        return baseContent;
    }
  }

  generateDragDropItems(topic, ageGroup) {
    const templates = {
      child: ['🎨 Arte', '🔢 Números', '📚 Livros', '🎵 Música'],
      teen: ['JavaScript', 'Python', 'HTML', 'CSS'],
      adult: ['Análise de Dados', 'Gestão de Projetos', 'Liderança', 'Estratégia']
    };

    return templates[ageGroup] || templates.adult;
  }

  generateDragDropTargets(topic, ageGroup) {
    const templates = {
      child: ['Casa da Arte', 'Casa dos Números', 'Casa dos Livros', 'Casa da Música'],
      teen: ['Backend', 'Frontend', 'Markup', 'Styling'],
      adult: ['Analytics', 'Project Management', 'Leadership', 'Strategy']
    };

    return templates[ageGroup] || templates.adult;
  }

  generateQuestion(topic, ageGroup) {
    const questionTemplates = {
      child: `O que você aprendeu sobre ${topic} hoje?`,
      teen: `Como você aplicaria ${topic} em um projeto real?`,
      adult: `Qual a importância estratégica de ${topic} no contexto profissional?`
    };

    return questionTemplates[ageGroup] || questionTemplates.adult;
  }

  generateMultipleChoiceOptions(topic, ageGroup) {
    const optionTemplates = {
      child: [
        'É muito legal e divertido!',
        'É difícil mas importante',
        'Não sei ainda',
        'Quero aprender mais!'
      ],
      teen: [
        'Para criar aplicações inovadoras',
        'Para resolver problemas reais',
        'Para construir um portfólio',
        'Para seguir carreira na área'
      ],
      adult: [
        'Otimização de processos organizacionais',
        'Vantagem competitiva no mercado',
        'Redução de custos operacionais',
        'Melhoria na tomada de decisões'
      ]
    };

    return optionTemplates[ageGroup] || optionTemplates.adult;
  }

  generateCaseStudy(topic, ageGroup) {
    const caseTemplates = {
      adult: `Uma empresa multinacional precisa implementar ${topic} em suas operações. 
              Considere os desafios de escala, recursos limitados e resistência à mudança.
              Como você abordaria este projeto?`
    };

    return caseTemplates[ageGroup] || `Estudo de caso sobre ${topic}`;
  }

  generateCaseStudyQuestions(topic) {
    return [
      'Quais são os principais desafios identificados?',
      'Que soluções você proporia?',
      'Como mediria o sucesso da implementação?',
      'Quais riscos devem ser mitigados?'
    ];
  }

  generateExpectedOutcomes(topic) {
    return [
      'Análise abrangente dos desafios',
      'Soluções viáveis e implementáveis',
      'Métricas claras de sucesso',
      'Plano de mitigação de riscos'
    ];
  }

  getUIAdaptations(ageGroup) {
    return this.contentAdaptations[ageGroup]?.ui || this.contentAdaptations.adult.ui;
  }

  getLanguageTemplates(ageGroup) {
    return this.languageTemplates[ageGroup] || this.languageTemplates.adult;
  }

  adaptGamificationRewards(ageGroup, achievement) {
    const rewardAdaptations = {
      child: {
        points: achievement.points * 2,
        badges: achievement.badges.map(badge => ({
          ...badge,
          name: `🌟 ${badge.name}`,
          description: this.simplifyForChildren(badge.description)
        })),
        celebrations: 'high_energy'
      },
      teen: {
        points: achievement.points * 1.5,
        badges: achievement.badges.map(badge => ({
          ...badge,
          name: `🏆 ${badge.name}`,
          description: this.adaptForTeens(badge.description)
        })),
        celebrations: 'motivational'
      },
      adult: {
        points: achievement.points,
        badges: achievement.badges.map(badge => ({
          ...badge,
          name: badge.name,
          description: this.formalizeForAdults(badge.description)
        })),
        celebrations: 'professional'
      }
    };

    return rewardAdaptations[ageGroup] || rewardAdaptations.adult;
  }

  generateAgeBasedMotivation(ageGroup, progress) {
    const motivationTemplates = {
      child: [
        "Você é um super estudante! 🌟",
        "Que incrível! Continue explorando!",
        "Você está ficando cada vez mais esperto!",
        "Parabéns! Você é demais!"
      ],
      teen: [
        "Você está mandando muito bem!",
        "Seu progresso está incrível!",
        "Continue assim, você vai longe!",
        "Que evolução fantástica!"
      ],
      adult: [
        "Excelente progresso profissional.",
        "Seu desenvolvimento está consistente.",
        "Objetivos sendo alcançados com sucesso.",
        "Competências desenvolvidas eficazmente."
      ]
    };

    const messages = motivationTemplates[ageGroup] || motivationTemplates.adult;
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

module.exports = AgeAdaptationService;