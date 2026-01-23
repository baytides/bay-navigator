import SwiftUI
import BayNavigatorCore

/// Quick exit overlay view that immediately navigates to a safe URL
struct QuickExitView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Loading indicator while exiting
            ProgressView()
                .scaleEffect(1.5)

            Text("Redirecting to safe site...")
                .font(.headline)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        #if os(iOS) || os(visionOS)
        .background(Color(.systemBackground))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor))
        #endif
        .task {
            await SafetyService.shared.executeQuickExit()
        }
    }
}

/// Quick exit button that appears on sensitive screens
struct QuickExitButton: View {
    @State private var isPressed = false

    var body: some View {
        Button {
            performQuickExit()
        } label: {
            Image(systemName: "xmark")
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(Color.red)
                .clipShape(Circle())
                .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
        }
        .scaleEffect(isPressed ? 0.9 : 1.0)
        .animation(.spring(response: 0.2), value: isPressed)
        .accessibilityLabel("Quick Exit")
        .accessibilityHint("Immediately opens a safe website and clears app state")
    }

    private func performQuickExit() {
        isPressed = true
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        #endif

        Task {
            await SafetyService.shared.executeQuickExit()
        }
    }
}

/// Quick exit floating action button positioned at bottom-right
struct QuickExitFloatingButton: View {
    @StateObject private var viewModel = QuickExitViewModel()

    var body: some View {
        if viewModel.isEnabled {
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    QuickExitButton()
                        .padding(.trailing, 16)
                        .padding(.bottom, 100)
                }
            }
        }
    }
}

/// Quick exit app bar button
struct QuickExitAppBarButton: View {
    @StateObject private var viewModel = QuickExitViewModel()

    var body: some View {
        if viewModel.isEnabled {
            Button {
                performQuickExit()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
            }
            .accessibilityLabel("Quick Exit")
        }
    }

    private func performQuickExit() {
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        #endif

        Task {
            await SafetyService.shared.executeQuickExit()
        }
    }
}

/// View modifier that adds quick exit gesture detection
struct QuickExitGestureModifier: ViewModifier {
    @StateObject private var viewModel = QuickExitViewModel()
    @State private var tapCount = 0
    @State private var lastTapTime = Date.distantPast

    private let tapThreshold: TimeInterval = 0.4
    private let requiredTaps = 3

    func body(content: Content) -> some View {
        content
            .simultaneousGesture(
                TapGesture()
                    .onEnded { _ in
                        guard viewModel.isEnabled else { return }
                        handleTap()
                    }
            )
    }

    private func handleTap() {
        let now = Date()
        let timeSinceLastTap = now.timeIntervalSince(lastTapTime)

        if timeSinceLastTap < tapThreshold {
            tapCount += 1
        } else {
            tapCount = 1
        }

        lastTapTime = now

        if tapCount >= requiredTaps {
            tapCount = 0
            performQuickExit()
        }
    }

    private func performQuickExit() {
        #if os(iOS)
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        #endif

        Task {
            await SafetyService.shared.executeQuickExit()
        }
    }
}

/// View modifier that detects shake gesture for quick exit or clear
struct ShakeDetectorModifier: ViewModifier {
    @StateObject private var viewModel = ShakeDetectorViewModel()
    @State private var showingClearConfirmation = false

    let onShake: (() -> Void)?

    func body(content: Content) -> some View {
        content
            .onReceive(NotificationCenter.default.publisher(for: .deviceDidShake)) { _ in
                handleShake()
            }
            .alert("Clear All Data?", isPresented: $showingClearConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear All", role: .destructive) {
                    Task {
                        await viewModel.executeShakeToClear()
                    }
                }
            } message: {
                Text("You shook the device. Do you want to clear all app data?\n\nThis will delete your profile, preferences, saved programs, and history.")
            }
    }

    private func handleShake() {
        guard viewModel.isQuickExitEnabled || viewModel.isShakeToClearEnabled else { return }

        #if os(iOS)
        UIImpactFeedbackGenerator(style: .heavy).impactOccurred()
        #endif

        if let onShake = onShake {
            onShake()
        } else if viewModel.isQuickExitEnabled {
            // Quick exit takes priority
            Task {
                await SafetyService.shared.executeQuickExit()
            }
        } else if viewModel.isShakeToClearEnabled {
            // Show confirmation before clearing
            showingClearConfirmation = true
        }
    }
}

// MARK: - Shake Detection Notification

extension Notification.Name {
    static let deviceDidShake = Notification.Name("deviceDidShake")
}

#if os(iOS)
extension UIWindow {
    open override func motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
        if motion == .motionShake {
            NotificationCenter.default.post(name: .deviceDidShake, object: nil)
        }
    }
}
#endif

// MARK: - View Extensions

extension View {
    /// Adds quick exit triple-tap gesture detection
    func quickExitGesture() -> some View {
        modifier(QuickExitGestureModifier())
    }

    /// Adds shake detection for quick exit or clear
    func shakeDetector(onShake: (() -> Void)? = nil) -> some View {
        modifier(ShakeDetectorModifier(onShake: onShake))
    }
}

// MARK: - View Models

@MainActor
class QuickExitViewModel: ObservableObject {
    @Published var isEnabled = false

    init() {
        Task {
            await loadState()
        }
    }

    func loadState() async {
        isEnabled = await SafetyService.shared.isQuickExitEnabled()
    }
}

@MainActor
class ShakeDetectorViewModel: ObservableObject {
    @Published var isQuickExitEnabled = false
    @Published var isShakeToClearEnabled = false

    init() {
        Task {
            await loadState()
        }
    }

    func loadState() async {
        let service = SafetyService.shared
        isQuickExitEnabled = await service.isQuickExitEnabled()
        isShakeToClearEnabled = await service.isShakeToClearEnabled()
    }

    func executeShakeToClear() async {
        await SafetyService.shared.executeShakeToClear()
    }
}

// MARK: - Quick Exit Destination Picker

struct QuickExitDestinationPicker: View {
    @Binding var selectedUrl: String

    var body: some View {
        Picker("Exit Destination", selection: $selectedUrl) {
            ForEach(SafetyService.quickExitDestinations) { destination in
                HStack {
                    Text(destination.name)
                    Spacer()
                    Text(destination.description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .tag(destination.url)
            }
        }
    }
}

// MARK: - Network Privacy Warning Banner

struct NetworkPrivacyBanner: View {
    @StateObject private var viewModel = NetworkPrivacyBannerViewModel()
    @State private var isDismissed = false

    var body: some View {
        if viewModel.shouldShow && !isDismissed, let status = viewModel.status {
            HStack(spacing: 12) {
                Image(systemName: status.level.systemImage)
                    .foregroundStyle(colorForLevel(status.level))

                VStack(alignment: .leading, spacing: 2) {
                    Text(status.connectionType)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    if let warning = status.warning {
                        Text(warning)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Button {
                    isDismissed = true
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(12)
            .background(backgroundColorForLevel(status.level))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    private func colorForLevel(_ level: NetworkPrivacyLevel) -> Color {
        switch level {
        case .good: return .green
        case .moderate: return .blue
        case .caution: return .orange
        case .offline: return .gray
        case .unknown: return .gray
        }
    }

    private func backgroundColorForLevel(_ level: NetworkPrivacyLevel) -> Color {
        switch level {
        case .caution: return Color.orange.opacity(0.1)
        default: return Color.secondary.opacity(0.1)
        }
    }
}

@MainActor
class NetworkPrivacyBannerViewModel: ObservableObject {
    @Published var shouldShow = false
    @Published var status: NetworkPrivacyStatus?

    init() {
        Task {
            await loadState()
        }
    }

    func loadState() async {
        let service = SafetyService.shared

        let monitoringEnabled = await service.isNetworkMonitoringEnabled()
        let warningsEnabled = await service.isNetworkWarningsEnabled()

        shouldShow = monitoringEnabled && warningsEnabled

        if shouldShow {
            status = await service.getNetworkPrivacyStatus()
            // Only show for caution level (WiFi)
            if status?.level != .caution {
                shouldShow = false
            }
        }
    }
}

// MARK: - Incognito Mode Indicator

struct IncognitoIndicator: View {
    @StateObject private var viewModel = IncognitoIndicatorViewModel()

    var body: some View {
        if viewModel.isActive {
            HStack(spacing: 8) {
                Image(systemName: "eye.slash.fill")
                    .font(.caption)

                Text("Incognito Mode - History not saved")
                    .font(.caption)
            }
            .foregroundStyle(.white.opacity(0.8))
            .padding(.horizontal, 16)
            .padding(.vertical, 6)
            .frame(maxWidth: .infinity)
            .background(Color.gray.opacity(0.9))
        }
    }
}

@MainActor
class IncognitoIndicatorViewModel: ObservableObject {
    @Published var isActive = false

    init() {
        Task {
            await loadState()
        }
    }

    func loadState() async {
        isActive = await SafetyService.shared.isCurrentSessionIncognito()
    }
}

#Preview("Quick Exit Button") {
    QuickExitButton()
}

#Preview("Quick Exit Floating") {
    ZStack {
        Color.gray.opacity(0.1)
        QuickExitFloatingButton()
    }
}

#Preview("Network Banner") {
    VStack {
        NetworkPrivacyBanner()
        Spacer()
    }
}

#Preview("Incognito Indicator") {
    VStack {
        IncognitoIndicator()
        Spacer()
    }
}
