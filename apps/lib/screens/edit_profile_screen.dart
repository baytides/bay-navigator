import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/user_prefs_provider.dart';
import '../providers/safety_provider.dart';
import '../data/location_lookup.dart';
import '../config/theme.dart';

/// Screen for editing user profile - shows a review page with edit options
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  // Current editing mode
  String? _editingField;

  // Temporary edit values
  late String? _firstName;
  late String? _city;
  late String? _zipCode;
  late String? _county;
  late int? _birthYear;
  late bool? _isMilitaryOrVeteran;
  late List<String> _qualifications;

  // Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  List<String> _citySuggestions = [];

  @override
  void initState() {
    super.initState();
    _loadCurrentValues();
  }

  void _loadCurrentValues() {
    final userPrefs = context.read<UserPrefsProvider>();
    _firstName = userPrefs.firstName;
    _city = userPrefs.city;
    _zipCode = userPrefs.zipCode;
    _county = userPrefs.selectedCounty;
    _birthYear = userPrefs.birthYear;
    _isMilitaryOrVeteran = userPrefs.isMilitaryOrVeteran;
    _qualifications = List.from(userPrefs.qualifications);
    _nameController.text = _firstName ?? '';
    // Show zip code if available, otherwise city
    _locationController.text = _zipCode ?? _city ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  String _getCountyDisplayName(String? countyId) {
    if (countyId == null) return 'Not set';
    // Remove " County" suffix if present for display
    if (countyId.endsWith(' County')) {
      return countyId;
    }
    return countyId;
  }

  String _getLocationDisplay() {
    // Show most specific info: city + zip if both available
    if (_city != null && _zipCode != null) {
      return '$_city, $_zipCode';
    }
    if (_zipCode != null) {
      return _zipCode!;
    }
    if (_city != null) {
      return _city!;
    }
    if (_county != null) {
      return _getCountyDisplayName(_county);
    }
    return 'Not set';
  }

  String _getQualificationsDisplay() {
    final labels = <String>[];
    // Include military status
    if (_isMilitaryOrVeteran == true) labels.add('Veteran/Military');

    for (final qual in _qualifications) {
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
    return labels.isEmpty ? 'None selected' : labels.join(', ');
  }

  // Sensitive categories that may warrant extra data protection
  static const _sensitiveCategories = {'lgbtq', 'immigrant', 'disability'};

  bool _hasSensitiveCategories() {
    return _qualifications.any((q) => _sensitiveCategories.contains(q));
  }

  Future<void> _saveProfile() async {
    final userPrefs = context.read<UserPrefsProvider>();
    final safetyProvider = context.read<SafetyProvider>();

    // Check if user added new sensitive categories and encryption isn't enabled
    final hadSensitive = userPrefs.qualifications.any((q) => _sensitiveCategories.contains(q));
    final hasSensitiveNow = _hasSensitiveCategories();

    if (!hadSensitive && hasSensitiveNow && !safetyProvider.encryptionEnabled) {
      final shouldEnable = await _showSensitiveDataProtectionDialog();
      if (shouldEnable == true) {
        HapticFeedback.mediumImpact();
        await safetyProvider.enableEncryption();
      }
    }

    await userPrefs.savePreferences(
      firstName: _firstName,
      city: _city,
      zipCode: _zipCode,
      county: _county,
      birthYear: _birthYear,
      isMilitaryOrVeteran: _isMilitaryOrVeteran,
      qualifications: _qualifications,
    );

    if (mounted) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profile updated'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<bool?> _showSensitiveDataProtectionDialog() async {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.shield_outlined, color: AppColors.primary, size: 24),
            const SizedBox(width: 12),
            const Expanded(child: Text('Protect Your Information')),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "You've added categories that may be sensitive. We recommend enabling extra data protection.",
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.lock, size: 16, color: AppColors.primary),
                      const SizedBox(width: 8),
                      const Text('Data Encryption', style: TextStyle(fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Encrypts all your saved preferences on this device',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'You can always change this later in Safety Settings.',
              style: TextStyle(
                fontSize: 12,
                fontStyle: FontStyle.italic,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Skip'),
          ),
          FilledButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.shield, size: 18),
            label: const Text('Enable Protection'),
          ),
        ],
      ),
    );
  }

  void _cancel() {
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: _cancel,
        ),
        actions: [
          TextButton(
            onPressed: _saveProfile,
            child: const Text('Save'),
          ),
        ],
      ),
      body: _editingField != null
          ? _buildEditView(isDark)
          : _buildReviewView(isDark),
    );
  }

  Widget _buildReviewView(bool isDark) {
    final theme = Theme.of(context);

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                _firstName != null ? 'Looking good, $_firstName!' : 'Your Profile',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Tap any item to edit it.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 24),
              _buildReviewItem(
                'Name',
                _firstName ?? 'Not provided',
                Icons.person,
                'name',
                isDark,
              ),
              _buildReviewItem(
                'Location',
                _getLocationDisplay(),
                Icons.location_on,
                'location',
                isDark,
              ),
              _buildReviewItem(
                'Birth Year',
                _birthYear?.toString() ?? 'Not provided',
                Icons.cake,
                'birthYear',
                isDark,
              ),
              _buildReviewItem(
                'About You',
                _getQualificationsDisplay(),
                Icons.checklist,
                'qualifications',
                isDark,
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saveProfile,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Save Changes'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: _cancel,
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const Text('Cancel'),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewItem(String label, String value, IconData icon, String fieldKey, bool isDark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(label, style: const TextStyle(fontSize: 13)),
        subtitle: Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.w500),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: IconButton(
          icon: const Icon(Icons.edit, size: 18),
          onPressed: () => setState(() => _editingField = fieldKey),
        ),
        onTap: () => setState(() => _editingField = fieldKey),
      ),
    );
  }

  Widget _buildEditView(bool isDark) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: _buildFieldEditor(isDark),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => setState(() => _editingField = null),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Done'),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFieldEditor(bool isDark) {
    final theme = Theme.of(context);

    switch (_editingField) {
      case 'name':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('What should we call you?', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Optional • Stays on your device',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Enter your name',
                filled: true,
                fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
              textCapitalization: TextCapitalization.words,
              onChanged: (value) {
                _firstName = value.trim().isEmpty ? null : value.trim();
              },
            ),
          ],
        );

      case 'location':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Where do you live?', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Enter your city name or ZIP code',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _locationController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'City or ZIP code',
                filled: true,
                fillColor: isDark ? Colors.grey[900] : Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                prefixIcon: const Icon(Icons.search),
              ),
              onChanged: (value) {
                final query = value.trim();

                // Check if it's a complete ZIP code
                if (LocationLookup.isZipCodeFormat(query)) {
                  final city = LocationLookup.zipToCity[query];
                  final county = LocationLookup.lookupCounty(query);
                  setState(() {
                    _zipCode = query;
                    _city = city;
                    _county = county;
                    _citySuggestions = [];
                  });
                } else if (query.length >= 2 && !RegExp(r'^\d+$').hasMatch(query)) {
                  // City name search (not a partial zip)
                  final suggestions = LocationLookup.getSuggestions(query);
                  setState(() {
                    _citySuggestions = suggestions.take(5).toList();
                    // Clear zip if typing a city name
                    if (suggestions.isNotEmpty) {
                      _zipCode = null;
                    }
                  });
                } else {
                  setState(() {
                    _citySuggestions = [];
                    // If typing numbers but not complete zip, clear location
                    if (RegExp(r'^\d+$').hasMatch(query) && query.length < 5) {
                      _city = null;
                      _county = null;
                      _zipCode = null;
                    }
                  });
                }
              },
            ),
            if (_citySuggestions.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 8),
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[850] : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  children: _citySuggestions.map((city) {
                    final county = LocationLookup.lookupCounty(city);
                    return ListTile(
                      title: Text(city),
                      subtitle: county != null ? Text(county) : null,
                      onTap: () {
                        _locationController.text = city;
                        setState(() {
                          _city = city;
                          _county = county;
                          _zipCode = null; // Clear zip when selecting city
                          _citySuggestions = [];
                        });
                      },
                      dense: true,
                    );
                  }).toList(),
                ),
              ),
            // Show location confirmation
            if (_county != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.check_circle, color: AppColors.primary, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _city != null ? '$_city, $_county' : _county!,
                            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    if (_zipCode != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'ZIP: $_zipCode',
                        style: TextStyle(
                          color: AppColors.primary.withValues(alpha: 0.8),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
            // Show hint if location not found
            if (_locationController.text.length >= 5 && _county == null && LocationLookup.isZipCodeFormat(_locationController.text)) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.orange, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'ZIP code not found in Bay Area. Try entering your city name instead.',
                        style: TextStyle(color: Colors.orange[800], fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        );

      case 'birthYear':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('What year were you born?', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Used to find age-specific programs',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 300,
              child: ListView.builder(
                itemCount: 100,
                itemBuilder: (context, index) {
                  final year = DateTime.now().year - index;
                  final isSelected = year == _birthYear;
                  return ListTile(
                    title: Text(
                      year.toString(),
                      style: TextStyle(
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppColors.primary : null,
                      ),
                    ),
                    selected: isSelected,
                    onTap: () {
                      setState(() => _birthYear = year);
                    },
                    trailing: isSelected ? Icon(Icons.check, color: AppColors.primary) : null,
                  );
                },
              ),
            ),
          ],
        );

      case 'qualifications':
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('About You', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Select all that apply',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
            const SizedBox(height: 16),
            ..._buildQualificationTiles(isDark),
          ],
        );

      default:
        return const SizedBox.shrink();
    }
  }

  List<Widget> _buildQualificationTiles(bool isDark) {
    // All qualifications including military (which is stored separately)
    final qualifications = [
      ('military', 'Veteran or Military', Icons.military_tech),
      ('lgbtq', 'LGBTQ+', Icons.diversity_3),
      ('immigrant', 'Immigrant', Icons.public),
      ('first-responder', 'First Responder', Icons.local_fire_department),
      ('educator', 'Teacher or Educator', Icons.cast_for_education),
      ('unemployed', 'Unemployed or job seeking', Icons.work_off_outlined),
      ('public-assistance', 'Receiving public assistance', Icons.account_balance_outlined),
      ('student', 'Currently a student', Icons.school_outlined),
      ('disability', 'Have a disability', Icons.accessible_outlined),
      ('caregiver', 'Caregiver for family member', Icons.volunteer_activism_outlined),
    ];

    return qualifications.map((q) {
      // Military is stored separately from other qualifications
      final isSelected = q.$1 == 'military'
          ? _isMilitaryOrVeteran == true
          : _qualifications.contains(q.$1);

      return Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: InkWell(
          onTap: () {
            setState(() {
              if (q.$1 == 'military') {
                _isMilitaryOrVeteran = _isMilitaryOrVeteran == true ? false : true;
              } else if (isSelected) {
                _qualifications.remove(q.$1);
              } else {
                _qualifications.add(q.$1);
              }
            });
          },
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.1)
                  : (isDark ? Colors.grey[900] : Colors.grey[100]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected
                    ? AppColors.primary
                    : (isDark ? Colors.grey[800]! : Colors.grey[300]!),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  q.$3,
                  color: isSelected ? AppColors.primary : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    q.$2,
                    style: TextStyle(
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? AppColors.darkText : AppColors.lightText),
                      fontWeight: isSelected ? FontWeight.w500 : FontWeight.normal,
                    ),
                  ),
                ),
                if (isSelected)
                  Icon(Icons.check_circle, color: AppColors.primary, size: 20),
              ],
            ),
          ),
        ),
      );
    }).toList();
  }
}
