# Cody Verse Deployment Guide

## Prerequisites

### System Requirements
- Node.js 20.x or higher
- PostgreSQL 14+ database
- Minimum 2GB RAM
- 10GB available disk space

### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database

# API Keys
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

# Performance Tuning
DB_POOL_MAX=20
DB_POOL_MIN=5
CACHE_DEFAULT_TTL=300000
RATE_LIMIT_MAX=200
```

## Local Development Setup

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd codyverse-platform
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb codyverse_dev

# Set environment variable
export DATABASE_URL="postgresql://username:password@localhost:5432/codyverse_dev"

# Push database schema
npm run db:push
```

### 3. Start Development Server
```bash
npm start
# Server will be available at http://localhost:5000
```

### 4. Verify Installation
```bash
# Test system health
curl http://localhost:5000/health

# Access API documentation
open http://localhost:5000/docs

# View performance dashboard
open http://localhost:5000/performance-optimization-dashboard.html
```

## Production Deployment

### Database Preparation
```sql
-- Create production database
CREATE DATABASE codyverse_production;

-- Create dedicated user
CREATE USER codyverse_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE codyverse_production TO codyverse_user;

-- Enable required extensions
\c codyverse_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Environment Configuration
Create `.env` file:
```bash
# Production Environment
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://codyverse_user:secure_password@db_host:5432/codyverse_production

# External Services
OPENAI_API_KEY=sk-your-production-key

# Performance Settings
DB_POOL_MAX=50
DB_POOL_MIN=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=10000

# Caching
CACHE_DEFAULT_TTL=300000
CACHE_MAX_SIZE=5000

# Security
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=500
```

### Application Deployment
```bash
# Install production dependencies
npm ci --production

# Run database migrations
npm run db:push

# Start with process manager
pm2 start server.js --name "codyverse-api" --instances max

# Or use systemd service
sudo systemctl start codyverse
sudo systemctl enable codyverse
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production && npm cache clean --force

COPY . .

EXPOSE 5000

USER node

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/codyverse
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=codyverse
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

## Cloud Platform Deployment

### Replit Deployment
```bash
# Configure environment variables in Replit Secrets
# DATABASE_URL, OPENAI_API_KEY, etc.

# Deploy using Replit's deployment system
# Application will be automatically available at your-repl.replit.app
```

### Heroku Deployment
```bash
# Create Heroku app
heroku create codyverse-platform

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set OPENAI_API_KEY=your_key_here
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### AWS Deployment
```bash
# Using Elastic Beanstalk
eb init codyverse-platform
eb create production

# Configure environment variables
eb setenv OPENAI_API_KEY=your_key_here
eb setenv DATABASE_URL=your_rds_url

# Deploy
eb deploy
```

## Load Balancer Configuration

### Nginx Configuration
```nginx
upstream codyverse_backend {
    server 127.0.0.1:5000;
    server 127.0.0.1:5001;
    server 127.0.0.1:5002;
}

server {
    listen 80;
    server_name codyverse.example.com;

    location / {
        proxy_pass http://codyverse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API documentation
    location /docs {
        proxy_pass http://codyverse_backend/docs;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://codyverse_backend/health;
        access_log off;
    }
}
```

## Monitoring Setup

### Health Check Configuration
```bash
# Create health check script
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ $response -eq 200 ]; then
    echo "Service is healthy"
    exit 0
else
    echo "Service is unhealthy (HTTP $response)"
    exit 1
fi
```

### Log Management
```bash
# Configure log rotation
sudo cat > /etc/logrotate.d/codyverse << EOF
/var/log/codyverse/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    create 644 node node
    postrotate
        systemctl reload codyverse
    endscript
}
EOF
```

### Performance Monitoring
```bash
# Set up monitoring endpoints
curl http://localhost:5000/metrics      # Performance metrics
curl http://localhost:5000/health       # System health
curl http://localhost:5000/cache-stats  # Cache performance
```

## Security Hardening

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Application-level rate limiting is already configured
```

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot
sudo certbot --nginx -d codyverse.example.com

# Auto-renewal
sudo crontab -e
0 2 * * * /usr/bin/certbot renew --quiet --nginx
```

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "/backups/codyverse_backup_$DATE.sql"

# Compress and upload to cloud storage
gzip "/backups/codyverse_backup_$DATE.sql"
aws s3 cp "/backups/codyverse_backup_$DATE.sql.gz" s3://your-backup-bucket/
```

### Application Backup
```bash
# Backup application files and configuration
tar -czf "codyverse_app_$(date +%Y%m%d).tar.gz" \
    /app/codyverse \
    /etc/nginx/sites-available/codyverse \
    /etc/systemd/system/codyverse.service
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Verify connection pool settings
curl http://localhost:5000/metrics | grep activeConnections
```

#### High Memory Usage
```bash
# Monitor memory usage
curl http://localhost:5000/metrics | grep memory

# Restart if necessary
pm2 restart codyverse-api
```

#### Performance Issues
```bash
# Check response times
curl http://localhost:5000/performance-optimization-dashboard.html

# Monitor slow queries
curl http://localhost:5000/metrics | grep slowQueries
```

### Log Analysis
```bash
# View application logs
tail -f /var/log/codyverse/app.log

# Search for errors
grep "error" /var/log/codyverse/app.log | tail -20

# Monitor API requests
grep "API" /var/log/codyverse/app.log | tail -10
```

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple application instances behind load balancer
- Use Redis for distributed caching
- Implement database read replicas

### Performance Optimization
- Enable database query caching
- Implement CDN for static assets
- Configure application-level caching
- Optimize database queries and indexes

### Monitoring at Scale
- Implement centralized logging with ELK stack
- Set up application performance monitoring (APM)
- Configure alerting for critical metrics
- Regular performance testing and optimization

This deployment guide provides comprehensive instructions for deploying the Cody Verse platform in various environments while maintaining security, performance, and reliability standards.