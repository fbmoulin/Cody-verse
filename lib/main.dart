import 'package:flutter/material.dart';
import 'services/database_service.dart';

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
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => LearningModulesScreen()),
                );
              },
              child: Text('Start Learning'),
            ),
          ],
        ),
      ),
    );
  }
}

class LearningModulesScreen extends StatefulWidget {
  @override
  _LearningModulesScreenState createState() => _LearningModulesScreenState();
}

class _LearningModulesScreenState extends State<LearningModulesScreen> {
  List<Map<String, dynamic>> modules = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadModules();
  }

  Future<void> loadModules() async {
    try {
      final data = await DatabaseService.getLearningModules();
      setState(() {
        modules = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading modules: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Learning Modules'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : modules.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.school_outlined, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No modules available', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
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

class LessonsScreen extends StatefulWidget {
  final int moduleId;
  final String moduleTitle;

  LessonsScreen({required this.moduleId, required this.moduleTitle});

  @override
  _LessonsScreenState createState() => _LessonsScreenState();
}

class _LessonsScreenState extends State<LessonsScreen> {
  List<Map<String, dynamic>> lessons = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadLessons();
  }

  Future<void> loadLessons() async {
    try {
      final data = await DatabaseService.getLessonsForModule(widget.moduleId);
      setState(() {
        lessons = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.moduleTitle),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : lessons.isEmpty
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
