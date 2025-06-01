import 'package:flutter/material.dart';

void main() {
  runApp(CodyVerseApp());
}

class CodyVerseApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cody Verse',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Cody Verse'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school,
              size: 80,
              color: Colors.blue,
            ),
            SizedBox(height: 20),
            Text(
              'Welcome to Cody Verse',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Learn MCP and AI concepts through interactive lessons',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 30),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => LearningModulesScreen()),
                    );
                  },
                  icon: Icon(Icons.play_arrow),
                  label: Text('Start Learning'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
                SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => UserProgressScreen()),
                    );
                  },
                  icon: Icon(Icons.analytics),
                  label: Text('Progress'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  ),
                ),
              ],
            ),
            SizedBox(height: 20),
            Container(
              padding: EdgeInsets.all(16),
              margin: EdgeInsets.symmetric(horizontal: 32),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  Icon(Icons.storage, color: Colors.blue, size: 32),
                  SizedBox(height: 8),
                  Text(
                    'Database Connected',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade800,
                    ),
                  ),
                  Text(
                    'PostgreSQL database with educational content ready',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.blue.shade600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LearningModulesScreen extends StatelessWidget {
  final List<Map<String, dynamic>> modules = [
    {
      'id': 1,
      'title': 'Introduction to MCP',
      'description': 'Learn the fundamentals of Model Context Protocol and its applications in AI systems',
      'category': 'mcp_basics',
      'difficulty_level': 'beginner',
      'estimated_duration_minutes': 30,
      'xp_reward': 20,
    },
    {
      'id': 2,
      'title': 'AI Prompt Engineering',
      'description': 'Master the art of crafting effective prompts for AI models',
      'category': 'ai_fundamentals',
      'difficulty_level': 'beginner',
      'estimated_duration_minutes': 45,
      'xp_reward': 25,
    },
    {
      'id': 3,
      'title': 'MCP Server Setup',
      'description': 'Build and configure your first MCP server',
      'category': 'mcp_implementation',
      'difficulty_level': 'intermediate',
      'estimated_duration_minutes': 60,
      'xp_reward': 35,
    },
    {
      'id': 4,
      'title': 'Advanced AI Concepts',
      'description': 'Explore complex AI architectures and patterns',
      'category': 'ai_advanced',
      'difficulty_level': 'advanced',
      'estimated_duration_minutes': 90,
      'xp_reward': 50,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Learning Modules'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: ListView.builder(
        padding: EdgeInsets.all(16),
        itemCount: modules.length,
        itemBuilder: (context, index) {
          final module = modules[index];
          return Card(
            margin: EdgeInsets.only(bottom: 16),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: _getDifficultyColor(module['difficulty_level']),
                child: Icon(
                  _getCategoryIcon(module['category']),
                  color: Colors.white,
                ),
              ),
              title: Text(
                module['title'],
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(module['description']),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 16, color: Colors.grey),
                      SizedBox(width: 4),
                      Text('${module['estimated_duration_minutes']} min'),
                      SizedBox(width: 16),
                      Icon(Icons.star, size: 16, color: Colors.amber),
                      SizedBox(width: 4),
                      Text('${module['xp_reward']} XP'),
                    ],
                  ),
                ],
              ),
              trailing: Chip(
                label: Text(
                  module['difficulty_level'].toString().toUpperCase(),
                  style: TextStyle(fontSize: 10, color: Colors.white),
                ),
                backgroundColor: _getDifficultyColor(module['difficulty_level']),
              ),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => LessonsScreen(
                      moduleId: module['id'],
                      moduleTitle: module['title'],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'beginner':
        return Colors.green;
      case 'intermediate':
        return Colors.orange;
      case 'advanced':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category) {
      case 'mcp_basics':
        return Icons.foundation;
      case 'ai_fundamentals':
        return Icons.psychology;
      case 'mcp_implementation':
        return Icons.code;
      case 'ai_advanced':
        return Icons.rocket_launch;
      default:
        return Icons.book;
    }
  }
}

class LessonsScreen extends StatelessWidget {
  final int moduleId;
  final String moduleTitle;

  LessonsScreen({required this.moduleId, required this.moduleTitle});

  final Map<int, List<Map<String, dynamic>>> lessonsData = {
    1: [
      {
        'id': 1,
        'title': 'What is MCP?',
        'lesson_type': 'theory',
        'xp_reward': 5,
        'estimated_duration_minutes': 10,
      },
      {
        'id': 2,
        'title': 'MCP Architecture Overview',
        'lesson_type': 'theory',
        'xp_reward': 5,
        'estimated_duration_minutes': 15,
      },
      {
        'id': 3,
        'title': 'MCP Quiz',
        'lesson_type': 'quiz',
        'xp_reward': 10,
        'estimated_duration_minutes': 5,
      },
    ],
    2: [
      {
        'id': 4,
        'title': 'Understanding AI Prompts',
        'lesson_type': 'theory',
        'xp_reward': 5,
        'estimated_duration_minutes': 20,
      },
      {
        'id': 5,
        'title': 'Prompt Engineering Techniques',
        'lesson_type': 'interactive',
        'xp_reward': 8,
        'estimated_duration_minutes': 25,
      },
    ],
    3: [
      {
        'id': 6,
        'title': 'Setting Up Your First MCP Server',
        'lesson_type': 'lab',
        'xp_reward': 15,
        'estimated_duration_minutes': 45,
      },
    ],
    4: [
      {
        'id': 7,
        'title': 'AI Model Architectures',
        'lesson_type': 'theory',
        'xp_reward': 10,
        'estimated_duration_minutes': 30,
      },
    ],
  };

  @override
  Widget build(BuildContext context) {
    final lessons = lessonsData[moduleId] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text(moduleTitle),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: lessons.isEmpty
          ? Center(child: Text('No lessons available'))
          : ListView.builder(
              padding: EdgeInsets.all(16),
              itemCount: lessons.length,
              itemBuilder: (context, index) {
                final lesson = lessons[index];
                return Card(
                  margin: EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getLessonTypeColor(lesson['lesson_type']),
                      child: Icon(
                        _getLessonTypeIcon(lesson['lesson_type']),
                        color: Colors.white,
                      ),
                    ),
                    title: Text(lesson['title']),
                    subtitle: Row(
                      children: [
                        Icon(Icons.schedule, size: 16, color: Colors.grey),
                        SizedBox(width: 4),
                        Text('${lesson['estimated_duration_minutes']} min'),
                        SizedBox(width: 16),
                        Icon(Icons.star, size: 16, color: Colors.amber),
                        SizedBox(width: 4),
                        Text('${lesson['xp_reward']} XP'),
                      ],
                    ),
                    trailing: Icon(Icons.arrow_forward_ios),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Starting lesson: ${lesson['title']}')),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }

  Color _getLessonTypeColor(String type) {
    switch (type) {
      case 'theory':
        return Colors.blue;
      case 'interactive':
        return Colors.purple;
      case 'quiz':
        return Colors.orange;
      case 'lab':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  IconData _getLessonTypeIcon(String type) {
    switch (type) {
      case 'theory':
        return Icons.book;
      case 'interactive':
        return Icons.touch_app;
      case 'quiz':
        return Icons.quiz;
      case 'lab':
        return Icons.science;
      default:
        return Icons.article;
    }
  }
}

class UserProgressScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Your Progress'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Stats Card
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundColor: Colors.blue,
                          child: Icon(Icons.person, size: 35, color: Colors.white),
                        ),
                        SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Learning Journey', 
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                              SizedBox(height: 4),
                              Text('Level 1 • Beginner', 
                                style: TextStyle(color: Colors.grey[600])),
                            ],
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildStatColumn('XP Points', '85', Icons.star, Colors.amber),
                        _buildStatColumn('Streak', '3 days', Icons.local_fire_department, Colors.orange),
                        _buildStatColumn('Completed', '2/7', Icons.check_circle, Colors.green),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            
            SizedBox(height: 20),
            
            // Progress by Module
            Text('Module Progress', 
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            
            _buildModuleProgress('Introduction to MCP', 3, 3, 20, Colors.green),
            _buildModuleProgress('AI Prompt Engineering', 1, 2, 8, Colors.orange),
            _buildModuleProgress('MCP Server Setup', 0, 1, 0, Colors.grey),
            _buildModuleProgress('Advanced AI Concepts', 0, 1, 0, Colors.grey),
            
            SizedBox(height: 20),
            
            // Recent Achievements
            Text('Recent Achievements', 
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            
            _buildAchievementCard('First Steps', 'Complete your first lesson', 
              Icons.flag, Colors.blue, '2 days ago'),
            _buildAchievementCard('Quick Learner', 'Complete a lesson in under 5 minutes', 
              Icons.speed, Colors.purple, '1 day ago'),
            
            SizedBox(height: 20),
            
            // Recommended Next Steps
            Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Recommended Next', 
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    ListTile(
                      leading: Icon(Icons.psychology, color: Colors.purple),
                      title: Text('Prompt Engineering Techniques'),
                      subtitle: Text('Continue your AI learning journey'),
                      trailing: Icon(Icons.arrow_forward_ios),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => LessonsScreen(
                              moduleId: 2,
                              moduleTitle: 'AI Prompt Engineering',
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatColumn(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }
  
  Widget _buildModuleProgress(String title, int completed, int total, int xp, Color color) {
    double progress = completed / total;
    
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(title, style: TextStyle(fontWeight: FontWeight.w500)),
                ),
                Text('$completed/$total', style: TextStyle(color: Colors.grey[600])),
              ],
            ),
            SizedBox(height: 8),
            LinearProgressIndicator(
              value: progress,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(color),
            ),
            SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${(progress * 100).toInt()}% Complete', 
                  style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                if (xp > 0) 
                  Row(
                    children: [
                      Icon(Icons.star, size: 14, color: Colors.amber),
                      Text(' $xp XP', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildAchievementCard(String title, String description, IconData icon, Color color, String timeAgo) {
    return Card(
      margin: EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color,
          child: Icon(icon, color: Colors.white),
        ),
        title: Text(title, style: TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Text(description),
        trailing: Text(timeAgo, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ),
    );
  }
}