# Getting Started with Cody Verse

## Quick Setup (5 Minutes)

### 1. Prerequisites Check
```bash
node --version    # Should be 20.x+
psql --version    # Should be 14.x+
```

### 2. Environment Setup
```bash
# Clone and install
git clone <repository-url>
cd codyverse-platform
npm install

# Database setup
createdb codyverse_dev
export DATABASE_URL="postgresql://username:password@localhost:5432/codyverse_dev"

# API key setup (optional for basic functionality)
export OPENAI_API_KEY="your-api-key-here"
```

### 3. Initialize and Start
```bash
# Push database schema
npm run db:push

# Start the server
npm start
```

### 4. Verify Installation
Open these URLs to confirm everything works:
- Main Application: http://localhost:5000
- API Documentation: http://localhost:5000/docs
- System Health: http://localhost:5000/health
- Performance Dashboard: http://localhost:5000/performance-optimization-dashboard.html

## First API Test

### Test Gamification System
```bash
# Get user dashboard
curl "http://localhost:5000/api/gamification/dashboard/1"

# Complete a lesson
curl -X POST "http://localhost:5000/api/gamification/lesson-complete/1" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": 1, "timeSpent": 30, "score": 95}'
```

### Expected Responses
Both requests should return JSON with `"success": true` and relevant data.

## Core Features Overview

### Gamification Engine
- **XP System**: Users earn experience points and level up from Novice to Grandmaster
- **Digital Wallet**: Coins and gems earned through lesson completion and achievements
- **Achievement Badges**: Unlockable rewards for various learning milestones
- **Daily Goals**: Customizable objectives for lessons, time spent, and XP targets
- **Streak Tracking**: Consistency rewards for daily engagement

### Educational Content
- **Course Management**: Structured learning paths with modules and lessons
- **Progress Tracking**: Detailed analytics on user learning progression
- **AI Integration**: Personalized content generation using OpenAI (requires API key)
- **Study Techniques**: Advanced learning optimization and technique recommendations

### Technical Features
- **Real-time Monitoring**: Performance metrics and system health dashboards
- **Intelligent Caching**: Sub-60ms response times with optimized data access
- **Comprehensive API**: RESTful endpoints with OpenAPI 3.0 documentation
- **Production Ready**: Scalable architecture with monitoring and error handling

## Development Workflow

### Making Changes
1. **Modify code** in appropriate directory (controllers/, services/, core/)
2. **Test locally** using the API endpoints or web interface
3. **Check performance** at http://localhost:5000/metrics
4. **Verify health** at http://localhost:5000/health

### Database Changes
```bash
# Update schema in shared/schema.ts
# Then push changes
npm run db:push
```

### Adding API Endpoints
1. **Add route** in routes/api.js
2. **Create controller method** extending BaseController
3. **Implement service logic** extending BaseService
4. **Update API documentation** in core/APIDocGenerator.js

## Production Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
OPENAI_API_KEY=sk-your-production-key
NODE_ENV=production
PORT=5000
```

### Deploy Options
- **Docker**: Use provided Dockerfile and docker-compose.yml
- **Heroku**: `git push heroku main` with configured environment
- **AWS/Cloud**: Follow DEPLOYMENT.md for platform-specific instructions

## Troubleshooting

### Common Issues

**Database connection errors**
```bash
# Check connection
psql $DATABASE_URL -c "SELECT version();"
```

**Slow response times**
```bash
# Check performance metrics
curl http://localhost:5000/metrics
```

**API errors**
```bash
# Check system health
curl http://localhost:5000/health
```

### Getting Help
- **API Documentation**: http://localhost:5000/docs
- **System Monitoring**: http://localhost:5000/performance-optimization-dashboard.html
- **Error Logs**: Check console output or log files
- **Architecture Guide**: See ARCHITECTURE.md for system design details

## Next Steps

### Explore Features
1. **Try the gamification system** by completing lessons and earning XP
2. **View performance dashboards** to understand system metrics
3. **Test API endpoints** using the interactive documentation
4. **Examine the codebase** starting with server.js and core/ directory

### Customize for Your Needs
1. **Modify gamification rules** in services/simplifiedGamificationService.js
2. **Add new course content** using the course management endpoints
3. **Customize UI components** in web/ directory
4. **Integrate additional AI services** following the OpenAI integration pattern

### Scale and Deploy
1. **Configure production environment** using DEPLOYMENT.md
2. **Set up monitoring** and alerting for production use
3. **Implement additional security** measures as needed
4. **Consider microservices** architecture for large-scale deployment

The platform is designed to be developer-friendly with comprehensive documentation, real-time monitoring, and production-ready architecture patterns.