import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';
import '../models/lesson_model.dart';
import '../models/achievement_model.dart';
import '../../core/constants/app_constants.dart';

class FirebaseService {
  static FirebaseFirestore get _firestore => FirebaseFirestore.instance;
  static FirebaseAuth get _auth => FirebaseAuth.instance;

  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      
      // Enable offline persistence for Firestore
      await _firestore.enablePersistence();
      
      // Configure Firestore settings
      _firestore.settings = const Settings(
        persistenceEnabled: true,
        cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
      );
    } catch (e) {
      print('Firebase initialization error: $e');
      // Continue without Firebase if initialization fails
    }
  }

  // User Management
  static Future<UserModel?> createUser(UserModel user) async {
    try {
      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.id)
          .set(user.toJson());
      return user;
    } catch (e) {
      print('Error creating user: $e');
      return null;
    }
  }

  static Future<UserModel?> getUser(String userId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId)
          .get();
      
      if (doc.exists && doc.data() != null) {
        return UserModel.fromJson(doc.data()!);
      }
      return null;
    } catch (e) {
      print('Error getting user: $e');
      return null;
    }
  }

  static Future<bool> updateUser(UserModel user) async {
    try {
      await _firestore
          .collection(AppConstants.usersCollection)
          .doc(user.id)
          .update(user.toJson());
      return true;
    } catch (e) {
      print('Error updating user: $e');
      return false;
    }
  }

  static Future<bool> updateUserProgress(
    String userId,
    String lessonId,
    int xpGained,
  ) async {
    try {
      final userRef = _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId);

      await _firestore.runTransaction((transaction) async {
        final userDoc = await transaction.get(userRef);
        
        if (userDoc.exists) {
          final userData = userDoc.data()!;
          final user = UserModel.fromJson(userData);
          
          final newXp = user.xp + xpGained;
          final newLevel = (newXp / AppConstants.baseXpPerLevel).floor() + 1;
          final completedLessons = List<String>.from(user.completedLessons);
          
          if (!completedLessons.contains(lessonId)) {
            completedLessons.add(lessonId);
          }

          final updatedUser = user.copyWith(
            xp: newXp,
            level: newLevel,
            completedLessons: completedLessons,
            updatedAt: DateTime.now(),
          );

          transaction.update(userRef, updatedUser.toJson());
        }
      });

      return true;
    } catch (e) {
      print('Error updating user progress: $e');
      return false;
    }
  }

  // Lesson Management
  static Stream<List<LessonModel>> getLessonsStream({
    String? category,
    DifficultyLevel? difficulty,
  }) {
    try {
      Query query = _firestore
          .collection(AppConstants.lessonsCollection)
          .orderBy('order');

      if (category != null) {
        query = query.where('category', isEqualTo: category);
      }

      if (difficulty != null) {
        query = query.where('difficulty', isEqualTo: difficulty.name);
      }

      return query.snapshots().map((snapshot) {
        return snapshot.docs
            .map((doc) => LessonModel.fromJson(doc.data() as Map<String, dynamic>))
            .toList();
      });
    } catch (e) {
      print('Error getting lessons stream: $e');
      return Stream.value([]);
    }
  }

  static Future<List<LessonModel>> getLessons({
    String? category,
    DifficultyLevel? difficulty,
  }) async {
    try {
      Query query = _firestore
          .collection(AppConstants.lessonsCollection)
          .orderBy('order');

      if (category != null) {
        query = query.where('category', isEqualTo: category);
      }

      if (difficulty != null) {
        query = query.where('difficulty', isEqualTo: difficulty.name);
      }

      final snapshot = await query.get();
      return snapshot.docs
          .map((doc) => LessonModel.fromJson(doc.data() as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('Error getting lessons: $e');
      return [];
    }
  }

  static Future<LessonModel?> getLesson(String lessonId) async {
    try {
      final doc = await _firestore
          .collection(AppConstants.lessonsCollection)
          .doc(lessonId)
          .get();
      
      if (doc.exists && doc.data() != null) {
        return LessonModel.fromJson(doc.data()!);
      }
      return null;
    } catch (e) {
      print('Error getting lesson: $e');
      return null;
    }
  }

  // Achievement Management
  static Future<List<AchievementModel>> getAchievements() async {
    try {
      final snapshot = await _firestore
          .collection(AppConstants.achievementsCollection)
          .get();
      
      return snapshot.docs
          .map((doc) => AchievementModel.fromJson(doc.data()))
          .toList();
    } catch (e) {
      print('Error getting achievements: $e');
      return [];
    }
  }

  static Future<bool> unlockAchievement(String userId, String achievementId) async {
    try {
      final userRef = _firestore
          .collection(AppConstants.usersCollection)
          .doc(userId);

      await _firestore.runTransaction((transaction) async {
        final userDoc = await transaction.get(userRef);
        
        if (userDoc.exists) {
          final userData = userDoc.data()!;
          final user = UserModel.fromJson(userData);
          
          final unlockedAchievements = List<String>.from(user.unlockedAchievements);
          
          if (!unlockedAchievements.contains(achievementId)) {
            unlockedAchievements.add(achievementId);
            
            // Get achievement details for XP reward
            final achievementDoc = await _firestore
                .collection(AppConstants.achievementsCollection)
                .doc(achievementId)
                .get();
            
            int xpReward = 0;
            if (achievementDoc.exists) {
              final achievement = AchievementModel.fromJson(achievementDoc.data()!);
              xpReward = achievement.xpReward;
            }

            final newXp = user.xp + xpReward;
            final newLevel = (newXp / AppConstants.baseXpPerLevel).floor() + 1;

            final updatedUser = user.copyWith(
              xp: newXp,
              level: newLevel,
              unlockedAchievements: unlockedAchievements,
              updatedAt: DateTime.now(),
            );

            transaction.update(userRef, updatedUser.toJson());
          }
        }
      });

      return true;
    } catch (e) {
      print('Error unlocking achievement: $e');
      return false;
    }
  }

  // Community Management
  static Future<bool> postToForum(
    String userId,
    String title,
    String content,
    String category,
  ) async {
    try {
      await _firestore
          .collection(AppConstants.communityCollection)
          .add({
        'userId': userId,
        'title': title,
        'content': content,
        'category': category,
        'createdAt': FieldValue.serverTimestamp(),
        'likes': 0,
        'replies': 0,
      });
      
      return true;
    } catch (e) {
      print('Error posting to forum: $e');
      return false;
    }
  }

  static Stream<QuerySnapshot> getForumPostsStream({
    String? category,
    int limit = 20,
  }) {
    try {
      Query query = _firestore
          .collection(AppConstants.communityCollection)
          .orderBy('createdAt', descending: true)
          .limit(limit);

      if (category != null) {
        query = query.where('category', isEqualTo: category);
      }

      return query.snapshots();
    } catch (e) {
      print('Error getting forum posts stream: $e');
      return const Stream.empty();
    }
  }

  // Analytics and Progress
  static Future<bool> logUserActivity(
    String userId,
    String activity,
    Map<String, dynamic> metadata,
  ) async {
    try {
      await _firestore
          .collection('user_analytics')
          .add({
        'userId': userId,
        'activity': activity,
        'metadata': metadata,
        'timestamp': FieldValue.serverTimestamp(),
      });
      
      return true;
    } catch (e) {
      print('Error logging user activity: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getUserStats(String userId) async {
    try {
      final doc = await _firestore
          .collection('user_stats')
          .doc(userId)
          .get();
      
      return doc.data();
    } catch (e) {
      print('Error getting user stats: $e');
      return null;
    }
  }

  // Utility Methods
  static bool get isOnline {
    // This would be implemented with connectivity checks
    return true;
  }

  static Future<void> clearCache() async {
    try {
      await _firestore.clearPersistence();
    } catch (e) {
      print('Error clearing cache: $e');
    }
  }
}
