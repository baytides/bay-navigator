import Foundation

/// A thread-safe one-shot latch for guarding `CheckedContinuation` resumption.
///
/// Network callbacks routinely fire from more than one queue: an `NWConnection`
/// state update, a timeout scheduled on a global queue, and the extra
/// `.cancelled` update that `cancel()` itself delivers. Resuming a checked
/// continuation twice is a fatal runtime error, so every path must funnel
/// through a claim that succeeds exactly once.
///
/// `claim()` returns `true` for the first caller and `false` for every caller
/// after it, whichever queue they arrive on.
final class OneShotLatch: @unchecked Sendable {
    private let lock = NSLock()
    private var claimed = false

    func claim() -> Bool {
        lock.lock()
        defer { lock.unlock() }
        if claimed { return false }
        claimed = true
        return true
    }
}
