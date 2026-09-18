import Foundation
import CoreLocation

/// Privacy-first location service for Bay Navigator
/// - All distance calculations are done on-device
/// - Location is never sent to any server
/// - User must explicitly opt-in to location access
@Observable
public final class LocationService: NSObject {
    // MARK: - Published Properties
    public private(set) var currentLocation: CLLocation?
    public private(set) var currentCounty: String?
    public private(set) var isLoading = false
    public private(set) var error: String?
    public private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined

    public var hasLocation: Bool { currentLocation != nil }
    public var hasPermission: Bool {
        #if os(macOS)
        authorizationStatus == .authorized || authorizationStatus == .authorizedAlways
        #elseif os(visionOS)
        // visionOS only supports authorizedWhenInUse, not authorizedAlways
        authorizationStatus == .authorizedWhenInUse
        #else
        authorizationStatus == .authorizedWhenInUse || authorizationStatus == .authorizedAlways
        #endif
    }

    // MARK: - Private
    private let locationManager = CLLocationManager()

    // County membership is decided by the real boundaries, not by distance to a
    // county centre. See BayAreaCounties for why: the centroid approach was
    // wrong for 10 of 27 real Bay Area cities, sending Oakland and Berkeley
    // users to San Francisco's programs.
    //
    // Loaded lazily so a device that never asks for location never pays for it.
    private static let boundaries: BayAreaCounties? = try? BayAreaCounties.bundled()

    // MARK: - Initialization
    public override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyKilometer // Don't need precise
        authorizationStatus = locationManager.authorizationStatus
    }

    // MARK: - Public Methods

    /// Request location permission
    public func requestPermission() {
        locationManager.requestWhenInUseAuthorization()
    }

    /// Get current location (on-device only - never sent to server)
    public func getCurrentLocation() {
        guard !isLoading else { return }

        isLoading = true
        error = nil

        if authorizationStatus == .notDetermined {
            requestPermission()
            return
        }

        guard hasPermission else {
            error = "Location permission not granted"
            isLoading = false
            return
        }

        locationManager.requestLocation()
    }

    /// Clear current location
    public func clearLocation() {
        currentLocation = nil
        currentCounty = nil
        error = nil
    }

    // MARK: - Distance Calculations (All On-Device)

    /// Calculate distance between two coordinates in miles
    public static func calculateDistance(from: CLLocationCoordinate2D, to: CLLocationCoordinate2D) -> Double {
        let fromLocation = CLLocation(latitude: from.latitude, longitude: from.longitude)
        let toLocation = CLLocation(latitude: to.latitude, longitude: to.longitude)
        return fromLocation.distance(from: toLocation) / 1609.344 // meters to miles
    }

    /// Calculate distance from user to a program
    public func distanceToProgram(latitude: Double?, longitude: Double?) -> Double? {
        guard let location = currentLocation,
              let lat = latitude,
              let lng = longitude else {
            return nil
        }

        let programCoord = CLLocationCoordinate2D(latitude: lat, longitude: lng)
        return Self.calculateDistance(from: location.coordinate, to: programCoord)
    }

    /// Format distance for display
    public static func formatDistance(_ miles: Double) -> String {
        if miles < 0.1 {
            return "\(Int(miles * 5280)) ft"
        } else if miles < 10 {
            return String(format: "%.1f mi", miles)
        } else {
            return "\(Int(miles)) mi"
        }
    }

    // MARK: - Private Methods

    /// Find nearest county based on coordinates (on-device only)
    /// The county containing this coordinate, or nil when it is outside the
    /// nine counties.
    ///
    /// Deliberately optional. The old version returned the *nearest* county for
    /// any coordinate on earth, so a user in Sacramento was silently told they
    /// were in Solano and shown Solano's programs. Callers should say "outside
    /// the Bay Area" rather than guess.
    private func county(for coordinate: CLLocationCoordinate2D) -> String? {
        guard let boundaries = Self.boundaries,
              let hit = boundaries.county(at: coordinate)
        else { return nil }
        return BayAreaCounties.displayName(for: hit)
    }
}

// MARK: - CLLocationManagerDelegate
extension LocationService: CLLocationManagerDelegate {
    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        // Store location (stays on device!)
        currentLocation = location

        // Determine county (calculated on-device)
        currentCounty = county(for: location.coordinate)

        isLoading = false
    }

    public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        self.error = "Could not get location: \(error.localizedDescription)"
        isLoading = false
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus

        // If we were waiting for permission, try to get location now
        if isLoading && hasPermission {
            locationManager.requestLocation()
        } else if isLoading && authorizationStatus == .denied {
            error = "Location permission denied"
            isLoading = false
        }
    }
}
