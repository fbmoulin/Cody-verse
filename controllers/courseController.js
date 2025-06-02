const dataService = require('../services/dataService');

class CourseController {
  // Obter todos os cursos
  async getAllCourses(req, res) {
    try {
      const result = await dataService.getAllCourses();
      res.json({
        ...result,
        count: result.data.length
      });
    } catch (error) {
      console.error('Error in getAllCourses:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Obter curso por ID
  async getCourseById(req, res) {
    try {
      const { id } = req.params;
      const result = await dataService.getCourseById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error in getCourseById:', error);
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
      const lessons = await dataService.getLessonsByModuleId(id);
      
      res.json({
        success: true,
        data: lessons,
        count: lessons.length,
        source: lessons.length > 0 && lessons[0].createdAt ? 'database' : 'static'
      });
    } catch (error) {
      console.error('Error in getCourseLessons:', error);
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
      const result = await dataService.getLessonById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error in getLessonById:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new CourseController();