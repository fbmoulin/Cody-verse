import 'dart:convert';
import 'package:http/http.dart' as http;

class DatabaseService {
  // Fetch learning modules from database
  static Future<List<Map<String, dynamic>>> getLearningModules() async {
    try {
      // Return the sample data structure that matches our PostgreSQL database
      return [
        {
          'id': 1,
          'title': 'Introduction to MCP',
          'description': 'Learn the fundamentals of Model Context Protocol and its applications in AI systems',
          'category': 'mcp_basics',
          'difficulty_level': 'beginner',
          'estimated_duration_minutes': 30,
          'xp_reward': 20,
          'is_published': true,
        },
        {
          'id': 2,
          'title': 'AI Prompt Engineering',
          'description': 'Master the art of crafting effective prompts for AI models',
          'category': 'ai_fundamentals',
          'difficulty_level': 'beginner',
          'estimated_duration_minutes': 45,
          'xp_reward': 25,
          'is_published': true,
        },
        {
          'id': 3,
          'title': 'MCP Server Setup',
          'description': 'Build and configure your first MCP server',
          'category': 'mcp_implementation',
          'difficulty_level': 'intermediate',
          'estimated_duration_minutes': 60,
          'xp_reward': 35,
          'is_published': true,
        },
        {
          'id': 4,
          'title': 'Advanced AI Concepts',
          'description': 'Explore complex AI architectures and patterns',
          'category': 'ai_advanced',
          'difficulty_level': 'advanced',
          'estimated_duration_minutes': 90,
          'xp_reward': 50,
          'is_published': true,
        },
      ];
    } catch (e) {
      print('Error fetching learning modules: $e');
      return [];
    }
  }
  
  // Fetch lessons for a specific module
  static Future<List<Map<String, dynamic>>> getLessonsForModule(int moduleId) async {
    try {
      // Sample lessons data structure from database
      Map<int, List<Map<String, dynamic>>> lessonsData = {
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
      
      return lessonsData[moduleId] ?? [];
    } catch (e) {
      print('Error fetching lessons: $e');
      return [];
    }
  }
}