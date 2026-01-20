import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:provider/provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/theme.dart';
import '../models/program.dart';
import '../providers/programs_provider.dart';
import '../services/location_service.dart';
import '../services/platform_service.dart';
import '../utils/category_icons.dart';
import 'program_detail_screen.dart';

/// Map screen showing program locations
class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  MapLibreMapController? _mapController;
  final LocationService _locationService = LocationService();

  bool _isLoading = true;
  bool _isOffline = false;
  final bool _hasOfflineMap = false; // TODO: Implement offline map download
  String? _error;
  LatLng? _userLocation;
  List<Program> _programsWithLocation = [];
  final Set<String> _addedMarkers = {};

  // Bay Area center
  static const _bayAreaCenter = LatLng(37.7749, -122.4194);
  static const _defaultZoom = 9.0;

  // Map style URL (OSM demo tiles)
  static const _osmStyleUrl = 'https://demotiles.maplibre.org/style.json';

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    // Defer loading to after build to avoid setState during build errors
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPrograms();
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _checkConnectivity() async {
    final connectivity = await Connectivity().checkConnectivity();
    setState(() {
      _isOffline = connectivity.contains(ConnectivityResult.none);
    });

    // Listen for connectivity changes
    Connectivity().onConnectivityChanged.listen((results) {
      if (mounted) {
        setState(() {
          _isOffline = results.contains(ConnectivityResult.none);
        });
      }
    });
  }

  Future<void> _loadPrograms() async {
    try {
      final provider = context.read<ProgramsProvider>();
      await provider.loadData();

      setState(() {
        _programsWithLocation = provider.programs
            .where((p) => p.hasCoordinates)
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load programs';
        _isLoading = false;
      });
    }
  }

  Future<void> _getUserLocation() async {
    try {
      final success = await _locationService.getCurrentLocation();
      if (success && _locationService.currentPosition != null && mounted) {
        final position = _locationService.currentPosition!;
        setState(() {
          _userLocation = LatLng(position.latitude, position.longitude);
        });

        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(_userLocation!, 12),
        );
      }
    } catch (e) {
      // Location not available
    }
  }

  void _onMapCreated(MapLibreMapController controller) {
    _mapController = controller;
    _addMarkers();
  }

  Future<void> _addMarkers() async {
    if (_mapController == null) return;

    for (final program in _programsWithLocation) {
      if (_addedMarkers.contains(program.id)) continue;

      try {
        await _mapController!.addSymbol(
          SymbolOptions(
            geometry: LatLng(program.latitude!, program.longitude!),
            iconImage: 'marker-15',
            iconSize: 1.5,
            textField: program.name,
            textOffset: const Offset(0, 1.5),
            textSize: 10,
            textMaxWidth: 10,
          ),
          {'programId': program.id},
        );
        _addedMarkers.add(program.id);
      } catch (e) {
        // Skip marker if it fails
      }
    }
  }

  void _onSymbolTapped(Symbol symbol) {
    final programId = symbol.data?['programId'] as String?;
    if (programId == null) return;

    final program = _programsWithLocation.firstWhere(
      (p) => p.id == programId,
      orElse: () => _programsWithLocation.first,
    );

    _showProgramSheet(program);
  }

  void _showProgramSheet(Program program) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getCategoryIcon(program.category),
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        program.name,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        CategoryIcons.formatName(program.category),
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              program.description,
              style: theme.textTheme.bodyMedium,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
            if (program.address != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      program.address!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ProgramDetailScreen(program: program),
                    ),
                  );
                },
                child: const Text('View Details'),
              ),
            ),
            SizedBox(height: MediaQuery.of(context).padding.bottom),
          ],
        ),
      ),
    );
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'food':
        return Icons.restaurant;
      case 'health':
      case 'healthcare':
        return Icons.local_hospital;
      case 'housing':
        return Icons.home;
      case 'utilities':
        return Icons.bolt;
      case 'transportation':
        return Icons.directions_bus;
      case 'education':
        return Icons.school;
      case 'employment':
        return Icons.work;
      case 'legal':
        return Icons.gavel;
      case 'community':
        return Icons.people;
      case 'recreation':
        return Icons.sports_soccer;
      default:
        return Icons.category;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isDesktop = !kIsWeb && PlatformService.isDesktop;
    final screenWidth = MediaQuery.of(context).size.width;
    final useDesktopLayout = isDesktop && screenWidth >= 800;

    // Show offline message if no connection and no offline map
    if (_isOffline && !_hasOfflineMap) {
      return Scaffold(
        appBar: useDesktopLayout ? null : AppBar(
          title: const Text('Map'),
        ),
        body: SafeArea(
          top: !useDesktopLayout,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.wifi_off,
                    size: 64,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Map Requires Internet',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'The interactive map needs an internet connection to load. You can still browse all programs in the Directory.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: () {
                      // Navigate to directory - handled by parent
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.apps),
                    label: const Text('Browse Directory'),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: _checkConnectivity,
                    icon: const Icon(Icons.refresh),
                    label: const Text('Check Connection'),
                  ),
                  // Future: Add offline map download option
                  // const SizedBox(height: 32),
                  // TextButton(
                  //   onPressed: () {
                  //     // Navigate to settings for offline download
                  //   },
                  //   child: const Text('Download Map for Offline Use'),
                  // ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: useDesktopLayout ? null : AppBar(
        title: const Text('Map'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            onPressed: _getUserLocation,
            tooltip: 'My location',
          ),
        ],
      ),
      body: SafeArea(
        top: !useDesktopLayout,
        child: Stack(
          children: [
            // Map
            MapLibreMap(
              onMapCreated: _onMapCreated,
              initialCameraPosition: CameraPosition(
                target: _bayAreaCenter,
                zoom: _defaultZoom,
              ),
              styleString: _osmStyleUrl,
              myLocationEnabled: false,  // Disabled by default to prevent crash
              myLocationTrackingMode: MyLocationTrackingMode.none,
              onStyleLoadedCallback: () {
                _addMarkers();
              },
            ),

            // Loading overlay
            if (_isLoading)
              Container(
                color: (isDark ? AppColors.darkBackground : AppColors.lightBackground)
                    .withValues(alpha: 0.8),
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),

            // Error message
            if (_error != null)
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Card(
                  color: AppColors.danger.withValues(alpha: 0.1),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline, color: AppColors.danger),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _error!,
                            style: TextStyle(color: AppColors.danger),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => setState(() => _error = null),
                          color: AppColors.danger,
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Program count indicator
            Positioned(
              bottom: 16 + MediaQuery.of(context).padding.bottom,
              left: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkCard : AppColors.lightCard,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.1),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      '${_programsWithLocation.length} programs',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: isDark ? AppColors.darkText : AppColors.lightText,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Desktop: My location button
            if (useDesktopLayout)
              Positioned(
                top: 16,
                right: 16,
                child: FloatingActionButton.small(
                  onPressed: _getUserLocation,
                  backgroundColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                  child: Icon(
                    Icons.my_location,
                    color: AppColors.primary,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
