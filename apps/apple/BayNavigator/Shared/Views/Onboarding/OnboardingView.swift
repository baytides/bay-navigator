import SwiftUI
import BayNavigatorCore
#if canImport(UIKit)
import UIKit
#endif

struct OnboardingView: View {
    @Environment(UserPrefsViewModel.self) private var userPrefsVM
    @Environment(ProgramsViewModel.self) private var programsVM
    @Environment(SettingsViewModel.self) private var settingsVM
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    // MARK: - Page Navigation

    @State private var currentPage = 0 {
        didSet {
            announcePageChange()
        }
    }
    private let totalPages = 10

    // MARK: - Form State

    @State private var firstName: String = ""
    @State private var locationInput: String = ""
    @State private var detectedCity: String?
    @State private var detectedZipCode: String?
    @State private var detectedCounty: String?
    @State private var selectedBirthYear: Int?
    @State private var isMilitaryOrVeteran: Bool = false
    @State private var selectedQualifications: Set<String> = []
    @State private var selectedColorIndex: Int = 0
    @State private var shareProfileWithCarl: Bool = true  // Default ON for better UX, user can disable

    // MARK: - Location State

    @State private var isGpsLoading = false
    @State private var locationError: String?
    @State private var locationSuggestions: [String] = []
    @State private var locationService = LocationService()

    // MARK: - Processing State

    @State private var isProcessing = false
    @State private var processingMessage = ""

    // MARK: - Sensitive Data Dialog

    @State private var showSensitiveDataDialog = false
    @State private var pendingCompletion = false

    // Sensitive categories that may warrant extra data protection
    private let sensitiveCategories: Set<String> = ["lgbtq", "immigrant", "disability"]

    private var hasSensitiveCategories: Bool {
        !selectedQualifications.isDisjoint(with: sensitiveCategories)
    }

    // MARK: - Qualification Options

    private let qualificationOptions: [(id: String, title: String, subtitle: String, icon: String)] = [
        ("military", "Veteran or Military", "Served or serving in U.S. military", "shield.checkered"),
        ("lgbtq", "LGBTQ+", "Part of the LGBTQ+ community", "person.3.fill"),
        ("immigrant", "Immigrant", "New to the U.S. or non-citizen", "globe.americas.fill"),
        ("first-responder", "First Responder", "Fire, police, EMT, or similar", "flame.fill"),
        ("educator", "Teacher or Educator", "Work in education", "book.fill"),
        ("unemployed", "Looking for work", "Currently unemployed", "briefcase.fill"),
        ("public-assistance", "Public assistance", "Receive SNAP, Medi-Cal, etc.", "giftcard.fill"),
        ("student", "Student", "Currently enrolled in school", "graduationcap.fill"),
        ("disability", "Disability", "Have a disability", "figure.roll"),
        ("caregiver", "Caregiver", "Care for someone else", "heart.fill")
    ]

    var body: some View {
        ZStack {
            #if os(iOS)
            backgroundGradient
            #endif

            VStack(spacing: 0) {
                // Progress indicator (hidden on first and last page)
                if currentPage > 0 && currentPage < totalPages - 1 {
                    progressIndicator
                        .padding(.top)
                        .padding(.horizontal)
                }

                // Page content
                TabView(selection: $currentPage) {
                    languageSelectionPage.tag(0)
                    welcomePage.tag(1)
                    privacyPage.tag(2)
                    nameInputPage.tag(3)
                    locationInputPage.tag(4)
                    birthYearPage.tag(5)
                    qualificationsPage.tag(6)
                    profileColorPage.tag(7)
                    reviewPage.tag(8)
                    processingPage.tag(9)
                }
                #if os(iOS)
                .tabViewStyle(.page(indexDisplayMode: .never))
                #endif
                .animation(.easeInOut(duration: 0.3), value: currentPage)
            }
        }
        #if os(visionOS)
        .glassBackgroundEffect()
        #endif
        .alert("Protect Your Information", isPresented: $showSensitiveDataDialog) {
            Button("Skip") {
                completeOnboardingAfterDialog(enableEncryption: false)
            }
            Button("Enable Protection") {
                completeOnboardingAfterDialog(enableEncryption: true)
            }
        } message: {
            Text("You've selected categories that may be sensitive. We recommend enabling data encryption for extra protection. Your data stays on your device, and encryption adds another layer of security.")
        }
    }

    // MARK: - Background

    #if os(iOS)
    private var backgroundGradient: some View {
        LinearGradient(
            colors: [
                Color.appPrimary.opacity(0.1),
                Color.appAccent.opacity(0.05),
                Color.clear
            ],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
        .ignoresSafeArea()
    }
    #endif

    // MARK: - Progress Indicator

    private var progressIndicator: some View {
        HStack(spacing: 4) {
            ForEach(1..<totalPages - 1, id: \.self) { step in
                Capsule()
                    .fill(step < currentPage ? Color.appPrimary : Color.secondary.opacity(0.3))
                    .frame(height: 4)
                    .animation(.easeInOut, value: currentPage)
            }
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Page 0: Language Selection

    private var languageSelectionPage: some View {
        VStack(spacing: 24) {
            Spacer()

            Text("\u{1F310}")
                .font(.system(size: 64))

            VStack(spacing: 8) {
                Text("Choose Your Language")
                    .font(.title.bold())
                    .multilineTextAlignment(.center)

                Text("Select your preferred language")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(AppLocale.allCases, id: \.self) { locale in
                        Button {
                            withAnimation {
                                settingsVM.currentLocale = locale
                            }
                            triggerHaptic()
                        } label: {
                            // Two columns leave ~145pt of content width, so the
                            // label needs every point of it: no Spacer competing for
                            // slack, a body-size flag, and a small checkmark that is
                            // always laid out (adding it only when selected made the
                            // selected cell narrower than the rest, so the language
                            // you picked was the one that truncated to "Engl...").
                            // Native names wrap to two lines rather than shrink —
                            // scaling text down fights the AAA contrast/size target.
                            HStack(spacing: 8) {
                                Text(locale.flag)
                                    .font(.body)

                                Text(locale.nativeName)
                                    .font(.subheadline)
                                    .fontWeight(settingsVM.currentLocale == locale ? .semibold : .regular)
                                    .foregroundStyle(settingsVM.currentLocale == locale ? Color.appPrimary : .primary)
                                    .lineLimit(2)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .frame(maxWidth: .infinity, alignment: .leading)

                                Image(systemName: "checkmark.circle.fill")
                                    .imageScale(.small)
                                    .foregroundStyle(Color.appPrimary)
                                    .opacity(settingsVM.currentLocale == locale ? 1 : 0)
                                    .accessibilityHidden(true)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 12)
                            .frame(maxWidth: .infinity)
                            #if os(iOS)
                            .background(settingsVM.currentLocale == locale ? Color.appPrimary.opacity(0.15) : Color(.systemBackground))
                            #else
                            .background(settingsVM.currentLocale == locale ? Color.appPrimary.opacity(0.15) : Color.secondary.opacity(0.1))
                            #endif
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(settingsVM.currentLocale == locale ? Color.appPrimary : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(
                            settingsVM.currentLocale == locale ? [.isButton, .isSelected] : [.isButton]
                        )
                    }
                }
                .padding(.horizontal)
            }

            Spacer()

            Button {
                nextPage()
            } label: {
                Text("Continue")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.appPrimary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .padding(.horizontal)
        }
        .padding()
    }

    // MARK: - Page 1: Welcome

    private var welcomePage: some View {
        VStack(spacing: 24) {
            Spacer()

            // Logo
            Image("AppLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 120, height: 120)
                .clipShape(RoundedRectangle(cornerRadius: 28))
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)

            VStack(spacing: 8) {
                Text("Bay Navigator")
                    .font(.largeTitle.bold())

                Text("Your guide to local savings & benefits")
                    .font(.title3)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 16) {
                featureRow(icon: "slider.horizontal.3", title: "Personalized for You", description: "Find programs that match your needs")
                featureRow(icon: "person.3.fill", title: "Community Resource", description: "850+ programs across the Bay Area")
                featureRow(icon: "lock.fill", title: "Your Privacy Matters", description: "All data stays on your device")
            }
            .padding(.horizontal)

            Spacer()

            VStack(spacing: 12) {
                Button {
                    nextPage()
                } label: {
                    Text("Get Started")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)

                Button {
                    skipOnboarding()
                } label: {
                    Text("Skip for now")
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
        }
        .padding()
    }

    // MARK: - Page 2: Privacy Promise

    private var privacyPage: some View {
        VStack(spacing: 24) {
            Spacer()

            // Shield icon
            ZStack {
                Circle()
                    .fill(Color.appPrimary.opacity(0.1))
                    .frame(width: 80, height: 80)

                Image(systemName: "shield.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.appPrimary)
            }

            VStack(spacing: 8) {
                Text("Your Privacy is Protected")
                    .font(.title.bold())
                    .multilineTextAlignment(.center)

                Text("Before we ask you any questions, we want you to know:")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 16) {
                privacyItem(
                    icon: "iphone",
                    title: "Stored Only on Your Device",
                    description: "Your profile never leaves this device. We can't see or access it."
                )

                privacyItem(
                    icon: "icloud.slash",
                    title: "No Tracking or Data Collection",
                    description: "AI assistant and crash reporting are optional and can be disabled in Settings."
                )

                privacyItem(
                    icon: "trash",
                    title: "You're in Control",
                    description: "Delete your profile anytime in Settings - it's gone instantly."
                )

                privacyItem(
                    icon: "checkmark.shield",
                    title: "Advanced Privacy Tech",
                    description: "Built-in Tor routing, proxy support, and routed calling options - all optional."
                )
            }
            .padding(.horizontal)

            Spacer()

            VStack(spacing: 12) {
                Button {
                    nextPage()
                } label: {
                    Text("I Understand")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)

                Button {
                    skipOnboarding()
                } label: {
                    Text("Skip setup")
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.horizontal)
        }
        .padding()
    }

    // MARK: - Page 3: Name Input

    private var nameInputPage: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer().frame(height: 40)

            VStack(alignment: .leading, spacing: 8) {
                Text("What should we call you?")
                    .font(.title.bold())

                Text("This helps us personalize your experience.")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            TextField("Your first name", text: $firstName)
                .textFieldStyle(.roundedBorder)
                .textContentType(.givenName)
                #if os(iOS)
                .textInputAutocapitalization(.words)
                #endif
                .padding(.top)

            HStack(spacing: 8) {
                Image(systemName: "lock")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text("Stays on your device only")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            navigationButtons(canSkip: true)
        }
        .padding()
    }

    // MARK: - Page 4: Location Input

    private var locationInputPage: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer().frame(height: 40)

            VStack(alignment: .leading, spacing: 8) {
                Text("Where do you live?")
                    .font(.title.bold())

                Text("We'll find programs available in your area.")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            HStack(spacing: 12) {
                VStack {
                    TextField("City or ZIP code", text: $locationInput)
                        .textFieldStyle(.roundedBorder)
                        #if os(iOS)
                        .textInputAutocapitalization(.words)
                        #endif
                        .onChange(of: locationInput) { _, newValue in
                            handleLocationInput(newValue)
                        }
                }

                Button {
                    detectLocation()
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.appPrimary)
                            .frame(width: 44, height: 44)

                        if isGpsLoading {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        } else {
                            Image(systemName: "location.fill")
                                .foregroundStyle(.white)
                        }
                    }
                }
                .buttonStyle(.plain)
                .disabled(isGpsLoading)
            }

            if let error = locationError {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            // Location suggestions
            if !locationSuggestions.isEmpty {
                VStack(alignment: .leading, spacing: 8) {
                    ForEach(locationSuggestions, id: \.self) { suggestion in
                        Button {
                            locationInput = suggestion
                            handleLocationInput(suggestion)
                            locationSuggestions = []
                            triggerHaptic()
                        } label: {
                            HStack {
                                Image(systemName: "mappin.circle.fill")
                                    .foregroundStyle(Color.appPrimary)
                                Text(suggestion)
                                Spacer()
                            }
                            .padding(.vertical, 8)
                            .padding(.horizontal, 12)
                            #if os(iOS)
                            .background(Color(.systemBackground))
                            #else
                            .background(Color.secondary.opacity(0.1))
                            #endif
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            // Success indicator
            if detectedCounty != nil {
                HStack(spacing: 12) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color.appSuccess)

                    Text("Got it! You're in \(detectedCity ?? countyIdToDisplayName(detectedCounty!))")
                        .font(.subheadline)
                        .foregroundStyle(Color.appSuccess)
                        .fontWeight(.medium)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.appSuccess.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.appSuccess.opacity(0.3), lineWidth: 1)
                )
            }

            Spacer()

            navigationButtons(canSkip: true)
        }
        .padding()
    }

    // MARK: - Page 5: Birth Year

    private var birthYearPage: some View {
        let currentYear = Calendar.current.component(.year, from: Date())
        // Birth years from 104 years ago to 18 years ago (adults only for most programs)
        // Youngest reasonable: 18 years old, Oldest reasonable: 104 years old
        let years = Array((currentYear - 104)...(currentYear - 18)).reversed()

        return VStack(alignment: .leading, spacing: 24) {
            Spacer().frame(height: 40)

            VStack(alignment: .leading, spacing: 8) {
                Text("What year were you born?")
                    .font(.title.bold())

                Text("This helps us find age-based programs for you.")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            // Use inline Picker with wheel style to avoid overlay/popup issues with TabView
            VStack(spacing: 8) {
                Picker("Birth Year", selection: Binding(
                    get: { selectedBirthYear ?? (currentYear - 30) },
                    set: { selectedBirthYear = $0 }
                )) {
                    ForEach(years, id: \.self) { year in
                        Text(String(year)).tag(year)
                    }
                }
                #if os(macOS)
                .pickerStyle(.menu)
                #else
                .pickerStyle(.wheel)
                .frame(height: 150)
                #endif
                #if os(iOS)
                .background(Color(.secondarySystemBackground))
                #else
                .background(Color.secondary.opacity(0.1))
                #endif
                .clipShape(RoundedRectangle(cornerRadius: 12))

                if selectedBirthYear != nil {
                    Text("Age: \(currentYear - selectedBirthYear!) years old")
                        .font(.subheadline)
                        .foregroundStyle(Color.appPrimary)
                }
            }

            HStack(spacing: 8) {
                Image(systemName: "lock")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text("Only the year is stored, never your full birthday")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            navigationButtons(canSkip: true)
        }
        .padding()
    }

    // MARK: - Page 6: Qualifications

    private var qualificationsPage: some View {
        VStack(alignment: .leading, spacing: 16) {
            Spacer().frame(height: 20)

            VStack(alignment: .leading, spacing: 8) {
                Text("Anything else that applies?")
                    .font(.title.bold())

                Text("Select all that apply to find more relevant programs.")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            ScrollView {
                LazyVStack(spacing: 8) {
                    ForEach(qualificationOptions, id: \.id) { option in
                        let isSelected = option.id == "military" ? isMilitaryOrVeteran : selectedQualifications.contains(option.id)

                        Button {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                if option.id == "military" {
                                    isMilitaryOrVeteran.toggle()
                                } else if isSelected {
                                    selectedQualifications.remove(option.id)
                                } else {
                                    selectedQualifications.insert(option.id)
                                }
                            }
                            triggerHaptic()
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: option.icon)
                                    .font(.title3)
                                    .foregroundStyle(isSelected ? Color.appPrimary : .secondary)
                                    .frame(width: 24)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(option.title)
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(.primary)

                                    Text(option.subtitle)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }

                                Spacer()

                                Image(systemName: isSelected ? "checkmark.square.fill" : "square")
                                    .foregroundStyle(isSelected ? Color.appPrimary : .secondary)
                            }
                            .padding()
                            #if os(iOS)
                            .background(isSelected ? Color.appPrimary.opacity(0.1) : Color(.secondarySystemBackground))
                            #else
                            .background(isSelected ? Color.appPrimary.opacity(0.1) : Color.secondary.opacity(0.1))
                            #endif
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(isSelected ? Color.appPrimary : Color.clear, lineWidth: 2)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            // Privacy reminder
            HStack(spacing: 12) {
                Image(systemName: "lock")
                    .font(.caption)
                    .foregroundStyle(Color.appPrimary)

                Text("All data stays on your device and is never sent to our servers.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color.appPrimary.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            navigationButtons(canSkip: true)
        }
        .padding()
    }

    // MARK: - Page 7: Profile Color

    private var profileColorPage: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer().frame(height: 40)

            VStack(alignment: .leading, spacing: 8) {
                Text("Pick your profile color")
                    .font(.title.bold())

                Text("This helps identify your profile at a glance.")
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            // Color preview
            VStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(UserPrefsViewModel.profileColors[selectedColorIndex])
                        .frame(width: 100, height: 100)
                        .shadow(color: UserPrefsViewModel.profileColors[selectedColorIndex].opacity(0.5), radius: 10, x: 0, y: 4)

                    Text(firstName.isEmpty ? "?" : String(firstName.prefix(1)).uppercased())
                        .font(.system(size: 44, weight: .bold))
                        .foregroundStyle(.white)
                }

                Text(firstName.isEmpty ? "Your Profile" : firstName)
                    .font(.headline)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 20)

            // Color selection grid
            LazyVGrid(columns: [
                GridItem(.adaptive(minimum: 56), spacing: 16)
            ], spacing: 16) {
                ForEach(Array(UserPrefsViewModel.profileColors.enumerated()), id: \.offset) { index, color in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedColorIndex = index
                        }
                        triggerHaptic()
                    } label: {
                        ZStack {
                            Circle()
                                .fill(color)
                                .frame(width: 56, height: 56)

                            if selectedColorIndex == index {
                                Image(systemName: "checkmark")
                                    .font(.headline.bold())
                                    .foregroundStyle(.white)
                            }
                        }
                        .overlay(
                            Circle()
                                .stroke(selectedColorIndex == index ? Color.white : Color.clear, lineWidth: 3)
                        )
                        .shadow(
                            color: selectedColorIndex == index ? color.opacity(0.5) : .clear,
                            radius: 8,
                            x: 0,
                            y: 3
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal)

            Spacer()

            navigationButtons(canSkip: false, nextLabel: "Review")
        }
        .padding()
    }

    // MARK: - Page 8: Review

    private var reviewPage: some View {
        VStack(alignment: .leading, spacing: 16) {
            Spacer().frame(height: 20)

            // Profile preview with color
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(UserPrefsViewModel.profileColors[selectedColorIndex])
                        .frame(width: 60, height: 60)

                    Text(firstName.isEmpty ? "?" : String(firstName.prefix(1)).uppercased())
                        .font(.title2.bold())
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(firstName.isEmpty ? "Review your info" : "Looking good, \(firstName)!")
                        .font(.title2.bold())

                    Text("Make sure everything looks right.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }

            ScrollView {
                VStack(spacing: 8) {
                    reviewItem(label: "Name", value: firstName.isEmpty ? "Not provided" : firstName, icon: "person.fill", editPage: 3)
                    reviewItem(label: "Location", value: displayLocationForReview, icon: "location.fill", editPage: 4)
                    reviewItem(label: "Birth Year", value: selectedBirthYear.map { String($0) } ?? "Not provided", icon: "gift.fill", editPage: 5)
                    reviewItem(label: "About You", value: qualificationsDisplayString, icon: "checklist", editPage: 6)
                    reviewItemWithColor(label: "Profile Color", colorIndex: selectedColorIndex, editPage: 7)
                }
            }

            // Carl personalization toggle
            VStack(alignment: .leading, spacing: 8) {
                Toggle(isOn: $shareProfileWithCarl) {
                    HStack(spacing: 12) {
                        Image(systemName: "sparkles")
                            .font(.body)
                            .foregroundStyle(Color.appPrimary)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text("Personalize Ask Carl")
                                .font(.subheadline.weight(.medium))

                            Text("Let Carl use your profile to give better recommendations")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                .tint(Color.appPrimary)

                Text("Your data stays on-device and is never stored by Carl. You can change this anytime in Settings → Safety.")
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
                    .padding(.leading, 36)
            }
            .padding()
            .background(Color.appPrimary.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            // Privacy reminder
            HStack(spacing: 12) {
                Image(systemName: "checkmark.shield")
                    .font(.caption)
                    .foregroundStyle(Color.appPrimary)

                Text("Your profile is stored only on this device. We never collect or transmit your personal information.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .background(Color.appPrimary.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(spacing: 12) {
                Button {
                    completeOnboarding()
                } label: {
                    Text("Confirm & Continue")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)

                Button {
                    previousPage()
                } label: {
                    Text("Go Back")
                        .frame(maxWidth: .infinity)
                        .padding()
                        #if os(iOS)
                        .background(.regularMaterial)
                        #else
                        .background(Color.secondary.opacity(0.2))
                        #endif
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
    }

    // MARK: - Page 8: Processing

    private var processingPage: some View {
        VStack(spacing: 32) {
            Spacer()

            ProgressView()
                .scaleEffect(1.5)
                .progressViewStyle(.circular)

            Text(processingMessage)
                .font(.title3)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)

            Spacer()
        }
        .padding()
    }

    // MARK: - Helper Views

    private func featureRow(icon: String, title: String, description: String) -> some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(Color.appPrimary)
                .frame(width: 48, height: 48)
                .background(Color.appPrimary.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)
        }
    }

    private func privacyItem(icon: String, title: String, description: String) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundStyle(Color.appSuccess)
                .frame(width: 36, height: 36)
                .background(Color.appSuccess.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))

                Text(description)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 0)
        }
    }

    private func reviewItem(label: String, value: String, icon: String, editPage: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(Color.appPrimary)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text(value)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(2)
            }

            Spacer()

            Button {
                goToPage(editPage)
            } label: {
                Image(systemName: "pencil")
                    .font(.caption)
                    .foregroundStyle(Color.appPrimary)
            }
        }
        .padding()
        #if os(iOS)
        .background(Color(.secondarySystemBackground))
        #else
        .background(Color.secondary.opacity(0.1))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func reviewItemWithColor(label: String, colorIndex: Int, editPage: Int) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(UserPrefsViewModel.profileColors[colorIndex])
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Text("Selected")
                    .font(.subheadline.weight(.medium))
            }

            Spacer()

            Button {
                goToPage(editPage)
            } label: {
                Image(systemName: "pencil")
                    .font(.caption)
                    .foregroundStyle(Color.appPrimary)
            }
        }
        .padding()
        #if os(iOS)
        .background(Color(.secondarySystemBackground))
        #else
        .background(Color.secondary.opacity(0.1))
        #endif
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private func navigationButtons(canSkip: Bool = false, nextLabel: String = "Continue") -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                if currentPage > 1 {
                    Button {
                        previousPage()
                    } label: {
                        Text("Back")
                            .frame(maxWidth: .infinity)
                            .padding()
                            #if os(iOS)
                            .background(.regularMaterial)
                            #else
                            .background(Color.secondary.opacity(0.2))
                            #endif
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .buttonStyle(.plain)
                }

                Button {
                    nextPage()
                } label: {
                    Text(nextLabel)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.appPrimary)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
            }

            if canSkip {
                Button {
                    nextPage()
                } label: {
                    Text("Skip this step")
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - Computed Properties

    private var displayLocationForReview: String {
        if let city = detectedCity, !city.isEmpty {
            return city
        }
        if let county = detectedCounty {
            return countyIdToDisplayName(county)
        }
        return "Not provided"
    }

    private var qualificationsDisplayString: String {
        var items: [String] = []

        if isMilitaryOrVeteran {
            items.append("Veteran/Military")
        }

        for qual in selectedQualifications {
            switch qual {
            case "lgbtq": items.append("LGBTQ+")
            case "immigrant": items.append("Immigrant")
            case "first-responder": items.append("First Responder")
            case "educator": items.append("Educator")
            case "unemployed": items.append("Job seeker")
            case "public-assistance": items.append("Public assistance")
            case "student": items.append("Student")
            case "disability": items.append("Disability")
            case "caregiver": items.append("Caregiver")
            default: break
            }
        }

        return items.isEmpty ? "None selected" : items.joined(separator: ", ")
    }

    // MARK: - Accessibility

    private func announcePageChange() {
        let pageNames = [
            "Language selection",
            "Welcome",
            "Privacy information",
            "Enter your name",
            "Enter your location",
            "Enter your birth year",
            "Select your qualifications",
            "Choose profile color",
            "Review your information",
            "Processing"
        ]
        let pageName = currentPage < pageNames.count ? pageNames[currentPage] : "Page \(currentPage + 1)"
        Task { @MainActor in
            AccessibilityService.shared.announceScreenChange("\(pageName), step \(currentPage + 1) of \(totalPages)")
        }
    }

    // MARK: - Navigation

    private func nextPage() {
        if currentPage < totalPages - 1 {
            if reduceMotion {
                currentPage += 1
            } else {
                withAnimation {
                    currentPage += 1
                }
            }
            triggerHaptic()
        }
    }

    private func previousPage() {
        if currentPage > 0 {
            if reduceMotion {
                currentPage -= 1
            } else {
                withAnimation {
                    currentPage -= 1
                }
            }
            triggerHaptic()
        }
    }

    private func goToPage(_ page: Int) {
        if reduceMotion {
            currentPage = page
        } else {
            withAnimation {
                currentPage = page
            }
        }
        triggerHaptic()
    }

    private func skipOnboarding() {
        Task {
            await userPrefsVM.completeOnboarding()
        }
    }

    // MARK: - Location Handling

    private func handleLocationInput(_ input: String) {
        guard !input.isEmpty else {
            locationError = nil
            detectedCounty = nil
            detectedCity = nil
            detectedZipCode = nil
            locationSuggestions = []
            return
        }

        // Get suggestions if not a ZIP code
        if !LocationLookup.isZipCodeFormat(input) {
            locationSuggestions = LocationLookup.getSuggestions(for: input, limit: 5)
        } else {
            locationSuggestions = []
        }

        // Try to look up county
        if let countyName = LocationLookup.lookupCounty(input) {
            let countyId = countyNameToId(countyName)

            // Determine city
            var cityName = input
            var zipCode: String?

            if LocationLookup.isZipCodeFormat(input) {
                zipCode = input
                if let city = LocationLookup.zipToCity[input] {
                    cityName = city
                }
            }

            detectedCounty = countyId
            detectedCity = cityName
            detectedZipCode = zipCode
            locationError = nil
            locationSuggestions = []
            triggerHaptic()
        } else if input.count >= 3 {
            locationError = "City or ZIP not found in Bay Area"
            detectedCounty = nil
            detectedZipCode = nil
        }
    }

    private func detectLocation() {
        isGpsLoading = true
        locationError = nil

        locationService.getCurrentLocation()

        // Poll for result
        Task {
            // Wait for location service to update
            for _ in 0..<30 { // 3 seconds max
                try? await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

                if !locationService.isLoading {
                    break
                }
            }

            await MainActor.run {
                isGpsLoading = false

                if let county = locationService.currentCounty {
                    let countyId = countyNameToId(county)
                    detectedCounty = countyId
                    detectedCity = county // Use county name for GPS detection
                    locationInput = county
                    locationError = nil
                    triggerHaptic()
                } else if let error = locationService.error {
                    locationError = error
                } else {
                    locationError = "Could not detect location. Try entering your city or ZIP."
                }
            }
        }
    }

    // MARK: - Completion

    private func completeOnboarding() {
        // Check for sensitive categories
        if hasSensitiveCategories {
            showSensitiveDataDialog = true
            pendingCompletion = true
            return
        }

        proceedWithCompletion()
    }

    private func completeOnboardingAfterDialog(enableEncryption: Bool) {
        if enableEncryption {
            Task {
                let _ = await SafetyService.shared.enableEncryption()
                triggerHaptic()
            }
        }

        proceedWithCompletion()
    }

    private func proceedWithCompletion() {
        // Go to processing page
        goToPage(totalPages - 1)

        Task {
            isProcessing = true

            // Processing messages
            await updateProcessingMessage("Setting up your profile...")
            try? await Task.sleep(nanoseconds: 800_000_000)

            let locationName = detectedCity ?? (detectedCounty.map { countyIdToDisplayName($0) } ?? "your area")
            await updateProcessingMessage("Finding programs in \(locationName)...")
            try? await Task.sleep(nanoseconds: 800_000_000)

            await updateProcessingMessage("Personalizing your experience...")
            try? await Task.sleep(nanoseconds: 800_000_000)

            // Save preferences (legacy single-user prefs)
            await userPrefsVM.savePreferences(
                firstName: firstName.isEmpty ? nil : firstName,
                city: detectedCity,
                zipCode: detectedZipCode,
                county: detectedCounty,
                birthYear: selectedBirthYear,
                isMilitaryOrVeteran: isMilitaryOrVeteran ? true : nil,
                qualifications: Array(selectedQualifications),
                groups: [],
                profileColorIndex: selectedColorIndex
            )

            // Save Carl personalization preference
            await SafetyService.shared.setShareProfileWithCarlEnabled(shareProfileWithCarl)

            // Create profile in ProfileService (multi-profile system)
            // Only create if no profiles exist yet (avoid duplicates on re-onboarding)
            let existingProfiles = await ProfileService.shared.getProfiles()
            if existingProfiles.isEmpty {
                let profileName = firstName.isEmpty ? "My Profile" : firstName
                var qualificationsForProfile = Array(selectedQualifications)
                if isMilitaryOrVeteran {
                    qualificationsForProfile.append("veteran")
                }
                _ = await ProfileService.shared.createProfile(
                    name: profileName,
                    city: detectedCity,
                    zipCode: detectedZipCode,
                    county: detectedCounty,
                    birthYear: selectedBirthYear,
                    relationship: .myself,
                    colorIndex: selectedColorIndex,
                    qualifications: qualificationsForProfile
                )
            }

            // Mark onboarding complete
            await userPrefsVM.completeOnboarding()

            try? await Task.sleep(nanoseconds: 500_000_000)
            isProcessing = false
        }
    }

    @MainActor
    private func updateProcessingMessage(_ message: String) {
        processingMessage = message
    }

    // MARK: - Utilities

    private func countyNameToId(_ countyName: String) -> String {
        countyName.lowercased().replacingOccurrences(of: " ", with: "-")
    }

    private func countyIdToDisplayName(_ countyId: String) -> String {
        countyId.split(separator: "-")
            .map { String($0).capitalized }
            .joined(separator: " ")
    }

    private func triggerHaptic() {
        #if os(iOS)
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        #endif
    }
}

#Preview {
    OnboardingView()
        .environment(UserPrefsViewModel())
        .environment(ProgramsViewModel())
        .environment(SettingsViewModel())
}
