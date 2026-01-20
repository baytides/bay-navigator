import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/programs_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_prefs_provider.dart';
import '../providers/localization_provider.dart';
import '../providers/safety_provider.dart';
import '../providers/settings_provider.dart';
import '../config/theme.dart';
import 'profiles_screen.dart';
import 'settings/privacy_settings_screen.dart';
import 'settings/safety_settings_screen.dart';
import 'settings/appearance_settings_screen.dart';
import 'settings/about_settings_screen.dart';
import 'edit_profile_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _cacheSize = 'Calculating...';

  @override
  void initState() {
    super.initState();
    _loadCacheSize();
  }

  Future<void> _loadCacheSize() async {
    if (!mounted) return;
    final provider = context.read<ProgramsProvider>();
    final cacheSize = await provider.getCacheSize();
    if (mounted) {
      setState(() {
        _cacheSize = _formatBytes(cacheSize);
      });
    }
  }

  String _formatBytes(int bytes) {
    if (bytes == 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    final i = (bytes > 0) ? (bytes.bitLength - 1) ~/ 10 : 0;
    final size = bytes / (1 << (i * 10));
    return '${size.toStringAsFixed(2)} ${sizes[i]}';
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          // Logo banner
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            child: Column(
              children: [
                Semantics(
                  image: true,
                  label: 'Bay Navigator logo',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Image.asset(
                      'assets/images/favicons/web-app-manifest-512x512.png',
                      width: 80,
                      height: 80,
                      semanticLabel: 'Bay Navigator logo',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text('Bay Navigator', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text(
                  'Your guide to local savings & benefits',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),

          // Profiles Section (combined with Edit Profile)
          Consumer<UserPrefsProvider>(
            builder: (context, userPrefs, child) {
              final firstName = userPrefs.firstName;
              final city = userPrefs.city;
              final county = userPrefs.selectedCounty;

              String profileSubtitle = 'Set up your profile';
              if (userPrefs.hasPreferences) {
                final parts = <String>[];
                if (firstName != null && firstName.isNotEmpty) parts.add(firstName);
                if (city != null && city.isNotEmpty) {
                  parts.add(city);
                } else if (county != null && county.isNotEmpty) {
                  parts.add(county);
                }
                profileSubtitle = parts.isNotEmpty ? parts.join(' • ') : 'Configured';
              }

              return _buildSection(
                context,
                title: 'Profiles',
                children: [
                  _buildNavTile(
                    context,
                    icon: '👤',
                    title: userPrefs.hasPreferences ? 'Edit Profile' : 'Set Up Profile',
                    subtitle: profileSubtitle,
                    onTap: () {
                      HapticFeedback.lightImpact();
                      if (userPrefs.hasPreferences) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                        );
                      } else {
                        userPrefs.reopenOnboarding();
                      }
                    },
                  ),
                  const Divider(height: 1, indent: 16),
                  _buildNavTile(
                    context,
                    icon: '👥',
                    title: 'Family Profiles',
                    subtitle: 'Manage profiles and saved lists',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfilesScreen()),
                    ),
                  ),
                ],
              );
            },
          ),

          // Settings Categories
          _buildSection(
            context,
            title: 'Settings',
            children: [
              Consumer2<ThemeProvider, LocalizationProvider>(
                builder: (context, themeProvider, localization, child) {
                  return _buildNavTile(
                    context,
                    icon: isDark ? '🌙' : '☀️',
                    title: 'Appearance',
                    subtitle: '${themeProvider.modeLabel} • ${localization.currentLocale.nativeName}',
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AppearanceSettingsScreen()),
                    ),
                  );
                },
              ),
              const Divider(height: 1, indent: 16),
              _buildNavTile(
                context,
                icon: '🔒',
                title: 'Privacy',
                subtitle: 'Tor, proxy, and call relay settings',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PrivacySettingsScreen()),
                ),
              ),
              const Divider(height: 1, indent: 16),
              Consumer<SafetyProvider>(
                builder: (context, safety, child) {
                  String subtitle = 'Quick exit, PIN protection, incognito';
                  if (safety.quickExitEnabled || safety.hasPinSet || safety.incognitoModeEnabled) {
                    final enabled = <String>[];
                    if (safety.quickExitEnabled) enabled.add('Quick Exit');
                    if (safety.hasPinSet) enabled.add('PIN');
                    if (safety.incognitoModeEnabled) enabled.add('Incognito');
                    subtitle = enabled.join(' • ');
                  }
                  return _buildNavTile(
                    context,
                    icon: '🛡️',
                    title: 'Safety',
                    subtitle: subtitle,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SafetySettingsScreen()),
                    ),
                  );
                },
              ),
              const Divider(height: 1, indent: 16),
              Consumer<SettingsProvider>(
                builder: (context, settings, child) {
                  return SwitchListTile(
                    secondary: const Text('✨', style: TextStyle(fontSize: 24)),
                    title: Row(
                      children: [
                        const Text('AI-Powered Search'),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade300,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            'Beta',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    subtitle: Text(
                      settings.aiSearchEnabled
                          ? 'Natural language search enabled'
                          : 'Using basic keyword search only',
                    ),
                    value: settings.aiSearchEnabled,
                    onChanged: (value) {
                      HapticFeedback.lightImpact();
                      settings.setAISearchEnabled(value);
                    },
                  );
                },
              ),
            ],
          ),

          // Storage Section
          _buildSection(
            context,
            title: 'Storage',
            children: [
              ListTile(
                leading: const Icon(Icons.storage),
                title: const Text('Cache Size'),
                trailing: Text(_cacheSize, style: theme.textTheme.bodyMedium),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: Icon(Icons.delete_outline, color: AppColors.danger),
                title: Text('Clear Cache', style: TextStyle(color: AppColors.danger)),
                onTap: () async {
                  HapticFeedback.lightImpact();
                  final provider = context.read<ProgramsProvider>();
                  final messenger = ScaffoldMessenger.of(context);
                  final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      title: const Text('Clear Cache'),
                      content: const Text(
                        'This will remove all cached program data. The app will re-download data on next use.',
                      ),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(dialogContext, false),
                          child: const Text('Cancel'),
                        ),
                        TextButton(
                          onPressed: () => Navigator.pop(dialogContext, true),
                          style: TextButton.styleFrom(foregroundColor: AppColors.danger),
                          child: const Text('Clear'),
                        ),
                      ],
                    ),
                  );

                  if (confirmed == true && mounted) {
                    await provider.clearCache();
                    setState(() => _cacheSize = '0 Bytes');
                    messenger.showSnackBar(
                      const SnackBar(content: Text('Cache cleared')),
                    );
                  }
                },
              ),
            ],
          ),

          // Support Section
          _buildSection(
            context,
            title: 'Support Our Work',
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      'Help Keep This App Free',
                      style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Bay Navigator is a volunteer-run project. Your donation helps us maintain the app and add new programs.',
                      style: theme.textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _launchUrl('https://baytides.org/donate');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text(
                    'Donate via Website',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),

          // About Section
          _buildSection(
            context,
            title: 'About',
            children: [
              _buildNavTile(
                context,
                icon: 'ℹ️',
                title: 'About Bay Navigator',
                subtitle: 'Version info, links, and legal',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AboutSettingsScreen()),
                ),
              ),
            ],
          ),

          // Footer
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              children: [
                Text(
                  'Bay Navigator - a Bay Tides project',
                  style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                Text(
                  'Connecting residents to public benefits and community resources',
                  style: theme.textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
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

  Widget _buildNavTile(
    BuildContext context, {
    required String icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Text(icon, style: const TextStyle(fontSize: 24)),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
    );
  }

  Widget _buildProfileDetail(String label, String value) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: ',
            style: theme.textTheme.bodySmall?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatQualifications(List<String> qualifications) {
    final labels = <String>[];
    for (final qual in qualifications) {
      switch (qual) {
        case 'lgbtq':
          labels.add('LGBTQ+');
          break;
        case 'immigrant':
          labels.add('Immigrant');
          break;
        case 'first-responder':
          labels.add('First Responder');
          break;
        case 'educator':
          labels.add('Educator');
          break;
        case 'unemployed':
          labels.add('Job seeking');
          break;
        case 'public-assistance':
          labels.add('Public assistance');
          break;
        case 'student':
          labels.add('Student');
          break;
        case 'disability':
          labels.add('Disability');
          break;
        case 'caregiver':
          labels.add('Caregiver');
          break;
      }
    }
    return labels.join(', ');
  }
}
