const { db } = require('../server/database');
const { courseModules, lessons, codyInteractions } = require('../shared/schema');
const { courseModulesData, lessonsData } = require('../server/staticData');
const { eq, asc } = require('drizzle-orm');

class DataService {
  // Get all courses with proper error handling
  async getAllCourses() {
    const logger = require('../server/logger');
    const cacheService = require('../core/services/cache_service');
    const cacheKey = 'all_courses';
    
    try {
      // Check cache first
      const cachedCourses = cacheService.get(cacheKey);
      if (cachedCourses) {
        logger.info('Courses retrieved from cache');
        return {
          success: true,
          data: cachedCourses,
          source: 'cache'
        };
      }

      // Set a timeout for database operations
      const queryPromise = db
        .select()
        .from(courseModules)
        .where(eq(courseModules.isActive, true))
        .orderBy(asc(courseModules.orderIndex));
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 3000)
      );

      const courses = await Promise.race([queryPromise, timeoutPromise]);

      const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
          try {
            const courseLessons = await this.getLessonsByModuleId(course.id);
            return {
              ...course,
              lessonCount: courseLessons.length
            };
          } catch (lessonError) {
            logger.warn('Failed to get lesson count for course', { courseId: course.id });
            return {
              ...course,
              lessonCount: 0
            };
          }
        })
      );

      // Cache successful results for 15 minutes
      cacheService.set(cacheKey, coursesWithLessons, 15 * 60 * 1000);
      logger.database('Courses retrieved from database and cached');

      return {
        success: true,
        data: coursesWithLessons,
        source: 'database'
      };
    } catch (error) {
      logger.error('Database connection failed for courses', { error: error.message });
      throw new Error('Unable to retrieve courses - database connection issue');
    }
  }

  // Get course by ID with fallback
  async getCourseById(id) {
    try {
      const course = await db
        .select()
        .from(courseModules)
        .where(eq(courseModules.id, parseInt(id)))
        .limit(1);

      if (course.length > 0) {
        return {
          success: true,
          data: course[0],
          source: 'database'
        };
      }
    } catch (error) {
      console.warn('Database error for course:', error.message);
    }

    // Fallback to static data
    const staticCourse = courseModulesData.find(c => c.id === parseInt(id));
    if (staticCourse) {
      return {
        success: true,
        data: staticCourse,
        source: 'static'
      };
    }

    return {
      success: false,
      error: 'Course not found'
    };
  }

  // Get lessons by module ID with fallback
  async getLessonsByModuleId(moduleId) {
    try {
      const courseLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, parseInt(moduleId)))
        .orderBy(asc(lessons.orderIndex));

      return courseLessons;
    } catch (error) {
      console.warn('Using static data for lessons:', error.message);
      return lessonsData.filter(l => l.moduleId === parseInt(moduleId));
    }
  }

  // Get lesson by ID with fallback
  async getLessonById(id) {
    try {
      const lesson = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, parseInt(id)))
        .limit(1);

      if (lesson.length > 0) {
        return {
          success: true,
          data: lesson[0],
          source: 'database'
        };
      }
    } catch (error) {
      console.warn('Database error for lesson:', error.message);
    }

    // Fallback to static data
    const staticLesson = lessonsData.find(l => l.id === parseInt(id));
    if (staticLesson) {
      return {
        success: true,
        data: staticLesson,
        source: 'static'
      };
    }

    return {
      success: false,
      error: 'Lesson not found'
    };
  }

  // Save interaction (with fallback for database errors)
  async saveInteraction(interactionData) {
    try {
      const result = await db.insert(codyInteractions).values(interactionData);
      return { success: true, data: result };
    } catch (error) {
      console.warn('Could not save interaction to database:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DataService();