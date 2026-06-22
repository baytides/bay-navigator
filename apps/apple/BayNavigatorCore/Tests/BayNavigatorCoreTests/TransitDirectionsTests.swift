import Testing
import Foundation
@testable import BayNavigatorCore

struct TransitDirectionsTests {

    @Test func buildsUnifiedTransitDirectionsURL() {
        let url = TransitDirections.appleMapsURL(destination: "San Francisco International Airport")
        let s = url.absoluteString
        // Apple's documented Unified Map URL opens the native Maps app.
        #expect(s.hasPrefix("https://maps.apple.com/directions"))
        #expect(s.contains("destination="))
        // mode=transit preselects public-transit directions (MapKit can't render these in-app).
        #expect(s.contains("mode=transit"))
    }

    @Test func percentEncodesDestination() {
        let url = TransitDirections.appleMapsURL(destination: "Oakland, CA")
        let s = url.absoluteString
        // A space must not appear raw in the query.
        #expect(!s.contains("Oakland, CA"))
        #expect(s.contains("Oakland"))
    }

    @Test func omitsSourceWhenOriginNil() {
        let url = TransitDirections.appleMapsURL(destination: "SFO")
        // Omitting source makes Maps use the device's current location.
        #expect(!url.absoluteString.contains("source="))
    }

    @Test func includesSourceWhenOriginProvided() {
        let url = TransitDirections.appleMapsURL(destination: "SFO", origin: "Oakland, CA")
        #expect(url.absoluteString.contains("source="))
    }
}
