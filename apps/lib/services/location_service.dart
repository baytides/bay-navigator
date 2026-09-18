import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import 'bay_area_counties.dart';

/// Privacy-first location service
/// - All distance calculations are done on-device
/// - Location is never sent to any server
/// - User must explicitly opt-in to location access
class LocationService extends ChangeNotifier {
  Position? _currentPosition;
  String? _currentCounty;
  bool _isLoading = false;
  String? _error;
  bool _hasPermission = false;

  // Getters
  Position? get currentPosition => _currentPosition;
  String? get currentCounty => _currentCounty;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasPermission => _hasPermission;
  bool get hasLocation => _currentPosition != null;

  // County membership is decided by the real boundaries, not by distance to a
  // county centre. See BayAreaCounties for why: the centroid approach was wrong
  // for 10 of 27 real Bay Area cities, sending Oakland and Berkeley users to
  // San Francisco's programs.


  /// Check if location services are available
  Future<bool> checkPermission() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = 'Location services are disabled';
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        _hasPermission = false;
        return false;
      }

      if (permission == LocationPermission.deniedForever) {
        _error = 'Location permission permanently denied';
        _hasPermission = false;
        return false;
      }

      _hasPermission = true;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    }
  }

  /// Request location permission
  Future<bool> requestPermission() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _error = 'Please enable location services';
        notifyListeners();
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _error = 'Location permission denied';
          _hasPermission = false;
          notifyListeners();
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _error = 'Location permission permanently denied. Please enable in Settings.';
        _hasPermission = false;
        notifyListeners();
        return false;
      }

      _hasPermission = true;
      _error = null;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Get current location (on-device only)
  Future<bool> getCurrentLocation() async {
    if (_isLoading) return false;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Request permission if not granted
      if (!_hasPermission) {
        final granted = await requestPermission();
        if (!granted) {
          _isLoading = false;
          notifyListeners();
          return false;
        }
      }

      // Get position (stays on device!)
      _currentPosition = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.low, // Don't need precise location
          timeLimit: Duration(seconds: 10),
        ),
      );

      // Determine county on-device by point-in-polygon. Null when the fix is
      // outside the nine counties — the UI should say so rather than guess,
      // which is what the old nearest-centroid lookup silently did.
      final boundaries = await BayAreaCounties.load();
      _currentCounty = boundaries
          .countyAt(_currentPosition!.latitude, _currentPosition!.longitude)
          ?.displayName;

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Could not get location: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Clear current location
  void clearLocation() {
    _currentPosition = null;
    _currentCounty = null;
    _error = null;
    notifyListeners();
  }

  /// Find nearest county to given coordinates (on-device calculation)

  /// Calculate distance between two points using Haversine formula (on-device)
  /// Returns distance in miles
  static double calculateDistance(
    double lat1, double lng1,
    double lat2, double lng2,
  ) {
    const double earthRadiusMiles = 3959;

    final dLat = _toRadians(lat2 - lat1);
    final dLng = _toRadians(lng2 - lng1);

    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(_toRadians(lat1)) * cos(_toRadians(lat2)) *
        sin(dLng / 2) * sin(dLng / 2);

    final c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadiusMiles * c;
  }

  static double _toRadians(double degrees) {
    return degrees * pi / 180;
  }

  /// Format distance for display
  static String formatDistance(double miles) {
    if (miles < 0.1) {
      return '${(miles * 5280).round()} ft';
    } else if (miles < 10) {
      return '${miles.toStringAsFixed(1)} mi';
    } else {
      return '${miles.round()} mi';
    }
  }

  /// Calculate distance to a program location (on-device)
  double? getDistanceToProgram(double? programLat, double? programLng) {
    if (_currentPosition == null || programLat == null || programLng == null) {
      return null;
    }

    return calculateDistance(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      programLat,
      programLng,
    );
  }
}
