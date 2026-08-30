import SwiftUI
import WebKit
import BayNavigatorCore

/// A view that displays markdown content for eligibility guides
/// Fetches content from the API and renders it natively using SwiftUI
struct GuideViewerView: View {
    let title: String
    let guideId: String
    let accentColor: Color

    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL
    @Environment(\.colorScheme) private var colorScheme

    @StateObject private var viewModel: GuideViewerViewModel

    @State private var showShareSheet = false
    @State private var showScrollToTop = false

    init(title: String, guideId: String, accentColor: Color = .appPrimary) {
        self.title = title
        self.guideId = guideId
        self.accentColor = accentColor
        _viewModel = StateObject(wrappedValue: GuideViewerViewModel(guideId: guideId))
    }

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            contentView
                .navigationTitle(title)
                #if os(iOS)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        HStack(spacing: 12) {
                            Button {
                                Task {
                                    await viewModel.loadContent()
                                }
                            } label: {
                                Image(systemName: "arrow.clockwise")
                            }

                            Button {
                                openInBrowser()
                            } label: {
                                Image(systemName: "safari")
                            }

                            Button {
                                showShareSheet = true
                            } label: {
                                Image(systemName: "square.and.arrow.up")
                            }
                        }
                    }
                }
                .sheet(isPresented: $showShareSheet) {
                    ShareSheet(items: [shareURL])
                }
                #elseif os(macOS)
                .toolbar {
                    ToolbarItemGroup(placement: .automatic) {
                        Button {
                            Task {
                                await viewModel.loadContent()
                            }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }

                        Button {
                            openInBrowser()
                        } label: {
                            Image(systemName: "safari")
                        }

                        ShareLink(item: shareURL) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
                #endif

            // Scroll to top button
            if showScrollToTop {
                scrollToTopButton
            }
        }
        .task {
            await viewModel.loadContent()
        }
    }

    // MARK: - Content View

    @ViewBuilder
    private var contentView: some View {
        switch viewModel.state {
        case .loading:
            loadingView
        case .loaded(let content):
            if viewModel.useWebViewFallback {
                webViewFallback
            } else {
                markdownScrollView(content: content)
            }
        case .notAvailable:
            notAvailableView
        case .error(let message):
            errorView(message: message)
        }
    }

    // MARK: - Loading View

    private var loadingView: some View {
        VStack(spacing: 24) {
            ProgressView()
                .scaleEffect(1.5)
                .tint(accentColor)

            Text("Loading guide...")
                .font(.body)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Error View

    private func errorView(message: String) -> some View {
        VStack(spacing: 24) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 64))
                .foregroundStyle(colorScheme == .dark ? Color.darkTextSecondary : Color.lightTextSecondary)

            Text("Unable to load guide")
                .font(.title2.bold())

            Text(message)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            VStack(spacing: 12) {
                Button {
                    Task {
                        await viewModel.loadContent()
                    }
                } label: {
                    Label("Try Again", systemImage: "arrow.clockwise")
                        .frame(maxWidth: 200)
                }
                .buttonStyle(.borderedProminent)
                .tint(accentColor)

                Button {
                    openInBrowser()
                } label: {
                    Label("Open in Browser", systemImage: "safari")
                        .frame(maxWidth: 200)
                }
                .buttonStyle(.bordered)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    // MARK: - Not Available View

    private var notAvailableView: some View {
        VStack(spacing: 24) {
            Image(systemName: "doc.text.magnifyingglass")
                .font(.system(size: 64))
                .foregroundStyle(accentColor)

            Text("Opening in Browser")
                .font(.title2.bold())

            Text("Guide content not available in-app yet.\nOpening the web version...")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            ProgressView()
                .scaleEffect(1.2)
                .tint(accentColor)

            Button {
                openInBrowser()
            } label: {
                Label("Open Now", systemImage: "safari")
                    .frame(maxWidth: 200)
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
        .onChange(of: viewModel.shouldOpenInBrowser) { _, shouldOpen in
            if shouldOpen {
                openInBrowser()
            }
        }
    }

    // MARK: - Markdown Scroll View

    private func markdownScrollView(content: String) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    // Invisible anchor for scroll to top
                    Color.clear
                        .frame(height: 1)
                        .id("top")

                    MarkdownContentView(
                        content: content,
                        accentColor: accentColor,
                        onLinkTap: { url in
                            openURL(url)
                        }
                    )
                    .padding()
                }
                .background(
                    GeometryReader { geo in
                        Color.clear
                            .preference(key: ScrollOffsetPreferenceKey.self, value: geo.frame(in: .named("scroll")).minY)
                    }
                )
            }
            .coordinateSpace(name: "scroll")
            .onPreferenceChange(ScrollOffsetPreferenceKey.self) { offset in
                withAnimation(.easeInOut(duration: 0.2)) {
                    showScrollToTop = offset < -300
                }
            }
            .overlay(alignment: .bottomTrailing) {
                if showScrollToTop {
                    Button {
                        withAnimation {
                            proxy.scrollTo("top", anchor: .top)
                        }
                    } label: {
                        Image(systemName: "arrow.up")
                            .font(.title3.bold())
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(accentColor)
                            .clipShape(Circle())
                            .shadow(color: .black.opacity(0.2), radius: 4, x: 0, y: 2)
                    }
                    .padding()
                    .transition(.scale.combined(with: .opacity))
                }
            }
        }
    }

    // MARK: - WebView Fallback

    private var webViewFallback: some View {
        MarkdownWebView(
            htmlContent: viewModel.htmlContent,
            accentColor: accentColor,
            colorScheme: colorScheme,
            onLinkTap: { url in
                openURL(url)
            }
        )
    }

    // MARK: - Scroll to Top Button

    private var scrollToTopButton: some View {
        EmptyView() // Handled in overlay now
    }

    // MARK: - Helper Methods

    private func openInBrowser() {
        if let url = URL(string: "https://baynavigator.org/eligibility/\(guideId)") {
            openURL(url)
        }
    }

    private var shareURL: URL {
        URL(string: "https://baynavigator.org/eligibility/\(guideId)") ?? URL(string: "https://baynavigator.org")!
    }
}

// MARK: - Scroll Offset Preference Key

private struct ScrollOffsetPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0
    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = nextValue()
    }
}

// MARK: - Guide Viewer View Model

@MainActor
final class GuideViewerViewModel: ObservableObject {
    enum State {
        case loading
        case loaded(String)
        case error(String)
        case notAvailable // Content not available, will open in browser
    }

    @Published private(set) var state: State = .loading
    @Published private(set) var useWebViewFallback = false
    @Published private(set) var htmlContent = ""
    @Published var shouldOpenInBrowser = false

    private let guideId: String
    private let markdownService = MarkdownService.shared

    init(guideId: String) {
        self.guideId = guideId
    }

    func loadContent() async {
        state = .loading
        useWebViewFallback = false
        shouldOpenInBrowser = false

        do {
            let content = try await markdownService.fetchGuideMarkdown(guideId: guideId)
            state = .loaded(content)

            // Test if markdown can be parsed
            if !canParseMarkdown(content) {
                useWebViewFallback = true
                htmlContent = markdownService.convertToHTML(content, accentColor: .appPrimary)
            }
        } catch let error as MarkdownServiceError {
            switch error {
            case .notFound:
                // Content not available - signal to open in browser
                state = .notAvailable
                // Auto-open in browser after a short delay
                try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
                shouldOpenInBrowser = true
            case .networkError:
                state = .error("Unable to connect. Check your internet connection.")
            case .httpError(let code):
                state = .error("Failed to load guide (Error \(code))")
            case .invalidURL:
                state = .error("Invalid guide URL.")
            }
        } catch {
            state = .error("An unexpected error occurred.")
        }
    }

    private func canParseMarkdown(_ content: String) -> Bool {
        // Basic check - if the content has complex markdown that AttributedString can't handle,
        // we'll fall back to WebView. This is a simple heuristic.
        do {
            _ = try AttributedString(markdown: content, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace))
            return true
        } catch {
            // If basic parsing fails, check if it's due to complex content
            // For now, we'll try to render it anyway and only fallback if needed
            return true
        }
    }
}

// MARK: - Markdown Service

enum MarkdownServiceError: Error, LocalizedError {
    case notFound
    case networkError
    case httpError(Int)
    case invalidURL

    var errorDescription: String? {
        switch self {
        case .notFound:
            return "Guide not found"
        case .networkError:
            return "Network error"
        case .httpError(let code):
            return "HTTP Error: \(code)"
        case .invalidURL:
            return "Invalid URL"
        }
    }
}

actor MarkdownService {
    static let shared = MarkdownService()

    private let baseURL = "https://baynavigator.org/api/eligibility"
    private let session: URLSession
    private let requestTimeout: TimeInterval = 15

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = requestTimeout
        config.timeoutIntervalForResource = requestTimeout
        self.session = URLSession(configuration: config)
    }

    func fetchGuideMarkdown(guideId: String) async throws -> String {
        guard let url = URL(string: "\(baseURL)/\(guideId).md") else {
            throw MarkdownServiceError.invalidURL
        }

        var request = URLRequest(url: url)
        request.addValue("text/markdown, text/plain, */*", forHTTPHeaderField: "Accept")

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw MarkdownServiceError.networkError
            }

            switch httpResponse.statusCode {
            case 200:
                guard let content = String(data: data, encoding: .utf8) else {
                    throw MarkdownServiceError.networkError
                }
                return content
            case 404:
                throw MarkdownServiceError.notFound
            default:
                throw MarkdownServiceError.httpError(httpResponse.statusCode)
            }
        } catch is URLError {
            throw MarkdownServiceError.networkError
        }
    }

    nonisolated func convertToHTML(_ markdown: String, accentColor: Color) -> String {
        // Basic markdown to HTML conversion for WebView fallback
        var html = markdown

        // Convert headers
        html = html.replacingOccurrences(of: "(?m)^### (.+)$", with: "<h3>$1</h3>", options: .regularExpression)
        html = html.replacingOccurrences(of: "(?m)^## (.+)$", with: "<h2>$1</h2>", options: .regularExpression)
        html = html.replacingOccurrences(of: "(?m)^# (.+)$", with: "<h1>$1</h1>", options: .regularExpression)

        // Convert bold and italic
        html = html.replacingOccurrences(of: "\\*\\*\\*(.+?)\\*\\*\\*", with: "<strong><em>$1</em></strong>", options: .regularExpression)
        html = html.replacingOccurrences(of: "\\*\\*(.+?)\\*\\*", with: "<strong>$1</strong>", options: .regularExpression)
        html = html.replacingOccurrences(of: "\\*(.+?)\\*", with: "<em>$1</em>", options: .regularExpression)

        // Convert links
        html = html.replacingOccurrences(of: "\\[(.+?)\\]\\((.+?)\\)", with: "<a href=\"$2\">$1</a>", options: .regularExpression)

        // Convert code blocks
        html = html.replacingOccurrences(of: "```([\\s\\S]*?)```", with: "<pre><code>$1</code></pre>", options: .regularExpression)
        html = html.replacingOccurrences(of: "`(.+?)`", with: "<code>$1</code>", options: .regularExpression)

        // Convert blockquotes
        html = html.replacingOccurrences(of: "(?m)^> (.+)$", with: "<blockquote>$1</blockquote>", options: .regularExpression)

        // Convert unordered lists
        html = html.replacingOccurrences(of: "(?m)^[*-] (.+)$", with: "<li>$1</li>", options: .regularExpression)

        // Convert numbered lists
        html = html.replacingOccurrences(of: "(?m)^\\d+\\. (.+)$", with: "<li>$1</li>", options: .regularExpression)

        // Convert line breaks
        html = html.replacingOccurrences(of: "\n\n", with: "</p><p>")
        html = "<p>" + html + "</p>"

        // Clean up empty paragraphs
        html = html.replacingOccurrences(of: "<p></p>", with: "")
        html = html.replacingOccurrences(of: "<p>\\s*</p>", with: "", options: .regularExpression)

        return html
    }
}

// MARK: - Markdown Content View

struct MarkdownContentView: View {
    let content: String
    let accentColor: Color
    let onLinkTap: (URL) -> Void

    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            ForEach(Array(parseMarkdownBlocks(content).enumerated()), id: \.offset) { _, block in
                renderBlock(block)
            }
        }
    }

    // MARK: - Markdown Block Types

    private enum MarkdownBlock {
        case heading1(String)
        case heading2(String)
        case heading3(String)
        case paragraph(String)
        case bulletList([String])
        case numberedList([String])
        case codeBlock(String)
        case blockquote(String)
        case horizontalRule
    }

    // MARK: - Parse Markdown

    private func parseMarkdownBlocks(_ content: String) -> [MarkdownBlock] {
        var blocks: [MarkdownBlock] = []
        let lines = content.components(separatedBy: "\n")
        var currentBulletList: [String] = []
        var currentNumberedList: [String] = []
        var inCodeBlock = false
        var codeBlockContent = ""

        func flushBulletList() {
            if !currentBulletList.isEmpty {
                blocks.append(.bulletList(currentBulletList))
                currentBulletList = []
            }
        }

        func flushNumberedList() {
            if !currentNumberedList.isEmpty {
                blocks.append(.numberedList(currentNumberedList))
                currentNumberedList = []
            }
        }

        var i = 0
        while i < lines.count {
            let line = lines[i]
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Code block handling
            if trimmed.hasPrefix("```") {
                if inCodeBlock {
                    blocks.append(.codeBlock(codeBlockContent.trimmingCharacters(in: .newlines)))
                    codeBlockContent = ""
                    inCodeBlock = false
                } else {
                    flushBulletList()
                    flushNumberedList()
                    inCodeBlock = true
                }
                i += 1
                continue
            }

            if inCodeBlock {
                codeBlockContent += line + "\n"
                i += 1
                continue
            }

            // Empty line
            if trimmed.isEmpty {
                flushBulletList()
                flushNumberedList()
                i += 1
                continue
            }

            // Horizontal rule
            if trimmed.allSatisfy({ $0 == "-" || $0 == "*" || $0 == "_" }) && trimmed.count >= 3 {
                flushBulletList()
                flushNumberedList()
                blocks.append(.horizontalRule)
                i += 1
                continue
            }

            // Headings
            if trimmed.hasPrefix("### ") {
                flushBulletList()
                flushNumberedList()
                blocks.append(.heading3(String(trimmed.dropFirst(4))))
                i += 1
                continue
            }
            if trimmed.hasPrefix("## ") {
                flushBulletList()
                flushNumberedList()
                blocks.append(.heading2(String(trimmed.dropFirst(3))))
                i += 1
                continue
            }
            if trimmed.hasPrefix("# ") {
                flushBulletList()
                flushNumberedList()
                blocks.append(.heading1(String(trimmed.dropFirst(2))))
                i += 1
                continue
            }

            // Blockquote
            if trimmed.hasPrefix("> ") {
                flushBulletList()
                flushNumberedList()
                var quoteContent = String(trimmed.dropFirst(2))
                // Collect consecutive blockquote lines
                while i + 1 < lines.count {
                    let nextLine = lines[i + 1].trimmingCharacters(in: .whitespaces)
                    if nextLine.hasPrefix("> ") {
                        quoteContent += "\n" + String(nextLine.dropFirst(2))
                        i += 1
                    } else {
                        break
                    }
                }
                blocks.append(.blockquote(quoteContent))
                i += 1
                continue
            }

            // Bullet list
            if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                flushNumberedList()
                currentBulletList.append(String(trimmed.dropFirst(2)))
                i += 1
                continue
            }

            // Numbered list
            if let match = trimmed.range(of: "^\\d+\\. ", options: .regularExpression) {
                flushBulletList()
                currentNumberedList.append(String(trimmed[match.upperBound...]))
                i += 1
                continue
            }

            // Paragraph (collect consecutive non-special lines)
            flushBulletList()
            flushNumberedList()
            var paragraphContent = trimmed
            while i + 1 < lines.count {
                let nextLine = lines[i + 1].trimmingCharacters(in: .whitespaces)
                if nextLine.isEmpty || nextLine.hasPrefix("#") || nextLine.hasPrefix(">") ||
                   nextLine.hasPrefix("- ") || nextLine.hasPrefix("* ") ||
                   nextLine.hasPrefix("```") || nextLine.range(of: "^\\d+\\. ", options: .regularExpression) != nil {
                    break
                }
                paragraphContent += " " + nextLine
                i += 1
            }
            blocks.append(.paragraph(paragraphContent))
            i += 1
        }

        flushBulletList()
        flushNumberedList()

        return blocks
    }

    // MARK: - Render Block

    @ViewBuilder
    private func renderBlock(_ block: MarkdownBlock) -> some View {
        switch block {
        case .heading1(let text):
            renderHeading1(text)
        case .heading2(let text):
            renderHeading2(text)
        case .heading3(let text):
            renderHeading3(text)
        case .paragraph(let text):
            renderParagraph(text)
        case .bulletList(let items):
            renderBulletList(items)
        case .numberedList(let items):
            renderNumberedList(items)
        case .codeBlock(let code):
            renderCodeBlock(code)
        case .blockquote(let text):
            renderBlockquote(text)
        case .horizontalRule:
            renderHorizontalRule()
        }
    }

    // MARK: - Heading Renderers

    private func renderHeading1(_ text: String) -> some View {
        Text(parseInlineMarkdown(text))
            .font(.largeTitle.bold())
            .foregroundStyle(accentColor)
            .padding(.top, 8)
            .padding(.bottom, 4)
    }

    private func renderHeading2(_ text: String) -> some View {
        Text(parseInlineMarkdown(text))
            .font(.title2.bold())
            .foregroundStyle(colorScheme == .dark ? Color.darkTextHeading : Color.lightTextHeading)
            .padding(.top, 16)
            .padding(.bottom, 4)
    }

    private func renderHeading3(_ text: String) -> some View {
        Text(parseInlineMarkdown(text))
            .font(.title3.bold())
            .foregroundStyle(colorScheme == .dark ? Color.darkText : Color.lightText)
            .padding(.top, 12)
            .padding(.bottom, 2)
    }

    // MARK: - Paragraph Renderer

    private func renderParagraph(_ text: String) -> some View {
        Text(parseInlineMarkdown(text))
            .font(.body)
            .foregroundStyle(colorScheme == .dark ? Color.darkText : Color.lightText)
            .lineSpacing(4)
            .fixedSize(horizontal: false, vertical: true)
    }

    // MARK: - List Renderers

    private func renderBulletList(_ items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                HStack(alignment: .top, spacing: 12) {
                    Circle()
                        .fill(accentColor)
                        .frame(width: 6, height: 6)
                        .padding(.top, 8)

                    Text(parseInlineMarkdown(item))
                        .font(.body)
                        .foregroundStyle(colorScheme == .dark ? Color.darkText : Color.lightText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.leading, 8)
    }

    private func renderNumberedList(_ items: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(index + 1).")
                        .font(.body.monospacedDigit().bold())
                        .foregroundStyle(accentColor)
                        .frame(width: 24, alignment: .trailing)

                    Text(parseInlineMarkdown(item))
                        .font(.body)
                        .foregroundStyle(colorScheme == .dark ? Color.darkText : Color.lightText)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(.leading, 8)
    }

    // MARK: - Code Block Renderer

    private func renderCodeBlock(_ code: String) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            Text(code)
                .font(.system(.body, design: .monospaced))
                .foregroundStyle(colorScheme == .dark ? Color.darkText : Color.lightText)
                .padding()
        }
        .background(colorScheme == .dark ? Color.darkSurfaceAlt : Color.lightNeutral100)
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Blockquote Renderer

    private func renderBlockquote(_ text: String) -> some View {
        HStack(spacing: 0) {
            Rectangle()
                .fill(accentColor)
                .frame(width: 4)

            Text(parseInlineMarkdown(text))
                .font(.body.italic())
                .foregroundStyle(colorScheme == .dark ? Color.darkTextSecondary : Color.lightTextSecondary)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
        }
        .background(accentColor.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 4))
    }

    // MARK: - Horizontal Rule Renderer

    private func renderHorizontalRule() -> some View {
        Divider()
            .padding(.vertical, 8)
    }

    // MARK: - Inline Markdown Parser

    private func parseInlineMarkdown(_ text: String) -> AttributedString {
        var result = AttributedString()

        // AttributedString's built-in markdown parser covers bold, italic,
        // inline code and links, so there is no hand-rolled pattern table here.
        do {
            var options = AttributedString.MarkdownParsingOptions()
            options.interpretedSyntax = .inlineOnlyPreservingWhitespace
            result = try AttributedString(markdown: text, options: options)

            // Style links with accent color
            for run in result.runs {
                if run.link != nil {
                    let range = run.range
                    result[range].foregroundColor = .appPrimary
                    result[range].underlineStyle = .single
                }
            }

            return result
        } catch {
            // Fallback to plain text if markdown parsing fails
            return AttributedString(text)
        }
    }
}

// MARK: - Markdown WebView (Fallback)

#if os(iOS) || os(visionOS)
struct MarkdownWebView: UIViewRepresentable {
    let htmlContent: String
    let accentColor: Color
    let colorScheme: ColorScheme
    let onLinkTap: (URL) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let html = wrapInHTML(htmlContent)
        webView.loadHTMLString(html, baseURL: nil)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onLinkTap: onLinkTap)
    }

    private func wrapInHTML(_ content: String) -> String {
        let isDark = colorScheme == .dark
        let bgColor = isDark ? "#0D1117" : "#F9FAFB"
        let textColor = isDark ? "#E8EEF5" : "#24292E"
        let headingColor = isDark ? "#79D8EB" : "#00838F"
        let linkColor = "#00ACC1"
        let codeBackground = isDark ? "#1C2128" : "#F3F4F6"
        let blockquoteBg = isDark ? "rgba(0, 172, 193, 0.1)" : "rgba(0, 172, 193, 0.1)"

        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 17px;
                    line-height: 1.6;
                    color: \(textColor);
                    background-color: \(bgColor);
                    padding: 16px;
                    margin: 0;
                }
                h1 { font-size: 28px; color: \(linkColor); margin-top: 24px; }
                h2 { font-size: 22px; color: \(headingColor); margin-top: 20px; }
                h3 { font-size: 18px; color: \(textColor); margin-top: 16px; }
                a { color: \(linkColor); text-decoration: underline; }
                code {
                    font-family: ui-monospace, Menlo, monospace;
                    font-size: 15px;
                    background: \(codeBackground);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                pre {
                    background: \(codeBackground);
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                pre code { padding: 0; background: none; }
                blockquote {
                    margin: 16px 0;
                    padding: 12px 16px;
                    background: \(blockquoteBg);
                    border-left: 4px solid \(linkColor);
                    border-radius: 4px;
                }
                ul, ol { padding-left: 24px; }
                li { margin: 8px 0; }
            </style>
        </head>
        <body>
            \(content)
        </body>
        </html>
        """
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        let onLinkTap: (URL) -> Void

        init(onLinkTap: @escaping (URL) -> Void) {
            self.onLinkTap = onLinkTap
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
                onLinkTap(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}
#elseif os(macOS)
struct MarkdownWebView: NSViewRepresentable {
    let htmlContent: String
    let accentColor: Color
    let colorScheme: ColorScheme
    let onLinkTap: (URL) -> Void

    func makeNSView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        return webView
    }

    func updateNSView(_ webView: WKWebView, context: Context) {
        let html = wrapInHTML(htmlContent)
        webView.loadHTMLString(html, baseURL: nil)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(onLinkTap: onLinkTap)
    }

    private func wrapInHTML(_ content: String) -> String {
        let isDark = colorScheme == .dark
        let bgColor = isDark ? "#0D1117" : "#F9FAFB"
        let textColor = isDark ? "#E8EEF5" : "#24292E"
        let headingColor = isDark ? "#79D8EB" : "#00838F"
        let linkColor = "#00ACC1"
        let codeBackground = isDark ? "#1C2128" : "#F3F4F6"
        let blockquoteBg = isDark ? "rgba(0, 172, 193, 0.1)" : "rgba(0, 172, 193, 0.1)"

        return """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 15px;
                    line-height: 1.6;
                    color: \(textColor);
                    background-color: \(bgColor);
                    padding: 16px;
                    margin: 0;
                }
                h1 { font-size: 24px; color: \(linkColor); margin-top: 24px; }
                h2 { font-size: 20px; color: \(headingColor); margin-top: 20px; }
                h3 { font-size: 16px; color: \(textColor); margin-top: 16px; }
                a { color: \(linkColor); text-decoration: underline; }
                code {
                    font-family: ui-monospace, Menlo, monospace;
                    font-size: 13px;
                    background: \(codeBackground);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                pre {
                    background: \(codeBackground);
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                pre code { padding: 0; background: none; }
                blockquote {
                    margin: 16px 0;
                    padding: 12px 16px;
                    background: \(blockquoteBg);
                    border-left: 4px solid \(linkColor);
                    border-radius: 4px;
                }
                ul, ol { padding-left: 24px; }
                li { margin: 8px 0; }
            </style>
        </head>
        <body>
            \(content)
        </body>
        </html>
        """
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        let onLinkTap: (URL) -> Void

        init(onLinkTap: @escaping (URL) -> Void) {
            self.onLinkTap = onLinkTap
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
                onLinkTap(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }
    }
}
#endif

// MARK: - Preview

#Preview {
    NavigationStack {
        GuideViewerView(
            title: "CalFresh Eligibility",
            guideId: "calfresh",
            accentColor: .appPrimary
        )
    }
}
