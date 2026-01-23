import 'dart:async';
import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config/theme.dart';
import 'services/push_notification_service.dart';
import 'providers/programs_provider.dart';
import 'providers/theme_provider.dart';
import 'providers/settings_provider.dart';
import 'providers/user_prefs_provider.dart';
import 'providers/safety_provider.dart';
import 'providers/localization_provider.dart';
import 'providers/navigation_provider.dart';
import 'providers/accessibility_provider.dart';
import 'widgets/quick_exit_detector.dart';
import 'widgets/safety_widgets.dart';
import 'screens/for_you_screen.dart';
import 'screens/directory_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/ask_carl_screen.dart';
import 'screens/transit_screen.dart';
import 'screens/airports_screen.dart';
import 'screens/eligibility_screen.dart';
import 'screens/glossary_screen.dart';
import 'screens/more_screen.dart';
import 'widgets/desktop_sidebar.dart';
import 'widgets/liquid_glass.dart';
import 'services/keyboard_shortcuts_service.dart';
import 'services/desktop_menu_service.dart';
import 'services/export_service.dart';
import 'services/platform_service.dart';
import 'package:url_launcher/url_launcher.dart';

// Sentry DSN - set via environment or leave empty to disable
const String _sentryDsn = String.fromEnvironment(
  'SENTRY_DSN',
  defaultValue: '',
);

// Global push notification service instance
final PushNotificationService pushNotificationService = PushNotificationService();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase for Android/iOS (not web - uses browser Push API)
  if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
    await Firebase.initializeApp();
    await pushNotificationService.initialize();
  }

  // Initialize window manager for desktop (not web)
  if (!kIsWeb && PlatformService.isDesktop) {
    await PlatformService.initializeDesktopWindow();
  }

  // Check if crash reporting is enabled
  final prefs = await SharedPreferences.getInstance();
  final crashReportingEnabled =
      prefs.getBool('baynavigator:crash_reporting') ?? true;

  if (_sentryDsn.isNotEmpty && crashReportingEnabled) {
    await SentryFlutter.init(
      (options) {
        options.dsn = _sentryDsn;
        options.tracesSampleRate = 0.2;
        options.profilesSampleRate = 0.2;
      },
      appRunner: () => runApp(const BayAreaDiscountsApp()),
    );
  } else {
    runApp(const BayAreaDiscountsApp());
  }
}

class BayAreaDiscountsApp extends StatelessWidget {
  const BayAreaDiscountsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ProgramsProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => SettingsProvider()..initialize()),
        ChangeNotifierProvider(
            create: (_) => UserPrefsProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => SafetyProvider()..initialize()),
        ChangeNotifierProvider(
            create: (_) => LocalizationProvider()..initialize()),
        ChangeNotifierProvider(
            create: (_) => NavigationProvider()..initialize()),
        ChangeNotifierProvider(
            create: (_) => AccessibilityProvider()..initialize()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Bay Navigator',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: _getThemeMode(themeProvider.mode),
            home: const MainNavigation(),
          );
        },
      ),
    );
  }

  ThemeMode _getThemeMode(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return ThemeMode.light;
      case AppThemeMode.dark:
        return ThemeMode.dark;
      case AppThemeMode.system:
        return ThemeMode.system;
    }
  }
}

class MainNavigation extends StatefulWidget {
  const MainNavigation({super.key});

  @override
  State<MainNavigation> createState() => MainNavigationState();
}

class MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;
  final GlobalKey<DirectoryScreenState> _directoryKey =
      GlobalKey<DirectoryScreenState>();
  final GlobalKey<FavoritesScreenState> _favoritesKey =
      GlobalKey<FavoritesScreenState>();

  // All screens indexed by NavItems.all order
  late final Map<String, Widget> _screensMap;

  @override
  void initState() {
    super.initState();
    _screensMap = {
      'for_you': const ForYouScreen(),
      'directory': DirectoryScreen(key: _directoryKey),
      'ask_carl': const AskCarlScreen(),
      'saved': FavoritesScreen(key: _favoritesKey),
      'transit': const TransitScreen(),
      'airports': const AirportsScreen(),
      'eligibility': const EligibilityScreen(),
      'glossary': const GlossaryScreen(),
      'settings': const SettingsScreen(),
    };

    // Listen for window events on desktop (not web)
    if (!kIsWeb && PlatformService.isDesktop) {
      PlatformService.addWindowListener(this);
    }
  }

  @override
  void dispose() {
    if (!kIsWeb && PlatformService.isDesktop) {
      PlatformService.removeWindowListener(this);
    }
    super.dispose();
  }

  void goToTab(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  void focusSearch() {
    if (_currentIndex != 1) {
      setState(() => _currentIndex = 1);
    }
    _directoryKey.currentState?.focusSearch();
  }

  void openFilters() {
    if (_currentIndex != 1) {
      setState(() => _currentIndex = 1);
    }
    _directoryKey.currentState?.openFilters();
  }

  void refresh() {
    context.read<ProgramsProvider>().loadData(forceRefresh: true);
  }

  void toggleTheme() {
    context.read<ThemeProvider>().toggleTheme();
  }

  Future<void> exportSavedPrograms() async {
    final programs = context.read<ProgramsProvider>().favoritePrograms;
    if (programs.isEmpty) {
      _showSnackBar('No saved programs to export');
      return;
    }
    final success = await ExportService.saveAndShareCsv(programs, context);
    _showSnackBar(success
        ? 'Programs exported successfully'
        : 'Failed to export programs');
  }

  Future<void> printSavedPrograms() async {
    final programs = context.read<ProgramsProvider>().favoritePrograms;
    if (programs.isEmpty) {
      _showSnackBar('No saved programs to print');
      return;
    }
    final success = await ExportService.printPrograms(programs);
    if (!success) {
      _showSnackBar('Failed to prepare print preview');
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 2)),
    );
  }

  Future<void> _showClearDataDialog(BuildContext context) async {
    // Capture providers before async gap
    final programsProvider = context.read<ProgramsProvider>();
    final userPrefsProvider = context.read<UserPrefsProvider>();

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Clear All Data'),
        content: const Text(
          'This will clear your profile preferences, saved programs, and cached data. You can set them up again anytime.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      // Clear cache and favorites
      await programsProvider.clearCache();
      await programsProvider.clearAllFavorites();

      // Clear user preferences
      await userPrefsProvider.clearPreferences();

      if (mounted) {
        _showSnackBar('All data cleared');
      }
    }
  }

  Widget _buildLiquidGlassNavItem({
    required int index,
    required IconData icon,
    required IconData selectedIcon,
    required String label,
  }) {
    final isSelected = _currentIndex == index;
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 70,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: isSelected
                    ? theme.colorScheme.primary.withValues(alpha: 0.15)
                    : Colors.transparent,
              ),
              child: Icon(
                isSelected ? selectedIcon : icon,
                size: 24,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected
                    ? theme.colorScheme.primary
                    : theme.colorScheme.onSurface.withValues(alpha: 0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void showAppAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('About Bay Navigator'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
                'Your guide to local savings & benefits in the Bay Area.'),
            const SizedBox(height: 16),
            const Text('A project by Bay Tides.'),
            const SizedBox(height: 16),
            InkWell(
              onTap: () => launchUrl(Uri.parse('https://baynavigator.org')),
              child: const Text(
                'baynavigator.org',
                style: TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () => launchUrl(Uri.parse('https://baytides.org')),
              child: const Text(
                'baytides.org',
                style: TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<UserPrefsProvider>(
      builder: (context, userPrefsProvider, child) {
        // Show loading while initializing
        if (!userPrefsProvider.initialized) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Show onboarding if not complete
        if (!userPrefsProvider.onboardingComplete) {
          return OnboardingScreen(
            onComplete: ({bool showSettings = false}) {
              // Force rebuild after onboarding
              setState(() {
                // Navigate to Settings if user enabled protection
                if (showSettings) {
                  // Find the Settings index in NavItems
                  final settingsIndex =
                      NavItems.all.indexWhere((item) => item.id == 'settings');
                  if (settingsIndex != -1) {
                    _currentIndex = settingsIndex;
                  }
                }
              });
            },
          );
        }

        return _buildMainContent(context);
      },
    );
  }

  /// Navigate to a specific item by its id
  void _navigateToItem(String itemId) {
    final navProvider = context.read<NavigationProvider>();
    final tabBarItems = navProvider.tabBarItems;

    // Check if the item is in the tab bar
    final tabIndex = tabBarItems.indexWhere((item) => item.id == itemId);
    if (tabIndex != -1) {
      setState(() => _currentIndex = tabIndex);
      return;
    }

    // If not in tab bar, navigate directly to the screen
    // Find the screen index in NavItems.all
    final screenIndex = NavItems.all.indexWhere((item) => item.id == itemId);
    if (screenIndex != -1) {
      // For items in More, we temporarily show them
      // by pushing them as a new screen
      final screen = _screensMap[itemId];
      if (screen != null) {
        Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => screen),
        );
      }
    }
  }

  Widget _buildMainContent(BuildContext context) {
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final mediaQuery = MediaQuery.of(context);
    final screenWidth = mediaQuery.size.width;
    final screenHeight = mediaQuery.size.height;
    final isLandscape = screenWidth > screenHeight;

    // Use desktop-class sidebar layout when:
    // - Desktop platforms (macOS, Windows, Linux) with width >= 800
    // - Web with width >= 1024
    // - iPad/tablets (width >= 768) in any orientation for proper desktop-class experience
    // - Large phones in landscape (width >= 700)
    final isTablet = !kIsWeb && PlatformService.isMobile && screenWidth >= 768;
    final isLargePhoneLandscape = !kIsWeb &&
        PlatformService.isMobile &&
        isLandscape &&
        screenWidth >= 700 &&
        screenWidth < 768;
    final useDesktopLayout = (isDesktop && screenWidth >= 800) ||
        (kIsWeb && screenWidth >= 1024) ||
        isTablet ||
        isLargePhoneLandscape;

    Widget scaffold;

    if (useDesktopLayout) {
      // Desktop/wide layout with sidebar - show ALL items
      scaffold = Scaffold(
        body: Row(
          children: [
            // Sidebar navigation with all items
            DesktopSidebar(
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) {
                setState(() => _currentIndex = index);
              },
              onClearData: () => _showClearDataDialog(context),
            ),
            // Main content area
            Expanded(
              child: Column(
                children: [
                  // Draggable title bar area (desktop only, not web)
                  if (isDesktop)
                    GestureDetector(
                      behavior: HitTestBehavior.translucent,
                      onPanStart: (details) {
                        PlatformService.startWindowDrag();
                      },
                      onDoubleTap: () {
                        PlatformService.toggleMaximize();
                      },
                      child: Container(
                        height: 52,
                        color: Colors.transparent,
                      ),
                    ),
                  // Content - show all screens for desktop
                  Expanded(
                    child: IndexedStack(
                      index: _currentIndex,
                      children: NavItems.all
                          .map((item) =>
                              _screensMap[item.id] ?? const SizedBox())
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    } else {
      // Mobile/tablet layout with customizable bottom navigation
      final useLiquidGlass = PlatformService.isIOS;

      scaffold = Consumer<NavigationProvider>(
        builder: (context, navProvider, child) {
          final tabBarItems = navProvider.tabBarItems;
          final hasMoreItems = navProvider.moreItems.isNotEmpty;

          // Build the screens for the tab bar + More screen
          final tabScreens = <Widget>[
            ...tabBarItems
                .map((item) => _screensMap[item.id] ?? const SizedBox()),
            if (hasMoreItems) MoreScreen(onNavigate: _navigateToItem),
          ];

          return Scaffold(
            extendBody: useLiquidGlass,
            body: IndexedStack(
              index: _currentIndex.clamp(0, tabScreens.length - 1),
              children: tabScreens,
            ),
            bottomNavigationBar: useLiquidGlass
                ? LiquidGlassNavBar(
                    child: SafeArea(
                      top: false,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          // Tab bar items
                          ...tabBarItems.asMap().entries.map((entry) {
                            final index = entry.key;
                            final item = entry.value;
                            return _buildLiquidGlassNavItem(
                              index: index,
                              icon: item.icon,
                              selectedIcon: item.selectedIcon,
                              label: item.label,
                            );
                          }),
                          // More tab
                          if (hasMoreItems)
                            _buildLiquidGlassNavItem(
                              index: tabBarItems.length,
                              icon: Icons.more_horiz,
                              selectedIcon: Icons.more_horiz,
                              label: 'More',
                            ),
                        ],
                      ),
                    ),
                  )
                : NavigationBar(
                    selectedIndex: _currentIndex.clamp(
                        0, tabBarItems.length + (hasMoreItems ? 0 : -1)),
                    onDestinationSelected: (index) {
                      setState(() {
                        _currentIndex = index;
                      });
                    },
                    destinations: [
                      // Tab bar items
                      ...tabBarItems.map((item) => NavigationDestination(
                            icon: Icon(item.icon),
                            selectedIcon: Icon(item.selectedIcon),
                            label: item.label,
                          )),
                      // More tab
                      if (hasMoreItems)
                        const NavigationDestination(
                          icon: Icon(Icons.more_horiz),
                          selectedIcon: Icon(Icons.more_horiz),
                          label: 'More',
                        ),
                    ],
                  ),
          );
        },
      );
    }

    // SmartAssistant chat panel removed - AI search is now integrated
    // directly into the Directory search bar (matching website behavior)

    // Add incognito mode indicator
    scaffold = Column(
      children: [
        const IncognitoIndicator(),
        Expanded(child: scaffold),
      ],
    );

    // Wrap with quick exit detector for shake/triple-tap
    scaffold = QuickExitDetector(child: scaffold);

    // Wrap with keyboard shortcuts
    scaffold = Shortcuts(
      shortcuts: KeyboardShortcutsService.shortcuts,
      child: Actions(
        actions: {
          FocusSearchIntent: CallbackAction<FocusSearchIntent>(
            onInvoke: (_) => focusSearch(),
          ),
          OpenSettingsIntent: CallbackAction<OpenSettingsIntent>(
            onInvoke: (_) => goToTab(3),
          ),
          OpenFiltersIntent: CallbackAction<OpenFiltersIntent>(
            onInvoke: (_) => openFilters(),
          ),
          GoToHomeIntent: CallbackAction<GoToHomeIntent>(
            onInvoke: (_) => goToTab(0),
          ),
          GoToSavedIntent: CallbackAction<GoToSavedIntent>(
            onInvoke: (_) => goToTab(2),
          ),
          ToggleThemeIntent: CallbackAction<ToggleThemeIntent>(
            onInvoke: (_) => toggleTheme(),
          ),
          RefreshIntent: CallbackAction<RefreshIntent>(
            onInvoke: (_) => refresh(),
          ),
          ExportIntent: CallbackAction<ExportIntent>(
            onInvoke: (_) => exportSavedPrograms(),
          ),
          PrintIntent: CallbackAction<PrintIntent>(
            onInvoke: (_) => printSavedPrograms(),
          ),
          EscapeIntent: CallbackAction<EscapeIntent>(
            onInvoke: (_) {
              // Close any open dialogs or sheets
              if (Navigator.of(context).canPop()) {
                Navigator.of(context).pop();
              }
              return null;
            },
          ),
        },
        child: Focus(
          autofocus: true,
          child: scaffold,
        ),
      ),
    );

    // Add platform menu bar for desktop (not web)
    if (isDesktop) {
      scaffold = PlatformMenuBar(
        menus: DesktopMenuService.buildMenuBar(
          onSearch: focusSearch,
          onSettings: () => goToTab(3),
          onFilters: openFilters,
          onRefresh: refresh,
          onExport: exportSavedPrograms,
          onPrint: printSavedPrograms,
          onToggleTheme: toggleTheme,
          onGoHome: () => goToTab(0),
          onGoSaved: () => goToTab(2),
          onQuit: () => SystemNavigator.pop(),
          onAbout: showAppAboutDialog,
        ),
        child: scaffold,
      );
    }

    return scaffold;
  }
}
