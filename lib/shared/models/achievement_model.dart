import 'package:hive/hive.dart';

part 'achievement_model.g.dart';

@HiveType(typeId: 1)
class AchievementModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String iconName;

  @HiveField(4)
  final AchievementType type;

  @HiveField(5)
  final int xpReward;

  @HiveField(6)
  final Map<String, dynamic> requirements;

  @HiveField(7)
  final AchievementRarity rarity;

  @HiveField(8)
  final bool isSecret;

  @HiveField(9)
  final DateTime? unlockedAt;

  @HiveField(10)
  final String category;

  AchievementModel({
    required this.id,
    required this.title,
    required this.description,
    required this.iconName,
    required this.type,
    required this.xpReward,
    required this.requirements,
    required this.rarity,
    this.isSecret = false,
    this.unlockedAt,
    required this.category,
  });

  bool get isUnlocked => unlockedAt != null;

  String get rarityText {
    switch (rarity) {
      case AchievementRarity.common:
        return 'Common';
      case AchievementRarity.rare:
        return 'Rare';
      case AchievementRarity.epic:
        return 'Epic';
      case AchievementRarity.legendary:
        return 'Legendary';
    }
  }

  AchievementModel copyWith({
    String? id,
    String? title,
    String? description,
    String? iconName,
    AchievementType? type,
    int? xpReward,
    Map<String, dynamic>? requirements,
    AchievementRarity? rarity,
    bool? isSecret,
    DateTime? unlockedAt,
    String? category,
  }) {
    return AchievementModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      iconName: iconName ?? this.iconName,
      type: type ?? this.type,
      xpReward: xpReward ?? this.xpReward,
      requirements: requirements ?? this.requirements,
      rarity: rarity ?? this.rarity,
      isSecret: isSecret ?? this.isSecret,
      unlockedAt: unlockedAt ?? this.unlockedAt,
      category: category ?? this.category,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'iconName': iconName,
      'type': type.name,
      'xpReward': xpReward,
      'requirements': requirements,
      'rarity': rarity.name,
      'isSecret': isSecret,
      'unlockedAt': unlockedAt?.toIso8601String(),
      'category': category,
    };
  }

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    return AchievementModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      iconName: json['iconName'] as String,
      type: AchievementType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => AchievementType.progress,
      ),
      xpReward: json['xpReward'] as int,
      requirements: Map<String, dynamic>.from(json['requirements'] as Map),
      rarity: AchievementRarity.values.firstWhere(
        (e) => e.name == json['rarity'],
        orElse: () => AchievementRarity.common,
      ),
      isSecret: json['isSecret'] as bool? ?? false,
      unlockedAt: json['unlockedAt'] != null
          ? DateTime.parse(json['unlockedAt'] as String)
          : null,
      category: json['category'] as String,
    );
  }

  @override
  String toString() {
    return 'AchievementModel(id: $id, title: $title, type: $type, rarity: $rarity, isUnlocked: $isUnlocked)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is AchievementModel &&
        other.id == id &&
        other.title == title &&
        other.type == type &&
        other.rarity == rarity;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        title.hashCode ^
        type.hashCode ^
        rarity.hashCode;
  }
}

@HiveType(typeId: 2)
enum AchievementType {
  @HiveField(0)
  progress,
  
  @HiveField(1)
  streak,
  
  @HiveField(2)
  completion,
  
  @HiveField(3)
  social,
  
  @HiveField(4)
  skill,
  
  @HiveField(5)
  milestone,
}

@HiveType(typeId: 3)
enum AchievementRarity {
  @HiveField(0)
  common,
  
  @HiveField(1)
  rare,
  
  @HiveField(2)
  epic,
  
  @HiveField(3)
  legendary,
}
