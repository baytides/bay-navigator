import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/safety_provider.dart';
import '../../services/safety_service.dart';
import '../../widgets/safety_widgets.dart';
import '../../config/theme.dart';

class SafetySettingsScreen extends StatelessWidget {
  const SafetySettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Safety'),
      ),
      body: Consumer<SafetyProvider>(
        builder: (context, safety, child) {
          // Check if PIN is required to access settings
          if (safety.requiresPinToAccess) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.lock,
                      size: 64,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Safety Settings Locked',
                      style: theme.textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Enter your PIN to view or modify safety settings',
                      style: theme.textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: () async {
                        HapticFeedback.lightImpact();
                        await PinEntryDialog.showUnlock(context);
                      },
                      icon: const Icon(Icons.lock_open),
                      label: const Text('Unlock'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return ListView(
            children: [
              // Info banner
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(Icons.shield, size: 32, color: AppColors.primary),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Text(
                        'Safety features for users in sensitive situations. All settings stay on your device.',
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),

              // Data Protection Section
              _buildSection(
                context,
                title: 'Data Protection',
                children: [
                  SwitchListTile(
                    title: const Text('Encrypt Data'),
                    subtitle: const Text('Protect data on rooted/jailbroken devices'),
                    value: safety.encryptionEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      if (value) {
                        final result = await safety.enableEncryption();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(result.message)),
                          );
                        }
                      } else {
                        final result = await safety.disableEncryption();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(result.message)),
                          );
                        }
                      }
                    },
                  ),
                  const Divider(height: 1, indent: 16),
                  ListTile(
                    leading: const Text('🔐', style: TextStyle(fontSize: 24)),
                    title: const Text('PIN Protection'),
                    subtitle: Text(safety.hasPinSet ? 'Enabled' : 'Not set'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _showPinProtectionDialog(context);
                    },
                  ),
                  if (safety.hasPinSet) ...[
                    const Divider(height: 1, indent: 16),
                    SwitchListTile(
                      title: const Text('Panic Wipe'),
                      subtitle: const Text('3 wrong PINs = delete all data & close app'),
                      value: safety.panicWipeEnabled,
                      onChanged: (value) async {
                        HapticFeedback.lightImpact();
                        if (value) {
                          final confirmed = await _showPanicWipeConfirmDialog(context);
                          if (confirmed == true) {
                            await safety.setPanicWipeEnabled(true);
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Panic wipe enabled. 3 wrong PINs will delete all data.'),
                                ),
                              );
                            }
                          }
                        } else {
                          await safety.setPanicWipeEnabled(false);
                        }
                      },
                    ),
                  ],
                  const Divider(height: 1, indent: 16),
                  SwitchListTile(
                    title: const Text('Shake to Clear'),
                    subtitle: const Text('Shake phone 3 times to clear all data'),
                    value: safety.shakeToClearEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      if (value) {
                        final confirmed = await _showShakeToClearConfirmDialog(context);
                        if (confirmed == true) {
                          await safety.setShakeToClearEnabled(true);
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Shake to clear enabled. Shake 3 times to clear data.'),
                              ),
                            );
                          }
                        }
                      } else {
                        await safety.setShakeToClearEnabled(false);
                      }
                    },
                  ),
                ],
              ),

              // Quick Exit Section
              _buildSection(
                context,
                title: 'Quick Exit',
                children: [
                  SwitchListTile(
                    title: const Text('Quick Exit'),
                    subtitle: const Text('Shake device or triple-tap to instantly leave app'),
                    value: safety.quickExitEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await safety.setQuickExitEnabled(value);
                    },
                  ),
                  if (safety.quickExitEnabled) ...[
                    const Divider(height: 1, indent: 16),
                    ListTile(
                      leading: const Text('🚪', style: TextStyle(fontSize: 24)),
                      title: const Text('Exit Destination'),
                      subtitle: Text(_getQuickExitDestinationName(safety.quickExitUrl)),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _showQuickExitDestinationDialog(context);
                      },
                    ),
                  ],
                ],
              ),

              // Privacy Mode Section
              _buildSection(
                context,
                title: 'Privacy Mode',
                children: [
                  SwitchListTile(
                    title: const Text('Incognito Mode'),
                    subtitle: const Text("Don't save search or browsing history"),
                    value: safety.incognitoModeEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await safety.setIncognitoModeEnabled(value);
                      if (value && context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Incognito mode enabled. History will not be saved.'),
                          ),
                        );
                      }
                    },
                  ),
                  const Divider(height: 1, indent: 16),
                  SwitchListTile(
                    title: const Text('Safety Tips'),
                    subtitle: const Text('Show safety tips for sensitive programs'),
                    value: safety.showSafetyTips,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await safety.setShowSafetyTips(value);
                    },
                  ),
                ],
              ),

              // Network Section
              _buildSection(
                context,
                title: 'Network',
                children: [
                  SwitchListTile(
                    title: const Text('Network Monitoring'),
                    subtitle: const Text('Monitor network type for privacy awareness'),
                    value: safety.networkMonitoringEnabled,
                    onChanged: (value) async {
                      HapticFeedback.lightImpact();
                      await safety.setNetworkMonitoringEnabled(value);
                    },
                  ),
                  if (safety.networkMonitoringEnabled) ...[
                    const Divider(height: 1, indent: 16),
                    SwitchListTile(
                      title: const Text('Network Warnings'),
                      subtitle: const Text('Show warnings when on public WiFi'),
                      value: safety.networkWarningsEnabled,
                      onChanged: (value) async {
                        HapticFeedback.lightImpact();
                        await safety.setNetworkWarningsEnabled(value);
                      },
                    ),
                  ],
                ],
              ),

              // App Disguise Section
              _buildSection(
                context,
                title: 'App Disguise',
                children: [
                  ListTile(
                    leading: const Text('🎭', style: TextStyle(fontSize: 24)),
                    title: const Text('Disguise App'),
                    subtitle: Text(
                      safety.disguisedModeEnabled
                          ? safety.currentDisguisedIcon?.name ?? 'Enabled'
                          : 'Off',
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      HapticFeedback.lightImpact();
                      _showDisguisedIconDialog(context);
                    },
                  ),
                ],
              ),

              // Actions Section
              _buildSection(
                context,
                title: 'Actions',
                children: [
                  ListTile(
                    leading: Icon(Icons.delete_forever, color: AppColors.danger),
                    title: Text('Clear All History', style: TextStyle(color: AppColors.danger)),
                    onTap: () async {
                      HapticFeedback.lightImpact();
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (dialogContext) => AlertDialog(
                          title: const Text('Clear All History'),
                          content: const Text(
                            'This will delete all search history and recent programs. This cannot be undone.',
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

                      if (confirmed == true && context.mounted) {
                        await safety.clearAllHistory();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('History cleared')),
                          );
                        }
                      }
                    },
                  ),
                  if (safety.hasPinSet && safety.isUnlocked) ...[
                    const Divider(height: 1, indent: 16),
                    ListTile(
                      leading: const Icon(Icons.lock),
                      title: const Text('Lock Settings'),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        safety.lockSafetySettings();
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Safety settings locked')),
                        );
                      },
                    ),
                  ],
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

  String _getQuickExitDestinationName(String url) {
    for (final dest in SafetyService.defaultDestinations) {
      if (dest.url == url) return dest.name;
    }
    return 'Custom';
  }

  Future<bool?> _showPanicWipeConfirmDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: AppColors.danger),
            const SizedBox(width: 12),
            const Text('Enable Panic Wipe?'),
          ],
        ),
        content: const Text(
          'If enabled, entering an incorrect PIN 3 times in a row will:\n\n'
          '• Delete ALL app data\n'
          '• Clear encrypted storage\n'
          '• Force close the app\n\n'
          'This CANNOT be undone. Make sure you remember your PIN!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Enable'),
          ),
        ],
      ),
    );
  }

  Future<bool?> _showShakeToClearConfirmDialog(BuildContext context) {
    return showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: AppColors.danger),
            const SizedBox(width: 12),
            const Text('Enable Shake to Clear?'),
          ],
        ),
        content: const Text(
          'If enabled, shaking your phone 3 times quickly will:\n\n'
          '• Delete ALL app data\n'
          '• Clear your profile and preferences\n'
          '• Clear encrypted storage\n\n'
          'Use this for quick data clearing in emergencies. This CANNOT be undone!',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
            ),
            child: const Text('Enable'),
          ),
        ],
      ),
    );
  }

  void _showPinProtectionDialog(BuildContext context) {
    final safety = context.read<SafetyProvider>();
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.lock, color: AppColors.primary),
            const SizedBox(width: 12),
            const Text('PIN Protection'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Protect your safety settings with a 6-8 digit PIN.',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            if (safety.hasPinSet) ...[
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('Change PIN'),
                onTap: () async {
                  Navigator.pop(dialogContext);
                  await PinEntryDialog.showChange(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.delete, color: AppColors.danger),
                title: Text('Remove PIN', style: TextStyle(color: AppColors.danger)),
                onTap: () async {
                  Navigator.pop(dialogContext);
                  _showRemovePinDialog(context);
                },
              ),
            ] else
              ListTile(
                leading: Icon(Icons.add, color: AppColors.primary),
                title: const Text('Set PIN'),
                subtitle: const Text('Create a 6-8 digit PIN'),
                onTap: () async {
                  Navigator.pop(dialogContext);
                  await PinEntryDialog.showSetup(context);
                },
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showRemovePinDialog(BuildContext context) {
    final safety = context.read<SafetyProvider>();
    final theme = Theme.of(context);
    final pinController = TextEditingController();
    String? errorMessage;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.warning, color: AppColors.danger),
              const SizedBox(width: 12),
              const Text('Remove PIN'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter your current PIN to remove protection.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: pinController,
                obscureText: true,
                keyboardType: TextInputType.number,
                maxLength: 8,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                decoration: InputDecoration(
                  labelText: 'Current PIN',
                  counterText: '',
                  errorText: errorMessage,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final pin = pinController.text;
                if (pin.isEmpty) {
                  setState(() => errorMessage = 'Please enter your PIN');
                  return;
                }

                final success = await safety.removePin(pin);
                if (success) {
                  if (dialogContext.mounted) Navigator.pop(dialogContext);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('PIN protection removed')),
                    );
                  }
                } else {
                  setState(() => errorMessage = 'Incorrect PIN');
                  pinController.clear();
                  HapticFeedback.heavyImpact();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white,
              ),
              child: const Text('Remove'),
            ),
          ],
        ),
      ),
    );
  }

  void _showQuickExitDestinationDialog(BuildContext context) {
    final safety = context.read<SafetyProvider>();
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Quick Exit Destination'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Choose where to go when quick exit is triggered:',
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            ...SafetyService.defaultDestinations.map((dest) {
              final isSelected = safety.quickExitUrl == dest.url;
              return ListTile(
                leading: Icon(
                  isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: isSelected ? AppColors.primary : null,
                ),
                title: Text(dest.name),
                subtitle: Text(dest.description, style: theme.textTheme.bodySmall),
                onTap: () async {
                  HapticFeedback.lightImpact();
                  await safety.setQuickExitUrl(dest.url);
                  if (dialogContext.mounted) Navigator.pop(dialogContext);
                },
              );
            }),
          ],
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

  void _showDisguisedIconDialog(BuildContext context) {
    final safety = context.read<SafetyProvider>();
    final theme = Theme.of(context);

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Disguise App'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Change the app icon and name to make it look like a different app.',
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: AppColors.warning),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Some devices may require an app restart.',
                        style: theme.textTheme.bodySmall?.copyWith(color: AppColors.warning),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              if (safety.disguisedModeEnabled && safety.currentDisguisedIcon != null) ...[
                ListTile(
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: safety.currentDisguisedIcon!.backgroundColor,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      safety.currentDisguisedIcon!.iconData,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  title: Text('Current: ${safety.currentDisguisedIcon!.name}'),
                  trailing: TextButton(
                    onPressed: () async {
                      final result = await safety.resetToDefaultIcon();
                      if (dialogContext.mounted) {
                        Navigator.pop(dialogContext);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(result.message)),
                        );
                      }
                    },
                    child: const Text('Reset'),
                  ),
                ),
                const Divider(),
              ],

              ...SafetyService.disguisedIcons.map((icon) {
                final isSelected = safety.currentDisguisedIcon?.id == icon.id;
                return ListTile(
                  leading: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: icon.backgroundColor,
                      borderRadius: BorderRadius.circular(8),
                      border: isSelected ? Border.all(color: AppColors.primary, width: 2) : null,
                    ),
                    child: Icon(icon.iconData, color: Colors.white, size: 24),
                  ),
                  title: Text(icon.name),
                  trailing: isSelected ? Icon(Icons.check, color: AppColors.primary) : null,
                  onTap: () async {
                    HapticFeedback.lightImpact();
                    final result = await safety.applyDisguisedIcon(icon);
                    if (dialogContext.mounted) {
                      Navigator.pop(dialogContext);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(result.message)),
                      );
                    }
                  },
                );
              }),
            ],
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
}
