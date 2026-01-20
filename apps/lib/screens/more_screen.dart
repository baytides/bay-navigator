import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/navigation_provider.dart';
import '../services/platform_service.dart';

/// More tab hub screen - shows items not in the main tab bar
class MoreScreen extends StatelessWidget {
  final Function(String itemId) onNavigate;

  const MoreScreen({
    super.key,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    return Scaffold(
      body: SafeArea(
        top: !useDesktopLayout,
        child: Consumer<NavigationProvider>(
          builder: (context, navProvider, child) {
            final moreItems = navProvider.moreItems;

            return CustomScrollView(
              slivers: [
                // Header
                if (!useDesktopLayout)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.more_horiz,
                              color: AppColors.primary,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'More',
                                  style: theme.textTheme.titleLarge,
                                ),
                                Text(
                                  'Additional features and settings',
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                // Items list
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final item = moreItems[index];
                        return _buildMoreItem(
                          context,
                          item,
                          isDark,
                          () {
                            HapticFeedback.lightImpact();
                            onNavigate(item.id);
                          },
                        );
                      },
                      childCount: moreItems.length,
                    ),
                  ),
                ),

                // Edit navigation button
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: OutlinedButton.icon(
                      onPressed: () => _showEditNavigation(context),
                      icon: const Icon(Icons.edit),
                      label: const Text('Edit Navigation'),
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 48),
                      ),
                    ),
                  ),
                ),

                // Bottom padding
                SliverToBoxAdapter(
                  child: SizedBox(height: MediaQuery.of(context).padding.bottom),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildMoreItem(
    BuildContext context,
    NavItem item,
    bool isDark,
    VoidCallback onTap,
  ) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            item.icon,
            color: AppColors.primary,
            size: 20,
          ),
        ),
        title: Text(
          item.label,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        trailing: Icon(
          Icons.chevron_right,
          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
        ),
        onTap: onTap,
      ),
    );
  }

  void _showEditNavigation(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _EditNavigationSheet(),
    );
  }
}

/// Bottom sheet for editing navigation
class _EditNavigationSheet extends StatefulWidget {
  const _EditNavigationSheet();

  @override
  State<_EditNavigationSheet> createState() => _EditNavigationSheetState();
}

class _EditNavigationSheetState extends State<_EditNavigationSheet> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final mediaQuery = MediaQuery.of(context);

    return Container(
      constraints: BoxConstraints(
        maxHeight: mediaQuery.size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Consumer<NavigationProvider>(
        builder: (context, navProvider, child) {
          final tabBarItems = navProvider.tabBarItems;
          final moreItems = navProvider.moreItems;

          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Text(
                      'Edit Navigation',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    TextButton(
                      onPressed: () async {
                        await navProvider.resetToDefault();
                        if (context.mounted) {
                          Navigator.pop(context);
                        }
                      },
                      child: const Text('Reset'),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),

              Divider(
                height: 1,
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              ),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // Tab bar section
                    Text(
                      'TAB BAR',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Drag to reorder. "For You" always stays first.',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Tab bar items (reorderable)
                    ReorderableListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: tabBarItems.length,
                      onReorder: (oldIndex, newIndex) {
                        navProvider.reorderTabBar(oldIndex, newIndex);
                      },
                      itemBuilder: (context, index) {
                        final item = tabBarItems[index];
                        return _buildDraggableItem(
                          key: ValueKey(item.id),
                          item: item,
                          isDark: isDark,
                          isInTabBar: true,
                          canRemove: !item.isLocked && tabBarItems.length > 3,
                          onRemove: () => navProvider.removeFromTabBar(item.id),
                        );
                      },
                    ),

                    // Add button if not at max
                    if (tabBarItems.length < NavigationProvider.maxTabBarItems && moreItems.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: OutlinedButton.icon(
                          onPressed: () => _showAddItemDialog(context, moreItems),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add to Tab Bar'),
                          style: OutlinedButton.styleFrom(
                            minimumSize: const Size(double.infinity, 44),
                          ),
                        ),
                      ),

                    const SizedBox(height: 24),

                    // More section
                    if (moreItems.isNotEmpty) ...[
                      Text(
                        'MORE MENU',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Items not in the tab bar appear here.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                      ),
                      const SizedBox(height: 12),

                      ...moreItems.map((item) => _buildDraggableItem(
                        key: ValueKey('more_${item.id}'),
                        item: item,
                        isDark: isDark,
                        isInTabBar: false,
                        canAdd: tabBarItems.length < NavigationProvider.maxTabBarItems,
                        onAdd: () => navProvider.addToTabBar(item.id),
                      )),
                    ],

                    SizedBox(height: mediaQuery.padding.bottom + 16),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDraggableItem({
    required Key key,
    required NavItem item,
    required bool isDark,
    required bool isInTabBar,
    bool canRemove = false,
    bool canAdd = false,
    VoidCallback? onRemove,
    VoidCallback? onAdd,
  }) {
    final theme = Theme.of(context);

    return Container(
      key: key,
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      child: ListTile(
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (isInTabBar && !item.isLocked)
              Icon(
                Icons.drag_handle,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            if (isInTabBar && !item.isLocked)
              const SizedBox(width: 8),
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                item.icon,
                color: AppColors.primary,
                size: 18,
              ),
            ),
          ],
        ),
        title: Text(
          item.label,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: item.isLocked
            ? Text(
                'Always first',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                  fontSize: 11,
                ),
              )
            : null,
        trailing: isInTabBar
            ? (canRemove
                ? IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: onRemove,
                    color: AppColors.danger,
                    tooltip: 'Move to More',
                  )
                : (item.isLocked
                    ? Icon(
                        Icons.lock_outline,
                        size: 18,
                        color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                      )
                    : null))
            : (canAdd
                ? IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: onAdd,
                    color: AppColors.success,
                    tooltip: 'Add to Tab Bar',
                  )
                : null),
      ),
    );
  }

  void _showAddItemDialog(BuildContext context, List<NavItem> availableItems) {
    final navProvider = context.read<NavigationProvider>();

    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Add to Tab Bar'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: availableItems.map((item) {
              return ListTile(
                leading: Icon(item.icon, color: AppColors.primary),
                title: Text(item.label),
                onTap: () {
                  navProvider.addToTabBar(item.id);
                  Navigator.pop(dialogContext);
                },
              );
            }).toList(),
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
