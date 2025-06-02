// Fallback data for when database is not available
const courseModulesData = [
  {
    id: 1,
    title: 'IA Básica',
    description: 'Conceitos fundamentais de inteligência artificial, machine learning e redes neurais.',
    difficulty: 'beginner',
    duration: '45 min',
    xp: '41 XP',
    lessons: [
      { id: 1, title: 'O que é Inteligência Artificial?', type: 'theory', duration: '12 min', xp: '5 XP' },
      { id: 2, title: 'Fundamentos de Machine Learning', type: 'interactive', duration: '15 min', xp: '8 XP' },
      { id: 3, title: 'Redes Neurais Explicadas', type: 'interactive', duration: '18 min', xp: '10 XP' },
      { id: 4, title: 'Ética em IA', type: 'theory', duration: '10 min', xp: '8 XP' },
      { id: 5, title: 'Avaliação IA Básica', type: 'quiz', duration: '8 min', xp: '10 XP' }
    ]
  },
  {
    id: 2,
    title: 'Prompt Engineering',
    description: 'Domine a arte de criar prompts eficazes para obter respostas ideais da IA.',
    difficulty: 'beginner',
    duration: '60 min',
    xp: '65 XP',
    lessons: [
      { id: 6, title: 'Introdução ao Prompt Engineering', type: 'interactive', duration: '15 min', xp: '10 XP' },
      { id: 7, title: 'Estrutura e Técnicas', type: 'interactive', duration: '20 min', xp: '12 XP' },
      { id: 8, title: 'Estratégias Avançadas', type: 'interactive', duration: '25 min', xp: '15 XP' },
      { id: 9, title: 'Otimização e Testes', type: 'lab', duration: '30 min', xp: '18 XP' },
      { id: 10, title: 'Avaliação Prompt Engineering', type: 'quiz', duration: '12 min', xp: '10 XP' }
    ]
  },
  {
    id: 3,
    title: 'Assistentes de IA',
    description: 'Compreenda e construa assistentes de IA inteligentes para várias aplicações.',
    difficulty: 'intermediate',
    duration: '75 min',
    xp: '76 XP',
    lessons: [
      { id: 11, title: 'Entendendo Assistentes de IA', type: 'theory', duration: '18 min', xp: '8 XP' },
      { id: 12, title: 'Design de Personalidades', type: 'interactive', duration: '22 min', xp: '10 XP' },
      { id: 13, title: 'Treinamento e Fine-tuning', type: 'lab', duration: '35 min', xp: '15 XP' },
      { id: 14, title: 'Assistentes em Produção', type: 'lab', duration: '40 min', xp: '18 XP' },
      { id: 15, title: 'Projeto Prático', type: 'lab', duration: '45 min', xp: '25 XP' }
    ]
  },
  {
    id: 4,
    title: 'Agentes de IA',
    description: 'Agentes autônomos avançados com tomada de decisão e comportamento orientado a objetivos.',
    difficulty: 'intermediate',
    duration: '90 min',
    xp: '107 XP',
    lessons: [
      { id: 16, title: 'De Assistentes a Agentes', type: 'theory', duration: '20 min', xp: '10 XP' },
      { id: 17, title: 'Comportamento Orientado a Objetivos', type: 'interactive', duration: '25 min', xp: '12 XP' },
      { id: 18, title: 'Sistemas Multi-Agente', type: 'interactive', duration: '30 min', xp: '15 XP' },
      { id: 19, title: 'Frameworks de Desenvolvimento', type: 'lab', duration: '40 min', xp: '18 XP' },
      { id: 20, title: 'Deploy Avançado', type: 'lab', duration: '35 min', xp: '20 XP' },
      { id: 21, title: 'Projeto Final Agentes', type: 'lab', duration: '60 min', xp: '32 XP' }
    ]
  },
  {
    id: 5,
    title: 'Model Context Protocol',
    description: 'Implementação profissional do MCP para integração de sistemas de IA empresariais.',
    difficulty: 'advanced',
    duration: '120 min',
    xp: '135 XP',
    lessons: [
      { id: 22, title: 'Introdução ao MCP', type: 'theory', duration: '25 min', xp: '12 XP' },
      { id: 23, title: 'Desenvolvimento de Servidor MCP', type: 'lab', duration: '45 min', xp: '18 XP' },
      { id: 24, title: 'Integração de Cliente MCP', type: 'lab', duration: '40 min', xp: '18 XP' },
      { id: 25, title: 'Padrões Avançados MCP', type: 'lab', duration: '50 min', xp: '22 XP' },
      { id: 26, title: 'Deploy em Produção MCP', type: 'lab', duration: '55 min', xp: '25 XP' },
      { id: 27, title: 'Certificação Profissional MCP', type: 'quiz', duration: '90 min', xp: '40 XP' }
    ]
  }
];

function getFallbackCourses() {
  return {
    success: true,
    data: courseModulesData,
    count: courseModulesData.length,
    source: 'fallback'
  };
}

function getFallbackCourseById(id) {
  const course = courseModulesData.find(c => c.id === parseInt(id));
  return course ? {
    success: true,
    data: course,
    source: 'fallback'
  } : {
    success: false,
    error: 'Curso não encontrado'
  };
}

function getFallbackLessons(moduleId) {
  const course = courseModulesData.find(c => c.id === parseInt(moduleId));
  return course ? {
    success: true,
    data: course.lessons,
    count: course.lessons.length,
    source: 'fallback'
  } : {
    success: false,
    error: 'Módulo não encontrado'
  };
}

function getFallbackLessonById(id) {
  for (const course of courseModulesData) {
    const lesson = course.lessons.find(l => l.id === parseInt(id));
    if (lesson) {
      return {
        success: true,
        data: lesson,
        source: 'fallback'
      };
    }
  }
  return {
    success: false,
    error: 'Lição não encontrada'
  };
}

module.exports = {
  getFallbackCourses,
  getFallbackCourseById,
  getFallbackLessons,
  getFallbackLessonById
};