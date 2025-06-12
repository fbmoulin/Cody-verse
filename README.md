# Cody Verse - AI-Powered Educational Platform

An advanced educational platform delivering personalized, adaptive learning experiences through intelligent content generation and comprehensive gamification technologies.

## Features

### Core Educational System
- **AI-Driven Content Generation**: Dynamic, personalized educational content using OpenAI integration
- **Intelligent Study Techniques**: Advanced learning optimization with personalized study plans
- **Adaptive Learning Analytics**: Real-time progress tracking and performance insights
- **Multilingual Support**: Comprehensive internationalization for global accessibility

### Gamification Engine
- **User Progression System**: Levels, XP tracking, and achievement milestones
- **Digital Wallet**: Coins, gems, and rewards management
- **Badge System**: Achievement recognition and accomplishment tracking
- **Goal Setting**: Daily objectives and progress monitoring
- **Streak Tracking**: Engagement consistency rewards
- **Leaderboards**: Community competition and motivation

### Technical Architecture
- **Production-Ready Backend**: Node.js/Express with PostgreSQL database
- **Enhanced Performance**: Sub-60ms response times with intelligent caching
- **Robust Monitoring**: Real-time health checks and performance metrics
- **Comprehensive Documentation**: OpenAPI 3.0 specification with interactive Swagger UI
- **Security & Resilience**: Rate limiting, circuit breakers, and graceful error handling

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- OpenAI API key

### Installation
```bash
npm install
npm run db:push
npm start
```

### Environment Variables
```bash
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_key
PORT=5000
```

## API Documentation

Access interactive API documentation at:
- **Swagger UI**: `http://localhost:5000/docs`
- **OpenAPI Spec**: `http://localhost:5000/api-spec.json`

## Monitoring & Analytics

### Real-Time Dashboards
- **System Health**: `http://localhost:5000/health`
- **Performance Metrics**: `http://localhost:5000/metrics`
- **Performance Dashboard**: `http://localhost:5000/performance-optimization-dashboard.html`
- **System Monitoring**: `http://localhost:5000/system-monitoring-dashboard.html`

### Key Endpoints
- **Gamification Dashboard**: `GET /api/gamification/dashboard/{userId}`
- **Lesson Completion**: `POST /api/gamification/lesson-complete/{userId}`
- **User Progress**: `GET /api/progress/user/{userId}`
- **Course Management**: `GET /api/courses`

## Architecture Overview

### Core Components
- **BaseService**: Standardized service layer with metrics and caching
- **BaseController**: Unified request handling and error management  
- **ConfigManager**: Centralized configuration with validation
- **DataAccessLayer**: Optimized database operations with query caching
- **APIDocGenerator**: Automated OpenAPI specification generation

### Performance Optimizations
- Intelligent caching system with TTL management
- Connection pooling with circuit breaker patterns
- Rate limiting and request throttling
- Graceful shutdown and error recovery
- Query optimization and batch processing

## Development

### Database Management
```bash
# Push schema changes
npm run db:push

# View database status
curl http://localhost:5000/health
```

### Testing
```bash
# Run performance tests
curl http://localhost:5000/metrics

# Test gamification system
curl -X POST http://localhost:5000/api/gamification/lesson-complete/1 \
  -H "Content-Type: application/json" \
  -d '{"lessonId": 1, "timeSpent": 30, "score": 95}'
```

## Production Deployment

The platform is optimized for production with:
- Comprehensive error handling and logging
- Real-time performance monitoring
- Database connection pooling
- Automatic health checks
- Security middleware and rate limiting

## License

This project is proprietary software for educational purposes.
