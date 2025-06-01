import 'package:flutter/services.dart';
import 'package:permission_handler.dart';
import 'package:arcore_flutter_plugin/arcore_flutter_plugin.dart';
import 'database_service.dart';

class ARService {
  static ArCoreController? _arCoreController;
  
  // Check if device supports AR
  static Future<bool> isARSupported() async {
    try {
      return await ArCoreController.checkArCoreAvailability();
    } catch (e) {
      print('Error checking AR support: $e');
      return false;
    }
  }
  
  // Request camera permissions for AR
  static Future<bool> requestPermissions() async {
    try {
      final cameraStatus = await Permission.camera.request();
      return cameraStatus == PermissionStatus.granted;
    } catch (e) {
      print('Error requesting permissions: $e');
      return false;
    }
  }
  
  // Initialize AR session
  static Future<bool> initializeAR(ArCoreController controller) async {
    try {
      _arCoreController = controller;
      return true;
    } catch (e) {
      print('Error initializing AR: $e');
      return false;
    }
  }
  
  // Get AR content for a specific lesson
  static Future<List<Map<String, dynamic>>> getARContentForLesson(int lessonId) async {
    try {
      // Return AR content data structure that matches our database
      Map<int, List<Map<String, dynamic>>> arContentData = {
        1: [
          {
            'id': 1,
            'content_type': '3d_model',
            'title': 'MCP Architecture Visualization',
            'description': 'Interactive 3D model showing MCP client-server architecture',
            'model_url': '/models/mcp_architecture.glb',
            'model_scale': 0.5,
            'position_data': {'x': 0, 'y': 0, 'z': -1},
            'animation_data': {'rotate': true, 'speed': 0.1},
            'interaction_triggers': {'tap_to_expand': true, 'highlight_components': true},
            'ar_instructions': 'Point your camera at a flat surface and tap to place the MCP architecture model. Tap different components to learn about their functions.',
          },
        ],
        2: [
          {
            'id': 2,
            'content_type': 'interactive_scene',
            'title': 'Data Flow Simulation',
            'description': 'Watch how data flows through MCP protocol in real-time',
            'model_url': '/models/data_flow.glb',
            'model_scale': 0.7,
            'position_data': {'x': 0, 'y': 0, 'z': -1.5},
            'animation_data': {'flow_animation': true, 'particles': true},
            'interaction_triggers': {'start_simulation': true, 'pause_resume': true},
            'ar_instructions': 'Place the simulation in your space and tap the play button to see how data moves through MCP systems securely.',
          },
        ],
        4: [
          {
            'id': 3,
            'content_type': '3d_model',
            'title': 'AI Neural Network',
            'description': 'Explore a 3D neural network model with interactive neurons',
            'model_url': '/models/neural_network.glb',
            'model_scale': 0.8,
            'position_data': {'x': 0, 'y': 0, 'z': -1},
            'animation_data': {'pulse_neurons': true, 'signal_flow': true},
            'interaction_triggers': {'tap_neuron_info': true, 'layer_highlight': true},
            'ar_instructions': 'Place the neural network in your environment. Tap individual neurons to see their connections and understand how AI processes information.',
          },
        ],
        5: [
          {
            'id': 4,
            'content_type': 'spatial_overlay',
            'title': 'Prompt Engineering Workspace',
            'description': 'Virtual workspace showing prompt structure and AI response visualization',
            'model_url': '/models/prompt_workspace.glb',
            'model_scale': 1.0,
            'position_data': {'x': 0, 'y': -0.5, 'z': -2},
            'animation_data': {'text_animation': true, 'response_generation': true},
            'interaction_triggers': {'edit_prompt': true, 'see_response': true},
            'ar_instructions': 'Create a virtual prompt engineering workspace. Type prompts in the AR interface and see how different structures affect AI responses.',
          },
        ],
      };
      
      return arContentData[lessonId] ?? [];
    } catch (e) {
      print('Error fetching AR content: $e');
      return [];
    }
  }
  
  // Place 3D model in AR space
  static Future<void> place3DModel({
    required String modelUrl,
    required Map<String, double> position,
    required double scale,
    String? nodeName,
  }) async {
    try {
      if (_arCoreController == null) return;
      
      final node = ArCoreReferenceNode(
        name: nodeName ?? 'ar_model_${DateTime.now().millisecondsSinceEpoch}',
        object3DFileName: modelUrl,
        position: ArCoreVector3(
          position['x'] ?? 0,
          position['y'] ?? 0,
          position['z'] ?? -1,
        ),
        scale: ArCoreVector3(scale, scale, scale),
      );
      
      await _arCoreController!.addArCoreNode(node);
    } catch (e) {
      print('Error placing 3D model: $e');
    }
  }
  
  // Create interactive text overlay in AR
  static Future<void> createTextOverlay({
    required String text,
    required Map<String, double> position,
    String? nodeName,
  }) async {
    try {
      if (_arCoreController == null) return;
      
      final textNode = ArCoreNode(
        name: nodeName ?? 'text_${DateTime.now().millisecondsSinceEpoch}',
        shape: ArCoreText(
          text: text,
          extrusionDepth: 1,
          materials: [
            ArCoreMaterial(
              color: Color.fromARGB(255, 33, 150, 243),
              textureBytes: null,
            ),
          ],
        ),
        position: ArCoreVector3(
          position['x'] ?? 0,
          position['y'] ?? 0.5,
          position['z'] ?? -1,
        ),
        scale: ArCoreVector3(0.1, 0.1, 0.1),
      );
      
      await _arCoreController!.addArCoreNode(textNode);
    } catch (e) {
      print('Error creating text overlay: $e');
    }
  }
  
  // Add interactive sphere for tap interactions
  static Future<void> addInteractiveSphere({
    required Map<String, double> position,
    required Function() onTap,
    String? nodeName,
  }) async {
    try {
      if (_arCoreController == null) return;
      
      final sphereNode = ArCoreNode(
        name: nodeName ?? 'sphere_${DateTime.now().millisecondsSinceEpoch}',
        shape: ArCoreSphere(
          radius: 0.1,
          materials: [
            ArCoreMaterial(
              color: Color.fromARGB(120, 33, 150, 243),
              textureBytes: null,
            ),
          ],
        ),
        position: ArCoreVector3(
          position['x'] ?? 0,
          position['y'] ?? 0,
          position['z'] ?? -1,
        ),
      );
      
      await _arCoreController!.addArCoreNode(sphereNode);
    } catch (e) {
      print('Error adding interactive sphere: $e');
    }
  }
  
  // Track AR session for analytics
  static Future<void> startARSession({
    required int userId,
    required int arContentId,
    required Map<String, dynamic> deviceInfo,
  }) async {
    try {
      // In production, this would insert into ar_user_sessions table
      print('AR session started: User $userId, Content $arContentId');
    } catch (e) {
      print('Error starting AR session: $e');
    }
  }
  
  // End AR session and save analytics
  static Future<void> endARSession({
    required int userId,
    required int arContentId,
    required int durationSeconds,
    required int interactionsCount,
    required String completionStatus,
  }) async {
    try {
      // In production, this would update the ar_user_sessions table
      print('AR session ended: Duration ${durationSeconds}s, Interactions $interactionsCount');
    } catch (e) {
      print('Error ending AR session: $e');
    }
  }
  
  // Dispose AR resources
  static Future<void> dispose() async {
    try {
      if (_arCoreController != null) {
        await _arCoreController!.dispose();
        _arCoreController = null;
      }
    } catch (e) {
      print('Error disposing AR controller: $e');
    }
  }
}