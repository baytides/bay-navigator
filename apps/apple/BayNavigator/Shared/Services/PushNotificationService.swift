import Foundation
import UserNotifications
import BayNavigatorCore
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Push Notification Service

/// Handles remote push notification registration with Azure Notification Hubs
@Observable
final class PushNotificationService: NSObject, Sendable {
    static let shared = PushNotificationService()

    // MARK: - Configuration

    private static let registerEndpoint = "https://baynavigator-functions.azurewebsites.net/api/push-register"

    // MARK: - State

    private(set) var deviceToken: String?
    private(set) var isRegistered = false
    private(set) var registrationError: String?

    // User preferences (synced with backend)
    @MainActor var pushEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "pushNotificationsEnabled") }
        set {
            UserDefaults.standard.set(newValue, forKey: "pushNotificationsEnabled")
            if newValue {
                Task { await registerWithBackend() }
            } else {
                Task { await unregisterFromBackend() }
            }
        }
    }

    @MainActor var weatherAlertsEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "weatherAlertsEnabled") }
        set {
            UserDefaults.standard.set(newValue, forKey: "weatherAlertsEnabled")
            Task { await updatePreferencesOnBackend() }
        }
    }

    @MainActor var programUpdatesEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "programUpdatesEnabled") }
        set {
            UserDefaults.standard.set(newValue, forKey: "programUpdatesEnabled")
            Task { await updatePreferencesOnBackend() }
        }
    }

    @MainActor var announcementsEnabled: Bool {
        get { UserDefaults.standard.bool(forKey: "announcementsEnabled") }
        set {
            UserDefaults.standard.set(newValue, forKey: "announcementsEnabled")
            Task { await updatePreferencesOnBackend() }
        }
    }

    @MainActor var weatherCounties: [String] {
        get { UserDefaults.standard.stringArray(forKey: "weatherCounties") ?? [] }
        set {
            UserDefaults.standard.set(newValue, forKey: "weatherCounties")
            Task { await updatePreferencesOnBackend() }
        }
    }

    private var installationId: String {
        if let existing = UserDefaults.standard.string(forKey: "pushInstallationId") {
            return existing
        }
        let newId = UUID().uuidString
        UserDefaults.standard.set(newId, forKey: "pushInstallationId")
        return newId
    }

    // MARK: - Initialization

    override init() {
        super.init()
        // Set default preferences on first launch
        if UserDefaults.standard.object(forKey: "pushNotificationsEnabled") == nil {
            UserDefaults.standard.set(true, forKey: "pushNotificationsEnabled")
            UserDefaults.standard.set(true, forKey: "weatherAlertsEnabled")
            UserDefaults.standard.set(true, forKey: "programUpdatesEnabled")
            UserDefaults.standard.set(true, forKey: "announcementsEnabled")
        }
    }

    // MARK: - APNs Registration

    /// Request permission and register for remote notifications
    @MainActor
    func requestPushAuthorization() async -> Bool {
        let center = UNUserNotificationCenter.current()

        do {
            let options: UNAuthorizationOptions = [.alert, .badge, .sound]
            let granted = try await center.requestAuthorization(options: options)

            if granted {
                // Register for remote notifications on main thread
                #if os(iOS)
                UIApplication.shared.registerForRemoteNotifications()
                #elseif os(macOS)
                NSApplication.shared.registerForRemoteNotifications()
                #endif
            }

            return granted
        } catch {
            print("Push authorization failed: \(error)")
            return false
        }
    }

    /// Called when APNs registration succeeds
    func didRegisterForRemoteNotifications(deviceToken: Data) {
        let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString
        print("APNs device token: \(tokenString)")

        Task {
            await registerWithBackend()
        }
    }

    /// Called when APNs registration fails
    func didFailToRegisterForRemoteNotifications(error: Error) {
        print("Failed to register for remote notifications: \(error)")
        registrationError = error.localizedDescription
    }

    // MARK: - Backend Registration

    /// Register device token with Azure Notification Hub backend
    private func registerWithBackend() async {
        guard let token = deviceToken else {
            print("No device token available for registration")
            return
        }

        let preferences = await getPreferences()

        let payload: [String: Any] = [
            "platform": "ios",
            "token": token,
            "installationId": installationId,
            "preferences": preferences
        ]

        do {
            guard let url = URL(string: Self.registerEndpoint) else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)

            let (data, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                if let result = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let success = result["success"] as? Bool,
                   success {
                    await MainActor.run {
                        self.isRegistered = true
                        self.registrationError = nil
                    }
                    print("Successfully registered with push backend")
                }
            } else {
                await MainActor.run {
                    self.registrationError = "Registration failed"
                }
            }
        } catch {
            print("Backend registration error: \(error)")
            await MainActor.run {
                self.registrationError = error.localizedDescription
            }
        }
    }

    /// Unregister device from backend
    private func unregisterFromBackend() async {
        guard let token = deviceToken else { return }

        let payload: [String: Any] = [
            "platform": "ios",
            "token": token
        ]

        do {
            guard let url = URL(string: Self.registerEndpoint) else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "DELETE"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)

            let (_, response) = try await URLSession.shared.data(for: request)

            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                await MainActor.run {
                    self.isRegistered = false
                }
                print("Successfully unregistered from push backend")
            }
        } catch {
            print("Backend unregistration error: \(error)")
        }
    }

    /// Update preferences on backend
    private func updatePreferencesOnBackend() async {
        guard isRegistered, let token = deviceToken else { return }

        let preferences = await getPreferences()

        let payload: [String: Any] = [
            "platform": "ios",
            "token": token,
            "installationId": installationId,
            "preferences": preferences
        ]

        do {
            guard let url = URL(string: Self.registerEndpoint) else { return }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)

            let (_, _) = try await URLSession.shared.data(for: request)
            print("Preferences updated on backend")
        } catch {
            print("Failed to update preferences: \(error)")
        }
    }

    @MainActor
    private func getPreferences() -> [String: Any] {
        return [
            "weatherAlerts": weatherAlertsEnabled,
            "weatherCounties": weatherCounties,
            "programUpdates": programUpdatesEnabled,
            "announcements": announcementsEnabled
        ]
    }

    // MARK: - Push Notification Handling

    /// Handle received remote notification
    func didReceiveRemoteNotification(
        userInfo: [AnyHashable: Any],
        fetchCompletionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        print("Received remote notification: \(userInfo)")

        // Parse notification data
        guard let aps = userInfo["aps"] as? [String: Any] else {
            fetchCompletionHandler(.noData)
            return
        }

        // Handle silent notifications for data sync
        if let contentAvailable = aps["content-available"] as? Int, contentAvailable == 1 {
            handleSilentNotification(userInfo: userInfo, completion: fetchCompletionHandler)
            return
        }

        // Regular notification - will be displayed by system
        fetchCompletionHandler(.newData)
    }

    /// Handle silent background notifications
    private func handleSilentNotification(
        userInfo: [AnyHashable: Any],
        completion: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        guard let type = userInfo["type"] as? String else {
            completion(.noData)
            return
        }

        switch type {
        case "program_update":
            // Trigger background refresh of programs
            NotificationCenter.default.post(name: .refreshPrograms, object: nil)
            completion(.newData)

        case "badge_update":
            if let badgeCount = userInfo["badge"] as? Int {
                Task { @MainActor in
                    UNUserNotificationCenter.current().setBadgeCount(badgeCount)
                }
            }
            completion(.newData)

        default:
            completion(.noData)
        }
    }

    /// Handle notification tap/action
    func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo

        guard let type = userInfo["type"] as? String else { return }

        switch type {
        case "weather":
            // Navigate to map view
            if let url = userInfo["url"] as? String {
                NotificationCenter.default.post(
                    name: .openURL,
                    object: nil,
                    userInfo: ["url": url]
                )
            } else {
                NotificationCenter.default.post(name: .openMap, object: nil)
            }

        case "program":
            // Navigate to program detail
            if let programId = userInfo["programId"] as? String {
                NotificationCenter.default.post(
                    name: .openProgram,
                    object: nil,
                    userInfo: ["programId": programId]
                )
            } else {
                NotificationCenter.default.post(name: .openDirectory, object: nil)
            }

        case "status":
            // Navigate to favorites/saved programs
            if let programId = userInfo["programId"] as? String {
                NotificationCenter.default.post(
                    name: .openFavorite,
                    object: nil,
                    userInfo: ["programId": programId]
                )
            }

        case "announcement":
            // Navigate to specified URL or home
            if let url = userInfo["url"] as? String {
                NotificationCenter.default.post(
                    name: .openURL,
                    object: nil,
                    userInfo: ["url": url]
                )
            }

        default:
            break
        }
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let refreshPrograms = Notification.Name("refreshPrograms")
    static let openMap = Notification.Name("openMap")
    static let openFavorite = Notification.Name("openFavorite")
    static let openURL = Notification.Name("openURL")
}

// MARK: - Push Settings View

import SwiftUI

struct PushNotificationSettingsView: View {
    @State private var pushService = PushNotificationService.shared
    @State private var showCountyPicker = false

    // Bay Area counties for weather alerts
    private let bayAreaCounties = [
        ("san-francisco", "San Francisco"),
        ("alameda-county", "Alameda County"),
        ("contra-costa-county", "Contra Costa County"),
        ("marin-county", "Marin County"),
        ("san-mateo-county", "San Mateo County"),
        ("santa-clara-county", "Santa Clara County"),
        ("napa-county", "Napa County"),
        ("solano-county", "Solano County"),
        ("sonoma-county", "Sonoma County")
    ]

    var body: some View {
        Form {
            Section {
                Toggle("Push Notifications", isOn: Binding(
                    get: { pushService.pushEnabled },
                    set: { newValue in
                        Task { @MainActor in
                            if newValue {
                                let granted = await pushService.requestPushAuthorization()
                                if granted {
                                    pushService.pushEnabled = true
                                }
                            } else {
                                pushService.pushEnabled = false
                            }
                        }
                    }
                ))

                if pushService.isRegistered {
                    Label("Registered", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                        .font(.caption)
                } else if let error = pushService.registrationError {
                    Label(error, systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                        .font(.caption)
                }
            } header: {
                Text("Push Notifications")
            } footer: {
                Text("Receive alerts even when the app is closed.")
            }

            if pushService.pushEnabled {
                Section {
                    Toggle("Program Updates", isOn: Binding(
                        get: { pushService.programUpdatesEnabled },
                        set: { pushService.programUpdatesEnabled = $0 }
                    ))

                    Toggle("Announcements", isOn: Binding(
                        get: { pushService.announcementsEnabled },
                        set: { pushService.announcementsEnabled = $0 }
                    ))
                } header: {
                    Text("Notification Types")
                }

                Section {
                    Toggle("Weather Alerts", isOn: Binding(
                        get: { pushService.weatherAlertsEnabled },
                        set: { pushService.weatherAlertsEnabled = $0 }
                    ))

                    if pushService.weatherAlertsEnabled {
                        Button {
                            showCountyPicker = true
                        } label: {
                            HStack {
                                Text("Counties")
                                Spacer()
                                Text(countySelectionText)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                } header: {
                    Text("Weather Alerts")
                } footer: {
                    Text("Get notified about severe weather in your selected counties.")
                }
            }
        }
        .navigationTitle("Push Notifications")
        .sheet(isPresented: $showCountyPicker) {
            NavigationStack {
                CountyPickerView(
                    counties: bayAreaCounties,
                    selectedCounties: Binding(
                        get: { Set(pushService.weatherCounties) },
                        set: { pushService.weatherCounties = Array($0) }
                    )
                )
            }
        }
    }

    private var countySelectionText: String {
        let count = pushService.weatherCounties.count
        if count == 0 {
            return "None"
        } else if count == bayAreaCounties.count {
            return "All"
        } else {
            return "\(count) selected"
        }
    }
}

// MARK: - County Picker

private struct CountyPickerView: View {
    let counties: [(id: String, name: String)]
    @Binding var selectedCounties: Set<String>
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        List {
            Section {
                Button("Select All") {
                    selectedCounties = Set(counties.map { $0.id })
                }

                Button("Clear All") {
                    selectedCounties.removeAll()
                }
            }

            Section {
                ForEach(counties, id: \.id) { county in
                    Button {
                        if selectedCounties.contains(county.id) {
                            selectedCounties.remove(county.id)
                        } else {
                            selectedCounties.insert(county.id)
                        }
                    } label: {
                        HStack {
                            Text(county.name)
                            Spacer()
                            if selectedCounties.contains(county.id) {
                                Image(systemName: "checkmark")
                                    .foregroundStyle(.blue)
                            }
                        }
                    }
                    .foregroundStyle(.primary)
                }
            } header: {
                Text("Bay Area Counties")
            }
        }
        .navigationTitle("Select Counties")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") {
                    dismiss()
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        PushNotificationSettingsView()
    }
}
