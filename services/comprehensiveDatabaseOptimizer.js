const BaseService = require('../core/BaseService');
const { dbManager } = require('../server/database');

class ComprehensiveDatabaseOptimizer extends BaseService {
  constructor() {
    super('ComprehensiveDatabaseOptimizer');
    this.indexStrategies = new Map();
    this.queryOptimizations = new Map();
    this.connectionPoolMetrics = new Map();
    
    this.initializeOptimizationStrategies();
  }

  initializeOptimizationStrategies() {
    // Index optimization strategies
    this.indexStrategies.set('courses', [
      { columns: ['id'], type: 'PRIMARY' },
      { columns: ['category', 'difficulty'], type: 'COMPOSITE' },
      { columns: ['created_at'], type: 'BTREE' },
      { columns: ['title'], type: 'BTREE' }
    ]);

    this.indexStrategies.set('lessons', [
      { columns: ['id'], type: 'PRIMARY' },
      { columns: ['course_id'], type: 'FOREIGN' },
      { columns: ['module_id'], type: 'FOREIGN' },
      { columns: ['lesson_order'], type: 'BTREE' },
      { columns: ['course_id', 'lesson_order'], type: 'COMPOSITE' }
    ]);

    this.indexStrategies.set('user_progress', [
      { columns: ['id'], type: 'PRIMARY' },
      { columns: ['user_id'], type: 'FOREIGN' },
      { columns: ['lesson_id'], type: 'FOREIGN' },
      { columns: ['user_id', 'lesson_id'], type: 'UNIQUE_COMPOSITE' },
      { columns: ['completed_at'], type: 'BTREE' },
      { columns: ['user_id', 'completed_at'], type: 'COMPOSITE' }
    ]);

    this.indexStrategies.set('gamification_users', [
      { columns: ['user_id'], type: 'PRIMARY' },
      { columns: ['level'], type: 'BTREE' },
      { columns: ['total_xp'], type: 'BTREE' },
      { columns: ['last_activity'], type: 'BTREE' }
    ]);

    // Query optimization patterns
    this.initializeQueryOptimizations();
  }

  initializeQueryOptimizations() {
    this.queryOptimizations.set('getUserProgress', {
      original: `
        SELECT up.*, l.title, l.xp_reward 
        FROM user_progress up 
        JOIN lessons l ON up.lesson_id = l.id 
        WHERE up.user_id = $1
      `,
      optimized: `
        SELECT 
          up.id, up.user_id, up.lesson_id, up.completed_at, up.score,
          l.title, l.xp_reward 
        FROM user_progress up 
        JOIN lessons l ON up.lesson_id = l.id 
        WHERE up.user_id = $1 
        ORDER BY up.completed_at DESC 
        LIMIT 100
      `,
      indexes: ['user_progress_user_id_completed_at_idx']
    });

    this.queryOptimizations.set('getCourseWithLessons', {
      original: `
        SELECT c.*, l.* 
        FROM courses c 
        LEFT JOIN lessons l ON c.id = l.course_id 
        WHERE c.id = $1
      `,
      optimized: `
        WITH course_data AS (
          SELECT id, title, description, difficulty, category 
          FROM courses 
          WHERE id = $1
        ),
        lesson_data AS (
          SELECT id, title, description, lesson_order, xp_reward, duration
          FROM lessons 
          WHERE course_id = $1 
          ORDER BY lesson_order
        )
        SELECT 
          json_build_object(
            'course', row_to_json(course_data.*),
            'lessons', COALESCE(json_agg(lesson_data.*), '[]'::json)
          ) as result
        FROM course_data 
        LEFT JOIN lesson_data ON true
        GROUP BY course_data.id, course_data.title, course_data.description, course_data.difficulty, course_data.category
      `,
      indexes: ['courses_pkey', 'lessons_course_id_lesson_order_idx']
    });

    this.queryOptimizations.set('getGamificationDashboard', {
      original: `
        SELECT gu.*, COUNT(ub.badge_id) as badge_count 
        FROM gamification_users gu 
        LEFT JOIN user_badges ub ON gu.user_id = ub.user_id 
        WHERE gu.user_id = $1 
        GROUP BY gu.user_id
      `,
      optimized: `
        SELECT 
          gu.user_id, gu.total_xp, gu.level, gu.coins, gu.gems,
          gu.study_streak, gu.login_streak, gu.last_activity,
          COALESCE(badge_stats.badge_count, 0) as badge_count,
          COALESCE(goal_stats.active_goals, 0) as active_goals
        FROM gamification_users gu
        LEFT JOIN (
          SELECT user_id, COUNT(*) as badge_count 
          FROM user_badges 
          WHERE user_id = $1 
          GROUP BY user_id
        ) badge_stats ON gu.user_id = badge_stats.user_id
        LEFT JOIN (
          SELECT user_id, COUNT(*) as active_goals 
          FROM user_goals 
          WHERE user_id = $1 AND status = 'active'
          GROUP BY user_id
        ) goal_stats ON gu.user_id = goal_stats.user_id
        WHERE gu.user_id = $1
      `,
      indexes: ['gamification_users_pkey', 'user_badges_user_id_idx', 'user_goals_user_id_status_idx']
    });
  }

  async optimizeDatabase() {
    console.log('Starting comprehensive database optimization...');
    
    try {
      const results = {
        indexesCreated: 0,
        indexesOptimized: 0,
        queriesOptimized: 0,
        statisticsUpdated: false,
        maintenancePerformed: false
      };

      // 1. Create and optimize indexes
      await this.optimizeIndexes(results);

      // 2. Update table statistics
      await this.updateTableStatistics(results);

      // 3. Perform maintenance tasks
      await this.performMaintenance(results);

      // 4. Optimize connection pool
      await this.optimizeConnectionPool();

      console.log('Database optimization completed:', results);
      return results;

    } catch (error) {
      console.error('Database optimization failed:', error);
      throw error;
    }
  }

  async optimizeIndexes(results) {
    const tables = ['courses', 'lessons', 'user_progress', 'gamification_users'];
    
    for (const table of tables) {
      const strategies = this.indexStrategies.get(table) || [];
      
      for (const strategy of strategies) {
        try {
          await this.createOptimizedIndex(table, strategy);
          results.indexesCreated++;
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`Failed to create index for ${table}:`, error.message);
          }
        }
      }
    }
  }

  async createOptimizedIndex(table, strategy) {
    const indexName = `${table}_${strategy.columns.join('_')}_idx`;
    let sql = '';

    switch (strategy.type) {
      case 'COMPOSITE':
        sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${strategy.columns.join(', ')})`;
        break;
      case 'BTREE':
        sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} USING BTREE (${strategy.columns.join(', ')})`;
        break;
      case 'UNIQUE_COMPOSITE':
        sql = `CREATE UNIQUE INDEX IF NOT EXISTS ${indexName} ON ${table} (${strategy.columns.join(', ')})`;
        break;
      case 'FOREIGN':
        sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${strategy.columns.join(', ')})`;
        break;
      default:
        return; // Skip PRIMARY and other types that are usually auto-created
    }

    if (sql) {
      await dbManager.query(sql);
      console.log(`Created index: ${indexName}`);
    }
  }

  async updateTableStatistics(results) {
    const tables = ['courses', 'lessons', 'user_progress', 'gamification_users', 'user_badges', 'user_goals'];
    
    try {
      for (const table of tables) {
        await dbManager.query(`ANALYZE ${table}`);
      }
      results.statisticsUpdated = true;
      console.log('Table statistics updated successfully');
    } catch (error) {
      console.warn('Failed to update table statistics:', error.message);
    }
  }

  async performMaintenance(results) {
    try {
      // Clean up old session data (if table exists)
      try {
        await dbManager.query(`
          DELETE FROM user_sessions 
          WHERE expires_at < NOW() - INTERVAL '7 days'
        `);
      } catch (e) {
        // Table might not exist, continue
      }

      // Clean up old notification data (if table exists)  
      try {
        await dbManager.query(`
          DELETE FROM user_notifications 
          WHERE created_at < NOW() - INTERVAL '30 days' 
          AND read_at IS NOT NULL
        `);
      } catch (e) {
        // Table might not exist, continue
      }

      // Vacuum analyze for better performance
      await dbManager.query('VACUUM ANALYZE');

      results.maintenancePerformed = true;
      console.log('Database maintenance completed');
    } catch (error) {
      console.warn('Database maintenance partially failed:', error.message);
    }
  }

  async optimizeConnectionPool() {
    // Monitor and adjust connection pool settings
    const poolStats = await this.getConnectionPoolStats();
    
    if (poolStats.idleConnections > poolStats.totalConnections * 0.8) {
      console.log('High idle connection ratio detected, considering pool size reduction');
    }
    
    if (poolStats.waitingClients > 5) {
      console.log('High waiting client count detected, considering pool size increase');
    }

    this.connectionPoolMetrics.set('lastOptimization', {
      timestamp: new Date(),
      stats: poolStats
    });
  }

  async getConnectionPoolStats() {
    try {
      const result = await dbManager.query(`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `);

      return {
        totalConnections: result.rows[0]?.total_connections || 0,
        idleConnections: result.rows[0]?.idle_connections || 0,
        activeConnections: result.rows[0]?.active_connections || 0,
        waitingClients: 0 // This would need to be tracked at application level
      };
    } catch (error) {
      console.warn('Failed to get connection pool stats:', error.message);
      return { totalConnections: 0, idleConnections: 0, activeConnections: 0, waitingClients: 0 };
    }
  }

  async optimizeQuery(queryName, params = []) {
    const optimization = this.queryOptimizations.get(queryName);
    if (!optimization) {
      throw new Error(`No optimization found for query: ${queryName}`);
    }

    try {
      const result = await dbManager.query(optimization.optimized, params);
      return result.rows;
    } catch (error) {
      console.warn(`Optimized query failed, falling back to original: ${queryName}`);
      const fallbackResult = await dbManager.query(optimization.original, params);
      return fallbackResult.rows;
    }
  }

  async analyzeQueryPerformance(queryName, params = []) {
    const optimization = this.queryOptimizations.get(queryName);
    if (!optimization) {
      return null;
    }

    const results = {
      queryName,
      originalPerformance: null,
      optimizedPerformance: null,
      improvement: null
    };

    try {
      // Analyze original query
      const originalExplain = await dbManager.query(`EXPLAIN ANALYZE ${optimization.original}`, params);
      results.originalPerformance = this.parseExplainOutput(originalExplain.rows);

      // Analyze optimized query
      const optimizedExplain = await dbManager.query(`EXPLAIN ANALYZE ${optimization.optimized}`, params);
      results.optimizedPerformance = this.parseExplainOutput(optimizedExplain.rows);

      // Calculate improvement
      if (results.originalPerformance.executionTime && results.optimizedPerformance.executionTime) {
        const improvementPercent = (
          (results.originalPerformance.executionTime - results.optimizedPerformance.executionTime) /
          results.originalPerformance.executionTime * 100
        );
        results.improvement = `${improvementPercent.toFixed(2)}% faster`;
      }

      return results;
    } catch (error) {
      console.error(`Query performance analysis failed for ${queryName}:`, error.message);
      return results;
    }
  }

  parseExplainOutput(explainRows) {
    const output = explainRows.map(row => row['QUERY PLAN']).join('\n');
    const executionTimeMatch = output.match(/Execution Time: ([\d.]+) ms/);
    const planningTimeMatch = output.match(/Planning Time: ([\d.]+) ms/);
    
    return {
      executionTime: executionTimeMatch ? parseFloat(executionTimeMatch[1]) : null,
      planningTime: planningTimeMatch ? parseFloat(planningTimeMatch[1]) : null,
      fullOutput: output
    };
  }

  async generateOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      databaseSize: await this.getDatabaseSize(),
      tableStats: await this.getTableStatistics(),
      indexUsage: await this.getIndexUsage(),
      slowQueries: await this.getSlowQueries(),
      connectionPoolStats: this.connectionPoolMetrics.get('lastOptimization'),
      recommendations: []
    };

    // Generate recommendations based on analysis
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  async getDatabaseSize() {
    try {
      const result = await dbManager.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      return result.rows[0]?.size || 'Unknown';
    } catch (error) {
      return 'Error retrieving size';
    }
  }

  async getTableStatistics() {
    try {
      const result = await dbManager.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async getIndexUsage() {
    try {
      const result = await dbManager.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes
        WHERE idx_scan > 0
        ORDER BY idx_scan DESC
        LIMIT 20
      `);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  async getSlowQueries() {
    try {
      const result = await dbManager.query(`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements
        WHERE mean_time > 100
        ORDER BY mean_time DESC
        LIMIT 10
      `);
      return result.rows;
    } catch (error) {
      return [];
    }
  }

  generateRecommendations(report) {
    const recommendations = [];

    // Check for tables with high dead tuple ratio
    report.tableStats.forEach(table => {
      if (table.dead_tuples > table.live_tuples * 0.2) {
        recommendations.push({
          type: 'maintenance',
          priority: 'high',
          message: `Table ${table.tablename} has high dead tuple ratio (${table.dead_tuples}/${table.live_tuples}). Consider VACUUM FULL.`
        });
      }
    });

    // Check for unused indexes
    const unusedIndexes = report.indexUsage.filter(idx => idx.scans === 0);
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'medium',
        message: `Found ${unusedIndexes.length} unused indexes. Consider dropping them to improve write performance.`
      });
    }

    // Check for slow queries
    if (report.slowQueries.length > 0) {
      recommendations.push({
        type: 'query',
        priority: 'high',
        message: `Found ${report.slowQueries.length} slow queries. Review and optimize query patterns.`
      });
    }

    return recommendations;
  }

  async scheduledOptimization() {
    try {
      console.log('Running scheduled database optimization...');
      const results = await this.optimizeDatabase();
      
      // Generate report
      const report = await this.generateOptimizationReport();
      
      // Log important findings
      if (report.recommendations.length > 0) {
        console.log('Database optimization recommendations:');
        report.recommendations.forEach(rec => {
          console.log(`[${rec.priority.toUpperCase()}] ${rec.message}`);
        });
      }

      return { results, report };
    } catch (error) {
      console.error('Scheduled optimization failed:', error);
      throw error;
    }
  }
}

module.exports = ComprehensiveDatabaseOptimizer;