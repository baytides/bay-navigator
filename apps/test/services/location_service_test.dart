import 'package:flutter_test/flutter_test.dart';
import 'package:baynavigator/services/location_service.dart';

/// Expected values are great-circle distances computed independently of the
/// implementation (IUGG mean Earth radius, 3958.76 mi). The service uses 3959,
/// so a 0.05 mi tolerance covers the radius difference at Bay Area scale.
void main() {
  group('LocationService.calculateDistance', () {
    const sfLat = 37.7793, sfLng = -122.4193; // SF City Hall
    const oakLat = 37.8053, oakLng = -122.2730; // Oakland City Hall
    const sjLat = 37.3382, sjLng = -121.8863; // San Jose City Hall

    test('same point is zero', () {
      expect(LocationService.calculateDistance(sfLat, sfLng, sfLat, sfLng), 0);
    });

    test('SF to Oakland is about 8.19 miles', () {
      expect(
        LocationService.calculateDistance(sfLat, sfLng, oakLat, oakLng),
        closeTo(8.188, 0.05),
      );
    });

    test('SF to San Jose is about 42.2 miles', () {
      expect(
        LocationService.calculateDistance(sfLat, sfLng, sjLat, sjLng),
        closeTo(42.203, 0.05),
      );
    });

    test('is symmetric', () {
      expect(
        LocationService.calculateDistance(sfLat, sfLng, sjLat, sjLng),
        closeTo(LocationService.calculateDistance(sjLat, sjLng, sfLat, sfLng), 1e-9),
      );
    });

    test('handles the antimeridian without going the long way round', () {
      // ~112 miles apart across the date line, not ~24,750 the other way.
      final d = LocationService.calculateDistance(0, 179.0, 0, -179.0);
      expect(d, closeTo(138.1, 1.0));
    });

    test('handles poles', () {
      // Pole to pole is half the circumference.
      final d = LocationService.calculateDistance(90, 0, -90, 0);
      expect(d, closeTo(12437.0, 5.0));
    });
  });

  group('LocationService.formatDistance', () {
    test('formats sub-mile distances', () {
      expect(LocationService.formatDistance(0.4), isNotEmpty);
    });

    test('formats whole miles', () {
      expect(LocationService.formatDistance(8.2), isNotEmpty);
    });
  });
}
