import Foundation
import Security
import CryptoKit
import Network
#if canImport(UIKit)
import UIKit
#endif
#if canImport(LocalAuthentication)
import LocalAuthentication
#endif
#if canImport(CoreMotion)
import CoreMotion
#endif
#if canImport(NetworkExtension)
import NetworkExtension
#endif

/// Safety service for Bay Navigator
/// Provides privacy and safety features for vulnerable users:
/// - Incognito mode (clears data on exit)
/// - PIN protection with Keychain storage
/// - Panic wipe after failed PIN attempts
/// - Quick exit functionality
/// - Network privacy warnings
/// - Encrypted storage option
/// - Shake-to-clear detection
public actor SafetyService {
    public static let shared = SafetyService()

    // MARK: - Constants

    /// Default safe exit destinations
    public static let quickExitDestinations: [QuickExitDestination] = [
        QuickExitDestination(
            id: "weather",
            name: "Weather.gov",
            url: "https://www.weather.gov",
            description: "Opens weather forecast"
        ),
        QuickExitDestination(
            id: "google",
            name: "Google",
            url: "https://www.google.com",
            description: "Opens Google search"
        ),
        QuickExitDestination(
            id: "news",
            name: "AP News",
            url: "https://apnews.com",
            description: "Opens news website"
        ),
        QuickExitDestination(
            id: "recipes",
            name: "AllRecipes",
            url: "https://www.allrecipes.com",
            description: "Opens recipe website"
        )
    ]

    // MARK: - User Defaults Keys

    private let quickExitEnabledKey = "baynavigator:quick_exit_enabled"
    private let quickExitUrlKey = "baynavigator:quick_exit_url"
    private let incognitoModeKey = "baynavigator:incognito_mode"
    private let showSafetyTipsKey = "baynavigator:show_safety_tips"
    private let networkWarningsKey = "baynavigator:network_warnings"
    private let networkMonitoringKey = "baynavigator:network_monitoring"
    private let recentProgramsKey = "baynavigator:recent_programs"
    private let searchHistoryKey = "baynavigator:search_history"
    private let pinProtectionEnabledKey = "baynavigator:pin_protection"
    private let panicWipeEnabledKey = "baynavigator:panic_wipe_enabled"
    private let failedPinAttemptsKey = "baynavigator:failed_pin_attempts"
    private let maxFailedAttemptsKey = "baynavigator:max_failed_attempts"
    private let shakeToClearEnabledKey = "baynavigator:shake_to_clear_enabled"
    private let encryptionEnabledKey = "baynavigator:encryption_enabled"
    private let biometricEnabledKey = "baynavigator:biometric_enabled"
    private let offlineModeKey = "baynavigator:offline_mode"
    private let torEnabledKey = "baynavigator:tor_enabled"
    private let crashReportingEnabledKey = "baynavigator:crash_reporting_enabled"
    private let shareProfileWithCarlKey = "baynavigator:share_profile_with_carl"

    // MARK: - Tor/Onion Configuration

    /// The onion address for Bay Navigator's Tor hidden service
    public static let onionBaseURL = "http://ik2rhhyr6f2dk2th7ofa7yph6li5tuwycqflzrkuu37ht7apbih3ypid.onion/api"

    /// Orbot's SOCKS5 proxy port
    public static let orbotProxyPort: UInt16 = 9050
    public static let orbotProxyHost = "127.0.0.1"

    // MARK: - Keychain Keys

    private let pinKeychainKey = "com.baytides.baynavigator.safety.pin"
    private let encryptionKeyKeychainKey = "com.baytides.baynavigator.safety.encryptionKey"

    // MARK: - Session State

    private var isIncognitoSession = false
    private var sessionRecentPrograms: [String] = []
    private var sessionSearchHistory: [String] = []

    #if os(iOS) || os(watchOS)
    private let motionManager = CMMotionManager()
    private var shakeHandler: (() -> Void)?
    #endif

    private init() {}

    // MARK: - Quick Exit

    /// Check if quick exit is enabled
    public func isQuickExitEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: quickExitEnabledKey)
    }

    /// Enable or disable quick exit
    public func setQuickExitEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: quickExitEnabledKey)
    }

    /// Get the quick exit URL
    public func getQuickExitUrl() -> String {
        UserDefaults.standard.string(forKey: quickExitUrlKey) ?? Self.quickExitDestinations[0].url
    }

    /// Set the quick exit URL
    public func setQuickExitUrl(_ url: String) {
        UserDefaults.standard.set(url, forKey: quickExitUrlKey)
    }

    /// Execute quick exit - opens safe URL and clears app state
    public func executeQuickExit() async {
        // Clear sensitive data immediately
        await clearSessionData()

        // Open the safe URL
        let urlString = getQuickExitUrl()
        if let url = URL(string: urlString) {
            await MainActor.run {
                #if canImport(UIKit) && !os(watchOS)
                UIApplication.shared.open(url, options: [:])
                #elseif os(macOS)
                _ = NSWorkspace.shared.open(url)
                #endif
            }
        }

        // Background the app (on iOS)
        await MainActor.run {
            #if canImport(UIKit) && !os(watchOS)
            // Move app to background by suspending
            UIControl().sendAction(#selector(URLSessionTask.suspend), to: UIApplication.shared, for: nil)
            #endif
        }
    }

    // MARK: - Incognito Mode

    /// Check if incognito mode is enabled (persistent setting)
    public func isIncognitoModeEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: incognitoModeKey)
    }

    /// Enable or disable incognito mode
    public func setIncognitoModeEnabled(_ enabled: Bool) async {
        UserDefaults.standard.set(enabled, forKey: incognitoModeKey)
        isIncognitoSession = enabled

        if enabled {
            // Clear existing history when enabling
            await clearAllHistory()
        }
    }

    /// Check if current session is incognito
    public func isCurrentSessionIncognito() -> Bool {
        isIncognitoSession
    }

    /// Start an incognito session (temporary, doesn't change setting)
    public func startIncognitoSession() {
        isIncognitoSession = true
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
    }

    /// End incognito session and clear session data
    public func endIncognitoSession() async {
        isIncognitoSession = false
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
    }

    // MARK: - History Management

    /// Add a program to recent history (respects incognito mode)
    public func addRecentProgram(_ programId: String) {
        if isIncognitoSession {
            // Only keep in memory, don't persist
            if !sessionRecentPrograms.contains(programId) {
                sessionRecentPrograms.insert(programId, at: 0)
                if sessionRecentPrograms.count > 10 {
                    sessionRecentPrograms.removeLast()
                }
            }
            return
        }

        var recent = UserDefaults.standard.stringArray(forKey: recentProgramsKey) ?? []
        recent.removeAll { $0 == programId }
        recent.insert(programId, at: 0)

        // Keep only last 20
        if recent.count > 20 {
            recent.removeLast()
        }

        UserDefaults.standard.set(recent, forKey: recentProgramsKey)
    }

    /// Get recent programs
    public func getRecentPrograms() -> [String] {
        if isIncognitoSession {
            return sessionRecentPrograms
        }
        return UserDefaults.standard.stringArray(forKey: recentProgramsKey) ?? []
    }

    /// Add a search query to history (respects incognito mode)
    public func addSearchQuery(_ query: String) {
        if isIncognitoSession {
            if !sessionSearchHistory.contains(query) {
                sessionSearchHistory.insert(query, at: 0)
                if sessionSearchHistory.count > 10 {
                    sessionSearchHistory.removeLast()
                }
            }
            return
        }

        var history = UserDefaults.standard.stringArray(forKey: searchHistoryKey) ?? []
        history.removeAll { $0 == query }
        history.insert(query, at: 0)

        if history.count > 20 {
            history.removeLast()
        }

        UserDefaults.standard.set(history, forKey: searchHistoryKey)
    }

    /// Get search history
    public func getSearchHistory() -> [String] {
        if isIncognitoSession {
            return sessionSearchHistory
        }
        return UserDefaults.standard.stringArray(forKey: searchHistoryKey) ?? []
    }

    /// Clear all history
    public func clearAllHistory() async {
        UserDefaults.standard.removeObject(forKey: recentProgramsKey)
        UserDefaults.standard.removeObject(forKey: searchHistoryKey)
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
    }

    /// Clear session data (for quick exit)
    public func clearSessionData() async {
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()

        // If incognito mode is enabled, also clear persisted data
        if isIncognitoSession || isIncognitoModeEnabled() {
            await clearAllHistory()
        }
    }

    // MARK: - PIN Protection

    /// Check if PIN protection is enabled
    public func isPinProtectionEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: pinProtectionEnabledKey)
    }

    /// Check if a PIN has been set
    public func hasPinSet() -> Bool {
        readFromKeychain(key: pinKeychainKey) != nil
    }

    /// Validate PIN strength
    /// Returns validation result with specific error if invalid
    public func validatePinStrength(_ pin: String) -> PinValidation {
        // Check length (6-8 digits)
        if pin.count < 6 || pin.count > 8 {
            return PinValidation(isValid: false, message: "PIN must be 6-8 digits")
        }

        // Check if all digits
        let digitRegex = try? NSRegularExpression(pattern: "^\\d+$")
        let range = NSRange(pin.startIndex..., in: pin)
        if digitRegex?.firstMatch(in: pin, range: range) == nil {
            return PinValidation(isValid: false, message: "PIN must contain only numbers")
        }

        // Check for repeated digits (e.g., 111111, 222222)
        let repeatedRegex = try? NSRegularExpression(pattern: "^(\\d)\\1+$")
        if repeatedRegex?.firstMatch(in: pin, range: range) != nil {
            return PinValidation(isValid: false, message: "PIN cannot be all the same digit")
        }

        // Check for sequential ascending (e.g., 123456, 234567)
        if isSequentialAscending(pin) {
            return PinValidation(isValid: false, message: "PIN cannot be a sequential number")
        }

        // Check for sequential descending (e.g., 654321, 876543)
        if isSequentialDescending(pin) {
            return PinValidation(isValid: false, message: "PIN cannot be a sequential number")
        }

        // Check for common weak PINs
        if isCommonWeakPin(pin) {
            return PinValidation(isValid: false, message: "PIN is too common. Choose something more unique.")
        }

        // Check for repeated patterns (e.g., 121212, 787878)
        if isRepeatedPattern(pin) {
            return PinValidation(isValid: false, message: "PIN cannot be a repeated pattern")
        }

        return PinValidation(isValid: true, message: "PIN is strong")
    }

    /// Set a new PIN (must pass validation)
    public func setPin(_ pin: String) -> PinSetResult {
        // Validate PIN strength
        let validation = validatePinStrength(pin)
        if !validation.isValid {
            return PinSetResult(success: false, message: validation.message)
        }

        // Hash the PIN using SHA256
        let hashedPin = hashPin(pin)

        // Store in Keychain
        let success = saveToKeychain(key: pinKeychainKey, data: hashedPin)
        if success {
            UserDefaults.standard.set(true, forKey: pinProtectionEnabledKey)
            return PinSetResult(success: true, message: "PIN set successfully")
        } else {
            return PinSetResult(success: false, message: "Failed to save PIN securely")
        }
    }

    /// Validate PIN against stored hash
    public func validatePin(_ pin: String) -> Bool {
        guard let storedHash = readFromKeychain(key: pinKeychainKey) else {
            return false
        }

        let inputHash = hashPin(pin)
        return inputHash == storedHash
    }

    /// Remove PIN protection
    public func removePin() {
        deleteFromKeychain(key: pinKeychainKey)
        UserDefaults.standard.set(false, forKey: pinProtectionEnabledKey)
    }

    /// Change PIN (requires current PIN verification)
    public func changePin(currentPin: String, newPin: String) -> PinSetResult {
        guard validatePin(currentPin) else {
            return PinSetResult(success: false, message: "Current PIN is incorrect")
        }

        // Remove old PIN and set new one
        removePin()
        return setPin(newPin)
    }

    // MARK: - Biometric Authentication

    /// Check if biometric authentication is enabled
    public func isBiometricEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: biometricEnabledKey)
    }

    /// Enable or disable biometric authentication
    public func setBiometricEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: biometricEnabledKey)
    }

    /// Check if device supports biometric authentication
    public nonisolated func canUseBiometrics() -> BiometricType {
        #if canImport(LocalAuthentication)
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }

        switch context.biometryType {
        case .faceID:
            return .faceID
        case .touchID:
            return .touchID
        case .opticID:
            return .opticID
        default:
            return .none
        }
        #else
        return .none
        #endif
    }

    /// Authenticate using biometrics
    public func authenticateWithBiometrics(reason: String) async -> Bool {
        #if canImport(LocalAuthentication)
        let context = LAContext()

        do {
            return try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
        } catch {
            return false
        }
        #else
        return false
        #endif
    }

    // MARK: - Panic Wipe

    /// Check if panic wipe is enabled
    public func isPanicWipeEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: panicWipeEnabledKey)
    }

    /// Enable or disable panic wipe
    public func setPanicWipeEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: panicWipeEnabledKey)
    }

    /// Get the maximum failed PIN attempts before panic wipe
    public func getMaxFailedAttempts() -> Int {
        let value = UserDefaults.standard.integer(forKey: maxFailedAttemptsKey)
        return value > 0 ? value : 3 // Default to 3
    }

    /// Set the maximum failed PIN attempts
    public func setMaxFailedAttempts(_ count: Int) {
        UserDefaults.standard.set(max(1, min(count, 10)), forKey: maxFailedAttemptsKey)
    }

    /// Get current failed PIN attempts count
    public func getFailedPinAttempts() -> Int {
        UserDefaults.standard.integer(forKey: failedPinAttemptsKey)
    }

    /// Record a failed PIN attempt, returns true if panic wipe should trigger
    public func recordFailedPinAttempt() async -> Bool {
        let currentAttempts = UserDefaults.standard.integer(forKey: failedPinAttemptsKey)
        let newAttempts = currentAttempts + 1
        UserDefaults.standard.set(newAttempts, forKey: failedPinAttemptsKey)

        // Check if panic wipe should trigger
        let panicWipeEnabled = isPanicWipeEnabled()
        let maxAttempts = getMaxFailedAttempts()

        if panicWipeEnabled && newAttempts >= maxAttempts {
            return true
        }
        return false
    }

    /// Reset failed PIN attempts (call after successful PIN entry)
    public func resetFailedPinAttempts() {
        UserDefaults.standard.set(0, forKey: failedPinAttemptsKey)
    }

    /// Execute panic wipe - deletes all app data
    /// WARNING: This is destructive and cannot be undone
    public func executePanicWipe() async {
        // 1. Clear Keychain items
        deleteFromKeychain(key: pinKeychainKey)
        deleteFromKeychain(key: encryptionKeyKeychainKey)

        // 2. Clear all UserDefaults for our app
        if let bundleID = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: bundleID)
        }
        UserDefaults.standard.synchronize()

        // 3. Clear app's cache and documents directories
        let fileManager = FileManager.default

        // Cache directory
        if let cacheDir = fileManager.urls(for: .cachesDirectory, in: .userDomainMask).first {
            try? fileManager.removeItem(at: cacheDir)
        }

        // Documents directory
        if let documentsDir = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first {
            if let items = try? fileManager.contentsOfDirectory(at: documentsDir, includingPropertiesForKeys: nil) {
                for item in items {
                    try? fileManager.removeItem(at: item)
                }
            }
        }

        // Application Support directory
        if let supportDir = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask).first {
            if let items = try? fileManager.contentsOfDirectory(at: supportDir, includingPropertiesForKeys: nil) {
                for item in items {
                    try? fileManager.removeItem(at: item)
                }
            }
        }

        // 4. Clear session data
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
        isIncognitoSession = false

        // 5. Exit the app
        await MainActor.run {
            #if canImport(UIKit) && !os(watchOS)
            exit(0)
            #elseif os(macOS)
            NSApplication.shared.terminate(nil)
            #endif
        }
    }

    // MARK: - Shake to Clear

    /// Check if shake-to-clear is enabled
    public func isShakeToClearEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: shakeToClearEnabledKey)
    }

    /// Enable or disable shake-to-clear feature
    public func setShakeToClearEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: shakeToClearEnabledKey)
    }

    #if os(iOS) || os(watchOS)
    /// Start monitoring for shake gestures
    public func startShakeDetection(handler: @escaping @Sendable () -> Void) {
        guard motionManager.isAccelerometerAvailable else { return }

        shakeHandler = handler
        motionManager.accelerometerUpdateInterval = 0.1
        motionManager.startAccelerometerUpdates(to: .main) { [weak self] data, error in
            guard let acceleration = data?.acceleration else { return }

            let threshold = 2.5
            let totalAcceleration = sqrt(
                pow(acceleration.x, 2) +
                pow(acceleration.y, 2) +
                pow(acceleration.z, 2)
            )

            if totalAcceleration > threshold {
                Task {
                    await self?.handleShakeDetected()
                }
            }
        }
    }

    /// Stop monitoring for shake gestures
    public func stopShakeDetection() {
        motionManager.stopAccelerometerUpdates()
    }

    private func handleShakeDetected() {
        shakeHandler?()
    }
    #endif

    /// Execute shake-to-clear - clears all user data but keeps app installed
    public func executeShakeToClear() async {
        // Clear all user preferences (profile, favorites, etc.)
        let keysToRemove = [
            "baynavigator:user_prefs",
            "baynavigator:onboarding_complete",
            "baynavigator:favorites",
            recentProgramsKey,
            searchHistoryKey
        ]

        for key in keysToRemove {
            UserDefaults.standard.removeObject(forKey: key)
        }

        // Clear session data
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
    }

    // MARK: - Network Privacy Warnings

    private let trustedNetworksKey = "baynavigator:trusted_networks"

    /// Common public WiFi network name patterns
    private let publicNetworkPatterns: [String] = [
        "starbucks", "mcdonalds", "mcdonald's", "airport", "guest", "public",
        "free wifi", "free-wifi", "freewifi", "xfinity", "attwifi", "att wifi",
        "hotel", "lobby", "cafe", "coffee", "library", "transit", "metro",
        "bus", "train", "station", "mall", "shop", "store", "restaurant",
        "bar", "pub", "gym", "fitness", "hospital", "clinic", "waiting",
        "visitor", "open", "hotspot", "wifi zone", "connect", "network"
    ]

    /// Check if network monitoring is enabled
    public func isNetworkMonitoringEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: networkMonitoringKey)
    }

    /// Enable or disable network monitoring
    public func setNetworkMonitoringEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: networkMonitoringKey)
    }

    /// Check if network warnings are enabled
    public func isNetworkWarningsEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: networkWarningsKey)
    }

    /// Enable or disable network warnings
    public func setNetworkWarningsEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: networkWarningsKey)
    }

    /// Get list of trusted network SSIDs
    public nonisolated func getTrustedNetworks() -> [String] {
        UserDefaults.standard.stringArray(forKey: trustedNetworksKey) ?? []
    }

    /// Add a network to trusted list
    public nonisolated func addTrustedNetwork(_ ssid: String) {
        var trusted = getTrustedNetworks()
        if !trusted.contains(ssid) {
            trusted.append(ssid)
            UserDefaults.standard.set(trusted, forKey: trustedNetworksKey)
        }
    }

    /// Remove a network from trusted list
    public nonisolated func removeTrustedNetwork(_ ssid: String) {
        var trusted = getTrustedNetworks()
        trusted.removeAll { $0 == ssid }
        UserDefaults.standard.set(trusted, forKey: trustedNetworksKey)
    }

    /// Check if an SSID matches common public network patterns
    private nonisolated func isLikelyPublicNetwork(_ ssid: String) -> Bool {
        let lowercased = ssid.lowercased()
        return publicNetworkPatterns.contains { pattern in
            lowercased.contains(pattern)
        }
    }

    /// Get current WiFi SSID (requires location permission on iOS)
    @MainActor
    public func getCurrentSSID() -> String? {
        #if canImport(UIKit) && !os(visionOS)
        // On iOS, we need to use NEHotspotNetwork or CNCopyCurrentNetworkInfo
        // This requires the Access WiFi Information entitlement and location permission
        if #available(iOS 14.0, *) {
            // NEHotspotNetwork requires async fetch
            return nil // Will be fetched asynchronously
        } else {
            // Fallback for older iOS - CNCopyCurrentNetworkInfo
            // Note: Requires Access WiFi Information entitlement
            return nil
        }
        #else
        return nil
        #endif
    }

    /// Get current network privacy status
    public func getNetworkPrivacyStatus() async -> NetworkPrivacyStatus {
        let monitor = NWPathMonitor()
        let queue = DispatchQueue(label: "network-monitor")

        return await withCheckedContinuation { continuation in
            monitor.pathUpdateHandler = { [self] path in
                monitor.cancel()

                if path.usesInterfaceType(.wifi) {
                    // Try to get SSID to make smarter decision
                    // For now, we'll check connection type and provide general info
                    // Full SSID detection requires NEHotspotNetwork async call

                    Task { @MainActor in
                        let ssid = await self.fetchCurrentSSIDAsync()
                        let trusted = self.getTrustedNetworks()

                        if let ssid = ssid {
                            if trusted.contains(ssid) {
                                // User marked this network as trusted
                                continuation.resume(returning: NetworkPrivacyStatus(
                                    level: .good,
                                    connectionType: "WiFi (\(ssid))",
                                    ssid: ssid,
                                    warning: nil,
                                    suggestion: "Connected to your trusted network."
                                ))
                            } else if self.isLikelyPublicNetwork(ssid) {
                                // Looks like a public network
                                continuation.resume(returning: NetworkPrivacyStatus(
                                    level: .caution,
                                    connectionType: "WiFi (\(ssid))",
                                    ssid: ssid,
                                    warning: "This appears to be a public network. Activity may be visible to others.",
                                    suggestion: "Consider using mobile data for sensitive lookups, or mark this as a trusted network if it's yours."
                                ))
                            } else {
                                // Unknown network - neutral stance
                                continuation.resume(returning: NetworkPrivacyStatus(
                                    level: .moderate,
                                    connectionType: "WiFi (\(ssid))",
                                    ssid: ssid,
                                    warning: nil,
                                    suggestion: "If this is your home or work network, you can mark it as trusted."
                                ))
                            }
                        } else {
                            // Couldn't get SSID (no location permission)
                            continuation.resume(returning: NetworkPrivacyStatus(
                                level: .moderate,
                                connectionType: "WiFi",
                                ssid: nil,
                                warning: nil,
                                suggestion: "Enable location access for smarter network detection. Location is used on-device only and never sent to any server."
                            ))
                        }
                    }
                } else if path.usesInterfaceType(.cellular) {
                    continuation.resume(returning: NetworkPrivacyStatus(
                        level: .good,
                        connectionType: "Mobile Data",
                        ssid: nil,
                        warning: nil,
                        suggestion: "Mobile data is generally more private than public WiFi."
                    ))
                } else if path.status == .unsatisfied {
                    continuation.resume(returning: NetworkPrivacyStatus(
                        level: .offline,
                        connectionType: "Offline",
                        ssid: nil,
                        warning: "You're offline.",
                        suggestion: "Some features may not work without internet."
                    ))
                } else {
                    continuation.resume(returning: NetworkPrivacyStatus(
                        level: .unknown,
                        connectionType: "Unknown",
                        ssid: nil,
                        warning: nil,
                        suggestion: nil
                    ))
                }
            }
            monitor.start(queue: queue)
        }
    }

    /// Fetch current SSID asynchronously using NEHotspotNetwork
    /// Note: Requires "Access WiFi Information" entitlement and location permission
    /// Location data is used on-device only to identify the network name - it is never sent to any server
    @MainActor
    private func fetchCurrentSSIDAsync() async -> String? {
        #if os(iOS)
        return await withCheckedContinuation { continuation in
            NEHotspotNetwork.fetchCurrent { network in
                continuation.resume(returning: network?.ssid)
            }
        }
        #else
        return nil
        #endif
    }

    // MARK: - Offline Mode

    /// Check if offline mode is enabled
    public func isOfflineModeEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: offlineModeKey)
    }

    /// Enable or disable offline mode
    public func setOfflineModeEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: offlineModeKey)
    }

    // MARK: - Tor/Orbot Integration

    /// Check if Tor routing is enabled
    public func isTorEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: torEnabledKey)
    }

    /// Enable or disable Tor routing
    public func setTorEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: torEnabledKey)
    }

    /// Check if Orbot is installed on the device
    @MainActor
    public func isOrbotInstalled() -> Bool {
        #if canImport(UIKit) && !os(watchOS)
        guard let url = URL(string: "orbot://") else { return false }
        return UIApplication.shared.canOpenURL(url)
        #else
        return false
        #endif
    }

    /// Open Orbot app to start Tor connection
    @MainActor
    public func openOrbot() {
        #if canImport(UIKit) && !os(watchOS)
        if let url = URL(string: "orbot://") {
            UIApplication.shared.open(url, options: [:])
        }
        #endif
    }

    /// Check if Orbot's SOCKS5 proxy is responding
    /// This verifies that Orbot is running and Tor is connected
    public func isOrbotProxyAvailable() async -> Bool {
        await Self.isPortOpen(host: Self.orbotProxyHost, port: Self.orbotProxyPort)
    }

    /// Returns true when a TCP connection to `host:port` becomes ready within
    /// `timeout` seconds.
    ///
    /// Every exit path claims the latch first. Without it this resumed the
    /// continuation twice — `cancel()` on a ready connection delivers a
    /// follow-up `.cancelled` state, and the timeout fires independently on
    /// another queue — which traps at runtime.
    static func isPortOpen(
        host: String,
        port: UInt16,
        timeout: TimeInterval = 2
    ) async -> Bool {
        await withCheckedContinuation { continuation in
            let connection = NWConnection(
                host: NWEndpoint.Host(host),
                port: NWEndpoint.Port(integerLiteral: port),
                using: .tcp
            )
            let latch = OneShotLatch()

            @Sendable func finish(_ result: Bool) {
                guard latch.claim() else { return }
                connection.stateUpdateHandler = nil
                connection.cancel()
                continuation.resume(returning: result)
            }

            connection.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    finish(true)
                case .failed, .cancelled:
                    finish(false)
                default:
                    break
                }
            }

            connection.start(queue: .global())

            DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
                finish(false)
            }
        }
    }

    /// Get the current Tor connection status
    public func getTorStatus() async -> TorStatus {
        guard isTorEnabled() else {
            return TorStatus(
                isEnabled: false,
                isOrbotInstalled: await MainActor.run { isOrbotInstalled() },
                isProxyAvailable: false,
                message: "Tor routing is disabled"
            )
        }

        let installed = await MainActor.run { isOrbotInstalled() }
        guard installed else {
            return TorStatus(
                isEnabled: true,
                isOrbotInstalled: false,
                isProxyAvailable: false,
                message: "Orbot is not installed. Install Orbot to use Tor."
            )
        }

        let proxyAvailable = await isOrbotProxyAvailable()
        if proxyAvailable {
            return TorStatus(
                isEnabled: true,
                isOrbotInstalled: true,
                isProxyAvailable: true,
                message: "Connected via Tor"
            )
        } else {
            return TorStatus(
                isEnabled: true,
                isOrbotInstalled: true,
                isProxyAvailable: false,
                message: "Orbot is installed but not running. Open Orbot to connect."
            )
        }
    }

    /// Create a URLSessionConfiguration configured for Tor proxy
    /// Note: On iOS, SOCKS proxy configuration uses string keys
    public nonisolated func createTorProxyConfiguration() -> URLSessionConfiguration {
        let config = URLSessionConfiguration.default

        #if os(macOS)
        config.connectionProxyDictionary = [
            kCFNetworkProxiesSOCKSEnable as String: true,
            kCFNetworkProxiesSOCKSProxy as String: Self.orbotProxyHost,
            kCFNetworkProxiesSOCKSPort as String: Self.orbotProxyPort
        ]
        #else
        // On iOS, use string keys directly since the CF constants are unavailable
        config.connectionProxyDictionary = [
            "SOCKSEnable": 1,
            "SOCKSProxy": Self.orbotProxyHost,
            "SOCKSPort": Self.orbotProxyPort
        ]
        #endif

        config.timeoutIntervalForRequest = 30 // Tor can be slower
        config.timeoutIntervalForResource = 60
        return config
    }

    // MARK: - Crash Reporting & Analytics

    /// Check if crash reporting is enabled (default: true for opt-in)
    public func isCrashReportingEnabled() -> Bool {
        // Default to true if not explicitly set
        if UserDefaults.standard.object(forKey: crashReportingEnabledKey) == nil {
            return true
        }
        return UserDefaults.standard.bool(forKey: crashReportingEnabledKey)
    }

    /// Enable or disable crash reporting
    public func setCrashReportingEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: crashReportingEnabledKey)
        // TODO: When Sentry is integrated, call SentrySDK.close() or reconfigure here
    }

    // MARK: - Share Profile with Carl

    /// Check if sharing profile with Carl is enabled (default: false, opt-in required)
    public func isShareProfileWithCarlEnabled() -> Bool {
        // Default to false - user must explicitly opt in
        return UserDefaults.standard.bool(forKey: shareProfileWithCarlKey)
    }

    /// Enable or disable sharing profile with Carl
    public func setShareProfileWithCarlEnabled(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: shareProfileWithCarlKey)
    }

    // MARK: - Encrypted Storage

    /// Check if data encryption is enabled
    public func isEncryptionEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: encryptionEnabledKey)
    }

    /// Enable data encryption
    public func enableEncryption() -> EncryptionResult {
        // Generate a new encryption key if not exists
        if readFromKeychain(key: encryptionKeyKeychainKey) == nil {
            let key = SymmetricKey(size: .bits256)
            let keyData = key.withUnsafeBytes { Data($0) }
            let keyString = keyData.base64EncodedString()

            guard saveToKeychain(key: encryptionKeyKeychainKey, data: keyString) else {
                return EncryptionResult(
                    success: false,
                    message: "Failed to create encryption key"
                )
            }
        }

        UserDefaults.standard.set(true, forKey: encryptionEnabledKey)
        return EncryptionResult(
            success: true,
            message: "Data encryption enabled. Your data is now protected."
        )
    }

    /// Disable data encryption
    public func disableEncryption() -> EncryptionResult {
        UserDefaults.standard.set(false, forKey: encryptionEnabledKey)
        return EncryptionResult(
            success: true,
            message: "Data encryption disabled."
        )
    }

    /// Encrypt data using the stored key
    public func encryptData(_ data: Data) -> Data? {
        guard isEncryptionEnabled(),
              let keyString = readFromKeychain(key: encryptionKeyKeychainKey),
              let keyData = Data(base64Encoded: keyString) else {
            return data
        }

        let key = SymmetricKey(data: keyData)

        do {
            let sealedBox = try AES.GCM.seal(data, using: key)
            return sealedBox.combined
        } catch {
            return nil
        }
    }

    /// Decrypt data using the stored key
    public func decryptData(_ encryptedData: Data) -> Data? {
        guard isEncryptionEnabled(),
              let keyString = readFromKeychain(key: encryptionKeyKeychainKey),
              let keyData = Data(base64Encoded: keyString) else {
            return encryptedData
        }

        let key = SymmetricKey(data: keyData)

        do {
            let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
            return try AES.GCM.open(sealedBox, using: key)
        } catch {
            return nil
        }
    }

    // MARK: - Safety Tips

    /// Check if safety tips should be shown
    public func shouldShowSafetyTips() -> Bool {
        UserDefaults.standard.bool(forKey: showSafetyTipsKey)
    }

    /// Enable or disable safety tips
    public func setShowSafetyTips(_ show: Bool) {
        UserDefaults.standard.set(show, forKey: showSafetyTipsKey)
    }

    // MARK: - Clear All Data

    /// Clear all app data with confirmation
    public func clearAllData() async {
        // Clear history
        await clearAllHistory()

        // Clear user preferences
        let keysToRemove = [
            "baynavigator:user_prefs",
            "baynavigator:onboarding_complete",
            "baynavigator:favorites",
            "baynavigator:profile"
        ]

        for key in keysToRemove {
            UserDefaults.standard.removeObject(forKey: key)
        }

        // Clear session data
        sessionRecentPrograms.removeAll()
        sessionSearchHistory.removeAll()
    }

    // MARK: - Private Helpers

    private func hashPin(_ pin: String) -> String {
        let inputData = Data(pin.utf8)
        let hashed = SHA256.hash(data: inputData)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }

    private func isSequentialAscending(_ pin: String) -> Bool {
        let digits = Array(pin)
        for i in 0..<digits.count - 1 {
            guard let current = Int(String(digits[i])),
                  let next = Int(String(digits[i + 1])) else {
                return false
            }
            if next != (current + 1) % 10 {
                return false
            }
        }
        return true
    }

    private func isSequentialDescending(_ pin: String) -> Bool {
        let digits = Array(pin)
        for i in 0..<digits.count - 1 {
            guard let current = Int(String(digits[i])),
                  let next = Int(String(digits[i + 1])) else {
                return false
            }
            if next != (current - 1 + 10) % 10 {
                return false
            }
        }
        return true
    }

    private func isCommonWeakPin(_ pin: String) -> Bool {
        let weakPins = [
            "000000", "111111", "222222", "333333", "444444",
            "555555", "666666", "777777", "888888", "999999",
            "123456", "654321", "123123", "112233", "121212",
            "696969", "131313", "420420", "101010", "192837",
            "1234567", "7654321", "1111111", "0000000",
            "12345678", "87654321", "11111111", "00000000"
        ]
        return weakPins.contains(pin)
    }

    private func isRepeatedPattern(_ pin: String) -> Bool {
        guard pin.count >= 4 else { return false }

        // Check for 2-digit repeated patterns
        if pin.count % 2 == 0 {
            let pattern = String(pin.prefix(2))
            var reconstructed = ""
            for _ in 0..<(pin.count / 2) {
                reconstructed += pattern
            }
            if reconstructed == pin { return true }
        }

        // Check for 3-digit repeated patterns
        if pin.count % 3 == 0 {
            let pattern = String(pin.prefix(3))
            var reconstructed = ""
            for _ in 0..<(pin.count / 3) {
                reconstructed += pattern
            }
            if reconstructed == pin { return true }
        }

        return false
    }

    // MARK: - Keychain Helpers

    private nonisolated func saveToKeychain(key: String, data: String) -> Bool {
        guard let dataToStore = data.data(using: .utf8) else { return false }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: dataToStore,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Delete any existing item
        SecItemDelete(query as CFDictionary)

        // Add the new item
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }

    private nonisolated func readFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let string = String(data: data, encoding: .utf8) else {
            return nil
        }

        return string
    }

    private nonisolated func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Data Models

/// Quick exit destination
public struct QuickExitDestination: Identifiable, Sendable {
    public let id: String
    public let name: String
    public let url: String
    public let description: String

    public init(id: String, name: String, url: String, description: String) {
        self.id = id
        self.name = name
        self.url = url
        self.description = description
    }
}

/// PIN validation result
public struct PinValidation: Sendable {
    public let isValid: Bool
    public let message: String

    public init(isValid: Bool, message: String) {
        self.isValid = isValid
        self.message = message
    }
}

/// Result of setting a PIN
public struct PinSetResult: Sendable {
    public let success: Bool
    public let message: String

    public init(success: Bool, message: String) {
        self.success = success
        self.message = message
    }
}

/// Biometric authentication type
public enum BiometricType: Sendable {
    case none
    case touchID
    case faceID
    case opticID

    public var displayName: String {
        switch self {
        case .none: return "None"
        case .touchID: return "Touch ID"
        case .faceID: return "Face ID"
        case .opticID: return "Optic ID"
        }
    }

    public var systemImage: String {
        switch self {
        case .none: return "lock"
        case .touchID: return "touchid"
        case .faceID: return "faceid"
        case .opticID: return "opticid"
        }
    }
}

/// Network privacy level
public enum NetworkPrivacyLevel: Sendable {
    case good
    case moderate
    case caution
    case offline
    case unknown

    public var systemImage: String {
        switch self {
        case .good: return "checkmark.shield.fill"
        case .moderate: return "cellularbars"
        case .caution: return "wifi.exclamationmark"
        case .offline: return "wifi.slash"
        case .unknown: return "questionmark.circle"
        }
    }
}

/// Network privacy status
public struct NetworkPrivacyStatus: Sendable {
    public let level: NetworkPrivacyLevel
    public let connectionType: String
    public let ssid: String?
    public let warning: String?
    public let suggestion: String?

    public init(level: NetworkPrivacyLevel, connectionType: String, ssid: String? = nil, warning: String?, suggestion: String?) {
        self.level = level
        self.connectionType = connectionType
        self.ssid = ssid
        self.warning = warning
        self.suggestion = suggestion
    }
}

/// Result of encryption operation
public struct EncryptionResult: Sendable {
    public let success: Bool
    public let message: String

    public init(success: Bool, message: String) {
        self.success = success
        self.message = message
    }
}

/// Tor connection status
public struct TorStatus: Sendable {
    public let isEnabled: Bool
    public let isOrbotInstalled: Bool
    public let isProxyAvailable: Bool
    public let message: String

    public init(isEnabled: Bool, isOrbotInstalled: Bool, isProxyAvailable: Bool, message: String) {
        self.isEnabled = isEnabled
        self.isOrbotInstalled = isOrbotInstalled
        self.isProxyAvailable = isProxyAvailable
        self.message = message
    }

    /// Whether Tor is fully functional (enabled, installed, and proxy running)
    public var isConnected: Bool {
        isEnabled && isOrbotInstalled && isProxyAvailable
    }
}
