import 'dart:io';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../config/theme.dart';
import '../models/civic_data.dart';
import '../models/program.dart';
import '../providers/programs_provider.dart';
import '../providers/user_prefs_provider.dart';
import '../services/civic_service.dart';
import '../widgets/program_card.dart';
import 'program_detail_screen.dart';
import 'edit_profile_screen.dart';
import 'directory_screen.dart';

class ForYouScreen extends StatefulWidget {
  const ForYouScreen({super.key});

  @override
  State<ForYouScreen> createState() => _ForYouScreenState();
}

class _ForYouScreenState extends State<ForYouScreen> {
  final CivicService _civicService = CivicService();
  RepresentativeList? _representatives;
  CityGuide? _cityGuide;
  List<CityNews>? _news;
  bool _loadingCivicData = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _loadCivicData();
  }

  Future<void> _loadCivicData() async {
    final userPrefs = context.read<UserPrefsProvider>();
    final city = userPrefs.city;
    final county = userPrefs.selectedCounty;
    final zipCode = userPrefs.zipCode;

    if (city == null && county == null) return;
    if (_loadingCivicData) return;

    setState(() => _loadingCivicData = true);

    try {
      // Load city guide
      if (city != null) {
        _cityGuide = _civicService.getCityGuide(city);
      }

      // Load representatives (uses zip code to narrow down if available)
      _representatives = await _civicService.getRepresentatives(city, county, zipCode: zipCode);

      // Load news if city has a guide
      if (_cityGuide?.newsRssUrl != null) {
        _news = await _civicService.getCityNews(city!);
      }
    } catch (e) {
      // Silently fail - civic data is optional
    }

    if (mounted) {
      setState(() => _loadingCivicData = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && (Platform.isMacOS || Platform.isWindows || Platform.isLinux);
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    return Scaffold(
      body: SafeArea(
        top: !useDesktopLayout,
        child: Consumer2<ProgramsProvider, UserPrefsProvider>(
          builder: (context, programsProvider, userPrefsProvider, child) {
            if (programsProvider.isLoading && programsProvider.programs.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (programsProvider.error != null && programsProvider.programs.isEmpty) {
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
                      programsProvider.error!,
                      style: theme.textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => programsProvider.loadData(forceRefresh: true),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              );
            }

            // Get personalized programs based on user preferences, excluding saved
            final personalizedPrograms = _getPersonalizedPrograms(
              programsProvider,
              userPrefsProvider,
              excludeSaved: true,
            );

            // Get recommended programs (top 5 picks)
            final recommendedPrograms = personalizedPrograms.take(5).toList();

            // Get user's display name
            final firstName = userPrefsProvider.firstName;
            final displayName = (firstName != null && firstName.isNotEmpty) ? firstName : 'You';

            return RefreshIndicator(
              onRefresh: () async {
                await programsProvider.loadData(forceRefresh: true);
                await _loadCivicData();
              },
              child: CustomScrollView(
                slivers: [
                  // Header with personalized greeting
                  if (!useDesktopLayout)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.asset(
                                'assets/images/favicons/web-app-manifest-512x512.png',
                                width: 48,
                                height: 48,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'For $displayName',
                                    style: theme.textTheme.titleLarge,
                                  ),
                                  Text(
                                    'Personalized recommendations',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // User preferences summary
                  if (userPrefsProvider.hasPreferences)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: _buildPreferencesSummary(
                          context,
                          userPrefsProvider,
                          programsProvider,
                          isDark,
                        ),
                      ),
                    ),

                  // No preferences message
                  if (!userPrefsProvider.hasPreferences)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.darkCard : AppColors.lightCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                Icons.person_add_outlined,
                                size: 48,
                                color: AppColors.primary,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Set up your profile',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Tell us about yourself to see personalized recommendations.',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 16),
                              FilledButton.icon(
                                onPressed: () {
                                  userPrefsProvider.reopenOnboarding();
                                },
                                icon: const Icon(Icons.edit),
                                label: const Text('Set up profile'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // Top Picks section (if has preferences)
                  if (userPrefsProvider.hasPreferences && recommendedPrograms.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: Row(
                          children: [
                            Icon(Icons.star, color: AppColors.accent, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Top Picks for $displayName',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 340,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: recommendedPrograms.length + 1, // +1 for "View all" card
                          itemBuilder: (context, index) {
                            // Last item is "View all matches" button
                            if (index == recommendedPrograms.length) {
                              return Container(
                                width: 160,
                                margin: const EdgeInsets.only(right: 0),
                                child: Card(
                                  child: InkWell(
                                    onTap: () => _navigateToAllMatches(context),
                                    borderRadius: BorderRadius.circular(12),
                                    child: Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary.withValues(alpha: 0.1),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Icon(
                                              Icons.arrow_forward,
                                              color: AppColors.primary,
                                              size: 32,
                                            ),
                                          ),
                                          const SizedBox(height: 16),
                                          Text(
                                            'View all\nmatches',
                                            textAlign: TextAlign.center,
                                            style: theme.textTheme.titleSmall?.copyWith(
                                              color: AppColors.primary,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${personalizedPrograms.length} programs',
                                            style: theme.textTheme.bodySmall?.copyWith(
                                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }

                            final program = recommendedPrograms[index];
                            return Container(
                              width: 300,
                              margin: EdgeInsets.only(right: index < recommendedPrograms.length ? 16 : 0),
                              child: ProgramCard(
                                program: program,
                                isFavorite: programsProvider.isFavorite(program.id),
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) => ProgramDetailScreen(program: program),
                                    ),
                                  );
                                },
                                onFavoriteToggle: () {
                                  programsProvider.toggleFavorite(program.id);
                                },
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],

                  // City Guide section (if city has data)
                  if (userPrefsProvider.hasPreferences && _cityGuide != null) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: Row(
                          children: [
                            Icon(Icons.location_city, color: AppColors.info, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              '${_cityGuide!.cityName} City Guide',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 130,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _cityGuide!.agencies.length,
                          itemBuilder: (context, index) {
                            final agency = _cityGuide!.agencies[index];
                            return _buildAgencyCard(context, agency, isDark);
                          },
                        ),
                      ),
                    ),
                  ],

                  // Representatives section
                  if (userPrefsProvider.hasPreferences &&
                      _representatives != null &&
                      !_representatives!.isEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                        child: Row(
                          children: [
                            Icon(Icons.how_to_vote, color: AppColors.success, size: 20),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Your Representatives',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Info text about finding your specific rep
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Representatives for your area. Not sure who\'s yours?',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () => _openFindMyRep(),
                              icon: const Icon(Icons.open_in_new, size: 14),
                              label: const Text('Find My Rep'),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: SizedBox(
                        height: 200,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _representatives!.all.length,
                          itemBuilder: (context, index) {
                            final rep = _representatives!.all[index];
                            return _buildRepresentativeCard(context, rep, isDark);
                          },
                        ),
                      ),
                    ),
                  ],

                  // News feed section (if available)
                  if (userPrefsProvider.hasPreferences &&
                      _news != null &&
                      _news!.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
                        child: Row(
                          children: [
                            Icon(Icons.newspaper, color: AppColors.warning, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              'Local News',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final newsItem = _news![index];
                          return _buildNewsCard(context, newsItem, isDark);
                        },
                        childCount: _news!.length.clamp(0, 5), // Show max 5 news items
                      ),
                    ),
                  ],

                  // Bottom padding
                  SliverToBoxAdapter(
                    child: SizedBox(height: 16 + MediaQuery.of(context).padding.bottom),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildPreferencesSummary(
    BuildContext context,
    UserPrefsProvider userPrefsProvider,
    ProgramsProvider programsProvider,
    bool isDark,
  ) {
    final theme = Theme.of(context);
    final firstName = userPrefsProvider.firstName;
    final city = userPrefsProvider.city;

    // Build the description - just name and city (no categories shown to user)
    final hasName = firstName != null && firstName.isNotEmpty;
    // Don't show "Detected via GPS" as the city display
    final hasCity = city != null && city.isNotEmpty && city != 'Detected via GPS';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.person, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  const TextSpan(text: 'Showing programs for '),
                  // Show name if available
                  if (hasName)
                    TextSpan(
                      text: firstName,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  // Show city location
                  if (hasName && hasCity)
                    const TextSpan(text: ' in '),
                  if (hasCity)
                    TextSpan(
                      text: city,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  // Fallback if nothing is set
                  if (!hasName && !hasCity)
                    const TextSpan(text: 'you'),
                ],
              ),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark ? AppColors.darkText : AppColors.lightText,
              ),
            ),
          ),
          IconButton(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (context) => const EditProfileScreen()),
              );
            },
            icon: const Icon(Icons.edit, size: 18),
            tooltip: 'Edit preferences',
            style: IconButton.styleFrom(
              foregroundColor: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAgencyCard(BuildContext context, CityAgency agency, bool isDark) {
    final theme = Theme.of(context);

    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 12),
      child: Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => _openAgency(agency),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: agency.color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        agency.icon,
                        color: agency.color,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        agency.name,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: Text(
                    agency.description,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (agency.phone != null)
                  Row(
                    children: [
                      Icon(
                        Icons.phone,
                        size: 12,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        agency.phone!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRepresentativeCard(BuildContext context, Representative rep, bool isDark) {
    final theme = Theme.of(context);

    // Determine level color
    Color levelColor;
    String levelLabel;
    switch (rep.level) {
      case 'federal':
        levelColor = const Color(0xFF1565C0);
        levelLabel = 'Federal';
        break;
      case 'state':
        levelColor = const Color(0xFF7B1FA2);
        levelLabel = 'State';
        break;
      default:
        levelColor = const Color(0xFF388E3C);
        levelLabel = 'Local';
    }

    // Extract district number for display
    String? districtDisplay;
    if (rep.district != null) {
      // For US House and State reps, extract the district number
      final districtMatch = RegExp(r'District (\d+)').firstMatch(rep.district!);
      if (districtMatch != null) {
        districtDisplay = 'D-${districtMatch.group(1)}';
      }
    }

    return Container(
      width: 180,
      margin: const EdgeInsets.only(right: 12),
      child: Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => _openRepresentative(rep),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                // Photo
                CircleAvatar(
                  radius: 32,
                  backgroundColor: levelColor.withValues(alpha: 0.1),
                  backgroundImage: rep.photoUrl != null
                      ? _getImageProvider(rep.photoUrl!)
                      : null,
                  child: rep.photoUrl == null
                      ? Icon(Icons.person, size: 32, color: levelColor)
                      : null,
                ),
                const SizedBox(height: 8),
                // Name
                Text(
                  rep.name,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                // Title with district
                Text(
                  rep.title,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                // Level badge and district badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: levelColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        levelLabel,
                        style: TextStyle(
                          color: levelColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (districtDisplay != null) ...[
                      const SizedBox(width: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: (isDark ? Colors.white : Colors.black).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          districtDisplay,
                          style: TextStyle(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNewsCard(BuildContext context, CityNews news, bool isDark) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => _openNews(news),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (news.imageUrl != null) ...[
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: news.imageUrl!,
                      width: 80,
                      height: 60,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        width: 80,
                        height: 60,
                        color: isDark ? AppColors.darkCard : AppColors.lightBorder,
                      ),
                      errorWidget: (context, url, error) => Container(
                        width: 80,
                        height: 60,
                        color: isDark ? AppColors.darkCard : AppColors.lightBorder,
                        child: const Icon(Icons.image, size: 24),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        news.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        news.summary,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Text(
                            news.source,
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.primary,
                              fontSize: 10,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _formatDate(news.publishedAt),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return 'Today';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      return '${diff.inDays} days ago';
    } else {
      return '${date.month}/${date.day}/${date.year}';
    }
  }

  void _navigateToAllMatches(BuildContext context) {
    // Navigate to Directory screen with filters applied
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const DirectoryScreen(),
      ),
    );
  }

  Future<void> _openAgency(CityAgency agency) async {
    if (agency.website != null) {
      final uri = Uri.parse(agency.website!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
  }

  Future<void> _openFindMyRep() async {
    final uri = Uri.parse('https://baynavigator.org/findmyrep');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _openRepresentative(Representative rep) async {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final theme = Theme.of(context);

    // Determine level color
    Color levelColor;
    String levelLabel;
    switch (rep.level) {
      case 'federal':
        levelColor = const Color(0xFF1565C0);
        levelLabel = 'Federal';
        break;
      case 'state':
        levelColor = const Color(0xFF7B1FA2);
        levelLabel = 'State';
        break;
      default:
        levelColor = const Color(0xFF388E3C);
        levelLabel = 'Local';
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : AppColors.lightCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: isDark ? Colors.white24 : Colors.black12,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Photo
            CircleAvatar(
              radius: 50,
              backgroundColor: levelColor.withValues(alpha: 0.1),
              backgroundImage: rep.photoUrl != null
                  ? _getImageProvider(rep.photoUrl!)
                  : null,
              child: rep.photoUrl == null
                  ? Icon(Icons.person, size: 50, color: levelColor)
                  : null,
            ),
            const SizedBox(height: 16),
            // Name
            Text(
              rep.name,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 4),
            // Title
            Text(
              rep.title,
              style: theme.textTheme.titleMedium?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            // Level badge and district
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: levelColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    levelLabel,
                    style: TextStyle(
                      color: levelColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                if (rep.district != null) ...[
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      rep.district!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
            if (rep.party != null) ...[
              const SizedBox(height: 8),
              Text(
                rep.party!,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
            ],
            const SizedBox(height: 24),
            // Contact buttons
            Wrap(
              spacing: 12,
              runSpacing: 12,
              alignment: WrapAlignment.center,
              children: [
                if (rep.website != null)
                  _buildContactButton(
                    icon: Icons.language,
                    label: 'Website',
                    color: AppColors.primary,
                    onTap: () async {
                      Navigator.pop(context);
                      final uri = Uri.parse(rep.website!);
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(uri, mode: LaunchMode.externalApplication);
                      }
                    },
                  ),
                if (rep.email != null)
                  _buildContactButton(
                    icon: Icons.email,
                    label: 'Email',
                    color: const Color(0xFFE65100),
                    onTap: () async {
                      Navigator.pop(context);
                      final uri = Uri.parse('mailto:${rep.email}');
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(uri);
                      }
                    },
                  ),
                if (rep.phone != null)
                  _buildContactButton(
                    icon: Icons.phone,
                    label: 'Call',
                    color: const Color(0xFF2E7D32),
                    onTap: () async {
                      Navigator.pop(context);
                      final uri = Uri.parse('tel:${rep.phone}');
                      if (await canLaunchUrl(uri)) {
                        await launchUrl(uri);
                      }
                    },
                  ),
              ],
            ),
            const SizedBox(height: 16),
            // Bio if available
            if (rep.bio != null) ...[
              Text(
                rep.bio!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
            ],
            // Safe area padding for bottom
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }

  Widget _buildContactButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openNews(CityNews news) async {
    final uri = Uri.parse(news.url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  /// Returns an ImageProvider for the given URL, supporting both asset paths and network URLs
  ImageProvider _getImageProvider(String url) {
    if (url.startsWith('assets/')) {
      return AssetImage(url);
    } else {
      return CachedNetworkImageProvider(url);
    }
  }

  List<Program> _getPersonalizedPrograms(
    ProgramsProvider programsProvider,
    UserPrefsProvider userPrefsProvider, {
    bool excludeSaved = false,
  }) {
    final groups = userPrefsProvider.selectedGroups;
    final countyId = userPrefsProvider.selectedCounty;

    var programs = programsProvider.programs;

    // Exclude saved programs if requested
    if (excludeSaved) {
      programs = programs.where((p) => !programsProvider.isFavorite(p.id)).toList();
    }

    // Filter by county first (broader filter)
    String? countyName;
    if (countyId != null) {
      final county = programsProvider.areas.where((a) => a.id == countyId).firstOrNull;
      if (county != null) {
        countyName = county.name;
        // Include programs in the county OR programs that are statewide/nationwide/Bay Area
        programs = programs.where((p) {
          return p.areas.contains(county.name) ||
                 p.areas.contains('Bay Area') ||
                 p.areas.contains('Statewide') ||
                 p.areas.contains('Nationwide');
        }).toList();
      }
    }

    // Filter by groups if any selected - show programs that match ANY group
    if (groups.isNotEmpty) {
      programs = programs.where((p) => groups.any((g) => p.groups.contains(g))).toList();
    }

    // Score and sort programs based on how many user criteria they match
    programs.sort((a, b) {
      // Calculate match scores
      int scoreA = _calculateMatchScore(a, groups, countyName);
      int scoreB = _calculateMatchScore(b, groups, countyName);

      // Higher score first, then by last updated
      if (scoreA != scoreB) {
        return scoreB.compareTo(scoreA);
      }
      return b.lastUpdated.compareTo(a.lastUpdated);
    });

    return programs;
  }

  /// Calculate how well a program matches the user's criteria
  int _calculateMatchScore(Program program, List<String> userGroups, String? countyName) {
    int score = 0;

    // +2 for each matching group
    for (final group in userGroups) {
      if (program.groups.contains(group)) {
        score += 2;
      }
    }

    // +3 for exact county match, +1 for Bay Area, 0 for Statewide/Nationwide
    if (countyName != null && program.areas.contains(countyName)) {
      score += 3;
    } else if (program.areas.contains('Bay Area')) {
      score += 1;
    }

    return score;
  }
}
