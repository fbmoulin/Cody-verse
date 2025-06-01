import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:flutter/foundation.dart';
import '../../core/constants/app_constants.dart';
import 'storage_service.dart';

class AnalyticsService {
  static final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;
  static final FirebaseAnalyticsObserver _observer = FirebaseAnalyticsObserver(analytics: _analytics);
  
  // Get observer for navigation tracking
  static FirebaseAnalyticsObserver get observer => _observer;

  // Initialize analytics
  static Future<void> initialize() async {
    try {
      // Set analytics collection enabled (respect user preferences)
      final analyticsEnabled = await StorageService.getBool('analytics_enabled') ?? true;
      await _analytics.setAnalyticsCollectionEnabled(analyticsEnabled);
      
      // Set user properties for tracking
      await _analytics.setUserProperty(name: 'app_version', value: AppConstants.appVersion);
      await _analytics.setUserProperty(name: 'platform', value: defaultTargetPlatform.name);
      
      print('Analytics initialized');
    } catch (e) {
      print('Error initializing analytics: $e');
    }
  }

  // User Management
  static Future<void> setUserId(String userId) async {
    try {
      await _analytics.setUserId(id: userId);
    } catch (e) {
      print('Error setting user ID: $e');
    }
  }

  static Future<void> setUserProperties({
    required String level,
    required String totalXP,
    required String completedLessons,
    required String streakDays,
  }) async {
    try {
      await _analytics.setUserProperty(name: 'user_level', value: level);
      await _analytics.setUserProperty(name: 'total_xp', value: totalXP);
      await _analytics.setUserProperty(name: 'completed_lessons', value: completedLessons);
      await _analytics.setUserProperty(name: 'streak_days', value: streakDays);
    } catch (e) {
      print('Error setting user properties: $e');
    }
  }

  // Screen Tracking
  static Future<void> trackScreenView(String screenName, {String? screenClass}) async {
    try {
      await _analytics.logScreenView(
        screenName: screenName,
        screenClass: screenClass ?? screenName,
      );
    } catch (e) {
      print('Error tracking screen view: $e');
    }
  }

  // Learning Events
  static Future<void> trackLessonStarted({
    required String lessonId,
    required String lessonTitle,
    required String category,
    required String difficulty,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'lesson_started',
        parameters: {
          'lesson_id': lessonId,
          'lesson_title': lessonTitle,
          'category': category,
          'difficulty': difficulty,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking lesson started: $e');
    }
  }

  static Future<void> trackLessonCompleted({
    required String lessonId,
    required String lessonTitle,
    required String category,
    required String difficulty,
    required int duration, // in seconds
    required int xpGained,
    required double completionPercentage,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'lesson_completed',
        parameters: {
          'lesson_id': lessonId,
          'lesson_title': lessonTitle,
          'category': category,
          'difficulty': difficulty,
          'duration_seconds': duration,
          'xp_gained': xpGained,
          'completion_percentage': completionPercentage,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking lesson completed: $e');
    }
  }

  static Future<void> trackQuizAttempted({
    required String lessonId,
    required int questionsTotal,
    required int questionsCorrect,
    required double score,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'quiz_attempted',
        parameters: {
          'lesson_id': lessonId,
          'questions_total': questionsTotal,
          'questions_correct': questionsCorrect,
          'score_percentage': score,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking quiz attempt: $e');
    }
  }

  // Gamification Events
  static Future<void> trackXPGained({
    required int amount,
    required String source, // 'lesson', 'achievement', 'streak', etc.
    String? sourceId,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'xp_gained',
        parameters: {
          'xp_amount': amount,
          'xp_source': source,
          'source_id': sourceId ?? '',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking XP gained: $e');
    }
  }

  static Future<void> trackLevelUp({
    required int newLevel,
    required int totalXP,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'level_up',
        parameters: {
          'new_level': newLevel,
          'total_xp': totalXP,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking level up: $e');
    }
  }

  static Future<void> trackAchievementUnlocked({
    required String achievementId,
    required String achievementTitle,
    required String achievementType,
    required int xpReward,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'achievement_unlocked',
        parameters: {
          'achievement_id': achievementId,
          'achievement_title': achievementTitle,
          'achievement_type': achievementType,
          'xp_reward': xpReward,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking achievement unlocked: $e');
    }
  }

  static Future<void> trackStreakUpdated({
    required int streakDays,
    required bool streakBroken,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'streak_updated',
        parameters: {
          'streak_days': streakDays,
          'streak_broken': streakBroken,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking streak update: $e');
    }
  }

  // User Engagement
  static Future<void> trackAppOpened({
    String? source,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'app_opened',
        parameters: {
          'source': source ?? 'direct',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking app opened: $e');
    }
  }

  static Future<void> trackFeatureUsed({
    required String featureName,
    Map<String, dynamic>? additionalParams,
  }) async {
    try {
      final parameters = {
        'feature_name': featureName,
        'timestamp': DateTime.now().toIso8601String(),
        ...?additionalParams,
      };
      
      await _analytics.logEvent(
        name: 'feature_used',
        parameters: parameters,
      );
    } catch (e) {
      print('Error tracking feature usage: $e');
    }
  }

  static Future<void> trackTimeSpent({
    required String screenName,
    required int durationSeconds,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'time_spent',
        parameters: {
          'screen_name': screenName,
          'duration_seconds': durationSeconds,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking time spent: $e');
    }
  }

  // Community Events
  static Future<void> trackCommunityPostCreated({
    required String postId,
    required String category,
    required String postType,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'community_post_created',
        parameters: {
          'post_id': postId,
          'category': category,
          'post_type': postType,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking community post: $e');
    }
  }

  static Future<void> trackCommunityInteraction({
    required String interactionType, // 'like', 'reply', 'share'
    required String postId,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'community_interaction',
        parameters: {
          'interaction_type': interactionType,
          'post_id': postId,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking community interaction: $e');
    }
  }

  // Lab/Practice Events
  static Future<void> trackLabExerciseStarted({
    required String exerciseId,
    required String exerciseType,
    required String category,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'lab_exercise_started',
        parameters: {
          'exercise_id': exerciseId,
          'exercise_type': exerciseType,
          'category': category,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking lab exercise started: $e');
    }
  }

  static Future<void> trackLabExerciseCompleted({
    required String exerciseId,
    required String exerciseType,
    required bool successful,
    required int attemptCount,
    required int durationSeconds,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'lab_exercise_completed',
        parameters: {
          'exercise_id': exerciseId,
          'exercise_type': exerciseType,
          'successful': successful,
          'attempt_count': attemptCount,
          'duration_seconds': durationSeconds,
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking lab exercise completed: $e');
    }
  }

  // Error and Performance Tracking
  static Future<void> trackError({
    required String errorType,
    required String errorMessage,
    String? screenName,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final parameters = {
        'error_type': errorType,
        'error_message': errorMessage,
        'screen_name': screenName ?? 'unknown',
        'timestamp': DateTime.now().toIso8601String(),
        ...?additionalData,
      };
      
      await _analytics.logEvent(
        name: 'app_error',
        parameters: parameters,
      );
    } catch (e) {
      print('Error tracking error: $e');
    }
  }

  static Future<void> trackPerformance({
    required String metricName,
    required double value,
    String? unit,
  }) async {
    try {
      await _analytics.logEvent(
        name: 'performance_metric',
        parameters: {
          'metric_name': metricName,
          'metric_value': value,
          'metric_unit': unit ?? 'unknown',
          'timestamp': DateTime.now().toIso8601String(),
        },
      );
    } catch (e) {
      print('Error tracking performance: $e');
    }
  }

  // Settings and Preferences
  static Future<void> enableAnalytics() async {
    try {
      await _analytics.setAnalyticsCollectionEnabled(true);
      await StorageService.saveBool('analytics_enabled', true);
    } catch (e) {
      print('Error enabling analytics: $e');
    }
  }

  static Future<void> disableAnalytics() async {
    try {
      await _analytics.setAnalyticsCollectionEnabled(false);
      await StorageService.saveBool('analytics_enabled', false);
    } catch (e) {
      print('Error disabling analytics: $e');
    }
  }

  static Future<bool> isAnalyticsEnabled() async {
    try {
      return await StorageService.getBool('analytics_enabled') ?? true;
    } catch (e) {
      print('Error checking analytics status: $e');
      return true;
    }
  }

  // Custom Events
  static Future<void> logCustomEvent({
    required String eventName,
    Map<String, dynamic>? parameters,
  }) async {
    try {
      final eventParams = {
        'timestamp': DateTime.now().toIso8601String(),
        ...?parameters,
      };
      
      await _analytics.logEvent(
        name: eventName,
        parameters: eventParams,
      );
    } catch (e) {
      print('Error logging custom event: $e');
    }
  }
}
