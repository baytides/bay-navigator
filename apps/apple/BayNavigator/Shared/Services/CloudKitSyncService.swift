import Foundation
import CloudKit
import Combine
import BayNavigatorCore

// MARK: - CloudKit Sync Service

@Observable
class CloudKitSyncService {
    static let shared = CloudKitSyncService()

    // Sync state
    var isSyncing = false
    var lastSyncDate: Date?
    var syncError: Error?
    var isCloudAvailable = false

    // Private properties
    private let container: CKContainer
    private let privateDatabase: CKDatabase
    private let recordZone: CKRecordZone
    private let subscriptionID = "favorites-changes"

    private var cancellables = Set<AnyCancellable>()

    // Record types
    private let favoriteRecordType = "Favorite"
    private let userPrefsRecordType = "UserPreferences"

    init() {
        container = CKContainer(identifier: "iCloud.org.baytides.navigator")
        privateDatabase = container.privateCloudDatabase
        recordZone = CKRecordZone(zoneName: "BayNavigatorZone")

        setupCloudKit()
    }

    // MARK: - Setup

    private func setupCloudKit() {
        // Check account status
        container.accountStatus { [weak self] status, error in
            DispatchQueue.main.async {
                self?.isCloudAvailable = (status == .available)

                if status == .available {
                    self?.createZoneIfNeeded()
                    self?.subscribeToChanges()
                }
            }
        }

        // Listen for account changes
        NotificationCenter.default.publisher(for: .CKAccountChanged)
            .sink { [weak self] _ in
                self?.checkAccountStatus()
            }
            .store(in: &cancellables)
    }

    private func checkAccountStatus() {
        container.accountStatus { [weak self] status, error in
            DispatchQueue.main.async {
                self?.isCloudAvailable = (status == .available)
            }
        }
    }

    private func createZoneIfNeeded() {
        let operation = CKModifyRecordZonesOperation(recordZonesToSave: [recordZone], recordZoneIDsToDelete: nil)

        operation.modifyRecordZonesResultBlock = { result in
            switch result {
            case .success:
                print("CloudKit zone created/verified")
            case .failure(let error):
                if let ckError = error as? CKError, ckError.code == .serverRecordChanged {
                    // Zone already exists, this is fine
                } else {
                    print("Failed to create zone: \(error)")
                }
            }
        }

        privateDatabase.add(operation)
    }

    private func subscribeToChanges() {
        let subscription = CKDatabaseSubscription(subscriptionID: subscriptionID)

        let notificationInfo = CKSubscription.NotificationInfo()
        notificationInfo.shouldSendContentAvailable = true

        subscription.notificationInfo = notificationInfo

        privateDatabase.save(subscription) { _, error in
            if let error = error {
                if let ckError = error as? CKError, ckError.code == .serverRejectedRequest {
                    // Subscription already exists
                } else {
                    print("Failed to subscribe: \(error)")
                }
            }
        }
    }

    // MARK: - Favorites Sync

    func syncFavorites(_ favorites: [FavoriteItem]) async throws {
        guard isCloudAvailable else {
            throw CloudKitError.notAvailable
        }

        isSyncing = true
        defer { isSyncing = false }

        // Convert favorites to CKRecords
        let records = favorites.map { favorite -> CKRecord in
            let recordID = CKRecord.ID(recordName: favorite.programId, zoneID: recordZone.zoneID)
            let record = CKRecord(recordType: favoriteRecordType, recordID: recordID)

            record["programId"] = favorite.programId
            record["programName"] = favorite.programName
            record["category"] = favorite.category
            record["savedAt"] = favorite.savedAt
            record["status"] = favorite.status.rawValue
            record["notes"] = favorite.notes

            return record
        }

        // Save all records
        let operation = CKModifyRecordsOperation(recordsToSave: records, recordIDsToDelete: nil)
        operation.savePolicy = .changedKeys

        return try await withCheckedThrowingContinuation { continuation in
            operation.modifyRecordsResultBlock = { result in
                switch result {
                case .success:
                    DispatchQueue.main.async {
                        self.lastSyncDate = Date()
                        self.syncError = nil
                    }
                    continuation.resume()
                case .failure(let error):
                    DispatchQueue.main.async {
                        self.syncError = error
                    }
                    continuation.resume(throwing: error)
                }
            }

            privateDatabase.add(operation)
        }
    }

    func fetchFavorites() async throws -> [FavoriteItem] {
        guard isCloudAvailable else {
            throw CloudKitError.notAvailable
        }

        isSyncing = true
        defer { isSyncing = false }

        let query = CKQuery(recordType: favoriteRecordType, predicate: NSPredicate(value: true))
        query.sortDescriptors = [NSSortDescriptor(key: "savedAt", ascending: false)]

        return try await withCheckedThrowingContinuation { continuation in
            let operation = CKQueryOperation(query: query)
            operation.zoneID = recordZone.zoneID

            var favorites: [FavoriteItem] = []

            operation.recordMatchedBlock = { recordID, result in
                switch result {
                case .success(let record):
                    if let favorite = self.favoriteFromRecord(record) {
                        favorites.append(favorite)
                    }
                case .failure(let error):
                    print("Failed to fetch record: \(error)")
                }
            }

            operation.queryResultBlock = { result in
                switch result {
                case .success:
                    DispatchQueue.main.async {
                        self.lastSyncDate = Date()
                        self.syncError = nil
                    }
                    continuation.resume(returning: favorites)
                case .failure(let error):
                    DispatchQueue.main.async {
                        self.syncError = error
                    }
                    continuation.resume(throwing: error)
                }
            }

            privateDatabase.add(operation)
        }
    }

    func deleteFavorite(programId: String) async throws {
        guard isCloudAvailable else {
            throw CloudKitError.notAvailable
        }

        let recordID = CKRecord.ID(recordName: programId, zoneID: recordZone.zoneID)

        return try await withCheckedThrowingContinuation { continuation in
            privateDatabase.delete(withRecordID: recordID) { _, error in
                if let error = error {
                    if let ckError = error as? CKError, ckError.code == .unknownItem {
                        // Record doesn't exist, that's fine
                        continuation.resume()
                    } else {
                        continuation.resume(throwing: error)
                    }
                } else {
                    continuation.resume()
                }
            }
        }
    }

    // MARK: - User Preferences Sync

    func syncUserPreferences(_ prefs: UserPreferences) async throws {
        guard isCloudAvailable else {
            throw CloudKitError.notAvailable
        }

        let recordID = CKRecord.ID(recordName: "userPrefs", zoneID: recordZone.zoneID)
        let record = CKRecord(recordType: userPrefsRecordType, recordID: recordID)

        record["selectedCounty"] = prefs.selectedCounty
        record["selectedGroups"] = Array(prefs.selectedGroups)
        record["selectedCategories"] = Array(prefs.selectedCategories)
        record["hasCompletedOnboarding"] = prefs.hasCompletedOnboarding
        record["themeMode"] = prefs.themeMode
        record["locale"] = prefs.locale
        record["aiSearchEnabled"] = prefs.aiSearchEnabled

        return try await withCheckedThrowingContinuation { continuation in
            privateDatabase.save(record) { _, error in
                if let error = error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume()
                }
            }
        }
    }

    func fetchUserPreferences() async throws -> UserPreferences? {
        guard isCloudAvailable else {
            throw CloudKitError.notAvailable
        }

        let recordID = CKRecord.ID(recordName: "userPrefs", zoneID: recordZone.zoneID)

        return try await withCheckedThrowingContinuation { continuation in
            privateDatabase.fetch(withRecordID: recordID) { record, error in
                if let error = error {
                    if let ckError = error as? CKError, ckError.code == .unknownItem {
                        continuation.resume(returning: nil)
                    } else {
                        continuation.resume(throwing: error)
                    }
                } else if let record = record {
                    let prefs = UserPreferences(
                        selectedCounty: record["selectedCounty"] as? String,
                        selectedGroups: Set(record["selectedGroups"] as? [String] ?? []),
                        selectedCategories: Set(record["selectedCategories"] as? [String] ?? []),
                        hasCompletedOnboarding: record["hasCompletedOnboarding"] as? Bool ?? false,
                        themeMode: record["themeMode"] as? String ?? "system",
                        locale: record["locale"] as? String ?? "en",
                        aiSearchEnabled: record["aiSearchEnabled"] as? Bool ?? true
                    )
                    continuation.resume(returning: prefs)
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }

    // MARK: - Conflict Resolution

    func resolveConflicts(local: [FavoriteItem], remote: [FavoriteItem]) -> [FavoriteItem] {
        var merged: [String: FavoriteItem] = [:]

        // Add all remote items
        for item in remote {
            merged[item.programId] = item
        }

        // Merge local items, keeping newer versions
        for item in local {
            if let existing = merged[item.programId] {
                if item.savedAt > existing.savedAt {
                    merged[item.programId] = item
                }
            } else {
                merged[item.programId] = item
            }
        }

        return Array(merged.values).sorted { $0.savedAt > $1.savedAt }
    }

    // MARK: - Helpers

    private func favoriteFromRecord(_ record: CKRecord) -> FavoriteItem? {
        guard let programId = record["programId"] as? String,
              let programName = record["programName"] as? String,
              let category = record["category"] as? String,
              let savedAt = record["savedAt"] as? Date else {
            return nil
        }

        let statusString = record["status"] as? String ?? "saved"
        let status = FavoriteStatus(rawValue: statusString) ?? .saved

        return FavoriteItem(
            programId: programId,
            programName: programName,
            category: category,
            savedAt: savedAt,
            status: status,
            notes: record["notes"] as? String
        )
    }
}

// MARK: - Supporting Types

struct UserPreferences: Codable {
    var selectedCounty: String?
    var selectedGroups: Set<String>
    var selectedCategories: Set<String>
    var hasCompletedOnboarding: Bool
    var themeMode: String
    var locale: String
    var aiSearchEnabled: Bool
}

enum CloudKitError: Error, LocalizedError {
    case notAvailable
    case syncFailed
    case quotaExceeded

    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "iCloud is not available. Please sign in to iCloud in Settings."
        case .syncFailed:
            return "Failed to sync with iCloud. Please try again later."
        case .quotaExceeded:
            return "iCloud storage is full. Please free up space."
        }
    }
}

// MARK: - Sync Manager (Combines Local + Cloud)

@Observable
class SyncManager {
    static let shared = SyncManager()

    private let cloudKit = CloudKitSyncService.shared
    private let localStorage = UserDefaults(suiteName: "group.org.baytides.navigator")

    var syncStatus: SyncStatus = .idle
    var lastSyncTime: Date?

    enum SyncStatus {
        case idle
        case syncing
        case success
        case failed(Error)
    }

    // Perform full sync
    func performSync() async {
        guard cloudKit.isCloudAvailable else {
            syncStatus = .failed(CloudKitError.notAvailable)
            return
        }

        syncStatus = .syncing

        do {
            // Fetch remote favorites
            let remoteFavorites = try await cloudKit.fetchFavorites()

            // Get local favorites
            let localFavorites = loadLocalFavorites()

            // Merge with conflict resolution
            let merged = cloudKit.resolveConflicts(local: localFavorites, remote: remoteFavorites)

            // Save merged to both local and cloud
            saveLocalFavorites(merged)
            try await cloudKit.syncFavorites(merged)

            syncStatus = .success
            lastSyncTime = Date()

            // Update widgets
            WidgetDataSync.shared.syncFavoriteChange(programId: "", isFavorite: true)

        } catch {
            syncStatus = .failed(error)
        }
    }

    // Save single favorite (auto-syncs)
    func saveFavorite(_ favorite: FavoriteItem) async {
        // Save locally first
        var favorites = loadLocalFavorites()
        favorites.removeAll { $0.programId == favorite.programId }
        favorites.insert(favorite, at: 0)
        saveLocalFavorites(favorites)

        // Sync to cloud
        if cloudKit.isCloudAvailable {
            try? await cloudKit.syncFavorites([favorite])
        }
    }

    // Remove favorite
    func removeFavorite(programId: String) async {
        // Remove locally
        var favorites = loadLocalFavorites()
        favorites.removeAll { $0.programId == programId }
        saveLocalFavorites(favorites)

        // Remove from cloud
        if cloudKit.isCloudAvailable {
            try? await cloudKit.deleteFavorite(programId: programId)
        }
    }

    // MARK: - Local Storage

    private func loadLocalFavorites() -> [FavoriteItem] {
        guard let data = localStorage?.data(forKey: "favorites"),
              let favorites = try? JSONDecoder().decode([FavoriteItem].self, from: data) else {
            return []
        }
        return favorites
    }

    private func saveLocalFavorites(_ favorites: [FavoriteItem]) {
        if let data = try? JSONEncoder().encode(favorites) {
            localStorage?.set(data, forKey: "favorites")
        }
    }
}
