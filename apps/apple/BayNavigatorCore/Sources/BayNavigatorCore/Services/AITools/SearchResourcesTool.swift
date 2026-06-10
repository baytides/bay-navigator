import Foundation

#if canImport(FoundationModels)
import FoundationModels

/// FoundationModels tool that lets the on-device model search the bundled corpus
/// (resources, programs, California + municipal codes) to ground its answers.
@available(iOS 26, macOS 26, visionOS 26, *)
public struct SearchResourcesTool: Tool {
    public let name = "searchResources"
    public let description = """
        Search Bay Area community resources, programs, benefits, and local/state \
        codes by keyword. Use this to ground answers in real entries; cite what it returns.
        """

    private let retrieval: LocalRetrievalService

    public init(retrieval: LocalRetrievalService) {
        self.retrieval = retrieval
    }

    @Generable
    public struct Arguments {
        @Guide(description: "What to look for, e.g. 'food bank', 'noise ordinance', 'CalFresh'")
        public var query: String

        @Guide(description: "Optional category filter, e.g. 'Food' or 'Municipal Code'")
        public var category: String?

        public init(query: String, category: String? = nil) {
            self.query = query
            self.category = category
        }
    }

    public func call(arguments: Arguments) async throws -> String {
        let hits = try retrieval.search(arguments.query, category: arguments.category, limit: 5)
        guard !hits.isEmpty else {
            return "No matching resources found for \"\(arguments.query)\"."
        }
        return hits.map { r in
            var line = "• \(r.title)"
            if !r.category.isEmpty { line += " [\(r.category)]" }
            if !r.city.isEmpty { line += " — \(r.city)" }
            if !r.body.isEmpty { line += ": \(r.body)" }
            if !r.url.isEmpty { line += " (\(r.url))" }
            return line
        }.joined(separator: "\n")
    }
}
#endif
