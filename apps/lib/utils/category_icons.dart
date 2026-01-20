import 'package:flutter/material.dart';
import '../config/theme.dart';

/// Category icons and colors matching web design (Tailwind config)
/// Maps program categories to appropriate Material icons and colors
class CategoryIcons {
  static const Map<String, IconData> _categoryIcons = {
    // Food - restaurant
    'food': Icons.restaurant_outlined,
    'food assistance': Icons.restaurant_outlined,

    // Health - medical
    'health': Icons.monitor_heart_outlined,
    'healthcare': Icons.monitor_heart_outlined,
    'medical': Icons.local_hospital_outlined,

    // Recreation - activity
    'recreation': Icons.sports_soccer_outlined,
    'activities': Icons.sports_soccer_outlined,
    'entertainment': Icons.sports_soccer_outlined,

    // Community / Community Services - people
    'community': Icons.people_outline,
    'community services': Icons.people_outline,
    'social services': Icons.people_outline,

    // Education - school
    'education': Icons.school_outlined,
    'learning': Icons.school_outlined,
    'training': Icons.school_outlined,

    // Finance / Financial Assistance - money
    'finance': Icons.attach_money,
    'financial': Icons.attach_money,
    'financial assistance': Icons.attach_money,
    'money': Icons.attach_money,

    // Transportation - transit
    'transportation': Icons.directions_bus_outlined,
    'transit': Icons.directions_bus_outlined,
    'public transit': Icons.directions_bus_outlined,

    // Technology - laptop
    'technology': Icons.laptop_outlined,
    'tech': Icons.laptop_outlined,
    'internet': Icons.wifi_outlined,

    // Legal - balance
    'legal': Icons.balance_outlined,
    'legal services': Icons.balance_outlined,
    'legal aid': Icons.balance_outlined,

    // Pet Resources - pets
    'pet resources': Icons.pets_outlined,
    'pets': Icons.pets_outlined,
    'animal': Icons.pets_outlined,

    // Equipment - build/tool
    'equipment': Icons.build_outlined,
    'tools': Icons.build_outlined,

    // Library Resources - book
    'library resources': Icons.menu_book_outlined,
    'library': Icons.menu_book_outlined,
    'books': Icons.menu_book_outlined,

    // Utilities - bolt/power
    'utilities': Icons.bolt_outlined,
    'energy': Icons.bolt_outlined,
    'power': Icons.bolt_outlined,

    // Childcare Assistance - child
    'childcare': Icons.child_care_outlined,
    'childcare assistance': Icons.child_care_outlined,
    'child care': Icons.child_care_outlined,

    // Parks & Open Space - nature
    'parks': Icons.park_outlined,
    'parks & open space': Icons.park_outlined,

    // Museums - museum
    'museums': Icons.museum_outlined,
    'museum': Icons.museum_outlined,

    // Tax Preparation - receipt
    'tax preparation': Icons.receipt_long_outlined,
    'tax': Icons.receipt_long_outlined,

    // Housing
    'housing': Icons.home_outlined,
    'shelter': Icons.night_shelter_outlined,
    'rent': Icons.home_outlined,

    // Employment
    'employment': Icons.work_outline,
    'jobs': Icons.work_outline,
    'career': Icons.work_outline,
  };

  /// Get icon for a category
  static IconData getIcon(String? category) {
    if (category == null || category.isEmpty) {
      return Icons.info_outline;
    }

    final normalized = category.toLowerCase().trim();
    return _categoryIcons[normalized] ?? Icons.info_outline;
  }

  /// Category colors matching web Tailwind config
  /// Using 900-level colors for AAA contrast (7:1 ratio) on light backgrounds
  static const Map<String, Color> _categoryColors = {
    // Food - Green (matches web green-900)
    'food': Color(0xFF14532D),

    // Health - Red (matches web red-900)
    'health': Color(0xFF7F1D1D),

    // Housing - Blue (matches web blue-900)
    'housing': Color(0xFF1E3A8A),

    // Utilities - Yellow/Amber (matches web yellow-900)
    'utilities': Color(0xFF713F12),

    // Transportation - Purple (matches web purple-900)
    'transportation': Color(0xFF581C87),
    'public transit': Color(0xFF0C4A6E), // Sky-900 for public transit

    // Education - Indigo (matches web indigo-900)
    'education': Color(0xFF312E81),

    // Legal Services - Gray (matches web gray-900)
    'legal': Color(0xFF1F2937),
    'legal services': Color(0xFF1F2937),

    // Finance - Emerald (matches web emerald-900)
    'finance': Color(0xFF064E3B),

    // Technology - Cyan (matches web cyan-900)
    'technology': Color(0xFF164E63),

    // Recreation - Orange (matches web orange-900)
    'recreation': Color(0xFF7C2D12),

    // Community Services - Pink (matches web pink-900)
    'community': Color(0xFF831843),
    'community services': Color(0xFF831843),

    // Parks & Open Space - Lime (matches web lime-900)
    'parks': Color(0xFF365314),
    'parks & open space': Color(0xFF365314),

    // Museums - Violet (matches web violet-900)
    'museums': Color(0xFF4C1D95),

    // Library Resources - Amber (matches web amber-900)
    'library resources': Color(0xFF78350F),

    // Tax Preparation - Teal (matches web teal-900)
    'tax preparation': Color(0xFF134E4A),

    // Childcare - Rose (matches web rose-900)
    'childcare': Color(0xFF881337),

    // Pet Resources - Fuchsia (matches web fuchsia-900)
    'pet resources': Color(0xFF701A75),

    // Equipment - Slate (matches web slate-900)
    'equipment': Color(0xFF0F172A),
  };

  /// Light background colors for category badges (100-level)
  static const Map<String, Color> _categoryBgColors = {
    'food': Color(0xFFDCFCE7),         // green-100
    'health': Color(0xFFFEE2E2),       // red-100
    'housing': Color(0xFFDBEAFE),      // blue-100
    'utilities': Color(0xFFFEF9C3),    // yellow-100
    'transportation': Color(0xFFF3E8FF), // purple-100
    'public transit': Color(0xFFE0F2FE), // sky-100
    'education': Color(0xFFE0E7FF),    // indigo-100
    'legal': Color(0xFFF3F4F6),        // gray-100
    'legal services': Color(0xFFF3F4F6),
    'finance': Color(0xFFD1FAE5),      // emerald-100
    'technology': Color(0xFFCFFAFE),   // cyan-100
    'recreation': Color(0xFFFFEDD5),   // orange-100
    'community': Color(0xFFFCE7F3),    // pink-100
    'community services': Color(0xFFFCE7F3),
    'parks': Color(0xFFECFCCB),        // lime-100
    'parks & open space': Color(0xFFECFCCB),
    'museums': Color(0xFFEDE9FE),      // violet-100
    'library resources': Color(0xFFFEF3C7), // amber-100
    'tax preparation': Color(0xFFCCFBF1), // teal-100
    'childcare': Color(0xFFFFE4E6),    // rose-100
    'pet resources': Color(0xFFFAE8FF), // fuchsia-100
    'equipment': Color(0xFFF1F5F9),    // slate-100
  };

  /// Dark mode background colors (900-level with transparency)
  static const Map<String, Color> _categoryBgColorsDark = {
    'food': Color(0xFF14532D),         // green-900
    'health': Color(0xFF7F1D1D),       // red-900
    'housing': Color(0xFF1E3A8A),      // blue-900
    'utilities': Color(0xFF713F12),    // yellow-900
    'transportation': Color(0xFF581C87), // purple-900
    'public transit': Color(0xFF0C4A6E), // sky-900
    'education': Color(0xFF312E81),    // indigo-900
    'legal': Color(0xFF1F2937),        // gray-800
    'legal services': Color(0xFF1F2937),
    'finance': Color(0xFF064E3B),      // emerald-900
    'technology': Color(0xFF164E63),   // cyan-900
    'recreation': Color(0xFF7C2D12),   // orange-900
    'community': Color(0xFF831843),    // pink-900
    'community services': Color(0xFF831843),
    'parks': Color(0xFF365314),        // lime-900
    'parks & open space': Color(0xFF365314),
    'museums': Color(0xFF4C1D95),      // violet-900
    'library resources': Color(0xFF78350F), // amber-900
    'tax preparation': Color(0xFF134E4A), // teal-900
    'childcare': Color(0xFF881337),    // rose-900
    'pet resources': Color(0xFF701A75), // fuchsia-900
    'equipment': Color(0xFF1E293B),    // slate-800
  };

  /// Get category text color (900-level for AAA contrast)
  static Color getCategoryColor(String? category) {
    if (category == null || category.isEmpty) {
      return AppColors.primary;
    }

    final normalized = category.toLowerCase().trim();
    return _categoryColors[normalized] ?? AppColors.primary;
  }

  /// Get category background color (100-level for light mode)
  static Color getCategoryBgColor(String? category, {bool isDark = false}) {
    if (category == null || category.isEmpty) {
      return isDark ? AppColors.darkNeutral100 : AppColors.lightNeutral100;
    }

    final normalized = category.toLowerCase().trim();
    if (isDark) {
      return _categoryBgColorsDark[normalized] ?? AppColors.darkNeutral100;
    }
    return _categoryBgColors[normalized] ?? AppColors.lightNeutral100;
  }

  /// Build a category badge widget matching web design
  static Widget buildCategoryBadge(
    String? category, {
    bool isDark = false,
  }) {
    final textColor = getCategoryColor(category);
    final bgColor = getCategoryBgColor(category, isDark: isDark);
    final displayText = _formatCategoryName(category);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? bgColor.withValues(alpha: 0.3) : bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        displayText,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: isDark ? const Color(0xFFF5F5F5) : textColor,
        ),
      ),
    );
  }

  /// Format category name for display (public version)
  static String formatName(String? category) {
    if (category == null || category.isEmpty) return 'Other';

    // Special case formatting
    final special = {
      'pet resources': 'Pet Resources',
      'library resources': 'Library Resources',
      'legal services': 'Legal Services',
      'community services': 'Community Services',
      'parks & open space': 'Parks & Open Space',
      'public transit': 'Public Transit',
      'tax preparation': 'Tax Preparation',
    };

    final normalized = category.toLowerCase().trim();
    if (special.containsKey(normalized)) {
      return special[normalized]!;
    }

    // Title case
    return category
        .split(' ')
        .map((word) => word.isNotEmpty
            ? '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}'
            : '')
        .join(' ');
  }

  /// Format category name for display (internal alias)
  static String _formatCategoryName(String? category) => formatName(category);

  /// Build a category icon widget with background
  static Widget buildCategoryIcon(
    String? category, {
    double size = 24,
    double iconSize = 16,
    Color? backgroundColor,
    Color? iconColor,
    bool isDark = false,
  }) {
    final catColor = getCategoryColor(category);
    final bgColor = backgroundColor ??
        (isDark
            ? catColor.withValues(alpha: 0.2)
            : catColor.withValues(alpha: 0.1));
    final fgColor = iconColor ?? (isDark ? const Color(0xFFF5F5F5) : catColor);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(size / 4),
      ),
      child: Icon(
        getIcon(category),
        size: iconSize,
        color: fgColor,
      ),
    );
  }

  /// Build a large category header icon (for detail views)
  static Widget buildHeaderIcon(
    String? category, {
    double size = 80,
    double iconSize = 40,
  }) {
    final catColor = getCategoryColor(category);

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            catColor,
            catColor.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(size / 4),
        boxShadow: [
          BoxShadow(
            color: catColor.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Icon(
        getIcon(category),
        size: iconSize,
        color: Colors.white,
      ),
    );
  }
}
