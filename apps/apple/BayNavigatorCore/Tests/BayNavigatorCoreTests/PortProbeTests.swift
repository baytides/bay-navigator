import Testing
import Foundation
import Network
@testable import BayNavigatorCore

/// `SafetyService.isPortOpen` drives a `CheckedContinuation` from three
/// independent callbacks (state update, the extra `.cancelled` that `cancel()`
/// delivers, and a timeout on a global queue). Resuming twice traps, so these
/// exercise the paths that used to overlap.
struct PortProbeTests {

    /// Binds a listener on an ephemeral port and returns it with its port.
    private func startListener() throws -> (NWListener, UInt16) {
        let listener = try NWListener(using: .tcp, on: .any)
        listener.newConnectionHandler = { connection in
            connection.start(queue: .global())
        }
        listener.start(queue: .global())

        // Wait for the kernel to assign a port.
        let deadline = Date().addingTimeInterval(5)
        while listener.port?.rawValue == nil || listener.port?.rawValue == 0 {
            if Date() > deadline { throw ProbeError.listenerNeverStarted }
            usleep(10_000)
        }
        return (listener, listener.port!.rawValue)
    }

    enum ProbeError: Error { case listenerNeverStarted }

    @Test func reportsOpenPortWithoutResumingTwice() async throws {
        // Regression: the ready branch called `connection.cancel()` and then
        // resumed, and the resulting `.cancelled` state resumed a second time.
        // That made every *successful* probe a crash.
        let (listener, port) = try startListener()
        defer { listener.cancel() }

        let open = await SafetyService.isPortOpen(host: "127.0.0.1", port: port, timeout: 3)
        #expect(open == true)

        // Give the follow-up `.cancelled` state a chance to arrive; if the
        // handler were still attached this is where the second resume trapped.
        try await Task.sleep(nanoseconds: 300_000_000)
    }

    @Test func reportsClosedPort() async {
        // Port 1 on loopback refuses fast: the `.failed` path, followed by the
        // timeout firing on another queue.
        let open = await SafetyService.isPortOpen(host: "127.0.0.1", port: 1, timeout: 1)
        #expect(open == false)
    }

    @Test func timesOutOnUnroutableHost() async {
        // 198.51.100.0/24 is TEST-NET-2: no route, so nothing but the timeout
        // resumes.
        let start = Date()
        let open = await SafetyService.isPortOpen(host: "198.51.100.1", port: 9050, timeout: 1)
        #expect(open == false)
        #expect(Date().timeIntervalSince(start) < 10)
    }

    @Test func repeatedProbesOfAnOpenPortAllComplete() async throws {
        // The double-resume was timing dependent; run the success path enough
        // times that a surviving race would show up.
        let (listener, port) = try startListener()
        defer { listener.cancel() }

        for _ in 0..<20 {
            let open = await SafetyService.isPortOpen(host: "127.0.0.1", port: port, timeout: 3)
            #expect(open == true)
        }
    }
}

struct OneShotLatchTests {
    @Test func claimSucceedsExactlyOnce() {
        let latch = OneShotLatch()
        #expect(latch.claim() == true)
        #expect(latch.claim() == false)
        #expect(latch.claim() == false)
    }

    @Test func onlyOneClaimWinsUnderConcurrency() async {
        let latch = OneShotLatch()
        let winners = await withTaskGroup(of: Bool.self) { group in
            for _ in 0..<200 {
                group.addTask { latch.claim() }
            }
            var count = 0
            for await won in group where won { count += 1 }
            return count
        }
        #expect(winners == 1)
    }
}
