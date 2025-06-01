import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_constants.dart';
import 'storage_service.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _fcmToken;

  static Future<void> initialize() async {
    try {
      // Request permission for notifications
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('User granted notification permissions');
        
        // Get FCM token
        _fcmToken = await _messaging.getToken();
        print('FCM Token: $_fcmToken');
        
        // Save token to storage for backend registration
        if (_fcmToken != null) {
          await StorageService.saveString('fcm_token', _fcmToken!);
        }

        // Setup message handlers
        _setupMessageHandlers();
        
        // Setup background message handler
        FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
        
        // Handle app opened from notification
        _handleInitialMessage();
      } else {
        print('User declined or has not accepted notification permissions');
      }
    } catch (e) {
      print('Error initializing notifications: $e');
    }
  }

  static void _setupMessageHandlers() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.messageId}');
      _showForegroundNotification(message);
    });

    // Handle notification taps when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('App opened from notification: ${message.messageId}');
      _handleNotificationTap(message);
    });
  }

  static Future<void> _handleInitialMessage() async {
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      print('App opened from terminated state via notification: ${initialMessage.messageId}');
      _handleNotificationTap(initialMessage);
    }
  }

  static void _showForegroundNotification(RemoteMessage message) {
    // This would typically show a local notification or in-app notification
    // For now, we'll just log the message
    print('Foreground notification: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
    
    // You could implement a custom notification widget here
    // or use a package like flutter_local_notifications
  }

  static void _handleNotificationTap(RemoteMessage message) {
    // Handle navigation based on notification data
    final data = message.data;
    
    switch (data['type']) {
      case 'lesson_reminder':
        // Navigate to learning screen
        break;
      case 'achievement_unlocked':
        // Navigate to achievements screen
        break;
      case 'community_reply':
        // Navigate to community post
        break;
      case 'streak_reminder':
        // Navigate to dashboard with streak info
        break;
      default:
        // Navigate to dashboard
        break;
    }
  }

  // Schedule daily learning reminders
  static Future<void> scheduleDailyReminder({
    required int hour,
    required int minute,
    String title = 'Time to Learn!',
    String body = 'Continue your learning journey in Cody Verse',
  }) async {
    try {
      // Store reminder preferences
      await StorageService.saveBool('daily_reminders_enabled', true);
      await StorageService.saveInt('reminder_hour', hour);
      await StorageService.saveInt('reminder_minute', minute);
      
      // This would typically use flutter_local_notifications
      // to schedule local notifications since Firebase doesn't
      // support scheduled notifications directly
      print('Daily reminder scheduled for $hour:$minute');
    } catch (e) {
      print('Error scheduling daily reminder: $e');
    }
  }

  // Cancel daily reminders
  static Future<void> cancelDailyReminder() async {
    try {
      await StorageService.saveBool('daily_reminders_enabled', false);
      // Cancel local notifications here
      print('Daily reminders cancelled');
    } catch (e) {
      print('Error cancelling daily reminder: $e');
    }
  }

  // Send achievement notification
  static Future<void> showAchievementNotification({
    required String title,
    required String description,
    required int xpGained,
  }) async {
    try {
      // This would show a local notification for achievement unlocked
      print('Achievement unlocked: $title');
      print('XP gained: $xpGained');
      
      // Store achievement notification for display in app
      final achievementData = {
        'title': title,
        'description': description,
        'xpGained': xpGained,
        'timestamp': DateTime.now().toIso8601String(),
        'shown': false,
      };
      
      final existingNotifications = await StorageService.getStringList('pending_achievements') ?? [];
      existingNotifications.add(achievementData.toString());
      await StorageService.saveStringList('pending_achievements', existingNotifications);
    } catch (e) {
      print('Error showing achievement notification: $e');
    }
  }

  // Send streak notification
  static Future<void> showStreakNotification({
    required int streakDays,
    required String message,
  }) async {
    try {
      print('Streak notification: $streakDays days - $message');
      
      // Store streak notification
      final streakData = {
        'streakDays': streakDays,
        'message': message,
        'timestamp': DateTime.now().toIso8601String(),
        'shown': false,
      };
      
      await StorageService.saveString('pending_streak_notification', streakData.toString());
    } catch (e) {
      print('Error showing streak notification: $e');
    }
  }

  // Check and update daily streak
  static Future<void> checkDailyStreak(String userId) async {
    try {
      final lastActiveDate = await StorageService.getString('last_active_date');
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      
      if (lastActiveDate != null) {
        final lastActive = DateTime.parse(lastActiveDate);
        final lastActiveDay = DateTime(lastActive.year, lastActive.month, lastActive.day);
        final daysDifference = today.difference(lastActiveDay).inDays;
        
        if (daysDifference == 1) {
          // Continuing streak
          final currentStreak = await StorageService.getInt('current_streak') ?? 0;
          final newStreak = currentStreak + 1;
          await StorageService.saveInt('current_streak', newStreak);
          
          if (newStreak > 1) {
            await showStreakNotification(
              streakDays: newStreak,
              message: 'Amazing! You\'re on a $newStreak day learning streak!',
            );
          }
        } else if (daysDifference > 1) {
          // Streak broken
          final currentStreak = await StorageService.getInt('current_streak') ?? 0;
          if (currentStreak > 0) {
            await StorageService.saveInt('current_streak', 0);
            await showStreakNotification(
              streakDays: 0,
              message: 'Your $currentStreak day streak ended. Start a new one today!',
            );
          }
        }
      }
      
      await StorageService.saveString('last_active_date', now.toIso8601String());
    } catch (e) {
      print('Error checking daily streak: $e');
    }
  }

  // Subscribe to topic for broadcast notifications
  static Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      print('Subscribed to topic: $topic');
    } catch (e) {
      print('Error subscribing to topic $topic: $e');
    }
  }

  // Unsubscribe from topic
  static Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      print('Unsubscribed from topic: $topic');
    } catch (e) {
      print('Error unsubscribing from topic $topic: $e');
    }
  }

  // Get notification settings
  static Future<Map<String, bool>> getNotificationSettings() async {
    try {
      return {
        'dailyReminders': await StorageService.getBool('daily_reminders_enabled') ?? false,
        'achievementNotifications': await StorageService.getBool('achievement_notifications') ?? true,
        'streakNotifications': await StorageService.getBool('streak_notifications') ?? true,
        'communityNotifications': await StorageService.getBool('community_notifications') ?? true,
      };
    } catch (e) {
      print('Error getting notification settings: $e');
      return {
        'dailyReminders': false,
        'achievementNotifications': true,
        'streakNotifications': true,
        'communityNotifications': true,
      };
    }
  }

  // Update notification settings
  static Future<void> updateNotificationSettings(Map<String, bool> settings) async {
    try {
      for (final entry in settings.entries) {
        await StorageService.saveBool(entry.key, entry.value);
      }
      
      // Subscribe/unsubscribe from topics based on settings
      if (settings['communityNotifications'] == true) {
        await subscribeToTopic('community_updates');
      } else {
        await unsubscribeFromTopic('community_updates');
      }
      
      if (settings['achievementNotifications'] == true) {
        await subscribeToTopic('achievements');
      } else {
        await unsubscribeFromTopic('achievements');
      }
      
    } catch (e) {
      print('Error updating notification settings: $e');
    }
  }

  // Get FCM token for backend registration
  static String? get fcmToken => _fcmToken;

  // Refresh FCM token
  static Future<String?> refreshToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      if (_fcmToken != null) {
        await StorageService.saveString('fcm_token', _fcmToken!);
      }
      return _fcmToken;
    } catch (e) {
      print('Error refreshing FCM token: $e');
      return null;
    }
  }
}

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Handling background message: ${message.messageId}');
  
  // Handle background notification logic here
  // This runs even when the app is terminated
  
  // You can update local storage, trigger local notifications, etc.
  try {
    // Example: Update badge count or save notification for later display
    final data = message.data;
    print('Background notification data: $data');
  } catch (e) {
    print('Error in background message handler: $e');
  }
}
