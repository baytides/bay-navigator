import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/platform_service.dart';
import 'guide_viewer_screen.dart';

/// Eligibility guide item
class EligibilityGuide {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final String url;
  final Color color;

  const EligibilityGuide({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    required this.url,
    required this.color,
  });
}

/// Eligibility guides screen
class EligibilityScreen extends StatelessWidget {
  const EligibilityScreen({super.key});

  static const List<EligibilityGuide> _guides = [
    EligibilityGuide(
      id: 'food',
      title: 'Food Assistance',
      description: 'CalFresh (SNAP), WIC, food banks, and meal programs',
      icon: Icons.restaurant,
      url: 'https://baynavigator.org/eligibility/food-assistance',
      color: Color(0xFFFF9800),
    ),
    EligibilityGuide(
      id: 'healthcare',
      title: 'Healthcare',
      description: 'Medi-Cal, Medicare, Covered California, and free clinics',
      icon: Icons.local_hospital,
      url: 'https://baynavigator.org/eligibility/healthcare',
      color: Color(0xFFE91E63),
    ),
    EligibilityGuide(
      id: 'housing',
      title: 'Housing Assistance',
      description: 'Section 8, rental assistance, and homeless services',
      icon: Icons.home,
      url: 'https://baynavigator.org/eligibility/housing-assistance',
      color: Color(0xFF2196F3),
    ),
    EligibilityGuide(
      id: 'utilities',
      title: 'Utility Programs',
      description: 'CARE, LIHEAP, Lifeline phone, and internet discounts',
      icon: Icons.bolt,
      url: 'https://baynavigator.org/eligibility/utility-programs',
      color: Color(0xFF4CAF50),
    ),
    EligibilityGuide(
      id: 'cash',
      title: 'Cash Assistance',
      description: 'CalWORKs, SSI/SSDI, and General Assistance',
      icon: Icons.attach_money,
      url: 'https://baynavigator.org/eligibility/cash-assistance',
      color: Color(0xFF9C27B0),
    ),
    EligibilityGuide(
      id: 'disability',
      title: 'Disability Benefits',
      description: 'SSI, SSDI, IHSS, and disability-specific services',
      icon: Icons.accessible,
      url: 'https://baynavigator.org/eligibility/disability',
      color: Color(0xFF00BCD4),
    ),
    EligibilityGuide(
      id: 'seniors',
      title: 'Senior Programs',
      description: 'Programs for adults 60 and older',
      icon: Icons.elderly,
      url: 'https://baynavigator.org/eligibility/seniors',
      color: Color(0xFF795548),
    ),
    EligibilityGuide(
      id: 'students',
      title: 'Student Benefits',
      description: 'Financial aid, student discounts, and educational support',
      icon: Icons.school,
      url: 'https://baynavigator.org/eligibility/students',
      color: Color(0xFF3F51B5),
    ),
    EligibilityGuide(
      id: 'veterans',
      title: 'Military & Veterans',
      description: 'VA benefits, veteran services, and military family support',
      icon: Icons.military_tech,
      url: 'https://baynavigator.org/eligibility/military-veterans',
      color: Color(0xFF607D8B),
    ),
  ];

  void _openGuide(BuildContext context, EligibilityGuide guide) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => GuideViewerScreen(
          title: guide.title,
          guideId: guide.id,
          accentColor: guide.color,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    return Scaffold(
      appBar: useDesktopLayout ? null : AppBar(
        title: const Text('Eligibility Guides'),
      ),
      body: SafeArea(
        top: !useDesktopLayout,
        child: CustomScrollView(
          slivers: [
            // Info card
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: AppColors.info,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'These guides explain eligibility requirements, how to apply, and what documents you need.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? AppColors.darkText : AppColors.lightText,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // Guides list
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverLayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.crossAxisExtent;
                  int crossAxisCount;
                  if (width >= 1200) {
                    crossAxisCount = 3;
                  } else if (width >= 800) {
                    crossAxisCount = 2;
                  } else {
                    crossAxisCount = 1;
                  }

                  if (crossAxisCount == 1) {
                    // List view for mobile
                    return SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _buildGuideCard(
                          context,
                          _guides[index],
                          isDark,
                        ),
                        childCount: _guides.length,
                      ),
                    );
                  }

                  // Grid for larger screens
                  return SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 2.5,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _buildGuideCard(
                        context,
                        _guides[index],
                        isDark,
                        isGrid: true,
                      ),
                      childCount: _guides.length,
                    ),
                  );
                },
              ),
            ),

            // Bottom padding
            SliverToBoxAdapter(
              child: SizedBox(height: 16 + MediaQuery.of(context).padding.bottom),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuideCard(
    BuildContext context,
    EligibilityGuide guide,
    bool isDark, {
    bool isGrid = false,
  }) {
    final theme = Theme.of(context);

    return Padding(
      padding: EdgeInsets.only(bottom: isGrid ? 0 : 12),
      child: Card(
        margin: EdgeInsets.zero,
        child: InkWell(
          onTap: () => _openGuide(context, guide),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: guide.color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    guide.icon,
                    color: guide.color,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        guide.title,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        guide.description,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(
                  Icons.chevron_right,
                  size: 20,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
