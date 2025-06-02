const { db } = require('../server/database');
const { courseModules, lessons } = require('../shared/schema');
const { eq, asc } = require('drizzle-orm');

class CourseController {
  // Obter todos os cursos
  async getAllCourses(req, res) {
    try {
      const courses = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.isActive, true))
        .orderBy(asc(courseModules.orderIndex));

      // Adicionar contagem de lições para cada curso
      const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
          const lessonCount = await db
            .select({ count: lessons.id })
            .from(lessons)
            .where(eq(lessons.moduleId, course.id));

          return {
            ...course,
            lessonCount: lessonCount.length
          };
        })
      );

      res.json({
        success: true,
        data: coursesWithLessons,
        count: coursesWithLessons.length
      });
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar cursos'
      });
    }
  }

  // Obter curso por ID
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      
      const course = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.id, parseInt(id)))
        .limit(1);

      if (course.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Curso não encontrado'
        });
      }

      res.json({
        success: true,
        data: course[0]
      });
    } catch (error) {
      console.error('Erro ao buscar curso:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar curso'
      });
    }
  }

  // Obter lições de um curso
  async getCourseLessons(req, res) {
    try {
      const { id } = req.params;
      
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, parseInt(id)))
        .orderBy(asc(lessons.orderIndex));

      res.json({
        success: true,
        data: courseLessons,
        count: courseLessons.length
      });
    } catch (error) {
      console.error('Erro ao buscar lições:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar lições'
      });
    }
  }

  // Obter lição por ID
  async getLessonById(req, res) {
    try {
      const { id } = req.params;
      
      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, parseInt(id)))
        .limit(1);

      if (lesson.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Lição não encontrada'
        });
      }

      res.json({
        success: true,
        data: lesson[0]
      });
    } catch (error) {
      console.error('Erro ao buscar lição:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao buscar lição'
      });
    }
  }
}

module.exports = new CourseController();