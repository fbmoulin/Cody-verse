-- Seed data for Cody Verse Educational Platform
-- Migration 002: Initial course content and achievement data

-- Insert course modules
INSERT INTO course_modules (title, description, difficulty, duration, total_xp, order_index, module_data) VALUES
('IA Básica', 'Conceitos fundamentais de inteligência artificial, machine learning e redes neurais. Comece sua jornada no mundo da IA com conceitos centrais e aplicações práticas.', 'beginner', '45 min', 41, 1, '{"prerequisites": [], "learning_objectives": ["Entender conceitos básicos de IA", "Conhecer tipos de ML", "Compreender redes neurais", "Aplicar princípios éticos"]}'),
('Prompt Engineering', 'Domine a arte de criar prompts eficazes para respostas ideais da IA. Aprenda técnicas avançadas usadas por profissionais.', 'beginner', '60 min', 65, 2, '{"prerequisites": ["IA Básica"], "learning_objectives": ["Estruturar prompts eficazes", "Aplicar técnicas avançadas", "Otimizar interações com IA", "Testar e iterar prompts"]}'),
('Assistentes de IA', 'Compreenda e construa assistentes de IA inteligentes para várias aplicações. Do design ao deployment de sistemas de produção.', 'intermediate', '75 min', 76, 3, '{"prerequisites": ["IA Básica", "Prompt Engineering"], "learning_objectives": ["Projetar assistentes", "Implementar personalidades", "Treinar modelos", "Deployar em produção"]}'),
('Agentes de IA', 'Agentes de IA autônomos avançados com tomada de decisão e comportamento orientado a objetivos. Construa sistemas multi-agente sofisticados.', 'intermediate', '90 min', 107, 4, '{"prerequisites": ["Assistentes de IA"], "learning_objectives": ["Criar agentes autônomos", "Implementar tomada de decisão", "Construir sistemas multi-agente", "Deployar agentes avançados"]}'),
('Model Context Protocol', 'Implementação profissional do MCP para integração de sistemas de IA empresariais. Domine o protocolo que impulsiona aplicações de IA modernas.', 'advanced', '120 min', 135, 5, '{"prerequisites": ["Agentes de IA"], "learning_objectives": ["Implementar MCP", "Integrar sistemas empresariais", "Desenvolver servidores MCP", "Certificação profissional"]}');

-- Insert lessons for IA Básica module
INSERT INTO lessons (module_id, title, lesson_type, content, duration, xp_reward, estimated_duration_minutes, order_index) VALUES
(1, 'O que é Inteligência Artificial?', 'theory', '{
    "type": "theory",
    "sections": [
        {
            "title": "Introdução à IA",
            "content": "A Inteligência Artificial (IA) é a capacidade de máquinas realizarem tarefas que normalmente requerem inteligência humana.",
            "examples": ["Reconhecimento de voz", "Visão computacional", "Processamento de linguagem natural"],
            "key_concepts": ["Algoritmos de aprendizado", "Redes neurais", "Tomada de decisão automatizada"]
        }
    ]
}', '12 min', 5, 12, 1),

(1, 'Fundamentos de Machine Learning', 'interactive', '{
    "type": "interactive",
    "activities": [
        {
            "type": "classification_demo",
            "title": "Tipos de Machine Learning",
            "content": "Explore os três principais tipos de ML através de exemplos práticos"
        }
    ]
}', '15 min', 8, 15, 2),

(1, 'Redes Neurais Explicadas', 'interactive', '{
    "type": "interactive",
    "neural_network_simulator": {
        "layers": ["input", "hidden", "output"],
        "activation_functions": ["relu", "sigmoid", "tanh"]
    }
}', '18 min', 10, 18, 3),

(1, 'Ética em IA e Desenvolvimento Responsável', 'theory', '{
    "type": "theory",
    "ethical_frameworks": [
        {
            "name": "Beneficência",
            "description": "IA deve beneficiar a humanidade"
        }
    ]
}', '10 min', 8, 10, 4),

(1, 'Avaliação IA Básica', 'quiz', '{
    "type": "quiz",
    "questions": [
        {
            "id": 1,
            "question": "O que diferencia a IA do software tradicional?",
            "type": "multiple_choice",
            "options": [
                "A IA é mais rápida que software tradicional",
                "A IA pode aprender e melhorar sem programação explícita",
                "A IA usa mais memória de computador",
                "A IA só funciona conectada à internet"
            ],
            "correct_answer": 1,
            "explanation": "A principal diferença é a capacidade de aprendizado e adaptação automática."
        }
    ],
    "passing_score": 70,
    "time_limit_minutes": 8
}', '8 min', 10, 8, 5);

-- Insert achievements
INSERT INTO achievements (name, description, icon, achievement_type, conditions, xp_reward) VALUES
('AI Explorer', 'Complete o módulo IA Básica', 'trophy-star', 'module_completion', '{"module_id": 1}', 50),
('First Steps', 'Complete sua primeira lição', 'first-lesson', 'special', '{"lessons_completed": 1}', 10),
('Knowledge Seeker', 'Acumule 100 XP', 'xp-milestone', 'xp_milestone', '{"total_xp": 100}', 25);

-- Create a test user for development
INSERT INTO users (email, name, profile_data) VALUES
('test@codyverse.edu', 'Test User', '{"preferences": {"language": "pt-BR", "difficulty": "beginner"}, "goals": ["learn_ai", "build_projects"]}');