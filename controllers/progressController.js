const { db } = require('../server/database');
const { 
  userModuleProgress, 
  userLessonProgress, 
  userAchievements, 
  achievements,
  users 
} = require('../shared/schema');
const { eq, and } = require('drizzle-orm');

class ProgressController {
  // Obter progresso geral do usuário
  async getUserProgress(req, res) {
    try {
      const { userId } = req.params;
      
      // Progresso de módulos
      const moduleProgress = await db
        .select()
        .from(userModuleProgress)
        .where(eq(userModuleProgress.userId, parseInt(userId)));

      // Progresso de lições
      const lessonProgress = await db
        .select()
        .from(userLessonProgress)
        .where(eq(userLessonProgress.userId, parseInt(userId)));

      // Estatísticas do usuário
      const userStats = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(userId)))
        .limit(1);

      res.json({
        success: true,
        data: {
          modules: moduleProgress,
          lessons: lessonProgress,
          stats: userStats[0] || null
        }
      });
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar progresso'
      });
    }
  }

  // Atualizar progresso de lição
  async updateLessonProgress(req, res) {
    try {
      const { userId, lessonId, isCompleted, timeSpent, score } = req.body;

      // Verificar se já existe progresso para esta lição
      const existingProgress = await db
        .select()
        .from(userLessonProgress)
        .where(
          and(
            eq(userLessonProgress.userId, userId),
            eq(userLessonProgress.lessonId, lessonId)
          )
        )
        .limit(1);

      let result;
      
      if (existingProgress.length > 0) {
        // Atualizar progresso existente
        result = await db
          .update(userLessonProgress)
          .set({
            isCompleted: isCompleted || existingProgress[0].isCompleted,
            completedAt: isCompleted ? new Date() : existingProgress[0].completedAt,
            timeSpent: (existingProgress[0].timeSpent || 0) + (timeSpent || 0),
            attempts: existingProgress[0].attempts + 1,
            bestScore: Math.max(existingProgress[0].bestScore || 0, score || 0),
            lastAccessedAt: new Date()
          })
          .where(
            and(
              eq(userLessonProgress.userId, userId),
              eq(userLessonProgress.lessonId, lessonId)
            )
          )
          .returning();
      } else {
        // Criar novo progresso
        result = await db
          .insert(userLessonProgress)
          .values({
            userId,
            lessonId,
            isCompleted: isCompleted || false,
            completedAt: isCompleted ? new Date() : null,
            timeSpent: timeSpent || 0,
            attempts: 1,
            bestScore: score || 0,
            lastAccessedAt: new Date()
          })
          .returning();
      }

      res.json({
        success: true,
        data: result[0],
        message: 'Progresso da lição atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar progresso da lição:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao atualizar progresso'
      });
    }
  }

  // Atualizar progresso de módulo
  async updateModuleProgress(req, res) {
    try {
      const { userId, moduleId, isCompleted, xpEarned } = req.body;

      // Verificar se já existe progresso para este módulo
      const existingProgress = await db
        .select()
        .from(userModuleProgress)
        .where(
          and(
            eq(userModuleProgress.userId, userId),
            eq(userModuleProgress.moduleId, moduleId)
          )
        )
        .limit(1);

      let result;
      
      if (existingProgress.length > 0) {
        // Atualizar progresso existente
        result = await db
          .update(userModuleProgress)
          .set({
            isCompleted: isCompleted || existingProgress[0].isCompleted,
            completedAt: isCompleted ? new Date() : existingProgress[0].completedAt,
            xpEarned: Math.max(existingProgress[0].xpEarned || 0, xpEarned || 0)
          })
          .where(
            and(
              eq(userModuleProgress.userId, userId),
              eq(userModuleProgress.moduleId, moduleId)
            )
          )
          .returning();
      } else {
        // Criar novo progresso
        result = await db
          .insert(userModuleProgress)
          .values({
            userId,
            moduleId,
            isCompleted: isCompleted || false,
            completedAt: isCompleted ? new Date() : null,
            xpEarned: xpEarned || 0,
            startedAt: new Date()
          })
          .returning();
      }

      // Se módulo foi completado, atualizar XP total do usuário
      if (isCompleted && xpEarned) {
        await db
          .update(users)
          .set({
            totalXP: users.totalXP + xpEarned
          })
          .where(eq(users.id, userId));
      }

      res.json({
        success: true,
        data: result[0],
        message: 'Progresso do módulo atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar progresso do módulo:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao atualizar progresso'
      });
    }
  }

  // Obter conquistas do usuário
  async getUserAchievements(req, res) {
    try {
      const { userId } = req.params;
      
      const userAchievementsList = await db
        .select({
          id: achievements.id,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          xpReward: achievements.xpReward,
          unlockedAt: userAchievements.unlockedAt
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, parseInt(userId)));

      res.json({
        success: true,
        data: userAchievementsList,
        count: userAchievementsList.length
      });
    } catch (error) {
      console.error('Erro ao buscar conquistas:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar conquistas'
      });
    }
  }
}

module.exports = new ProgressController();