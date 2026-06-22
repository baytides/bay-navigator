import Testing
import Foundation
@testable import BayNavigatorCore

struct TransitDirectionsToolTests {

    @Test func returnsTransitHandoffLinkForDestination() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let tool = TransitDirectionsTool()
        let output = try await tool.call(arguments: .init(destination: "San Francisco International Airport"))
        #expect(output.contains("https://maps.apple.com/directions"))
        #expect(output.contains("mode=transit"))
        #expect(output.contains("San Francisco International Airport") || output.contains("San%20Francisco"))
    }

    @Test func passesOriginThroughToLink() async throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let tool = TransitDirectionsTool()
        let output = try await tool.call(arguments: .init(destination: "SFO", origin: "Oakland, CA"))
        #expect(output.contains("source="))
    }

    @Test func exposesNameAndDescription() throws {
        guard #available(iOS 26, macOS 26, visionOS 26, *) else { return }
        let tool = TransitDirectionsTool()
        #expect(tool.name == "transitDirections")
        #expect(!tool.description.isEmpty)
    }
}
