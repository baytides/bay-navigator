import Testing
@testable import BayNavigatorCore

struct KnowledgePackResolverTests {

    private func manifest(_ version: Int, minApp: String = "0.0.0", minModel: String = "0") -> KnowledgePackManifest {
        KnowledgePackManifest(version: version, generated: "", minAppVersion: minApp, minModelVersion: minModel, files: [:])
    }

    @Test func prefersNewerCompatibleRemote() {
        let choice = KnowledgePackResolver.choose(
            bundled: manifest(20260101),
            remote: manifest(20260601, minApp: "2.0.0"),
            appVersion: "2.0.0"
        )
        #expect(choice == .remote)
    }

    @Test func keepsBundledWhenRemoteIsOlderOrEqual() {
        #expect(KnowledgePackResolver.choose(bundled: manifest(20260601), remote: manifest(20260101), appVersion: "9.9.9") == .bundled)
        #expect(KnowledgePackResolver.choose(bundled: manifest(20260601), remote: manifest(20260601), appVersion: "9.9.9") == .bundled)
    }

    @Test func keepsBundledWhenAppTooOldForRemote() {
        let choice = KnowledgePackResolver.choose(
            bundled: manifest(20260101),
            remote: manifest(20260601, minApp: "3.0.0"),
            appVersion: "2.1.0"
        )
        #expect(choice == .bundled)
    }

    @Test func semverComparisonHandlesMultiDigitComponents() {
        #expect(KnowledgePackResolver.isVersion("2.10.0", atLeast: "2.9.0"))
        #expect(!KnowledgePackResolver.isVersion("2.9.0", atLeast: "2.10.0"))
        #expect(KnowledgePackResolver.isVersion("2.0.0", atLeast: "2.0.0"))
    }
}
