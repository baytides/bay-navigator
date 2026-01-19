import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../data/location_lookup.dart';
import '../providers/programs_provider.dart';
import '../providers/user_prefs_provider.dart';
import '../widgets/liquid_glass.dart';
import '../services/platform_service.dart';
import '../services/location_service.dart';
import '../utils/group_icons.dart';

class OnboardingScreen extends StatefulWidget {
  final VoidCallback onComplete;

  const OnboardingScreen({super.key, required this.onComplete});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with SingleTickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;
  double _pageOpacity = 1.0;

  // Local state for selections during onboarding
  final List<String> _selectedGroups = [];
  String? _selectedCounty;
  final TextEditingController _locationController = TextEditingController();
  String? _locationError;
  bool _isGpsLoading = false;

  @override
  void initState() {
    super.initState();
    // Ensure data is loaded for onboarding
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProgramsProvider>().loadData();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _nextPage() async {
    if (_currentPage < 3) {
      // Fade out
      setState(() => _pageOpacity = 0.0);
      await Future.delayed(const Duration(milliseconds: 200));

      // Change page
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );

      // Fade in
      await Future.delayed(const Duration(milliseconds: 150));
      if (mounted) setState(() => _pageOpacity = 1.0);
    }
  }

  Future<void> _previousPage() async {
    if (_currentPage > 0) {
      // Fade out
      setState(() => _pageOpacity = 0.0);
      await Future.delayed(const Duration(milliseconds: 200));

      // Change page
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );

      // Fade in
      await Future.delayed(const Duration(milliseconds: 150));
      if (mounted) setState(() => _pageOpacity = 1.0);
    }
  }

  Future<void> _completeOnboarding() async {
    setState(() => _isLoading = true);

    final userPrefsProvider = context.read<UserPrefsProvider>();

    // Save preferences
    await userPrefsProvider.savePreferences(
      groups: _selectedGroups,
      county: _selectedCounty,
    );

    // Mark onboarding as complete
    await userPrefsProvider.completeOnboarding();

    // Small delay for loading animation
    await Future.delayed(const Duration(milliseconds: 800));

    if (mounted) {
      widget.onComplete();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            Padding(
              padding: const EdgeInsets.all(24),
              child: Row(
                children: List.generate(4, (index) {
                  final isActive = index <= _currentPage;
                  final isCurrent = index == _currentPage;
                  return Expanded(
                    child: Container(
                      margin: EdgeInsets.only(right: index < 3 ? 8 : 0),
                      height: 4,
                      decoration: BoxDecoration(
                        color: isActive
                            ? AppColors.primary
                            : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: isCurrent && _isLoading
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: const LinearProgressIndicator(
                                backgroundColor: Colors.transparent,
                                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
                              ),
                            )
                          : null,
                    ),
                  );
                }),
              ),
            ),

            // Page content
            Expanded(
              child: AnimatedOpacity(
                opacity: _pageOpacity,
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeInOut,
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (page) {
                    setState(() => _currentPage = page);
                  },
                  children: [
                    _buildWelcomePage(theme, isDark),
                    _buildGroupsPage(theme, isDark),
                    _buildCountyPage(theme, isDark),
                    _buildCompletePage(theme, isDark),
                  ],
                ),
              ),
            ),

            // Navigation buttons
            if (!_isLoading)
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    if (_currentPage > 0)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _previousPage,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            side: BorderSide(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                            ),
                          ),
                          child: const Text('Back'),
                        ),
                      ),
                    if (_currentPage > 0) const SizedBox(width: 16),
                    Expanded(
                      flex: _currentPage == 0 ? 1 : 1,
                      child: FilledButton(
                        onPressed: _currentPage == 3
                            ? _completeOnboarding
                            : _nextPage,
                        style: FilledButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: AppColors.primary,
                        ),
                        child: Text(
                          _currentPage == 0
                              ? 'Get Started'
                              : _currentPage == 3
                                  ? 'Start Exploring'
                                  : 'Continue',
                        ),
                      ),
                    ),
                  ],
                ),
              ),

            // Skip button on groups and county pages
            if (!_isLoading && _currentPage > 0 && _currentPage < 3)
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: TextButton(
                  onPressed: () async {
                    // Fade out
                    setState(() => _pageOpacity = 0.0);
                    await Future.delayed(const Duration(milliseconds: 200));

                    // Jump to complete page
                    _pageController.animateToPage(
                      3,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );

                    // Fade in
                    await Future.delayed(const Duration(milliseconds: 150));
                    if (mounted) setState(() => _pageOpacity = 1.0);
                  },
                  child: Text(
                    'Skip personalization',
                    style: TextStyle(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomePage(ThemeData theme, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 48),

          // App icon/illustration
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  AppColors.primary,
                  AppColors.primary.withValues(alpha: 0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(
              Icons.volunteer_activism,
              size: 48,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: 32),

          Text(
            'Welcome to Bay Navigator',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          Text(
            'Discover hundreds of free and discounted programs available to Bay Area residents.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 40),

          // Feature highlights
          _buildFeatureRow(
            icon: Icons.tune,
            title: 'Personalized for You',
            description: 'Answer a few quick questions to see programs tailored to your needs.',
            isDark: isDark,
          ),

          const SizedBox(height: 20),

          _buildFeatureRow(
            icon: Icons.groups,
            title: 'Community Resource',
            description: 'A free, open-source project helping neighbors find assistance programs.',
            isDark: isDark,
          ),

          const SizedBox(height: 20),

          _buildFeatureRow(
            icon: Icons.lock_outline,
            title: 'Your Privacy Matters',
            description: 'All your preferences stay on your device. We collect zero personal data.',
            isDark: isDark,
          ),

          const SizedBox(height: 32),

          // Privacy note
          _buildInfoContainer(
            context,
            isDark: isDark,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline,
                  size: 20,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'We collect de-identified crash and diagnostic data by default to improve the app. You can disable this anytime in Settings.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required String title,
    required String description,
    required bool isDark,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            color: AppColors.primary,
            size: 22,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkText : AppColors.lightText,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGroupsPage(ThemeData theme, bool isDark) {
    return Consumer<ProgramsProvider>(
      builder: (context, provider, child) {
        final groups = provider.groups;

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Text(
                'Who are you?',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Select all that apply to see relevant discounts and benefits.',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 32),

              if (groups.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else
                Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: groups.map((group) {
                    final isSelected = _selectedGroups.contains(group.id);
                    final groupColor = GroupIcons.getGroupColor(group.icon);
                    return FilterChip(
                      label: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            GroupIcons.getIcon(group.icon),
                            size: 18,
                            color: isSelected ? groupColor : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                          ),
                          const SizedBox(width: 8),
                          Text(group.name),
                        ],
                      ),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedGroups.add(group.id);
                          } else {
                            _selectedGroups.remove(group.id);
                          }
                        });
                      },
                      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                      selectedColor: groupColor.withValues(alpha: 0.15),
                      checkmarkColor: groupColor,
                      labelStyle: TextStyle(
                        color: isSelected
                            ? groupColor
                            : (isDark ? AppColors.darkText : AppColors.lightText),
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                        side: BorderSide(
                          color: isSelected
                              ? groupColor
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    );
                  }).toList(),
                ),

              const SizedBox(height: 24),
              if (_selectedGroups.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          '${_selectedGroups.length} group${_selectedGroups.length == 1 ? '' : 's'} selected',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  void _handleLocationInput(String value) {
    if (value.isEmpty) {
      setState(() {
        _locationError = null;
        // Don't clear county - user might be editing
      });
      return;
    }

    final county = LocationLookup.lookupCounty(value);
    if (county != null) {
      // Convert county name to ID format (lowercase, no spaces)
      final countyId = county.toLowerCase().replaceAll(' ', '-');
      setState(() {
        _selectedCounty = countyId;
        _locationError = null;
      });
    } else if (value.length >= 3) {
      // Only show error after user has typed enough
      if (LocationLookup.isZipCodeFormat(value)) {
        setState(() {
          _locationError = 'ZIP code not found in Bay Area';
        });
      } else if (!RegExp(r'^\d+$').hasMatch(value)) {
        // Only show city error if not still typing numbers
        setState(() {
          _locationError = 'City not found';
        });
      }
    }
  }

  Future<void> _handleGpsLocation() async {
    setState(() {
      _isGpsLoading = true;
      _locationError = null;
    });

    try {
      final locationService = LocationService();
      final success = await locationService.getCurrentLocation();

      if (success && locationService.currentCounty != null) {
        final county = locationService.currentCounty!;
        final countyId = county.toLowerCase().replaceAll(' ', '-');
        setState(() {
          _selectedCounty = countyId;
          _locationController.text = county;
          _isGpsLoading = false;
        });
      } else {
        setState(() {
          _locationError = locationService.error ?? 'Could not get location';
          _isGpsLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _locationError = 'Could not get location';
        _isGpsLoading = false;
      });
    }
  }

  Widget _buildCountyPage(ThemeData theme, bool isDark) {
    return Consumer<ProgramsProvider>(
      builder: (context, provider, child) {
        // Only show county-type areas
        final counties = provider.areas.where((a) => a.type == 'county').toList();

        return SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Text(
                'Where do you live?',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter your ZIP code or city, or select from the list below.',
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 24),

              // ZIP/City input field with GPS button
              Row(
                children: [
                  Expanded(
                    child: Autocomplete<String>(
                      optionsBuilder: (TextEditingValue textEditingValue) {
                        if (textEditingValue.text.isEmpty) {
                          return const Iterable<String>.empty();
                        }
                        return LocationLookup.getSuggestions(textEditingValue.text);
                      },
                      onSelected: (String selection) {
                        _locationController.text = selection;
                        _handleLocationInput(selection);
                      },
                      fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                        // Sync the autocomplete controller with ours
                        if (_locationController.text.isNotEmpty && controller.text.isEmpty) {
                          controller.text = _locationController.text;
                        }
                        return TextField(
                          controller: controller,
                          focusNode: focusNode,
                          decoration: InputDecoration(
                            hintText: 'ZIP code or city name...',
                            prefixIcon: const Icon(Icons.location_on_outlined),
                            suffixIcon: controller.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear),
                                    onPressed: () {
                                      controller.clear();
                                      _locationController.clear();
                                      setState(() {
                                        _selectedCounty = null;
                                        _locationError = null;
                                      });
                                    },
                                  )
                                : null,
                            errorText: _locationError,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            filled: true,
                            fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                          ),
                          onChanged: (value) {
                            _locationController.text = value;
                            _handleLocationInput(value);
                          },
                          onSubmitted: (_) => onFieldSubmitted(),
                          textInputAction: TextInputAction.done,
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  // GPS button
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.darkCard : AppColors.lightCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                      ),
                    ),
                    child: IconButton(
                      onPressed: _isGpsLoading ? null : _handleGpsLocation,
                      icon: _isGpsLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.my_location),
                      tooltip: 'Use my location',
                    ),
                  ),
                ],
              ),

              // Selected county display
              if (_selectedCounty != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Builder(
                          builder: (context) {
                            final county = counties.where((c) => c.id == _selectedCounty).firstOrNull;
                            return Text(
                              county?.name ?? _selectedCounty!.replaceAll('-', ' '),
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 24),

              // Divider with "or select from list"
              Row(
                children: [
                  Expanded(child: Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'or select from list',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                ],
              ),

              const SizedBox(height: 16),

              if (counties.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator(),
                  ),
                )
              else
                ...counties.map((county) {
                  final isSelected = _selectedCounty == county.id;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedCounty = null;
                            _locationController.clear();
                          } else {
                            _selectedCounty = county.id;
                            _locationController.text = county.name;
                          }
                          _locationError = null;
                        });
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.1)
                              : (isDark ? AppColors.darkCard : AppColors.lightCard),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.primary
                                : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 24,
                              height: 24,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isSelected
                                    ? AppColors.primary
                                    : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                              ),
                              child: isSelected
                                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Text(
                                county.name,
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark ? AppColors.darkText : AppColors.lightText),
                                ),
                              ),
                            ),
                            Text(
                              '${county.programCount} programs',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCompletePage(ThemeData theme, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const SizedBox(height: 48),

          // Animated checkmark or loading
          if (_isLoading)
            SizedBox(
              width: 120,
              height: 120,
              child: CircularProgressIndicator(
                strokeWidth: 4,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            )
          else
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.success.withValues(alpha: 0.1),
              ),
              child: Icon(
                Icons.check_circle,
                size: 80,
                color: AppColors.success,
              ),
            ),

          const SizedBox(height: 32),
          Text(
            _isLoading ? 'Setting up your experience...' : 'You\'re all set!',
            style: theme.textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            _isLoading
                ? 'Personalizing your recommendations'
                : 'We\'ll show you programs tailored to your profile.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 48),

          // Summary of selections
          if (!_isLoading && (_selectedGroups.isNotEmpty || _selectedCounty != null))
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : AppColors.lightCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your Profile',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_selectedGroups.isNotEmpty)
                    _buildSummaryRow(
                      context,
                      icon: Icons.people,
                      label: 'Groups',
                      value: _selectedGroups.length == 1
                          ? '1 group'
                          : '${_selectedGroups.length} groups',
                      isDark: isDark,
                    ),
                  if (_selectedCounty != null) ...[
                    if (_selectedGroups.isNotEmpty) const SizedBox(height: 12),
                    Consumer<ProgramsProvider>(
                      builder: (context, provider, child) {
                        final county = provider.areas
                            .where((a) => a.id == _selectedCounty)
                            .firstOrNull;
                        return _buildSummaryRow(
                          context,
                          icon: Icons.location_on,
                          label: 'County',
                          value: county?.name ?? 'Selected',
                          isDark: isDark,
                        );
                      },
                    ),
                  ],
                ],
              ),
            ),

          if (!_isLoading && _selectedGroups.isEmpty && _selectedCounty == null)
            _buildInfoContainer(
              context,
              isDark: isDark,
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      'No personalization selected. You can update this later in Settings.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(
    BuildContext context, {
    required IconData icon,
    required String label,
    required String value,
    required bool isDark,
  }) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppColors.primary,
        ),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  /// Builds a container that uses Liquid Glass on iOS, or a standard container elsewhere
  Widget _buildInfoContainer(
    BuildContext context, {
    required bool isDark,
    required Widget child,
  }) {
    final useLiquidGlass = PlatformService.isIOS;

    if (useLiquidGlass) {
      return LiquidGlassContainer(
        padding: const EdgeInsets.all(20),
        borderRadius: BorderRadius.circular(16),
        child: child,
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : AppColors.lightCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
        ),
      ),
      child: child,
    );
  }
}
