import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../data/location_lookup.dart';
import '../providers/programs_provider.dart';
import '../providers/user_prefs_provider.dart';
import '../providers/localization_provider.dart';
import '../providers/safety_provider.dart';
import '../services/localization_service.dart';
import '../services/location_service.dart';

class OnboardingScreen extends StatefulWidget {
  final void Function({bool showSettings}) onComplete;

  const OnboardingScreen({super.key, required this.onComplete});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;
  bool _isProcessing = false;
  String _processingMessage = '';

  // Form state
  String? _firstName;
  String? _city;
  String? _zipCode;
  String? _county;
  int? _birthYear;
  bool? _isMilitaryOrVeteran;
  final Set<String> _selectedQualifications = {};

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  bool _isGpsLoading = false;
  String? _locationError;

  // Total pages: Language, Welcome, Privacy, Name, Location, BirthYear, Qualifications, Review, Processing
  static const int _totalPages = 9;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProgramsProvider>().loadData();
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  // Sensitive categories that may warrant extra data protection
  static const _sensitiveCategories = {'lgbtq', 'immigrant', 'disability'};

  bool _hasSensitiveCategories() {
    return _selectedQualifications.any((q) => _sensitiveCategories.contains(q));
  }

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<bool> _showSensitiveDataProtectionDialog() async {
    final safetyProvider = context.read<SafetyProvider>();

    // Skip dialog if encryption is already enabled
    if (safetyProvider.encryptionEnabled) {
      return false; // No need to show Settings, already enabled
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    final result = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        contentPadding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
        actionsPadding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
        title: Row(
          children: [
            Icon(Icons.shield_outlined, color: AppColors.primary, size: 28),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Protect Your Information',
                style: TextStyle(fontSize: 20),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              "You've selected categories that may be sensitive. We recommend enabling extra data protection.",
              style: TextStyle(
                fontSize: 15,
                height: 1.4,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lock, size: 20, color: AppColors.primary),
                      const SizedBox(width: 10),
                      const Text(
                        'Data Encryption',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Encrypts all your saved preferences on this device',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'You can always change this later in Safety Settings.',
              style: TextStyle(
                fontSize: 13,
                fontStyle: FontStyle.italic,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: const Text('Skip'),
          ),
          const SizedBox(width: 8),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.shield, size: 18),
            label: const Text('Enable Protection'),
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
          ),
        ],
      ),
    );

    if (!mounted) return false;

    if (result == true) {
      // Enable encryption
      HapticFeedback.mediumImpact();
      await safetyProvider.enableEncryption();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white, size: 18),
                SizedBox(width: 12),
                Text('Data protection enabled'),
              ],
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return true; // User enabled protection, show Settings
    }

    return false; // User skipped, don't show Settings
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _goToPage(int page) {
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _completeOnboarding() async {
    // Check if user has sensitive categories and show protection dialog first
    bool showSettings = false;
    if (_hasSensitiveCategories()) {
      showSettings = await _showSensitiveDataProtectionDialog();
      if (!mounted) return;
    }

    // Show processing animation
    _goToPage(_totalPages - 1);

    setState(() {
      _isProcessing = true;
      _processingMessage = 'Setting up your profile...';
    });

    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    setState(() => _processingMessage = 'Finding programs in ${_county ?? "your area"}...');
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    setState(() => _processingMessage = 'Personalizing your experience...');
    await Future.delayed(const Duration(milliseconds: 800));
    if (!mounted) return;

    final userPrefsProvider = context.read<UserPrefsProvider>();

    // Save preferences
    await userPrefsProvider.savePreferences(
      firstName: _firstName,
      city: _city,
      zipCode: _zipCode,
      county: _county,
      birthYear: _birthYear,
      isMilitaryOrVeteran: _isMilitaryOrVeteran,
      qualifications: _selectedQualifications.toList(),
    );

    // Mark onboarding as complete
    await userPrefsProvider.completeOnboarding();

    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    // Complete onboarding and optionally navigate to settings
    widget.onComplete(showSettings: showSettings);
  }

  void _skipOnboarding() async {
    final userPrefsProvider = context.read<UserPrefsProvider>();
    await userPrefsProvider.completeOnboarding();
    widget.onComplete(showSettings: false);
  }

  Future<void> _detectLocation() async {
    setState(() {
      _isGpsLoading = true;
      _locationError = null;
    });

    try {
      final locationService = LocationService();
      final success = await locationService.getCurrentLocation();

      if (!mounted) return;

      if (success && locationService.currentCounty != null) {
        final countyName = locationService.currentCounty!;
        final countyId = LocationLookup.countyNameToId(countyName);

        // Just store the county name as the display location for GPS detection
        // The county ID is used internally for filtering
        setState(() {
          _county = countyId;
          _city = countyName; // Show county name for GPS (we don't know exact city)
          _locationController.text = countyName;
          _locationError = null;
        });
      } else {
        // Show specific error from location service
        final error = locationService.error ?? 'Could not detect location. Try entering your city or ZIP.';
        setState(() => _locationError = error);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _locationError = 'Location unavailable. Try entering your city or ZIP.');
      }
    } finally {
      if (mounted) {
        setState(() => _isGpsLoading = false);
      }
    }
  }

  void _handleLocationInput(String value) {
    if (value.isEmpty) {
      setState(() {
        _locationError = null;
        _county = null;
        _city = null;
        _zipCode = null;
      });
      return;
    }

    final countyName = LocationLookup.lookupCounty(value);
    if (countyName != null) {
      final countyId = LocationLookup.countyNameToId(countyName);

      // If user entered a ZIP code, store it and get the city name
      String cityName = value;
      String? zipCode;
      if (LocationLookup.isZipCodeFormat(value)) {
        zipCode = value;
        final zipCity = LocationLookup.zipToCity[value];
        if (zipCity != null) {
          cityName = zipCity;
        }
      }

      setState(() {
        _county = countyId;
        _city = cityName;
        _zipCode = zipCode;
        _locationError = null;
      });
    } else if (value.length >= 3) {
      setState(() {
        _locationError = 'City or ZIP not found in Bay Area';
        _county = null;
        _zipCode = null;
      });
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
            // Progress indicator (hide on first and last page)
            if (_currentPage > 0 && _currentPage < _totalPages - 1)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                child: Row(
                  children: List.generate(
                    _totalPages - 2, // Exclude language and processing pages
                    (index) => Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: index < _currentPage
                              ? AppColors.primary
                              : isDark
                                  ? Colors.white24
                                  : Colors.black12,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // Page content
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                onPageChanged: (page) => setState(() => _currentPage = page),
                children: [
                  _buildLanguagePage(isDark),
                  _buildWelcomePage(isDark),
                  _buildPrivacyPage(isDark),
                  _buildNamePage(isDark),
                  _buildLocationPage(isDark),
                  _buildBirthYearPage(isDark),
                  _buildQualificationsPage(isDark),
                  _buildReviewPage(isDark),
                  _buildProcessingPage(isDark),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Page 0: Language Selection
  Widget _buildLanguagePage(bool isDark) {
    return Consumer<LocalizationProvider>(
      builder: (context, locProvider, _) {
        final currentLocale = locProvider.currentLocale;

        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),
              Text(
                '🌍',
                style: TextStyle(fontSize: 64),
              ),
              const SizedBox(height: 24),
              Text(
                'Choose Your Language',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Select your preferred language',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              Expanded(
                child: GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 2.5,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: AppLocale.values.length,
                  itemBuilder: (context, index) {
                    final locale = AppLocale.values[index];
                    final isSelected = locale == currentLocale;

                    return Material(
                      color: isSelected
                          ? AppColors.primary.withValues(alpha: 0.15)
                          : isDark
                              ? AppColors.darkCard
                              : AppColors.lightCard,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        onTap: () => locProvider.setLocale(locale),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(locale.flag, style: const TextStyle(fontSize: 24)),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  locale.nativeName,
                                  style: TextStyle(
                                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                    color: isSelected ? AppColors.primary : null,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (isSelected)
                                Icon(Icons.check_circle, color: AppColors.primary, size: 20),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _nextPage,
                  child: const Text('Continue'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // Page 1: Welcome
  Widget _buildWelcomePage(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Spacer(),
          // Logo
          ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: Image.asset(
              'assets/images/favicons/web-app-manifest-512x512.png',
              width: 120,
              height: 120,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Bay Navigator',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your guide to local savings & benefits',
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          _buildFeatureRow(Icons.tune, 'Personalized for You', 'Find programs that match your needs'),
          const SizedBox(height: 16),
          _buildFeatureRow(Icons.groups, 'Community Resource', '850+ programs across the Bay Area'),
          const SizedBox(height: 16),
          _buildFeatureRow(Icons.lock, 'Your Privacy Matters', 'All data stays on your device'),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _nextPage,
              child: const Text('Get Started'),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _skipOnboarding,
            child: Text(
              'Skip for now',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String title, String subtitle) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Page 2: Privacy Promise
  Widget _buildPrivacyPage(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Spacer(),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(Icons.shield_outlined, size: 40, color: AppColors.primary),
          ),
          const SizedBox(height: 24),
          Text(
            'Your Privacy is Protected',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'Before we ask you any questions, we want you to know:',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          _buildPrivacyItem(
            Icons.smartphone,
            'Stored Only on Your Device',
            'Your profile never leaves this device. We can\'t see or access it.',
            isDark,
          ),
          const SizedBox(height: 16),
          _buildPrivacyItem(
            Icons.cloud_off,
            'No Tracking or Data Collection',
            'AI assistant and crash reporting are optional and can be disabled in Settings.',
            isDark,
          ),
          const SizedBox(height: 16),
          _buildPrivacyItem(
            Icons.delete_forever,
            'You\'re in Control',
            'Delete your profile anytime in Settings—it\'s gone instantly.',
            isDark,
          ),
          const SizedBox(height: 16),
          _buildPrivacyItem(
            Icons.verified_user,
            'Advanced Privacy Tech',
            'Built-in Tor routing, proxy support, and routed calling options—all optional.',
            isDark,
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _nextPage,
              child: const Text('I Understand'),
            ),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _skipOnboarding,
            child: Text(
              'Skip setup',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyItem(IconData icon, String title, String description, bool isDark) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.success, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // Page 3: Name
  Widget _buildNamePage(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Text(
            'What should we call you?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This helps us personalize your experience.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: InputDecoration(
              hintText: 'Your first name',
              prefixIcon: const Icon(Icons.person_outline),
              filled: true,
              fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
            onChanged: (value) {
              setState(() => _firstName = value.isEmpty ? null : value.trim());
            },
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.lock_outline, size: 14, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Stays on your device only',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          _buildNavigationButtons(canSkip: true),
        ],
      ),
    );
  }

  // Page 3: Location
  Widget _buildLocationPage(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Text(
            'Where do you live?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'We\'ll find programs available in your area.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: Autocomplete<String>(
                  optionsBuilder: (textEditingValue) {
                    if (textEditingValue.text.isEmpty) return [];
                    return LocationLookup.getSuggestions(textEditingValue.text);
                  },
                  onSelected: (selection) {
                    _locationController.text = selection;
                    _handleLocationInput(selection);
                  },
                  fieldViewBuilder: (context, controller, focusNode, onSubmitted) {
                    // Sync controllers
                    if (_locationController.text.isNotEmpty && controller.text.isEmpty) {
                      controller.text = _locationController.text;
                    }
                    return TextField(
                      controller: controller,
                      focusNode: focusNode,
                      decoration: InputDecoration(
                        hintText: 'City or ZIP code',
                        prefixIcon: const Icon(Icons.location_on_outlined),
                        suffixIcon: controller.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  controller.clear();
                                  _locationController.clear();
                                  _handleLocationInput('');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        errorText: _locationError,
                      ),
                      onChanged: (value) {
                        _locationController.text = value;
                        _handleLocationInput(value);
                      },
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              IconButton.filled(
                onPressed: _isGpsLoading ? null : _detectLocation,
                icon: _isGpsLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.my_location),
                tooltip: 'Detect my location',
              ),
            ],
          ),
          if (_county != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: AppColors.success, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Got it! You\'re in ${_city ?? _getCountyDisplayName(_county!)}',
                      style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const Spacer(),
          _buildNavigationButtons(canSkip: true),
        ],
      ),
    );
  }

  String _getCountyDisplayName(String countyId) {
    final parts = countyId.split('-');
    return parts.map((p) => p[0].toUpperCase() + p.substring(1)).join(' ');
  }

  // Page 4: Birth Year
  Widget _buildBirthYearPage(bool isDark) {
    final currentYear = DateTime.now().year;
    final years = List.generate(100, (i) => currentYear - i - 5); // 5 to 104 years old

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 40),
          Text(
            'What year were you born?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'This helps us find age-based programs for you.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : AppColors.lightCard,
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                value: _birthYear,
                isExpanded: true,
                hint: const Text('Select year'),
                items: years.map((year) {
                  return DropdownMenuItem(
                    value: year,
                    child: Text(year.toString()),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _birthYear = value);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.lock_outline, size: 14, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Only the year is stored, never your full birthday',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          _buildNavigationButtons(canSkip: true),
        ],
      ),
    );
  }

  // Page 5: Qualifications (including military status, LGBTQ+, etc.)
  Widget _buildQualificationsPage(bool isDark) {
    final qualifications = [
      ('military', 'Veteran or Military', 'Served or serving in U.S. military', Icons.military_tech),
      ('lgbtq', 'LGBTQ+', 'Part of the LGBTQ+ community', Icons.diversity_3),
      ('immigrant', 'Immigrant', 'New to the U.S. or non-citizen', Icons.public),
      ('first-responder', 'First Responder', 'Fire, police, EMT, or similar', Icons.local_fire_department),
      ('educator', 'Teacher or Educator', 'Work in education', Icons.cast_for_education),
      ('unemployed', 'Looking for work', 'Currently unemployed', Icons.work_off),
      ('public-assistance', 'Public assistance', 'Receive SNAP, Medi-Cal, etc.', Icons.card_giftcard),
      ('student', 'Student', 'Currently enrolled in school', Icons.school),
      ('disability', 'Disability', 'Have a disability', Icons.accessible),
      ('caregiver', 'Caregiver', 'Care for someone else', Icons.favorite),
    ];

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(
            'Anything else that applies?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Select all that apply to find more relevant programs.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.separated(
              itemCount: qualifications.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final (id, title, subtitle, icon) = qualifications[index];
                // Handle military separately since it's stored differently
                final isSelected = id == 'military'
                    ? _isMilitaryOrVeteran == true
                    : _selectedQualifications.contains(id);

                return _buildCheckboxCard(
                  title,
                  subtitle,
                  icon,
                  isSelected,
                  () {
                    setState(() {
                      if (id == 'military') {
                        // Toggle military status
                        _isMilitaryOrVeteran = _isMilitaryOrVeteran == true ? false : true;
                      } else if (isSelected) {
                        _selectedQualifications.remove(id);
                      } else {
                        _selectedQualifications.add(id);
                      }
                    });
                  },
                  isDark,
                );
              },
            ),
          ),
          const SizedBox(height: 12),
          // Privacy reminder
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.lock_outline, size: 18, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'All data stays on your device and is never sent to our servers.',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          _buildNavigationButtons(canSkip: true, nextLabel: 'Review'),
        ],
      ),
    );
  }

  Widget _buildCheckboxCard(String title, String subtitle, IconData icon, bool isSelected, VoidCallback onTap, bool isDark) {
    return Material(
      color: isSelected
          ? AppColors.primary.withValues(alpha: 0.1)
          : isDark
              ? AppColors.darkCard
              : AppColors.lightCard,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: isSelected ? AppColors.primary : (isDark ? Colors.white54 : Colors.black45)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(fontWeight: FontWeight.w500)),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Checkbox(
                value: isSelected,
                onChanged: (_) => onTap(),
                activeColor: AppColors.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // Page 6: Review
  Widget _buildReviewPage(bool isDark) {
    // Count qualifications including military and LGBTQ+
    int qualCount = _selectedQualifications.length;
    if (_isMilitaryOrVeteran == true) qualCount++;

    // Build qualifications display string
    String qualsDisplay = 'None selected';
    if (qualCount > 0) {
      final items = <String>[];
      if (_isMilitaryOrVeteran == true) items.add('Veteran/Military');
      if (_selectedQualifications.contains('lgbtq')) items.add('LGBTQ+');
      if (_selectedQualifications.contains('immigrant')) items.add('Immigrant');
      if (_selectedQualifications.contains('first-responder')) items.add('First Responder');
      if (_selectedQualifications.contains('educator')) items.add('Educator');
      if (_selectedQualifications.contains('unemployed')) items.add('Job seeker');
      if (_selectedQualifications.contains('public-assistance')) items.add('Public assistance');
      if (_selectedQualifications.contains('student')) items.add('Student');
      if (_selectedQualifications.contains('disability')) items.add('Disability');
      if (_selectedQualifications.contains('caregiver')) items.add('Caregiver');
      qualsDisplay = items.join(', ');
    }

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(
            _firstName != null ? 'Looking good, $_firstName!' : 'Review your info',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Make sure everything looks right before we personalize your experience.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                _buildReviewItem('Name', _firstName ?? 'Not provided', Icons.person, 2, isDark),
                _buildReviewItem('Location', _city ?? (_county != null ? _getCountyDisplayName(_county!) : 'Not provided'), Icons.location_on, 3, isDark),
                _buildReviewItem('Birth Year', _birthYear?.toString() ?? 'Not provided', Icons.cake, 4, isDark),
                _buildReviewItem(
                  'About You',
                  qualsDisplay,
                  Icons.checklist,
                  5,
                  isDark,
                ),
              ],
            ),
          ),
          // Privacy reminder
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.verified_user_outlined, size: 18, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Your profile is stored only on this device. We never collect or transmit your personal information.',
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _completeOnboarding,
              child: const Text('Confirm & Continue'),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _previousPage,
              child: const Text('Go Back'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReviewItem(String label, String value, IconData icon, int editPage, bool isDark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: const TextStyle(fontSize: 13)),
        subtitle: Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        trailing: IconButton(
          icon: const Icon(Icons.edit, size: 18),
          onPressed: () => _goToPage(editPage),
        ),
      ),
    );
  }

  // Page 8: Processing Animation
  Widget _buildProcessingPage(bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 32),
          Text(
            _processingMessage,
            style: Theme.of(context).textTheme.titleMedium,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  // Navigation buttons helper
  Widget _buildNavigationButtons({bool canSkip = false, String nextLabel = 'Continue'}) {
    return Column(
      children: [
        Row(
          children: [
            if (_currentPage > 1) ...[
              Expanded(
                child: OutlinedButton(
                  onPressed: _previousPage,
                  child: const Text('Back'),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: FilledButton(
                onPressed: _nextPage,
                child: Text(nextLabel),
              ),
            ),
          ],
        ),
        if (canSkip) ...[
          const SizedBox(height: 12),
          TextButton(
            onPressed: _nextPage,
            child: const Text('Skip this step'),
          ),
        ],
      ],
    );
  }
}
