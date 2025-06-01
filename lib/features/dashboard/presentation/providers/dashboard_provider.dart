import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../learning/presentation/providers/learning_provider.dart';
import '../../../gamification/presentation/providers/gamification_provider.dart';
import '../../../../shared/models/achievement_model.dart';
import '../../../../shared/models/lesson_model.dart';
import '../../../../shared/services/analytics_service.dart';

final dashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return {};

  // Track dashboard view
  await AnalyticsService.trackScreenView('dashboard');

  return {
    'user': user,
    'lastUpdated': DateTime.now(),
  };
});

final recentLessonsProvider = FutureProvider<List<LessonModel>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return [];

  // Get lessons that the user hasn't completed yet
  final allLessons = await ref.watch(lessonsProvider.future);
  final completedLessons = user.completedLessons;

  final incompleteLessons = allLessons
      .where((lesson) => !completedLessons.contains(lesson.id))
      .toList();

  // Sort by difficulty and order, return first 5
  incompleteLessons.sort((a, b) {
    if (a.difficulty.index != b.difficulty.index) {
      return a.difficulty.index.compareTo(b.difficulty.index);
    }
    return a.order.compareTo(b.order);
  });

  return incompleteLessons.take(5).toList();
});

final userProgressProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return {};

  final allLessons = await ref.watch(lessonsProvider.future);
  final completedLessons = user.completedLessons;

  // Overall progress
  final totalLessons = allLessons.length;
  final completedCount = completedLessons.length;

  // Category-specific progress
  final mcpLessons = allLessons.where((l) => l.category.toLowerCase().contains('mcp')).toList();
  final aiLessons = allLessons.where((l) => l.category.toLowerCase().contains('ai')).toList();

  final completedMcpLessons = mcpLessons
      .where((l) => completedLessons.contains(l.id))
      .length;
  final completedAiLessons = aiLessons
      .where((l) => completedLessons.contains(l.id))
      .length;

  final mcpProgress = mcpLessons.isNotEmpty 
      ? (completedMcpLessons / mcpLessons.length * 100).round()
      : 0;
  final aiProgress = aiLessons.isNotEmpty 
      ? (completedAiLessons / aiLessons.length * 100).round()
      : 0;

  return {
    'totalLessons': totalLessons,
    'completedLessons': completedCount,
    'mcpProgress': mcpProgress,
    'aiProgress': aiProgress,
    'overallProgress': totalLessons > 0 ? (completedCount / totalLessons * 100).round() : 0,
  };
});

final recentAchievementsProvider = FutureProvider<List<AchievementModel>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return [];

  final allAchievements = ref.watch(availableAchievementsProvider);
  
  return allAchievements.when(
    data: (achievements) {
      // Filter to only unlocked achievements and sort by unlock date
      final unlockedAchievements = achievements
          .where((achievement) => user.unlockedAchievements.contains(achievement.id))
          .toList();

      // Sort by rarity and return most recent
      unlockedAchievements.sort((a, b) {
        final rarityOrder = {'legendary': 0, 'epic': 1, 'rare': 2, 'common': 3};
        return rarityOrder[a.rarity.name]!.compareTo(rarityOrder[b.rarity.name]!);
      });

      return unlockedAchievements.take(3).toList();
    },
    loading: () => <AchievementModel>[],
    error: (_, __) => <AchievementModel>[],
  );
});

final dailyStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return {};

  final today = DateTime.now();
  final startOfDay = DateTime(today.year, today.month, today.day);

  // Check if user has been active today
  final lastActiveDate = user.lastActiveDate;
  final wasActiveToday = lastActiveDate.isAfter(startOfDay);

  // Calculate daily XP goal (could be configurable)
  const dailyXpGoal = 200;
  
  // For now, we'll estimate daily XP as progress since start of day
  // In a real app, you'd track this more precisely
  final dailyXp = wasActiveToday ? (dailyXpGoal * 0.6).round() : 0;

  return {
    'dailyXp': dailyXp,
    'dailyXpGoal': dailyXpGoal,
    'wasActiveToday': wasActiveToday,
    'streak': user.streak,
    'isOnStreak': user.isOnStreak,
  };
});

final weeklyStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return {};

  // Calculate weekly stats
  // In a real app, you'd store and track this data more precisely
  final completedThisWeek = (user.completedLessons.length * 0.3).round();
  const weeklyGoal = 10;

  return {
    'lessonsCompletedThisWeek': completedThisWeek,
    'weeklyLessonGoal': weeklyGoal,
    'weeklyXp': user.xp > 1000 ? 150 : user.xp ~/ 10,
    'weeklyXpGoal': 500,
  };
});

final leaderboardPreviewProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // In a real app, this would fetch from a leaderboard service
  // For now, return mock data structure
  return [
    {
      'rank': 1,
      'displayName': 'AI Master',
      'xp': 2500,
      'level': 6,
    },
    {
      'rank': 2,
      'displayName': 'Code Ninja',
      'xp': 2200,
      'level': 5,
    },
    {
      'rank': 3,
      'displayName': 'ML Explorer',
      'xp': 1800,
      'level': 4,
    },
  ];
});

final upcomingEventsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  // In a real app, this would fetch from an events service
  return [
    {
      'title': 'Weekly Challenge: MCP Fundamentals',
      'description': 'Complete 5 MCP lessons this week',
      'endDate': DateTime.now().add(const Duration(days: 4)),
      'reward': 500,
      'type': 'challenge',
    },
    {
      'title': 'Community Spotlight',
      'description': 'Share your learning progress',
      'endDate': DateTime.now().add(const Duration(days: 2)),
      'reward': 200,
      'type': 'community',
    },
  ];
});

final learningRecommendationsProvider = FutureProvider<List<LessonModel>>((ref) async {
  final user = ref.watch(userProvider);
  if (user == null) return [];

  final allLessons = await ref.watch(lessonsProvider.future);
  final completedLessons = user.completedLessons;

  // Get lessons user hasn't completed
  final availableLessons = allLessons
      .where((lesson) => !completedLessons.contains(lesson.id))
      .toList();

  // Simple recommendation: next lessons in order within user's level range
  final userLevel = user.level;
  final recommendedDifficulties = <DifficultyLevel>[];
  
  if (userLevel <= 2) {
    recommendedDifficulties.add(DifficultyLevel.beginner);
  } else if (userLevel <= 5) {
    recommendedDifficulties.addAll([DifficultyLevel.beginner, DifficultyLevel.intermediate]);
  } else if (userLevel <= 8) {
    recommendedDifficulties.addAll([DifficultyLevel.intermediate, DifficultyLevel.advanced]);
  } else {
    recommendedDifficulties.addAll(DifficultyLevel.values);
  }

  final recommendedLessons = availableLessons
      .where((lesson) => recommendedDifficulties.contains(lesson.difficulty))
      .toList();

  // Sort by order and return top 3
  recommendedLessons.sort((a, b) => a.order.compareTo(b.order));
  
  return recommendedLessons.take(3).toList();
});

// Dashboard action providers
final refreshDashboardProvider = Provider<void Function()>((ref) {
  return () {
    ref.invalidate(dashboardProvider);
    ref.invalidate(recentLessonsProvider);
    ref.invalidate(userProgressProvider);
    ref.invalidate(recentAchievementsProvider);
    ref.invalidate(dailyStatsProvider);
    ref.invalidate(weeklyStatsProvider);
  };
});

// Notification providers for dashboard
final pendingNotificationsProvider = StateProvider<List<Map<String, dynamic>>>((ref) {
  return [];
});

final hasPendingNotificationsProvider = Provider<bool>((ref) {
  final notifications = ref.watch(pendingNotificationsProvider);
  return notifications.isNotEmpty;
});
