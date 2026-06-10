import Foundation

/// Mirrors the manifest.json emitted by the Phase 1 builder
/// (scripts/generate/lib/knowledge-pack.cjs buildManifest).
public struct KnowledgePackManifest: Codable, Sendable, Equatable {
    public struct FileEntry: Codable, Sendable, Equatable {
        public let sha256: String
        public let bytes: Int
    }
    public let version: Int
    public let generated: String
    public let minAppVersion: String
    public let minModelVersion: String
    public let files: [String: FileEntry]

    public init(version: Int, generated: String, minAppVersion: String, minModelVersion: String, files: [String: FileEntry]) {
        self.version = version
        self.generated = generated
        self.minAppVersion = minAppVersion
        self.minModelVersion = minModelVersion
        self.files = files
    }
}

/// Decides whether a downloaded (remote) Knowledge Pack should replace the
/// bundled baseline. A pack is adopted only if it is strictly newer AND the app
/// satisfies its minimum-app-version floor — so an OTA push can't break an old app.
public enum KnowledgePackResolver {
    public enum Choice: Sendable, Equatable { case bundled, remote }

    public static func choose(
        bundled: KnowledgePackManifest,
        remote: KnowledgePackManifest,
        appVersion: String
    ) -> Choice {
        guard remote.version > bundled.version else { return .bundled }
        guard isVersion(appVersion, atLeast: remote.minAppVersion) else { return .bundled }
        return .remote
    }

    /// Numeric component-wise semver comparison: is `version` >= `floor`?
    public static func isVersion(_ version: String, atLeast floor: String) -> Bool {
        let v = version.split(separator: ".").map { Int($0) ?? 0 }
        let f = floor.split(separator: ".").map { Int($0) ?? 0 }
        for i in 0..<max(v.count, f.count) {
            let a = i < v.count ? v[i] : 0
            let b = i < f.count ? f[i] : 0
            if a != b { return a > b }
        }
        return true // equal
    }
}
