// Dados estáticos para garantir funcionamento sem banco
const courseModulesData = [
  {
    id: 1,
    title: 'IA Básica',
    description: 'Conceitos fundamentais de inteligência artificial, machine learning e redes neurais.',
    difficulty: 'beginner',
    duration: '45 min',
    totalXP: 41,
    orderIndex: 1,
    isActive: true
  },
  {
    id: 2,
    title: 'Prompt Engineering', 
    description: 'Domine a arte de criar prompts eficazes para obter respostas ideais da IA.',
    difficulty: 'beginner',
    duration: '60 min',
    totalXP: 65,
    orderIndex: 2,
    isActive: true
  },
  {
    id: 3,
    title: 'Assistentes de IA',
    description: 'Compreenda e construa assistentes de IA inteligentes para várias aplicações.',
    difficulty: 'intermediate',
    duration: '75 min',
    totalXP: 76,
    orderIndex: 3,
    isActive: true
  },
  {
    id: 4,
    title: 'Agentes de IA',
    description: 'Agentes autônomos avançados com tomada de decisão e comportamento orientado a objetivos.',
    difficulty: 'intermediate',
    duration: '90 min',
    totalXP: 107,
    orderIndex: 4,
    isActive: true
  },
  {
    id: 5,
    title: 'Model Context Protocol',
    description: 'Implementação profissional do MCP para integração de sistemas de IA empresariais.',
    difficulty: 'advanced',
    duration: '120 min',
    totalXP: 135,
    orderIndex: 5,
    isActive: true
  }
];

const lessonsData = [
  { id: 1, moduleId: 1, title: 'O que é Inteligência Artificial?', type: 'theory', duration: '12 min', xpValue: 5, orderIndex: 1 },
  { id: 2, moduleId: 1, title: 'Fundamentos de Machine Learning', type: 'interactive', duration: '15 min', xpValue: 8, orderIndex: 2 },
  { id: 3, moduleId: 1, title: 'Redes Neurais Explicadas', type: 'interactive', duration: '18 min', xpValue: 10, orderIndex: 3 },
  { id: 4, moduleId: 1, title: 'Ética em IA', type: 'theory', duration: '10 min', xpValue: 8, orderIndex: 4 },
  { id: 5, moduleId: 1, title: 'Avaliação IA Básica', type: 'quiz', duration: '8 min', xpValue: 10, orderIndex: 5 },
  { id: 6, moduleId: 2, title: 'Introdução ao Prompt Engineering', type: 'interactive', duration: '15 min', xpValue: 10, orderIndex: 1 },
  { id: 7, moduleId: 2, title: 'Estrutura e Técnicas', type: 'interactive', duration: '20 min', xpValue: 12, orderIndex: 2 },
  { id: 8, moduleId: 2, title: 'Estratégias Avançadas', type: 'interactive', duration: '25 min', xpValue: 15, orderIndex: 3 },
  { id: 9, moduleId: 2, title: 'Otimização e Testes', type: 'lab', duration: '30 min', xpValue: 18, orderIndex: 4 },
  { id: 10, moduleId: 2, title: 'Avaliação Prompt Engineering', type: 'quiz', duration: '12 min', xpValue: 10, orderIndex: 5 }
];

module.exports = {
  courseModulesData,
  lessonsData
};