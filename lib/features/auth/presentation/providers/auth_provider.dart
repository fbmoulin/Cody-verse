import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../../../shared/models/user_model.dart';
import '../../../../shared/services/storage_service.dart';
import '../../../../shared/services/analytics_service.dart';
import '../../../../shared/services/notification_service.dart';
import '../../../gamification/presentation/providers/gamification_provider.dart';
import '../../data/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository();
});

final authStateProvider = StreamProvider<User?>((ref) {
  return FirebaseAuth.instance.authStateChanges();
});

final currentUserProvider = FutureProvider<UserModel?>((ref) async {
  final authUser = ref.watch(authStateProvider).asData?.value;
  
  if (authUser == null) return null;
  
  // First check local storage
  final localUser = StorageService.getUser();
  if (localUser != null && localUser.id == authUser.uid) {
    return localUser;
  }
  
  // If not in local storage, fetch from repository
  final repository = ref.read(authRepositoryProvider);
  return repository.getCurrentUser();
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authStateProvider);
  return authState.asData?.value != null;
});

final authLoadingProvider = StateProvider<bool>((ref) => false);

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repository;
  final StateNotifierProviderRef _ref;

  AuthNotifier(this._repository, this._ref) : super(const AsyncValue.loading()) {
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final user = await _repository.getCurrentUser();
      state = AsyncValue.data(user);
      
      if (user != null) {
        // Set analytics user properties
        await AnalyticsService.setUserId(user.id);
        await AnalyticsService.setUserProperties(
          level: user.level.toString(),
          totalXP: user.xp.toString(),
          completedLessons: user.completedLessons.length.toString(),
          streakDays: user.streak.toString(),
        );
        
        // Check daily streak
        await NotificationService.checkDailyStreak(user.id);
        
        // Initialize gamification
        _ref.read(gamificationProvider.notifier).loadUserProgress();
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
    }
  }

  Future<bool> signIn({required String email, required String password}) async {
    try {
      _ref.read(authLoadingProvider.notifier).state = true;
      state = const AsyncValue.loading();
      
      final success = await _repository.signIn(email: email, password: password);
      
      if (success) {
        final user = await _repository.getCurrentUser();
        state = AsyncValue.data(user);
        
        if (user != null) {
          // Analytics
          await AnalyticsService.trackAppOpened(source: 'login');
          await AnalyticsService.setUserId(user.id);
          await AnalyticsService.setUserProperties(
            level: user.level.toString(),
            totalXP: user.xp.toString(),
            completedLessons: user.completedLessons.length.toString(),
            streakDays: user.streak.toString(),
          );
          
          // Check streak
          await NotificationService.checkDailyStreak(user.id);
          
          // Initialize gamification
          _ref.read(gamificationProvider.notifier).loadUserProgress();
        }
        
        return true;
      } else {
        state = const AsyncValue.data(null);
        return false;
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Sign in failed: $e',
        screenName: 'login_screen',
      );
      return false;
    } finally {
      _ref.read(authLoadingProvider.notifier).state = false;
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      _ref.read(authLoadingProvider.notifier).state = true;
      state = const AsyncValue.loading();
      
      final success = await _repository.signUp(
        email: email,
        password: password,
        displayName: displayName,
      );
      
      if (success) {
        final user = await _repository.getCurrentUser();
        state = AsyncValue.data(user);
        
        if (user != null) {
          // Analytics
          await AnalyticsService.trackAppOpened(source: 'registration');
          await AnalyticsService.setUserId(user.id);
          await AnalyticsService.setUserProperties(
            level: user.level.toString(),
            totalXP: user.xp.toString(),
            completedLessons: user.completedLessons.length.toString(),
            streakDays: user.streak.toString(),
          );
          
          // Initialize gamification for new user
          _ref.read(gamificationProvider.notifier).initializeNewUser();
          
          // Show welcome achievement
          await _ref.read(gamificationProvider.notifier).unlockAchievement('welcome_aboard');
        }
        
        return true;
      } else {
        state = const AsyncValue.data(null);
        return false;
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Sign up failed: $e',
        screenName: 'register_screen',
      );
      return false;
    } finally {
      _ref.read(authLoadingProvider.notifier).state = false;
    }
  }

  Future<bool> signInWithGoogle() async {
    try {
      _ref.read(authLoadingProvider.notifier).state = true;
      state = const AsyncValue.loading();
      
      final success = await _repository.signInWithGoogle();
      
      if (success) {
        final user = await _repository.getCurrentUser();
        state = AsyncValue.data(user);
        
        if (user != null) {
          // Analytics
          await AnalyticsService.trackAppOpened(source: 'google_login');
          await AnalyticsService.setUserId(user.id);
          await AnalyticsService.setUserProperties(
            level: user.level.toString(),
            totalXP: user.xp.toString(),
            completedLessons: user.completedLessons.length.toString(),
            streakDays: user.streak.toString(),
          );
          
          // Check if this is a new user (no completed lessons)
          if (user.completedLessons.isEmpty) {
            _ref.read(gamificationProvider.notifier).initializeNewUser();
            await _ref.read(gamificationProvider.notifier).unlockAchievement('welcome_aboard');
          } else {
            _ref.read(gamificationProvider.notifier).loadUserProgress();
          }
          
          // Check streak
          await NotificationService.checkDailyStreak(user.id);
        }
        
        return true;
      } else {
        state = const AsyncValue.data(null);
        return false;
      }
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Google sign in failed: $e',
        screenName: 'login_screen',
      );
      return false;
    } finally {
      _ref.read(authLoadingProvider.notifier).state = false;
    }
  }

  Future<void> signOut() async {
    try {
      await _repository.signOut();
      state = const AsyncValue.data(null);
      
      // Clear local data
      await StorageService.clearUserData();
      
      // Reset gamification state
      _ref.read(gamificationProvider.notifier).reset();
      
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Sign out failed: $e',
      );
    }
  }

  Future<bool> updateProfile({
    String? displayName,
    String? photoURL,
  }) async {
    try {
      final success = await _repository.updateProfile(
        displayName: displayName,
        photoURL: photoURL,
      );
      
      if (success) {
        final user = await _repository.getCurrentUser();
        state = AsyncValue.data(user);
      }
      
      return success;
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Profile update failed: $e',
        screenName: 'profile_screen',
      );
      return false;
    }
  }

  Future<bool> resetPassword(String email) async {
    try {
      return await _repository.resetPassword(email);
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Password reset failed: $e',
      );
      return false;
    }
  }

  Future<bool> updateEmail(String newEmail, String currentPassword) async {
    try {
      return await _repository.updateEmail(newEmail, currentPassword);
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Email update failed: $e',
        screenName: 'profile_screen',
      );
      return false;
    }
  }

  Future<bool> updatePassword(String currentPassword, String newPassword) async {
    try {
      return await _repository.updatePassword(currentPassword, newPassword);
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Password update failed: $e',
        screenName: 'profile_screen',
      );
      return false;
    }
  }

  Future<bool> deleteAccount(String password) async {
    try {
      final success = await _repository.deleteAccount(password);
      
      if (success) {
        state = const AsyncValue.data(null);
        await StorageService.clearAll();
        _ref.read(gamificationProvider.notifier).reset();
      }
      
      return success;
    } catch (e) {
      await AnalyticsService.trackError(
        errorType: 'auth_error',
        errorMessage: 'Account deletion failed: $e',
        screenName: 'profile_screen',
      );
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository, ref);
});

// Convenience providers
final userProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).asData?.value;
});

final userXPProvider = Provider<int>((ref) {
  final user = ref.watch(userProvider);
  return user?.xp ?? 0;
});

final userLevelProvider = Provider<int>((ref) {
  final user = ref.watch(userProvider);
  return user?.level ?? 1;
});

final userStreakProvider = Provider<int>((ref) {
  final user = ref.watch(userProvider);
  return user?.streak ?? 0;
});

final completedLessonsProvider = Provider<List<String>>((ref) {
  final user = ref.watch(userProvider);
  return user?.completedLessons ?? [];
});

final unlockedAchievementsProvider = Provider<List<String>>((ref) {
  final user = ref.watch(userProvider);
  return user?.unlockedAchievements ?? [];
});
