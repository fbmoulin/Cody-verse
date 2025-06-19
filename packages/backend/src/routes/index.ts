/**
 * Configuração de rotas principais
 */

import { Application } from 'express';
import { createApiResponse } from '@codyverse/shared';

export function setupRoutes(app: Application) {
  // API base route
  app.get('/api', (req, res) => {
    res.json(createApiResponse(true, {
      name: 'CodyVerse API',
      version: '1.0.0',
      description: 'Educational platform API with modular architecture',
      endpoints: {
        health: '/health',
        api: '/api',
        courses: '/api/courses',
        lessons: '/api/lessons',
        users: '/api/users',
        auth: '/api/auth'
      }
    }));
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json(createApiResponse(false, null, 'Endpoint not found'));
  });

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(err.stack);
    res.status(500).json(createApiResponse(false, null, 'Internal server error'));
  });
}