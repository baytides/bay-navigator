import Foundation

#if canImport(FoundationModels)
import FoundationModels

/// FoundationModels tool that hands off transit / wayfinding questions ("how do I
/// get to X?") to the native Maps app with public-transit directions.
///
/// MapKit can't render transit routes in-app (`MKDirections` with `.transit` is
/// ETA-only), so Carl defers to the Maps app, which does live transit. The tool
/// returns an Apple Maps Unified URL for the model to surface; Carl should layer
/// any relevant transit-benefit tips (Clipper discounts, paratransit) from
/// `searchResources`.
@available(iOS 26, macOS 26, visionOS 26, *)
public struct TransitDirectionsTool: Tool {
    public let name = "transitDirections"
    public let description = """
        Get public-transit directions to a place. Use for "how do I get to X" / \
        wayfinding questions. Returns an Apple Maps link that opens live transit \
        directions in the Maps app — include the link in your reply.
        """

    public init() {}

    @Generable
    public struct Arguments {
        @Guide(description: "Where the user wants to go, e.g. 'SFO' or '1 Dr Carlton B Goodlett Pl, San Francisco'")
        public var destination: String

        @Guide(description: "Optional starting point; omit to use the user's current location")
        public var origin: String?

        public init(destination: String, origin: String? = nil) {
            self.destination = destination
            self.origin = origin
        }
    }

    public func call(arguments: Arguments) async throws -> String {
        let url = TransitDirections.appleMapsURL(
            destination: arguments.destination,
            origin: arguments.origin
        )
        return """
            Public-transit directions to \(arguments.destination) (opens live transit \
            in Apple Maps): \(url.absoluteString)
            Share this link with the user, and add any relevant Clipper discount or \
            paratransit tips from searchResources.
            """
    }
}
#endif
