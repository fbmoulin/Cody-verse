import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class UserModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String email;

  @HiveField(2)
  final String displayName;

  @HiveField(3)
  final String? photoURL;

  @HiveField(4)
  final int xp;

  @HiveField(5)
  final int level;

  @HiveField(6)
  final int streak;

  @HiveField(7)
  final DateTime lastActiveDate;

  @HiveField(8)
  final List<String> completedLessons;

  @HiveField(9)
  final List<String> unlockedAchievements;

  @HiveField(10)
  final Map<String, dynamic> preferences;

  @HiveField(11)
  final DateTime createdAt;

  @HiveField(12)
  final DateTime updatedAt;

  UserModel({
    required this.id,
    required this.email,
    required this.displayName,
    this.photoURL,
    this.xp = 0,
    this.level = 1,
    this.streak = 0,
    required this.lastActiveDate,
    this.completedLessons = const [],
    this.unlockedAchievements = const [],
    this.preferences = const {},
    required this.createdAt,
    required this.updatedAt,
  });

  // Calculate level from XP
  int get calculatedLevel => (xp / 500).floor() + 1;

  // Check if user is on a streak
  bool get isOnStreak {
    final now = DateTime.now();
    final lastActive = DateTime(
      lastActiveDate.year,
      lastActiveDate.month,
      lastActiveDate.day,
    );
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    return lastActive.isAtSameMomentAs(today) ||
           lastActive.isAtSameMomentAs(yesterday);
  }

  // Progress to next level as percentage
  double get progressToNextLevel {
    final currentLevelXP = (level - 1) * 500;
    final nextLevelXP = level * 500;
    final progressXP = xp - currentLevelXP;
    final totalXPNeeded = nextLevelXP - currentLevelXP;
    
    return (progressXP / totalXPNeeded).clamp(0.0, 1.0);
  }

  // XP needed for next level
  int get xpToNextLevel {
    final nextLevelXP = level * 500;
    return (nextLevelXP - xp).clamp(0, nextLevelXP);
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? displayName,
    String? photoURL,
    int? xp,
    int? level,
    int? streak,
    DateTime? lastActiveDate,
    List<String>? completedLessons,
    List<String>? unlockedAchievements,
    Map<String, dynamic>? preferences,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      photoURL: photoURL ?? this.photoURL,
      xp: xp ?? this.xp,
      level: level ?? this.level,
      streak: streak ?? this.streak,
      lastActiveDate: lastActiveDate ?? this.lastActiveDate,
      completedLessons: completedLessons ?? this.completedLessons,
      unlockedAchievements: unlockedAchievements ?? this.unlockedAchievements,
      preferences: preferences ?? this.preferences,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'photoURL': photoURL,
      'xp': xp,
      'level': level,
      'streak': streak,
      'lastActiveDate': lastActiveDate.toIso8601String(),
      'completedLessons': completedLessons,
      'unlockedAchievements': unlockedAchievements,
      'preferences': preferences,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      photoURL: json['photoURL'] as String?,
      xp: json['xp'] as int? ?? 0,
      level: json['level'] as int? ?? 1,
      streak: json['streak'] as int? ?? 0,
      lastActiveDate: DateTime.parse(json['lastActiveDate'] as String),
      completedLessons: List<String>.from(json['completedLessons'] as List? ?? []),
      unlockedAchievements: List<String>.from(json['unlockedAchievements'] as List? ?? []),
      preferences: Map<String, dynamic>.from(json['preferences'] as Map? ?? {}),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  @override
  String toString() {
    return 'UserModel(id: $id, email: $email, displayName: $displayName, xp: $xp, level: $level, streak: $streak)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is UserModel &&
        other.id == id &&
        other.email == email &&
        other.displayName == displayName &&
        other.photoURL == photoURL &&
        other.xp == xp &&
        other.level == level &&
        other.streak == streak;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        email.hashCode ^
        displayName.hashCode ^
        photoURL.hashCode ^
        xp.hashCode ^
        level.hashCode ^
        streak.hashCode;
  }
}
