class AppConstants {
  // App Information
  static const String appName = 'Cody Verse';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Learn MCP and AI concepts through gamified experiences';
  
  // Firebase Collections
  static const String usersCollection = 'users';
  static const String lessonsCollection = 'lessons';
  static const String achievementsCollection = 'achievements';
  static const String communityCollection = 'community';
  static const String progressCollection = 'progress';
  
  // Hive Boxes
  static const String userBox = 'user_box';
  static const String progressBox = 'progress_box';
  static const String achievementsBox = 'achievements_box';
  static const String offlineContentBox = 'offline_content_box';
  
  // XP and Leveling
  static const int baseXpPerLevel = 500;
  static const int lessonCompletionXp = 100;
  static const int achievementXp = 250;
  static const int dailyStreakXp = 50;
  
  // Achievement Types
  static const String firstLessonAchievement = 'first_lesson';
  static const String streakAchievement = 'streak_master';
  static const String levelUpAchievement = 'level_up';
  static const String communityAchievement = 'community_helper';
  
  // Notification IDs
  static const int dailyReminderNotificationId = 1;
  static const int streakReminderNotificationId = 2;
  static const int achievementNotificationId = 3;
  
  // Routes
  static const String loginRoute = '/login';
  static const String registerRoute = '/register';
  static const String dashboardRoute = '/dashboard';
  static const String learningRoute = '/learning';
  static const String labRoute = '/lab';
  static const String communityRoute = '/community';
  static const String profileRoute = '/profile';
  
  // API Endpoints (if needed for external services)
  static const String mcpApiBaseUrl = 'https://api.mcp.example.com';
  static const String aiContentApiUrl = 'https://api.ai-content.example.com';
  
  // Error Messages
  static const String networkErrorMessage = 'Please check your internet connection and try again.';
  static const String genericErrorMessage = 'Something went wrong. Please try again.';
  static const String authErrorMessage = 'Authentication failed. Please check your credentials.';
  static const String offlineMessage = 'You are currently offline. Some features may be limited.';
  
  // Success Messages
  static const String loginSuccessMessage = 'Welcome back to Cody Verse!';
  static const String registerSuccessMessage = 'Account created successfully!';
  static const String lessonCompleteMessage = 'Lesson completed! You earned {xp} XP.';
  static const String levelUpMessage = 'Congratulations! You reached level {level}!';
  
  // Learning Categories
  static const List<String> learningCategories = [
    'MCP Fundamentals',
    'AI Basics',
    'Machine Learning',
    'Natural Language Processing',
    'Computer Vision',
    'Deep Learning',
    'Ethics in AI',
    'Practical Applications',
  ];
  
  // Difficulty Levels
  static const List<String> difficultyLevels = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
  ];
}
