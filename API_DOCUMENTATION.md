# Cody Verse API Documentation

## Overview
The Cody Verse API provides comprehensive endpoints for managing the educational platform, including gamification features, user progress tracking, course management, and system monitoring.

**Base URL**: `http://localhost:5000/api`
**API Version**: 2.0.0

## Authentication
Currently, the API operates without authentication for development purposes. Production deployment will require JWT token authentication.

## Core Endpoints

### Gamification System

#### Get User Dashboard
**GET** `/gamification/dashboard/{userId}`

Retrieves complete gamification data for a user including level, badges, wallet, goals, and notifications.

**Parameters:**
- `userId` (path, required): User ID (integer)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Test User",
      "totalXP": 750,
      "level": 4,
      "levelName": "Learner",
      "levelIcon": "📚",
      "xpToNext": 250,
      "xpProgress": 75.0
    },
    "wallet": {
      "id": 1,
      "user_id": 1,
      "coins": 240,
      "gems": 0,
      "total_coins_earned": 240,
      "total_coins_spent": 0
    },
    "badges": [],
    "goals": [
      {
        "id": 1,
        "goal_type": "lessons",
        "target_value": 3,
        "current_progress": 3,
        "is_completed": true,
        "rewards_coins": 50,
        "rewards_xp": 100
      }
    ],
    "notifications": []
  }
}
```

#### Process Lesson Completion
**POST** `/gamification/lesson-complete/{userId}`

Awards XP and coins when a user completes a lesson, checks for badge unlocks and goal achievements.

**Parameters:**
- `userId` (path, required): User ID (integer)

**Request Body:**
```json
{
  "lessonId": 1,
  "timeSpent": 30,
  "score": 95
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "xpAwarded": 147,
    "coinsAwarded": 24,
    "newBadges": [],
    "streakUpdated": true
  }
}
```

### Course Management

#### Get All Courses
**GET** `/courses`

Retrieves all available courses with their modules and basic information.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Introduction to AI",
      "description": "Learn the fundamentals of artificial intelligence",
      "modules": [
        {
          "id": 1,
          "title": "AI Basics",
          "lessons_count": 5
        }
      ]
    }
  ]
}
```

#### Get Course by ID
**GET** `/courses/{courseId}`

Retrieves detailed information about a specific course.

**Parameters:**
- `courseId` (path, required): Course ID (integer)

#### Get Course Lessons
**GET** `/courses/{courseId}/lessons`

Retrieves all lessons for a specific course module.

**Parameters:**
- `courseId` (path, required): Course ID (integer)
- `moduleId` (query, optional): Filter by module ID

### User Progress

#### Get User Progress
**GET** `/progress/user/{userId}`

Retrieves comprehensive progress information for a user across all courses.

**Parameters:**
- `userId` (path, required): User ID (integer)

#### Update Lesson Progress
**POST** `/progress/lesson/{userId}`

Updates progress for a specific lesson completion.

**Request Body:**
```json
{
  "lessonId": 1,
  "moduleId": 1,
  "completed": true,
  "timeSpent": 25,
  "score": 88
}
```

## System Monitoring

### Health Check
**GET** `/health`

Returns comprehensive system health status including database connectivity, memory usage, and performance metrics.

**Response:**
```json
{
  "overall": "healthy",
  "database": "healthy",
  "memory": "healthy",
  "uptime": 3600,
  "metrics": {
    "requests": 150,
    "errors": 2,
    "slowQueries": 0,
    "activeConnections": 5
  }
}
```

### Performance Metrics
**GET** `/metrics`

Returns detailed performance and resource usage metrics.

**Response:**
```json
{
  "system": {
    "uptime": 3600,
    "nodeVersion": "v20.18.1",
    "platform": "linux"
  },
  "memory": {
    "heapUsed": 15,
    "heapTotal": 17,
    "external": 3,
    "rss": 72
  },
  "metrics": {
    "requests": 150,
    "errors": 2,
    "slowQueries": 0,
    "activeConnections": 5
  }
}
```

### Cache Statistics
**GET** `/cache-stats`

Returns cache performance statistics and hit rates.

**Response:**
```json
{
  "hits": 95,
  "misses": 15,
  "sets": 50,
  "deletes": 2,
  "hitRate": 86.4,
  "size": 48,
  "maxSize": 1000
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-12T12:00:00.000Z"
}
```

### Common Error Codes
- `INVALID_USER_ID`: User ID must be a valid number
- `USER_NOT_FOUND`: Specified user does not exist
- `LESSON_NOT_FOUND`: Specified lesson does not exist
- `INTERNAL_ERROR`: General server error
- `VALIDATION_ERROR`: Request validation failed

## Rate Limiting
- Default limit: 200 requests per minute per IP
- Rate limit headers included in responses
- Exceeded limits return HTTP 429 status

## Response Times
- Target response time: < 60ms
- Cached responses: < 10ms
- Database queries: < 50ms
- Complex operations: < 200ms

## Development Tools

### Interactive Documentation
Access Swagger UI at: `http://localhost:5000/docs`

### OpenAPI Specification
Download specification: `http://localhost:5000/api-spec.json`

### Real-time Monitoring
- Performance Dashboard: `http://localhost:5000/performance-optimization-dashboard.html`
- System Monitoring: `http://localhost:5000/system-monitoring-dashboard.html`

## SDK and Examples

### JavaScript/Node.js Example
```javascript
// Get user dashboard
const response = await fetch('/api/gamification/dashboard/1');
const data = await response.json();

// Complete a lesson
await fetch('/api/gamification/lesson-complete/1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lessonId: 1,
    timeSpent: 30,
    score: 95
  })
});
```

### cURL Examples
```bash
# Get user dashboard
curl "http://localhost:5000/api/gamification/dashboard/1"

# Complete lesson
curl -X POST "http://localhost:5000/api/gamification/lesson-complete/1" \
  -H "Content-Type: application/json" \
  -d '{"lessonId": 1, "timeSpent": 30, "score": 95}'

# Check system health
curl "http://localhost:5000/health"
```

## Support
For API support and questions, refer to the interactive documentation or check the system monitoring dashboards for real-time performance metrics.