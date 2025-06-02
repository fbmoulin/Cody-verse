# Cody Verse - Guia Técnico de Implementação

## Overview da Arquitetura

O Cody Verse foi desenvolvido como uma aplicação web progressiva (PWA) utilizando Node.js como servidor backend e uma interface frontend rica em JavaScript vanilla para máxima performance e compatibilidade.

## Estrutura de Arquivos

```
cody-verse/
├── index.html                 # Interface principal da aplicação
├── server.js                  # Servidor Node.js Express
├── package.json              # Dependências e scripts
├── package-lock.json         # Lock de versões exatas
├── DOCUMENTATION.md          # Documentação completa
├── TECHNICAL_GUIDE.md        # Este guia técnico
├── AR_IMPLEMENTATION_PLAN.md # Plano de implementação AR
├── README.md                 # Documentação do projeto
├── database_status.html      # Status do banco de dados
├── database_test.html        # Testes de conectividade
├── lib/                      # Código Flutter (legacy)
├── test/                     # Testes automatizados
├── web/                      # Assets web estáticos
├── assets/                   # Recursos do projeto
└── attached_assets/          # Assets anexados
```

## Tecnologias e Dependências

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web minimalista
- **PostgreSQL**: Banco de dados relacional
- **Environment Variables**: Configuração segura

### Frontend
- **HTML5**: Estrutura semântica
- **CSS3**: Styling moderno com Grid e Flexbox
- **JavaScript ES6+**: Funcionalidades modernas
- **WebXR**: API para Realidade Aumentada
- **SVG**: Gráficos vetoriais para animações

### Integrações
- **OpenAI API**: Geração de conteúdo inteligente (preparado)
- **Firebase**: Backend services (preparado)
- **Replit**: Hospedagem e deployment

## Configuração do Ambiente

### Variáveis de Ambiente Necessárias

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGDATABASE=cody_verse
PGUSER=username
PGPASSWORD=password

# APIs (quando necessário)
OPENAI_API_KEY=sk-...
FIREBASE_CONFIG=...

# Aplicação
NODE_ENV=production
PORT=5000
```

### Instalação Local

```bash
# Clone do repositório
git clone <repository-url>
cd cody-verse

# Instalação de dependências
npm install

# Configuração do banco de dados
npm run db:setup

# Execução em desenvolvimento
npm run dev

# Execução em produção
npm start
```

## Arquitetura do Sistema

### Fluxo de Dados

```
User Interface (HTML/CSS/JS)
    ↓
JavaScript Modules
    ├── Course Management System
    ├── Cody AI Personality Engine
    ├── Gamification System
    ├── Internationalization (i18n)
    ├── AI Learning Analytics
    └── AR Experience Engine
    ↓
Node.js Server (server.js)
    ↓
PostgreSQL Database
```

### Módulos JavaScript Principais

#### 1. Sistema de Gerenciamento de Curso
```javascript
// Responsável por:
// - Estrutura de módulos e lições
// - Navegação entre conteúdos
// - Tracking de progresso
// - Carregamento dinâmico de conteúdo

function getCourseModules() {
    return courseData;
}

function renderCourseModules() {
    // Renderização dinâmica dos cards
}

function startLesson(moduleId, lessonIndex) {
    // Inicialização de lições
}
```

#### 2. Cody AI Personality Engine
```javascript
// Responsável por:
// - Personalidade multilíngue do Cody
// - Respostas contextuais
// - Estados emocionais
// - Interações adaptativas

const codyPersonality = {
    'pt-BR': { /* personalidade brasileira */ },
    'en': { /* personalidade internacional */ }
};

function getCodyResponse(category, context) {
    // Geração de respostas contextuais
}
```

#### 3. Sistema de Gamificação
```javascript
// Responsável por:
// - Sistema de XP e níveis
// - Conquistas e badges
// - Streaks de aprendizado
// - Feedback visual

const gamificationSystem = {
    calculateXP: function(action, performance) {
        // Cálculo dinâmico de XP
    },
    
    checkAchievements: function(userStats) {
        // Verificação de conquistas
    }
};
```

#### 4. AI Learning Engine
```javascript
// Responsável por:
// - Análise de padrões de aprendizado
// - Recomendações personalizadas
// - Adaptação de dificuldade
// - Geração de insights

const aiLearningEngine = {
    analyzeLearningPattern: function(userStats) {
        // Algoritmos de análise
    },
    
    generatePersonalizedContent: function(moduleId, lessonIndex) {
        // Personalização de conteúdo
    }
};
```

#### 5. AR Learning System
```javascript
// Responsável por:
// - Detecção de suporte WebXR
// - Modelos 3D interativos
// - Experiências imersivas
// - Controles de AR

const arLearningSystem = {
    checkARSupport: function() {
        // Verificação de compatibilidade
    },
    
    launchAR: function(topic) {
        // Inicialização de experiência AR
    }
};
```

## Schema do Banco de Dados

### Estrutura PostgreSQL

```sql
-- Tabela de usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Perfil do usuário
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    bio TEXT,
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    preferred_session_duration INTEGER DEFAULT 20,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progresso em módulos
CREATE TABLE user_module_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    completed_lessons INTEGER DEFAULT 0,
    total_lessons INTEGER NOT NULL,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progresso em lições
CREATE TABLE user_lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL,
    lesson_index INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'not_started', -- not_started, in_progress, completed
    score INTEGER,
    time_spent_seconds INTEGER,
    attempts INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sistema de conquistas
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    achievement_key VARCHAR(100) UNIQUE NOT NULL,
    name_pt VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_pt TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon VARCHAR(10) NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conquistas do usuário
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    xp_earned INTEGER DEFAULT 0
);

-- Perfil de aprendizagem IA
CREATE TABLE ai_learning_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    learning_pace VARCHAR(20) DEFAULT 'medium', -- slow, medium, fast
    difficulty_preference VARCHAR(20) DEFAULT 'auto', -- easy, medium, hard, auto
    preferred_content_type VARCHAR(20) DEFAULT 'mixed', -- theory, practical, mixed
    strong_areas TEXT[], -- array de tópicos onde o usuário é forte
    weak_areas TEXT[], -- array de tópicos que precisam de reforço
    interests TEXT[], -- interesses do usuário
    learning_style VARCHAR(20) DEFAULT 'visual', -- visual, auditory, kinesthetic, mixed
    optimal_session_duration INTEGER DEFAULT 20,
    best_study_time VARCHAR(20), -- morning, afternoon, evening, night
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessões de aprendizado
CREATE TABLE learning_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL, -- lesson, quiz, ar_experience, review
    module_id INTEGER,
    lesson_index INTEGER,
    duration_seconds INTEGER,
    xp_earned INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2),
    completed BOOLEAN DEFAULT false,
    metadata JSONB, -- dados adicionais da sessão
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Sessões AR
CREATE TABLE ar_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ar_experience_type VARCHAR(50) NOT NULL, -- neural_network, ai_brain, data_flow, etc.
    module_id INTEGER,
    lesson_index INTEGER,
    duration_seconds INTEGER,
    interactions_count INTEGER DEFAULT 0,
    completion_status VARCHAR(20) DEFAULT 'started', -- started, completed, abandoned
    user_feedback INTEGER, -- 1-5 rating
    device_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Analytics de uso
CREATE TABLE user_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurações do usuário
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- Feedback e avaliações
CREATE TABLE user_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) NOT NULL, -- lesson, module, platform, cody, ar_experience
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    module_id INTEGER,
    lesson_index INTEGER,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_user_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX idx_user_progress_module ON user_lesson_progress(module_id, lesson_index);
CREATE INDEX idx_learning_sessions_user_date ON learning_sessions(user_id, started_at);
CREATE INDEX idx_ar_sessions_user_type ON ar_sessions(user_id, ar_experience_type);
CREATE INDEX idx_user_analytics_type_date ON user_analytics(event_type, created_at);
```

## API Endpoints (Preparados)

### Authentication
```javascript
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

### User Management
```javascript
GET /api/user/profile
PUT /api/user/profile
GET /api/user/progress
GET /api/user/achievements
GET /api/user/settings
PUT /api/user/settings
```

### Course Management
```javascript
GET /api/courses/modules
GET /api/courses/module/:id
POST /api/courses/lesson/start
POST /api/courses/lesson/complete
GET /api/courses/lesson/:moduleId/:lessonIndex
```

### AI & Analytics
```javascript
GET /api/ai/recommendations
GET /api/ai/learning-profile
POST /api/ai/update-profile
POST /api/analytics/track-event
GET /api/analytics/user-stats
```

### AR Features
```javascript
POST /api/ar/session/start
PUT /api/ar/session/:id/update
POST /api/ar/session/:id/complete
GET /api/ar/experiences
```

## Performance e Otimização

### Frontend Optimization
- **Lazy Loading**: Conteúdo carregado sob demanda
- **Code Splitting**: Módulos separados por funcionalidade
- **Image Optimization**: SVG para ícones e animações
- **CSS Optimization**: Styles críticos inline
- **JavaScript Minification**: Código comprimido para produção

### Backend Optimization
- **Database Indexing**: Índices otimizados para queries frequentes
- **Connection Pooling**: Pool de conexões PostgreSQL
- **Caching**: Redis para cache de sessões (preparado)
- **Rate Limiting**: Proteção contra abuse de API

### Mobile Optimization
- **Touch Events**: Suporte nativo a gestos mobile
- **Responsive Design**: Layout adaptativo
- **Performance**: < 3s loading time
- **Battery Optimization**: Minimal background processing

## Segurança

### Frontend Security
- **XSS Protection**: Sanitização de inputs
- **CSRF Protection**: Tokens de validação
- **Content Security Policy**: Headers de segurança
- **Input Validation**: Validação client-side e server-side

### Backend Security
- **Password Hashing**: bcrypt para senhas
- **JWT Tokens**: Autenticação stateless
- **SQL Injection Prevention**: Prepared statements
- **Rate Limiting**: Proteção contra brute force
- **HTTPS Only**: Conexões seguras obrigatórias

### Data Privacy
- **GDPR Compliance**: Direito ao esquecimento
- **Data Minimization**: Coleta mínima necessária
- **Encryption**: Dados sensíveis criptografados
- **Audit Logs**: Rastreamento de acessos

## Deployment e CI/CD

### Replit Deployment
```yaml
# .replit
run = "node server.js"
modules = ["nodejs-18"]

[deployment]
build = ["npm", "install"]
run = ["node", "server.js"]

[[ports]]
localPort = 5000
externalPort = 80
```

### Environment Configuration
```javascript
// server.js
const config = {
    port: process.env.PORT || 5000,
    database: {
        url: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production'
    },
    openai: {
        apiKey: process.env.OPENAI_API_KEY
    }
};
```

### Health Checks
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version
    });
});
```

## Monitoramento e Analytics

### Application Metrics
- **Response Time**: Tempo de resposta das APIs
- **Error Rate**: Taxa de erros da aplicação
- **User Sessions**: Sessões ativas simultâneas
- **Database Performance**: Query performance e connections

### Business Metrics
- **User Engagement**: Tempo gasto na plataforma
- **Learning Progress**: Módulos completados
- **Feature Usage**: Utilização de funcionalidades
- **AR Adoption**: Uso das experiências AR

### Logging Strategy
```javascript
// Structured logging
const log = {
    info: (message, data) => console.log(JSON.stringify({
        level: 'info',
        message,
        data,
        timestamp: new Date().toISOString()
    })),
    error: (message, error) => console.error(JSON.stringify({
        level: 'error',
        message,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    }))
};
```

## Testes

### Testing Strategy
```javascript
// Unit Tests (Jest)
npm run test:unit

// Integration Tests
npm run test:integration

// E2E Tests (Playwright)
npm run test:e2e

// Performance Tests
npm run test:performance
```

### Test Coverage
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Main user journeys
- **AR Tests**: WebXR compatibility

## Troubleshooting

### Common Issues

#### Database Connection
```javascript
// Verificar conectividade
npm run db:status

// Reset database
npm run db:reset

// Migrations
npm run db:migrate
```

#### AR Not Working
- Verificar suporte WebXR no browser
- Confirmar permissões de câmera
- Testar em dispositivo compatível
- Fallback para modo 3D

#### Performance Issues
- Verificar bundle size
- Analisar memory leaks
- Otimizar database queries
- Enable compression

## Próximos Passos Técnicos

### Immediate (Sprint atual)
- [ ] Implementar autenticação JWT
- [ ] Configurar Redis para cache
- [ ] Adicionar testes automatizados
- [ ] Otimizar queries do banco

### Short-term (Próximo mês)
- [ ] API REST completa
- [ ] Sistema de notificações
- [ ] Backup automatizado
- [ ] Monitoring dashboard

### Long-term (Próximos 3 meses)
- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Real-time features (WebSockets)
- [ ] AI/ML pipeline

---

*Guia técnico atualizado em: Junho 2025*
*Versão da aplicação: Beta 7.0*