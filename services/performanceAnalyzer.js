const { execute_sql_tool } = require('../database/DatabaseManager');

class PerformanceAnalyzer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueries = [];
    this.performanceThresholds = {
      slowQueryMs: 1000,
      highMemoryMB: 100,
      maxCacheSize: 1000
    };
  }

  // Analyze database query performance
  async analyzeQueryPerformance() {
    try {
      const slowQueries = await this.getSlowQueries();
      const indexUsage = await this.getIndexUsage();
      const tableStats = await this.getTableStatistics();
      
      return {
        slowQueries: slowQueries.slice(0, 10), // Top 10 slowest
        indexEfficiency: this.calculateIndexEfficiency(indexUsage),
        tablePerformance: tableStats,
        recommendations: this.generateOptimizationRecommendations(slowQueries, indexUsage)
      };
    } catch (error) {
      console.error('Error analyzing query performance:', error);
      return { error: error.message };
    }
  }

  // Get slow queries from PostgreSQL stats
  async getSlowQueries() {
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE calls > 5
      ORDER BY mean_time DESC 
      LIMIT 20;
    `;
    
    try {
      const result = await this.executeQuery(query);
      return result.rows || [];
    } catch (error) {
      // pg_stat_statements might not be enabled
      return [];
    }
  }

  // Analyze index usage efficiency
  async getIndexUsage() {
    const query = `
      SELECT 
        schemaname,
        relname as tablename,
        indexrelname as indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan,
        CASE 
          WHEN idx_scan = 0 THEN 'Never Used'
          WHEN idx_scan < 50 THEN 'Rarely Used'
          WHEN idx_scan < 500 THEN 'Moderately Used'
          ELSE 'Frequently Used'
        END as usage_category
      FROM pg_stat_user_indexes 
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `;
    
    try {
      const result = await this.executeQuery(query);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting index usage:', error);
      return [];
    }
  }

  // Get table statistics
  async getTableStatistics() {
    const query = `
      SELECT 
        schemaname,
        relname as tablename,
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
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC;
    `;
    
    try {
      const result = await this.executeQuery(query);
      return result.rows || [];
    } catch (error) {
      console.error('Error getting table statistics:', error);
      return [];
    }
  }

  // Calculate index efficiency metrics
  calculateIndexEfficiency(indexUsage) {
    if (!indexUsage.length) return { overall: 0, details: [] };

    const totalIndexes = indexUsage.length;
    const unusedIndexes = indexUsage.filter(idx => idx.usage_category === 'Never Used').length;
    const efficientIndexes = indexUsage.filter(idx => 
      idx.usage_category === 'Frequently Used' || idx.usage_category === 'Moderately Used'
    ).length;

    return {
      overall: Math.round((efficientIndexes / totalIndexes) * 100),
      totalIndexes,
      unusedIndexes,
      efficientIndexes,
      categories: {
        frequent: indexUsage.filter(idx => idx.usage_category === 'Frequently Used').length,
        moderate: indexUsage.filter(idx => idx.usage_category === 'Moderately Used').length,
        rare: indexUsage.filter(idx => idx.usage_category === 'Rarely Used').length,
        never: unusedIndexes
      }
    };
  }

  // Generate optimization recommendations
  generateOptimizationRecommendations(slowQueries, indexUsage) {
    const recommendations = [];

    // Slow query recommendations
    if (slowQueries.length > 0) {
      const avgTime = slowQueries.reduce((sum, q) => sum + parseFloat(q.mean_time || 0), 0) / slowQueries.length;
      if (avgTime > this.performanceThresholds.slowQueryMs) {
        recommendations.push({
          type: 'slow_queries',
          priority: 'high',
          message: `Found ${slowQueries.length} slow queries with average time ${avgTime.toFixed(2)}ms`,
          action: 'Consider optimizing queries, adding indexes, or implementing query caching'
        });
      }
    }

    // Index recommendations
    const unusedIndexes = indexUsage.filter(idx => idx.usage_category === 'Never Used');
    if (unusedIndexes.length > 0) {
      recommendations.push({
        type: 'unused_indexes',
        priority: 'medium',
        message: `Found ${unusedIndexes.length} unused indexes`,
        action: 'Consider dropping unused indexes to improve write performance'
      });
    }

    // Cache recommendations
    const cacheService = require('../core/services/cache_service');
    const cacheStats = cacheService.getStats();
    if (cacheStats.size > this.performanceThresholds.maxCacheSize) {
      recommendations.push({
        type: 'cache_size',
        priority: 'medium',
        message: `Cache size (${cacheStats.size}) exceeds recommended threshold`,
        action: 'Consider implementing cache cleanup or reducing TTL values'
      });
    }

    return recommendations;
  }

  // Track query execution time
  trackQuery(queryType, duration, success) {
    const key = queryType;
    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity,
        errors: 0,
        lastExecuted: null
      });
    }

    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;
    stats.maxTime = Math.max(stats.maxTime, duration);
    stats.minTime = Math.min(stats.minTime, duration);
    stats.lastExecuted = new Date();

    if (!success) {
      stats.errors++;
    }

    // Track slow queries
    if (duration > this.performanceThresholds.slowQueryMs) {
      this.slowQueries.push({
        queryType,
        duration,
        timestamp: new Date(),
        success
      });

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
    }
  }

  // Get performance report
  getPerformanceReport() {
    const stats = {};
    for (const [key, value] of this.queryStats.entries()) {
      stats[key] = {
        ...value,
        errorRate: value.count > 0 ? (value.errors / value.count * 100).toFixed(2) + '%' : '0%'
      };
    }

    return {
      queryStats: stats,
      recentSlowQueries: this.slowQueries.slice(-20),
      summary: {
        totalQueries: Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.count, 0),
        avgResponseTime: this.calculateOverallAvgTime(),
        slowQueryCount: this.slowQueries.length,
        errorCount: Array.from(this.queryStats.values()).reduce((sum, stat) => sum + stat.errors, 0)
      }
    };
  }

  calculateOverallAvgTime() {
    const allStats = Array.from(this.queryStats.values());
    if (allStats.length === 0) return 0;

    const totalTime = allStats.reduce((sum, stat) => sum + stat.totalTime, 0);
    const totalCount = allStats.reduce((sum, stat) => sum + stat.count, 0);
    
    return totalCount > 0 ? (totalTime / totalCount).toFixed(2) : 0;
  }

  // Helper method to execute queries safely
  async executeQuery(query) {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1 // Use minimal connections for analysis
    });

    try {
      const result = await pool.query(query);
      return result;
    } finally {
      await pool.end();
    }
  }

  // Clear statistics
  clearStats() {
    this.queryStats.clear();
    this.slowQueries = [];
  }
}

module.exports = new PerformanceAnalyzer();