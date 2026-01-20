import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../providers/programs_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_prefs_provider.dart';
import '../providers/navigation_provider.dart';
import '../services/platform_service.dart';

class DesktopSidebar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final VoidCallback? onOpenFilters;
  final VoidCallback? onClearData;

  const DesktopSidebar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    this.onOpenFilters,
    this.onClearData,
  });

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
    final provider = context.watch<ProgramsProvider>();
    final savedCount = provider.favoritePrograms.length;

    return Container(
      width: 220,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1a1a2e) : const Color(0xFFf8fafc),
        border: Border(
          right: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      child: Column(
        children: [
          // Draggable title bar area for macOS
          const _DraggableTitleBar(),

          // App branding
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Row(
              children: [
                Semantics(
                  image: true,
                  label: 'Bay Navigator',
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.local_offer,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Bay Area',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          height: 1.2,
                        ),
                      ),
                      Text(
                        'Discounts',
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Navigation items - dynamically built from NavItems
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                // NAVIGATION SECTION - all app screens
                _SectionHeader(label: 'NAVIGATION'),
                const SizedBox(height: 8),
                // Build navigation items from NavItems.all
                ...NavItems.all.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: _SidebarItem(
                      icon: item.icon,
                      selectedIcon: item.selectedIcon,
                      label: item.label,
                      badge: item.id == 'saved' && savedCount > 0 ? savedCount : null,
                      isSelected: selectedIndex == index,
                      onTap: () => onDestinationSelected(index),
                    ),
                  );
                }),

                // RESOURCES SECTION
                const SizedBox(height: 20),
                _SectionHeader(label: 'RESOURCES'),
                const SizedBox(height: 8),
                _SidebarItem(
                  icon: Icons.info_outline,
                  selectedIcon: Icons.info,
                  label: 'About',
                  isSelected: false,
                  onTap: () => _launchUrl('https://baynavigator.org/about'),
                ),
                const SizedBox(height: 4),
                _SidebarItem(
                  icon: Icons.article_outlined,
                  selectedIcon: Icons.article,
                  label: 'Terms of Service',
                  isSelected: false,
                  onTap: () => _launchUrl('https://baynavigator.org/terms'),
                ),
                const SizedBox(height: 4),
                _SidebarItem(
                  icon: Icons.privacy_tip_outlined,
                  selectedIcon: Icons.privacy_tip,
                  label: 'Privacy Policy',
                  isSelected: false,
                  onTap: () => _launchUrl('https://baynavigator.org/privacy'),
                ),

                // ACTIONS SECTION
                const SizedBox(height: 20),
                _SectionHeader(label: 'ACTIONS'),
                const SizedBox(height: 8),
                Consumer<ThemeProvider>(
                  builder: (context, themeProvider, child) {
                    return _SidebarItem(
                      icon: isDark ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
                      selectedIcon: isDark ? Icons.dark_mode : Icons.light_mode,
                      label: 'Appearance',
                      subtitle: themeProvider.modeLabel,
                      isSelected: false,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        _showAppearanceDialog(context);
                      },
                    );
                  },
                ),
                const SizedBox(height: 4),
                _SidebarItem(
                  icon: Icons.filter_list_outlined,
                  selectedIcon: Icons.filter_list,
                  label: 'Update Filters',
                  isSelected: false,
                  onTap: () {
                    HapticFeedback.lightImpact();
                    final userPrefs = context.read<UserPrefsProvider>();
                    userPrefs.reopenOnboarding();
                  },
                ),
                const SizedBox(height: 4),
                _ClearDataItem(
                  onTap: onClearData ?? () {},
                ),
              ],
            ),
          ),

          // Keyboard shortcuts hint (desktop only, not tablets)
          if (PlatformService.isDesktop)
            Container(
              margin: const EdgeInsets.all(12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Keyboard Shortcuts',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _ShortcutHint(label: 'Search', shortcut: '\u2318F'),
                  _ShortcutHint(label: 'Refresh', shortcut: '\u2318R'),
                  _ShortcutHint(label: 'Dark Mode', shortcut: '\u2318\u21E7D'),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showAppearanceDialog(BuildContext context) {
    final themeProvider = context.read<ThemeProvider>();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Appearance'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final mode in AppThemeMode.values)
              ListTile(
                title: Text(mode.name[0].toUpperCase() + mode.name.substring(1)),
                leading: Icon(
                  themeProvider.mode == mode
                      ? Icons.radio_button_checked
                      : Icons.radio_button_unchecked,
                  color: themeProvider.mode == mode ? AppColors.primary : null,
                ),
                onTap: () {
                  themeProvider.setMode(mode);
                  Navigator.pop(dialogContext);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _showTextSpacingDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Text Spacing'),
        content: const Text(
          'Text spacing options help improve readability for users with dyslexia or visual impairments.\n\nThis feature is coming soon.',
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
}

class _DraggableTitleBar extends StatelessWidget {
  const _DraggableTitleBar();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onPanStart: (_) {
        // Allow window dragging from this area
      },
      child: const SizedBox(
        height: 52,
        // Space for macOS traffic lights
      ),
    );
  }
}

class _SidebarItem extends StatefulWidget {
  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final String? subtitle;
  final int? badge;
  final bool isSelected;
  final VoidCallback onTap;

  const _SidebarItem({
    required this.icon,
    required this.selectedIcon,
    required this.label,
    this.subtitle,
    this.badge,
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<_SidebarItem> createState() => _SidebarItemState();
}

class _SidebarItemState extends State<_SidebarItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Semantics(
      button: true,
      label: widget.label,
      selected: widget.isSelected,
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: widget.isSelected
                ? (isDark ? AppColors.primary.withValues(alpha: 0.15) : AppColors.primary.withValues(alpha: 0.1))
                : (_isHovered
                    ? (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05))
                    : Colors.transparent),
            borderRadius: BorderRadius.circular(8),
            border: widget.isSelected
                ? Border.all(color: AppColors.primary.withValues(alpha: 0.3))
                : null,
          ),
          child: Row(
            children: [
              Icon(
                widget.isSelected ? widget.selectedIcon : widget.icon,
                size: 20,
                color: widget.isSelected
                    ? AppColors.primary
                    : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.label,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: widget.isSelected ? FontWeight.w600 : FontWeight.w500,
                        color: widget.isSelected
                            ? (isDark ? Colors.white : AppColors.primary)
                            : (isDark ? AppColors.darkText : AppColors.lightText),
                      ),
                    ),
                    if (widget.subtitle != null)
                      Text(
                        widget.subtitle!,
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                      ),
                  ],
                ),
              ),
              if (widget.badge != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    widget.badge.toString(),
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
            ],
          ),
        ),
        ),
      ),
    );
  }
}

class _ShortcutHint extends StatelessWidget {
  final String label;
  final String shortcut;

  const _ShortcutHint({
    required this.label,
    required this.shortcut,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              shortcut,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                fontFamily: 'SF Mono',
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;

  const _SectionHeader({required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(left: 12),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
        ),
      ),
    );
  }
}

class _ClearDataItem extends StatefulWidget {
  final VoidCallback onTap;

  const _ClearDataItem({required this.onTap});

  @override
  State<_ClearDataItem> createState() => _ClearDataItemState();
}

class _ClearDataItemState extends State<_ClearDataItem> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Semantics(
      button: true,
      label: 'Clear Data',
      child: MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: _isHovered
                  ? AppColors.danger.withValues(alpha: 0.15)
                  : AppColors.danger.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: AppColors.danger.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.delete_outline,
                  size: 20,
                  color: isDark ? AppColors.danger.withValues(alpha: 0.9) : AppColors.danger,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Clear Data',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.danger.withValues(alpha: 0.9) : AppColors.danger,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
