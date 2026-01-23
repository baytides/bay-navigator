import Foundation
import UserNotifications
#if canImport(UIKit)
import UIKit
#endif

// MARK: - Notification Service

@Observable
class NotificationService: NSObject {
    static let shared = NotificationService()

    var isAuthorized = false
    var pendingNotifications: [UNNotificationRequest] = []

    private let center = UNUserNotificationCenter.current()

    override init() {
        super.init()
        center.delegate = self
        checkAuthorizationStatus()
    }

    // MARK: - Authorization

    func requestAuthorization() async -> Bool {
        do {
            let options: UNAuthorizationOptions = [.alert, .badge, .sound, .provisional]
            let granted = try await center.requestAuthorization(options: options)
            await MainActor.run {
                isAuthorized = granted
            }
            return granted
        } catch {
            print("Notification authorization failed: \(error)")
            return false
        }
    }

    func checkAuthorizationStatus() {
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.isAuthorized = settings.authorizationStatus == .authorized ||
                                     settings.authorizationStatus == .provisional
            }
        }
    }

    // MARK: - Program Notifications

    /// Schedule a reminder for a program deadline
    func scheduleDeadlineReminder(
        programId: String,
        programName: String,
        deadline: Date,
        daysBeforeReminder: Int = 3
    ) {
        guard isAuthorized else { return }

        let reminderDate = Calendar.current.date(byAdding: .day, value: -daysBeforeReminder, to: deadline)!

        // Don't schedule if reminder date is in the past
        guard reminderDate > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Deadline Approaching"
        content.body = "\(programName) deadline is in \(daysBeforeReminder) days. Don't miss out!"
        content.sound = .default
        content.badge = 1
        content.categoryIdentifier = NotificationCategory.deadline.rawValue
        content.userInfo = [
            "programId": programId,
            "type": "deadline"
        ]

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour], from: reminderDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "deadline-\(programId)",
            content: content,
            trigger: trigger
        )

        center.add(request) { error in
            if let error = error {
                print("Failed to schedule deadline notification: \(error)")
            }
        }
    }

    /// Schedule a follow-up reminder for an application
    func scheduleFollowUpReminder(
        programId: String,
        programName: String,
        followUpDate: Date
    ) {
        guard isAuthorized else { return }

        let content = UNMutableNotificationContent()
        content.title = "Time to Follow Up"
        content.body = "Check on your \(programName) application status"
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.followUp.rawValue
        content.userInfo = [
            "programId": programId,
            "type": "followUp"
        ]

        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: followUpDate)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "followup-\(programId)",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    /// Notify about new programs in user's categories
    func notifyNewPrograms(count: Int, categories: [String]) {
        guard isAuthorized, count > 0 else { return }

        let content = UNMutableNotificationContent()
        content.title = "New Programs Available"

        if count == 1 {
            content.body = "1 new program in \(categories.first ?? "your categories")"
        } else {
            content.body = "\(count) new programs in \(categories.joined(separator: ", "))"
        }

        content.sound = .default
        content.categoryIdentifier = NotificationCategory.newPrograms.rawValue
        content.userInfo = ["type": "newPrograms"]

        let request = UNNotificationRequest(
            identifier: "newprograms-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: nil // Deliver immediately
        )

        center.add(request)
    }

    /// Notify about status change for tracked application
    func notifyStatusChange(
        programId: String,
        programName: String,
        newStatus: String
    ) {
        guard isAuthorized else { return }

        let content = UNMutableNotificationContent()
        content.title = "Application Update"
        content.body = "\(programName): \(newStatus)"
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.statusUpdate.rawValue
        content.userInfo = [
            "programId": programId,
            "type": "statusChange",
            "status": newStatus
        ]

        // Add relevant actions based on status
        if newStatus.lowercased().contains("approved") {
            content.categoryIdentifier = NotificationCategory.approved.rawValue
        } else if newStatus.lowercased().contains("info needed") {
            content.categoryIdentifier = NotificationCategory.actionRequired.rawValue
        }

        let request = UNNotificationRequest(
            identifier: "status-\(programId)-\(Date().timeIntervalSince1970)",
            content: content,
            trigger: nil
        )

        center.add(request)
    }

    /// Schedule daily tip notification
    func scheduleDailyTip(hour: Int = 10, minute: Int = 0) {
        guard isAuthorized else { return }

        let tips = [
            "Did you know? CalFresh benefits can help families buy nutritious food.",
            "Tip: Many programs accept applications online 24/7.",
            "Remember to keep copies of all documents you submit.",
            "Tip: You may qualify for multiple programs. Don't limit yourself!",
            "Check program deadlines regularly to avoid missing opportunities.",
            "Tip: Case workers can help you navigate the application process.",
            "Many programs offer assistance in multiple languages."
        ]

        let content = UNMutableNotificationContent()
        content.title = "Bay Navigator Tip"
        content.body = tips.randomElement()!
        content.sound = .default
        content.categoryIdentifier = NotificationCategory.dailyTip.rawValue

        var dateComponents = DateComponents()
        dateComponents.hour = hour
        dateComponents.minute = minute

        let trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)

        let request = UNNotificationRequest(
            identifier: "dailytip",
            content: content,
            trigger: trigger
        )

        center.add(request)
    }

    // MARK: - Management

    func cancelNotification(identifier: String) {
        center.removePendingNotificationRequests(withIdentifiers: [identifier])
    }

    func cancelAllProgramNotifications(programId: String) {
        center.getPendingNotificationRequests { [weak self] requests in
            let idsToRemove = requests
                .filter { $0.identifier.contains(programId) }
                .map { $0.identifier }

            self?.center.removePendingNotificationRequests(withIdentifiers: idsToRemove)
        }
    }

    func cancelAllNotifications() {
        center.removeAllPendingNotificationRequests()
    }

    func updateBadgeCount(_ count: Int) {
        #if os(iOS)
        Task { @MainActor in
            UNUserNotificationCenter.current().setBadgeCount(count)
        }
        #endif
    }

    // MARK: - Notification Categories Setup

    func setupNotificationCategories() {
        // Deadline category
        let viewAction = UNNotificationAction(
            identifier: NotificationAction.view.rawValue,
            title: "View Program",
            options: .foreground
        )

        let remindLaterAction = UNNotificationAction(
            identifier: NotificationAction.remindLater.rawValue,
            title: "Remind Me Tomorrow",
            options: []
        )

        let deadlineCategory = UNNotificationCategory(
            identifier: NotificationCategory.deadline.rawValue,
            actions: [viewAction, remindLaterAction],
            intentIdentifiers: []
        )

        // Action required category
        let uploadDocsAction = UNNotificationAction(
            identifier: NotificationAction.uploadDocs.rawValue,
            title: "Upload Documents",
            options: .foreground
        )

        let actionRequiredCategory = UNNotificationCategory(
            identifier: NotificationCategory.actionRequired.rawValue,
            actions: [uploadDocsAction, viewAction],
            intentIdentifiers: []
        )

        // Approved category
        let celebrateAction = UNNotificationAction(
            identifier: NotificationAction.celebrate.rawValue,
            title: "🎉 Celebrate!",
            options: []
        )

        let approvedCategory = UNNotificationCategory(
            identifier: NotificationCategory.approved.rawValue,
            actions: [viewAction, celebrateAction],
            intentIdentifiers: []
        )

        // Status update category
        let statusCategory = UNNotificationCategory(
            identifier: NotificationCategory.statusUpdate.rawValue,
            actions: [viewAction],
            intentIdentifiers: []
        )

        // New programs category
        let browseAction = UNNotificationAction(
            identifier: NotificationAction.browse.rawValue,
            title: "Browse Programs",
            options: .foreground
        )

        let newProgramsCategory = UNNotificationCategory(
            identifier: NotificationCategory.newPrograms.rawValue,
            actions: [browseAction],
            intentIdentifiers: []
        )

        // Follow up category
        let followUpCategory = UNNotificationCategory(
            identifier: NotificationCategory.followUp.rawValue,
            actions: [viewAction, remindLaterAction],
            intentIdentifiers: []
        )

        // Daily tip category
        let dailyTipCategory = UNNotificationCategory(
            identifier: NotificationCategory.dailyTip.rawValue,
            actions: [browseAction],
            intentIdentifiers: []
        )

        center.setNotificationCategories([
            deadlineCategory,
            actionRequiredCategory,
            approvedCategory,
            statusCategory,
            newProgramsCategory,
            followUpCategory,
            dailyTipCategory
        ])
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension NotificationService: UNUserNotificationCenterDelegate {

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Show notification even when app is in foreground
        return [.banner, .sound, .badge]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo
        let programId = userInfo["programId"] as? String

        switch response.actionIdentifier {
        case NotificationAction.view.rawValue:
            if let id = programId {
                await handleOpenProgram(id)
            }

        case NotificationAction.remindLater.rawValue:
            if let id = programId,
               let name = userInfo["programName"] as? String {
                let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
                scheduleFollowUpReminder(programId: id, programName: name, followUpDate: tomorrow)
            }

        case NotificationAction.browse.rawValue:
            await handleOpenDirectory()

        case NotificationAction.uploadDocs.rawValue:
            if let id = programId {
                await handleOpenProgram(id)
            }

        case UNNotificationDefaultActionIdentifier:
            // User tapped the notification itself
            if let id = programId {
                await handleOpenProgram(id)
            }

        default:
            break
        }
    }

    private func handleOpenProgram(_ programId: String) async {
        // Post notification to open program
        await MainActor.run {
            NotificationCenter.default.post(
                name: .openProgram,
                object: nil,
                userInfo: ["programId": programId]
            )
        }
    }

    private func handleOpenDirectory() async {
        await MainActor.run {
            NotificationCenter.default.post(name: .openDirectory, object: nil)
        }
    }
}

// MARK: - Notification Types

enum NotificationCategory: String {
    case deadline = "DEADLINE"
    case actionRequired = "ACTION_REQUIRED"
    case approved = "APPROVED"
    case statusUpdate = "STATUS_UPDATE"
    case newPrograms = "NEW_PROGRAMS"
    case followUp = "FOLLOW_UP"
    case dailyTip = "DAILY_TIP"
}

enum NotificationAction: String {
    case view = "VIEW"
    case remindLater = "REMIND_LATER"
    case browse = "BROWSE"
    case uploadDocs = "UPLOAD_DOCS"
    case celebrate = "CELEBRATE"
}

// MARK: - Notification Names

extension Notification.Name {
    static let openProgram = Notification.Name("openProgram")
    static let openDirectory = Notification.Name("openDirectory")
}

// MARK: - Notification Settings View

import SwiftUI

struct NotificationSettingsView: View {
    @State private var notificationService = NotificationService.shared

    @AppStorage("notifyNewPrograms") private var notifyNewPrograms = true
    @AppStorage("notifyDeadlines") private var notifyDeadlines = true
    @AppStorage("notifyStatusChanges") private var notifyStatusChanges = true
    @AppStorage("dailyTipsEnabled") private var dailyTipsEnabled = false
    @AppStorage("dailyTipHour") private var dailyTipHour = 10

    var body: some View {
        Form {
            Section {
                if !notificationService.isAuthorized {
                    Button {
                        Task {
                            await notificationService.requestAuthorization()
                        }
                    } label: {
                        Label("Enable Notifications", systemImage: "bell.badge")
                    }
                } else {
                    Label("Notifications Enabled", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            } header: {
                Text("Status")
            }

            Section {
                Toggle("New Programs", isOn: $notifyNewPrograms)
                Toggle("Deadline Reminders", isOn: $notifyDeadlines)
                Toggle("Application Updates", isOn: $notifyStatusChanges)
            } header: {
                Text("Notification Types")
            } footer: {
                Text("Get notified about programs matching your interests and track your applications.")
            }

            Section {
                Toggle("Daily Tips", isOn: $dailyTipsEnabled)
                    .onChange(of: dailyTipsEnabled) { _, enabled in
                        if enabled {
                            notificationService.scheduleDailyTip(hour: dailyTipHour)
                        } else {
                            notificationService.cancelNotification(identifier: "dailytip")
                        }
                    }

                if dailyTipsEnabled {
                    Picker("Time", selection: $dailyTipHour) {
                        ForEach(6..<22) { hour in
                            Text(formatHour(hour)).tag(hour)
                        }
                    }
                    .onChange(of: dailyTipHour) { _, hour in
                        notificationService.cancelNotification(identifier: "dailytip")
                        notificationService.scheduleDailyTip(hour: hour)
                    }
                }
            } header: {
                Text("Daily Tips")
            } footer: {
                Text("Receive helpful tips about navigating social services.")
            }
        }
        .navigationTitle("Notifications")
    }

    private func formatHour(_ hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        var components = DateComponents()
        components.hour = hour
        let date = Calendar.current.date(from: components)!
        return formatter.string(from: date)
    }
}
