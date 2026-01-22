import SwiftUI

// MARK: - Models

/// Category for glossary terms
enum GlossaryCategory: String, CaseIterable, Identifiable {
    case food = "Food"
    case healthcare = "Healthcare"
    case cash = "Cash Assistance"
    case housing = "Housing"
    case utilities = "Utilities"
    case disability = "Disability"
    case education = "Education"
    case transportation = "Transportation"
    case general = "General"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .food: return "fork.knife"
        case .healthcare: return "heart.fill"
        case .cash: return "dollarsign.circle.fill"
        case .housing: return "house.fill"
        case .utilities: return "bolt.fill"
        case .disability: return "accessibility"
        case .education: return "graduationcap.fill"
        case .transportation: return "bus.fill"
        case .general: return "building.columns.fill"
        }
    }

    var color: Color {
        switch self {
        case .food: return .orange
        case .healthcare: return .red
        case .cash: return .green
        case .housing: return .blue
        case .utilities: return .yellow
        case .disability: return .purple
        case .education: return .indigo
        case .transportation: return .cyan
        case .general: return .gray
        }
    }
}

/// A glossary term with acronym, full name, description, and category
struct GlossaryTerm: Identifiable, Hashable {
    let id = UUID()
    let acronym: String
    let fullName: String
    let description: String
    let category: GlossaryCategory

    func hash(into hasher: inout Hasher) {
        hasher.combine(acronym)
    }

    static func == (lhs: GlossaryTerm, rhs: GlossaryTerm) -> Bool {
        lhs.acronym == rhs.acronym
    }
}

// MARK: - Glossary Data

extension GlossaryTerm {
    /// All glossary terms organized by category
    static let allTerms: [GlossaryTerm] = [
        // MARK: Food (10 terms)
        GlossaryTerm(
            acronym: "SNAP",
            fullName: "Supplemental Nutrition Assistance Program",
            description: "Federal food assistance program providing monthly benefits on an EBT card. Known as CalFresh in California. Helps low-income individuals and families afford nutritious food.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "CalFresh",
            fullName: "California Food Assistance Program",
            description: "California's name for SNAP, providing monthly food benefits loaded onto an EBT card. Eligibility based on income, household size, and expenses.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "EBT",
            fullName: "Electronic Benefits Transfer",
            description: "Debit card used to receive and spend CalFresh, WIC, and other food benefits. Accepted at most grocery stores, farmers markets, and some restaurants for seniors.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "WIC",
            fullName: "Women, Infants, and Children",
            description: "Nutrition program for pregnant women, new mothers, infants, and children up to age 5. Provides healthy foods, nutrition education, breastfeeding support, and healthcare referrals.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "CSFP",
            fullName: "Commodity Supplemental Food Program",
            description: "Provides monthly food packages to low-income seniors aged 60 and older. Packages include cereal, juice, milk, cheese, canned goods, and other nutritious items.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "TEFAP",
            fullName: "The Emergency Food Assistance Program",
            description: "Federal program that provides emergency food to low-income Americans through food banks and pantries. No application required at most distribution sites.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "SFSP",
            fullName: "Summer Food Service Program",
            description: "Provides free meals to children 18 and under during summer months when school is out. No registration or proof of income required at meal sites.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "CACFP",
            fullName: "Child and Adult Care Food Program",
            description: "Provides meals and snacks to children and adults in day care settings. Helps care centers, family day care homes, and after-school programs serve nutritious food.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "NSLP",
            fullName: "National School Lunch Program",
            description: "Provides free or reduced-price lunches to students in public and private schools. Eligibility based on household income and family size.",
            category: .food
        ),
        GlossaryTerm(
            acronym: "SBP",
            fullName: "School Breakfast Program",
            description: "Provides free or reduced-price breakfast to students before school. Works alongside NSLP to ensure children have nutritious meals during the school day.",
            category: .food
        ),

        // MARK: Healthcare (12 terms)
        GlossaryTerm(
            acronym: "Medi-Cal",
            fullName: "California Medicaid Program",
            description: "California's Medicaid program providing free or low-cost health coverage to eligible individuals and families. Covers doctor visits, hospital stays, prescriptions, mental health, dental, and vision.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "Medicare",
            fullName: "Federal Health Insurance for Seniors",
            description: "Federal health insurance for people 65 and older, and some younger people with disabilities. Part A covers hospital stays, Part B covers outpatient care, Part D covers prescriptions.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "CHIP",
            fullName: "Children's Health Insurance Program",
            description: "Health coverage for uninsured children in families with incomes too high for Medicaid but who cannot afford private insurance. In California, this is part of Medi-Cal.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "ACA",
            fullName: "Affordable Care Act",
            description: "Federal law (Obamacare) that created health insurance marketplaces, expanded Medicaid, and established consumer protections. Covered California is the state's ACA marketplace.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "FQHC",
            fullName: "Federally Qualified Health Center",
            description: "Community health centers that provide primary care regardless of ability to pay. Use sliding fee scale based on income. Found throughout the Bay Area serving underserved communities.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "MSP",
            fullName: "Medicare Savings Program",
            description: "Helps pay Medicare premiums, deductibles, and copays for low-income beneficiaries. Includes QMB, SLMB, and QI programs with different income limits.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "LIS",
            fullName: "Low-Income Subsidy (Extra Help)",
            description: "Medicare program that helps pay for prescription drug costs under Part D. Also called Extra Help. Significantly reduces premiums, deductibles, and copays for medications.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "PACE",
            fullName: "Program of All-Inclusive Care for the Elderly",
            description: "Comprehensive care program for seniors 55+ who need nursing home level care but want to remain in the community. Covers medical, social, and long-term care services.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "CHDP",
            fullName: "Child Health and Disability Prevention",
            description: "California program providing free health assessments for children and youth under 21. Includes physical exams, immunizations, vision and hearing tests, and dental screenings.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "EPSDT",
            fullName: "Early and Periodic Screening, Diagnostic and Treatment",
            description: "Medicaid's comprehensive preventive health program for children under 21. Covers all medically necessary services to correct or improve health conditions.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "DME",
            fullName: "Durable Medical Equipment",
            description: "Medical equipment prescribed by doctors for home use, such as wheelchairs, hospital beds, oxygen equipment, and walkers. Covered by Medicare Part B and Medi-Cal.",
            category: .healthcare
        ),
        GlossaryTerm(
            acronym: "HMO",
            fullName: "Health Maintenance Organization",
            description: "Type of health insurance plan requiring members to choose a primary care doctor and get referrals for specialists. Common Medi-Cal managed care plan type in California.",
            category: .healthcare
        ),

        // MARK: Cash Assistance (10 terms)
        GlossaryTerm(
            acronym: "SSI",
            fullName: "Supplemental Security Income",
            description: "Federal monthly cash assistance for elderly (65+), blind, or disabled individuals with limited income and resources. Administered by Social Security Administration.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "SSDI",
            fullName: "Social Security Disability Insurance",
            description: "Monthly benefits for workers who become disabled and have paid into Social Security through payroll taxes. Amount based on work history, not financial need.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "CalWORKs",
            fullName: "California Work Opportunity and Responsibility to Kids",
            description: "California's welfare-to-work program providing temporary cash aid and services to eligible families with children. Includes job training, education, and childcare assistance.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "TANF",
            fullName: "Temporary Assistance for Needy Families",
            description: "Federal program funding state welfare programs like CalWORKs. Provides cash assistance to families with children while promoting work and self-sufficiency.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "GA",
            fullName: "General Assistance",
            description: "County-funded cash assistance program for low-income adults who don't qualify for other aid programs. Benefits and eligibility vary by county.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "EITC",
            fullName: "Earned Income Tax Credit",
            description: "Refundable federal tax credit for low to moderate income workers. California also has CalEITC for additional state credit. Can provide significant refund even with no tax liability.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "CTC",
            fullName: "Child Tax Credit",
            description: "Federal tax credit for families with children under 17. Provides up to $2,000 per child. Partially refundable for families with earned income.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "CAPI",
            fullName: "Cash Assistance Program for Immigrants",
            description: "California program providing SSI-equivalent cash benefits to aged, blind, or disabled legal immigrants who don't qualify for federal SSI due to immigration status.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "RSDI",
            fullName: "Retirement, Survivors, and Disability Insurance",
            description: "Social Security benefits for retired workers, survivors of deceased workers, and disabled workers who have paid into the system. Based on lifetime earnings.",
            category: .cash
        ),
        GlossaryTerm(
            acronym: "SDI",
            fullName: "State Disability Insurance",
            description: "California program providing short-term partial wage replacement to workers unable to work due to non-work-related illness, injury, or pregnancy.",
            category: .cash
        ),

        // MARK: Housing (10 terms)
        GlossaryTerm(
            acronym: "HUD",
            fullName: "Department of Housing and Urban Development",
            description: "Federal agency overseeing housing programs, fair housing enforcement, and community development. Funds public housing, Section 8 vouchers, and homeless assistance.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "Section 8",
            fullName: "Housing Choice Voucher Program",
            description: "Federal rental assistance allowing low-income families to rent private housing. Voucher pays difference between 30% of income and fair market rent. Long waitlists common.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "PHA",
            fullName: "Public Housing Authority",
            description: "Local agency administering public housing and voucher programs. Bay Area PHAs include Oakland, San Francisco, San Jose housing authorities.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "CoC",
            fullName: "Continuum of Care",
            description: "Regional planning body coordinating homeless services and HUD funding. Bay Area counties each have CoCs that oversee emergency shelter, transitional, and permanent housing.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "LIHTC",
            fullName: "Low-Income Housing Tax Credit",
            description: "Tax incentive for developers to build affordable rental housing. LIHTC apartments have income limits and below-market rents. Major source of affordable housing nationwide.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "HCV",
            fullName: "Housing Choice Voucher",
            description: "Official name for Section 8 vouchers. Tenant-based rental assistance that moves with the family, allowing them to choose housing in the private market.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "PBV",
            fullName: "Project-Based Voucher",
            description: "Section 8 assistance attached to specific housing units rather than families. Residents must live in the designated property to receive assistance.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "FMR",
            fullName: "Fair Market Rent",
            description: "HUD-determined maximum rent for Section 8 voucher holders in an area. Based on local rental market data. Bay Area has some of highest FMRs in the nation.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "VASH",
            fullName: "Veterans Affairs Supportive Housing",
            description: "HUD-VASH combines Section 8 vouchers with VA supportive services for homeless veterans. Provides rental assistance plus case management and healthcare.",
            category: .housing
        ),
        GlossaryTerm(
            acronym: "RAD",
            fullName: "Rental Assistance Demonstration",
            description: "HUD program allowing public housing to convert to Section 8 to access private financing for repairs. Preserves affordability while enabling building improvements.",
            category: .housing
        ),

        // MARK: Utilities (8 terms)
        GlossaryTerm(
            acronym: "CARE",
            fullName: "California Alternate Rates for Energy",
            description: "Utility discount program providing 20-35% off electricity and natural gas bills for qualifying low-income households. Apply through PG&E or local utility.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "FERA",
            fullName: "Family Electric Rate Assistance",
            description: "Electric discount program for households with 3+ people whose income is slightly over CARE limits. Provides 18% discount on electricity bills.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "LIHEAP",
            fullName: "Low Income Home Energy Assistance Program",
            description: "Federal program helping pay heating and cooling bills. In California, provides one-time payment to utility or fuel vendor. Apply through local community action agency.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "ACP",
            fullName: "Affordable Connectivity Program",
            description: "Federal program that provided $30/month discount on internet service for eligible households. Program ended in 2024 when funding ran out. May be replaced by new programs.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "Lifeline",
            fullName: "Lifeline Telephone Assistance",
            description: "Federal and state programs providing discounted phone service (landline or wireless) for low-income households. California Lifeline offers $13.60/month discount.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "ESAP",
            fullName: "Energy Savings Assistance Program",
            description: "Free weatherization and energy efficiency services for low-income households. Includes appliances, insulation, weatherstripping, and energy education.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "HEAP",
            fullName: "Home Energy Assistance Program",
            description: "Another name for LIHEAP in some areas. Provides financial assistance to help low-income households pay heating and cooling costs.",
            category: .utilities
        ),
        GlossaryTerm(
            acronym: "REACH",
            fullName: "Relief for Energy Assistance through Community Help",
            description: "PG&E program providing one-time energy credit up to $300 for qualifying customers facing hardship. Funded by customer and shareholder contributions.",
            category: .utilities
        ),

        // MARK: Disability (8 terms)
        GlossaryTerm(
            acronym: "IHSS",
            fullName: "In-Home Supportive Services",
            description: "California program providing in-home caregivers for elderly, blind, or disabled persons to remain safely at home. Covers housework, meals, personal care, and accompaniment.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "DDS",
            fullName: "Department of Developmental Services",
            description: "California agency providing services for people with developmental disabilities like autism, cerebral palsy, and intellectual disabilities. Services through Regional Centers.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "ADA",
            fullName: "Americans with Disabilities Act",
            description: "Federal civil rights law prohibiting discrimination against people with disabilities. Requires accessibility in employment, public services, transportation, and accommodations.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "ABLE",
            fullName: "Achieving a Better Life Experience",
            description: "Tax-advantaged savings accounts for people with disabilities. CalABLE allows saving up to $100,000 without affecting SSI or Medi-Cal eligibility.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "DOR",
            fullName: "Department of Rehabilitation",
            description: "California agency helping people with disabilities find and keep employment. Provides vocational training, job placement, assistive technology, and support services.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "IPE",
            fullName: "Individualized Plan for Employment",
            description: "Written plan developed with Department of Rehabilitation outlining employment goals and services. Required for receiving DOR vocational rehabilitation services.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "HCBS",
            fullName: "Home and Community-Based Services",
            description: "Medicaid waiver programs providing services in homes and communities instead of institutions. Includes personal care, day programs, and supported employment.",
            category: .disability
        ),
        GlossaryTerm(
            acronym: "SDP",
            fullName: "Self-Determination Program",
            description: "California program allowing people with developmental disabilities more control over their services and budget. Participants direct their own supports with an independent facilitator.",
            category: .disability
        ),

        // MARK: Education (8 terms)
        GlossaryTerm(
            acronym: "FAFSA",
            fullName: "Free Application for Federal Student Aid",
            description: "Form used to apply for federal financial aid including grants, loans, and work-study. Required for most state and college aid. California deadline is March 2.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "Pell Grant",
            fullName: "Federal Pell Grant",
            description: "Federal grant for undergraduate students with exceptional financial need. Does not need to be repaid. Maximum award around $7,400/year (2024-25). Based on FAFSA EFC.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "Cal Grant",
            fullName: "California Student Grant",
            description: "State financial aid for California college students. Cal Grant A covers tuition at UC/CSU; Cal Grant B adds living allowance for lowest-income students.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "BOG",
            fullName: "Board of Governors Fee Waiver",
            description: "Now called California College Promise Grant. Waives enrollment fees at California community colleges for eligible students. Apply through college financial aid office.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "CCPG",
            fullName: "California College Promise Grant",
            description: "Waives per-unit enrollment fees at all 116 California community colleges. Three eligibility methods: FAFSA need, public assistance receipt, or income standards.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "EOPS",
            fullName: "Extended Opportunity Programs and Services",
            description: "California community college program providing intensive support for low-income, educationally disadvantaged students. Includes counseling, grants, and book vouchers.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "CARE",
            fullName: "Cooperative Agencies Resources for Education",
            description: "Community college program for single parents receiving CalWORKs/TANF. Part of EOPS, provides additional grants, childcare assistance, and support services.",
            category: .education
        ),
        GlossaryTerm(
            acronym: "DSPS",
            fullName: "Disabled Students Programs and Services",
            description: "California community college program providing accommodations and support for students with disabilities. Services include note-taking, testing accommodations, and assistive technology.",
            category: .education
        ),

        // MARK: Transportation (8 terms)
        GlossaryTerm(
            acronym: "Clipper",
            fullName: "Clipper Card",
            description: "Bay Area's all-in-one transit fare payment card. Accepted on BART, Muni, AC Transit, Caltrain, and 20+ other transit systems. Add cash value or passes.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "BART",
            fullName: "Bay Area Rapid Transit",
            description: "Regional heavy rail system connecting San Francisco, Oakland, Berkeley, and suburbs. 131 miles of track with 50 stations. Offers discount programs for low-income riders.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "Muni",
            fullName: "San Francisco Municipal Transportation Agency",
            description: "San Francisco's public transit system including buses, light rail, cable cars, and streetcars. Offers Lifeline Pass for low-income residents.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "MTC",
            fullName: "Metropolitan Transportation Commission",
            description: "Regional transportation planning and financing agency for the nine-county Bay Area. Oversees Clipper card and coordinates regional transit planning.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "Paratransit",
            fullName: "ADA Paratransit Service",
            description: "Door-to-door transit service for people whose disabilities prevent them from using regular public transit. Required by ADA. Available in all Bay Area counties.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "Caltrain",
            fullName: "Peninsula Corridor Joint Powers Board",
            description: "Commuter rail service connecting San Francisco to San Jose and Gilroy. 77 miles with 32 stations. Offers Go Pass discount programs for employers.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "VTA",
            fullName: "Santa Clara Valley Transportation Authority",
            description: "Transit agency serving Santa Clara County including buses, light rail, and paratransit. Connects to BART, Caltrain, and ACE. Offers reduced fares for seniors and disabled.",
            category: .transportation
        ),
        GlossaryTerm(
            acronym: "AC Transit",
            fullName: "Alameda-Contra Costa Transit District",
            description: "Bus system serving the East Bay including Oakland, Berkeley, and Fremont. Transbay service to San Francisco. Offers discount fare programs for eligible riders.",
            category: .transportation
        ),

        // MARK: General (10 terms)
        GlossaryTerm(
            acronym: "HSA",
            fullName: "Human Services Agency",
            description: "County department administering social services programs like CalFresh, Medi-Cal, CalWORKs, and General Assistance. Apply for benefits at your county HSA.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "SSA",
            fullName: "Social Security Administration",
            description: "Federal agency administering Social Security retirement, disability (SSDI), and Supplemental Security Income (SSI) programs. Offices throughout Bay Area.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "FPL",
            fullName: "Federal Poverty Level",
            description: "Income threshold updated annually by HHS used to determine eligibility for many programs. 2024 FPL for individual: $15,060; family of four: $31,200.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "AMI",
            fullName: "Area Median Income",
            description: "Median household income for a metropolitan area, calculated by HUD. Used for affordable housing eligibility. Bay Area AMI among highest in nation.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "211",
            fullName: "2-1-1 Information Line",
            description: "Free, confidential helpline connecting callers to local health and social services. Dial 2-1-1 or text your zip code to 898-211. Available 24/7 in multiple languages.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "CBO",
            fullName: "Community-Based Organization",
            description: "Nonprofit organization providing services in a specific geographic community. CBOs often help with benefits enrollment, case management, and support services.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "BOS",
            fullName: "Board of Supervisors",
            description: "Elected governing body of a California county. Sets policy, approves budgets, and oversees county departments including human services. Five supervisors per county.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "SOGI",
            fullName: "Sexual Orientation and Gender Identity",
            description: "Data collection categories added to many health and social service programs. Helps identify disparities and ensure equitable services for LGBTQ+ individuals.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "LEP",
            fullName: "Limited English Proficient",
            description: "Describes individuals who do not speak English as their primary language and have limited ability to read, speak, write, or understand English. Entitled to language assistance.",
            category: .general
        ),
        GlossaryTerm(
            acronym: "ITIN",
            fullName: "Individual Taxpayer Identification Number",
            description: "Tax processing number issued by IRS for individuals who don't have or aren't eligible for Social Security number. Used by immigrants for tax filing and some benefits.",
            category: .general
        ),
    ]
}

// MARK: - Glossary View

/// Full Glossary view with NavigationStack (use when displayed as a tab)
struct GlossaryView: View {
    var body: some View {
        NavigationStack {
            GlossaryViewContent()
        }
    }
}

/// Glossary content without NavigationStack (use when pushed onto existing navigation)
struct GlossaryViewContent: View {
    @State private var searchText = ""
    @State private var selectedCategory: GlossaryCategory?
    @State private var expandedTerms: Set<UUID> = []

    private var filteredTerms: [GlossaryTerm] {
        var terms = GlossaryTerm.allTerms

        // Filter by category
        if let category = selectedCategory {
            terms = terms.filter { $0.category == category }
        }

        // Filter by search text
        if !searchText.isEmpty {
            let query = searchText.lowercased()
            terms = terms.filter {
                $0.acronym.lowercased().contains(query) ||
                $0.fullName.lowercased().contains(query) ||
                $0.description.lowercased().contains(query)
            }
        }

        return terms
    }

    private var groupedTerms: [(String, [GlossaryTerm])] {
        let sorted = filteredTerms.sorted { $0.acronym < $1.acronym }
        let grouped = Dictionary(grouping: sorted) { String($0.acronym.prefix(1)).uppercased() }
        return grouped.sorted { $0.key < $1.key }
    }

    var body: some View {
        VStack(spacing: 0) {
            // Category filter chips
            categoryFilter
                .padding(.vertical, 8)

            // Results count
            HStack {
                Text("\(filteredTerms.count) terms")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
            }
            .padding(.horizontal)
            .padding(.bottom, 8)

            // Terms list
            if filteredTerms.isEmpty {
                emptyState
            } else {
                termsList
            }
        }
        .navigationTitle("Glossary")
        #if os(iOS)
        .navigationBarTitleDisplayMode(.large)
        #endif
        .searchable(text: $searchText, prompt: "Search acronyms...")
    }

    // MARK: - Category Filter

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                // All button
                FilterChipButton(
                    title: "All",
                    icon: "square.grid.2x2",
                    color: .primary,
                    isSelected: selectedCategory == nil
                ) {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedCategory = nil
                    }
                }

                // Category buttons
                ForEach(GlossaryCategory.allCases) { category in
                    FilterChipButton(
                        title: category.rawValue,
                        icon: category.icon,
                        color: category.color,
                        isSelected: selectedCategory == category
                    ) {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selectedCategory = selectedCategory == category ? nil : category
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Terms List

    private var termsList: some View {
        List {
            ForEach(groupedTerms, id: \.0) { letter, terms in
                Section {
                    ForEach(terms) { term in
                        GlossaryTermRow(
                            term: term,
                            isExpanded: expandedTerms.contains(term.id),
                            searchText: searchText
                        ) {
                            withAnimation(.easeInOut(duration: 0.2)) {
                                if expandedTerms.contains(term.id) {
                                    expandedTerms.remove(term.id)
                                } else {
                                    expandedTerms.insert(term.id)
                                }
                            }
                        }
                    }
                } header: {
                    Text(letter)
                        .font(.headline)
                        .foregroundStyle(.primary)
                }
            }
        }
        #if os(iOS) || os(visionOS)
        .listStyle(.insetGrouped)
        #else
        .listStyle(.inset)
        #endif
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()

            Image(systemName: "magnifyingglass")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)

            Text("No terms found")
                .font(.title2.bold())

            Text("Try a different search or category")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Spacer()
        }
    }
}

// MARK: - Filter Chip Button

private struct FilterChipButton: View {
    let title: String
    let icon: String
    let color: Color
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? color.opacity(0.2) : Color.secondary.opacity(0.1))
            .foregroundStyle(isSelected ? color : .secondary)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(isSelected ? color : Color.clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Glossary Term Row

private struct GlossaryTermRow: View {
    let term: GlossaryTerm
    let isExpanded: Bool
    let searchText: String
    let onTap: () -> Void

    @State private var showCopiedToast = false

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header row
                HStack(alignment: .top, spacing: 12) {
                    // Acronym badge
                    Text(term.acronym)
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(term.category.color)
                        .clipShape(RoundedRectangle(cornerRadius: 6))

                    VStack(alignment: .leading, spacing: 4) {
                        // Full name with search highlighting
                        Text(highlightedText(term.fullName))
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.primary)
                            .multilineTextAlignment(.leading)

                        // Category label
                        HStack(spacing: 4) {
                            Image(systemName: term.category.icon)
                                .font(.caption2)
                            Text(term.category.rawValue)
                                .font(.caption2)
                        }
                        .foregroundStyle(term.category.color)
                    }

                    Spacer()

                    // Expand indicator
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Expanded content
                if isExpanded {
                    VStack(alignment: .leading, spacing: 12) {
                        // Description
                        Text(highlightedText(term.description))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)

                        // Action buttons
                        HStack(spacing: 16) {
                            // Copy acronym
                            Button {
                                copyToClipboard("\(term.acronym): \(term.fullName)")
                            } label: {
                                Label("Copy", systemImage: "doc.on.doc")
                                    .font(.caption)
                            }
                            .buttonStyle(.bordered)
                            .tint(term.category.color)

                            Spacer()
                        }
                    }
                    .padding(.top, 4)
                    .transition(.opacity.combined(with: .move(edge: .top)))
                }
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
        .overlay(alignment: .bottom) {
            if showCopiedToast {
                Text("Copied to clipboard")
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.primary.opacity(0.9))
                    #if os(iOS)
                    .foregroundStyle(Color(uiColor: .systemBackground))
                    #elseif os(macOS)
                    .foregroundStyle(Color(nsColor: .windowBackgroundColor))
                    #else
                    .foregroundStyle(.background)
                    #endif
                    .clipShape(Capsule())
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
    }

    private func highlightedText(_ text: String) -> AttributedString {
        var attributedString = AttributedString(text)

        guard !searchText.isEmpty else { return attributedString }

        if let range = attributedString.range(of: searchText, options: .caseInsensitive) {
            attributedString[range].foregroundColor = term.category.color
            attributedString[range].font = .subheadline.bold()
        }

        return attributedString
    }

    private func copyToClipboard(_ text: String) {
        #if os(iOS)
        UIPasteboard.general.string = text
        #elseif os(macOS)
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        #endif

        withAnimation {
            showCopiedToast = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            withAnimation {
                showCopiedToast = false
            }
        }
    }
}

// MARK: - Preview

#Preview {
    GlossaryView()
}
