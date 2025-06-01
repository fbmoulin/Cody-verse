import 'package:flutter/material.dart';

extension ContextExtensions on BuildContext {
  // Theme extensions
  ThemeData get theme => Theme.of(this);
  ColorScheme get colorScheme => theme.colorScheme;
  TextTheme get textTheme => theme.textTheme;
  
  // MediaQuery extensions
  MediaQueryData get mediaQuery => MediaQuery.of(this);
  Size get screenSize => mediaQuery.size;
  double get screenWidth => screenSize.width;
  double get screenHeight => screenSize.height;
  EdgeInsets get padding => mediaQuery.padding;
  EdgeInsets get viewInsets => mediaQuery.viewInsets;
  double get devicePixelRatio => mediaQuery.devicePixelRatio;
  Brightness get brightness => mediaQuery.platformBrightness;
  
  // Responsive design helpers
  bool get isSmallScreen => screenWidth < 600;
  bool get isMediumScreen => screenWidth >= 600 && screenWidth < 1200;
  bool get isLargeScreen => screenWidth >= 1200;
  
  bool get isPortrait => screenHeight > screenWidth;
  bool get isLandscape => screenWidth > screenHeight;
  
  // Safe area helpers
  double get statusBarHeight => padding.top;
  double get bottomPadding => padding.bottom;
  double get availableHeight => screenHeight - statusBarHeight - bottomPadding;
  
  // Navigation helpers
  void pop([Object? result]) => Navigator.of(this).pop(result);
  
  Future<T?> push<T extends Object?>(Route<T> route) =>
      Navigator.of(this).push(route);
  
  Future<T?> pushNamed<T extends Object?>(String routeName, {Object? arguments}) =>
      Navigator.of(this).pushNamed(routeName, arguments: arguments);
  
  Future<T?> pushReplacement<T extends Object?, TO extends Object?>(
    Route<T> newRoute, {
    TO? result,
  }) =>
      Navigator.of(this).pushReplacement(newRoute, result: result);
  
  Future<T?> pushReplacementNamed<T extends Object?, TO extends Object?>(
    String routeName, {
    TO? result,
    Object? arguments,
  }) =>
      Navigator.of(this).pushReplacementNamed(
        routeName,
        result: result,
        arguments: arguments,
      );
  
  void popUntil(RoutePredicate predicate) =>
      Navigator.of(this).popUntil(predicate);
  
  // Snackbar helpers
  void showSnackBar(
    String message, {
    Duration duration = const Duration(seconds: 4),
    SnackBarAction? action,
    Color? backgroundColor,
  }) {
    ScaffoldMessenger.of(this).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
        action: action,
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
  
  void showErrorSnackBar(String message) {
    showSnackBar(
      message,
      backgroundColor: colorScheme.error,
    );
  }
  
  void showSuccessSnackBar(String message) {
    showSnackBar(
      message,
      backgroundColor: Colors.green,
    );
  }
  
  // Dialog helpers
  Future<T?> showCustomDialog<T>({
    required Widget child,
    bool barrierDismissible = true,
    Color? barrierColor,
  }) {
    return showDialog<T>(
      context: this,
      barrierDismissible: barrierDismissible,
      barrierColor: barrierColor,
      builder: (context) => child,
    );
  }
  
  Future<bool?> showConfirmDialog({
    required String title,
    required String content,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
  }) {
    return showCustomDialog<bool>(
      child: AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => pop(false),
            child: Text(cancelText),
          ),
          FilledButton(
            onPressed: () => pop(true),
            child: Text(confirmText),
          ),
        ],
      ),
    );
  }
  
  // Bottom sheet helpers
  Future<T?> showCustomBottomSheet<T>({
    required Widget child,
    bool isScrollControlled = false,
    bool isDismissible = true,
    bool enableDrag = true,
  }) {
    return showModalBottomSheet<T>(
      context: this,
      isScrollControlled: isScrollControlled,
      isDismissible: isDismissible,
      enableDrag: enableDrag,
      builder: (context) => child,
    );
  }
  
  // Focus helpers
  void unfocus() => FocusScope.of(this).unfocus();
  
  void requestFocus(FocusNode focusNode) =>
      FocusScope.of(this).requestFocus(focusNode);
  
  // Keyboard helpers
  bool get isKeyboardVisible => viewInsets.bottom > 0;
  
  // Spacing helpers
  SizedBox get verticalSpaceSmall => const SizedBox(height: 8);
  SizedBox get verticalSpaceMedium => const SizedBox(height: 16);
  SizedBox get verticalSpaceLarge => const SizedBox(height: 24);
  SizedBox get verticalSpaceExtraLarge => const SizedBox(height: 32);
  
  SizedBox get horizontalSpaceSmall => const SizedBox(width: 8);
  SizedBox get horizontalSpaceMedium => const SizedBox(width: 16);
  SizedBox get horizontalSpaceLarge => const SizedBox(width: 24);
  SizedBox get horizontalSpaceExtraLarge => const SizedBox(width: 32);
}
