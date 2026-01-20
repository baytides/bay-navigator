import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/programs_provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/program_card.dart';
import '../widgets/filter_presets_dialog.dart';
import '../widgets/recent_searches_overlay.dart';
import '../services/api_service.dart';
import '../config/theme.dart';
import 'program_detail_screen.dart';

class DirectoryScreen extends StatefulWidget {
  const DirectoryScreen({super.key});

  @override
  State<DirectoryScreen> createState() => DirectoryScreenState();
}

class DirectoryScreenState extends State<DirectoryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final LayerLink _searchLayerLink = LayerLink();
  final ApiService _apiService = ApiService();

  OverlayEntry? _recentSearchesOverlay;
  bool _showRecentSearches = false;

  /// Focus the search field (called from keyboard shortcut)
  void focusSearch() {
    _searchFocusNode.requestFocus();
  }

  /// Open the filters sheet (called from keyboard shortcut)
  void openFilters() {
    _showFilterSheet(context);
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProgramsProvider>().loadData();
    });

    _searchFocusNode.addListener(_onSearchFocusChange);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.removeListener(_onSearchFocusChange);
    _searchFocusNode.dispose();
    // Remove overlay without setState (already disposing)
    _recentSearchesOverlay?.remove();
    _recentSearchesOverlay = null;
    super.dispose();
  }

  void _onSearchFocusChange() {
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;
    if (!isDesktop) return;

    if (_searchFocusNode.hasFocus && _searchController.text.isEmpty) {
      _showRecentSearchesOverlay();
    } else {
      _hideRecentSearches();
    }
  }

  void _showRecentSearchesOverlay() {
    if (_showRecentSearches) return;

    _recentSearchesOverlay = OverlayEntry(
      builder: (context) => Stack(
        children: [
          // Dismiss on tap outside
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.translucent,
              onTap: _hideRecentSearches,
              child: Container(color: Colors.transparent),
            ),
          ),
          RecentSearchesOverlay(
            layerLink: _searchLayerLink,
            width: MediaQuery.of(context).size.width - 32,
            onDismiss: _hideRecentSearches,
            onSearchSelected: (search) {
              _searchController.text = search;
              context.read<ProgramsProvider>().setSearchQuery(search);
              _hideRecentSearches();
            },
          ),
        ],
      ),
    );

    Overlay.of(context).insert(_recentSearchesOverlay!);
    setState(() => _showRecentSearches = true);
  }

  void _hideRecentSearches() {
    _recentSearchesOverlay?.remove();
    _recentSearchesOverlay = null;
    if (mounted) {
      setState(() => _showRecentSearches = false);
    }
  }

  Future<void> _onSearchSubmitted(String query) async {
    if (query.length >= 2) {
      _apiService.addRecentSearch(query);
    }
    _hideRecentSearches();

    // Try AI search for natural language queries (if enabled in settings)
    final provider = context.read<ProgramsProvider>();
    final settingsProvider = context.read<SettingsProvider>();
    if (provider.shouldUseAISearch(query)) {
      await provider.performAISearch(
        query,
        aiEnabled: settingsProvider.aiSearchEnabled,
      );
    }
  }

  void _showFilterPresetsDialog() {
    showDialog(
      context: context,
      builder: (context) => const FilterPresetsDialog(),
    );
  }

  String _getSortLabel(SortOption option) {
    switch (option) {
      case SortOption.recentlyVerified:
        return 'Recently Verified';
      case SortOption.nameAsc:
        return 'Name (A-Z)';
      case SortOption.nameDesc:
        return 'Name (Z-A)';
      case SortOption.categoryAsc:
        return 'Category';
      case SortOption.distanceAsc:
        return 'Distance (Nearest)';
    }
  }

  void _showSortMenu(BuildContext context) {
    final provider = context.read<ProgramsProvider>();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;

    // Use dialog on desktop/tablet for better desktop-class experience
    if (screenWidth >= 768) {
      showDialog(
        context: context,
        builder: (context) => Dialog(
          backgroundColor: isDark ? AppColors.darkCard : Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 320),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'Sort By',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Divider(height: 1),
                ...SortOption.values.map((option) {
                  final isSelected = provider.sortOption == option;
                  return InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      provider.setSortOption(option);
                      Navigator.pop(context);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Icon(
                            isSelected ? Icons.check_circle : Icons.circle_outlined,
                            color: isSelected ? AppColors.primary : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Text(
                            _getSortLabel(option),
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                              color: isDark ? AppColors.darkText : AppColors.lightText,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  'Sort By',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Divider(height: 1),
              ...SortOption.values.map((option) {
                final isSelected = provider.sortOption == option;
                return ListTile(
                  leading: Icon(
                    isSelected ? Icons.check_circle : Icons.circle_outlined,
                    color: isSelected ? AppColors.primary : null,
                  ),
                  title: Text(_getSortLabel(option)),
                  onTap: () {
                    HapticFeedback.lightImpact();
                    provider.setSortOption(option);
                    Navigator.pop(context);
                  },
                );
              }),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
  }

  void _showFilterSheet(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final screenWidth = MediaQuery.of(context).size.width;

    // Use dialog on desktop/tablet for better desktop-class experience
    final useDialog = screenWidth >= 768;

    if (useDialog) {
      showDialog(
        context: context,
        builder: (context) => _buildFilterDialog(context, theme, isDark),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.5,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Consumer<ProgramsProvider>(
              builder: (context, provider, child) {
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Text(
                            'Filters',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (provider.filterState.filterCount > 0) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${provider.filterState.filterCount}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                          const Spacer(),
                          if (provider.filterState.hasFilters)
                            TextButton(
                              onPressed: () {
                                HapticFeedback.lightImpact();
                                provider.clearFilters();
                              },
                              child: const Text('Clear All'),
                            ),
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.close),
                            tooltip: 'Close filters',
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: ListView(
                        controller: scrollController,
                        padding: const EdgeInsets.all(16),
                        children: [
                          _buildFilterSection(
                            context,
                            title: 'Categories',
                            icon: Icons.category,
                            items: provider.categories,
                            selectedIds: provider.filterState.categories,
                            onToggle: (id) {
                              HapticFeedback.lightImpact();
                              provider.toggleCategory(id);
                            },
                            getId: (c) => c.id,
                            getName: (c) => c.name,
                            getCount: (c) => provider.getCategoryCount(c.id),
                          ),
                          const SizedBox(height: 24),
                          _buildFilterSection(
                            context,
                            title: 'Groups',
                            icon: Icons.check_circle_outline,
                            items: provider.groups,
                            selectedIds: provider.filterState.groups,
                            onToggle: (id) {
                              HapticFeedback.lightImpact();
                              provider.toggleGroup(id);
                            },
                            getId: (g) => g.id,
                            getName: (g) => g.name,
                            getCount: (g) => provider.getGroupCount(g.id),
                          ),
                          const SizedBox(height: 24),
                          _buildAreaFilterSection(
                            context,
                            provider: provider,
                          ),
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isDark
                                  ? AppColors.darkBackground
                                  : AppColors.lightBackground,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.list, color: AppColors.primary),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    '${provider.filteredPrograms.length} programs match',
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }

  // Desktop/tablet filter dialog for better desktop-class experience
  Widget _buildFilterDialog(BuildContext context, ThemeData theme, bool isDark) {
    return Dialog(
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
        child: Consumer<ProgramsProvider>(
          builder: (context, provider, child) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Text(
                        'Filters',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (provider.filterState.filterCount > 0) ...[
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '${provider.filterState.filterCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      if (provider.filterState.hasFilters)
                        TextButton(
                          onPressed: () {
                            HapticFeedback.lightImpact();
                            provider.clearFilters();
                          },
                          child: const Text('Clear All'),
                        ),
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                        tooltip: 'Close filters',
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildFilterSection(
                          context,
                          title: 'Categories',
                          icon: Icons.category,
                          items: provider.categories,
                          selectedIds: provider.filterState.categories,
                          onToggle: (id) {
                            HapticFeedback.lightImpact();
                            provider.toggleCategory(id);
                          },
                          getId: (c) => c.id,
                          getName: (c) => c.name,
                          getCount: (c) => provider.getCategoryCount(c.id),
                        ),
                        const SizedBox(height: 24),
                        _buildFilterSection(
                          context,
                          title: 'Groups',
                          icon: Icons.check_circle_outline,
                          items: provider.groups,
                          selectedIds: provider.filterState.groups,
                          onToggle: (id) {
                            HapticFeedback.lightImpact();
                            provider.toggleGroup(id);
                          },
                          getId: (g) => g.id,
                          getName: (g) => g.name,
                          getCount: (g) => provider.getGroupCount(g.id),
                        ),
                        const SizedBox(height: 24),
                        _buildAreaFilterSection(
                          context,
                          provider: provider,
                        ),
                      ],
                    ),
                  ),
                ),
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(Icons.list, color: AppColors.primary),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${provider.filteredPrograms.length} programs match',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                      FilledButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text('Done'),
                      ),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildFilterSection<T>(
    BuildContext context, {
    required String title,
    required IconData icon,
    required List<T> items,
    required List<String> selectedIds,
    required void Function(String) onToggle,
    required String Function(T) getId,
    required String Function(T) getName,
    required int Function(T) getCount,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              title,
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            if (selectedIds.isNotEmpty) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${selectedIds.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: items.map((item) {
            final id = getId(item);
            final isSelected = selectedIds.contains(id);

            return FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(getName(item)),
                  const SizedBox(width: 6),
                  Text(
                    '(${getCount(item)})',
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected
                          ? Colors.white.withValues(alpha: 0.8)
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary),
                    ),
                  ),
                ],
              ),
              selected: isSelected,
              onSelected: (_) => onToggle(id),
              backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
              selectedColor: AppColors.primary,
              checkmarkColor: Colors.white,
              labelStyle: TextStyle(
                color: isSelected
                    ? Colors.white
                    : (isDark ? AppColors.darkText : AppColors.lightText),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isSelected
                      ? AppColors.primary
                      : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // Special area filter section that groups counties and adds "Other" option
  Widget _buildAreaFilterSection(
    BuildContext context, {
    required ProgramsProvider provider,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Separate county areas from non-county areas
    final countyAreas = provider.areas.where((a) => a.type == 'county').toList();
    final otherAreaIds = ['bay-area', 'statewide', 'nationwide'];

    // Check if "Other" is selected (any of the other area IDs are selected)
    final isOtherSelected = provider.filterState.areas.any((id) => otherAreaIds.contains(id));

    // Calculate count for "Other" option
    final otherCount = provider.getOtherAreasCount();

    // Count selected filters for badge (counties + 1 for "Other" if selected)
    final selectedCountyCount = provider.filterState.areas.where((id) => !otherAreaIds.contains(id)).length;
    final selectedFilterCount = selectedCountyCount + (isOtherSelected ? 1 : 0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.location_on, size: 20, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Service Areas',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            if (selectedFilterCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '$selectedFilterCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            // County areas
            ...countyAreas.map((area) {
              final isSelected = provider.filterState.areas.contains(area.id);
              return FilterChip(
                label: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(area.name),
                    const SizedBox(width: 6),
                    Text(
                      '(${provider.getAreaCount(area.id)})',
                      style: TextStyle(
                        fontSize: 12,
                        color: isSelected
                            ? Colors.white.withValues(alpha: 0.8)
                            : (isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary),
                      ),
                    ),
                  ],
                ),
                selected: isSelected,
                onSelected: (_) {
                  HapticFeedback.lightImpact();
                  provider.toggleArea(area.id);
                },
                backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                selectedColor: AppColors.primary,
                checkmarkColor: Colors.white,
                labelStyle: TextStyle(
                  color: isSelected
                      ? Colors.white
                      : (isDark ? AppColors.darkText : AppColors.lightText),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(
                    color: isSelected
                        ? AppColors.primary
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                  ),
                ),
              );
            }),
            // "Other" option (Bay Area, Statewide, Nationwide)
            FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Other'),
                  const SizedBox(width: 6),
                  Text(
                    '($otherCount)',
                    style: TextStyle(
                      fontSize: 12,
                      color: isOtherSelected
                          ? Colors.white.withValues(alpha: 0.8)
                          : (isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary),
                    ),
                  ),
                ],
              ),
              selected: isOtherSelected,
              onSelected: (_) {
                HapticFeedback.lightImpact();
                provider.toggleOtherAreas();
              },
              backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
              selectedColor: AppColors.primary,
              checkmarkColor: Colors.white,
              labelStyle: TextStyle(
                color: isOtherSelected
                    ? Colors.white
                    : (isDark ? AppColors.darkText : AppColors.lightText),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(
                  color: isOtherSelected
                      ? AppColors.primary
                      : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = Platform.isMacOS || Platform.isWindows || Platform.isLinux;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    return Scaffold(
      body: SafeArea(
        top: !useDesktopLayout, // Don't add top safe area on desktop (handled by title bar)
        child: Consumer<ProgramsProvider>(
          builder: (context, provider, child) {
            if (provider.isLoading && provider.programs.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (provider.error != null && provider.programs.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: AppColors.danger),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load programs',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      provider.error!,
                      style: theme.textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => provider.loadData(forceRefresh: true),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            final programs = provider.filteredPrograms;

            return RefreshIndicator(
              onRefresh: () => provider.loadData(forceRefresh: true),
              child: CustomScrollView(
                slivers: [
                  // Header with app title (mobile only)
                  if (!useDesktopLayout)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Semantics(
                              image: true,
                              label: 'Bay Navigator logo',
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.asset(
                                  'assets/images/favicons/web-app-manifest-512x512.png',
                                  width: 48,
                                  height: 48,
                                  semanticLabel: 'Bay Navigator logo',
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Directory',
                                    style: theme.textTheme.titleLarge,
                                  ),
                                  Text(
                                    'Browse all programs',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Search bar
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: CompositedTransformTarget(
                        link: _searchLayerLink,
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocusNode,
                          decoration: InputDecoration(
                            hintText: 'Search programs...',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    tooltip: 'Clear search',
                                    onPressed: () {
                                      _searchController.clear();
                                      provider.setSearchQuery('');
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide.none,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                          onChanged: (value) {
                            provider.setSearchQuery(value);
                            if (value.isNotEmpty) {
                              _hideRecentSearches();
                            }
                          },
                          onSubmitted: _onSearchSubmitted,
                        ),
                      ),
                    ),
                  ),

                  // Filter and Sort bar
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          // Filter button
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _showFilterSheet(context),
                              icon: const Icon(Icons.filter_list, size: 20),
                              label: Text(
                                provider.filterState.filterCount > 0
                                    ? 'Filters (${provider.filterState.filterCount})'
                                    : 'Filters',
                              ),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: provider.filterState.hasFilters
                                    ? AppColors.primary
                                    : null,
                                side: BorderSide(
                                  color: provider.filterState.hasFilters
                                      ? AppColors.primary
                                      : (isDark
                                          ? AppColors.darkBorder
                                          : AppColors.lightBorder),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                          // Filter presets button (desktop only)
                          if (Platform.isMacOS || Platform.isWindows || Platform.isLinux) ...[
                            const SizedBox(width: 8),
                            IconButton(
                              onPressed: _showFilterPresetsDialog,
                              icon: const Icon(Icons.bookmarks_outlined),
                              tooltip: 'Filter Presets',
                              style: IconButton.styleFrom(
                                side: BorderSide(
                                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(width: 12),
                          // Sort button
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: () => _showSortMenu(context),
                              icon: const Icon(Icons.sort, size: 20),
                              label: Text(_getSortLabel(provider.sortOption)),
                              style: OutlinedButton.styleFrom(
                                side: BorderSide(
                                  color: isDark
                                      ? AppColors.darkBorder
                                      : AppColors.lightBorder,
                                ),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // AI Search loading indicator
                  if (provider.isAISearching)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Searching with AI...',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // AI Search message (when results are from AI)
                  if (provider.aiSearchMessage != null && !provider.isAISearching)
                    SliverToBoxAdapter(
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.primary.withValues(alpha: 0.15)
                              : AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                              Icons.auto_awesome,
                              size: 18,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                provider.aiSearchMessage!,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark ? AppColors.darkText : AppColors.lightText,
                                ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.close, size: 18),
                              onPressed: () {
                                provider.clearAISearch();
                                _searchController.clear();
                              },
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              tooltip: 'Clear AI search',
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Results count, view mode toggle, and clear filters
                  SliverToBoxAdapter(
                    child: Consumer<SettingsProvider>(
                      builder: (context, settingsProvider, child) {
                        final isCondensed = settingsProvider.directoryViewMode == DirectoryViewMode.condensed;
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Row(
                            children: [
                              Text(
                                provider.aiSearchResults != null
                                    ? '${programs.length} AI result${programs.length == 1 ? '' : 's'}'
                                    : '${programs.length} program${programs.length == 1 ? '' : 's'}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const Spacer(),
                              // View mode toggle
                              IconButton(
                                icon: Icon(
                                  isCondensed ? Icons.view_list : Icons.grid_view,
                                  size: 20,
                                ),
                                tooltip: isCondensed ? 'Switch to card view' : 'Switch to list view',
                                onPressed: () {
                                  HapticFeedback.lightImpact();
                                  settingsProvider.setDirectoryViewMode(
                                    isCondensed ? DirectoryViewMode.comfort : DirectoryViewMode.condensed,
                                  );
                                },
                                style: IconButton.styleFrom(
                                  padding: const EdgeInsets.all(8),
                                  minimumSize: const Size(36, 36),
                                ),
                              ),
                              if (provider.filterState.hasFilters || provider.aiSearchResults != null) ...[
                                const SizedBox(width: 4),
                                TextButton.icon(
                                  onPressed: () {
                                    _searchController.clear();
                                    provider.clearFilters();
                                    provider.clearAISearch();
                                  },
                                  icon: const Icon(Icons.clear, size: 18),
                                  label: const Text('Clear'),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // Program list or empty state
                  if (programs.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.search_off,
                              size: 64,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'No programs found',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Try adjusting your search or filters',
                              style: theme.textTheme.bodySmall,
                            ),
                            if (provider.filterState.hasFilters)
                              Padding(
                                padding: const EdgeInsets.only(top: 16),
                                child: TextButton(
                                  onPressed: () {
                                    _searchController.clear();
                                    provider.clearFilters();
                                  },
                                  child: const Text('Clear Filters'),
                                ),
                              ),
                          ],
                        ),
                      ),
                    )
                  else
                    Consumer<SettingsProvider>(
                      builder: (context, settingsProvider, child) {
                        final isCondensed = settingsProvider.directoryViewMode == DirectoryViewMode.condensed;

                        if (isCondensed) {
                          // Condensed list view
                          return SliverPadding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            sliver: SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) {
                                  final program = programs[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: ProgramCard(
                                      program: program,
                                      isFavorite: provider.isFavorite(program.id),
                                      condensed: true,
                                      onTap: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) => ProgramDetailScreen(
                                              program: program,
                                            ),
                                          ),
                                        );
                                      },
                                      onFavoriteToggle: () {
                                        provider.toggleFavorite(program.id);
                                      },
                                    ),
                                  );
                                },
                                childCount: programs.length,
                              ),
                            ),
                          );
                        }

                        // Comfort grid view (default)
                        return SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          sliver: SliverLayoutBuilder(
                            builder: (context, constraints) {
                              // Responsive grid: 1 column < 600px, 2 columns 600-900px, 3 columns > 900px
                              final width = constraints.crossAxisExtent;
                              int crossAxisCount;
                              if (width >= 1200) {
                                crossAxisCount = 4;
                              } else if (width >= 900) {
                                crossAxisCount = 3;
                              } else if (width >= 600) {
                                crossAxisCount = 2;
                              } else {
                                crossAxisCount = 1;
                              }

                              // Card height - compact design to reduce wasted space
                              const cardHeight = 280.0;
                              final cardWidth = (width - (crossAxisCount - 1) * 16) / crossAxisCount;
                              final aspectRatio = cardWidth / cardHeight;

                              return SliverGrid(
                                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: crossAxisCount,
                                  mainAxisSpacing: 16,
                                  crossAxisSpacing: 16,
                                  childAspectRatio: aspectRatio,
                                ),
                                delegate: SliverChildBuilderDelegate(
                                  (context, index) {
                                    final program = programs[index];
                                    return ProgramCard(
                                      program: program,
                                      isFavorite: provider.isFavorite(program.id),
                                      condensed: false,
                                      onTap: () {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (context) => ProgramDetailScreen(
                                              program: program,
                                            ),
                                          ),
                                        );
                                      },
                                      onFavoriteToggle: () {
                                        provider.toggleFavorite(program.id);
                                      },
                                    );
                                  },
                                  childCount: programs.length,
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),

                  // Bottom padding
                  const SliverToBoxAdapter(
                    child: SizedBox(height: 16),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
