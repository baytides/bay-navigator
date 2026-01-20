import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Navigation item definition
class NavItem {
  final String id;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final bool isLocked; // Cannot be moved (e.g., For You)

  const NavItem({
    required this.id,
    required this.label,
    required this.icon,
    required this.selectedIcon,
    this.isLocked = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
  };
}

/// All available navigation items
class NavItems {
  static const forYou = NavItem(
    id: 'for_you',
    label: 'For You',
    icon: Icons.auto_awesome_outlined,
    selectedIcon: Icons.auto_awesome,
    isLocked: true,
  );

  static const directory = NavItem(
    id: 'directory',
    label: 'Directory',
    icon: Icons.apps_outlined,
    selectedIcon: Icons.apps,
  );

  static const askCarl = NavItem(
    id: 'ask_carl',
    label: 'Ask Carl',
    icon: Icons.chat_bubble_outline,
    selectedIcon: Icons.chat_bubble,
  );

  static const saved = NavItem(
    id: 'saved',
    label: 'Saved',
    icon: Icons.bookmark_outline,
    selectedIcon: Icons.bookmark,
  );

  static const transit = NavItem(
    id: 'transit',
    label: 'Transit',
    icon: Icons.train_outlined,
    selectedIcon: Icons.train,
  );

  static const eligibility = NavItem(
    id: 'eligibility',
    label: 'Eligibility',
    icon: Icons.checklist_outlined,
    selectedIcon: Icons.checklist,
  );

  static const glossary = NavItem(
    id: 'glossary',
    label: 'Glossary',
    icon: Icons.menu_book_outlined,
    selectedIcon: Icons.menu_book,
  );

  static const settings = NavItem(
    id: 'settings',
    label: 'Settings',
    icon: Icons.settings_outlined,
    selectedIcon: Icons.settings,
  );

  /// All items in default order
  static const List<NavItem> all = [
    forYou,
    directory,
    askCarl,
    saved,
    transit,
    eligibility,
    glossary,
    settings,
  ];

  /// Default tab bar items (mobile)
  static const List<String> defaultTabBarIds = [
    'for_you',
    'directory',
    'ask_carl',
    'saved',
  ];

  /// Get NavItem by id
  static NavItem? getById(String id) {
    try {
      return all.firstWhere((item) => item.id == id);
    } catch (e) {
      return null;
    }
  }
}

/// Provider for managing customizable navigation
class NavigationProvider extends ChangeNotifier {
  static const String _prefsKey = 'baynavigator:nav_tab_order';
  static const int maxTabBarItems = 4; // Excluding "More" tab

  List<String> _tabBarItemIds = List.from(NavItems.defaultTabBarIds);
  bool _initialized = false;

  bool get initialized => _initialized;

  /// Items currently in the tab bar (excludes "More")
  List<NavItem> get tabBarItems {
    return _tabBarItemIds
        .map((id) => NavItems.getById(id))
        .whereType<NavItem>()
        .toList();
  }

  /// Items in the "More" menu
  List<NavItem> get moreItems {
    return NavItems.all
        .where((item) => !_tabBarItemIds.contains(item.id))
        .toList();
  }

  /// All items for desktop/tablet sidebar (full list)
  List<NavItem> get sidebarItems => NavItems.all;

  /// Get the screen index for a nav item id
  int getScreenIndex(String id) {
    return NavItems.all.indexWhere((item) => item.id == id);
  }

  /// Get nav item id from screen index
  String getIdFromScreenIndex(int index) {
    if (index < 0 || index >= NavItems.all.length) return 'for_you';
    return NavItems.all[index].id;
  }

  /// Initialize from saved preferences
  Future<void> initialize() async {
    if (_initialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_prefsKey);

      if (saved != null) {
        final List<dynamic> ids = jsonDecode(saved);
        _tabBarItemIds = ids.cast<String>();

        // Validate saved items still exist
        _tabBarItemIds = _tabBarItemIds
            .where((id) => NavItems.getById(id) != null)
            .toList();

        // Ensure For You is always first
        if (!_tabBarItemIds.contains('for_you')) {
          _tabBarItemIds.insert(0, 'for_you');
        } else if (_tabBarItemIds.first != 'for_you') {
          _tabBarItemIds.remove('for_you');
          _tabBarItemIds.insert(0, 'for_you');
        }

        // Ensure we have at least 3 items
        if (_tabBarItemIds.length < 3) {
          _tabBarItemIds = List.from(NavItems.defaultTabBarIds);
        }
      }
    } catch (e) {
      _tabBarItemIds = List.from(NavItems.defaultTabBarIds);
    }

    _initialized = true;
    notifyListeners();
  }

  /// Save current configuration
  Future<void> _save() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey, jsonEncode(_tabBarItemIds));
    } catch (e) {
      // Silently fail
    }
  }

  /// Move an item from More to tab bar
  bool addToTabBar(String id) {
    if (_tabBarItemIds.length >= maxTabBarItems) return false;
    if (_tabBarItemIds.contains(id)) return false;

    final item = NavItems.getById(id);
    if (item == null) return false;

    _tabBarItemIds.add(id);
    _save();
    notifyListeners();
    return true;
  }

  /// Move an item from tab bar to More
  bool removeFromTabBar(String id) {
    final item = NavItems.getById(id);
    if (item == null || item.isLocked) return false;
    if (_tabBarItemIds.length <= 3) return false; // Keep minimum 3 items

    _tabBarItemIds.remove(id);
    _save();
    notifyListeners();
    return true;
  }

  /// Reorder tab bar items
  void reorderTabBar(int oldIndex, int newIndex) {
    // Can't move the first item (For You)
    if (oldIndex == 0) return;
    if (newIndex == 0) newIndex = 1;

    if (oldIndex < newIndex) {
      newIndex -= 1;
    }

    final item = _tabBarItemIds.removeAt(oldIndex);
    _tabBarItemIds.insert(newIndex, item);
    _save();
    notifyListeners();
  }

  /// Replace an item in the tab bar with another
  bool swapTabBarItem(String removeId, String addId) {
    final removeItem = NavItems.getById(removeId);
    if (removeItem == null || removeItem.isLocked) return false;

    final addItem = NavItems.getById(addId);
    if (addItem == null) return false;

    final index = _tabBarItemIds.indexOf(removeId);
    if (index == -1) return false;

    _tabBarItemIds[index] = addId;
    _save();
    notifyListeners();
    return true;
  }

  /// Reset to default configuration
  Future<void> resetToDefault() async {
    _tabBarItemIds = List.from(NavItems.defaultTabBarIds);
    await _save();
    notifyListeners();
  }

  /// Check if an item is in the tab bar
  bool isInTabBar(String id) => _tabBarItemIds.contains(id);
}
