import SwiftUI
import BayNavigatorCore

/// Full For You view with NavigationStack (use when displayed as a tab)
struct ForYouView: View {
    var body: some View {
        NavigationStack {
            ForYouViewContent()
        }
    }
}

/// For You content without NavigationStack (use when pushed onto existing navigation)
struct ForYouViewContent: View {
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(UserPrefsViewModel.self) private var userPrefsVM
    @Environment(\.openURL) private var openURL
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var civicVM = CivicViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // User profile summary card
                if userPrefsVM.hasPreferences {
                    profileCard
                }

                // Top picks section
                if !topPicks.isEmpty {
                    topPicksSection
                }

                // City Guide section
                if let cityGuide = civicVM.cityGuide {
                    cityGuideSection(guide: cityGuide)
                }

                // Representatives section
                if !civicVM.representatives.isEmpty {
                    representativesSection
                }

                // Local News section
                if !civicVM.cityNews.isEmpty {
                    localNewsSection
                }

                // Empty state
                if !userPrefsVM.hasPreferences {
                    emptyState
                }
            }
            .padding()
        }
        .navigationTitle("For You")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .refreshable {
            await refreshData()
        }
        .task {
            await loadCivicData()
        }
        .onChange(of: userPrefsVM.city) { _, _ in
            Task { await loadCivicData() }
        }
        .onChange(of: userPrefsVM.selectedCounty) { _, _ in
            Task { await loadCivicData() }
        }
    }

    // MARK: - Data Loading

    private func refreshData() async {
        await programsVM.loadData(forceRefresh: true)
        await loadCivicData()
    }

    private func loadCivicData() async {
        let countyName = userPrefsVM.getCountyName(from: programsVM.areas)
        await civicVM.loadData(
            cityName: userPrefsVM.city,
            countyName: countyName,
            zipCode: userPrefsVM.zipCode
        )
    }

    // MARK: - Computed Properties

    private var matchingPrograms: [Program] {
        var result = programsVM.programs

        // Filter by user's selected groups
        if !userPrefsVM.selectedGroups.isEmpty {
            result = result.filter { program in
                userPrefsVM.selectedGroups.contains { program.groups.contains($0) }
            }
        }

        // Filter by user's county
        if let county = userPrefsVM.selectedCounty,
           let countyName = userPrefsVM.getCountyName(from: programsVM.areas) {
            result = result.filter { program in
                program.areas.contains(countyName) ||
                program.areas.contains("Bay Area") ||
                program.areas.contains("Statewide") ||
                program.areas.contains("Nationwide")
            }
        }

        // Exclude favorited programs - they already have them saved
        result = result.filter { !programsVM.isFavorite($0.id) }

        return result
    }

    private var topPicks: [Program] {
        Array(matchingPrograms.prefix(5))
    }

    // MARK: - Profile Card

    private var profileCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // Profile avatar with selected color
                ZStack {
                    Circle()
                        .fill(userPrefsVM.profileColor)
                        .frame(width: 44, height: 44)

                    Text(userPrefsVM.firstName?.prefix(1).uppercased() ?? "?")
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                }
                .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 2) {
                    Text(userPrefsVM.firstName ?? "Your Profile")
                        .font(.headline)
                        .accessibilityAddTraits(.isHeader)

                    // Show city/zip instead of county
                    if let location = profileLocationDisplay {
                        Text(location)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Button("Edit") {
                    userPrefsVM.reopenOnboarding()
                }
                .buttonStyle(.bordered)
                .tint(.appPrimary)
                .accessibilityLabel("Edit profile")
                .accessibilityHint("Opens onboarding to update your preferences")
            }

            if !userPrefsVM.selectedGroups.isEmpty {
                let groupNames = userPrefsVM.getGroupNames(from: programsVM.groups)
                Text("Interests: \(groupNames.joined(separator: ", "))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #endif
        .accessibilityElement(children: .contain)
        .accessibilityLabel(profileAccessibilityLabel)
    }

    private var profileAccessibilityLabel: String {
        var label = "Your profile"
        if let name = userPrefsVM.firstName {
            label = "\(name)'s profile"
        }
        if let location = profileLocationDisplay {
            label += ", \(location)"
        }
        if !userPrefsVM.selectedGroups.isEmpty {
            let groupNames = userPrefsVM.getGroupNames(from: programsVM.groups)
            label += ", interests: \(groupNames.joined(separator: ", "))"
        }
        return label
    }

    /// Display location showing city and zip (if available) instead of county
    private var profileLocationDisplay: String? {
        if let city = userPrefsVM.city, !city.isEmpty {
            if let zip = userPrefsVM.zipCode, !zip.isEmpty {
                return "\(city), \(zip)"
            }
            return city
        }
        return nil
    }

    // MARK: - Top Picks Section

    @State private var showDirectory = false

    private var topPicksSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundStyle(Color.appAccent)
                    .accessibilityHidden(true)
                Text("Top Picks for You")
                    .font(.title2.bold())
                    .accessibilityAddTraits(.isHeader)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    ForEach(topPicks) { program in
                        NavigationLink(value: program) {
                            TopPickCard(program: program)
                        }
                        .buttonStyle(.plain)
                    }

                    // View All button card
                    if matchingPrograms.count > 5 {
                        NavigationLink(destination: DirectoryView()) {
                            ViewAllCard(count: matchingPrograms.count)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .accessibilityLabel("Top picks carousel, \(topPicks.count) programs")
        }
        .navigationDestination(for: Program.self) { program in
            ProgramDetailView(program: program)
        }
    }

    // MARK: - City Guide Section

    private func cityGuideSection(guide: CityGuide) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "building.2.fill")
                    .foregroundStyle(Color.appPrimary)
                    .accessibilityHidden(true)
                Text("City Guide")
                    .font(.title2.bold())
                    .accessibilityAddTraits(.isHeader)

                Spacer()

                if let website = guide.cityWebsite, let url = URL(string: website) {
                    Button {
                        openURL(url)
                    } label: {
                        Text("Visit Site")
                            .font(.subheadline)
                    }
                    .buttonStyle(.bordered)
                    .tint(.appPrimary)
                    .accessibilityLabel("Visit \(guide.cityName) website")
                    .accessibilityHint("Opens the city's official website in a browser")
                    .accessibilityAddTraits(.isLink)
                }
            }

            Text(guide.cityName)
                .font(.headline)
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(guide.agencies) { agency in
                    CityAgencyCard(agency: agency) {
                        if let website = agency.website, let url = URL(string: website) {
                            openURL(url)
                        }
                    }
                }
            }
            .accessibilityLabel("City agencies, \(guide.agencies.count) departments")
        }
    }

    // MARK: - Representatives Section

    private var representativesSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "person.badge.shield.checkmark.fill")
                    .foregroundStyle(Color.appPrimary)
                    .accessibilityHidden(true)
                Text("Your Representatives")
                    .font(.title2.bold())
                    .accessibilityAddTraits(.isHeader)

                Spacer()

                Button {
                    if let url = URL(string: "https://baynavigator.org/findmyrep") {
                        openURL(url)
                    }
                } label: {
                    Text("Find My Rep")
                        .font(.subheadline)
                }
                .buttonStyle(.bordered)
                .tint(.appPrimary)
                .accessibilityLabel("Find My Representative")
                .accessibilityHint("Opens a tool to find your elected representatives")
                .accessibilityAddTraits(.isLink)
            }

            // Federal representatives
            if !civicVM.representatives.federal.isEmpty {
                RepresentativeLevelSection(
                    level: .federal,
                    representatives: civicVM.representatives.federal,
                    onContact: { rep in contactRepresentative(rep) }
                )
            }

            // State representatives
            if !civicVM.representatives.state.isEmpty {
                RepresentativeLevelSection(
                    level: .state,
                    representatives: civicVM.representatives.state,
                    onContact: { rep in contactRepresentative(rep) }
                )
            }

            // Local representatives
            if !civicVM.representatives.local.isEmpty {
                RepresentativeLevelSection(
                    level: .local,
                    representatives: civicVM.representatives.local,
                    onContact: { rep in contactRepresentative(rep) }
                )
            }
        }
    }

    private func contactRepresentative(_ rep: Representative) {
        if let website = rep.website, let url = URL(string: website) {
            openURL(url)
        } else if let email = rep.email, let url = URL(string: "mailto:\(email)") {
            openURL(url)
        } else if let phone = rep.phone {
            let cleaned = phone.replacingOccurrences(of: " ", with: "")
                .replacingOccurrences(of: "-", with: "")
                .replacingOccurrences(of: "(", with: "")
                .replacingOccurrences(of: ")", with: "")
            if let url = URL(string: "tel:\(cleaned)") {
                openURL(url)
            }
        }
    }

    // MARK: - Local News Section

    private var localNewsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: "newspaper.fill")
                    .foregroundStyle(Color.appPrimary)
                    .accessibilityHidden(true)
                Text("Local News")
                    .font(.title2.bold())
                    .accessibilityAddTraits(.isHeader)
            }

            VStack(spacing: 12) {
                ForEach(civicVM.cityNews.prefix(5)) { news in
                    NewsCard(news: news) {
                        if let url = URL(string: news.url) {
                            openURL(url)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.crop.circle.badge.questionmark")
                .font(.system(size: 64))
                .foregroundStyle(.secondary)
                .accessibilityHidden(true)

            Text("Set Up Your Profile")
                .font(.title2.bold())
                .accessibilityAddTraits(.isHeader)

            Text("Tell us about yourself to get personalized program recommendations.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button("Get Started") {
                userPrefsVM.reopenOnboarding()
            }
            .buttonStyle(.borderedProminent)
            .tint(.appPrimary)
            .accessibilityHint("Opens onboarding to set up your profile")
        }
        .padding(40)
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Set up your profile to get personalized program recommendations")
    }
}

// MARK: - City Agency Card

struct CityAgencyCard: View {
    let agency: CityAgency
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: agency.iconName)
                        .font(.title3)
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(agency.color, in: RoundedRectangle(cornerRadius: 8))
                        .accessibilityHidden(true)

                    Spacer()

                    Image(systemName: "arrow.up.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .accessibilityHidden(true)
                }

                Text(agency.name)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                Text(agency.description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                if let phone = agency.phone {
                    HStack(spacing: 4) {
                        Image(systemName: "phone.fill")
                            .font(.caption2)
                            .accessibilityHidden(true)
                        Text(phone)
                            .font(.caption2)
                    }
                    .foregroundStyle(Color.appPrimary)
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(agencyAccessibilityLabel)
        .accessibilityHint("Opens \(agency.name) website")
        .accessibilityAddTraits(.isLink)
    }

    private var agencyAccessibilityLabel: String {
        var label = "\(agency.name), \(agency.description)"
        if let phone = agency.phone {
            label += ", phone: \(phone)"
        }
        return label
    }
}

// MARK: - Representative Level Section

struct RepresentativeLevelSection: View {
    let level: RepresentativeLevel
    let representatives: [Representative]
    let onContact: (Representative) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Level badge
            Text(level.displayName)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(level.badgeColor, in: Capsule())
                .accessibilityAddTraits(.isHeader)
                .accessibilityLabel("\(level.displayName) representatives")

            ForEach(representatives) { rep in
                RepresentativeCard(representative: rep, onContact: { onContact(rep) })
            }
        }
    }
}

// MARK: - Representative Card

struct RepresentativeCard: View {
    let representative: Representative
    let onContact: () -> Void

    var body: some View {
        Button(action: onContact) {
            HStack(spacing: 12) {
                // Avatar
                Circle()
                    .fill(representative.level.badgeColor.opacity(0.2))
                    .frame(width: 50, height: 50)
                    .overlay {
                        Text(representative.name.prefix(1))
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(representative.level.badgeColor)
                    }
                    .accessibilityHidden(true)

                VStack(alignment: .leading, spacing: 4) {
                    Text(representative.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)

                    Text(representative.title)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if let party = representative.party {
                        Text(party)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            .padding(12)
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(repAccessibilityLabel)
        .accessibilityHint("Opens contact options for \(representative.name)")
    }

    private var repAccessibilityLabel: String {
        var label = "\(representative.name), \(representative.title)"
        if let party = representative.party {
            label += ", \(party)"
        }
        return label
    }
}

// MARK: - News Card

struct NewsCard: View {
    let news: CityNews
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(news.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    Text(news.summary)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    HStack(spacing: 8) {
                        Text(news.source)
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Color.appPrimary)

                        Text(news.formattedDate)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .accessibilityHidden(true)
            }
            .padding(12)
            #if os(iOS)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #elseif os(macOS)
            .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 12))
            #else
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
            #endif
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(news.title). \(news.summary). From \(news.source), \(news.formattedDate)")
        .accessibilityHint("Opens news article in browser")
        .accessibilityAddTraits(.isLink)
    }
}

// MARK: - Top Pick Card

struct TopPickCard: View {
    let program: Program
    @Environment(ProgramsViewModel.self) private var programsVM

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Category icon
            Circle()
                .fill(Color.categoryColor(for: program.category).gradient)
                .frame(width: 44, height: 44)
                .overlay {
                    Image(systemName: categoryIcon(for: program.category))
                        .font(.title3)
                        .foregroundStyle(.white)
                }
                .accessibilityHidden(true)

            Text(program.name)
                .font(.headline)
                .lineLimit(2)
                .multilineTextAlignment(.leading)

            Text(program.category)
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            HStack {
                Image(systemName: "mappin.circle.fill")
                    .foregroundStyle(Color.appPrimary)
                    .accessibilityHidden(true)
                Text(program.locationText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(width: 160, height: 180)
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #endif
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(program.name), \(program.category) program in \(program.locationText)")
        .accessibilityHint("Double tap to view program details")
    }

    private func categoryIcon(for category: String) -> String {
        switch category.lowercased() {
        case "food", "food assistance": return "fork.knife"
        case "health", "healthcare": return "heart.fill"
        case "housing": return "house.fill"
        case "transportation": return "bus.fill"
        case "education": return "graduationcap.fill"
        case "employment": return "briefcase.fill"
        case "utilities": return "bolt.fill"
        case "legal": return "building.columns.fill"
        default: return "star.fill"
        }
    }
}

// MARK: - View All Card

struct ViewAllCard: View {
    let count: Int

    var body: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.appPrimary.gradient)
                .frame(width: 44, height: 44)
                .overlay {
                    Image(systemName: "arrow.right")
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                }
                .accessibilityHidden(true)

            Text("View All")
                .font(.headline)

            Text("\(count) programs")
                .font(.caption)
                .foregroundStyle(.secondary)

            Spacer()

            Text("Browse Directory")
                .font(.caption)
                .foregroundStyle(Color.appPrimary)
        }
        .frame(width: 160, height: 180)
        .padding()
        #if os(iOS)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #elseif os(macOS)
        .background(Color(nsColor: .windowBackgroundColor), in: RoundedRectangle(cornerRadius: 16))
        #else
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        #endif
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.appPrimary.opacity(0.3), lineWidth: 2)
        )
        #if os(visionOS)
        .hoverEffect(.highlight)
        #endif
        .accessibilityElement(children: .combine)
        .accessibilityLabel("View all \(count) programs")
        .accessibilityHint("Opens the full program directory")
    }
}

#Preview {
    ForYouView()
        .environment(ProgramsViewModel())
        .environment(UserPrefsViewModel())
}
