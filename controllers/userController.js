const { db } = require('../server/database');
const { users, userModuleProgress, userLessonProgress } = require('../shared/schema');
const { eq, sql } = require('drizzle-orm');
const validationService = require('../services/validationService');
const logger = require('../server/logger');
const BaseController = require('../core/BaseController');

class UserController extends BaseController {
  // Criar novo usuário
  async createUser(req, res) {
    await this.handleRequest(req, res, async (req) => {
      // Validation is handled by middleware, but double-check critical fields
      const validation = validationService.validateRequest(
        req.body,
        ['username', 'email', 'age'],
        []
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { username, email, age } = validation.sanitizedData;

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return this.createErrorResponse('Usuário com este email já existe', 409);
      }

      // Criar novo usuário com dados sanitizados
      const newUser = await db
        .insert(users)
        .values({
          email: email.toLowerCase().trim(),
          name: username.trim(),
          createdAt: new Date(),
          totalXP: 0,
          currentStreak: 0,
          isActive: true
        })
        .returning();

      logger.info('User created successfully', {
        userId: newUser[0].id,
        email: email,
        ip: req.ip
      });

      return this.createResponse(newUser[0], 'Usuário criado com sucesso', 201);
    });
  }

  // Obter usuário por ID
  async getUserById(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { id } = req.params;

      // Validate ID (middleware already does this, but extra safety)
      const idValidation = validationService.validateField('userId', id);
      if (!idValidation.isValid) {
        throw new Error('ID de usuário inválido');
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, idValidation.sanitizedValue))
        .limit(1);

      if (user.length === 0) {
        return this.createErrorResponse('Usuário não encontrado', 404);
      }

      return this.createResponse(user[0], 'Usuário encontrado com sucesso');
    });
  }

  // Atualizar usuário
  async updateUser(req, res) {
    await this.handleRequest(req, res, async (req) => {
      const { id } = req.params;
      
      // Validate and sanitize update data
      const validation = validationService.validateRequest(
        req.body,
        [], // No required fields for updates
        ['username', 'xp', 'currentStreak']
      );

      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const idValidation = validationService.validateField('userId', id);
      if (!idValidation.isValid) {
        throw new Error('ID de usuário inválido');
      }

      const { username, xp, currentStreak } = validation.sanitizedData;

      const updateData = {};
      if (username) updateData.name = username.trim();
      if (xp !== undefined) updateData.totalXP = Math.max(0, xp);
      if (currentStreak !== undefined) updateData.currentStreak = Math.max(0, currentStreak);
      updateData.lastLoginAt = new Date();

      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, idValidation.sanitizedValue))
        .returning();

      if (updatedUser.length === 0) {
        return this.createErrorResponse('Usuário não encontrado', 404);
      }

      logger.info('User updated successfully', {
        userId: idValidation.sanitizedValue,
        updates: Object.keys(updateData),
        ip: req.ip
      });

      return this.createResponse(updatedUser[0], 'Usuário atualizado com sucesso');
    });
  }

  // Obter estatísticas do usuário
  async getUserStats(req, res) {
    try {
      const { id } = req.params;

      // Buscar dados do usuário
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      // Estatísticas de módulos
      const moduleStats = await db
        .select({
          total: sql`COUNT(*)`,
          completed: sql`COUNT(*) FILTER (WHERE is_completed = true)`
        })
        .from(userModuleProgress)
        .where(eq(userModuleProgress.userId, parseInt(id)));

      // Estatísticas de lições
      const lessonStats = await db
        .select({
          total: sql`COUNT(*)`,
          completed: sql`COUNT(*) FILTER (WHERE is_completed = true)`,
          totalTimeSpent: sql`SUM(time_spent_minutes)`
        })
        .from(userLessonProgress)
        .where(eq(userLessonProgress.userId, parseInt(id)));

      const stats = {
        user: user[0],
        modules: {
          total: parseInt(moduleStats[0]?.total || 0),
          completed: parseInt(moduleStats[0]?.completed || 0),
          completionRate: moduleStats[0]?.total ? 
            (moduleStats[0].completed / moduleStats[0].total * 100).toFixed(1) : 0
        },
        lessons: {
          total: parseInt(lessonStats[0]?.total || 0),
          completed: parseInt(lessonStats[0]?.completed || 0),
          totalTimeSpent: parseInt(lessonStats[0]?.totalTimeSpent || 0),
          completionRate: lessonStats[0]?.total ? 
            (lessonStats[0].completed / lessonStats[0].total * 100).toFixed(1) : 0
        }
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar estatísticas'
      });
    }
  }
}

module.exports = new UserController();