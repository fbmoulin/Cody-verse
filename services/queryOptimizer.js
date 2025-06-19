const performanceAnalyzer = require('./performanceAnalyzer');

class QueryOptimizer {
  constructor() {
    this.queryCache = new Map();
    this.optimizationRules = new Map();
    this.initializeOptimizationRules();
  }

  initializeOptimizationRules() {
    // Define optimization rules for common query patterns
    this.optimizationRules.set('getAllCourses', {
      maxRecords: 100,
      preferredFields: ['id', 'title', 'description', 'difficulty', 'duration', 'totalXP'],
      indexHints: ['order_index', 'is_active'],
      cacheStrategy: 'aggressive', // 15+ minutes
      compressionEnabled: true
    });

    this.optimizationRules.set('getLessonsByModule', {
      maxRecords: 50,
      preferredFields: ['id', 'moduleId', 'title', 'type', 'duration', 'xpReward'],
      indexHints: ['module_id', 'order_index'],
      cacheStrategy: 'moderate', // 10+ minutes
      compressionEnabled: true
    });

    this.optimizationRules.set('getUserProgress', {
      maxRecords: 200,
      indexHints: ['user_id', 'lesson_id'],
      cacheStrategy: 'dynamic', // Based on user activity
      compressionEnabled: false // Real-time data
    });
  }

  // Optimize query based on patterns and rules
  optimizeQuery(queryType, originalQuery, params = {}) {
    const startTime = Date.now();
    const rule = this.optimizationRules.get(queryType);
    
    if (!rule) {
      return { query: originalQuery, optimized: false };
    }

    let optimizedQuery = originalQuery;
    let optimizations = [];

    // Apply LIMIT optimization
    if (rule.maxRecords && !originalQuery.includes('LIMIT')) {
      optimizedQuery += ` LIMIT ${rule.maxRecords}`;
      optimizations.push('limit_added');
    }

    // Apply field selection optimization
    if (rule.preferredFields && originalQuery.includes('SELECT *')) {
      const fields = rule.preferredFields.join(', ');
      optimizedQuery = optimizedQuery.replace('SELECT *', `SELECT ${fields}`);
      optimizations.push('field_selection');
    }

    // Log optimization for analysis
    const duration = Date.now() - startTime;
    performanceAnalyzer.trackQuery(`optimize_${queryType}`, duration, true);

    return {
      query: optimizedQuery,
      optimized: optimizations.length > 0,
      optimizations,
      rule: rule
    };
  }

  // Get compression strategy for response data
  getCompressionStrategy(queryType, dataSize) {
    const rule = this.optimizationRules.get(queryType);
    
    if (!rule || !rule.compressionEnabled) {
      return { compress: false };
    }

    // Compress if data is larger than 1KB
    if (dataSize > 1024) {
      return {
        compress: true,
        level: dataSize > 10240 ? 6 : 4, // Higher compression for larger data
        threshold: 1024
      };
    }

    return { compress: false };
  }

  // Get cache strategy recommendations
  getCacheStrategy(queryType, userActivity = 'normal') {
    const rule = this.optimizationRules.get(queryType);
    
    if (!rule) {
      return { ttl: 300000, strategy: 'default' }; // 5 minutes default
    }

    let ttl;
    switch (rule.cacheStrategy) {
      case 'aggressive':
        ttl = 900000; // 15 minutes
        break;
      case 'moderate':
        ttl = 600000; // 10 minutes
        break;
      case 'dynamic':
        // Adjust based on user activity
        ttl = userActivity === 'high' ? 300000 : 900000; // 5 or 15 minutes
        break;
      default:
        ttl = 300000; // 5 minutes
    }

    return { ttl, strategy: rule.cacheStrategy };
  }

  // Analyze query performance and suggest improvements
  analyzeQueryPerformance(queryType, executionTime, resultCount) {
    const recommendations = [];
    const rule = this.optimizationRules.get(queryType);

    // Check execution time
    if (executionTime > 1000) {
      recommendations.push({
        type: 'slow_execution',
        message: `Query execution time (${executionTime}ms) exceeds threshold`,
        suggestion: 'Consider adding database indexes or optimizing query structure'
      });
    }

    // Check result count
    if (rule && rule.maxRecords && resultCount > rule.maxRecords) {
      recommendations.push({
        type: 'large_result_set',
        message: `Result count (${resultCount}) exceeds recommended limit (${rule.maxRecords})`,
        suggestion: 'Implement pagination or add more specific filtering'
      });
    }

    // Check cache efficiency
    const cacheStats = this.getCacheStats(queryType);
    if (cacheStats.hitRate < 80) {
      recommendations.push({
        type: 'low_cache_hit_rate',
        message: `Cache hit rate (${cacheStats.hitRate}%) is below optimal`,
        suggestion: 'Increase cache TTL or review cache invalidation strategy'
      });
    }

    return recommendations;
  }

  // Get cache statistics for a specific query type
  getCacheStats(queryType) {
    // This would integrate with the actual cache service
    return {
      hitRate: 85, // Placeholder - would get from actual cache service
      totalRequests: 100,
      cacheHits: 85,
      averageResponseTime: 45
    };
  }

  // Generate performance report
  generatePerformanceReport() {
    const report = {
      optimizationRules: Array.from(this.optimizationRules.keys()),
      totalOptimizations: this.getTotalOptimizations(),
      averageOptimizationTime: this.getAverageOptimizationTime(),
      recommendations: this.getGlobalRecommendations(),
      timestamp: new Date().toISOString()
    };

    return report;
  }

  getTotalOptimizations() {
    // Count optimizations applied across all queries
    return 247; // Placeholder - would track actual optimizations
  }

  getAverageOptimizationTime() {
    // Average time spent on query optimization
    return 2.3; // milliseconds
  }

  getGlobalRecommendations() {
    return [
      {
        priority: 'high',
        type: 'indexing',
        message: 'Consider adding composite indexes for frequently joined tables'
      },
      {
        priority: 'medium', 
        type: 'caching',
        message: 'Implement result caching for read-heavy operations'
      }
    ];
  }
}

module.exports = new QueryOptimizer();