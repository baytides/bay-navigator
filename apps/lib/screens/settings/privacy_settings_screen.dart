import 'dart:io' show Platform;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/settings_provider.dart';
import '../../services/privacy_service.dart';
import '../../config/theme.dart';

class PrivacySettingsScreen extends StatelessWidget {
  const PrivacySettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Privacy'),
      ),
      body: Consumer<SettingsProvider>(
        builder: (context, settings, child) {
          final status = settings.privacyStatus;

          return ListView(
            children: [
              // Privacy status indicator
              if (status != null)
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkCard : AppColors.lightCard,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Text(status.icon, style: const TextStyle(fontSize: 32)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Current Status',
                              style: theme.textTheme.labelSmall,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              status.description,
                              style: theme.textTheme.bodyMedium,
                            ),
                            if (status.warning != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                status.warning!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.warning,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

              // Tor/Onion Section
              _buildSection(
                context,
                title: 'Tor Network',
                children: [
                  SwitchListTile(
                    title: const Text('Use Tor Network'),
                    subtitle: Text(
                      Platform.isAndroid || Platform.isIOS
                          ? 'Route traffic through Tor (requires Orbot app)'
                          : 'Route traffic through Tor hidden service',
                    ),
                    value: settings.useOnion,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await settings.setUseOnion(value);
                      if (value && !settings.orbotAvailable && context.mounted) {
                        _showOrbotRequiredDialog(context);
                      }
                    },
                  ),
                ],
              ),

              // Proxy Section
              _buildSection(
                context,
                title: 'Custom Proxy',
                children: [
                  SwitchListTile(
                    title: const Text('Use Custom Proxy'),
                    subtitle: const Text('Route traffic through a SOCKS5 or HTTP proxy'),
                    value: settings.proxyEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      if (value) {
                        _showProxyConfigDialog(context);
                      } else {
                        await settings.setProxyEnabled(false);
                      }
                    },
                  ),
                  if (settings.proxyEnabled && settings.proxyConfig != null)
                    ListTile(
                      title: const Text('Proxy Address'),
                      subtitle: Text(settings.proxyConfig.toString()),
                      trailing: IconButton(
                        icon: const Icon(Icons.edit),
                        onPressed: () => _showProxyConfigDialog(context),
                      ),
                    ),
                ],
              ),

              // Call Relay Section
              _buildSection(
                context,
                title: 'Call Relay',
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Choose how to make calls from the app. VoIP apps may keep calls off your carrier logs.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                  ListTile(
                    leading: const Text('📞', style: TextStyle(fontSize: 24)),
                    title: const Text('Calling App'),
                    subtitle: Text(settings.preferredCallingApp.displayName),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _showCallingAppDialog(context);
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          Icons.info_outline,
                          size: 16,
                          color: theme.colorScheme.secondary,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            settings.preferredCallingApp.privacyDescription,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.secondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (settings.preferredCallingApp == CallingApp.other)
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppColors.warning.withValues(alpha: 0.3),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.content_copy, size: 18, color: AppColors.warning),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Phone numbers will be copied to clipboard. Auto-clears after 2 minutes.',
                              style: theme.textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              // Data Collection Section
              _buildSection(
                context,
                title: 'Data Collection',
                children: [
                  SwitchListTile(
                    title: const Text('Crash Reporting'),
                    subtitle: const Text('Help improve the app by sending anonymous crash reports'),
                    value: settings.crashReportingEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await settings.setCrashReportingEnabled(value);
                      if (!value && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Crash reporting disabled. Restart app for full effect.'),
                          ),
                        );
                      }
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: Text(
                      'Crash reports help us identify and fix bugs. They never include personal data.',
                      style: theme.textTheme.bodySmall,
                    ),
                  ),
                ],
              ),

              // Test Connection
              _buildSection(
                context,
                title: 'Diagnostics',
                children: [
                  ListTile(
                    leading: const Text('🔍', style: TextStyle(fontSize: 24)),
                    title: const Text('Test Connection'),
                    subtitle: const Text('Test network connectivity'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => _testPrivacyConnection(context),
                  ),
                ],
              ),

              const SizedBox(height: 32),
            ],
          );
        },
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

  void _showOrbotRequiredDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Tor Client Required'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('To use Tor, you need a Tor client running on your device.\n'),
            if (Platform.isAndroid || Platform.isIOS) ...[
              const Text('We recommend Orbot, the official Tor client for mobile devices.'),
              const SizedBox(height: 16),
              const Text(
                '1. Install Orbot from your app store\n'
                '2. Open Orbot and tap "Start"\n'
                '3. Wait for the connection to establish\n'
                '4. Return here and the setting will work',
                style: TextStyle(fontSize: 13),
              ),
            ] else
              const Text(
                'Install and start Tor on your computer. The app will use the default SOCKS5 proxy at 127.0.0.1:9050.',
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showProxyConfigDialog(BuildContext context) {
    final settings = context.read<SettingsProvider>();
    final hostController = TextEditingController(
      text: settings.proxyConfig?.host ?? '',
    );
    final portController = TextEditingController(
      text: settings.proxyConfig?.port.toString() ?? '9050',
    );
    var selectedType = settings.proxyConfig?.type ?? ProxyType.socks5;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: const Text('Configure Proxy'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Configure a SOCKS5 or HTTP proxy to route app traffic through.',
                style: TextStyle(fontSize: 13),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Text('Type: '),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('SOCKS5'),
                    selected: selectedType == ProxyType.socks5,
                    onSelected: (selected) {
                      if (selected) setDialogState(() => selectedType = ProxyType.socks5);
                    },
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('HTTP'),
                    selected: selectedType == ProxyType.http,
                    onSelected: (selected) {
                      if (selected) setDialogState(() => selectedType = ProxyType.http);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: hostController,
                decoration: const InputDecoration(
                  labelText: 'Host',
                  hintText: '127.0.0.1',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: portController,
                decoration: const InputDecoration(
                  labelText: 'Port',
                  hintText: '9050',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () async {
                final host = hostController.text.trim();
                final port = int.tryParse(portController.text.trim());

                if (host.isEmpty || port == null || port < 1 || port > 65535) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Please enter a valid host and port')),
                  );
                  return;
                }

                final config = ProxyConfig(host: host, port: port, type: selectedType);
                await settings.setProxyConfig(config);
                await settings.setProxyEnabled(true);

                if (dialogContext.mounted) Navigator.pop(dialogContext);
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showCallingAppDialog(BuildContext context) {
    final settings = context.read<SettingsProvider>();
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Choose Calling App'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: settings.availableCallingApps.length,
            itemBuilder: (context, index) {
              final app = settings.availableCallingApps[index];
              final isSelected = settings.preferredCallingApp == app;

              return ListTile(
                leading: Icon(
                  isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: isSelected ? AppColors.primary : null,
                ),
                title: Text(app.displayName),
                subtitle: Text(app.privacyDescription, style: theme.textTheme.bodySmall),
                onTap: () async {
                  HapticFeedback.lightImpact();
                  await settings.setPreferredCallingApp(app);
                  if (dialogContext.mounted) Navigator.pop(dialogContext);
                },
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _testPrivacyConnection(BuildContext context) async {
    final settings = context.read<SettingsProvider>();
    final messenger = ScaffoldMessenger.of(context);

    messenger.showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 12),
            Text('Testing connection...'),
          ],
        ),
        duration: Duration(seconds: 30),
      ),
    );

    final result = await settings.testPrivacyConnection();
    messenger.hideCurrentSnackBar();

    if (result.success) {
      // Show warning color if Tor is enabled but not actually used
      final bgColor = result.torEnabledButNotUsed ? AppColors.warning : AppColors.success;
      final icon = result.torEnabledButNotUsed ? '⚠' : '✓';

      messenger.showSnackBar(
        SnackBar(
          content: Text(
            '$icon ${result.message} (${result.latencyMs}ms)',
          ),
          backgroundColor: bgColor,
          duration: result.torEnabledButNotUsed
              ? const Duration(seconds: 5)
              : const Duration(seconds: 3),
        ),
      );
    } else {
      messenger.showSnackBar(
        SnackBar(
          content: Text('✗ Connection failed: ${result.message}'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }
}
