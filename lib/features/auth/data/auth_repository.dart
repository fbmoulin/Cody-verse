import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../../shared/models/user_model.dart';
import '../../../shared/services/firebase_service.dart';
import '../../../shared/services/storage_service.dart';

class AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  /// Get the current authenticated user
  Future<UserModel?> getCurrentUser() async {
    try {
      final firebaseUser = _auth.currentUser;
      if (firebaseUser == null) return null;

      // First check local storage
      final localUser = StorageService.getUser();
      if (localUser != null && localUser.id == firebaseUser.uid) {
        return localUser;
      }

      // If not in local storage, fetch from Firestore
      final firestoreUser = await FirebaseService.getUser(firebaseUser.uid);
      if (firestoreUser != null) {
        // Save to local storage
        await StorageService.saveUser(firestoreUser);
        return firestoreUser;
      }

      // If not in Firestore, create new user record
      final newUser = UserModel(
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName ?? 'Cody User',
        photoURL: firebaseUser.photoURL,
        lastActiveDate: DateTime.now(),
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Save to Firestore and local storage
      await FirebaseService.createUser(newUser);
      await StorageService.saveUser(newUser);
      
      return newUser;
    } catch (e) {
      print('Error getting current user: $e');
      return null;
    }
  }

  /// Sign in with email and password
  Future<bool> signIn({required String email, required String password}) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        await _updateUserData(credential.user!);
        return true;
      }
      return false;
    } on FirebaseAuthException catch (e) {
      print('Sign in error: ${e.message}');
      return false;
    } catch (e) {
      print('Unexpected sign in error: $e');
      return false;
    }
  }

  /// Sign up with email and password
  Future<bool> signUp({
    required String email,
    required String password,
    required String displayName,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        // Update display name
        await credential.user!.updateDisplayName(displayName);
        
        // Create user record
        await _createUserRecord(credential.user!, displayName);
        return true;
      }
      return false;
    } on FirebaseAuthException catch (e) {
      print('Sign up error: ${e.message}');
      return false;
    } catch (e) {
      print('Unexpected sign up error: $e');
      return false;
    }
  }

  /// Sign in with Google
  Future<bool> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return false;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await _auth.signInWithCredential(credential);
      
      if (userCredential.user != null) {
        await _updateUserData(userCredential.user!);
        return true;
      }
      return false;
    } catch (e) {
      print('Google sign in error: $e');
      return false;
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await Future.wait([
        _auth.signOut(),
        _googleSignIn.signOut(),
      ]);
      
      // Clear local storage
      await StorageService.clearUserData();
    } catch (e) {
      print('Sign out error: $e');
    }
  }

  /// Update user profile
  Future<bool> updateProfile({String? displayName, String? photoURL}) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return false;

      if (displayName != null) {
        await user.updateDisplayName(displayName);
      }
      
      if (photoURL != null) {
        await user.updatePhotoURL(photoURL);
      }

      await _updateUserData(user);
      return true;
    } catch (e) {
      print('Profile update error: $e');
      return false;
    }
  }

  /// Reset password
  Future<bool> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
      return true;
    } catch (e) {
      print('Password reset error: $e');
      return false;
    }
  }

  /// Update email
  Future<bool> updateEmail(String newEmail, String currentPassword) async {
    try {
      final user = _auth.currentUser;
      if (user == null || user.email == null) return false;

      // Re-authenticate user
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(credential);

      // Update email
      await user.updateEmail(newEmail);
      await _updateUserData(user);
      return true;
    } catch (e) {
      print('Email update error: $e');
      return false;
    }
  }

  /// Update password
  Future<bool> updatePassword(String currentPassword, String newPassword) async {
    try {
      final user = _auth.currentUser;
      if (user == null || user.email == null) return false;

      // Re-authenticate user
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: currentPassword,
      );
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);
      return true;
    } catch (e) {
      print('Password update error: $e');
      return false;
    }
  }

  /// Delete account
  Future<bool> deleteAccount(String password) async {
    try {
      final user = _auth.currentUser;
      if (user == null || user.email == null) return false;

      // Re-authenticate user
      final credential = EmailAuthProvider.credential(
        email: user.email!,
        password: password,
      );
      await user.reauthenticateWithCredential(credential);

      // Delete user data from Firestore
      // Note: This would require admin privileges in production
      // In a real app, you'd call a cloud function to handle data deletion
      
      // Delete user account
      await user.delete();
      
      // Clear local storage
      await StorageService.clearAll();
      
      return true;
    } catch (e) {
      print('Account deletion error: $e');
      return false;
    }
  }

  /// Refresh current user data
  Future<bool> refreshUser() async {
    try {
      await _auth.currentUser?.reload();
      final user = _auth.currentUser;
      if (user != null) {
        await _updateUserData(user);
        return true;
      }
      return false;
    } catch (e) {
      print('User refresh error: $e');
      return false;
    }
  }

  /// Send email verification
  Future<bool> sendEmailVerification() async {
    try {
      final user = _auth.currentUser;
      if (user != null && !user.emailVerified) {
        await user.sendEmailVerification();
        return true;
      }
      return false;
    } catch (e) {
      print('Email verification error: $e');
      return false;
    }
  }

  /// Check if email is verified
  bool isEmailVerified() {
    return _auth.currentUser?.emailVerified ?? false;
  }

  /// Get current Firebase user
  User? get currentFirebaseUser => _auth.currentUser;

  /// Create user record in Firestore
  Future<void> _createUserRecord(User firebaseUser, String displayName) async {
    final userModel = UserModel(
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: displayName,
      photoURL: firebaseUser.photoURL,
      lastActiveDate: DateTime.now(),
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );

    await FirebaseService.createUser(userModel);
    await StorageService.saveUser(userModel);
  }

  /// Update user data in Firestore and local storage
  Future<void> _updateUserData(User firebaseUser) async {
    try {
      // Get existing user data
      UserModel? existingUser = await FirebaseService.getUser(firebaseUser.uid);
      
      if (existingUser != null) {
        // Update existing user with latest Firebase data
        final updatedUser = existingUser.copyWith(
          email: firebaseUser.email ?? existingUser.email,
          displayName: firebaseUser.displayName ?? existingUser.displayName,
          photoURL: firebaseUser.photoURL,
          lastActiveDate: DateTime.now(),
          updatedAt: DateTime.now(),
        );
        
        await FirebaseService.updateUser(updatedUser);
        await StorageService.saveUser(updatedUser);
      } else {
        // Create new user record if doesn't exist
        await _createUserRecord(firebaseUser, firebaseUser.displayName ?? 'Cody User');
      }
    } catch (e) {
      print('Error updating user data: $e');
    }
  }

  /// Listen to auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Listen to user changes
  Stream<User?> get userChanges => _auth.userChanges();
}
