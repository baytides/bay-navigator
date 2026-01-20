import 'dart:io' show Platform;
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:http/http.dart' as http;
import '../../providers/programs_provider.dart';
import '../../providers/settings_provider.dart';
import '../../config/theme.dart';
import '../webview_screen.dart';

class AboutSettingsScreen extends StatefulWidget {
  const AboutSettingsScreen({super.key});

  @override
  State<AboutSettingsScreen> createState() => _AboutSettingsScreenState();
}

class _AboutSettingsScreenState extends State<AboutSettingsScreen> {
  String _version = '';
  String _buildNumber = '';
  bool _checkingForUpdate = false;

  @override
  void initState() {
    super.initState();
    _loadInfo();
  }

  Future<void> _loadInfo() async {
    final packageInfo = await PackageInfo.fromPlatform();
    if (mounted) {
      setState(() {
        _version = packageInfo.version;
        _buildNumber = packageInfo.buildNumber;
      });
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _checkForUpdate() async {
    if (_checkingForUpdate) return;

    setState(() => _checkingForUpdate = true);

    try {
      final response = await http.get(
        Uri.parse('https://api.github.com/repos/baytides/baynavigator/releases/latest'),
        headers: {'Accept': 'application/vnd.github.v3+json'},
      );

      if (!mounted) return;

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final latestTag = data['tag_name'] as String? ?? '';
        final latestVersion = latestTag.startsWith('v') ? latestTag.substring(1) : latestTag;

        final currentBuild = int.tryParse(_buildNumber) ?? 0;
        final latestBuild = _extractBuildNumber(latestVersion);

        if (latestBuild > currentBuild) {
          _showUpdateDialog(latestVersion, data['html_url'] as String? ?? '');
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('You have the latest version')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not check for updates')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not check for updates')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _checkingForUpdate = false);
      }
    }
  }

  int _extractBuildNumber(String version) {
    final parts = version.split('+');
    if (parts.length > 1) {
      return int.tryParse(parts[1]) ?? 0;
    }
    final versionParts = parts[0].split('.');
    if (versionParts.length >= 3) {
      return int.tryParse(versionParts[2]) ?? 0;
    }
    return 0;
  }

  String _getDownloadUrl() {
    const baseUrl = 'https://github.com/baytides/baynavigator/releases/latest/download';
    if (Platform.isAndroid) return '$baseUrl/bay-navigator.apk';
    if (Platform.isMacOS) return '$baseUrl/Bay-Area-Discounts-macOS.dmg';
    if (Platform.isWindows) return '$baseUrl/Bay-Area-Discounts-Windows-Setup.exe';
    if (Platform.isLinux) return '$baseUrl/Bay-Area-Discounts-Linux.tar.gz';
    return 'https://github.com/baytides/baynavigator/releases/latest';
  }

  void _showUpdateDialog(String newVersion, String releaseUrl) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Update Available'),
        content: Text('A new version ($newVersion) is available. Would you like to download it?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Later'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _launchUrl(_getDownloadUrl());
            },
            child: const Text('Download'),
          ),
        ],
      ),
    );
  }

  String _formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      return '${date.month}/${date.day}/${date.year}';
    } catch (e) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('About'),
      ),
      body: ListView(
        children: [
          // App Info Header
          Container(
            padding: const EdgeInsets.all(32),
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.asset(
                    'assets/images/favicons/web-app-manifest-512x512.png',
                    width: 80,
                    height: 80,
                  ),
                ),
                const SizedBox(height: 12),
                Text('Bay Navigator', style: theme.textTheme.headlineMedium),
                const SizedBox(height: 4),
                Text(
                  'Your guide to local savings & benefits',
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: 8),
                Text(
                  'Version $_version ($_buildNumber)',
                  style: theme.textTheme.labelSmall,
                ),
              ],
            ),
          ),

          // Version Info Section
          _buildSection(
            context,
            title: 'Version Info',
            children: [
              ListTile(
                title: const Text('App Version'),
                trailing: Text(_version, style: theme.textTheme.bodyMedium),
              ),
              Consumer<ProgramsProvider>(
                builder: (context, provider, child) {
                  final metadata = provider.metadata;
                  if (metadata == null) return const SizedBox.shrink();
                  return Column(
                    children: [
                      const Divider(height: 1, indent: 16),
                      ListTile(
                        title: const Text('Database Version'),
                        trailing: Text(metadata.version, style: theme.textTheme.bodyMedium),
                      ),
                      const Divider(height: 1, indent: 16),
                      ListTile(
                        title: const Text('Total Programs'),
                        trailing: Text('${metadata.totalPrograms}', style: theme.textTheme.bodyMedium),
                      ),
                      const Divider(height: 1, indent: 16),
                      ListTile(
                        title: const Text('Last Updated'),
                        trailing: Text(_formatDate(metadata.generatedAt), style: theme.textTheme.bodyMedium),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),

          // Updates Section
          _buildSection(
            context,
            title: 'Updates',
            children: [
              ListTile(
                leading: const Text('🔄', style: TextStyle(fontSize: 24)),
                title: const Text('Refresh Database'),
                subtitle: const Text('Check for new program data'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () async {
                  HapticFeedback.lightImpact();
                  final provider = context.read<ProgramsProvider>();
                  final messenger = ScaffoldMessenger.of(context);
                  final hasUpdate = await provider.refreshMetadata();
                  if (mounted) {
                    messenger.showSnackBar(
                      SnackBar(
                        content: Text(hasUpdate ? 'Database updated!' : 'Already up to date'),
                      ),
                    );
                  }
                },
              ),
              if (Platform.isAndroid || Platform.isMacOS || Platform.isWindows || Platform.isLinux) ...[
                const Divider(height: 1, indent: 16),
                ListTile(
                  leading: Text(
                    _checkingForUpdate ? '⏳' : '📲',
                    style: const TextStyle(fontSize: 24),
                  ),
                  title: Text(_checkingForUpdate ? 'Checking...' : 'Check for App Update'),
                  subtitle: const Text('Download the latest version'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: _checkingForUpdate ? null : () {
                    HapticFeedback.lightImpact();
                    _checkForUpdate();
                  },
                ),
              ],
            ],
          ),

          // Links Section
          _buildSection(
            context,
            title: 'Links',
            children: [
              ListTile(
                leading: const Text('🌐', style: TextStyle(fontSize: 24)),
                title: const Text('baynavigator.org'),
                trailing: const Icon(Icons.open_in_new),
                onTap: () => _launchUrl('https://baynavigator.org'),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: const Text('🌊', style: TextStyle(fontSize: 24)),
                title: const Text('Bay Tides (Parent Org)'),
                subtitle: const Text('baytides.org'),
                trailing: const Icon(Icons.open_in_new),
                onTap: () => _launchUrl('https://baytides.org'),
              ),
            ],
          ),

          // Feedback Section
          _buildSection(
            context,
            title: 'Feedback',
            children: [
              ListTile(
                leading: const Text('💬', style: TextStyle(fontSize: 24)),
                title: const Text('Send Feedback'),
                trailing: const Icon(Icons.open_in_new),
                onTap: () => _launchUrl('https://github.com/baytides/baynavigator/issues/new?labels=feedback'),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: const Text('🐛', style: TextStyle(fontSize: 24)),
                title: const Text('Report an Issue'),
                trailing: const Icon(Icons.open_in_new),
                onTap: () => _launchUrl('https://github.com/baytides/baynavigator/issues/new?labels=bug'),
              ),
            ],
          ),

          // Legal Section
          _buildSection(
            context,
            title: 'Legal',
            children: [
              ListTile(
                leading: const Text('⚠️', style: TextStyle(fontSize: 24)),
                title: const Text('Disclaimer'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showDisclaimer(),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: const Text('📄', style: TextStyle(fontSize: 24)),
                title: const Text('Terms of Service'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const WebViewScreen(
                      title: 'Terms of Service',
                      url: 'https://baynavigator.org/terms',
                    ),
                  ),
                ),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: const Text('🔒', style: TextStyle(fontSize: 24)),
                title: const Text('Privacy Policy'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const WebViewScreen(
                      title: 'Privacy Policy',
                      url: 'https://baynavigator.org/privacy',
                    ),
                  ),
                ),
              ),
              const Divider(height: 1, indent: 16),
              ListTile(
                leading: const Text('🙏', style: TextStyle(fontSize: 24)),
                title: const Text('Credits & Acknowledgments'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const WebViewScreen(
                      title: 'Credits & Acknowledgments',
                      url: 'https://baynavigator.org/credits',
                    ),
                  ),
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

  void _showDisclaimer() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Disclaimer'),
        content: const Text(
          'This app is not affiliated with, endorsed by, or connected to any government agency. Bay Navigator is an independent project of Bay Tides, a 501(c)(3) nonprofit organization.\n\nProgram information is compiled from publicly available sources. Each program listing includes a link to the official source where you can verify current eligibility requirements and apply directly.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
