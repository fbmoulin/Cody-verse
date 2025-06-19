const { db } = require('../server/database');
const { users, userModuleProgress, userLessonProgress } = require('../shared/schema');
const { eq, sql } = require('drizzle-orm');
const validationService = require('../services/validationService');
const logger = require('../server/logger');
const BaseController = require('../core/BaseController');

class UserController extends BaseController {
  // Criar novo usuário
  async createUser(req, res) {
    try {
      const { email, name } = req.body;

      if (!email || !name) {
        return res.status(400).json({
          success: false,
          error: 'Email e nome são obrigatórios'
        });
      }

      // Verificar se usuário já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Usuário com este email já existe'
        });
      }

      // Criar novo usuário
      const newUser = await db
        .insert(users)
        .values({
          email,
          name,
          createdAt: new Date(),
          totalXP: 0,
          currentStreak: 0,
          isActive: true
        })
        .returning();

      res.status(201).json({
        success: true,
        data: newUser[0],
        message: 'Usuário criado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao criar usuário'
      });
    }
  }

  // Obter usuário por ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;

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

      res.json({
        success: true,
        data: user[0]
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar usuário'
      });
    }
  }

  // Atualizar usuário
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name, totalXP, currentStreak } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (totalXP !== undefined) updateData.totalXP = totalXP;
      if (currentStreak !== undefined) updateData.currentStreak = currentStreak;
      updateData.lastLoginAt = new Date();

      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (updatedUser.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: updatedUser[0],
        message: 'Usuário atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao atualizar usuário'
      });
    }
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