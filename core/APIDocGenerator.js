const configManager = require('./ConfigManager');

class APIDocGenerator {
  constructor() {
    this.routes = new Map();
    this.schemas = new Map();
  }

  registerRoute(method, path, options = {}) {
    const {
      summary = '',
      description = '',
      parameters = [],
      requestBody = null,
      responses = {},
      tags = [],
      security = [],
      deprecated = false
    } = options;

    const routeKey = `${method.toUpperCase()} ${path}`;
    this.routes.set(routeKey, {
      method: method.toUpperCase(),
      path,
      summary,
      description,
      parameters,
      requestBody,
      responses,
      tags,
      security,
      deprecated
    });
  }

  registerSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  generateOpenAPISpec() {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'Cody Verse Educational Platform API',
        description: 'AI-powered educational platform with gamification features',
        version: '1.0.0',
        contact: {
          name: 'Cody Verse Support',
          url: 'https://codyverse.ai/support'
        }
      },
      servers: [
        {
          url: `http://${configManager.get('server.host')}:${configManager.get('server.port')}/api`,
          description: 'Development server'
        }
      ],
      paths: this.generatePaths(),
      components: {
        schemas: this.generateSchemas(),
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: this.generateTags()
    };

    return spec;
  }

  generatePaths() {
    const paths = {};

    for (const [routeKey, route] of this.routes.entries()) {
      const { path, method, ...routeInfo } = route;
      
      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][method.toLowerCase()] = {
        ...routeInfo,
        parameters: this.formatParameters(routeInfo.parameters),
        responses: this.formatResponses(routeInfo.responses)
      };
    }

    return paths;
  }

  generateSchemas() {
    const schemas = {};
    
    for (const [name, schema] of this.schemas.entries()) {
      schemas[name] = schema;
    }

    // Add common schemas
    schemas.ApiResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };

    schemas.ErrorResponse = {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string' },
        code: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    };

    schemas.User = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        name: { type: 'string' },
        totalXP: { type: 'integer' },
        level: { type: 'integer' },
        levelName: { type: 'string' },
        levelIcon: { type: 'string' }
      }
    };

    schemas.Wallet = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        userId: { type: 'integer' },
        coins: { type: 'integer' },
        gems: { type: 'integer' },
        totalCoinsEarned: { type: 'integer' },
        totalCoinsSpent: { type: 'integer' }
      }
    };

    schemas.Badge = {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        badgeName: { type: 'string' },
        badgeDescription: { type: 'string' },
        badgeIcon: { type: 'string' },
        badgeType: { type: 'string' },
        unlockedAt: { type: 'string', format: 'date-time' }
      }
    };

    return schemas;
  }

  generateTags() {
    return [
      { name: 'Gamification', description: 'User progress, badges, and rewards' },
      { name: 'Courses', description: 'Educational content and modules' },
      { name: 'Progress', description: 'User learning progress tracking' },
      { name: 'Health', description: 'System health and monitoring' }
    ];
  }

  formatParameters(parameters) {
    return parameters.map(param => ({
      name: param.name,
      in: param.in || 'query',
      description: param.description || '',
      required: param.required || false,
      schema: param.schema || { type: 'string' }
    }));
  }

  formatResponses(responses) {
    const formatted = {};
    
    for (const [code, response] of Object.entries(responses)) {
      formatted[code] = {
        description: response.description || '',
        content: response.content || {
          'application/json': {
            schema: response.schema || { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      };
    }

    if (!formatted['200']) {
      formatted['200'] = {
        description: 'Success',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ApiResponse' }
          }
        }
      };
    }

    if (!formatted['500']) {
      formatted['500'] = {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' }
          }
        }
      };
    }

    return formatted;
  }

  generateHTMLDoc() {
    const spec = this.generateOpenAPISpec();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cody Verse API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin:0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api-spec.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>`;
  }

  autoRegisterRoutes() {
    // Gamification routes
    this.registerRoute('GET', '/gamification/dashboard/{userId}', {
      summary: 'Get user gamification dashboard',
      description: 'Retrieve complete gamification data including level, badges, wallet, and goals',
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
      ],
      responses: {
        '200': {
          description: 'Dashboard data retrieved successfully',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  user: { $ref: '#/components/schemas/User' },
                  wallet: { $ref: '#/components/schemas/Wallet' },
                  badges: { type: 'array', items: { $ref: '#/components/schemas/Badge' } }
                }
              }
            }
          }
        }
      },
      tags: ['Gamification']
    });

    this.registerRoute('POST', '/gamification/lesson-complete/{userId}', {
      summary: 'Process lesson completion',
      description: 'Award XP, coins, and check for badge unlocks when a user completes a lesson',
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { type: 'integer' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                lessonId: { type: 'integer' },
                timeSpent: { type: 'integer' },
                score: { type: 'integer' }
              },
              required: ['lessonId']
            }
          }
        }
      },
      tags: ['Gamification']
    });

    // Health routes
    this.registerRoute('GET', '/health', {
      summary: 'System health check',
      description: 'Get comprehensive system health status including database, memory, and performance metrics',
      responses: {
        '200': {
          description: 'System is healthy',
          schema: {
            type: 'object',
            properties: {
              overall: { type: 'string' },
              database: { type: 'string' },
              memory: { type: 'string' },
              uptime: { type: 'number' }
            }
          }
        },
        '503': {
          description: 'System is unhealthy'
        }
      },
      tags: ['Health']
    });

    this.registerRoute('GET', '/metrics', {
      summary: 'Detailed system metrics',
      description: 'Get detailed performance and resource usage metrics',
      tags: ['Health']
    });
  }
}

module.exports = new APIDocGenerator();