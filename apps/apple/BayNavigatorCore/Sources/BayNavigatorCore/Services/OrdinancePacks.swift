import Foundation

/// The catalog of downloadable municipal-ordinance packs, as published in
/// manifest.json by `buildOrdinanceCatalog` in
/// scripts/generate/lib/knowledge-pack.cjs.
///
/// Ordinances are NOT in the bundled corpus. Someone in Oakland should not have
/// to carry Sonoma County's parking rules to ask about their own street, so each
/// jurisdiction is a separate pack and people choose how much they want:
/// their city, their county, or the whole Bay Area.
public struct OrdinanceCatalog: Codable, Sendable, Equatable {
    public struct Jurisdiction: Codable, Sendable, Equatable {
        public let name: String
        public let county: String
        public let type: String
        /// Path relative to the pack root, e.g. "ordinances/oakland.sqlite".
        public let file: String
        public let sha256: String
        public let bytes: Int
        public let sections: Int
    }

    /// A county rollup, or the whole-Bay-Area rollup (which has no name).
    public struct Tier: Codable, Sendable, Equatable {
        public let name: String?
        public let jurisdictions: [String]
        public let bytes: Int
        public let sections: Int
        /// How many of this tier's jurisdictions actually have a pack...
        public let available: Int
        /// ...out of how many exist. Coverage is partial, and a picker that
        /// said "Alameda County" without saying 3 of 15 cities are in there
        /// would promise more than it delivers.
        public let total: Int
    }

    public let dir: String
    public let jurisdictions: [String: Jurisdiction]
    public let counties: [String: Tier]
    public let all: Tier
}

/// What someone picked in the download screen.
public enum OrdinanceChoice: Sendable, Equatable {
    /// Ordinances stay off the device; Carl answers from the core corpus and
    /// says plainly that it cannot check local law offline.
    case none
    case city(String)
    case county(String)
    case entireBayArea
}

/// The concrete work a choice implies: which packs to fetch, and how big that is.
public struct OrdinanceDownloadPlan: Sendable, Equatable {
    public let slugs: [String]
    public let files: [String]
    public let bytes: Int
    public var isEmpty: Bool { slugs.isEmpty }
}

extension OrdinanceCatalog {
    /// Slug for a jurisdiction or county name. Must match `slugifyJurisdiction`
    /// in the JS builder, since these slugs are the pack filenames.
    public static func slugify(_ name: String) -> String {
        var out = ""
        var lastWasDash = false
        for ch in name.lowercased() {
            if ch.isLetter || ch.isNumber, ch.isASCII {
                out.append(ch)
                lastWasDash = false
            } else if !lastWasDash {
                out.append("-")
                lastWasDash = true
            }
        }
        while out.hasPrefix("-") { out.removeFirst() }
        while out.hasSuffix("-") { out.removeLast() }
        return out
    }

    /// The county tier containing a given city, so "my county" can be offered
    /// without asking someone which county they live in — a question plenty of
    /// people can't answer off the top of their head.
    public func countySlug(forCity city: String) -> String? {
        let slug = Self.slugify(city)
        guard let j = jurisdictions[slug], !j.county.isEmpty else { return nil }
        let key = Self.slugify(j.county)
        return counties[key] != nil ? key : nil
    }

    /// Resolve a choice into the packs to download.
    ///
    /// Unknown slugs resolve to an empty plan rather than a partial one: if a
    /// city has no pack yet, the honest answer is "nothing to download", not a
    /// silent download of something else.
    public func plan(for choice: OrdinanceChoice) -> OrdinanceDownloadPlan {
        let slugs: [String]
        switch choice {
        case .none:
            slugs = []
        case .city(let slug):
            slugs = jurisdictions[slug] != nil ? [slug] : []
        case .county(let slug):
            slugs = counties[slug]?.jurisdictions ?? []
        case .entireBayArea:
            slugs = all.jurisdictions
        }
        let known = slugs.compactMap { jurisdictions[$0] != nil ? $0 : nil }
        return OrdinanceDownloadPlan(
            slugs: known,
            files: known.compactMap { jurisdictions[$0]?.file },
            bytes: known.reduce(0) { $0 + (jurisdictions[$1]?.bytes ?? 0) }
        )
    }

    /// Packs already on disk that the catalog still lists — what the retrieval
    /// layer should attach. A pack removed from the catalog upstream is skipped
    /// rather than attached blind.
    public func installedFiles(in root: URL, fileManager: FileManager = .default) -> [URL] {
        jurisdictions.values
            .map { root.appendingPathComponent($0.file) }
            .filter { fileManager.fileExists(atPath: $0.path) }
            .sorted { $0.path < $1.path }
    }
}
