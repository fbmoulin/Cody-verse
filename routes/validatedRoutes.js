const express = require('express');
const ValidationMiddleware = require('../middleware/validationMiddleware.js');
const SanitizationMiddleware = require('../middleware/sanitizationMiddleware.js');
const SecurityMiddleware = require('../middleware/securityMiddleware.js');
const AuthMiddleware = require('../server/authMiddleware.js');

const router = express.Router();

/**
 * Rotas com Validação e Sanitização Completa
 * Demonstra implementação de todas as camadas de segurança
 */

// Rotas de Cursos com Validação Completa
router.get('/courses',
  SecurityMiddleware.apiRateLimit(),
  ValidationMiddleware.validatePagination(),
  ValidationMiddleware.validateSearch(),
  SanitizationMiddleware.sanitizeQuery(),
  async (req, res) => {
    try {
      // Simulação de busca de cursos com dados validados
      const { page = 1, limit = 10, q = '', category = '', difficulty = '' } = req.query;
      
      res.json({
        success: true,
        data: {
          courses: [
            {
              id: '1',
              title: 'Fundamentos de IA',
              description: 'Aprenda os conceitos básicos de Inteligência Artificial',
              difficulty: 'Iniciante',
              category: 'Tecnologia',
              duration: 240,
              lessons: 7
            }
          ],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 1,
            pages: 1
          },
          filters: { q, category, difficulty }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao buscar cursos'
      });
    }
  }
);

router.post('/courses',
  SecurityMiddleware.createResourceRateLimit(),
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requirePermission('courses.create'),
  ValidationMiddleware.validateCourseCreation(),
  SanitizationMiddleware.sanitizeCourseData(),
  async (req, res) => {
    try {
      // Dados já validados e sanitizados pelo middleware
      const courseData = req.body;
      
      // Simulação de criação de curso
      const newCourse = {
        id: Date.now().toString(),
        ...courseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newCourse,
        message: 'Curso criado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao criar curso'
      });
    }
  }
);

// Rotas de Lições com Validação Completa
router.post('/lessons',
  SecurityMiddleware.createResourceRateLimit(),
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requirePermission('lessons.create'),
  ValidationMiddleware.validateLessonCreation(),
  SanitizationMiddleware.sanitizeLessonData(),
  async (req, res) => {
    try {
      const lessonData = req.body;
      
      const newLesson = {
        id: Date.now().toString(),
        ...lessonData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newLesson,
        message: 'Lição criada com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao criar lição'
      });
    }
  }
);

// Rotas de Progresso com Validação Completa
router.post('/progress',
  SecurityMiddleware.apiRateLimit(),
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requirePermission('progress.update'),
  ValidationMiddleware.validateLessonProgress(),
  SanitizationMiddleware.sanitizeProgressData(),
  async (req, res) => {
    try {
      const progressData = req.body;
      
      // Adicionar ID do usuário do contexto de autenticação
      let userId = null;
      if (req.user && req.user.claims) {
        userId = req.user.claims.sub;
      } else if (req.jwtUser) {
        userId = req.jwtUser.userId;
      } else if (req.apiUser) {
        userId = req.apiUser.id;
      }

      const progress = {
        id: Date.now().toString(),
        userId,
        ...progressData,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: progress,
        message: 'Progresso atualizado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao atualizar progresso'
      });
    }
  }
);

// Rota de Upload de Arquivo com Validação
router.post('/upload',
  SecurityMiddleware.createResourceRateLimit(),
  AuthMiddleware.requireAnyAuth,
  ValidationMiddleware.validateFileUpload({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/pdf']
  }),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo não encontrado',
          message: 'Nenhum arquivo foi enviado'
        });
      }

      // Simulação de upload
      const fileInfo = {
        id: Date.now().toString(),
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${Date.now()}_${req.file.originalname}`,
        uploadedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        data: fileInfo,
        message: 'Arquivo enviado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha no upload do arquivo'
      });
    }
  }
);

// Rota de Busca Avançada com Validação
router.get('/search',
  SecurityMiddleware.apiRateLimit(),
  ValidationMiddleware.validateSearch(),
  ValidationMiddleware.validatePagination(),
  SanitizationMiddleware.sanitizeQuery(),
  async (req, res) => {
    try {
      const { q, category, difficulty, page = 1, limit = 10 } = req.query;
      
      // Simulação de busca avançada
      const results = {
        courses: [
          {
            id: '1',
            title: 'Fundamentos de IA',
            description: 'Curso básico sobre Inteligência Artificial',
            category: 'Tecnologia',
            difficulty: 'Iniciante',
            relevance: 0.95
          }
        ],
        lessons: [
          {
            id: '1',
            title: 'Introdução à IA',
            content: 'Conceitos básicos de inteligência artificial...',
            courseId: '1',
            relevance: 0.88
          }
        ],
        total: 2
      };

      res.json({
        success: true,
        data: results,
        query: { q, category, difficulty },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: results.total
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha na busca'
      });
    }
  }
);

// Rota de Exportação de Dados com Validação
router.get('/export/:format',
  SecurityMiddleware.apiRateLimit(),
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requirePermission('data.export'),
  ValidationMiddleware.validateEnum(
    (req) => req.params.format,
    ['json', 'csv', 'pdf'],
    { fieldName: 'Formato' }
  ),
  async (req, res) => {
    try {
      const { format } = req.params;
      
      // Simulação de exportação
      const data = {
        exported_at: new Date().toISOString(),
        format,
        records: 42,
        url: `/exports/${Date.now()}.${format}`
      };

      res.json({
        success: true,
        data,
        message: `Dados exportados em formato ${format.toUpperCase()}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha na exportação'
      });
    }
  }
);

// Rota de Estatísticas com Validação de Data
router.get('/stats',
  SecurityMiddleware.apiRateLimit(),
  AuthMiddleware.requireAnyAuth,
  AuthMiddleware.requirePermission('analytics.read'),
  [
    ValidationMiddleware.validateDate('startDate', {
      maxDate: new Date(),
      fieldName: 'Data inicial'
    }),
    ValidationMiddleware.validateDate('endDate', {
      maxDate: new Date(),
      fieldName: 'Data final'
    })
  ],
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      // Simulação de estatísticas
      const stats = {
        period: {
          start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString()
        },
        metrics: {
          totalUsers: 1250,
          activeCourses: 45,
          completedLessons: 3420,
          averageProgress: 67.5
        },
        trends: {
          userGrowth: 12.5,
          courseCompletion: 8.3,
          engagement: 15.7
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: 'Falha ao obter estatísticas'
      });
    }
  }
);

// Middleware de tratamento de erros específico para rotas validadas
router.use((error, req, res, next) => {
  console.error('Erro na rota validada:', error);
  
  // Erro de validação
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados inválidos',
      details: error.details || error.message
    });
  }
  
  // Erro de sanitização
  if (error.name === 'SanitizationError') {
    return res.status(400).json({
      success: false,
      error: 'Dados contêm conteúdo suspeito',
      message: 'Os dados enviados contêm caracteres ou padrões não permitidos'
    });
  }
  
  // Erro de segurança
  if (error.name === 'SecurityError') {
    return res.status(403).json({
      success: false,
      error: 'Violação de segurança',
      message: 'A requisição foi bloqueada por motivos de segurança'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado'
  });
});

module.exports = router;