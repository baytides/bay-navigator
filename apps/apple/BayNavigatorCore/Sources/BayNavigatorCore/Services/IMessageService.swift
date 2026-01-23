import Foundation
#if os(iOS)
import UIKit
#endif

/// Service for syncing saved programs to the iMessage extension via App Groups
/// Uses shared UserDefaults with App Group to communicate with the iMessage extension
public final class IMessageService: Sendable {
    public static let shared = IMessageService()

    /// App Group identifier - must match the one in your provisioning profile and entitlements
    private let appGroupIdentifier = "group.org.baytides.navigator"

    /// UserDefaults key for shared favorites
    private let favoritesKey = "shared_favorites"

    private init() {}

    /// Get shared UserDefaults for App Group
    private var sharedDefaults: UserDefaults? {
        UserDefaults(suiteName: appGroupIdentifier)
    }

    /// Sync favorite programs to the iMessage extension
    /// Only works on iOS, no-op on other platforms
    public func syncFavorites(_ favorites: [Program]) {
        #if os(iOS)
        guard let defaults = sharedDefaults else {
            print("[IMessageService] Failed to access App Group UserDefaults")
            return
        }

        // Convert programs to shareable format
        let programsData = favorites.map { program -> [String: Any] in
            [
                "id": program.id,
                "name": program.name,
                "category": program.category,
                "description": program.description,
                "website": program.website ?? "",
                "phone": program.phone ?? "",
                "email": program.email ?? ""
            ]
        }

        // Save to shared UserDefaults
        defaults.set(programsData, forKey: favoritesKey)
        defaults.synchronize()

        print("[IMessageService] Synced \(favorites.count) favorites to iMessage extension")
        #endif
    }

    /// Get favorites from shared storage (for use in iMessage extension)
    public func getFavoritesFromSharedStorage() -> [[String: Any]] {
        guard let defaults = sharedDefaults else { return [] }
        return defaults.array(forKey: favoritesKey) as? [[String: Any]] ?? []
    }

    /// Clear shared favorites
    public func clearSharedFavorites() {
        sharedDefaults?.removeObject(forKey: favoritesKey)
        sharedDefaults?.synchronize()
    }

    /// Check if App Group is properly configured
    public var isAppGroupAvailable: Bool {
        sharedDefaults != nil
    }
}

// MARK: - IMessage Shareable Program

/// Simplified program data for sharing via iMessage
public struct IMessageShareableProgram: Codable, Identifiable, Sendable {
    public let id: String
    public let name: String
    public let category: String
    public let description: String
    public let website: String
    public let phone: String
    public let email: String

    public init(from program: Program) {
        self.id = program.id
        self.name = program.name
        self.category = program.category
        self.description = program.description
        self.website = program.website ?? ""
        self.phone = program.phone ?? ""
        self.email = program.email ?? ""
    }

    public init(from dictionary: [String: Any]) {
        self.id = dictionary["id"] as? String ?? ""
        self.name = dictionary["name"] as? String ?? ""
        self.category = dictionary["category"] as? String ?? ""
        self.description = dictionary["description"] as? String ?? ""
        self.website = dictionary["website"] as? String ?? ""
        self.phone = dictionary["phone"] as? String ?? ""
        self.email = dictionary["email"] as? String ?? ""
    }

    /// Generate share text for the program
    public var shareText: String {
        var text = "\(name)\n\(category)\n\n\(description)"

        if !website.isEmpty {
            text += "\n\nWebsite: \(website)"
        }
        if !phone.isEmpty {
            text += "\nPhone: \(phone)"
        }
        if !email.isEmpty {
            text += "\nEmail: \(email)"
        }

        text += "\n\n📱 Shared via Bay Navigator"

        return text
    }
}
