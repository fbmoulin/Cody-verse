const BaseService = require('./BaseService');
const connectionPool = require('../server/connectionPool');
const configManager = require('./ConfigManager');

class DataAccessLayer extends BaseService {
  constructor() {
    super('DataAccessLayer');
    this.queryCache = new Map();
  }

  async executeQuery(sql, params = [], options = {}) {
    const {
      useCache = false,
      cacheKey = null,
      cacheTTL = configManager.get('cache.defaultTTL'),
      timeout = configManager.get('database.query.timeout')
    } = options;

    if (useCache && cacheKey) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data;
      }
    }

    return await this.executeWithMetrics(async () => {
      const result = await this.executeWithRetry(async () => {
        const startTime = Date.now();
        
        try {
          const queryResult = await connectionPool.query(sql, params);
          const duration = Date.now() - startTime;
          
          if (duration > configManager.get('database.query.slowThreshold')) {
            console.warn(`Slow query detected: ${duration}ms - ${sql.substring(0, 100)}...`);
          }
          
          return queryResult;
        } catch (error) {
          error.sql = sql;
          error.params = params;
          throw error;
        }
      }, {
        maxRetries: configManager.get('database.retry.maxAttempts'),
        baseDelay: configManager.get('database.retry.baseDelay')
      });

      if (useCache && cacheKey) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    }, 'executeQuery');
  }

  async executeTransaction(operations) {
    return await this.executeWithMetrics(async () => {
      return await connectionPool.transaction(async (client) => {
        const results = [];
        
        for (const operation of operations) {
          const result = await operation(client);
          results.push(result);
        }
        
        return results;
      });
    }, 'executeTransaction');
  }

  async batchInsert(table, records, chunkSize = 100) {
    return await this.executeWithMetrics(async () => {
      const chunks = this.chunkArray(records, chunkSize);
      const results = [];

      for (const chunk of chunks) {
        const placeholders = chunk.map((_, index) => 
          `(${Object.keys(chunk[0]).map((_, colIndex) => 
            `$${index * Object.keys(chunk[0]).length + colIndex + 1}`
          ).join(', ')})`
        ).join(', ');

        const values = chunk.flatMap(record => Object.values(record));
        const columns = Object.keys(chunk[0]).join(', ');
        
        const sql = `INSERT INTO ${table} (${columns}) VALUES ${placeholders} RETURNING *`;
        const result = await this.executeQuery(sql, values);
        results.push(...result.rows);
      }

      return results;
    }, 'batchInsert');
  }

  async upsert(table, data, conflictColumns, updateColumns = null) {
    return await this.executeWithMetrics(async () => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      
      let updateClause = '';
      if (updateColumns) {
        const updates = updateColumns.map(col => `${col} = EXCLUDED.${col}`);
        updateClause = ` DO UPDATE SET ${updates.join(', ')}`;
      } else {
        updateClause = ' DO NOTHING';
      }
      
      const sql = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (${conflictColumns.join(', ')})
        ${updateClause}
        RETURNING *
      `;
      
      const result = await this.executeQuery(sql, values);
      return result.rows[0];
    }, 'upsert');
  }

  async findOne(table, conditions = {}, options = {}) {
    const {
      select = '*',
      orderBy = null,
      useCache = false
    } = options;

    const whereClause = this.buildWhereClause(conditions);
    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
    
    const sql = `SELECT ${select} FROM ${table}${whereClause.clause}${orderClause} LIMIT 1`;
    const cacheKey = useCache ? `findOne:${table}:${JSON.stringify(conditions)}` : null;
    
    const result = await this.executeQuery(sql, whereClause.params, {
      useCache,
      cacheKey
    });
    
    return result.rows[0] || null;
  }

  async findMany(table, conditions = {}, options = {}) {
    const {
      select = '*',
      orderBy = null,
      limit = null,
      offset = 0,
      useCache = false
    } = options;

    const whereClause = this.buildWhereClause(conditions);
    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
    const limitClause = limit ? ` LIMIT ${limit}` : '';
    const offsetClause = offset > 0 ? ` OFFSET ${offset}` : '';
    
    const sql = `SELECT ${select} FROM ${table}${whereClause.clause}${orderClause}${limitClause}${offsetClause}`;
    const cacheKey = useCache ? `findMany:${table}:${JSON.stringify(conditions)}:${JSON.stringify(options)}` : null;
    
    const result = await this.executeQuery(sql, whereClause.params, {
      useCache,
      cacheKey
    });
    
    return result.rows;
  }

  async count(table, conditions = {}) {
    const whereClause = this.buildWhereClause(conditions);
    const sql = `SELECT COUNT(*) as count FROM ${table}${whereClause.clause}`;
    
    const result = await this.executeQuery(sql, whereClause.params);
    return parseInt(result.rows[0].count, 10);
  }

  async insert(table, data) {
    return await this.executeWithMetrics(async () => {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`);
      
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await this.executeQuery(sql, values);
      
      return result.rows[0];
    }, 'insert');
  }

  async update(table, data, conditions) {
    return await this.executeWithMetrics(async () => {
      const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 1}`);
      const whereClause = this.buildWhereClause(conditions, Object.keys(data).length);
      
      const sql = `UPDATE ${table} SET ${setClause.join(', ')}${whereClause.clause} RETURNING *`;
      const params = [...Object.values(data), ...whereClause.params];
      
      const result = await this.executeQuery(sql, params);
      return result.rows;
    }, 'update');
  }

  async delete(table, conditions) {
    return await this.executeWithMetrics(async () => {
      const whereClause = this.buildWhereClause(conditions);
      const sql = `DELETE FROM ${table}${whereClause.clause} RETURNING *`;
      
      const result = await this.executeQuery(sql, whereClause.params);
      return result.rows;
    }, 'delete');
  }

  buildWhereClause(conditions, paramOffset = 0) {
    if (!conditions || Object.keys(conditions).length === 0) {
      return { clause: '', params: [] };
    }

    const clauses = [];
    const params = [];
    let paramIndex = paramOffset + 1;

    for (const [key, value] of Object.entries(conditions)) {
      if (value === null) {
        clauses.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`);
        clauses.push(`${key} IN (${placeholders.join(', ')})`);
        params.push(...value);
      } else if (typeof value === 'object' && value.operator) {
        clauses.push(`${key} ${value.operator} $${paramIndex++}`);
        params.push(value.value);
      } else {
        clauses.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }

    return {
      clause: ` WHERE ${clauses.join(' AND ')}`,
      params
    };
  }

  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  clearQueryCache(pattern = null) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  getQueryCacheStats() {
    return {
      size: this.queryCache.size,
      maxSize: 1000,
      hitRate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    // Simplified implementation
    return Math.random() * 100; // This would be tracked properly in a real implementation
  }
}

module.exports = DataAccessLayer;