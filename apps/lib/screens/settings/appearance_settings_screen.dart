import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/localization_provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/localization_service.dart';
import '../../config/theme.dart';

class AppearanceSettingsScreen extends StatelessWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
      ),
      body: ListView(
        children: [
          // Theme Section
          _buildSection(
            context,
            title: 'Theme',
            children: [
              Consumer<ThemeProvider>(
                builder: (context, themeProvider, child) {
                  return RadioGroup<AppThemeMode>(
                    groupValue: themeProvider.mode,
                    onChanged: (value) {
                      if (value != null) {
                        HapticFeedback.lightImpact();
                        themeProvider.setMode(value);
                      }
                    },
                    child: Column(
                      children: [
                        for (final mode in AppThemeMode.values)
                          RadioListTile<AppThemeMode>(
                            title: Text(_getThemeModeName(mode)),
                            subtitle: Text(_getThemeModeDescription(mode)),
                            secondary: Icon(_getThemeModeIcon(mode)),
                            value: mode,
                          ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),

          // Directory View Section
          _buildSection(
            context,
            title: 'Directory View',
            children: [
              Consumer<SettingsProvider>(
                builder: (context, settings, child) {
                  return RadioGroup<DirectoryViewMode>(
                    groupValue: settings.directoryViewMode,
                    onChanged: (value) {
                      if (value != null) {
                        HapticFeedback.lightImpact();
                        settings.setDirectoryViewMode(value);
                      }
                    },
                    child: Column(
                      children: [
                        RadioListTile<DirectoryViewMode>(
                          title: const Text('Comfort'),
                          subtitle: const Text('Full cards with descriptions'),
                          secondary: const Icon(Icons.grid_view),
                          value: DirectoryViewMode.comfort,
                        ),
                        RadioListTile<DirectoryViewMode>(
                          title: const Text('Condensed'),
                          subtitle: const Text('Compact list for quick browsing'),
                          secondary: const Icon(Icons.view_list),
                          value: DirectoryViewMode.condensed,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),

          // Language Section
          _buildSection(
            context,
            title: 'Language',
            children: [
              Consumer<LocalizationProvider>(
                builder: (context, localization, child) {
                  return RadioGroup<AppLocale>(
                    groupValue: localization.currentLocale,
                    onChanged: (value) async {
                      if (value != null) {
                        HapticFeedback.lightImpact();
                        await localization.setLocale(value);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Language changed to ${value.nativeName}'),
                            ),
                          );
                        }
                      }
                    },
                    child: Column(
                      children: [
                        for (final locale in AppLocale.values)
                          RadioListTile<AppLocale>(
                            title: Row(
                              children: [
                                Text(locale.flag, style: const TextStyle(fontSize: 20)),
                                const SizedBox(width: 8),
                                Text(locale.nativeName),
                              ],
                            ),
                            subtitle: locale.name != locale.nativeName
                                ? Text(locale.name)
                                : null,
                            value: locale,
                          ),
                      ],
                    ),
                  );
                },
              ),
            ],
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required List<Widget> children,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
          child: Text(
            title.toUpperCase(),
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkCard : AppColors.lightCard,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  String _getThemeModeName(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return 'Light';
      case AppThemeMode.dark:
        return 'Dark';
      case AppThemeMode.system:
        return 'System';
    }
  }

  String _getThemeModeDescription(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return 'Always use light theme';
      case AppThemeMode.dark:
        return 'Always use dark theme';
      case AppThemeMode.system:
        return 'Follow device settings';
    }
  }

  IconData _getThemeModeIcon(AppThemeMode mode) {
    switch (mode) {
      case AppThemeMode.light:
        return Icons.light_mode;
      case AppThemeMode.dark:
        return Icons.dark_mode;
      case AppThemeMode.system:
        return Icons.settings_suggest;
    }
  }
}
