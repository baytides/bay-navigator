import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

/// Which of the nine Bay Area counties contains a coordinate.
///
/// WHY THIS REPLACED "NEAREST COUNTY CENTRE": the previous implementation
/// resolved a GPS fix by measuring the distance to nine hardcoded county
/// centroids and taking the closest. Measured against the real boundaries that
/// is wrong for 10 of 27 actual Bay Area cities:
///
///   Oakland   -> said San Francisco      Daly City -> said San Francisco
///   Berkeley  -> said San Francisco      Palo Alto -> said San Mateo
///   Fremont   -> said Santa Clara        Hayward   -> said Contra Costa
///
/// Someone standing in Oakland was shown San Francisco's programs. A centroid
/// cannot describe a county: Alameda's centre is out past Livermore, so most of
/// Alameda's population is closer to San Francisco's centre than to its own.
///
/// Boundaries come from scripts/generate/generate-county-lookup.cjs, simplified
/// to ~111 m and 35 KB, with a build-time assertion that 27 real cities still
/// classify correctly.
class BayAreaCounty {
  const BayAreaCounty({
    required this.name,
    required this.slug,
    required this.polygons,
  });

  final String name;
  final String slug;

  /// [polygon][ring][point][lng, lat] — GeoJSON order, longitude first.
  final List<List<List<List<double>>>> polygons;

  /// Display label matching the rest of the app. San Francisco is a
  /// consolidated city-county, so it is not suffixed.
  String get displayName => name == 'San Francisco' ? name : '$name County';

  factory BayAreaCounty.fromJson(Map<String, dynamic> json) {
    return BayAreaCounty(
      name: json['name'] as String,
      slug: json['slug'] as String,
      polygons: (json['polygons'] as List)
          .map((poly) => (poly as List)
              .map((ring) => (ring as List)
                  .map((pt) => (pt as List).map((v) => (v as num).toDouble()).toList())
                  .toList())
              .toList())
          .toList(),
    );
  }
}

class BayAreaCounties {
  BayAreaCounties(this.counties);

  final List<BayAreaCounty> counties;

  static BayAreaCounties? _cached;

  /// Loaded lazily, so a device that never asks for location never pays for it.
  static Future<BayAreaCounties> load() async {
    if (_cached != null) return _cached!;
    final raw = await rootBundle.loadString('assets/data/county-lookup.json');
    _cached = BayAreaCounties.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    return _cached!;
  }

  factory BayAreaCounties.fromJson(Map<String, dynamic> json) {
    return BayAreaCounties(
      (json['counties'] as List)
          .map((c) => BayAreaCounty.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  /// Ray casting. Mirrors the JS and Swift ports — keep the three in step.
  static bool _inRing(double x, double y, List<List<double>> ring) {
    if (ring.length < 3) return false;
    var inside = false;
    var j = ring.length - 1;
    for (var i = 0; i < ring.length; i++) {
      final xi = ring[i][0], yi = ring[i][1];
      final xj = ring[j][0], yj = ring[j][1];
      if ((yi > y) != (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
      j = i;
    }
    return inside;
  }

  /// The county containing this point, or null if it is outside all nine.
  ///
  /// Deliberately nullable. The old version returned the nearest county for any
  /// coordinate on earth, so a user in Sacramento was silently told they were in
  /// Solano and shown Solano's programs. Callers should say "outside the Bay
  /// Area" rather than guess.
  BayAreaCounty? countyAt(double latitude, double longitude) {
    for (final county in counties) {
      for (final polygon in county.polygons) {
        if (polygon.isEmpty || !_inRing(longitude, latitude, polygon.first)) {
          continue;
        }
        var inHole = false;
        for (final hole in polygon.skip(1)) {
          if (_inRing(longitude, latitude, hole)) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return county;
      }
    }
    return null;
  }
}
