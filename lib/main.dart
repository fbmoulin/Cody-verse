import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'app/app.dart';
import 'shared/services/firebase_service.dart';
import 'shared/services/notification_service.dart';
import 'shared/services/storage_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Hive
  await Hive.initFlutter();
  await StorageService.initialize();
  
  // Initialize Firebase services
  await FirebaseService.initialize();
  
  // Initialize notifications
  await NotificationService.initialize();
  
  runApp(
    ProviderScope(
      child: CodyVerseApp(),
    ),
  );
}
