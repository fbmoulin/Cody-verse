import 'package:hive/hive.dart';

part 'lesson_model.g.dart';

@HiveType(typeId: 4)
class LessonModel extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String title;

  @HiveField(2)
  final String description;

  @HiveField(3)
  final String content;

  @HiveField(4)
  final String category;

  @HiveField(5)
  final DifficultyLevel difficulty;

  @HiveField(6)
  final int estimatedDuration; // in minutes

  @HiveField(7)
  final int xpReward;

  @HiveField(8)
  final List<String> prerequisites;

  @HiveField(9)
  final List<String> tags;

  @HiveField(10)
  final String? videoUrl;

  @HiveField(11)
  final List<QuizQuestion> quizQuestions;

  @HiveField(12)
  final List<String> codeExamples;

  @HiveField(13)
  final bool isOfflineAvailable;

  @HiveField(14)
  final DateTime createdAt;

  @HiveField(15)
  final DateTime updatedAt;

  @HiveField(16)
  final int order;

  @HiveField(17)
  final String? thumbnailUrl;

  @HiveField(18)
  final Map<String, dynamic> metadata;

  LessonModel({
    required this.id,
    required this.title,
    required this.description,
    required this.content,
    required this.category,
    required this.difficulty,
    required this.estimatedDuration,
    required this.xpReward,
    this.prerequisites = const [],
    this.tags = const [],
    this.videoUrl,
    this.quizQuestions = const [],
    this.codeExamples = const [],
    this.isOfflineAvailable = false,
    required this.createdAt,
    required this.updatedAt,
    required this.order,
    this.thumbnailUrl,
    this.metadata = const {},
  });

  String get difficultyText {
    switch (difficulty) {
      case DifficultyLevel.beginner:
        return 'Beginner';
      case DifficultyLevel.intermediate:
        return 'Intermediate';
      case DifficultyLevel.advanced:
        return 'Advanced';
      case DifficultyLevel.expert:
        return 'Expert';
    }
  }

  String get formattedDuration {
    if (estimatedDuration < 60) {
      return '${estimatedDuration}m';
    } else {
      final hours = estimatedDuration ~/ 60;
      final minutes = estimatedDuration % 60;
      return minutes > 0 ? '${hours}h ${minutes}m' : '${hours}h';
    }
  }

  bool get hasVideo => videoUrl != null && videoUrl!.isNotEmpty;
  bool get hasQuiz => quizQuestions.isNotEmpty;
  bool get hasCodeExamples => codeExamples.isNotEmpty;

  LessonModel copyWith({
    String? id,
    String? title,
    String? description,
    String? content,
    String? category,
    DifficultyLevel? difficulty,
    int? estimatedDuration,
    int? xpReward,
    List<String>? prerequisites,
    List<String>? tags,
    String? videoUrl,
    List<QuizQuestion>? quizQuestions,
    List<String>? codeExamples,
    bool? isOfflineAvailable,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? order,
    String? thumbnailUrl,
    Map<String, dynamic>? metadata,
  }) {
    return LessonModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      content: content ?? this.content,
      category: category ?? this.category,
      difficulty: difficulty ?? this.difficulty,
      estimatedDuration: estimatedDuration ?? this.estimatedDuration,
      xpReward: xpReward ?? this.xpReward,
      prerequisites: prerequisites ?? this.prerequisites,
      tags: tags ?? this.tags,
      videoUrl: videoUrl ?? this.videoUrl,
      quizQuestions: quizQuestions ?? this.quizQuestions,
      codeExamples: codeExamples ?? this.codeExamples,
      isOfflineAvailable: isOfflineAvailable ?? this.isOfflineAvailable,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      order: order ?? this.order,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      metadata: metadata ?? this.metadata,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'content': content,
      'category': category,
      'difficulty': difficulty.name,
      'estimatedDuration': estimatedDuration,
      'xpReward': xpReward,
      'prerequisites': prerequisites,
      'tags': tags,
      'videoUrl': videoUrl,
      'quizQuestions': quizQuestions.map((q) => q.toJson()).toList(),
      'codeExamples': codeExamples,
      'isOfflineAvailable': isOfflineAvailable,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'order': order,
      'thumbnailUrl': thumbnailUrl,
      'metadata': metadata,
    };
  }

  factory LessonModel.fromJson(Map<String, dynamic> json) {
    return LessonModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String,
      content: json['content'] as String,
      category: json['category'] as String,
      difficulty: DifficultyLevel.values.firstWhere(
        (e) => e.name == json['difficulty'],
        orElse: () => DifficultyLevel.beginner,
      ),
      estimatedDuration: json['estimatedDuration'] as int,
      xpReward: json['xpReward'] as int,
      prerequisites: List<String>.from(json['prerequisites'] as List? ?? []),
      tags: List<String>.from(json['tags'] as List? ?? []),
      videoUrl: json['videoUrl'] as String?,
      quizQuestions: (json['quizQuestions'] as List? ?? [])
          .map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>))
          .toList(),
      codeExamples: List<String>.from(json['codeExamples'] as List? ?? []),
      isOfflineAvailable: json['isOfflineAvailable'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      order: json['order'] as int,
      thumbnailUrl: json['thumbnailUrl'] as String?,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? {}),
    );
  }

  @override
  String toString() {
    return 'LessonModel(id: $id, title: $title, category: $category, difficulty: $difficulty)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    
    return other is LessonModel &&
        other.id == id &&
        other.title == title &&
        other.category == category &&
        other.difficulty == difficulty;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        title.hashCode ^
        category.hashCode ^
        difficulty.hashCode;
  }
}

@HiveType(typeId: 5)
class QuizQuestion extends HiveObject {
  @HiveField(0)
  final String question;

  @HiveField(1)
  final List<String> options;

  @HiveField(2)
  final int correctAnswerIndex;

  @HiveField(3)
  final String explanation;

  @HiveField(4)
  final QuestionType type;

  QuizQuestion({
    required this.question,
    required this.options,
    required this.correctAnswerIndex,
    required this.explanation,
    this.type = QuestionType.multipleChoice,
  });

  String get correctAnswer => options[correctAnswerIndex];

  Map<String, dynamic> toJson() {
    return {
      'question': question,
      'options': options,
      'correctAnswerIndex': correctAnswerIndex,
      'explanation': explanation,
      'type': type.name,
    };
  }

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      question: json['question'] as String,
      options: List<String>.from(json['options'] as List),
      correctAnswerIndex: json['correctAnswerIndex'] as int,
      explanation: json['explanation'] as String,
      type: QuestionType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => QuestionType.multipleChoice,
      ),
    );
  }
}

@HiveType(typeId: 6)
enum DifficultyLevel {
  @HiveField(0)
  beginner,
  
  @HiveField(1)
  intermediate,
  
  @HiveField(2)
  advanced,
  
  @HiveField(3)
  expert,
}

@HiveType(typeId: 7)
enum QuestionType {
  @HiveField(0)
  multipleChoice,
  
  @HiveField(1)
  trueFalse,
  
  @HiveField(2)
  fillInTheBlank,
  
  @HiveField(3)
  code,
}
