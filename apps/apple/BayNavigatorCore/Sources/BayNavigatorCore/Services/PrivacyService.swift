import Foundation
import Network
#if os(iOS)
import UIKit
#endif

/// Privacy service for Bay Navigator
/// Provides censorship circumvention features inspired by Signal:
/// - Tor/Onion routing (via Orbot app on iOS, native Tor on macOS)
/// - Domain fronting for censored regions (routes through CDN)
/// - Privacy-first network configuration
public actor PrivacyService {
    public static let shared = PrivacyService()

    // MARK: - Endpoints

    /// Standard clearnet API endpoint
    public static let clearnetBaseURL = "https://baynavigator.org"

    /// Tor hidden service endpoint (requires Tor/Orbot)
    public static let onionBaseURL = "http://ik2rhhyr6f2dk2th7ofa7yph6li5tuwycqflzrkuu37ht7apbih3ypid.onion"

    /// Default Tor SOCKS5 proxy port (Orbot on iOS, native Tor on macOS)
    public static let torSocks5Port = 9050

    // MARK: - CDN Providers

    /// Available CDN providers for domain fronting
    /// Each provider has different geographic coverage and may work better in different regions
    public enum CDNProvider: String, CaseIterable, Identifiable, Sendable {
        case cloudflare = "cloudflare"
        case fastly = "fastly"
        case azure = "azure"

        public var id: String { rawValue }

        public var displayName: String {
            switch self {
            case .cloudflare: return "Cloudflare"
            case .fastly: return "Fastly"
            case .azure: return "Azure CDN"
            }
        }

        public var description: String {
            switch self {
            case .cloudflare:
                return "Global CDN with excellent coverage. Traffic appears as Cloudflare Pages."
            case .fastly:
                return "High-performance CDN. May work better in some regions."
            case .azure:
                return "Microsoft's CDN. Good option if others are blocked."
            }
        }

        /// The reflector URL for this CDN provider
        /// All CDNs now support /api/chat routing to ai.baytides.org
        public var reflectorURL: String {
            switch self {
            case .cloudflare:
                // Cloudflare Worker with AI routing
                return "https://baynavigator-ai-proxy.autumn-disk-6090.workers.dev"
            case .fastly:
                return "https://arguably-unique-hippo.global.ssl.fastly.net"
            case .azure:
                return "https://baynavigator-bacwcda5f8csa3as.z02.azurefd.net"
            }
        }

        /// Icon for the CDN provider
        public var icon: String {
            switch self {
            case .cloudflare: return "cloud.fill"
            case .fastly: return "bolt.fill"
            case .azure: return "square.stack.3d.up.fill"
            }
        }
    }

    // MARK: - Cache Keys

    private let privacyModeKey = "baynavigator:privacy_mode"
    private let autoDetectCensorshipKey = "baynavigator:auto_detect_censorship"
    private let cdnProviderKey = "baynavigator:cdn_provider"

    private init() {}

    // MARK: - Privacy Mode

    /// Privacy routing mode
    public enum PrivacyMode: String, CaseIterable, Identifiable, Sendable {
        /// Standard direct connection
        case standard = "standard"

        /// Domain fronting through CDN (for censored regions)
        /// Traffic appears to go to cloudflare.com but reaches Bay Navigator
        case domainFronting = "domain_fronting"

        /// Tor/Onion routing (requires Orbot on iOS or Tor on macOS)
        /// Maximum privacy but slower
        case tor = "tor"

        public var id: String { rawValue }

        public var displayName: String {
            switch self {
            case .standard: return "Standard"
            case .domainFronting: return "Censorship Circumvention"
            case .tor: return "Tor Network"
            }
        }

        public var description: String {
            switch self {
            case .standard:
                return "Direct connection to Bay Navigator servers"
            case .domainFronting:
                return "Routes through CDN to bypass censorship. Traffic appears as normal web browsing."
            case .tor:
                return "Routes through Tor network for maximum privacy. Requires Orbot app on iOS."
            }
        }

        public var icon: String {
            switch self {
            case .standard: return "globe"
            case .domainFronting: return "shield.checkered"
            case .tor: return "network.badge.shield.half.filled"
            }
        }

        public var requiresExternalApp: Bool {
            self == .tor
        }
    }

    // MARK: - Settings

    /// Get current privacy mode
    public func getPrivacyMode() -> PrivacyMode {
        guard let rawValue = UserDefaults.standard.string(forKey: privacyModeKey),
              let mode = PrivacyMode(rawValue: rawValue) else {
            return .standard
        }
        return mode
    }

    /// Set privacy mode
    public func setPrivacyMode(_ mode: PrivacyMode) {
        UserDefaults.standard.set(mode.rawValue, forKey: privacyModeKey)
    }

    /// Check if automatic censorship detection is enabled
    public func isAutoDetectCensorshipEnabled() -> Bool {
        UserDefaults.standard.bool(forKey: autoDetectCensorshipKey)
    }

    /// Enable or disable automatic censorship detection
    public func setAutoDetectCensorship(_ enabled: Bool) {
        UserDefaults.standard.set(enabled, forKey: autoDetectCensorshipKey)
    }

    /// Get current CDN provider for domain fronting
    public func getCDNProvider() -> CDNProvider {
        guard let rawValue = UserDefaults.standard.string(forKey: cdnProviderKey),
              let provider = CDNProvider(rawValue: rawValue) else {
            return .cloudflare // Default
        }
        return provider
    }

    /// Set CDN provider for domain fronting
    public func setCDNProvider(_ provider: CDNProvider) {
        UserDefaults.standard.set(provider.rawValue, forKey: cdnProviderKey)
    }

    // MARK: - Tor Detection

    /// Check if Tor/Orbot is running and accessible
    public func isTorAvailable() async -> Bool {
        await isTorProxyReachable(host: "127.0.0.1", port: Self.torSocks5Port)
    }

    /// Check if a Tor proxy is reachable at the given address
    private func isTorProxyReachable(host: String, port: Int) async -> Bool {
        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(host),
            port: NWEndpoint.Port(integerLiteral: UInt16(port))
        )
        let connection = NWConnection(to: endpoint, using: .tcp)

        return await withCheckedContinuation { continuation in
            // The state handler and the timeout run on different queues, so the
            // "have we resumed yet" check has to be atomic — a plain captured
            // Bool let both paths through and trapped on the second resume.
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

            // Timeout after 2 seconds
            DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
                finish(false)
            }
        }
    }

    // MARK: - Censorship Detection

    /// Detect if we're likely in a censored region
    /// Checks if direct connection to Bay Navigator is blocked
    public func detectCensorship() async -> Bool {
        // Try direct connection with short timeout
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 5
        config.timeoutIntervalForResource = 5
        let session = URLSession(configuration: config)

        guard let url = URL(string: "\(Self.clearnetBaseURL)/api/health") else {
            return false
        }

        do {
            let (_, response) = try await session.data(from: url)
            if let httpResponse = response as? HTTPURLResponse {
                // If we get a response, we're not censored
                return httpResponse.statusCode != 200
            }
            return true
        } catch {
            // Connection failed - likely censored or no internet
            // Check if we can reach a known-good site
            guard let testURL = URL(string: "https://www.google.com") else {
                return false
            }

            do {
                let (_, _) = try await session.data(from: testURL)
                // Internet works but Bay Navigator is blocked = censored
                return true
            } catch {
                // No internet at all
                return false
            }
        }
    }

    // MARK: - URL Configuration

    /// Get the appropriate base URL based on privacy settings
    public func getBaseURL() async -> String {
        let mode = getPrivacyMode()
        let cdnProvider = getCDNProvider()

        switch mode {
        case .standard:
            // Auto-detect censorship if enabled
            if isAutoDetectCensorshipEnabled() {
                let isCensored = await detectCensorship()
                if isCensored {
                    return cdnProvider.reflectorURL
                }
            }
            return Self.clearnetBaseURL

        case .domainFronting:
            return cdnProvider.reflectorURL

        case .tor:
            let torAvailable = await isTorAvailable()
            if torAvailable {
                return Self.onionBaseURL
            }
            // Fall back to domain fronting if Tor not available
            return cdnProvider.reflectorURL
        }
    }

    /// Create URLSession configuration for current privacy mode
    public func createURLSessionConfiguration() async -> URLSessionConfiguration {
        let mode = getPrivacyMode()
        let config = URLSessionConfiguration.default

        switch mode {
        case .standard, .domainFronting:
            // Standard HTTPS configuration
            config.timeoutIntervalForRequest = 30
            config.timeoutIntervalForResource = 60
            return config

        case .tor:
            let torAvailable = await isTorAvailable()
            if torAvailable {
                // Configure SOCKS5 proxy for Tor
                #if os(macOS)
                config.connectionProxyDictionary = [
                    kCFNetworkProxiesSOCKSEnable as String: true,
                    kCFNetworkProxiesSOCKSProxy as String: "127.0.0.1",
                    kCFNetworkProxiesSOCKSPort as String: Self.torSocks5Port
                ]
                #else
                // iOS proxy configuration
                config.connectionProxyDictionary = [
                    "SOCKSEnable": 1,
                    "SOCKSProxy": "127.0.0.1",
                    "SOCKSPort": Self.torSocks5Port
                ]
                #endif
                config.timeoutIntervalForRequest = 60 // Tor is slower
                config.timeoutIntervalForResource = 120
            } else {
                // Fallback to standard config
                config.timeoutIntervalForRequest = 30
                config.timeoutIntervalForResource = 60
            }
            return config
        }
    }

    // MARK: - Privacy Status

    /// Get current privacy status for UI display
    public func getPrivacyStatus() async -> PrivacyStatus {
        let mode = getPrivacyMode()
        let torAvailable = await isTorAvailable()
        let cdnProvider = getCDNProvider()

        switch mode {
        case .standard:
            return PrivacyStatus(
                mode: .standard,
                cdnProvider: nil,
                description: "Direct connection",
                isActive: true,
                warning: nil
            )

        case .domainFronting:
            return PrivacyStatus(
                mode: .domainFronting,
                cdnProvider: cdnProvider,
                description: "Routing through \(cdnProvider.displayName)",
                isActive: true,
                warning: nil
            )

        case .tor:
            if torAvailable {
                return PrivacyStatus(
                    mode: .tor,
                    cdnProvider: nil,
                    description: "Connected via Tor",
                    isActive: true,
                    warning: nil
                )
            } else {
                #if os(iOS)
                return PrivacyStatus(
                    mode: .tor,
                    cdnProvider: cdnProvider,
                    description: "Tor enabled but Orbot not running",
                    isActive: false,
                    warning: "Open Orbot and connect to use Tor (using \(cdnProvider.displayName) fallback)"
                )
                #else
                return PrivacyStatus(
                    mode: .tor,
                    cdnProvider: cdnProvider,
                    description: "Tor enabled but not running",
                    isActive: false,
                    warning: "Start Tor service to use onion routing (using \(cdnProvider.displayName) fallback)"
                )
                #endif
            }
        }
    }

    /// Test the current privacy configuration
    public func testPrivacyConnection() async -> PrivacyTestResult {
        let startTime = Date()
        let mode = getPrivacyMode()

        do {
            let baseURL = await getBaseURL()
            let config = await createURLSessionConfiguration()
            let session = URLSession(configuration: config)

            guard let url = URL(string: "\(baseURL)/api/metadata.json") else {
                throw URLError(.badURL)
            }

            let (_, response) = try await session.data(from: url)
            let latency = Int(Date().timeIntervalSince(startTime) * 1000)

            guard let httpResponse = response as? HTTPURLResponse else {
                return PrivacyTestResult(
                    success: false,
                    latencyMs: latency,
                    message: "Invalid response",
                    mode: mode
                )
            }

            if httpResponse.statusCode == 200 {
                return PrivacyTestResult(
                    success: true,
                    latencyMs: latency,
                    message: "Connection successful",
                    mode: mode
                )
            } else {
                return PrivacyTestResult(
                    success: false,
                    latencyMs: latency,
                    message: "Server returned \(httpResponse.statusCode)",
                    mode: mode
                )
            }
        } catch {
            let latency = Int(Date().timeIntervalSince(startTime) * 1000)
            return PrivacyTestResult(
                success: false,
                latencyMs: latency,
                message: error.localizedDescription,
                mode: mode
            )
        }
    }

    // MARK: - Orbot Integration (iOS)

    #if os(iOS)
    /// Check if Orbot is installed
    @MainActor
    public func isOrbotInstalled() -> Bool {
        guard let url = URL(string: "orbot://") else { return false }
        return UIApplication.shared.canOpenURL(url)
    }

    /// Open Orbot app
    @MainActor
    public func openOrbot() {
        guard let url = URL(string: "orbot://") else { return }
        UIApplication.shared.open(url)
    }

    /// Get Orbot App Store URL
    public var orbotAppStoreURL: URL {
        URL(string: "https://apps.apple.com/app/orbot/id1609461599")!
    }
    #endif

    // MARK: - Legacy Compatibility

    /// Legacy: Check if onion routing is enabled (maps to Tor mode)
    public func isOnionEnabled() -> Bool {
        getPrivacyMode() == .tor
    }

    /// Legacy: Enable or disable onion routing (sets Tor mode)
    public func setOnionEnabled(_ enabled: Bool) {
        setPrivacyMode(enabled ? .tor : .standard)
    }
}

// MARK: - Data Models

/// Privacy status for UI display
public struct PrivacyStatus: Sendable {
    public let mode: PrivacyService.PrivacyMode
    public let cdnProvider: PrivacyService.CDNProvider?
    public let description: String
    public let isActive: Bool
    public var warning: String?

    public init(
        mode: PrivacyService.PrivacyMode,
        cdnProvider: PrivacyService.CDNProvider? = nil,
        description: String,
        isActive: Bool,
        warning: String? = nil
    ) {
        self.mode = mode
        self.cdnProvider = cdnProvider
        self.description = description
        self.isActive = isActive
        self.warning = warning
    }

    /// Icon for current privacy level
    public var icon: String {
        if let cdnProvider, mode == .domainFronting {
            return cdnProvider.icon
        }
        return mode.icon
    }
}

/// Result of testing privacy connection
public struct PrivacyTestResult: Sendable {
    public let success: Bool
    public let latencyMs: Int
    public let message: String
    public let mode: PrivacyService.PrivacyMode

    public init(success: Bool, latencyMs: Int, message: String, mode: PrivacyService.PrivacyMode) {
        self.success = success
        self.latencyMs = latencyMs
        self.message = message
        self.mode = mode
    }
}
