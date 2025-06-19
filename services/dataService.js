const { db } = require('../server/database');
const { courseModules, lessons, codyInteractions } = require('../shared/schema');
const { courseModulesData, lessonsData } = require('../server/staticData');
const { eq, asc } = require('drizzle-orm');
const errorHandler = require('./errorHandlerService');
const newCacheService = require('./cacheService');

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

      if (!courses.length) {
        logger.warn('No courses found in database');
        return {
          success: true,
          data: [],
          source: 'database'
        };
      }

      const coursesWithLessons = await Promise.all(
        courses.map(async (course) => {
          const courseLessons = await this.getLessonsByModuleId(course.id);
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            difficulty: course.difficulty,
            duration: course.duration,
            totalXP: course.totalXP,
            orderIndex: course.orderIndex,
            lessonCount: courseLessons.length,
            lessons: courseLessons
          };
        })
      );

      // Cache successful results for 15 minutes
      cacheService.set(cacheKey, coursesWithLessons, 15 * 60 * 1000);
      logger.info('Courses retrieved from database and cached', { count: coursesWithLessons.length });

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

  // Get lessons by module ID with timeout and caching
  async getLessonsByModuleId(moduleId) {
    const logger = require('../server/logger');
    const cacheService = require('../core/services/cache_service');
    const cacheKey = `lessons_module_${moduleId}`;
    
    try {
      // Check cache first
      const cachedLessons = cacheService.get(cacheKey);
      if (cachedLessons) {
        logger.info('Lessons retrieved from cache', { moduleId });
        return cachedLessons;
      }

      // Query database with timeout
      const queryPromise = db
        .select()
        .from(lessons)
        .where(eq(lessons.moduleId, parseInt(moduleId)))
        .orderBy(asc(lessons.orderIndex));
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 2000)
      );

      const courseLessons = await Promise.race([queryPromise, timeoutPromise]);

      // Transform lessons to match expected format
      const formattedLessons = courseLessons.map(lesson => ({
        id: lesson.id,
        moduleId: lesson.moduleId,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content || {},
        duration: lesson.duration,
        xpReward: lesson.xpReward,
        orderIndex: lesson.orderIndex,
        isActive: lesson.isActive
      }));

      // Cache results for 20 minutes (even if empty)
      cacheService.set(cacheKey, formattedLessons, 20 * 60 * 1000);
      logger.info('Lessons retrieved from database and cached', { moduleId, count: formattedLessons.length });

      return formattedLessons;
    } catch (error) {
      logger.warn('Failed to load lessons for module', moduleId, error.message);
      // Return empty array instead of throwing error
      // This prevents breaking the entire course loading process
      const emptyResult = [];
      cacheService.set(cacheKey, emptyResult, 5 * 60 * 1000); // Cache for 5 minutes
      return emptyResult;
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