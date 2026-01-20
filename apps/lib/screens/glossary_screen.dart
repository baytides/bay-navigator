import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../services/platform_service.dart';

/// Glossary term
class GlossaryTerm {
  final String acronym;
  final String fullName;
  final String description;
  final String category;

  const GlossaryTerm({
    required this.acronym,
    required this.fullName,
    required this.description,
    required this.category,
  });
}

/// Glossary screen with government acronym definitions
class GlossaryScreen extends StatefulWidget {
  const GlossaryScreen({super.key});

  @override
  State<GlossaryScreen> createState() => _GlossaryScreenState();
}

class _GlossaryScreenState extends State<GlossaryScreen> {
  String _searchQuery = '';
  String? _selectedCategory;

  // Common Bay Area government acronyms
  static const List<GlossaryTerm> _allTerms = [
    // Food
    GlossaryTerm(
      acronym: 'SNAP',
      fullName: 'Supplemental Nutrition Assistance Program',
      description: 'Federal food assistance program, known as CalFresh in California',
      category: 'Food',
    ),
    GlossaryTerm(
      acronym: 'CalFresh',
      fullName: 'California Food Assistance Program',
      description: "California's name for SNAP, providing monthly food benefits on an EBT card",
      category: 'Food',
    ),
    GlossaryTerm(
      acronym: 'EBT',
      fullName: 'Electronic Benefits Transfer',
      description: 'Debit card used to receive and spend CalFresh and other benefits',
      category: 'Food',
    ),
    GlossaryTerm(
      acronym: 'WIC',
      fullName: 'Women, Infants, and Children',
      description: 'Nutrition program for pregnant women, new mothers, and young children',
      category: 'Food',
    ),

    // Healthcare
    GlossaryTerm(
      acronym: 'Medi-Cal',
      fullName: 'California Medicaid',
      description: "California's Medicaid program providing free or low-cost health coverage",
      category: 'Healthcare',
    ),
    GlossaryTerm(
      acronym: 'CHIP',
      fullName: "Children's Health Insurance Program",
      description: 'Health coverage for children in families with incomes too high for Medicaid',
      category: 'Healthcare',
    ),
    GlossaryTerm(
      acronym: 'ACA',
      fullName: 'Affordable Care Act',
      description: 'Federal law that created health insurance marketplaces like Covered California',
      category: 'Healthcare',
    ),
    GlossaryTerm(
      acronym: 'FQHC',
      fullName: 'Federally Qualified Health Center',
      description: 'Community health centers that provide care regardless of ability to pay',
      category: 'Healthcare',
    ),

    // Cash Assistance
    GlossaryTerm(
      acronym: 'SSI',
      fullName: 'Supplemental Security Income',
      description: 'Federal income for elderly, blind, or disabled individuals with limited income',
      category: 'Cash',
    ),
    GlossaryTerm(
      acronym: 'SSDI',
      fullName: 'Social Security Disability Insurance',
      description: 'Benefits for workers who become disabled and paid into Social Security',
      category: 'Cash',
    ),
    GlossaryTerm(
      acronym: 'CalWORKs',
      fullName: 'California Work Opportunity and Responsibility to Kids',
      description: "California's welfare-to-work program providing cash aid to families",
      category: 'Cash',
    ),
    GlossaryTerm(
      acronym: 'TANF',
      fullName: 'Temporary Assistance for Needy Families',
      description: 'Federal program funding state welfare programs like CalWORKs',
      category: 'Cash',
    ),
    GlossaryTerm(
      acronym: 'GA',
      fullName: 'General Assistance',
      description: 'County-funded cash assistance for individuals not eligible for other programs',
      category: 'Cash',
    ),
    GlossaryTerm(
      acronym: 'EITC',
      fullName: 'Earned Income Tax Credit',
      description: 'Tax credit for low to moderate income working individuals and families',
      category: 'Cash',
    ),

    // Housing
    GlossaryTerm(
      acronym: 'HUD',
      fullName: 'Department of Housing and Urban Development',
      description: 'Federal agency overseeing housing programs and fair housing',
      category: 'Housing',
    ),
    GlossaryTerm(
      acronym: 'Section 8',
      fullName: 'Housing Choice Voucher Program',
      description: 'Federal rental assistance allowing families to choose private housing',
      category: 'Housing',
    ),
    GlossaryTerm(
      acronym: 'PHA',
      fullName: 'Public Housing Authority',
      description: 'Local agency that administers public housing and voucher programs',
      category: 'Housing',
    ),
    GlossaryTerm(
      acronym: 'CoC',
      fullName: 'Continuum of Care',
      description: 'Regional planning body that coordinates homeless services',
      category: 'Housing',
    ),
    GlossaryTerm(
      acronym: 'LIHTC',
      fullName: 'Low-Income Housing Tax Credit',
      description: 'Tax incentive for developers to build affordable housing',
      category: 'Housing',
    ),

    // Utilities
    GlossaryTerm(
      acronym: 'CARE',
      fullName: 'California Alternate Rates for Energy',
      description: 'Utility discount program providing 20-35% off electric and gas bills',
      category: 'Utilities',
    ),
    GlossaryTerm(
      acronym: 'FERA',
      fullName: 'Family Electric Rate Assistance',
      description: 'Electric discount for households slightly over CARE income limits',
      category: 'Utilities',
    ),
    GlossaryTerm(
      acronym: 'LIHEAP',
      fullName: 'Low Income Home Energy Assistance Program',
      description: 'Federal program helping pay heating and cooling bills',
      category: 'Utilities',
    ),
    GlossaryTerm(
      acronym: 'ACP',
      fullName: 'Affordable Connectivity Program',
      description: 'Federal program providing discounts on internet service (ended 2024)',
      category: 'Utilities',
    ),
    GlossaryTerm(
      acronym: 'Lifeline',
      fullName: 'Lifeline Telephone Assistance',
      description: 'Discounted phone service for low-income households',
      category: 'Utilities',
    ),

    // Disability
    GlossaryTerm(
      acronym: 'IHSS',
      fullName: 'In-Home Supportive Services',
      description: 'Program providing caregivers for elderly and disabled at home',
      category: 'Disability',
    ),
    GlossaryTerm(
      acronym: 'DDS',
      fullName: 'Department of Developmental Services',
      description: 'State agency providing services for people with developmental disabilities',
      category: 'Disability',
    ),
    GlossaryTerm(
      acronym: 'ADA',
      fullName: 'Americans with Disabilities Act',
      description: 'Federal law prohibiting discrimination against people with disabilities',
      category: 'Disability',
    ),
    GlossaryTerm(
      acronym: 'ABLE',
      fullName: 'Achieving a Better Life Experience',
      description: 'Tax-advantaged savings accounts for people with disabilities',
      category: 'Disability',
    ),

    // Education
    GlossaryTerm(
      acronym: 'FAFSA',
      fullName: 'Free Application for Federal Student Aid',
      description: 'Form used to apply for federal financial aid for college',
      category: 'Education',
    ),
    GlossaryTerm(
      acronym: 'Pell Grant',
      fullName: 'Federal Pell Grant',
      description: 'Federal grant for undergraduate students with financial need',
      category: 'Education',
    ),
    GlossaryTerm(
      acronym: 'Cal Grant',
      fullName: 'California Student Grant',
      description: 'State financial aid for California college students',
      category: 'Education',
    ),
    GlossaryTerm(
      acronym: 'BOG',
      fullName: 'Board of Governors Fee Waiver',
      description: 'Waives enrollment fees at California community colleges',
      category: 'Education',
    ),

    // Transportation
    GlossaryTerm(
      acronym: 'Clipper',
      fullName: 'Clipper Card',
      description: 'Bay Area transit fare payment card accepted on all major systems',
      category: 'Transportation',
    ),
    GlossaryTerm(
      acronym: 'BART',
      fullName: 'Bay Area Rapid Transit',
      description: 'Regional subway/rail system serving the Bay Area',
      category: 'Transportation',
    ),
    GlossaryTerm(
      acronym: 'MTC',
      fullName: 'Metropolitan Transportation Commission',
      description: 'Regional transportation planning agency for the Bay Area',
      category: 'Transportation',
    ),
    GlossaryTerm(
      acronym: 'Paratransit',
      fullName: 'ADA Paratransit',
      description: 'Door-to-door transit service for people with disabilities',
      category: 'Transportation',
    ),

    // General
    GlossaryTerm(
      acronym: 'HSA',
      fullName: 'Human Services Agency',
      description: 'County department administering social services programs',
      category: 'General',
    ),
    GlossaryTerm(
      acronym: 'SSA',
      fullName: 'Social Security Administration',
      description: 'Federal agency administering Social Security and SSI',
      category: 'General',
    ),
    GlossaryTerm(
      acronym: 'FPL',
      fullName: 'Federal Poverty Level',
      description: 'Income threshold used to determine eligibility for many programs',
      category: 'General',
    ),
    GlossaryTerm(
      acronym: 'AMI',
      fullName: 'Area Median Income',
      description: 'Median income for a region, used for housing program eligibility',
      category: 'General',
    ),
    GlossaryTerm(
      acronym: '211',
      fullName: '2-1-1 Information Line',
      description: 'Free helpline connecting callers to local social services',
      category: 'General',
    ),
  ];

  List<String> get _categories {
    final cats = _allTerms.map((t) => t.category).toSet().toList();
    cats.sort();
    return cats;
  }

  List<GlossaryTerm> get _filteredTerms {
    var terms = _allTerms;

    if (_selectedCategory != null) {
      terms = terms.where((t) => t.category == _selectedCategory).toList();
    }

    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      terms = terms.where((t) =>
        t.acronym.toLowerCase().contains(query) ||
        t.fullName.toLowerCase().contains(query) ||
        t.description.toLowerCase().contains(query)
      ).toList();
    }

    return terms;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    final filteredTerms = _filteredTerms;

    return Scaffold(
      appBar: useDesktopLayout ? null : AppBar(
        title: const Text('Glossary'),
      ),
      body: SafeArea(
        top: !useDesktopLayout,
        child: Column(
          children: [
            const SizedBox(height: 16),

            // Search and filter
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Search bar
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Search acronyms...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    onChanged: (value) => setState(() => _searchQuery = value),
                  ),
                  const SizedBox(height: 12),

                  // Category chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        FilterChip(
                          label: const Text('All'),
                          selected: _selectedCategory == null,
                          onSelected: (selected) {
                            setState(() => _selectedCategory = null);
                          },
                        ),
                        const SizedBox(width: 8),
                        ..._categories.map((cat) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: FilterChip(
                            label: Text(cat),
                            selected: _selectedCategory == cat,
                            onSelected: (selected) {
                              setState(() => _selectedCategory = selected ? cat : null);
                            },
                          ),
                        )),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Results count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Text(
                    '${filteredTerms.length} terms',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // Terms list
            Expanded(
              child: filteredTerms.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 48,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'No terms found',
                            style: theme.textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Try a different search or category',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: filteredTerms.length,
                      itemBuilder: (context, index) {
                        final term = filteredTerms[index];
                        return _buildTermCard(term, isDark);
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTermCard(GlossaryTerm term, bool isDark) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    term.acronym,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        term.fullName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.primary.withValues(alpha: 0.2)
                              : AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          term.category,
                          style: TextStyle(
                            fontSize: 11,
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
            const SizedBox(height: 12),
            Text(
              term.description,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
