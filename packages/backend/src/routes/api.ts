/**
 * API Routes - Modular route definitions
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '@codyverse/shared';

const router = Router();

// Sample API routes using shared utilities
router.get('/users', (req: Request, res: Response) => {
  const users = [
    { id: 1, name: 'João Silva', email: 'joao@example.com' },
    { id: 2, name: 'Maria Santos', email: 'maria@example.com' }
  ];
  
  res.json(createSuccessResponse(users, 'Users retrieved successfully'));
});

router.get('/courses', (req: Request, res: Response) => {
  const courses = [
    { 
      id: 1, 
      title: 'Fundamentos de IA', 
      difficulty: 'Iniciante',
      duration: 120 
    },
    { 
      id: 2, 
      title: 'Machine Learning Avançado', 
      difficulty: 'Avançado',
      duration: 240 
    }
  ];
  
  res.json(createSuccessResponse(courses, 'Courses retrieved successfully'));
});

router.get('/health/detailed', (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    packages: {
      shared: 'operational',
      backend: 'operational',
      frontend: 'configured'
    }
  };
  
  res.json(createSuccessResponse(healthData, 'Detailed health check'));
});

export default router;