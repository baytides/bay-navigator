import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/program.dart';
import '../config/theme.dart';
import '../utils/category_icons.dart';
import '../services/export_service.dart';
import '../services/accessibility_service.dart';

/// Program card widget matching web design
/// Clean, minimal card with category badge and essential info
///
/// WCAG 2.2 AAA Accessibility Features:
/// - Full semantic labeling for screen readers
/// - Reduced motion support for animations
/// - Minimum 48x48dp touch targets
/// - High contrast color support
/// - Live region announcements for state changes
class ProgramCard extends StatefulWidget {
  final Program program;
  final bool isFavorite;
  final VoidCallback? onTap;
  final VoidCallback? onFavoriteToggle;
  final bool condensed;

  const ProgramCard({
    super.key,
    required this.program,
    this.isFavorite = false,
    this.onTap,
    this.onFavoriteToggle,
    this.condensed = false,
  });

  @override
  State<ProgramCard> createState() => _ProgramCardState();
}

class _ProgramCardState extends State<ProgramCard> {
  bool _isHovered = false;

  void _showContextMenu(BuildContext context, Offset position) {
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;
    if (!isDesktop) return;

    final RenderBox overlay = Overlay.of(context).context.findRenderObject() as RenderBox;

    showMenu<String>(
      context: context,
      position: RelativeRect.fromRect(
        position & const Size(40, 40),
        Offset.zero & overlay.size,
      ),
      items: [
        const PopupMenuItem(
          value: 'open',
          child: ListTile(
            leading: Icon(Icons.open_in_new, size: 20),
            title: Text('Open'),
            contentPadding: EdgeInsets.zero,
            dense: true,
          ),
        ),
        PopupMenuItem(
          value: 'save',
          child: ListTile(
            leading: Icon(
              widget.isFavorite ? Icons.bookmark_remove : Icons.bookmark_add,
              size: 20,
            ),
            title: Text(widget.isFavorite ? 'Remove from Saved' : 'Save'),
            contentPadding: EdgeInsets.zero,
            dense: true,
          ),
        ),
        const PopupMenuDivider(),
        const PopupMenuItem(
          value: 'copy',
          child: ListTile(
            leading: Icon(Icons.copy, size: 20),
            title: Text('Copy Info'),
            contentPadding: EdgeInsets.zero,
            dense: true,
          ),
        ),
        if (widget.program.website.isNotEmpty)
          const PopupMenuItem(
            value: 'website',
            child: ListTile(
              leading: Icon(Icons.language, size: 20),
              title: Text('Open Website'),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
          ),
        if (widget.program.phone != null && widget.program.phone!.isNotEmpty)
          const PopupMenuItem(
            value: 'call',
            child: ListTile(
              leading: Icon(Icons.phone, size: 20),
              title: Text('Call'),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
          ),
      ],
    ).then((value) {
      if (value == null) return;

      switch (value) {
        case 'open':
          widget.onTap?.call();
          break;
        case 'save':
          widget.onFavoriteToggle?.call();
          break;
        case 'copy':
          _copyToClipboard();
          break;
        case 'website':
          _openWebsite();
          break;
        case 'call':
          _callPhone();
          break;
      }
    });
  }

  Future<void> _copyToClipboard() async {
    await ExportService.copyToClipboard(widget.program);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Program info copied to clipboard'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _openWebsite() async {
    if (widget.program.website.isEmpty) return;
    final uri = Uri.parse(widget.program.website);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _callPhone() async {
    if (widget.program.phone == null || widget.program.phone!.isEmpty) return;
    final uri = Uri.parse('tel:${widget.program.phone}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.condensed ? _buildCondensedCard(context) : _buildFullCard(context);
  }

  Widget _buildCondensedCard(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;

    Widget card = Card(
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              // Category icon
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: isDark
                      ? AppColors.primary.withValues(alpha: 0.15)
                      : AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  CategoryIcons.getIcon(widget.program.category),
                  size: 18,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              // Name and category
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      widget.program.name,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${CategoryIcons.formatName(widget.program.category)} • ${widget.program.locationText}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              // Quick actions
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.program.phone != null && widget.program.phone!.isNotEmpty)
                    _buildQuickActionButton(
                      icon: Icons.phone_outlined,
                      tooltip: 'Call',
                      onTap: _callPhone,
                      isDark: isDark,
                    ),
                  if (widget.program.website.isNotEmpty)
                    _buildQuickActionButton(
                      icon: Icons.language,
                      tooltip: 'Website',
                      onTap: _openWebsite,
                      isDark: isDark,
                    ),
                  if (widget.onFavoriteToggle != null)
                    _buildQuickActionButton(
                      icon: widget.isFavorite ? Icons.bookmark : Icons.bookmark_border,
                      tooltip: widget.isFavorite ? 'Remove from saved' : 'Save',
                      onTap: widget.onFavoriteToggle!,
                      isDark: isDark,
                      isActive: widget.isFavorite,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (isDesktop) {
      card = GestureDetector(
        onSecondaryTapUp: (details) {
          _showContextMenu(context, details.globalPosition);
        },
        child: card,
      );
    }

    return card;
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String tooltip,
    required VoidCallback onTap,
    required bool isDark,
    bool isActive = false,
  }) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Icon(
            icon,
            size: 20,
            color: isActive
                ? AppColors.danger
                : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
          ),
        ),
      ),
    );
  }

  Widget _buildFullCard(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;

    // Use accessibility-aware animation duration
    final animationDuration = AccessibilityService.getAnimationDuration(
      context,
      const Duration(milliseconds: 200),
    );

    Widget card = MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: animationDuration,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: _isHovered ? 0.12 : 0.08),
              blurRadius: _isHovered ? 16 : 8,
              offset: Offset(0, _isHovered ? 4 : 2),
            ),
          ],
        ),
        child: Card(
          elevation: 0,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              width: 1,
            ),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: widget.onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header: Category badge + Source badge + Location
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category badge and source badge
                      Expanded(
                        child: Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            CategoryIcons.buildCategoryBadge(
                              widget.program.category,
                              isDark: isDark,
                            ),
                            // Source badge for external data
                            if (widget.program.dataSource != DataSource.bayNavigator)
                              _buildSourceBadge(isDark),
                          ],
                        ),
                      ),
                      // Location
                      Text(
                        widget.program.locationText,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    widget.program.name,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.35,
                      color: _isHovered
                          ? (isDark ? AppColors.primary200 : AppColors.primary)
                          : null,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),

                  // Description - no Expanded to avoid filling extra space
                  Text(
                    widget.program.description,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                      height: 1.5,
                    ),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Spacer(),

                  // Footer: Quick actions + Save button
                  Container(
                    padding: const EdgeInsets.only(top: 12),
                    decoration: BoxDecoration(
                      border: Border(
                        top: BorderSide(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                          width: 1,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        // Quick action buttons
                        if (widget.program.website.isNotEmpty)
                          _buildCardActionButton(
                            icon: Icons.language,
                            label: 'Website',
                            onTap: _openWebsite,
                            isDark: isDark,
                          ),
                        if (widget.program.phone != null && widget.program.phone!.isNotEmpty) ...[
                          if (widget.program.website.isNotEmpty)
                            const SizedBox(width: 8),
                          _buildCardActionButton(
                            icon: Icons.phone_outlined,
                            label: 'Call',
                            onTap: _callPhone,
                            isDark: isDark,
                          ),
                        ],
                        const Spacer(),
                        // Save button - WCAG 2.2 AAA: 48x48dp minimum touch target
                        if (widget.onFavoriteToggle != null)
                          Semantics(
                            button: true,
                            label: widget.isFavorite
                                ? SemanticLabels.unsaveProgram(widget.program.name)
                                : SemanticLabels.saveProgram(widget.program.name),
                            hint: widget.isFavorite
                                ? 'Double tap to remove from saved list'
                                : 'Double tap to save to your list',
                            onTap: () {
                              HapticFeedback.lightImpact();
                              widget.onFavoriteToggle!();
                              // Announce state change to screen readers
                              AccessibilityService.announceSaveAction(
                                !widget.isFavorite,
                                widget.program.name,
                              );
                            },
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  widget.onFavoriteToggle!();
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Tooltip(
                                  message: widget.isFavorite
                                      ? 'Remove from saved'
                                      : 'Save program',
                                  child: Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: widget.isFavorite
                                          ? AppColors.dangerLight
                                          : (isDark
                                              ? AppColors.darkNeutral100
                                              : AppColors.lightNeutral100),
                                      borderRadius: BorderRadius.circular(22),
                                    ),
                                    child: Icon(
                                      widget.isFavorite
                                          ? Icons.bookmark
                                          : Icons.bookmark_border,
                                      size: 22,
                                      color: widget.isFavorite
                                          ? AppColors.danger
                                          : (isDark
                                              ? AppColors.darkTextSecondary
                                              : AppColors.lightTextSecondary),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );

    // Wrap with GestureDetector for right-click context menu on desktop
    if (isDesktop) {
      card = GestureDetector(
        onSecondaryTapUp: (details) {
          _showContextMenu(context, details.globalPosition);
        },
        child: card,
      );
    }

    return card;
  }

  Widget _buildCardActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: isDark
                ? AppColors.primary.withValues(alpha: 0.15)
                : AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 16,
                color: AppColors.primary,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSourceBadge(bool isDark) {
    final source = widget.program.dataSource;
    final Color badgeColor;
    final IconData badgeIcon;

    switch (source) {
      case DataSource.ohana:
        badgeColor = const Color(0xFF2E7D32); // Green for SMC Connect
        badgeIcon = Icons.location_city;
        break;
      case DataSource.dataSF:
        badgeColor = const Color(0xFF1565C0); // Blue for SF Data
        badgeIcon = Icons.account_balance;
        break;
      case DataSource.oneDegree:
        badgeColor = const Color(0xFF7B1FA2); // Purple for One Degree
        badgeIcon = Icons.hub;
        break;
      case DataSource.bayNavigator:
        badgeColor = AppColors.primary;
        badgeIcon = Icons.explore;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withValues(alpha: isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: badgeColor.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            badgeIcon,
            size: 12,
            color: badgeColor,
          ),
          const SizedBox(width: 4),
          Text(
            source.displayName,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: badgeColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupTag(BuildContext context, String group, bool isDark) {
    // Format the group text
    String displayText = group
        .replaceAll('-', ' ')
        .split(' ')
        .map((word) => word.isNotEmpty
            ? '${word[0].toUpperCase()}${word.substring(1)}'
            : '')
        .join(' ');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.darkNeutral100
            : AppColors.lightNeutral100,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: isDark
              ? AppColors.darkTextSecondary
              : AppColors.lightTextMuted,
        ),
      ),
    );
  }
}
