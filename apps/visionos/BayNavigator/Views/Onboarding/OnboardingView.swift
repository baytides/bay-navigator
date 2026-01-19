import SwiftUI

struct OnboardingView: View {
    @Environment(ProgramsViewModel.self) private var programsViewModel
    @Environment(UserPrefsViewModel.self) private var userPrefsViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var currentPage = 0
    @State private var selectedGroups: [String] = []
    @State private var selectedCounty: String?
    @State private var isLoading = false
    @State private var locationInput = ""
    @State private var locationError: String?
    @State private var isGpsLoading = false
    @Environment(LocationService.self) private var locationService

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Progress indicator
                HStack(spacing: 8) {
                    ForEach(0..<3, id: \.self) { index in
                        Capsule()
                            .fill(index <= currentPage ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(height: 4)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 16)

                // Page content
                TabView(selection: $currentPage) {
                    groupsPage
                        .tag(0)

                    countyPage
                        .tag(1)

                    completePage
                        .tag(2)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                // Navigation buttons
                if !isLoading {
                    HStack(spacing: 16) {
                        if currentPage > 0 {
                            Button("Back") {
                                withAnimation {
                                    currentPage -= 1
                                }
                            }
                            .buttonStyle(.bordered)
                        }

                        Spacer()

                        if currentPage < 2 {
                            Button("Skip") {
                                withAnimation {
                                    currentPage = 2
                                }
                            }
                            .foregroundStyle(.secondary)
                        }

                        Button(currentPage == 2 ? "Get Started" : "Continue") {
                            if currentPage == 2 {
                                completeOnboarding()
                            } else {
                                withAnimation {
                                    currentPage += 1
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                    }
                    .padding(24)
                }
            }
            .navigationTitle("Welcome")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    if userPrefsViewModel.onboardingComplete {
                        Button("Cancel") {
                            dismiss()
                        }
                    }
                }
            }
            .task {
                await programsViewModel.loadData()
                // Pre-populate with existing selections if editing
                selectedGroups = userPrefsViewModel.selectedGroups
                selectedCounty = userPrefsViewModel.selectedCounty
            }
        }
    }

    // MARK: - Groups Page

    private var groupsPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Who are you?")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Select all that apply to see relevant discounts and benefits.")
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)

                if programsViewModel.groups.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 48)
                } else {
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 150))], spacing: 12) {
                        ForEach(programsViewModel.groups) { group in
                            GroupChip(
                                group: group,
                                isSelected: selectedGroups.contains(group.id),
                                onTap: {
                                    toggleGroup(group.id)
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                }

                if !selectedGroups.isEmpty {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("\(selectedGroups.count) group\(selectedGroups.count == 1 ? "" : "s") selected")
                            .fontWeight(.medium)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)
                }

                Spacer(minLength: 100)
            }
        }
    }

    // MARK: - County Page

    private var countyPage: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Where do you live?")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Enter your ZIP code or city, or select from the list below.")
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)

                // ZIP/City input with GPS button
                HStack(spacing: 12) {
                    TextField("ZIP code or city...", text: $locationInput)
                        .textFieldStyle(.roundedBorder)
                        .textContentType(.addressCity)
                        .autocorrectionDisabled()
                        .onChange(of: locationInput) { _, newValue in
                            handleLocationInput(newValue)
                        }

                    Button {
                        handleGpsLocation()
                    } label: {
                        if isGpsLoading {
                            ProgressView()
                                .controlSize(.small)
                        } else {
                            Image(systemName: "location")
                        }
                    }
                    .buttonStyle(.bordered)
                    .disabled(isGpsLoading)
                    .help("Use my location")
                }
                .padding(.horizontal, 24)

                // Error message
                if let error = locationError {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .padding(.horizontal, 24)
                }

                // Selected county indicator
                if let countyId = selectedCounty,
                   let county = programsViewModel.countyAreas.first(where: { $0.id == countyId }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(county.name)
                            .fontWeight(.semibold)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.green.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)
                }

                // Divider
                HStack {
                    Rectangle()
                        .fill(.secondary.opacity(0.3))
                        .frame(height: 1)
                    Text("or select from list")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Rectangle()
                        .fill(.secondary.opacity(0.3))
                        .frame(height: 1)
                }
                .padding(.horizontal, 24)

                let counties = programsViewModel.countyAreas

                if counties.isEmpty {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 48)
                } else {
                    VStack(spacing: 12) {
                        ForEach(counties) { county in
                            CountyRow(
                                county: county,
                                isSelected: selectedCounty == county.id,
                                onTap: {
                                    if selectedCounty == county.id {
                                        selectedCounty = nil
                                        locationInput = ""
                                    } else {
                                        selectedCounty = county.id
                                        locationInput = county.name
                                    }
                                    locationError = nil
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                }

                Spacer(minLength: 100)
            }
        }
    }

    // MARK: - Location Helpers

    private func handleLocationInput(_ value: String) {
        guard !value.isEmpty else {
            locationError = nil
            return
        }

        if let county = LocationLookup.lookupCounty(value) {
            let countyId = county.lowercased().replacingOccurrences(of: " ", with: "-")
            selectedCounty = countyId
            locationError = nil
        } else if value.count >= 3 {
            if LocationLookup.isZipCodeFormat(value) {
                locationError = "ZIP code not found in Bay Area"
            } else if !value.allSatisfy({ $0.isNumber }) {
                locationError = "City not found"
            }
        }
    }

    private func handleGpsLocation() {
        isGpsLoading = true
        locationError = nil

        locationService.getCurrentLocation()

        // Monitor for location update
        Task {
            // Wait up to 10 seconds for location
            for _ in 0..<20 {
                try? await Task.sleep(nanoseconds: 500_000_000)

                if !locationService.isLoading {
                    await MainActor.run {
                        if let county = locationService.currentCounty {
                            let countyId = county.lowercased().replacingOccurrences(of: " ", with: "-")
                            selectedCounty = countyId
                            locationInput = county
                        } else if let error = locationService.error {
                            locationError = error
                        }
                        isGpsLoading = false
                    }
                    return
                }
            }

            await MainActor.run {
                locationError = "Location request timed out"
                isGpsLoading = false
            }
        }
    }

    // MARK: - Complete Page

    private var completePage: some View {
        VStack(spacing: 32) {
            Spacer()

            if isLoading {
                ProgressView()
                    .scaleEffect(1.5)

                Text("Setting up your experience...")
                    .font(.title2)
                    .fontWeight(.semibold)

                Text("Personalizing your recommendations")
                    .foregroundStyle(.secondary)
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.green)

                Text("You're all set!")
                    .font(.title)
                    .fontWeight(.bold)

                Text("We'll show you programs tailored to your profile.")
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)

                // Summary
                if !selectedGroups.isEmpty || selectedCounty != nil {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Your Profile")
                            .font(.headline)

                        if !selectedGroups.isEmpty {
                            HStack {
                                Image(systemName: "person.2")
                                    .foregroundStyle(.accent)
                                Text("Groups")
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text("\(selectedGroups.count) selected")
                                    .fontWeight(.medium)
                            }
                        }

                        if let countyId = selectedCounty,
                           let county = programsViewModel.countyAreas.first(where: { $0.id == countyId }) {
                            HStack {
                                Image(systemName: "location")
                                    .foregroundStyle(.accent)
                                Text("County")
                                    .foregroundStyle(.secondary)
                                Spacer()
                                Text(county.name)
                                    .fontWeight(.medium)
                            }
                        }
                    }
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                    .padding(.horizontal, 24)
                } else {
                    HStack {
                        Image(systemName: "info.circle")
                            .foregroundStyle(.secondary)
                        Text("No personalization selected. You can update this later in Settings.")
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 24)
                }
            }

            Spacer()
        }
    }

    // MARK: - Actions

    private func toggleGroup(_ id: String) {
        if let index = selectedGroups.firstIndex(of: id) {
            selectedGroups.remove(at: index)
        } else {
            selectedGroups.append(id)
        }
    }

    private func completeOnboarding() {
        isLoading = true

        Task {
            await userPrefsViewModel.savePreferences(
                groups: selectedGroups,
                county: selectedCounty
            )
            await userPrefsViewModel.completeOnboarding()

            // Small delay for animation
            try? await Task.sleep(nanoseconds: 800_000_000)

            await MainActor.run {
                dismiss()
            }
        }
    }
}

// MARK: - Supporting Views

struct GroupChip: View {
    let group: ProgramGroup
    let isSelected: Bool
    let onTap: () -> Void

    private var emoji: String {
        let iconMap: [String: String] = [
            "GraduationCap": "🎓",
            "Heart": "❤️",
            "Users": "👥",
            "Briefcase": "💼",
            "Home": "🏠",
            "Shield": "🛡️",
            "Baby": "👶",
            "Accessibility": "♿",
            "Leaf": "🌿",
            "DollarSign": "$"
        ]
        return iconMap[group.icon] ?? "📋"
    }

    var body: some View {
        Button(action: onTap) {
            HStack {
                Text(emoji)
                Text(group.name)
                    .lineLimit(1)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .background(
                isSelected ? Color.accentColor.opacity(0.2) : Color.secondary.opacity(0.1),
                in: RoundedRectangle(cornerRadius: 24)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(.plain)
        .foregroundStyle(isSelected ? .accent : .primary)
    }
}

struct CountyRow: View {
    let county: Area
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Circle()
                    .fill(isSelected ? Color.accentColor : Color.secondary.opacity(0.3))
                    .frame(width: 24, height: 24)
                    .overlay {
                        if isSelected {
                            Image(systemName: "checkmark")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                        }
                    }

                Text(county.name)
                    .fontWeight(isSelected ? .semibold : .regular)

                Spacer()

                Text("\(county.programCount) programs")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(
                isSelected ? Color.accentColor.opacity(0.1) : Color.secondary.opacity(0.05),
                in: RoundedRectangle(cornerRadius: 12)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.accentColor : Color.secondary.opacity(0.2), lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
        .foregroundStyle(isSelected ? .accent : .primary)
    }
}

#Preview(windowStyle: .automatic) {
    OnboardingView()
        .environment(ProgramsViewModel())
        .environment(UserPrefsViewModel())
        .environment(LocationService())
}
