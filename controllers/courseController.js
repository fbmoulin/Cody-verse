const { db } = require('../server/database');
const { courseModules, lessons } = require('../shared/schema');
const { eq, asc } = require('drizzle-orm');
const { courseModulesData, lessonsData } = require('../server/staticData');

class CourseController {
  // Obter todos os cursos
  async getAllCourses(req, res) {
    try {
      // Tentar usar banco de dados primeiro
      const courses = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.isActive, true))
        .orderBy(asc(courseModules.orderIndex));

      const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
          const courselessons = await db
            .select()
            .from(lessons)
            .where(eq(lessons.moduleId, course.id));

          return {
            ...course,
            lessonCount: courselessons.length
          };
        })
      );

      res.json({
        success: true,
        data: coursesWithLessons,
        count: coursesWithLessons.length,
        source: 'database'
      });
    } catch (error) {
      console.warn('Usando dados estáticos:', error.message);
      // Fallback para dados estáticos
      const coursesWithLessons = courseModulesData.map(course => ({
        ...course,
        lessonCount: lessonsData.filter(l => l.moduleId === course.id).length
      }));

      res.json({
        success: true,
        data: coursesWithLessons,
        count: coursesWithLessons.length,
        source: 'static'
      });
    }
  }

  // Obter curso por ID
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      
      try {
        const course = await db
          .select()
          .from(courseModules)
          .where(eq(courseModules.id, parseInt(id)))
          .limit(1);

        if (course.length === 0) {
          // Try static data
          const staticCourse = courseModulesData.find(c => c.id === parseInt(id));
          if (!staticCourse) {
            return res.status(404).json({
              success: false,
              error: 'Course not found'
            });
          }
          return res.json({
            success: true,
            data: staticCourse,
            source: 'static'
          });
        }

        res.json({
          success: true,
          data: course[0],
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database error, using static data:', dbError.message);
        const staticCourse = courseModulesData.find(c => c.id === parseInt(id));
        if (!staticCourse) {
          return res.status(404).json({
            success: false,
            error: 'Course not found'
          });
        }
        res.json({
          success: true,
          data: staticCourse,
          source: 'static'
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Obter lições de um curso
  async getCourseLessons(req, res) {
    try {
      const { id } = req.params;
      
      try {
        const courseLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.moduleId, parseInt(id)))
          .orderBy(asc(lessons.orderIndex));

        res.json({
          success: true,
          data: courseLessons,
          count: courseLessons.length,
          source: 'database'
        });
      } catch (dbError) {
        console.warn('Database error, using static data:', dbError.message);
        // Fallback to static data
        const staticLessons = lessonsData.filter(l => l.moduleId === parseInt(id));
        res.json({
          success: true,
          data: staticLessons,
          count: staticLessons.length,
          source: 'static'
        });
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
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