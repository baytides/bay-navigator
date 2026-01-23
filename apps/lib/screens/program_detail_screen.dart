import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../models/program.dart';
import '../providers/programs_provider.dart';
import '../providers/settings_provider.dart';
import '../services/privacy_service.dart';
import '../config/theme.dart';
import '../utils/category_icons.dart';
import '../widgets/depth_effects.dart';

class ProgramDetailScreen extends StatelessWidget {
  final Program program;

  const ProgramDetailScreen({
    super.key,
    required this.program,
  });

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchPhone(BuildContext context, String phone) async {
    final settings = context.read<SettingsProvider>();
    final result = await settings.makeCall(phone);

    if (!context.mounted) return;

    // Show feedback to user
    if (result.method == CallMethod.clipboard) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message ?? 'Phone number copied to clipboard'),
          duration: const Duration(seconds: 4),
          action: SnackBarAction(
            label: 'OK',
            onPressed: () {},
          ),
        ),
      );
    } else if (result.message != null) {
      // Show fallback message if preferred app wasn't available
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message!)),
      );
    }
  }

  Future<void> _launchEmail(String email) async {
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchMaps(String address) async {
    final encoded = Uri.encodeComponent(address);
    // Use DuckDuckGo Maps (powered by Apple Maps) for privacy
    final uri = Uri.parse('https://duckduckgo.com/?q=$encoded&iaxm=maps');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  void _shareProgram(BuildContext context, {Rect? sharePositionOrigin}) {
    final text = '''
${program.name}

${program.displayDescription}

Learn more: ${program.website}

Shared from Bay Navigator
''';
    // sharePositionOrigin is required on iPad to position the share popover
    SharePlus.instance.share(ShareParams(
      text: text,
      subject: program.name,
      sharePositionOrigin: sharePositionOrigin,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final catColor = CategoryIcons.getCategoryColor(program.category);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar with gradient header
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: catColor,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      catColor,
                      catColor.withValues(alpha: 0.7),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.only(top: 40),
                      child: Icon(
                        CategoryIcons.getIcon(program.category),
                        size: 56,
                        color: Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              Consumer<ProgramsProvider>(
                builder: (context, provider, child) {
                  final isFavorite = provider.isFavorite(program.id);
                  return IconButton(
                    icon: Icon(
                      isFavorite ? Icons.bookmark : Icons.bookmark_border,
                      color: Colors.white,
                    ),
                    tooltip: isFavorite ? 'Remove from saved' : 'Save program',
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      provider.toggleFavorite(program.id);
                    },
                  );
                },
              ),
              Builder(
                builder: (buttonContext) {
                  return IconButton(
                    icon: const Icon(Icons.share, color: Colors.white),
                    tooltip: 'Share program',
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      // Get button position for iPad share popover
                      final box = buttonContext.findRenderObject() as RenderBox?;
                      final sharePosition = box != null
                          ? box.localToGlobal(Offset.zero) & box.size
                          : null;
                      _shareProgram(context, sharePositionOrigin: sharePosition);
                    },
                  );
                },
              ),
            ],
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: catColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      CategoryIcons.formatName(program.category).toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                        color: catColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    program.name,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkText : AppColors.lightText,
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Location
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 16,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        program.locationText,
                        style: TextStyle(
                          fontSize: 14,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Description
                  Text(
                    program.displayDescription,
                    style: TextStyle(
                      fontSize: 15,
                      height: 1.6,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // What They Offer section
                  if (program.offerItems.isNotEmpty)
                    _buildSection(
                      context,
                      'What They Offer',
                      Icons.card_giftcard_outlined,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: program.offerItems
                            .map((item) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        margin: const EdgeInsets.only(top: 6),
                                        width: 6,
                                        height: 6,
                                        decoration: BoxDecoration(
                                          color: AppColors.primary,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          item,
                                          style: TextStyle(
                                            fontSize: 14,
                                            height: 1.5,
                                            color: isDark ? AppColors.darkText : AppColors.lightText,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                    ),

                  // How to Get It section
                  if (program.howToSteps.isNotEmpty)
                    _buildSection(
                      context,
                      'How to Get It',
                      Icons.checklist_outlined,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: program.howToSteps
                            .asMap()
                            .entries
                            .map((entry) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          color: AppColors.primary.withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '${entry.key + 1}',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Text(
                                          entry.value,
                                          style: TextStyle(
                                            fontSize: 14,
                                            height: 1.5,
                                            color: isDark ? AppColors.darkText : AppColors.lightText,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ))
                            .toList(),
                      ),
                    ),

                  // Eligibility section
                  if (program.eligibility.isNotEmpty)
                    _buildSection(
                      context,
                      "Who's Eligible",
                      Icons.people_outline,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: program.eligibility
                            .map((e) => _buildEligibilityTag(context, e))
                            .toList(),
                      ),
                    ),

                  // Contact section
                  if (program.phone != null || program.email != null || program.address != null || program.website.isNotEmpty)
                    _buildSection(
                      context,
                      'Contact',
                      Icons.contact_phone_outlined,
                      child: Column(
                        children: [
                          if (program.phone != null && program.phone!.isNotEmpty)
                            _buildContactRow(
                              context,
                              Icons.phone_outlined,
                              program.phone!,
                              () => _launchPhone(context, program.phone!),
                            ),
                          if (program.email != null && program.email!.isNotEmpty)
                            _buildContactRow(
                              context,
                              Icons.email_outlined,
                              program.email!,
                              () => _launchEmail(program.email!),
                            ),
                          if (program.address != null && program.address!.isNotEmpty)
                            _buildContactRow(
                              context,
                              Icons.location_on_outlined,
                              program.address!,
                              () => _launchMaps(program.address!),
                            ),
                          if (program.website.isNotEmpty)
                            _buildContactRow(
                              context,
                              Icons.language_outlined,
                              Uri.tryParse(program.website)?.host.replaceFirst('www.', '') ?? program.website,
                              () => _launchUrl(program.website),
                            ),
                        ],
                      ),
                    ),

                  // Service Areas
                  if (program.areas.isNotEmpty)
                    _buildSection(
                      context,
                      'Service Areas',
                      Icons.map_outlined,
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: program.areas
                            .map((a) => _buildTag(context, a))
                            .toList(),
                      ),
                    ),

                  // Cost
                  if (program.cost != null && program.cost!.isNotEmpty)
                    _buildSection(
                      context,
                      'Cost',
                      Icons.payments_outlined,
                      content: program.cost,
                    ),

                  // Requirements (legacy field)
                  if (program.requirements != null && program.requirements!.isNotEmpty)
                    _buildSection(
                      context,
                      'Requirements',
                      Icons.assignment_outlined,
                      content: program.requirements,
                    ),

                  // How to Apply (legacy field)
                  if (program.howToApply != null && program.howToApply!.isNotEmpty)
                    _buildSection(
                      context,
                      'How to Apply',
                      Icons.how_to_reg_outlined,
                      content: program.howToApply,
                    ),

                  // Meta info
                  Padding(
                    padding: const EdgeInsets.only(top: 24, bottom: 8),
                    child: Row(
                      children: [
                        Icon(
                          Icons.update,
                          size: 14,
                          color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Last updated ${_formatDate(program.lastUpdated)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Action buttons
                  _buildActionButtons(context),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(
    BuildContext context,
    String title,
    IconData icon, {
    String? content,
    Widget? child,
  }) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: FloatingPanel(
        depth: 16,
        padding: const EdgeInsets.all(20),
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    icon,
                    size: 18,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  title.toUpperCase(),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (content != null)
              Text(
                content,
                style: TextStyle(
                  fontSize: 14,
                  height: 1.5,
                  color: isDark ? AppColors.darkText : AppColors.lightText,
                ),
              ),
            if (child != null) child,
          ],
        ),
      ),
    );
  }

  Widget _buildEligibilityTag(BuildContext context, String text) {
    // Format eligibility text
    final formatted = _formatEligibility(text);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        formatted,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.primary,
        ),
      ),
    );
  }

  Widget _buildTag(BuildContext context, String text) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkNeutral50 : AppColors.lightNeutral200,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
        ),
      ),
    );
  }

  Widget _buildContactRow(
    BuildContext context,
    IconData icon,
    String text,
    VoidCallback onTap,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return InkWell(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkNeutral50 : AppColors.lightNeutral100,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(icon, size: 20, color: AppColors.primary),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 14,
                  color: isDark ? AppColors.darkText : AppColors.lightText,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(
              Icons.chevron_right,
              size: 20,
              color: isDark ? AppColors.darkTextMuted : AppColors.lightTextMuted,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      children: [
        // Primary action - Call if phone available
        if (program.phone != null && program.phone!.isNotEmpty)
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _launchPhone(context, program.phone!),
              icon: const Icon(Icons.phone),
              label: const Text('Call Now'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        if (program.phone != null && program.phone!.isNotEmpty)
          const SizedBox(height: 12),

        // Secondary actions row
        Row(
          children: [
            // Get Directions button (if address available)
            if (program.address != null && program.address!.isNotEmpty)
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _launchMaps(program.address!),
                  icon: const Icon(Icons.directions),
                  label: const Text('Directions'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: isDark ? AppColors.darkText : AppColors.lightText,
                    side: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            if (program.address != null && program.address!.isNotEmpty)
              const SizedBox(width: 12),

            // Visit Website button
            if (program.website.isNotEmpty)
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _launchUrl(program.website),
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: const Text('Website'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  String _formatEligibility(String elig) {
    const map = {
      'low-income': 'Income-Eligible',
      'seniors': 'Seniors',
      'youth': 'Youth',
      'college-students': 'Students',
      'veterans': 'Veterans',
      'families': 'Families',
      'disability': 'Disability',
      'lgbtq': 'LGBT+',
      'first-responders': 'First Responders',
      'teachers': 'Teachers',
      'unemployed': 'Job Seekers',
      'immigrants': 'Immigrants',
      'unhoused': 'Unhoused',
      'pregnant': 'Pregnant Women',
      'caregivers': 'Caregivers',
      'foster-youth': 'Foster Youth',
      'reentry': 'Formerly Incarcerated',
      'nonprofits': 'Nonprofits',
      'everyone': 'Everyone',
    };
    return map[elig.toLowerCase()] ?? elig;
  }

  String _formatDate(String isoDate) {
    try {
      final date = DateTime.parse(isoDate);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}, ${date.year}';
    } catch (e) {
      return isoDate;
    }
  }
}
