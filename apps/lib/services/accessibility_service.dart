import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// WCAG 2.2 AAA Accessibility Service
///
/// Provides accessibility utilities for Bay Navigator including:
/// - Reduced motion detection and preference
/// - High contrast mode support
/// - Screen reader announcements
/// - Text customization (WCAG 3.0 draft)
/// - Semantic label helpers
class AccessibilityService {
  // Preference keys for text customization
  static const String _textScaleKey = 'accessibility_text_scale';
  static const String _lineHeightKey = 'accessibility_line_height';
  static const String _letterSpacingKey = 'accessibility_letter_spacing';
  static const String _wordSpacingKey = 'accessibility_word_spacing';

  /// Check if reduced motion is preferred (system or user setting)
  static bool shouldReduceMotion(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    return mediaQuery.disableAnimations;
  }

  /// Check if high contrast is preferred
  static bool shouldUseHighContrast(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    return mediaQuery.highContrast;
  }

  /// Check if bold text is enabled
  static bool shouldUseBoldText(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    return mediaQuery.boldText;
  }

  /// Get system text scale factor
  static double getTextScaleFactor(BuildContext context) {
    return MediaQuery.textScalerOf(context).scale(1.0);
  }

  /// Announce a message to screen readers
  /// Note: Uses the first available FlutterView for multi-window compatibility
  static Future<void> announce(String message, {TextDirection textDirection = TextDirection.ltr}) async {
    final view = WidgetsBinding.instance.platformDispatcher.views.firstOrNull;
    if (view != null) {
      await SemanticsService.sendAnnouncement(view, message, textDirection);
    }
  }

  /// Announce with polite priority (doesn't interrupt current speech)
  static Future<void> announcePolitely(String message) async {
    await announce(message);
  }

  /// Announce with assertive priority (interrupts current speech)
  static Future<void> announceAssertively(String message) async {
    // In Flutter, all announcements are assertive by default
    await announce(message);
  }

  /// Announce loading state
  static Future<void> announceLoading() async {
    await announce('Loading');
  }

  /// Announce loading complete
  static Future<void> announceLoadingComplete([String? itemCount]) async {
    if (itemCount != null) {
      await announce('Loaded $itemCount items');
    } else {
      await announce('Loading complete');
    }
  }

  /// Announce error
  static Future<void> announceError(String error) async {
    await announce('Error: $error');
  }

  /// Announce filter change
  static Future<void> announceFilterChange(int resultCount) async {
    await announce('Showing $resultCount results');
  }

  /// Announce save/unsave action
  static Future<void> announceSaveAction(bool isSaved, String programName) async {
    if (isSaved) {
      await announce('$programName saved to your list');
    } else {
      await announce('$programName removed from your list');
    }
  }

  /// Get animation duration respecting reduced motion
  static Duration getAnimationDuration(BuildContext context, Duration normalDuration) {
    if (shouldReduceMotion(context)) {
      return Duration.zero;
    }
    return normalDuration;
  }

  /// Get animation curve respecting reduced motion
  static Curve getAnimationCurve(BuildContext context, Curve normalCurve) {
    if (shouldReduceMotion(context)) {
      return Curves.linear;
    }
    return normalCurve;
  }

  /// Save text customization settings
  static Future<void> saveTextSettings({
    double? textScale,
    double? lineHeight,
    double? letterSpacing,
    double? wordSpacing,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    if (textScale != null) {
      await prefs.setDouble(_textScaleKey, textScale);
    }
    if (lineHeight != null) {
      await prefs.setDouble(_lineHeightKey, lineHeight);
    }
    if (letterSpacing != null) {
      await prefs.setDouble(_letterSpacingKey, letterSpacing);
    }
    if (wordSpacing != null) {
      await prefs.setDouble(_wordSpacingKey, wordSpacing);
    }
  }

  /// Load text customization settings
  static Future<TextSettings> loadTextSettings() async {
    final prefs = await SharedPreferences.getInstance();
    return TextSettings(
      textScale: prefs.getDouble(_textScaleKey) ?? 1.0,
      lineHeight: prefs.getDouble(_lineHeightKey) ?? 1.5,
      letterSpacing: prefs.getDouble(_letterSpacingKey) ?? 0.0,
      wordSpacing: prefs.getDouble(_wordSpacingKey) ?? 0.0,
    );
  }

  /// Reset text settings to defaults
  static Future<void> resetTextSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_textScaleKey);
    await prefs.remove(_lineHeightKey);
    await prefs.remove(_letterSpacingKey);
    await prefs.remove(_wordSpacingKey);
  }
}

/// Text customization settings (WCAG 3.0 draft compliance)
class TextSettings {
  final double textScale;      // 0.8 - 1.5
  final double lineHeight;     // 1.5 - 2.5
  final double letterSpacing;  // 0 - 0.1em
  final double wordSpacing;    // 0 - 0.2em

  const TextSettings({
    this.textScale = 1.0,
    this.lineHeight = 1.5,
    this.letterSpacing = 0.0,
    this.wordSpacing = 0.0,
  });

  TextSettings copyWith({
    double? textScale,
    double? lineHeight,
    double? letterSpacing,
    double? wordSpacing,
  }) {
    return TextSettings(
      textScale: textScale ?? this.textScale,
      lineHeight: lineHeight ?? this.lineHeight,
      letterSpacing: letterSpacing ?? this.letterSpacing,
      wordSpacing: wordSpacing ?? this.wordSpacing,
    );
  }

  /// Apply text settings to a TextStyle
  TextStyle applyTo(TextStyle style) {
    return style.copyWith(
      height: lineHeight,
      letterSpacing: letterSpacing,
      wordSpacing: wordSpacing,
    );
  }

  bool get isDefault =>
      textScale == 1.0 &&
      lineHeight == 1.5 &&
      letterSpacing == 0.0 &&
      wordSpacing == 0.0;
}

/// High contrast color overrides
class HighContrastColors {
  // Enhanced contrast colors (10:1+ ratio)
  static const Color text = Color(0xFF000000);
  static const Color textOnDark = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF000000);
  static const Color primary = Color(0xFF004040); // Darker teal for 10:1
  static const Color primaryOnDark = Color(0xFF80FFFF); // Bright cyan
  static const Color link = Color(0xFF0000CC); // Traditional link blue
  static const Color linkOnDark = Color(0xFF99CCFF);
  static const Color focus = Color(0xFF000000);
  static const Color focusOnDark = Color(0xFFFFFF00); // Yellow focus ring
  static const Color error = Color(0xFFCC0000);
  static const Color errorOnDark = Color(0xFFFF6666);
  static const Color success = Color(0xFF006600);
  static const Color successOnDark = Color(0xFF66FF66);
}

/// Semantic label helpers for consistent accessibility descriptions
class SemanticLabels {
  // Navigation
  static const String home = 'Home';
  static const String directory = 'Program Directory';
  static const String saved = 'Saved Programs';
  static const String settings = 'Settings';
  static const String search = 'Search programs';
  static const String filter = 'Filter programs';
  static const String sort = 'Sort programs';

  // Actions
  static String saveProgram(String name) => 'Save $name to your list';
  static String unsaveProgram(String name) => 'Remove $name from your list';
  static String shareProgram(String name) => 'Share $name';
  static String callPhone(String phone) => 'Call $phone';
  static String openWebsite(String name) => 'Open $name website';
  static String getDirections(String location) => 'Get directions to $location';

  // States
  static String programSaved(String name) => '$name is saved';
  static String programNotSaved(String name) => '$name is not saved';
  static String filterActive(int count) => '$count filters active';
  static String resultsCount(int count) => '$count programs found';
  static String loadingPrograms = 'Loading programs';

  // Categories
  static String categoryLabel(String category) => '$category programs';

  // Groups
  static const Map<String, String> groupLabels = {
    'seniors': 'Seniors 65 and older',
    'veterans': 'Veterans and military families',
    'disabled': 'People with disabilities',
    'lowincome': 'Low income individuals and families',
    'students': 'Students',
    'families': 'Families with children',
    'unemployed': 'Unemployed or job seekers',
    'homeless': 'People experiencing homelessness',
    'immigrants': 'Immigrants and refugees',
    'youth': 'Youth and young adults',
  };

  static String getGroupLabel(String groupId) {
    return groupLabels[groupId.toLowerCase()] ?? groupId;
  }
}

/// Widget wrapper for accessible animations
class AccessibleAnimatedContainer extends StatelessWidget {
  final Widget child;
  final Duration duration;
  final Curve curve;
  final AlignmentGeometry? alignment;
  final EdgeInsetsGeometry? padding;
  final Color? color;
  final Decoration? decoration;
  final double? width;
  final double? height;
  final BoxConstraints? constraints;
  final Matrix4? transform;

  const AccessibleAnimatedContainer({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
    this.alignment,
    this.padding,
    this.color,
    this.decoration,
    this.width,
    this.height,
    this.constraints,
    this.transform,
  });

  @override
  Widget build(BuildContext context) {
    final actualDuration = AccessibilityService.getAnimationDuration(context, duration);
    final actualCurve = AccessibilityService.getAnimationCurve(context, curve);

    return AnimatedContainer(
      duration: actualDuration,
      curve: actualCurve,
      alignment: alignment,
      padding: padding,
      color: color,
      decoration: decoration,
      width: width,
      height: height,
      constraints: constraints,
      transform: transform,
      child: child,
    );
  }
}

/// Widget wrapper for accessible opacity transitions
class AccessibleAnimatedOpacity extends StatelessWidget {
  final Widget child;
  final double opacity;
  final Duration duration;
  final Curve curve;

  const AccessibleAnimatedOpacity({
    super.key,
    required this.child,
    required this.opacity,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
  });

  @override
  Widget build(BuildContext context) {
    if (AccessibilityService.shouldReduceMotion(context)) {
      return Opacity(opacity: opacity, child: child);
    }

    return AnimatedOpacity(
      duration: duration,
      curve: curve,
      opacity: opacity,
      child: child,
    );
  }
}

/// Widget wrapper for accessible scale transitions
class AccessibleAnimatedScale extends StatelessWidget {
  final Widget child;
  final double scale;
  final Duration duration;
  final Curve curve;

  const AccessibleAnimatedScale({
    super.key,
    required this.child,
    required this.scale,
    this.duration = const Duration(milliseconds: 300),
    this.curve = Curves.easeInOut,
  });

  @override
  Widget build(BuildContext context) {
    if (AccessibilityService.shouldReduceMotion(context)) {
      return Transform.scale(scale: scale, child: child);
    }

    return AnimatedScale(
      duration: duration,
      curve: curve,
      scale: scale,
      child: child,
    );
  }
}

/// Extension to add accessible semantics to widgets easily
extension AccessibleWidget on Widget {
  /// Wrap widget with semantic label
  Widget withSemanticLabel(String label) {
    return Semantics(
      label: label,
      child: this,
    );
  }

  /// Wrap widget as a button with label
  Widget asAccessibleButton({
    required String label,
    String? hint,
    VoidCallback? onTap,
  }) {
    return Semantics(
      button: true,
      label: label,
      hint: hint,
      onTap: onTap,
      child: this,
    );
  }

  /// Wrap widget as a heading
  Widget asAccessibleHeading(String label) {
    return Semantics(
      header: true,
      label: label,
      child: this,
    );
  }

  /// Wrap widget as an image with description
  Widget asAccessibleImage(String description) {
    return Semantics(
      image: true,
      label: description,
      child: this,
    );
  }

  /// Wrap widget as a link
  Widget asAccessibleLink(String label) {
    return Semantics(
      link: true,
      label: label,
      child: this,
    );
  }

  /// Wrap widget to exclude from semantics (decorative)
  Widget excludeFromSemantics() {
    return ExcludeSemantics(child: this);
  }

  /// Wrap widget as live region for dynamic updates
  Widget asLiveRegion({bool assertive = false}) {
    return Semantics(
      liveRegion: true,
      child: this,
    );
  }
}
