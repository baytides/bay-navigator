import Foundation

/// Pure helpers for building native-maps handoff links.
///
/// MapKit cannot return transit routes in-app: `MKDirections` with `.transit`
/// returns a null error (confirmed by Apple DTS — only `calculateETA` works, and
/// that gives times, not routes). So Carl's transit help is a *handoff* — we open
/// the native Maps app, which can do transit, with transit mode preselected.
///
/// Uses Apple's documented Unified Map URL
/// (`https://maps.apple.com/directions?destination=…&mode=transit`), which opens
/// the Maps app on Apple devices. Omitting `source` defaults to current location.
public enum TransitDirections {

    /// Build a Unified Map URL that opens **public-transit** directions to
    /// `destination` in the native Maps app. When `origin` is nil, Maps starts from
    /// the device's current location.
    ///
    /// - Parameters:
    ///   - destination: Free-text place name or address; Maps geocodes it.
    ///   - origin: Optional start point; omit to use current location.
    public static func appleMapsURL(destination: String, origin: String? = nil) -> URL {
        var components = URLComponents()
        components.scheme = "https"
        components.host = "maps.apple.com"
        components.path = "/directions"
        var items = [
            URLQueryItem(name: "destination", value: destination),
            URLQueryItem(name: "mode", value: "transit"),
        ]
        if let origin {
            items.append(URLQueryItem(name: "source", value: origin))
        }
        components.queryItems = items
        return components.url!
    }
}
