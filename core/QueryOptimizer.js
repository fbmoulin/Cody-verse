const BaseService = require('./BaseService');
const logger = require('../server/logger');

/**
 * Query Optimizer - Intelligent database query optimization and caching
 */
class QueryOptimizer extends BaseService {
  constructor() {
    super('QueryOptimizer');
    this.queryCache = new Map();
    this.queryStats = new Map();
    this.optimizationRules = new Map();
    this.batchQueue = new Map();
    this.connectionPool = {
      active: 0,
      idle: 0,
      waiting: 0,
      maxConnections: 20,
      minConnections: 5
    };
    this.initialize();
  }

  initialize() {
    this.setupOptimizationRules();
    this.setupBatchProcessing();
    this.startQueryMonitoring();
    logger.info('Query Optimizer initialized', {
      cacheSize: this.queryCache.size,
      rulesCount: this.optimizationRules.size,
      category: 'query_optimization'
    });
  }

  setupOptimizationRules() {
    // Rule for SELECT queries
    this.optimizationRules.set('select', {
      pattern: /^SELECT/i,
      optimize: (query, params) => this.optimizeSelectQuery(query, params),
      cacheable: true,
      ttl: 300000 // 5 minutes
    });

    // Rule for COUNT queries
    this.optimizationRules.set('count', {
      pattern: /^SELECT COUNT/i,
      optimize: (query, params) => this.optimizeCountQuery(query, params),
      cacheable: true,
      ttl: 600000 // 10 minutes
    });

    // Rule for INSERT queries
    this.optimizationRules.set('insert', {
      pattern: /^INSERT/i,
      optimize: (query, params) => this.optimizeInsertQuery(query, params),
      cacheable: false,
      batchable: true
    });

    // Rule for UPDATE queries
    this.optimizationRules.set('update', {
      pattern: /^UPDATE/i,
      optimize: (query, params) => this.optimizeUpdateQuery(query, params),
      cacheable: false,
      batchable: true
    });

    // Rule for JOIN queries
    this.optimizationRules.set('join', {
      pattern: /JOIN/i,
      optimize: (query, params) => this.optimizeJoinQuery(query, params),
      cacheable: true,
      ttl: 300000
    });
  }

  async optimizeQuery(query, params = [], options = {}) {
    const startTime = Date.now();
    const queryHash = this.generateQueryHash(query, params);
    
    try {
      // Check cache first
      if (options.useCache !== false) {
        const cached = this.getFromCache(queryHash);
        if (cached) {
          this.recordQueryStats(query, 'cache_hit', Date.now() - startTime);
          return cached;
        }
      }

      // Find applicable optimization rule
      const rule = this.findOptimizationRule(query);
      let optimizedQuery = query;
      let optimizedParams = params;

      if (rule) {
        const optimized = await rule.optimize(query, params);
        optimizedQuery = optimized.query || query;
        optimizedParams = optimized.params || params;
      }

      // Add query hints for PostgreSQL
      optimizedQuery = this.addQueryHints(optimizedQuery, options);

      // Execute query
      const result = await this.executeOptimizedQuery(
        optimizedQuery, 
        optimizedParams, 
        options
      );

      const duration = Date.now() - startTime;

      // Cache result if applicable
      if (rule && rule.cacheable && options.useCache !== false) {
        this.cacheResult(queryHash, result, rule.ttl);
      }

      this.recordQueryStats(query, 'success', duration);
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordQueryStats(query, 'error', duration);
      
      logger.error('Query optimization failed', {
        query: query.substring(0, 100),
        error: error.message,
        duration,
        category: 'query_optimization'
      });
      
      throw error;
    }
  }

  optimizeSelectQuery(query, params) {
    let optimized = query;

    // Add LIMIT if not present and no explicit limit requested
    if (!optimized.includes('LIMIT') && !optimized.includes('limit')) {
      optimized += ' LIMIT 1000';
    }

    // Optimize ORDER BY with indexes
    if (optimized.includes('ORDER BY')) {
      optimized = this.optimizeOrderBy(optimized);
    }

    // Add query hints for better performance
    if (optimized.includes('WHERE')) {
      optimized = this.optimizeWhereClause(optimized);
    }

    return { query: optimized, params };
  }

  optimizeCountQuery(query, params) {
    let optimized = query;

    // Use estimated count for large tables when possible
    if (optimized.includes('COUNT(*)') && !optimized.includes('WHERE')) {
      // For tables without WHERE clause, use pg_stat_user_tables
      const tableMatch = optimized.match(/FROM\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        optimized = `SELECT n_tup_ins - n_tup_del AS count FROM pg_stat_user_tables WHERE relname = '${tableName}'`;
      }
    }

    return { query: optimized, params };
  }

  optimizeInsertQuery(query, params) {
    // Batch INSERT optimization
    if (Array.isArray(params) && params.length > 1) {
      return this.batchInsertOptimization(query, params);
    }

    // Add ON CONFLICT handling
    if (!query.includes('ON CONFLICT') && !query.includes('RETURNING')) {
      query += ' ON CONFLICT DO NOTHING';
    }

    return { query, params };
  }

  optimizeUpdateQuery(query, params) {
    let optimized = query;

    // Add WHERE clause safety check
    if (!optimized.includes('WHERE')) {
      logger.warn('UPDATE query without WHERE clause detected', {
        query: query.substring(0, 100),
        category: 'query_optimization'
      });
    }

    // Optimize SET clauses
    optimized = this.optimizeSetClause(optimized);

    return { query: optimized, params };
  }

  optimizeJoinQuery(query, params) {
    let optimized = query;

    // Reorder JOINs for better performance (smaller tables first)
    optimized = this.optimizeJoinOrder(optimized);

    // Add index hints for JOIN conditions
    optimized = this.addJoinHints(optimized);

    return { query: optimized, params };
  }

  addQueryHints(query, options) {
    let hinted = query;

    // Add connection-level optimizations
    if (options.readOnly) {
      hinted = '/* read-only */ ' + hinted;
    }

    // Add work_mem hint for complex queries
    if (query.includes('ORDER BY') || query.includes('GROUP BY')) {
      hinted = 'SET work_mem = "256MB"; ' + hinted;
    }

    // Add query timeout
    if (!options.timeout) {
      hinted = 'SET statement_timeout = "30s"; ' + hinted;
    }

    return hinted;
  }

  optimizeOrderBy(query) {
    // Add index hints for ORDER BY clauses
    const orderByMatch = query.match(/ORDER BY\s+(\w+)/i);
    if (orderByMatch) {
      const column = orderByMatch[1];
      // Add comment hint for index usage
      return query.replace(
        /ORDER BY/i, 
        `/* use index on ${column} */ ORDER BY`
      );
    }
    return query;
  }

  optimizeWhereClause(query) {
    let optimized = query;

    // Reorder WHERE conditions (most selective first)
    const whereMatch = optimized.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const conditions = whereMatch[1].split(/\s+AND\s+/i);
      
      // Sort conditions by selectivity (simple heuristic)
      conditions.sort((a, b) => {
        const aSelectivity = this.estimateSelectivity(a);
        const bSelectivity = this.estimateSelectivity(b);
        return aSelectivity - bSelectivity;
      });

      const reorderedWhere = conditions.join(' AND ');
      optimized = optimized.replace(whereMatch[0], `WHERE ${reorderedWhere}`);
    }

    return optimized;
  }

  estimateSelectivity(condition) {
    // Simple selectivity estimation
    if (condition.includes('=')) return 1; // Most selective
    if (condition.includes('IN')) return 2;
    if (condition.includes('BETWEEN')) return 3;
    if (condition.includes('LIKE')) return 4;
    if (condition.includes('>') || condition.includes('<')) return 5;
    return 6; // Least selective
  }

  batchInsertOptimization(query, paramArrays) {
    // Convert multiple INSERTs into single batch INSERT
    const valuesPart = paramArrays.map(() => '(?)').join(', ');
    const batchQuery = query.replace(/VALUES\s*\([^)]+\)/i, `VALUES ${valuesPart}`);
    const flatParams = paramArrays.flat();

    return { query: batchQuery, params: flatParams };
  }

  optimizeSetClause(query) {
    // Optimize SET clauses in UPDATE statements
    let optimized = query;

    // Remove redundant SET operations
    const setMatch = optimized.match(/SET\s+(.+?)\s+WHERE/i);
    if (setMatch) {
      const setParts = setMatch[1].split(',').map(part => part.trim());
      const uniqueFields = new Set();
      const filteredParts = setParts.filter(part => {
        const field = part.split('=')[0].trim();
        if (uniqueFields.has(field)) {
          return false;
        }
        uniqueFields.add(field);
        return true;
      });

      if (filteredParts.length < setParts.length) {
        optimized = optimized.replace(setMatch[1], filteredParts.join(', '));
      }
    }

    return optimized;
  }

  optimizeJoinOrder(query) {
    // Simple JOIN optimization - move smaller tables first
    // This is a basic implementation; in production, you'd use query planner statistics
    return query;
  }

  addJoinHints(query) {
    // Add hints for JOIN optimization
    return query.replace(/JOIN/gi, '/* use index */ JOIN');
  }

  setupBatchProcessing() {
    // Process batched queries every 100ms
    setInterval(() => {
      this.processBatchQueue();
    }, 100);
  }

  processBatchQueue() {
    for (const [batchKey, queries] of this.batchQueue.entries()) {
      if (queries.length >= 10 || Date.now() - queries[0].timestamp > 500) {
        this.executeBatch(batchKey, queries);
        this.batchQueue.delete(batchKey);
      }
    }
  }

  async executeBatch(batchKey, queries) {
    try {
      // Execute queries in a single transaction
      const DataAccessLayer = require('./DataAccessLayer');
      const dal = new DataAccessLayer();

      await dal.executeTransaction(async (client) => {
        for (const queryItem of queries) {
          await client.query(queryItem.query, queryItem.params);
        }
      });

      logger.info('Batch queries executed', {
        batchKey,
        queryCount: queries.length,
        category: 'query_optimization'
      });

    } catch (error) {
      logger.error('Batch execution failed', {
        batchKey,
        error: error.message,
        category: 'query_optimization'
      });
    }
  }

  async executeOptimizedQuery(query, params, options) {
    const DataAccessLayer = require('./DataAccessLayer');
    const dal = new DataAccessLayer();

    // Apply query execution options
    const executionOptions = {
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      ...options
    };

    return await dal.executeQuery(query, params, executionOptions);
  }

  findOptimizationRule(query) {
    for (const [name, rule] of this.optimizationRules.entries()) {
      if (rule.pattern.test(query)) {
        return rule;
      }
    }
    return null;
  }

  generateQueryHash(query, params) {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim().toLowerCase();
    const paramStr = JSON.stringify(params || []);
    return `${normalizedQuery}_${paramStr}`;
  }

  getFromCache(queryHash) {
    const cached = this.queryCache.get(queryHash);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.queryCache.delete(queryHash);
      return null;
    }

    cached.hits++;
    return cached.data;
  }

  cacheResult(queryHash, result, ttl = 300000) {
    // Implement LRU eviction if cache is too large
    if (this.queryCache.size >= 1000) {
      const oldestKey = Array.from(this.queryCache.keys())[0];
      this.queryCache.delete(oldestKey);
    }

    this.queryCache.set(queryHash, {
      data: result,
      expiry: Date.now() + ttl,
      hits: 0,
      created: Date.now()
    });
  }

  recordQueryStats(query, type, duration) {
    const hour = new Date().getHours();
    const key = `${type}_${hour}`;
    
    if (!this.queryStats.has(key)) {
      this.queryStats.set(key, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      });
    }

    const stats = this.queryStats.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;

    // Log slow queries
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow query detected', {
        query: query.substring(0, 200),
        duration,
        type,
        category: 'query_optimization'
      });
    }
  }

  startQueryMonitoring() {
    setInterval(() => {
      this.generatePerformanceReport();
    }, 300000); // Every 5 minutes

    logger.info('Query monitoring started', {
      category: 'query_optimization'
    });
  }

  generatePerformanceReport() {
    const report = {
      cacheStats: {
        size: this.queryCache.size,
        hitRate: this.calculateCacheHitRate(),
        oldestEntry: this.getOldestCacheEntry()
      },
      queryStats: Object.fromEntries(this.queryStats),
      connectionPool: this.connectionPool,
      recommendations: this.generateOptimizationRecommendations()
    };

    logger.info('Query optimization report', {
      ...report,
      category: 'query_optimization'
    });

    return report;
  }

  calculateCacheHitRate() {
    let totalHits = 0;
    let totalQueries = 0;

    for (const cached of this.queryCache.values()) {
      totalHits += cached.hits;
      totalQueries++;
    }

    return totalQueries > 0 ? (totalHits / totalQueries * 100).toFixed(2) : 0;
  }

  getOldestCacheEntry() {
    let oldest = Date.now();
    for (const cached of this.queryCache.values()) {
      if (cached.created < oldest) {
        oldest = cached.created;
      }
    }
    return oldest;
  }

  generateOptimizationRecommendations() {
    const recommendations = [];
    
    const hitRate = parseFloat(this.calculateCacheHitRate());
    if (hitRate < 50) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        message: 'Consider increasing cache TTL or size - low hit rate detected'
      });
    }

    // Analyze query patterns
    let slowQueries = 0;
    for (const [key, stats] of this.queryStats.entries()) {
      if (key.includes('success') && stats.avgDuration > 1000) {
        slowQueries++;
      }
    }

    if (slowQueries > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `${slowQueries} query types are running slowly - consider adding indexes`
      });
    }

    return recommendations;
  }

  getQueryReport() {
    return {
      cacheSize: this.queryCache.size,
      queryStats: Object.fromEntries(this.queryStats),
      optimizationRules: Array.from(this.optimizationRules.keys()),
      batchQueueSize: this.batchQueue.size,
      hitRate: this.calculateCacheHitRate()
    };
  }

  cleanup() {
    this.queryCache.clear();
    this.queryStats.clear();
    this.batchQueue.clear();
    
    logger.info('Query Optimizer cleaned up', {
      category: 'query_optimization'
    });
  }
}

module.exports = QueryOptimizer;