import ActivityKit
import WidgetKit
import SwiftUI
import BayNavigatorCore

// MARK: - Live Activity Attributes

struct ProgramApplicationAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var status: ApplicationStatus
        var lastUpdated: Date
        var daysUntilDeadline: Int?
        var nextStep: String?
        var progress: Double // 0.0 to 1.0
    }

    var programId: String
    var programName: String
    var programCategory: String
    var applicationDate: Date
    var deadline: Date?
}

enum ApplicationStatus: String, Codable, CaseIterable {
    case notStarted = "Not Started"
    case inProgress = "In Progress"
    case submitted = "Submitted"
    case underReview = "Under Review"
    case additionalInfoNeeded = "Info Needed"
    case approved = "Approved"
    case denied = "Denied"
    case expired = "Expired"

    var icon: String {
        switch self {
        case .notStarted: return "doc"
        case .inProgress: return "pencil.circle"
        case .submitted: return "paperplane.fill"
        case .underReview: return "eye.circle"
        case .additionalInfoNeeded: return "exclamationmark.circle"
        case .approved: return "checkmark.circle.fill"
        case .denied: return "xmark.circle.fill"
        case .expired: return "clock.badge.xmark"
        }
    }

    var color: Color {
        switch self {
        case .notStarted: return .secondary
        case .inProgress: return .blue
        case .submitted: return .purple
        case .underReview: return .orange
        case .additionalInfoNeeded: return .yellow
        case .approved: return .green
        case .denied: return .red
        case .expired: return .gray
        }
    }

    var isTerminal: Bool {
        switch self {
        case .approved, .denied, .expired: return true
        default: return false
        }
    }
}

// MARK: - Live Activity Manager

@available(iOS 16.2, *)
class LiveActivityManager {
    static let shared = LiveActivityManager()

    private var activeActivities: [String: Activity<ProgramApplicationAttributes>] = [:]

    // Start tracking a program application
    func startTracking(
        programId: String,
        programName: String,
        category: String,
        deadline: Date?,
        initialStatus: ApplicationStatus = .inProgress
    ) async throws -> String {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            throw LiveActivityError.notAuthorized
        }

        let attributes = ProgramApplicationAttributes(
            programId: programId,
            programName: programName,
            programCategory: category,
            applicationDate: Date(),
            deadline: deadline
        )

        let daysUntil = deadline.map { Calendar.current.dateComponents([.day], from: Date(), to: $0).day }

        let initialState = ProgramApplicationAttributes.ContentState(
            status: initialStatus,
            lastUpdated: Date(),
            daysUntilDeadline: daysUntil ?? nil,
            nextStep: nextStepText(for: initialStatus),
            progress: progressValue(for: initialStatus)
        )

        let activity = try Activity.request(
            attributes: attributes,
            content: .init(state: initialState, staleDate: Calendar.current.date(byAdding: .hour, value: 24, to: Date())),
            pushType: .token
        )

        activeActivities[programId] = activity

        // Save to UserDefaults for persistence
        saveActiveActivity(programId: programId, activityId: activity.id)

        return activity.id
    }

    // Update application status
    func updateStatus(
        programId: String,
        newStatus: ApplicationStatus,
        nextStep: String? = nil
    ) async {
        guard let activity = activeActivities[programId] else { return }

        let deadline = activity.attributes.deadline
        let daysUntil = deadline.map { Calendar.current.dateComponents([.day], from: Date(), to: $0).day }

        let updatedState = ProgramApplicationAttributes.ContentState(
            status: newStatus,
            lastUpdated: Date(),
            daysUntilDeadline: daysUntil ?? nil,
            nextStep: nextStep ?? nextStepText(for: newStatus),
            progress: progressValue(for: newStatus)
        )

        await activity.update(
            ActivityContent(
                state: updatedState,
                staleDate: Calendar.current.date(byAdding: .hour, value: 24, to: Date())
            )
        )

        // End activity if terminal status
        if newStatus.isTerminal {
            await endTracking(programId: programId, status: newStatus)
        }
    }

    // End tracking
    func endTracking(programId: String, status: ApplicationStatus) async {
        guard let activity = activeActivities[programId] else { return }

        let finalState = ProgramApplicationAttributes.ContentState(
            status: status,
            lastUpdated: Date(),
            daysUntilDeadline: nil,
            nextStep: status == .approved ? "Congratulations!" : nil,
            progress: 1.0
        )

        await activity.end(
            ActivityContent(state: finalState, staleDate: nil),
            dismissalPolicy: .after(Date().addingTimeInterval(3600 * 4)) // Dismiss after 4 hours
        )

        activeActivities.removeValue(forKey: programId)
        removeActiveActivity(programId: programId)
    }

    // Check if program is being tracked
    func isTracking(programId: String) -> Bool {
        activeActivities[programId] != nil
    }

    // Get all active activities
    func getAllActiveActivities() -> [String] {
        Array(activeActivities.keys)
    }

    // Restore activities on app launch
    func restoreActivities() {
        Task {
            for activity in Activity<ProgramApplicationAttributes>.activities {
                activeActivities[activity.attributes.programId] = activity
            }
        }
    }

    // MARK: - Helpers

    private func progressValue(for status: ApplicationStatus) -> Double {
        switch status {
        case .notStarted: return 0.0
        case .inProgress: return 0.25
        case .submitted: return 0.5
        case .underReview: return 0.75
        case .additionalInfoNeeded: return 0.6
        case .approved, .denied, .expired: return 1.0
        }
    }

    private func nextStepText(for status: ApplicationStatus) -> String {
        switch status {
        case .notStarted: return "Start your application"
        case .inProgress: return "Complete and submit"
        case .submitted: return "Awaiting review"
        case .underReview: return "Decision pending"
        case .additionalInfoNeeded: return "Upload documents"
        case .approved: return "Approved!"
        case .denied: return "Appeal available"
        case .expired: return "Reapply if eligible"
        }
    }

    private func saveActiveActivity(programId: String, activityId: String) {
        let defaults = UserDefaults(suiteName: "group.org.baytides.navigator")
        var activities = defaults?.dictionary(forKey: "liveActivities") as? [String: String] ?? [:]
        activities[programId] = activityId
        defaults?.set(activities, forKey: "liveActivities")
    }

    private func removeActiveActivity(programId: String) {
        let defaults = UserDefaults(suiteName: "group.org.baytides.navigator")
        var activities = defaults?.dictionary(forKey: "liveActivities") as? [String: String] ?? [:]
        activities.removeValue(forKey: programId)
        defaults?.set(activities, forKey: "liveActivities")
    }
}

enum LiveActivityError: Error {
    case notAuthorized
    case activityNotFound
}

// MARK: - Live Activity Views

@available(iOS 16.2, *)
struct ProgramApplicationLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ProgramApplicationAttributes.self) { context in
            // Lock Screen / Banner UI
            LockScreenLiveActivityView(context: context)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    Label(context.attributes.programCategory, systemImage: categoryIcon(context.attributes.programCategory))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                DynamicIslandExpandedRegion(.trailing) {
                    if let days = context.state.daysUntilDeadline {
                        Text("\(days)d")
                            .font(.title2.bold())
                            .foregroundStyle(days <= 3 ? .red : .primary)
                    }
                }

                DynamicIslandExpandedRegion(.center) {
                    VStack(spacing: 4) {
                        Text(context.attributes.programName)
                            .font(.headline)
                            .lineLimit(1)

                        HStack {
                            Image(systemName: context.state.status.icon)
                                .foregroundStyle(context.state.status.color)
                            Text(context.state.status.rawValue)
                                .font(.subheadline)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        ProgressView(value: context.state.progress)
                            .tint(context.state.status.color)

                        if let nextStep = context.state.nextStep {
                            Text(nextStep)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(.horizontal)
                }
            } compactLeading: {
                Image(systemName: context.state.status.icon)
                    .foregroundStyle(context.state.status.color)
            } compactTrailing: {
                if let days = context.state.daysUntilDeadline, days <= 7 {
                    Text("\(days)d")
                        .font(.caption.bold())
                        .foregroundStyle(days <= 3 ? .red : .primary)
                } else {
                    ProgressView(value: context.state.progress)
                        .progressViewStyle(.circular)
                        .tint(context.state.status.color)
                        .scaleEffect(0.5)
                }
            } minimal: {
                Image(systemName: context.state.status.icon)
                    .foregroundStyle(context.state.status.color)
            }
        }
    }

    private func categoryIcon(_ category: String) -> String {
        switch category.lowercased() {
        case "food": return "fork.knife"
        case "housing": return "house.fill"
        case "health": return "heart.fill"
        case "employment": return "briefcase.fill"
        default: return "folder.fill"
        }
    }
}

@available(iOS 16.2, *)
struct LockScreenLiveActivityView: View {
    let context: ActivityViewContext<ProgramApplicationAttributes>

    var body: some View {
        HStack(spacing: 16) {
            // Status icon
            ZStack {
                Circle()
                    .fill(context.state.status.color.opacity(0.2))
                    .frame(width: 50, height: 50)

                Image(systemName: context.state.status.icon)
                    .font(.title2)
                    .foregroundStyle(context.state.status.color)
            }

            // Program info
            VStack(alignment: .leading, spacing: 4) {
                Text(context.attributes.programName)
                    .font(.headline)
                    .lineLimit(1)

                Text(context.state.status.rawValue)
                    .font(.subheadline)
                    .foregroundStyle(context.state.status.color)

                if let nextStep = context.state.nextStep {
                    Text(nextStep)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Deadline countdown
            if let days = context.state.daysUntilDeadline {
                VStack(spacing: 2) {
                    Text("\(days)")
                        .font(.title.bold())
                        .foregroundStyle(days <= 3 ? .red : .primary)
                    Text("days")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .padding()
        .background(.regularMaterial)
    }
}

// MARK: - SwiftUI View Extensions

@available(iOS 16.2, *)
struct TrackApplicationButton: View {
    let program: Program
    @State private var isTracking = false
    @State private var showStatusPicker = false

    var body: some View {
        Button {
            if isTracking {
                showStatusPicker = true
            } else {
                startTracking()
            }
        } label: {
            Label(
                isTracking ? "Update Status" : "Track Application",
                systemImage: isTracking ? "pencil.circle" : "bell.badge"
            )
        }
        .onAppear {
            isTracking = LiveActivityManager.shared.isTracking(programId: program.id)
        }
        .confirmationDialog("Update Status", isPresented: $showStatusPicker) {
            ForEach(ApplicationStatus.allCases, id: \.self) { status in
                Button(status.rawValue) {
                    updateStatus(to: status)
                }
            }
            Button("Stop Tracking", role: .destructive) {
                stopTracking()
            }
        }
    }

    private func startTracking() {
        Task {
            do {
                _ = try await LiveActivityManager.shared.startTracking(
                    programId: program.id,
                    programName: program.name,
                    category: program.category,
                    deadline: nil // Could add deadline picker
                )
                isTracking = true
            } catch {
                print("Failed to start tracking: \(error)")
            }
        }
    }

    private func updateStatus(to status: ApplicationStatus) {
        Task {
            await LiveActivityManager.shared.updateStatus(
                programId: program.id,
                newStatus: status
            )
            if status.isTerminal {
                isTracking = false
            }
        }
    }

    private func stopTracking() {
        Task {
            await LiveActivityManager.shared.endTracking(
                programId: program.id,
                status: .expired
            )
            isTracking = false
        }
    }
}
