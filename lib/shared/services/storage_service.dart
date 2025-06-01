import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../models/achievement_model.dart';
import '../models/lesson_model.dart';
import '../../core/constants/app_constants.dart';

class StorageService {
  static Box? _userBox;
  static Box? _progressBox;
  static Box? _achievementsBox;
  static Box? _offlineContentBox;
  static SharedPreferences? _prefs;

  static Future<void> initialize() async {
    try {
      // Initialize Hive
      await Hive.initFlutter();
      
      // Register adapters
      if (!Hive.isAdapterRegistered(0)) {
        Hive.registerAdapter(UserModelAdapter());
      }
      if (!Hive.isAdapterRegistered(1)) {
        Hive.registerAdapter(AchievementModelAdapter());
      }
      if (!Hive.isAdapterRegistered(2)) {
        Hive.registerAdapter(AchievementTypeAdapter());
      }
      if (!Hive.isAdapterRegistered(3)) {
        Hive.registerAdapter(AchievementRarityAdapter());
      }
      if (!Hive.isAdapterRegistered(4)) {
        Hive.registerAdapter(LessonModelAdapter());
      }
      if (!Hive.isAdapterRegistered(5)) {
        Hive.registerAdapter(QuizQuestionAdapter());
      }
      if (!Hive.isAdapterRegistered(6)) {
        Hive.registerAdapter(DifficultyLevelAdapter());
      }
      if (!Hive.isAdapterRegistered(7)) {
        Hive.registerAdapter(QuestionTypeAdapter());
      }

      // Open boxes
      _userBox = await Hive.openBox(AppConstants.userBox);
      _progressBox = await Hive.openBox(AppConstants.progressBox);
      _achievementsBox = await Hive.openBox(AppConstants.achievementsBox);
      _offlineContentBox = await Hive.openBox(AppConstants.offlineContentBox);

      // Initialize SharedPreferences
      _prefs = await SharedPreferences.getInstance();

      print('Storage service initialized successfully');
    } catch (e) {
      print('Error initializing storage service: $e');
    }
  }

  // User Management
  static Future<void> saveUser(UserModel user) async {
    try {
      await _userBox?.put('current_user', user);
    } catch (e) {
      print('Error saving user: $e');
    }
  }

  static UserModel? getUser() {
    try {
      return _userBox?.get('current_user') as UserModel?;
    } catch (e) {
      print('Error getting user: $e');
      return null;
    }
  }

  static Future<void> clearUser() async {
    try {
      await _userBox?.delete('current_user');
    } catch (e) {
      print('Error clearing user: $e');
    }
  }

  // Progress Management
  static Future<void> saveProgress(String key, Map<String, dynamic> progress) async {
    try {
      await _progressBox?.put(key, progress);
    } catch (e) {
      print('Error saving progress: $e');
    }
  }

  static Map<String, dynamic>? getProgress(String key) {
    try {
      final progress = _progressBox?.get(key);
      return progress != null ? Map<String, dynamic>.from(progress) : null;
    } catch (e) {
      print('Error getting progress: $e');
      return null;
    }
  }

  static Future<void> saveUserProgress({
    required String userId,
    required int xp,
    required int level,
    required int streak,
    required List<String> completedLessons,
    required List<String> unlockedAchievements,
  }) async {
    try {
      final progressData = {
        'xp': xp,
        'level': level,
        'streak': streak,
        'completedLessons': completedLessons,
        'unlockedAchievements': unlockedAchievements,
        'lastUpdated': DateTime.now().toIso8601String(),
      };
      
      await saveProgress('user_$userId', progressData);
    } catch (e) {
      print('Error saving user progress: $e');
    }
  }

  static Map<String, dynamic>? getUserProgress(String userId) {
    return getProgress('user_$userId');
  }

  // Achievements Management
  static Future<void> saveAchievements(List<AchievementModel> achievements) async {
    try {
      await _achievementsBox?.put('all_achievements', achievements);
    } catch (e) {
      print('Error saving achievements: $e');
    }
  }

  static List<AchievementModel> getAchievements() {
    try {
      final achievements = _achievementsBox?.get('all_achievements');
      return achievements != null ? List<AchievementModel>.from(achievements) : [];
    } catch (e) {
      print('Error getting achievements: $e');
      return [];
    }
  }

  static Future<void> unlockAchievement(String achievementId) async {
    try {
      final unlockedAchievements = getStringList('unlocked_achievements') ?? [];
      if (!unlockedAchievements.contains(achievementId)) {
        unlockedAchievements.add(achievementId);
        await saveStringList('unlocked_achievements', unlockedAchievements);
        
        // Save unlock timestamp
        await saveString('achievement_${achievementId}_unlocked_at', DateTime.now().toIso8601String());
      }
    } catch (e) {
      print('Error unlocking achievement: $e');
    }
  }

  static bool isAchievementUnlocked(String achievementId) {
    try {
      final unlockedAchievements = getStringList('unlocked_achievements') ?? [];
      return unlockedAchievements.contains(achievementId);
    } catch (e) {
      print('Error checking achievement status: $e');
      return false;
    }
  }

  // Offline Content Management
  static Future<void> saveLessonsForOffline(List<LessonModel> lessons) async {
    try {
      await _offlineContentBox?.put('offline_lessons', lessons);
      await saveString('offline_lessons_updated', DateTime.now().toIso8601String());
    } catch (e) {
      print('Error saving lessons for offline: $e');
    }
  }

  static List<LessonModel> getOfflineLessons() {
    try {
      final lessons = _offlineContentBox?.get('offline_lessons');
      return lessons != null ? List<LessonModel>.from(lessons) : [];
    } catch (e) {
      print('Error getting offline lessons: $e');
      return [];
    }
  }

  static Future<void> saveLessonContent(String lessonId, String content) async {
    try {
      await _offlineContentBox?.put('lesson_content_$lessonId', content);
    } catch (e) {
      print('Error saving lesson content: $e');
    }
  }

  static String? getLessonContent(String lessonId) {
    try {
      return _offlineContentBox?.get('lesson_content_$lessonId') as String?;
    } catch (e) {
      print('Error getting lesson content: $e');
      return null;
    }
  }

  static Future<void> markLessonAsOfflineAvailable(String lessonId) async {
    try {
      final offlineLessons = getStringList('offline_available_lessons') ?? [];
      if (!offlineLessons.contains(lessonId)) {
        offlineLessons.add(lessonId);
        await saveStringList('offline_available_lessons', offlineLessons);
      }
    } catch (e) {
      print('Error marking lesson as offline available: $e');
    }
  }

  static bool isLessonOfflineAvailable(String lessonId) {
    try {
      final offlineLessons = getStringList('offline_available_lessons') ?? [];
      return offlineLessons.contains(lessonId);
    } catch (e) {
      print('Error checking lesson offline availability: $e');
      return false;
    }
  }

  // SharedPreferences wrappers for simple data
  static Future<void> saveString(String key, String value) async {
    try {
      await _prefs?.setString(key, value);
    } catch (e) {
      print('Error saving string: $e');
    }
  }

  static String? getString(String key) {
    try {
      return _prefs?.getString(key);
    } catch (e) {
      print('Error getting string: $e');
      return null;
    }
  }

  static Future<void> saveInt(String key, int value) async {
    try {
      await _prefs?.setInt(key, value);
    } catch (e) {
      print('Error saving int: $e');
    }
  }

  static int? getInt(String key) {
    try {
      return _prefs?.getInt(key);
    } catch (e) {
      print('Error getting int: $e');
      return null;
    }
  }

  static Future<void> saveBool(String key, bool value) async {
    try {
      await _prefs?.setBool(key, value);
    } catch (e) {
      print('Error saving bool: $e');
    }
  }

  static bool? getBool(String key) {
    try {
      return _prefs?.getBool(key);
    } catch (e) {
      print('Error getting bool: $e');
      return null;
    }
  }

  static Future<void> saveDouble(String key, double value) async {
    try {
      await _prefs?.setDouble(key, value);
    } catch (e) {
      print('Error saving double: $e');
    }
  }

  static double? getDouble(String key) {
    try {
      return _prefs?.getDouble(key);
    } catch (e) {
      print('Error getting double: $e');
      return null;
    }
  }

  static Future<void> saveStringList(String key, List<String> value) async {
    try {
      await _prefs?.setStringList(key, value);
    } catch (e) {
      print('Error saving string list: $e');
    }
  }

  static List<String>? getStringList(String key) {
    try {
      return _prefs?.getStringList(key);
    } catch (e) {
      print('Error getting string list: $e');
      return null;
    }
  }

  // Utility methods
  static Future<void> clearAll() async {
    try {
      await _userBox?.clear();
      await _progressBox?.clear();
      await _achievementsBox?.clear();
      await _offlineContentBox?.clear();
      await _prefs?.clear();
    } catch (e) {
      print('Error clearing all storage: $e');
    }
  }

  static Future<void> clearUserData() async {
    try {
      await _userBox?.clear();
      await _progressBox?.clear();
      
      // Clear user-specific preferences
      final keysToRemove = _prefs?.getKeys().where((key) => 
        key.startsWith('user_') || 
        key.startsWith('current_') ||
        key.startsWith('unlocked_') ||
        key.startsWith('last_active_')
      ).toList() ?? [];
      
      for (final key in keysToRemove) {
        await _prefs?.remove(key);
      }
    } catch (e) {
      print('Error clearing user data: $e');
    }
  }

  static Future<bool> hasKey(String key) async {
    try {
      return _prefs?.containsKey(key) ?? false;
    } catch (e) {
      print('Error checking key existence: $e');
      return false;
    }
  }

  static Future<void> remove(String key) async {
    try {
      await _prefs?.remove(key);
    } catch (e) {
      print('Error removing key: $e');
    }
  }

  // Cache management
  static Future<void> saveToCache(String key, Map<String, dynamic> data) async {
    try {
      final cacheData = {
        'data': data,
        'timestamp': DateTime.now().toIso8601String(),
      };
      await _offlineContentBox?.put('cache_$key', cacheData);
    } catch (e) {
      print('Error saving to cache: $e');
    }
  }

  static Map<String, dynamic>? getFromCache(String key, {Duration? maxAge}) async {
    try {
      final cached = _offlineContentBox?.get('cache_$key');
      if (cached != null) {
        final cacheData = Map<String, dynamic>.from(cached);
        final timestamp = DateTime.parse(cacheData['timestamp']);
        
        if (maxAge != null) {
          final age = DateTime.now().difference(timestamp);
          if (age > maxAge) {
            // Cache expired, remove it
            await _offlineContentBox?.delete('cache_$key');
            return null;
          }
        }
        
        return Map<String, dynamic>.from(cacheData['data']);
      }
      return null;
    } catch (e) {
      print('Error getting from cache: $e');
      return null;
    }
  }

  static Future<void> clearCache() async {
    try {
      final keys = _offlineContentBox?.keys.where((key) => key.toString().startsWith('cache_')).toList() ?? [];
      for (final key in keys) {
        await _offlineContentBox?.delete(key);
      }
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }

  // Storage size estimation
  static Future<int> getStorageSize() async {
    try {
      int totalSize = 0;
      
      // Estimate Hive box sizes (approximate)
      totalSize += (_userBox?.length ?? 0) * 1000; // Rough estimate
      totalSize += (_progressBox?.length ?? 0) * 500;
      totalSize += (_achievementsBox?.length ?? 0) * 200;
      totalSize += (_offlineContentBox?.length ?? 0) * 2000;
      
      return totalSize; // Returns approximate size in bytes
    } catch (e) {
      print('Error calculating storage size: $e');
      return 0;
    }
  }
}
