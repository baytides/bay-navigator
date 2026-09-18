import CryptoKit
import Foundation

/// Downloads, verifies and stores the ordinance packs someone chose.
///
/// Every pack is hash-checked against the manifest before it is installed. These
/// files are municipal law that Carl will quote as authoritative, and a silently
/// truncated download would not look broken — it would look like an ordinance
/// that simply doesn't mention the thing you asked about.
public actor OrdinancePackStore {
    public struct Progress: Sendable, Equatable {
        public let completed: Int
        public let total: Int
        public let bytesWritten: Int
        public let currentSlug: String
    }

    public enum StoreError: Error, Equatable {
        case notInCatalog(String)
        case hashMismatch(slug: String, expected: String, actual: String)
        case downloadFailed(slug: String, status: Int)
    }

    private let root: URL
    private let session: URLSession
    private let fileManager: FileManager

    /// - Parameter root: the pack directory on device; packs land in `root/ordinances/`.
    public init(root: URL, session: URLSession = .shared, fileManager: FileManager = .default) {
        self.root = root
        self.session = session
        self.fileManager = fileManager
    }

    public func installedSlugs(in catalog: OrdinanceCatalog) -> Set<String> {
        var out: Set<String> = []
        for (slug, j) in catalog.jurisdictions
        where fileManager.fileExists(atPath: root.appendingPathComponent(j.file).path) {
            out.insert(slug)
        }
        return out
    }

    /// Fetch every pack in `plan` that isn't already installed.
    ///
    /// One pack failing does not abandon the rest: someone who asked for a whole
    /// county and hit one bad file should end up with the rest of their county,
    /// not nothing. Failures are returned so the UI can say which cities are
    /// missing instead of quietly showing fewer.
    @discardableResult
    public func download(
        plan: OrdinanceDownloadPlan,
        from baseURL: URL,
        catalog: OrdinanceCatalog,
        onProgress: (@Sendable (Progress) -> Void)? = nil
    ) async -> [String: Error] {
        var failures: [String: Error] = [:]
        var completed = 0
        var bytes = 0

        for slug in plan.slugs {
            guard let entry = catalog.jurisdictions[slug] else {
                failures[slug] = StoreError.notInCatalog(slug)
                continue
            }
            let destination = root.appendingPathComponent(entry.file)
            if fileManager.fileExists(atPath: destination.path) {
                completed += 1
                bytes += entry.bytes
                onProgress?(
                    Progress(
                        completed: completed, total: plan.slugs.count, bytesWritten: bytes,
                        currentSlug: slug))
                continue
            }
            do {
                try await fetch(entry: entry, slug: slug, from: baseURL, to: destination)
                completed += 1
                bytes += entry.bytes
            } catch {
                failures[slug] = error
            }
            onProgress?(
                Progress(
                    completed: completed, total: plan.slugs.count, bytesWritten: bytes,
                    currentSlug: slug))
        }
        return failures
    }

    private func fetch(
        entry: OrdinanceCatalog.Jurisdiction, slug: String, from baseURL: URL, to destination: URL
    ) async throws {
        let url = baseURL.appendingPathComponent(entry.file)
        let (data, response) = try await session.data(from: url)
        if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
            throw StoreError.downloadFailed(slug: slug, status: http.statusCode)
        }

        let digest = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        guard digest == entry.sha256 else {
            throw StoreError.hashMismatch(slug: slug, expected: entry.sha256, actual: digest)
        }

        try fileManager.createDirectory(
            at: destination.deletingLastPathComponent(), withIntermediateDirectories: true)
        // Write beside the target and move, so a pack is never half-visible to a
        // retrieval query running at the same time.
        let temp = destination.appendingPathExtension("part")
        try? fileManager.removeItem(at: temp)
        try data.write(to: temp, options: .atomic)
        try? fileManager.removeItem(at: destination)
        try fileManager.moveItem(at: temp, to: destination)
    }

    /// Remove packs outside the current choice. Called when someone narrows their
    /// selection — downloading a county then dropping back to one city should
    /// actually give the storage back.
    @discardableResult
    public func prune(keeping plan: OrdinanceDownloadPlan, catalog: OrdinanceCatalog) -> [String] {
        let keep = Set(plan.slugs)
        var removed: [String] = []
        for (slug, j) in catalog.jurisdictions where !keep.contains(slug) {
            let url = root.appendingPathComponent(j.file)
            if fileManager.fileExists(atPath: url.path), (try? fileManager.removeItem(at: url)) != nil {
                removed.append(slug)
            }
        }
        return removed.sorted()
    }

    /// Bytes currently used by installed packs, for a "free up space" line.
    public func bytesOnDisk(catalog: OrdinanceCatalog) -> Int {
        installedSlugs(in: catalog).reduce(0) { $0 + (catalog.jurisdictions[$1]?.bytes ?? 0) }
    }
}
