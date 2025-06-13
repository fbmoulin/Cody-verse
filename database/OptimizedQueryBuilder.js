class OptimizedQueryBuilder {
  constructor(pool) {
    this.pool = pool;
    this.queryCache = new Map();
    this.preparedStatements = new Map();
  }

  // Optimized course queries with proper indexing
  buildCourseQueries() {
    return {
      getAllCourses: `
        SELECT 
          c.id, c.title, c.description, c.difficulty, c.category,
          c.estimated_duration, c.thumbnail_url,
          COUNT(l.id) as total_lessons,
          COALESCE(AVG(cr.rating), 0) as average_rating,
          COUNT(DISTINCT e.user_id) as enrolled_users
        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.is_active = true
        GROUP BY c.id, c.title, c.description, c.difficulty, c.category, c.estimated_duration, c.thumbnail_url
        ORDER BY c.created_at DESC
      `,

      getCourseById: `
        SELECT 
          c.*,
          COUNT(l.id) as total_lessons,
          COALESCE(AVG(cr.rating), 0) as average_rating,
          COUNT(DISTINCT e.user_id) as enrolled_users
        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        LEFT JOIN course_ratings cr ON c.id = cr.course_id
        LEFT JOIN enrollments e ON c.id = e.course_id
        WHERE c.id = $1 AND c.is_active = true
        GROUP BY c.id
      `,

      getCourseLessons: `
        SELECT 
          l.*,
          CASE WHEN up.lesson_id IS NOT NULL THEN true ELSE false END as is_completed,
          up.progress_percentage,
          up.completed_at
        FROM lessons l
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
        WHERE l.course_id = $1 AND l.is_active = true
        ORDER BY l.order_index ASC
      `
    };
  }

  // Optimized user progress queries
  buildProgressQueries() {
    return {
      getUserStats: `
        SELECT 
          u.id, u.name, u.email, u.total_xp, u.level, u.current_streak,
          COUNT(DISTINCT up.lesson_id) as completed_lessons,
          COUNT(DISTINCT ub.badge_id) as earned_badges,
          u.coins
        FROM users u
        LEFT JOIN user_progress up ON u.id = up.user_id AND up.progress_percentage = 100
        LEFT JOIN user_badges ub ON u.id = ub.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.name, u.email, u.total_xp, u.level, u.current_streak, u.coins
      `,

      updateLessonProgress: `
        INSERT INTO user_progress (user_id, lesson_id, progress_percentage, updated_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, lesson_id)
        DO UPDATE SET 
          progress_percentage = $3,
          updated_at = NOW(),
          completed_at = CASE WHEN $3 = 100 THEN NOW() ELSE user_progress.completed_at END
        RETURNING *
      `,

      getUserProgress: `
        SELECT 
          up.*,
          l.title as lesson_title,
          c.title as course_title
        FROM user_progress up
        JOIN lessons l ON up.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE up.user_id = $1
        ORDER BY up.updated_at DESC
        LIMIT $2 OFFSET $3
      `
    };
  }

  // Optimized gamification queries
  buildGamificationQueries() {
    return {
      getGamificationDashboard: `
        WITH user_stats AS (
          SELECT 
            u.id, u.name, u.total_xp, u.level, u.current_streak, u.coins,
            COUNT(DISTINCT up.lesson_id) FILTER (WHERE up.progress_percentage = 100) as completed_lessons,
            COUNT(DISTINCT ub.badge_id) as earned_badges
          FROM users u
          LEFT JOIN user_progress up ON u.id = up.user_id
          LEFT JOIN user_badges ub ON u.id = ub.user_id
          WHERE u.id = $1
          GROUP BY u.id, u.name, u.total_xp, u.level, u.current_streak, u.coins
        ),
        recent_badges AS (
          SELECT b.*, ub.earned_at
          FROM user_badges ub
          JOIN badges b ON ub.badge_id = b.id
          WHERE ub.user_id = $1
          ORDER BY ub.earned_at DESC
          LIMIT 5
        ),
        notifications AS (
          SELECT *
          FROM user_notifications
          WHERE user_id = $1 AND is_read = false
          ORDER BY created_at DESC
          LIMIT 10
        )
        SELECT 
          (SELECT row_to_json(user_stats) FROM user_stats) as user_stats,
          (SELECT json_agg(recent_badges) FROM recent_badges) as recent_badges,
          (SELECT json_agg(notifications) FROM notifications) as notifications
      `,

      processLessonCompletion: `
        WITH lesson_completion AS (
          INSERT INTO user_progress (user_id, lesson_id, progress_percentage, completed_at)
          VALUES ($1, $2, 100, NOW())
          ON CONFLICT (user_id, lesson_id)
          DO UPDATE SET 
            progress_percentage = 100,
            completed_at = NOW()
          RETURNING *
        ),
        xp_update AS (
          UPDATE users 
          SET total_xp = total_xp + $3,
              level = FLOOR(SQRT(total_xp + $3) / 10) + 1
          WHERE id = $1
          RETURNING total_xp, level
        )
        SELECT 
          (SELECT * FROM lesson_completion) as completion,
          (SELECT * FROM xp_update) as xp_update
      `
    };
  }

  // Prepared statement management
  async prepareStatement(name, query) {
    if (!this.preparedStatements.has(name)) {
      const client = await this.pool.connect();
      try {
        await client.query(`PREPARE ${name} AS ${query}`);
        this.preparedStatements.set(name, query);
      } finally {
        client.release();
      }
    }
  }

  // Optimized query execution with caching
  async executeQuery(queryName, params = [], useCache = true) {
    const cacheKey = `${queryName}_${JSON.stringify(params)}`;
    
    if (useCache && this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.result;
      }
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(this.getQuery(queryName), params);
      
      if (useCache) {
        this.queryCache.set(cacheKey, {
          result: result.rows,
          timestamp: Date.now()
        });
      }
      
      return result.rows;
    } finally {
      client.release();
    }
  }

  // Get query by name
  getQuery(name) {
    const queries = {
      ...this.buildCourseQueries(),
      ...this.buildProgressQueries(),
      ...this.buildGamificationQueries()
    };
    
    return queries[name];
  }

  // Batch query execution
  async executeBatch(queries) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const results = [];
      
      for (const { query, params } of queries) {
        const result = await client.query(query, params);
        results.push(result.rows);
      }
      
      await client.query('COMMIT');
      return results;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Query performance analysis
  async analyzeQuery(query, params = []) {
    const client = await this.pool.connect();
    try {
      const explainResult = await client.query(`EXPLAIN (ANALYZE, BUFFERS) ${query}`, params);
      return explainResult.rows;
    } finally {
      client.release();
    }
  }

  // Index suggestions based on query patterns
  generateIndexSuggestions() {
    return [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = true;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, order_index);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_lesson ON user_progress(user_id, lesson_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_user_earned ON user_badges(user_id, earned_at DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON user_notifications(user_id, is_read, created_at DESC) WHERE is_read = false;',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_course_user ON enrollments(course_id, user_id);'
    ];
  }

  // Clear query cache
  clearCache(pattern) {
    if (pattern) {
      for (const [key] of this.queryCache.entries()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }
}

module.exports = OptimizedQueryBuilder;