-- Advanced Database Optimizations for CodyVerse
-- Performance indexes and query optimizations

-- Critical performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_wallet_user_id 
ON user_wallet(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_streaks_user_type 
ON user_streaks(user_id, streak_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_badges_user_earned 
ON user_badges(user_id, earned_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_goals_user_date 
ON daily_goals(user_id, goal_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gamification_notifications_user_created 
ON gamification_notifications(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user_lesson 
ON user_progress(user_id, lesson_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_module_order 
ON lessons(module_id, lesson_order);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_date_type 
ON daily_goals(user_id, goal_date, goal_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read_created 
ON gamification_notifications(user_id, is_read, created_at DESC);

-- Partial indexes for optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unread_notifications 
ON gamification_notifications(user_id, created_at DESC) 
WHERE is_read = false;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_active_goals 
ON daily_goals(user_id, goal_date) 
WHERE is_completed = false;

-- Statistics update for query planner
ANALYZE user_wallet;
ANALYZE user_streaks;
ANALYZE user_badges;
ANALYZE daily_goals;
ANALYZE gamification_notifications;
ANALYZE user_progress;
ANALYZE lessons;

-- Materialized view for dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_summary AS
SELECT 
  u.id as user_id,
  u.name,
  u.total_xp,
  w.coins,
  w.gems,
  s.current_streak,
  s.longest_streak,
  COUNT(b.id) as badge_count,
  COUNT(CASE WHEN g.is_completed = false THEN 1 END) as active_goals,
  COUNT(CASE WHEN n.is_read = false THEN 1 END) as unread_notifications
FROM users u
LEFT JOIN user_wallet w ON u.id = w.user_id
LEFT JOIN user_streaks s ON u.id = s.user_id AND s.streak_type = 'daily_lesson'
LEFT JOIN user_badges b ON u.id = b.user_id
LEFT JOIN daily_goals g ON u.id = g.user_id AND g.goal_date = CURRENT_DATE
LEFT JOIN gamification_notifications n ON u.id = n.user_id
GROUP BY u.id, u.name, u.total_xp, w.coins, w.gems, s.current_streak, s.longest_streak;

CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_user 
ON user_dashboard_summary(user_id);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_summary;
END;
$$ LANGUAGE plpgsql;

-- Automated refresh every 5 minutes (requires pg_cron extension in production)
-- SELECT cron.schedule('refresh-dashboard', '*/5 * * * *', 'SELECT refresh_dashboard_summary();');

-- Database configuration optimizations
-- These would be set in postgresql.conf in production
/*
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.7
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
*/

-- Connection pooling optimization
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Vacuum and analyze automation
CREATE OR REPLACE FUNCTION maintenance_routine()
RETURNS void AS $$
BEGIN
  -- Vacuum frequently updated tables
  VACUUM ANALYZE user_wallet;
  VACUUM ANALYZE user_streaks;
  VACUUM ANALYZE daily_goals;
  VACUUM ANALYZE gamification_notifications;
  
  -- Update table statistics
  ANALYZE users;
  ANALYZE lessons;
  ANALYZE courses;
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view
CREATE OR REPLACE VIEW query_performance AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;