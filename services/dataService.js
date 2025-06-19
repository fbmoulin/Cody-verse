const { db } = require('../server/database');
const { courseModules, lessons, codyInteractions } = require('../shared/schema');
const { courseModulesData, lessonsData } = require('../server/staticData');
const { eq, asc, sql, inArray } = require('drizzle-orm');
const errorHandler = require('./errorHandlerService');
const newCacheService = require('./cacheService');
const performanceAnalyzer = require('./performanceAnalyzer');
const queryOptimizer = require('./queryOptimizer');

class DataService {
  // Get all courses with proper error handling and pagination
  async getAllCourses(options = {}) {
    const startTime = Date.now();
    const logger = require('../server/logger');
    const cacheService = require('../core/services/cache_service');
    const { page = 1, limit = 50, includeLessons = true } = options;
    const offset = (page - 1) * limit;
    const cacheKey = `courses_p${page}_l${limit}_i${includeLessons}`;
    
    try {
      // Check cache first
      const cachedResult = cacheService.get(cacheKey);
      if (cachedResult) {
        logger.info('Courses retrieved from cache', { page, limit });
        return cachedResult;
      }

      // Get total count for pagination
      const countPromise = db
        .select({ count: sql`count(*)` })
        .from(courseModules)
        .where(eq(courseModules.isActive, true));

      // Get paginated courses
      const coursesPromise = db
        .select()
        .from(courseModules)
        .where(eq(courseModules.isActive, true))
        .orderBy(asc(courseModules.orderIndex))
        .limit(limit)
        .offset(offset);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 3000)
      );

      const [countResult, courses] = await Promise.race([
        Promise.all([countPromise, coursesPromise]), 
        timeoutPromise
      ]);

      const totalCount = parseInt(countResult[0].count);

      if (!courses.length) {
        const emptyResult = {
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
            hasNext: false,
            hasPrev: false
          },
          source: 'database'
        };
        cacheService.set(cacheKey, emptyResult, 10 * 60 * 1000); // Cache for 10 minutes
        return emptyResult;
      }

      let coursesWithLessons = courses;
      
      if (includeLessons) {
        // Batch load lessons for all courses to optimize performance
        const lessonCounts = await this.getBatchLessonCounts(courses.map(c => c.id));
        
        coursesWithLessons = courses.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          duration: course.duration,
          totalXP: course.totalXP,
          orderIndex: course.orderIndex,
          lessonCount: lessonCounts[course.id] || 0
        }));
      } else {
        coursesWithLessons = courses.map((course) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          duration: course.duration,
          totalXP: course.totalXP,
          orderIndex: course.orderIndex
        }));
      }

      const result = {
        success: true,
        data: coursesWithLessons,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        source: 'database'
      };

      // Cache successful results for 15 minutes
      cacheService.set(cacheKey, result, 15 * 60 * 1000);
      logger.info('Courses retrieved from database and cached', { 
        count: coursesWithLessons.length, 
        page, 
        total: totalCount 
      });

      return result;
    } catch (error) {
      logger.error('Database connection failed for courses', { error: error.message });
      performanceAnalyzer.trackQuery('getAllCourses', Date.now() - startTime, false);
      throw new Error('Unable to retrieve courses - database connection issue');
    } finally {
      performanceAnalyzer.trackQuery('getAllCourses', Date.now() - startTime, true);
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

  // Batch get lesson counts for multiple modules (performance optimization)
  async getBatchLessonCounts(moduleIds) {
    if (!moduleIds || moduleIds.length === 0) return {};
    
    try {
      const results = await db
        .select({
          moduleId: lessons.moduleId,
          count: sql`count(*)`
        })
        .from(lessons)
        .where(inArray(lessons.moduleId, moduleIds))
        .groupBy(lessons.moduleId);

      const counts = {};
      results.forEach(result => {
        counts[result.moduleId] = parseInt(result.count);
      });

      return counts;
    } catch (error) {
      console.warn('Failed to get batch lesson counts:', error.message);
      return {};
    }
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