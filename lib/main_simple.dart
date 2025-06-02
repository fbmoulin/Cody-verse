import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cody Verse',
      theme: ThemeData(
        primarySwatch: Colors.blue,
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
              'Learn AI and MCP concepts',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
            ),
            SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => CourseScreen()),
                );
              },
              child: Text('View Course'),
            ),
          ],
        ),
      ),
    );
  }
}

class CourseScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Course Modules'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: EdgeInsets.all(16),
        children: [
          Text(
            'Scaling Course Structure',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 16),
          CourseModule(
            title: 'AI Basics',
            description: 'Fundamental concepts of artificial intelligence',
            difficulty: 'Beginner',
            duration: '45 min',
            xp: '30 XP',
            color: Colors.green,
          ),
          CourseModule(
            title: 'Prompt Engineering',
            description: 'Master effective AI prompt crafting',
            difficulty: 'Beginner',
            duration: '60 min',
            xp: '35 XP',
            color: Colors.green,
          ),
          CourseModule(
            title: 'AI Assistants',
            description: 'Build intelligent AI assistants',
            difficulty: 'Intermediate',
            duration: '75 min',
            xp: '40 XP',
            color: Colors.orange,
          ),
          CourseModule(
            title: 'AI Agents',
            description: 'Advanced autonomous AI agents',
            difficulty: 'Intermediate',
            duration: '90 min',
            xp: '50 XP',
            color: Colors.orange,
          ),
          CourseModule(
            title: 'Model Context Protocol',
            description: 'Professional MCP implementation',
            difficulty: 'Advanced',
            duration: '120 min',
            xp: '60 XP',
            color: Colors.red,
          ),
        ],
      ),
    );
  }
}

class CourseModule extends StatelessWidget {
  final String title;
  final String description;
  final String difficulty;
  final String duration;
  final String xp;
  final Color color;

  CourseModule({
    required this.title,
    required this.description,
    required this.difficulty,
    required this.duration,
    required this.xp,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.book, color: Colors.white),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        description,
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Chip(
                  label: Text(
                    difficulty,
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  backgroundColor: color,
                ),
                Row(
                  children: [
                    Icon(Icons.schedule, size: 16, color: Colors.grey),
                    SizedBox(width: 4),
                    Text(duration, style: TextStyle(fontSize: 12)),
                    SizedBox(width: 12),
                    Icon(Icons.star, size: 16, color: Colors.amber),
                    SizedBox(width: 4),
                    Text(xp, style: TextStyle(fontSize: 12)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}