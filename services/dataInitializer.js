const { db } = require('../server/database');
const { courseModules, lessons } = require('../shared/schema');

class DataInitializer {
  async initializeDatabase() {
    try {
      console.log('Inicializando dados do curso...');
      
      await this.createCourseModules();
      await this.createLessons();
      
      console.log('Dados inicializados com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar dados:', error);
      throw error;
    }
  }

  async createCourseModules() {
    const modules = [
      {
        title: 'IA Básica',
        description: 'Conceitos fundamentais de inteligência artificial, machine learning e redes neurais.',
        difficulty: 'beginner',
        duration: '45 min',
        totalXP: 41,
        orderIndex: 1
      },
      {
        title: 'Prompt Engineering',
        description: 'Domine a arte de criar prompts eficazes para obter respostas ideais da IA.',
        difficulty: 'beginner',
        duration: '60 min',
        totalXP: 65,
        orderIndex: 2
      },
      {
        title: 'Assistentes de IA',
        description: 'Compreenda e construa assistentes de IA inteligentes para várias aplicações.',
        difficulty: 'intermediate',
        duration: '75 min',
        totalXP: 76,
        orderIndex: 3
      },
      {
        title: 'Agentes de IA',
        description: 'Agentes autônomos avançados com tomada de decisão e comportamento orientado a objetivos.',
        difficulty: 'intermediate',
        duration: '90 min',
        totalXP: 107,
        orderIndex: 4
      },
      {
        title: 'Model Context Protocol',
        description: 'Implementação profissional do MCP para integração de sistemas de IA empresariais.',
        difficulty: 'advanced',
        duration: '120 min',
        totalXP: 135,
        orderIndex: 5
      }
    ];

    // Verificar se módulos já existem
    const existingModules = await db.select().from(courseModules);
    
    if (existingModules.length === 0) {
      await db.insert(courseModules).values(modules);
      console.log('Módulos do curso criados');
    }
  }

  async createLessons() {
    const lessons = [
      // Módulo 1: IA Básica
      {
        moduleId: 1,
        title: 'O que é Inteligência Artificial?',
        type: 'theory',
        duration: '12 min',
        xpValue: 5,
        orderIndex: 1,
        content: {
          type: 'theory',
          sections: [
            {
              title: 'Introdução à IA',
              content: 'A Inteligência Artificial representa uma das maiores revoluções tecnológicas...'
            }
          ]
        }
      },
      {
        moduleId: 1,
        title: 'Fundamentos de Machine Learning',
        type: 'interactive',
        duration: '15 min',
        xpValue: 8,
        orderIndex: 2,
        content: {
          type: 'interactive',
          activities: [
            {
              type: 'comparison',
              title: 'Tipos de Machine Learning'
            }
          ]
        }
      },
      {
        moduleId: 1,
        title: 'Redes Neurais Explicadas',
        type: 'interactive',
        duration: '18 min',
        xpValue: 10,
        orderIndex: 3
      },
      {
        moduleId: 1,
        title: 'Ética em IA e Desenvolvimento Responsável',
        type: 'theory',
        duration: '10 min',
        xpValue: 8,
        orderIndex: 4
      },
      {
        moduleId: 1,
        title: 'Avaliação IA Básica',
        type: 'quiz',
        duration: '8 min',
        xpValue: 10,
        orderIndex: 5,
        content: {
          type: 'quiz',
          questions: [
            {
              question: 'O que diferencia a IA do software tradicional?',
              options: [
                'A IA é mais rápida que software normal',
                'A IA pode aprender e melhorar sem programação explícita',
                'A IA usa mais memória',
                'A IA só funciona na internet'
              ],
              correct: 1
            }
          ]
        }
      },

      // Módulo 2: Prompt Engineering
      {
        moduleId: 2,
        title: 'Introdução ao Prompt Engineering',
        type: 'interactive',
        duration: '15 min',
        xpValue: 10,
        orderIndex: 1
      },
      {
        moduleId: 2,
        title: 'Estrutura e Técnicas de Prompt',
        type: 'interactive',
        duration: '20 min',
        xpValue: 12,
        orderIndex: 2
      },
      {
        moduleId: 2,
        title: 'Estratégias Avançadas de Prompting',
        type: 'interactive',
        duration: '25 min',
        xpValue: 15,
        orderIndex: 3
      },
      {
        moduleId: 2,
        title: 'Otimização e Testes de Prompt',
        type: 'lab',
        duration: '30 min',
        xpValue: 18,
        orderIndex: 4
      },
      {
        moduleId: 2,
        title: 'Avaliação Prompt Engineering',
        type: 'quiz',
        duration: '12 min',
        xpValue: 10,
        orderIndex: 5
      }
    ];

    // Verificar se lições já existem
    const existingLessons = await db.select().from(lessons);
    
    if (existingLessons.length === 0) {
      await db.insert(lessons).values(lessons);
      console.log('Lições criadas');
    }
  }
}

module.exports = new DataInitializer();