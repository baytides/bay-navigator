import SwiftUI
import BayNavigatorCore

struct SmartAssistantView: View {
    @Environment(SmartAssistantViewModel.self) private var assistantVM
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(\.dismiss) private var dismiss

    @State private var inputText = ""
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if assistantVM.messages.isEmpty {
                    emptyState
                } else {
                    messagesList
                }

                inputBar
            }
            .navigationTitle("Smart Assistant")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                if !assistantVM.messages.isEmpty {
                    ToolbarItem(placement: .primaryAction) {
                        Button {
                            assistantVM.clearConversation()
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                }
            }
        }
        #if os(visionOS)
        .frame(minWidth: 500, minHeight: 600)
        #endif
    }

    // MARK: - Empty State

    private var emptyState: some View {
        ScrollView {
            VStack(spacing: 32) {
                Spacer(minLength: 40)

                Image(systemName: "cloud.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(Color.appPrimary)
                    .symbolEffect(.pulse, options: .repeating)

                VStack(spacing: 12) {
                    Text("Ask me anything")
                        .font(.title.bold())

                    Text("I can help you find programs and services in the Bay Area")
                        .font(.body)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                VStack(spacing: 12) {
                    Text("Try asking:")
                        .font(.headline)
                        .foregroundStyle(.secondary)

                    ForEach(sampleQuestions, id: \.self) { question in
                        Button {
                            inputText = question
                            sendMessage()
                        } label: {
                            HStack {
                                Image(systemName: "sparkle")
                                    .foregroundStyle(Color.appPrimary)
                                Text(question)
                                    .multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "arrow.up.circle.fill")
                                    .foregroundStyle(Color.appPrimary)
                            }
                            .padding()
                            #if os(iOS)
                            .background(.regularMaterial)
                            #else
                            .background(Color.secondary.opacity(0.1))
                            #endif
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)

                privacyNotice

                Spacer(minLength: 40)
            }
        }
    }

    private var sampleQuestions: [String] {
        [
            "Food assistance for seniors in Alameda County",
            "Free legal help for immigrants",
            "Housing programs for families with children",
            "Job training for veterans"
        ]
    }

    private var privacyNotice: some View {
        HStack(spacing: 8) {
            Image(systemName: "lock.shield.fill")
                .foregroundStyle(Color.appSuccess)
            Text("Your questions are processed locally and never stored")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        #if os(iOS)
        .background(.ultraThinMaterial)
        #else
        .background(Color.secondary.opacity(0.05))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .padding(.horizontal)
    }

    // MARK: - Messages List

    private var messagesList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(assistantVM.messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }

                    if assistantVM.isLoading {
                        typingIndicator
                            .id("typing")
                    }
                }
                .padding()
            }
            .onChange(of: assistantVM.messages.count) { _, _ in
                withAnimation {
                    proxy.scrollTo(assistantVM.messages.last?.id ?? UUID(), anchor: .bottom)
                }
            }
        }
    }

    private var typingIndicator: some View {
        HStack(alignment: .bottom, spacing: 8) {
            assistantAvatar

            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(Color.secondary)
                        .frame(width: 8, height: 8)
                        .scaleEffect(assistantVM.isLoading ? 1.0 : 0.5)
                        .animation(
                            .easeInOut(duration: 0.6)
                            .repeatForever()
                            .delay(Double(index) * 0.2),
                            value: assistantVM.isLoading
                        )
                }
            }
            .padding(12)
            #if os(iOS)
            .background(.regularMaterial)
            #else
            .background(Color.secondary.opacity(0.1))
            #endif
            .clipShape(RoundedRectangle(cornerRadius: 16))

            Spacer()
        }
    }

    private var assistantAvatar: some View {
        Image(systemName: "cloud.fill")
            .font(.caption)
            .foregroundStyle(.white)
            .frame(width: 28, height: 28)
            .background(Color.appPrimary)
            .clipShape(Circle())
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 12) {
                TextField("Ask about services...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...5)
                    .focused($isInputFocused)
                    .onSubmit {
                        sendMessage()
                    }

                Button {
                    sendMessage()
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .foregroundStyle(inputText.isEmpty ? Color.secondary : Color.appPrimary)
                }
                .disabled(inputText.isEmpty || assistantVM.isLoading)
            }
            .padding()
            #if os(iOS)
            .background(.regularMaterial)
            #endif
        }
    }

    // MARK: - Actions

    private func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }

        let query = inputText
        inputText = ""

        Task {
            await assistantVM.sendMessage(query)
        }
    }
}

// MARK: - Message Bubble

struct MessageBubble: View {
    let message: ChatMessage

    private var isUser: Bool {
        message.role == .user
    }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if isUser {
                Spacer(minLength: 60)
            } else {
                assistantAvatar
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .padding(12)
                    .background(isUser ? Color.appPrimary : Color.secondary.opacity(0.1))
                    .foregroundStyle(isUser ? .white : .primary)
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                if let programs = message.programs, !programs.isEmpty {
                    suggestedProgramsView(programs: programs)
                }

                Text(message.timestamp, style: .time)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            if !isUser {
                Spacer(minLength: 60)
            }
        }
    }

    private var assistantAvatar: some View {
        Image(systemName: "cloud.fill")
            .font(.caption)
            .foregroundStyle(.white)
            .frame(width: 28, height: 28)
            .background(Color.appPrimary)
            .clipShape(Circle())
    }

    @ViewBuilder
    private func suggestedProgramsView(programs: [AIProgram]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Suggested Programs")
                .font(.caption.bold())
                .foregroundStyle(.secondary)

            ForEach(programs.prefix(3), id: \.id) { program in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(program.name)
                            .font(.subheadline.bold())
                            .lineLimit(1)
                        Text(program.category)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                .padding(10)
                #if os(iOS)
                .background(.ultraThinMaterial)
                #else
                .background(Color.secondary.opacity(0.05))
                #endif
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
        .padding(.top, 8)
    }
}

#Preview {
    SmartAssistantView()
        .environment(SmartAssistantViewModel())
        .environment(ProgramsViewModel())
}
