import { memo, useMemo, useCallback, useState } from 'react';
import { Trophy, Target, BookOpen, Clock, Award } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { apiService } from '@/services/api';
import ProgressBar from '@/components/optimized/ProgressBar';
import StatCard from '@/components/optimized/StatCard';
import type { GamificationData, Course } from '@/types';

interface OptimizedDashboardProps {
  userId: string;
  theme?: 'teen' | 'adult' | 'professional';
}

const OptimizedDashboard = memo<OptimizedDashboardProps>(({ userId, theme = 'teen' }) => {
  const [courses] = useState<Course[]>([]);
  
  // Optimized API calls with caching
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError 
  } = useApi(
    useCallback(() => apiService.getGamificationDashboard(userId), [userId]),
    { immediate: true, dependencies: [userId] }
  );

  const { 
    data: coursesData, 
    loading: coursesLoading 
  } = useApi(
    useCallback(() => apiService.getCourses(), []),
    { immediate: true }
  );

  // Performance-optimized data processing
  const processedData = useMemo(() => {
    if (!dashboardData) return null;

    const data = dashboardData as GamificationData;
    
    return {
      stats: {
        xp: data.stats.totalXp,
        level: data.stats.level,
        streak: data.stats.streak,
        completedLessons: data.stats.completedLessons,
        badges: data.stats.badges,
        coins: data.stats.coins
      },
      progress: {
        weeklyGoal: data.stats.weeklyGoal || 100,
        weeklyProgress: data.stats.weeklyProgress || 65,
        levelProgress: ((data.stats.totalXp % 1000) / 1000) * 100
      },
      recentBadges: data.badges.slice(0, 3),
      notifications: data.notifications.filter(n => !n.isRead).slice(0, 5)
    };
  }, [dashboardData]);

  // Optimized course filtering and sorting
  const featuredCourses = useMemo(() => {
    if (!coursesData) return [];
    
    return coursesData
      .filter(course => course.isUnlocked && course.progress < 100)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [coursesData]);

  // Memoized theme classes
  const themeClasses = useMemo(() => ({
    teen: {
      container: 'bg-gradient-to-br from-purple-50 to-blue-50',
      card: 'bg-white border-2 border-purple-200',
      accent: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700'
    },
    adult: {
      container: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      card: 'bg-white border border-blue-200',
      accent: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700'
    },
    professional: {
      container: 'bg-gradient-to-br from-gray-50 to-slate-50',
      card: 'bg-white border border-gray-200',
      accent: 'text-slate-600',
      button: 'bg-slate-600 hover:bg-slate-700'
    }
  }[theme]), [theme]);

  // Optimized event handlers
  const handleLessonStart = useCallback(async (courseId: string, lessonId: string) => {
    console.log(`Starting lesson ${lessonId} in course ${courseId}`);
  }, []);

  const handleBadgeView = useCallback((badgeId: string) => {
    console.log(`Viewing badge ${badgeId}`);
  }, []);

  // Loading state optimization
  if (dashboardLoading || coursesLoading) {
    return (
      <div className={`min-h-screen p-6 ${themeClasses.container}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`p-6 rounded-lg animate-pulse ${themeClasses.card}`}>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (dashboardError || !processedData) {
    return (
      <div className={`min-h-screen p-6 ${themeClasses.container}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`p-8 rounded-lg text-center ${themeClasses.card}`}>
            <p className="text-gray-600">Unable to load dashboard data</p>
            <button 
              className={`mt-4 px-6 py-2 text-white rounded-lg ${themeClasses.button}`}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${themeClasses.container}`}>
      <div className="max-w-7xl mx-auto">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total XP"
            value={processedData.stats.xp.toLocaleString()}
            icon={<Trophy className="w-6 h-6" />}
            color="primary"
            trend="up"
            trendValue="+12% this week"
          />
          <StatCard
            title="Current Level"
            value={processedData.stats.level}
            icon={<Target className="w-6 h-6" />}
            color="success"
          />
          <StatCard
            title="Study Streak"
            value={`${processedData.stats.streak} days`}
            icon={<Clock className="w-6 h-6" />}
            color="warning"
            trend={processedData.stats.streak > 7 ? "up" : "neutral"}
            trendValue={processedData.stats.streak > 7 ? "Great streak!" : "Keep going!"}
          />
          <StatCard
            title="Completed Lessons"
            value={processedData.stats.completedLessons}
            icon={<BookOpen className="w-6 h-6" />}
            color="secondary"
          />
        </div>

        {/* Progress Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className={`p-6 rounded-lg ${themeClasses.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${themeClasses.accent}`}>Weekly Progress</h3>
            <ProgressBar
              progress={processedData.progress.weeklyProgress}
              total={processedData.progress.weeklyGoal}
              showLabel={true}
              size="lg"
              color="primary"
              animated={true}
            />
            <p className="text-sm text-gray-600 mt-2">
              {processedData.progress.weeklyProgress} / {processedData.progress.weeklyGoal} XP this week
            </p>
          </div>

          <div className={`p-6 rounded-lg ${themeClasses.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${themeClasses.accent}`}>Level Progress</h3>
            <ProgressBar
              progress={processedData.progress.levelProgress}
              showLabel={true}
              size="lg"
              color="success"
            />
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(processedData.progress.levelProgress)}% to Level {processedData.stats.level + 1}
            </p>
          </div>
        </div>

        {/* Recent Badges */}
        {processedData.recentBadges.length > 0 && (
          <div className={`p-6 rounded-lg mb-8 ${themeClasses.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${themeClasses.accent}`}>Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {processedData.recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleBadgeView(badge.id)}
                >
                  <Award className="w-8 h-8 text-yellow-500 mr-3" />
                  <div>
                    <h4 className="font-semibold">{badge.name}</h4>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Learning */}
        {featuredCourses.length > 0 && (
          <div className={`p-6 rounded-lg ${themeClasses.card}`}>
            <h3 className={`text-xl font-bold mb-4 ${themeClasses.accent}`}>Continue Learning</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <div key={course.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">{course.title}</h4>
                  <ProgressBar
                    progress={course.progress}
                    showLabel={true}
                    size="sm"
                    color="primary"
                  />
                  <button
                    className={`mt-3 w-full py-2 text-white rounded-lg text-sm ${themeClasses.button}`}
                    onClick={() => handleLessonStart(course.id, 'next')}
                  >
                    Continue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';

export default OptimizedDashboard;