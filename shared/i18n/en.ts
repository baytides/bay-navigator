/**
 * English (source) translations for Bay Navigator
 * This is the source of truth - edit this file to update translations
 */

import type { TranslationData, ProgramTranslations } from './types';

export const ui: TranslationData = {
  common: {
    siteName: 'Bay Navigator',
    siteTagline: 'Your guide to local savings & benefits',
    search: 'Search',
    searchPlaceholder: 'Search programs...',
    loading: 'Loading...',
    error: 'Error',
    close: 'Close',
    learnMore: 'Learn more',
    viewAll: 'View all',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    save: 'Save',
    cancel: 'Cancel',
    apply: 'Apply',
    clear: 'Clear',
    clearFilters: 'Clear filters',
    filter: 'Filter',
    sort: 'Sort',
    share: 'Share',
    print: 'Print',
    download: 'Download',
  },
  nav: {
    home: 'Home',
    directory: 'Directory',
    map: 'Map',
    transit: 'Transit',
    eligibility: 'Eligibility',
    about: 'About',
    favorites: 'Favorites',
    myFavorites: 'My Favorites',
    settings: 'Settings',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    privacyPolicy: 'Privacy Policy',
    terms: 'Terms',
    termsOfService: 'Terms of Service',
    eligibilityGuides: 'Eligibility Guides',
    downloadApp: 'Download App',
    partnerships: 'Partnerships',
    glossary: 'Glossary',
    credits: 'Credits',
    sustainability: 'Sustainability',
    developers: 'Developers',
  },
  search: {
    smartSearch: 'Smart search',
    smartSearchTooltip:
      'Smart Search uses AI to understand your question and find relevant programs. Turn it off for simple keyword matching.',
    noResults: 'No programs found matching your search.',
    browseAll: 'Browse All Programs',
    trySearching: 'Try searching for:',
    orAskQuestion: 'Or ask a question:',
    resultsCount: '{count} program{s} found',
    aiPowered: 'AI-powered',
  },
  fallback: {
    cantFind: "Can't find what you need? Try these resources:",
    call211: 'Call 2-1-1',
    call211Desc: 'Free referrals to local services 24/7',
    legalAid: 'Bay Area Legal Aid',
    legalAidDesc: 'Free legal help: 1-800-551-5554',
    calfresh: 'GetCalFresh.org',
    calfreshDesc: 'Apply for food assistance online',
    benefitsCal: 'BenefitsCal',
    benefitsCalDesc: 'Apply for CA benefits (CalFresh, Medi-Cal)',
  },
  home: {
    heroTitle: 'Find programs, services, and resources in the San Francisco Bay Area',
    heroSubtitle:
      'Discover free and low-cost resources for food, housing, healthcare, utilities, and more.',
    programsFound: 'programs found',
    clearSearch: 'Clear search',
    viewAllDirectory: 'View all programs in directory →',
    browseByCategory: 'Browse by Category',
    selectCategory: 'Select a category to find programs and services',
  },
  about: {
    title: 'About Bay Navigator',
    subtitle: 'A community resource connecting Bay Area residents with free and low-cost programs',
    inPlainEnglish: 'In Plain English',
    summary:
      "This website lists free and discounted programs in the Bay Area. It's made by Bay Tides, a nonprofit that protects the San Francisco Bay. We don't charge anything, we don't sell your information, and we don't get paid for any listings.",
    stats: {
      programsListed: 'Programs Listed',
      bayAreaCounties: 'Bay Area Counties',
      verified: 'Verified',
      costToUse: 'Cost to Use',
    },
    whyWeBuiltThis: 'Why We Built This',
    whyWeBuiltThisDesc:
      'Cost often determines choices. When sustainable options are more expensive, people pick what they can afford. The programs listed here help close that gap.',
    whoThisIsFor: 'Who This Is For',
    whoThisIsForDesc:
      'Anyone in the Bay Area who wants to save money. Low-income households, seniors, veterans, students, people with disabilities, families—there are programs for everyone.',
    environmentalCase: 'The Environmental Case',
    environmentalCaseDesc: 'Many of these programs have environmental benefits:',
    envBenefitTransit: '<strong>Transit discounts</strong> reduce car trips',
    envBenefitLibraries: '<strong>Libraries</strong> mean less manufactured waste',
    envBenefitFood: '<strong>Food assistance</strong> reduces food waste',
    envBenefitUtility: '<strong>Utility programs</strong> improve efficiency',
    envBenefitParks: '<strong>Free park access</strong> connects people to nature',
    ourPrinciples: 'Our Principles',
    principlePrivacy: 'Privacy-first',
    principlePrivacyDesc: 'No tracking, no cookies, no personal data collection. Works offline.',
    principleNoPaidListings: 'No paid listings',
    principleNoPaidListingsDesc: 'We never take money for placement or inclusion.',
    principleAccessible: 'Accessible',
    principleAccessibleDesc:
      'WCAG 2.2 Level AAA compliant. <a href="/accessibility" class="text-primary-700 dark:text-primary-300 hover:underline">Learn more</a>',
    principleCommunity: 'Community maintained',
    principleCommunityDesc: 'Updated regularly. Corrections welcome.',
    principleDisasterReady: 'Disaster-ready',
    principleDisasterReadyDesc:
      'After your first visit, all data is cached offline for emergencies.',
    principleOpenSource: 'Open source',
    principleOpenSourceDesc:
      '<a href="https://github.com/baytides/baynavigator" class="text-primary-700 dark:text-primary-300 hover:underline font-medium">View on GitHub</a>',
    howWereDifferent: "How We're Different",
    howWereDifferentDesc:
      'Compare to other directories like <a href="https://211bayarea.org" class="text-primary-700 dark:text-primary-300 hover:underline font-medium">211 Bay Area</a>',
    diffZeroBurden: 'Zero burden on agencies',
    diffZeroBurdenDesc:
      "We pull from existing government open data APIs. Organizations don't need to apply or submit forms.",
    diffFederalBenefits: 'Federal benefits included',
    diffFederalBenefitsDesc: "We integrate USA.gov's Benefit Finder data for nationwide programs.",
    diffAiSearch: 'AI-powered search',
    diffAiSearchDesc:
      'Natural language queries like "I\'m a 68-year-old senior who needs help with bills" work seamlessly.',
    diffOfflineFirst: 'Offline-first',
    diffOfflineFirstDesc:
      'Works without internet once installed—critical during emergencies when networks are down.',
    dataProblem: 'The Problem with Social Services Data',
    aboutBayTides: 'About Bay Tides',
    aboutBayTidesDesc:
      "Bay Tides is a 501(c)(3) nonprofit founded in 2023 in Redwood City, California. We work to protect the Bay Area's shoreline through education, advocacy, and hands-on conservation.",
    getInvolved: 'Get Involved',
    getInvolvedDesc: 'Want to help? Report errors, suggest programs, or support our work.',
    reportIssue: 'Report Issue',
    donate: 'Donate',
    volunteer: 'Volunteer',
    backToAllPrograms: 'Back to All Programs',
  },
  directory: {
    title: 'Program Directory',
    browseAll: 'Browse all',
    programsAvailable: 'programs and services available in the Bay Area.',
    category: 'Category:',
    authenticatedOnly: 'Authenticated only',
    filterByGroup: 'Filter by group:',
    noMatchingPrograms: 'No programs match your filters',
    tryAdjusting: 'Try adjusting your filters or search terms.',
    clearAllFilters: 'Clear all filters',
    verifyNotice: 'Programs change—always verify details with the official source before applying.',
    reportOutdated: 'Report outdated info',
  },
  categories: {
    all: 'All Categories',
    food: 'Food',
    health: 'Health',
    housing: 'Housing',
    utilities: 'Utilities',
    transportation: 'Transportation',
    education: 'Education',
    legal: 'Legal',
    finance: 'Finance',
    technology: 'Technology',
    recreation: 'Recreation',
    community: 'Community',
  },
  groups: {
    seniors: 'Seniors',
    veterans: 'Veterans',
    families: 'Families',
    youth: 'Youth',
    disabled: 'People with Disabilities',
    lowIncome: 'Low-Income',
    students: 'Students',
    immigrants: 'Immigrants',
    lgbtq: 'LGBTQ+',
  },
  program: {
    eligibility: 'Eligibility',
    howToApply: 'How to Apply',
    whatTheyOffer: 'What they offer',
    howToGetIt: 'How to get it',
    website: 'Website',
    phone: 'Phone',
    address: 'Address',
    hours: 'Hours',
    verified: 'Verified',
    lastUpdated: 'Last updated',
    directions: 'Get directions',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
    needsReview: 'Needs review',
    dataOutdated: 'Data may be outdated:',
    learnMore: 'Learn More',
    visitWebsite: 'Visit website',
    verifiedBy: 'Verified by {source}',
    verifiedDaysAgo: 'Verified {days} days ago',
    verifiedMonthsAgo: 'Last verified {months} months ago',
    verifiedStale: 'Last verified {months} months ago - may need updating',
    verificationUnknown: 'Verification date unknown',
  },
  favorites: {
    title: 'My Favorites',
    savedCount: '{count} of 50 saved programs',
    print: 'Print',
    exportCsv: 'Export CSV',
    clearAll: 'Clear All',
    noFavorites: 'No favorites yet',
    noFavoritesDesc:
      "Save programs you're interested in by clicking the heart icon on any program card.",
    browseDirectory: 'Browse Directory',
    privacyFirst: 'Privacy First',
    privacyNotice:
      "Your favorites are stored only on this device in your browser's local storage. We never send this data to any server.",
    exportedSuccess: 'Favorites exported to CSV',
    removedFromFavorites: 'Removed from favorites',
    clearedAll: 'All favorites cleared',
    confirmClearAll: 'Are you sure you want to remove all favorites? This cannot be undone.',
  },
  download: {
    title: 'Download Bay Navigator',
    openSource: 'Open Source',
    directDownload: 'Direct download for Android devices. No Google Play required.',
    downloadApk: 'Download APK',
    installInstructions: 'Installation Instructions',
    installStep1: 'Download the APK file to your Android device',
    installStep2: 'Open the file (you may need to allow installation from unknown sources)',
    installStep3: 'Follow the on-screen prompts to install',
    otherOptions: 'Other Options',
    comingSoon: 'Coming soon',
    whyOpenSource: 'Why Open Source?',
    noTracking:
      '<strong>No tracking</strong> - The FOSS version has no analytics or crash reporting',
    transparent: '<strong>Transparent</strong> - View the source code and verify what the app does',
    noGoogleServices:
      '<strong>No Google services</strong> - Works without Google Play Services installed',
    communityMaintained:
      '<strong>Community maintained</strong> - Anyone can contribute improvements',
    viewAllReleases: 'View all releases on GitHub',
    backToHome: 'Back to Home',
  },
  safety: {
    quickExit: 'Quick Exit',
    quickExitTooltip: 'Press ESC or click to quickly leave this site',
    needHelp: 'Need immediate help?',
    call911: 'Call 911',
    call988: 'Call/Text 988',
    chatOnline: 'Chat Online',
    youreNotAlone: "You're not alone.",
    crisisSupport: 'Free, confidential 24/7 support. Veterans press 1, Spanish press 2.',
  },
  accessibility: {
    skipToContent: 'Skip to main content',
    skipToNav: 'Skip to navigation',
    textSize: 'Text Size',
    contrast: 'Contrast',
    colorblindMode: 'Colorblind Mode',
    reducedMotion: 'Reduced Motion',
  },
  accessibilityPage: {
    title: 'Accessibility Statement',
    subtitle:
      'Bay Navigator is committed to ensuring digital accessibility for people of all abilities. We continuously improve the user experience for everyone.',
    dashboard: 'Accessibility Dashboard',
    ourCommitment: 'Our Commitment',
    features: 'Accessibility Features',
    visualAccessibility: 'Visual Accessibility',
    motorAccessibility: 'Motor Accessibility',
    screenReaderSupport: 'Screen Reader Support',
    cognitiveAccessibility: 'Cognitive Accessibility',
    technicalStandards: 'Technical Standards',
    testingValidation: 'Testing & Validation',
    knownLimitations: 'Known Limitations',
    assistiveTech: 'Assistive Technology Compatibility',
    learnMore: 'Learn More',
    feedback: 'Accessibility Feedback',
    feedbackDesc:
      'We welcome your feedback on the accessibility of Bay Navigator. If you encounter any barriers or have suggestions for improvement, please let us know.',
  },
  offline: {
    youreOffline: "You're offline",
    offlineMessage: 'Some features may be limited. Connect to the internet for full functionality.',
    smartSearchDisabled: 'Connect to the internet to use smart search.',
  },
  print: {
    scanQR: 'Scan to view this page online or share with others',
  },
  footer: {
    madeWith: 'Made with',
    forBayArea: 'for the Bay Area',
    dataFrom: 'Data from 511.org, Caltrans & Azure Maps',
    copyright: '© 2026 Bay Tides. Open source under MIT license.',
    madeIn: 'Made with 💚 in the San Francisco Bay Area',
    description:
      'A community resource by Bay Tides. Connecting Bay Area residents with free and low-cost programs for food, housing, healthcare, utilities, and more.',
    resources: 'Resources',
    legalAndMore: 'Legal & More',
  },
  developers: {
    title: 'Open Data API',
    subtitle: 'Free, open access to Bay Area community resource data. No API key required.',
    stats: {
      programs: 'Programs',
      categories: 'Categories',
      counties: 'Counties',
      forever: 'Forever',
    },
    openByDesign: 'Open by Design',
    openByDesignDesc:
      'Bay Navigator is an open source project. Our API is freely accessible without registration or API keys. We believe community resource data should be available to everyone building tools to help their communities.',
    baseUrl: 'Base URL',
    endpoints: 'Endpoints',
    programsDesc:
      'All programs with full details including descriptions, contact info, and eligibility.',
    singleProgramDesc: 'Single program by ID. Returns 404 if not found.',
    categoriesDesc: 'Program categories (Food, Health, Transportation, etc.) with program counts.',
    groupsDesc:
      'Eligibility groups (Seniors, Veterans, Income-Eligible, etc.) with program counts.',
    areasDesc:
      'Geographic areas (9 Bay Area counties plus Statewide/Nationwide) with program counts.',
    metadataDesc:
      'API version, last update timestamp, and total program count. Useful for cache invalidation.',
    viewSchema: 'View response schema',
    example: 'Example:',
    quickStart: 'Quick Start',
    dataFreshness: 'Data Freshness',
    freshnessDaily: 'Data is regenerated on every deployment (typically daily)',
    freshnessMetadata: 'Check /api/metadata.json for the generatedAt timestamp',
    freshnessLastUpdated: 'Each program has a lastUpdated field showing when it was last verified',
    freshnessCdn: 'Responses are cached at the CDN layer (Cloudflare) for fast global access',
    corsRateLimits: 'CORS & Rate Limits',
    corsEnabled:
      '<strong>CORS enabled</strong> - Call from any origin (browser, mobile app, server)',
    noRateLimits: '<strong>No rate limits</strong> - Static JSON files, but please be reasonable',
    noAuth: '<strong>No authentication</strong> - No API keys or tokens needed',
    stayUpdated: 'Stay Updated',
    stayUpdatedDesc: 'Want to be notified about API changes, new fields, or breaking changes?',
    watchReleases: 'Watch Releases on GitHub',
    viewSource: 'View Source Code',
    contributing: 'Contributing',
    contributingDesc:
      'Bay Navigator is open source and community-driven. We welcome contributions:',
    contributeAddPrograms: 'Add new programs to the database',
    contributeUpdateInfo: 'Update outdated program information',
    contributeReportBugs: 'Report bugs or suggest features',
    contributeImprove: 'Improve the website or mobile apps',
    readContributingGuide: 'Read the contributing guide',
    license: 'Data and code licensed under AGPL-3.0',
  },
};

export const programs: ProgramTranslations = {
  '211-bay-area': {
    name: '2-1-1 Bay Area',
    description:
      '2-1-1 Bay Area is a free, confidential helpline connecting residents to essential community services 24 hours a day, 7 days a week, in over 180 languages.',
    what_they_offer:
      '- Free 24/7 helpline (dial 2-1-1)\n- Referrals to food assistance programs\n- Housing and shelter resources\n- Legal help connections\n- Health care navigation\n- Utility assistance referrals',
    how_to_get_it:
      '1. Dial 2-1-1 from any phone\n2. Or visit 211bayarea.org\n3. Speak with trained specialist\n4. Describe your needs\n5. Receive personalized referrals\n6. Follow up on resources provided',
    timeframe: 'Ongoing',
    link_text: 'Visit Program',
  },
  'czi-community-space': {
    name: 'CZI Community Space',
    description:
      'The Chan Zuckerberg Initiative Community Space provides free meeting and event venues for local nonprofits at their Redwood City headquarters, supporting community organizations with professional facilities.',
    what_they_offer:
      '- Free meeting rooms for up to 150 people\n- Coworking areas available\n- Full A/V equipment included\n- Kitchen access for events\n- Professional event support\n- Multiple room configurations',
    how_to_get_it:
      '1. Must be a San Mateo County nonprofit\n2. Submit application through CZI website\n3. Describe your organization and event needs\n4. Wait for approval from CZI team\n5. Schedule your space once approved\n6. Follow facility guidelines for events',
    timeframe: 'Ongoing',
    link_text: 'Apply for Access',
  },
  'dolly-parton-library': {
    name: 'Dolly Parton Imagination Library',
    description:
      "Dolly Parton's Imagination Library sends a free, high-quality book every month to registered children from birth to age five, building home libraries and fostering early literacy across California.",
    what_they_offer:
      '- Free book mailed monthly\n- For children birth to age 5\n- High-quality, age-appropriate books\n- Selected by early childhood experts\n- Build library of up to 60 books\n- Delivered directly to your home',
    how_to_get_it:
      "1. Visit California State Library website\n2. Enter your child's information\n3. Provide mailing address\n4. Register each eligible child separately\n5. First book arrives within 8-10 weeks\n6. Books continue monthly until age 5",
    timeframe: 'Ongoing (monthly until age 5)',
    link_text: 'Enroll',
  },
  'generation-thrive-spaces': {
    name: 'Generation Thrive',
    description:
      'Generation Thrive, a partnership between the Golden State Warriors and Kaiser Permanente, provides free meeting and workspace to Bay Area nonprofits at their state-of-the-art facility.',
    what_they_offer:
      '- Free conference rooms\n- Coworking space available\n- Full A/V equipment included\n- Printing services\n- Professional meeting environment\n- Priority for Warriors/Kaiser grantees',
    how_to_get_it:
      '1. Must be a Bay Area-based nonprofit\n2. Submit space request online\n3. Describe your organization and needs\n4. Warriors/Kaiser grantees receive priority\n5. Wait for confirmation of availability\n6. Follow facility guidelines for use',
    timeframe: 'Ongoing',
    link_text: 'Request Meeting Space',
  },
  'google-community-space': {
    name: 'Google Community Space',
    description:
      "Google Community Space offers free professional event and meeting facilities for Bay Area nonprofits, providing access to Google's technology tools and resources.",
    what_they_offer:
      '- Free event and meeting spaces\n- Full A/V equipment included\n- Coworking areas available\n- Kitchen access for events\n- Technology tools and resources\n- Limited to one event per quarter',
    how_to_get_it:
      '1. Must be a Bay Area-based nonprofit\n2. Apply through Google Community Space website\n3. Provide organization details\n4. Describe event or meeting needs\n5. Wait for application approval\n6. Schedule space (max once per quarter)',
    timeframe: 'Ongoing',
    link_text: 'Apply for Access',
  },
  'ohana-floor-salesforce': {
    name: 'Salesforce Ohana Floor',
    description:
      'Salesforce offers their stunning 61st-floor Ohana Floor with panoramic city views as a free event venue for Bay Area nonprofits, complete with professional event support.',
    what_they_offer:
      '- Free 61st-floor event space\n- Capacity up to 250 guests\n- Stunning panoramic city views\n- Full A/V support included\n- Event staff assistance\n- Available once every 12 months per org',
    how_to_get_it:
      '1. Must be a Bay Area-based nonprofit\n2. Submit event request online\n3. Provide organization and event details\n4. Events available weeknights only\n5. Wait for approval and confirmation\n6. Can use once per 12-month period',
    timeframe: 'Weeknights only',
    link_text: 'Request for an Event',
  },
  'season-of-sharing': {
    name: 'Season of Sharing Fund',
    description:
      'The Season of Sharing Fund, a partnership of the San Francisco Chronicle and Bay Area community foundations, provides emergency financial assistance to prevent homelessness for families and individuals in crisis.',
    what_they_offer:
      '- Emergency rental assistance\n- Move-in cost support\n- Basic needs assistance\n- Prevents eviction and homelessness\n- One-time financial support\n- Available through partner agencies',
    how_to_get_it:
      '1. Contact 2-1-1 or local social services\n2. Get referral to Season of Sharing partner\n3. Demonstrate financial emergency\n4. Show risk of homelessness\n5. Work with case manager\n6. Funds paid directly to landlord/vendor',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sobrato-conference-space': {
    name: 'Sobrato Nonprofit Centers Conference Space',
    description:
      'Sobrato Philanthropies provides free meeting and conference facilities at their nonprofit centers throughout the Bay Area, helping organizations save on venue costs.',
    what_they_offer:
      '- Free meeting and conference rooms\n- Spaces for 3 to 200 people\n- Full A/V equipment included\n- Hospitality areas available\n- Multiple Bay Area locations\n- Professional meeting environment',
    how_to_get_it:
      '1. Must be a registered nonprofit\n2. Apply through Sobrato website\n3. Select preferred location and date\n4. Describe meeting or event needs\n5. Wait for confirmation\n6. Follow facility guidelines',
    timeframe: 'Ongoing',
    link_text: 'Apply for Access',
  },
  'tides-converge': {
    name: 'Tides Converge',
    description:
      'Tides Converge is a shared nonprofit campus in the Presidio providing meeting spaces, affordable coworking, and office leases for nonprofits and social enterprises.',
    what_they_offer:
      '- Meeting and event spaces\n- Affordable coworking memberships\n- Office lease opportunities\n- Shared campus environment\n- Networking with other nonprofits\n- Beautiful Presidio location',
    how_to_get_it:
      '1. Must be a nonprofit or social enterprise\n2. Visit Tides website for options\n3. Apply for space or membership\n4. Tour the Presidio campus\n5. Select appropriate program level\n6. Sign membership or lease agreement',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'bacn-boutique': {
    name: 'Bay Area Crisis Nursery - BACN Boutique',
    description:
      'BACN Boutique provides free clothing, shoes, and essential items for families in need, operating as a community resource center within Bay Area Crisis Nursery.',
    what_they_offer:
      '- Free clothing for all family members\n- Free shoes and accessories\n- Books and toys\n- Baby equipment\n- Maternity items\n- Parent clothing and supplies',
    how_to_get_it:
      '1. Visit BACN Boutique during hours\n2. No appointment necessary\n3. Browse available items\n4. Select needed items for family\n5. Take items home at no cost\n6. Return for future needs',
    timeframe: 'Ongoing',
    link_text: 'Visit',
  },
  'bacn-food-pantry-diaper': {
    name: 'Bay Area Crisis Nursery - Food Pantry & Diaper Bank',
    description:
      'Bay Area Crisis Nursery operates a food pantry and diaper bank providing free groceries and diapers to families with young children in Contra Costa County.',
    what_they_offer:
      '- Free food assistance\n- Free diapers for babies and toddlers\n- Online ordering available\n- Regular distribution schedule\n- Essential items for families\n- No-cost support for families in need',
    how_to_get_it:
      '1. Visit website to order online\n2. Or call to request assistance\n3. Provide family information\n4. Select needed items\n5. Schedule pickup time\n6. Pick up at Concord location',
    timeframe: 'Ongoing',
    link_text: 'Order Online',
  },
  'sf-diaper-bank': {
    name: 'San Francisco Diaper Bank',
    description:
      'The San Francisco Diaper Bank provides free diapers to low-income families enrolled in public assistance programs, helping reduce the financial burden of essential baby supplies.',
    what_they_offer:
      '- Free diapers for eligible families\n- For children under age two\n- Up to two cases per child/month\n- Available to CalFresh recipients\n- Available to Medi-Cal recipients\n- Available to CalWORKs households',
    how_to_get_it:
      '1. Must be enrolled in CalFresh, Medi-Cal, or CalWORKs\n2. Child must be under age two\n3. Enroll through SFHSA website\n4. Provide proof of benefit enrollment\n5. Select diaper size and pickup location\n6. Pick up monthly allotment',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'st-anthonys-clothing': {
    name: "St. Anthony's Free Clothing Program",
    description:
      "St. Anthony's Free Clothing Program is San Francisco's largest free clothing resource, providing dignity and essential clothing to over 3,000 people monthly regardless of income or circumstances.",
    what_they_offer:
      "- Free clothing for all ages\n- Men's, women's, and children's clothing\n- Shoes and accessories\n- Seasonal and professional attire\n- Serves 3,000+ people monthly\n- No income verification required",
    how_to_get_it:
      '1. Schedule visit through website\n2. Or visit during walk-in hours\n3. Check in at reception\n4. Shop for needed items\n5. Select up to 5 items per visit\n6. Return monthly as needed',
    timeframe: 'Ongoing',
    link_text: 'Schedule Visit',
  },
  'california-grants-portal': {
    name: 'California Grants Portal',
    description:
      'The California Grants Portal is a centralized, free searchable database of all state grant opportunities, helping nonprofits and community organizations find and apply for funding.',
    what_they_offer:
      '- Free searchable grant database\n- All California state grants listed\n- Filter by category and deadline\n- Filter by eligibility requirements\n- Application information included\n- Email alerts for new grants',
    how_to_get_it:
      '1. Visit grants.ca.gov\n2. Create free account (optional)\n3. Search grants by keyword or category\n4. Filter by deadline and eligibility\n5. Review grant requirements\n6. Apply directly through portal links',
    timeframe: 'Ongoing',
    link_text: 'Search Grants',
  },
  'lifemoves-services': {
    name: 'LifeMoves Opportunity Services Center',
    description:
      'LifeMoves provides comprehensive services to help individuals and families experiencing homelessness transition to stable housing through shelter, case management, and supportive programs.',
    what_they_offer:
      '- Emergency interim shelter\n- Food and meal services\n- Clothing assistance\n- Intensive case management\n- Employment assistance\n- Specialized veteran support programs',
    how_to_get_it:
      '1. Call LifeMoves hotline\n2. Complete intake assessment\n3. Meet with case manager\n4. Develop housing stability plan\n5. Access shelter and services\n6. Work toward permanent housing',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'haven-family-house': {
    name: 'Haven Family House (LifeMoves)',
    description:
      'Haven Family House is a LifeMoves interim housing facility in Menlo Park providing shelter and comprehensive services for families experiencing homelessness, with dedicated capacity for veteran families.',
    what_they_offer:
      '- Interim shelter for 23 families\n- Dedicated veteran family capacity (9 families)\n- Supportive services included\n- Case management\n- Housing placement assistance\n- Family-focused environment',
    how_to_get_it:
      '1. Contact LifeMoves for referral\n2. Complete intake assessment\n3. Demonstrate family homelessness\n4. Veterans receive priority placement\n5. Accept shelter placement if available\n6. Work with case manager on housing plan',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'friendly-voices-seniors': {
    name: 'Friendly Voices Phone Buddies for Seniors',
    description:
      'Friendly Voices connects isolated and homebound seniors with trained volunteer phone buddies for weekly friendly conversations, reducing loneliness and providing social connection.',
    what_they_offer:
      '- Weekly volunteer phone calls\n- Supportive listening\n- Complete confidentiality\n- Consistent phone buddy match\n- Reduces isolation and loneliness\n- Free service for seniors 60+',
    how_to_get_it:
      '1. Visit Friendly Voices website\n2. Sign up as a senior participant\n3. Complete brief intake form\n4. Get matched with volunteer buddy\n5. Receive weekly phone calls\n6. Build ongoing friendship',
    timeframe: 'Ongoing',
    link_text: 'Sign Up',
  },
  'smc-fixit-clinics': {
    name: 'Fixit Clinics',
    description:
      "San Mateo County's Fixit Clinics are free community repair events where volunteer coaches help residents fix broken items, reducing waste and saving money on replacements.",
    what_they_offer:
      '- Free repair assistance\n- Electronics repair help\n- Appliance troubleshooting\n- Computer and device fixes\n- Toy and small item repair\n- Sewing machine and textile mending',
    how_to_get_it:
      '1. Check event schedule online\n2. Find Fixit Clinic near you\n3. Bring broken items to event\n4. Work with volunteer coach\n5. Learn repair skills\n6. Take fixed items home',
    timeframe: 'Ongoing (check schedule)',
    link_text: 'Find Events',
  },
  'smc-library-sewing': {
    name: 'San Mateo County Library Open Sewing Programs',
    description:
      'San Mateo County Libraries offer free open sewing and mending programs at multiple branches, helping residents repair clothing and learn sewing skills.',
    what_they_offer:
      '- Free sewing and mending programs\n- Available at multiple library branches\n- Foster City, Half Moon Bay locations\n- Millbrae, Redwood City branches\n- San Mateo, South San Francisco\n- Equipment and supplies provided',
    how_to_get_it:
      '1. Check library schedule online\n2. Find sewing program near you\n3. Bring items needing repair\n4. Attend during program hours\n5. Get help from volunteers\n6. Learn sewing skills',
    timeframe: 'Ongoing (varies by location)',
    link_text: 'Find Schedule',
  },
  recyclestuff: {
    name: 'Recyclestuff.org',
    description:
      'Recyclestuff.org is a free online search tool helping San Mateo County residents find the right place to recycle, donate, or properly dispose of household items.',
    what_they_offer:
      '- Free online search engine\n- Find donation locations\n- Find recycling centers\n- Household item disposal info\n- Electronics recycling locations\n- Clothing and textile options',
    how_to_get_it:
      '1. Visit recyclestuff.org\n2. Enter item you want to dispose of\n3. Enter your zip code\n4. View nearby options\n5. Choose appropriate location\n6. Drop off or schedule pickup',
    timeframe: 'Ongoing',
    link_text: 'Search',
  },
  'acs-discovery-shop-oakland': {
    name: 'American Cancer Society: Discovery Shop (Oakland)',
    description:
      'The American Cancer Society Discovery Shop in Oakland is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 127 41st St, Oakland\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sun 10am-5pm\n5. All purchases benefit ACS programs',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-napa': {
    name: 'American Cancer Society: Discovery Shop (Napa)',
    description:
      'The American Cancer Society Discovery Shop in Napa is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 1380 Trancas St, Napa\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 10am-5pm\n5. Call (707) 224-4398 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-novato': {
    name: 'American Cancer Society: Discovery Shop (Novato)',
    description:
      'The American Cancer Society Discovery Shop in Novato is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 930 Diablo Ave, Novato\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 10am-5pm\n5. Call (415) 408-5722 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-pleasanton': {
    name: 'American Cancer Society: Discovery Shop (Pleasanton)',
    description:
      'The American Cancer Society Discovery Shop in Pleasanton has two locations in the same shopping center, selling quality secondhand and vintage items with proceeds supporting cancer research.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit either location at Santa Rita Rd, Pleasanton\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sun 10am-6pm\n5. Call (925) 462-7374 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-walnut-creek': {
    name: 'American Cancer Society: Discovery Shop (Walnut Creek)',
    description:
      'The American Cancer Society Discovery Shop in Walnut Creek is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 1538 Locust St, Walnut Creek\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 10am-5pm\n5. Call (925) 944-1991 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-san-jose': {
    name: 'American Cancer Society: Discovery Shop (San Jose)',
    description:
      'The American Cancer Society Discovery Shop in San Jose is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 1103 Branham Ln, San Jose\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Check website for hours\n5. All purchases benefit ACS programs',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-los-gatos': {
    name: 'American Cancer Society: Discovery Shop (Los Gatos)',
    description:
      'The American Cancer Society Discovery Shop in Los Gatos is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 150 W Main St, Los Gatos\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 9am-4pm\n5. Call (408) 354-5917 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-sunnyvale': {
    name: 'American Cancer Society: Discovery Shop (Sunnyvale)',
    description:
      'The American Cancer Society Discovery Shop in Sunnyvale is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 1659 Hollenbeck Ave, Sunnyvale\n2. Donate gently used items (Tue-Sat 11:30am-3pm)\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 10am-5pm\n5. Call (408) 737-7707 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-pacific-grove': {
    name: 'American Cancer Society: Discovery Shop (Pacific Grove)',
    description:
      'The American Cancer Society Discovery Shop in Pacific Grove is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 198 Country Club Gate, Pacific Grove\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open daily 10am-5pm\n5. Call (831) 372-0866 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'acs-discovery-shop-salinas': {
    name: 'American Cancer Society: Discovery Shop (Salinas)',
    description:
      'The American Cancer Society Discovery Shop in Salinas is a thrift store selling quality secondhand and vintage items, with proceeds supporting cancer research and patient programs.',
    what_they_offer:
      '- Accept clothing donations\n- Accept accessories and housewares\n- Accept linens and furniture\n- Accept collectibles and vintage items\n- Affordable thrift shopping\n- Proceeds fund cancer research',
    how_to_get_it:
      '1. Visit the Discovery Shop at 1534 N Main St, Salinas\n2. Donate gently used items\n3. Or shop for affordable goods\n4. Open Mon-Sat 10am-6pm, Sun 11am-6pm\n5. Call (831) 443-8879 for info',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'ehp-donations': {
    name: 'Ecumenical Hunger Program Donations',
    description:
      'The Ecumenical Hunger Program accepts donations of household items and clothing to support their services for low-income families in East Palo Alto and surrounding communities.',
    what_they_offer:
      '- Accept clothing donations\n- Accept housewares and furniture\n- Accept small appliances\n- Pickup available for large items\n- Serves East Palo Alto area\n- Supports community food programs',
    how_to_get_it:
      '1. Visit EHP donation center\n2. Bring gently used items\n3. Schedule pickup for large items\n4. Donations support local families\n5. Check accepted items list\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'family-connections-donations': {
    name: 'Family Connections Donations',
    description:
      'Family Connections accepts donations of baby and child-related items to support their programs serving families with young children in San Mateo County.',
    what_they_offer:
      "- Accept baby item donations\n- Accept strollers and car seats\n- Accept toys and books\n- Accept children's clothing\n- Serves families with young children\n- Items distributed to families in need",
    how_to_get_it:
      '1. Check accepted items list\n2. Gather baby/child items to donate\n3. Contact Family Connections\n4. Drop off at donation location\n5. Items go to families in need\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'goodwill-sf-sm-marin': {
    name: 'Goodwill Industries (SF, San Mateo, Marin)',
    description:
      'Goodwill Industries operates thrift stores and donation centers throughout the Bay Area, with proceeds funding job training and employment programs for people facing barriers.',
    what_they_offer:
      '- Accept clothing donations\n- Accept electronics and furniture\n- Accept housewares and books\n- Accept sporting goods\n- Multiple donation centers\n- Proceeds fund job training',
    how_to_get_it:
      '1. Find nearest donation center\n2. Bring gently used items\n3. Drop off during open hours\n4. Or shop thrift stores\n5. Support job training programs\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'latino-commission-donations': {
    name: 'Latino Commission Donations',
    description:
      'The Latino Commission accepts donations of household items and clothing to support their alcohol and drug recovery programs serving the community.',
    what_they_offer:
      '- Accept clothing and shoes\n- Accept housewares\n- Accept small furniture\n- Accept small electronics\n- Supports recovery services\n- Items help program participants',
    how_to_get_it:
      '1. Contact Latino Commission\n2. Check accepted items list\n3. Bring donations to location\n4. Items support recovery programs\n5. Help community members in need\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'nine-lives-foundation': {
    name: 'Nine Lives Foundation',
    description:
      'Nine Lives Foundation accepts donations of pet supplies and cat-related items to support their cat rescue, rehabilitation, and adoption programs in San Mateo County.',
    what_they_offer:
      '- Accept pet supply donations\n- Accept bedding and blankets\n- Accept cat-related items\n- Support cat rescue programs\n- Support adoption services\n- Items help rescued cats',
    how_to_get_it:
      '1. Check donation wish list\n2. Gather cat supplies to donate\n3. Drop off at shelter location\n4. Or arrange delivery\n5. Support rescued cats\n6. Consider adopting a cat',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'parca-thrift-shop': {
    name: 'PARCA Thrift Shop',
    description:
      'PARCA Thrift Shop accepts donations and operates a thrift store with proceeds supporting programs for adults with developmental disabilities in San Mateo County.',
    what_they_offer:
      '- Accept clothing donations\n- Accept housewares and furniture\n- Accept collectibles\n- Pickup available for large items\n- Affordable thrift shopping\n- Proceeds support adults with disabilities',
    how_to_get_it:
      '1. Visit PARCA Thrift Shop\n2. Donate gently used items\n3. Schedule pickup for large items\n4. Or shop for affordable goods\n5. Support disability programs\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'peninsula-humane-society-donations': {
    name: 'Peninsula Humane Society & SPCA Donations',
    description:
      'Peninsula Humane Society & SPCA accepts donations of pet supplies and household goods to support their animal rescue, care, and adoption programs in San Mateo County.',
    what_they_offer:
      '- Accept pet supply donations\n- Accept animal care items\n- Accept household goods for resale\n- Proceeds support animal rescue\n- Support adoption programs\n- Items help sheltered animals',
    how_to_get_it:
      '1. Check donation wish list\n2. Gather pet supplies or goods\n3. Drop off at shelter location\n4. Or visit thrift store\n5. Support animal welfare\n6. Consider adopting a pet',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'pick-of-the-litter': {
    name: 'Pick of the Litter Books',
    description:
      'Pick of the Litter Books is a used bookstore accepting book donations with all proceeds supporting Peninsula Humane Society & SPCA animal welfare programs.',
    what_they_offer:
      '- Accept used book donations\n- Accept CDs and DVDs\n- Accept vinyl records\n- Affordable used book shopping\n- Proceeds support animal welfare\n- Benefits PHS-SPCA programs',
    how_to_get_it:
      '1. Gather books, CDs, DVDs, or records\n2. Visit Pick of the Litter store\n3. Donate during store hours\n4. Or shop for affordable books\n5. Support animal rescue programs\n6. Find great reading deals',
    timeframe: 'Ongoing',
    link_text: 'Donate Books',
  },
  'puente-de-la-costa-sur': {
    name: 'Puente de la Costa Sur',
    description:
      'Puente de la Costa Sur accepts donations of household items and building materials to support their programs serving rural South Coast San Mateo County communities.',
    what_they_offer:
      '- Accept clothing donations\n- Accept housewares and furniture\n- Accept building materials\n- Pickup available for large items\n- Serves South Coast communities\n- Support rural families in need',
    how_to_get_it:
      '1. Contact Puente de la Costa Sur\n2. Check accepted items list\n3. Bring donations to location\n4. Schedule pickup for large items\n5. Support South Coast families\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'st-francis-center-rw': {
    name: 'St. Francis Center (Redwood City)',
    description:
      'St. Francis Center in Redwood City accepts donations of clothing and household items to support their programs serving low-income families in the Redwood City area.',
    what_they_offer:
      '- Accept clothing and shoes\n- Accept bedding and housewares\n- Accept furniture and appliances\n- Pickup available for large items\n- Serves Redwood City families\n- Items distributed to those in need',
    how_to_get_it:
      '1. Visit St. Francis Center\n2. Bring gently used items\n3. Schedule pickup for large items\n4. Donations help local families\n5. Check hours before visiting\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'st-vincent-de-paul-smc': {
    name: 'St. Vincent de Paul Society (San Mateo County)',
    description:
      'St. Vincent de Paul Society operates thrift stores and accepts donations throughout San Mateo County, with proceeds supporting homeless services and low-income assistance programs.',
    what_they_offer:
      '- Accept clothing and furniture\n- Accept housewares and appliances\n- Pickup available for large items\n- Multiple thrift store locations\n- Affordable shopping\n- Proceeds support homeless services',
    how_to_get_it:
      '1. Find nearest SVdP location\n2. Donate gently used items\n3. Schedule pickup for large items\n4. Or shop at thrift stores\n5. Support homeless assistance\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Schedule Pickup',
  },
  'samaritan-house-donations': {
    name: 'Samaritan House Thrift Stores',
    description:
      'Samaritan House operates thrift stores throughout San Mateo County, with proceeds supporting their free food, health, and housing programs for low-income residents.',
    what_they_offer:
      '- Accept clothing donations\n- Accept housewares and furniture\n- Accept electronics\n- Accept sporting goods\n- Affordable thrift shopping\n- Proceeds support community programs',
    how_to_get_it:
      '1. Find nearest Samaritan House location\n2. Donate gently used items\n3. Or shop at thrift stores\n4. Support food and housing programs\n5. Check hours before visiting\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'savers-thrift': {
    name: 'Savers Thrift Stores',
    description:
      'Savers is a for-profit thrift store chain that partners with local nonprofits, paying them for donated goods based on donation volume.',
    what_they_offer:
      '- Accept clothing donations\n- Accept housewares and books\n- Accept household items\n- Partners with local nonprofits\n- Nonprofits receive funds per donation\n- Affordable thrift shopping',
    how_to_get_it:
      '1. Find nearest Savers location\n2. Bring gently used items\n3. Donate during store hours\n4. Local nonprofit receives payment\n5. Or shop for affordable goods\n6. Support community organizations',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'south-coast-childrens': {
    name: "South Coast Children's Services",
    description:
      "South Coast Children's Services accepts donations of children's items to support their programs serving families with children on San Mateo County's South Coast.",
    what_they_offer:
      "- Accept children's item donations\n- Accept toys and books\n- Accept children's clothing\n- Serves South Coast families\n- Items go to children in need\n- Support family programs",
    how_to_get_it:
      "1. Contact South Coast Children's Services\n2. Check accepted items list\n3. Bring children's items to donate\n4. Items distributed to local families\n5. Support South Coast programs\n6. Get donation receipt",
    timeframe: 'Ongoing',
    link_text: 'Donate',
  },
  'salvation-army-smc': {
    name: 'The Salvation Army (San Mateo County)',
    description:
      'The Salvation Army operates thrift stores and accepts donations throughout San Mateo County, with proceeds funding their social services, emergency assistance, and community programs.',
    what_they_offer:
      '- Accept clothing and furniture\n- Accept housewares and electronics\n- Accept appliances\n- Free pickup for large items\n- Multiple thrift store locations\n- Proceeds fund social services',
    how_to_get_it:
      '1. Find nearest Salvation Army location\n2. Donate gently used items\n3. Schedule free pickup for large items\n4. Or shop at thrift stores\n5. Support community programs\n6. Get donation receipt',
    timeframe: 'Ongoing',
    link_text: 'Schedule Pickup',
  },
  'ucpa-golden-gate': {
    name: 'United Cerebral Palsy Association of the Golden Gate',
    description:
      'United Cerebral Palsy Association of the Golden Gate accepts donations of household items and vehicles, with proceeds supporting services for people with developmental disabilities.',
    what_they_offer:
      '- Accept clothing and housewares\n- Accept furniture and electronics\n- Accept vehicle donations\n- Free pickup available\n- Proceeds support disability services\n- Items help Bay Area residents',
    how_to_get_it:
      '1. Contact UCPA Golden Gate\n2. Schedule free pickup\n3. Donate household items or vehicles\n4. Pickup arranged at your convenience\n5. Support disability programs\n6. Get donation receipt for taxes',
    timeframe: 'Ongoing',
    link_text: 'Schedule Pickup',
  },
  'exploratorium-teacher-free': {
    name: 'Exploratorium Free Teacher Admission',
    description:
      'The Exploratorium offers free admission to K-12 teachers, allowing educators to explore exhibits and develop ideas for classroom activities.',
    what_they_offer:
      '- Free general admission for K-12 teachers\n- Access to all museum exhibits\n- Teacher professional development programs\n- Free After Dark admission (Thursdays)\n- Curriculum resources and ideas',
    how_to_get_it:
      '1. Visit the Exploratorium with valid teacher ID\n2. Show school-issued ID or pay stub\n3. Register at admissions desk\n4. Receive free entry to museum\n5. Access available year-round',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'bay-area-writing-project': {
    name: 'Bay Area Writing Project',
    description:
      'The Bay Area Writing Project at UC Berkeley provides professional development programs for teachers, helping educators improve writing instruction and student outcomes.',
    what_they_offer:
      '- Summer Invitational Institute (4-week program)\n- Yearlong professional development\n- Teacher leadership development\n- Writing workshops and coaching\n- Classroom-tested strategies\n- Community of teacher-writers',
    how_to_get_it:
      '1. Visit BAWP website for program information\n2. Apply for Summer Invitational Institute or other programs\n3. Describe your teaching context and goals\n4. Attend program sessions\n5. Join network of teacher-consultants',
    timeframe: 'Applications in spring',
    link_text: 'Apply Now',
  },
  'sf-hsh': {
    name: 'SF Homelessness and Supportive Housing',
    description:
      "San Francisco's Department of Homelessness and Supportive Housing (HSH) coordinates the city's response to homelessness, providing shelter, housing, and supportive services.",
    what_they_offer:
      '- Emergency shelter access\n- Navigation centers with services\n- Permanent supportive housing\n- Rapid rehousing assistance\n- Street outreach teams\n- Connection to services',
    how_to_get_it:
      '1. Call SF Homeless Outreach Team at 415-734-4233\n2. Or call 311 for shelter information\n3. Connect with street outreach if unsheltered\n4. Complete intake at navigation center\n5. Receive housing and service referrals',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'family-caregiver-alliance': {
    name: 'Family Caregiver Alliance / Bay Area Caregiver Resource Center',
    description:
      'Family Caregiver Alliance operates the Bay Area Caregiver Resource Center, providing support, education, and services to family caregivers of adults with chronic or disabling conditions.',
    what_they_offer:
      '- Free caregiver support groups\n- Respite care grants\n- Individual caregiver coaching\n- Educational workshops\n- Legal and financial consultations\n- Care planning assistance\n- Short-term counseling',
    how_to_get_it:
      '1. Call Family Caregiver Alliance\n2. Complete intake assessment\n3. Meet with care consultant\n4. Develop personalized care plan\n5. Access respite grants and services',
    timeframe: 'Ongoing',
    link_text: 'Get Support',
  },
  ihss: {
    name: 'In-Home Supportive Services (IHSS)',
    description:
      "In-Home Supportive Services (IHSS) is California's program that pays family members or others to provide in-home care for aged, blind, or disabled individuals who qualify for Medi-Cal.",
    what_they_offer:
      '- Paid caregiving by family members\n- Personal care assistance\n- Housekeeping and meal preparation\n- Medical accompaniment\n- Protective supervision\n- Respite for family caregivers',
    how_to_get_it:
      '1. Apply through county social services\n2. Must be on Medi-Cal\n3. Home assessment conducted\n4. Care hours determined by needs\n5. Choose caregiver (can be family member)\n6. Caregiver receives hourly payment',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'beyond-emancipation': {
    name: 'Beyond Emancipation',
    description:
      'Beyond Emancipation helps current and former foster youth in Alameda County transition to successful adulthood through housing, education, employment, and wellness support.',
    what_they_offer:
      '- Housing assistance and placement\n- Education support and tutoring\n- Employment training and job placement\n- Life skills development\n- Mental health services\n- Financial coaching\n- Ongoing case management',
    how_to_get_it:
      '1. Contact Beyond Emancipation\n2. Must be current or former foster youth ages 16-24\n3. Must have connection to Alameda County\n4. Complete intake assessment\n5. Develop personalized success plan\n6. Access comprehensive services',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'first-place-for-youth': {
    name: 'First Place for Youth',
    description:
      'First Place for Youth helps foster youth ages 18-24 build the skills they need to successfully transition to adulthood through housing, education, and employment programs.',
    what_they_offer:
      '- Transitional housing placement\n- Education coaching and support\n- Employment training and placement\n- Life skills workshops\n- Financial literacy education\n- Mental health resources\n- Long-term case management',
    how_to_get_it:
      '1. Contact First Place for Youth\n2. Must be current or former foster youth ages 18-24\n3. Complete application and interview\n4. Participate in intake assessment\n5. Access housing and comprehensive services',
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  'chafee-grant': {
    name: 'Chafee Grant for Foster Youth',
    description:
      'The Chafee Grant provides up to $5,000 per year for current and former foster youth to pay for career and technical training or college expenses.',
    what_they_offer:
      '- Up to $5,000 per academic year\n- Covers tuition, fees, books, supplies\n- Can cover living expenses\n- Available through age 26\n- For vocational training or college\n- Does not have to be repaid',
    how_to_get_it:
      '1. Must be current or former foster youth\n2. Must be age 16-26\n3. Complete FAFSA or CA Dream Act application\n4. Check box for foster youth status\n5. Enroll in eligible school or training program\n6. Grant automatically considered',
    timeframe: 'Academic year',
    link_text: 'Apply Now',
  },
  'sf-casa': {
    name: 'San Francisco CASA',
    description:
      'San Francisco Court Appointed Special Advocates (CASA) trains volunteers to advocate for children and youth in the foster care system, ensuring their voices are heard in court.',
    what_they_offer:
      "- Trained volunteer advocates for foster youth\n- Court advocacy and monitoring\n- Educational advocacy\n- Connection to services and resources\n- Consistent supportive adult relationship\n- Voice for child's best interests",
    how_to_get_it:
      '1. Foster youth referred by court or social worker\n2. CASA volunteer assigned to case\n3. Advocate meets regularly with child\n4. Advocate reports to court\n5. Support continues through case',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'national-hotline-safety': {
    name: 'National Safety Hotline',
    description:
      'The National Safety Hotline provides free, confidential support 24/7 for individuals and families experiencing unsafe situations at home. Trained advocates offer crisis intervention, safety planning, and connections to local resources.',
    what_they_offer:
      '- 24/7 phone support (1-800-799-7233)\n- Text support (text START to 88788)\n- Online chat available\n- Safety planning assistance\n- Local resource referrals\n- Support in 200+ languages\n- TTY line for deaf/hard of hearing',
    how_to_get_it:
      '1. Call 1-800-799-7233 anytime\n2. Or text START to 88788\n3. Or chat online at thehotline.org\n4. Trained advocates available 24/7\n5. Completely confidential\n6. No judgment, just support',
    timeframe: '24/7',
    link_text: 'Get Support',
  },
  'ywca-silicon-valley': {
    name: 'YWCA Silicon Valley',
    description:
      'YWCA Silicon Valley provides support services including emergency shelter, transitional housing, counseling, and advocacy for individuals and families in Santa Clara County.',
    what_they_offer:
      "- Emergency shelter\n- Transitional housing\n- Counseling services\n- Legal advocacy\n- Support groups\n- Children's programs\n- Economic empowerment\n- Community education",
    how_to_get_it:
      '1. Call San Jose: 408-295-4011\n2. Or Sunnyvale: 408-749-0793\n3. Speak with intake coordinator\n4. Complete assessment\n5. Access shelter and services\n6. Receive ongoing support',
    timeframe: 'Ongoing',
    link_text: 'Get Support',
  },
  'headspace-teachers-free': {
    name: 'Headspace for Educators',
    description:
      'Headspace offers free access to K-12 teachers in the US, providing meditation, sleep, and mindfulness exercises to support educator well-being.',
    what_they_offer:
      '- Free Headspace subscription for K-12 teachers\n- Guided meditations\n- Sleep sounds and exercises\n- Stress and anxiety tools\n- Focus music and exercises\n- Normally $69.99/year value',
    how_to_get_it:
      '1. Visit headspace.com/educators\n2. Verify K-12 teacher status through SheerID\n3. Create free Headspace account\n4. Access full premium content\n5. Must be actively employed K-12 educator in US',
    timeframe: 'Ongoing',
    link_text: 'Get Free Access',
  },
  'calvet-college-fee-waiver': {
    name: 'CalVet College Fee Waiver',
    description:
      'The CalVet College Fee Waiver waives enrollment fees and tuition at California public universities (UC, CSU, and Community Colleges) for eligible dependents of disabled or deceased veterans.',
    what_they_offer:
      '- Full waiver of enrollment fees at UC, CSU, and Community Colleges\n- Full waiver of state tuition at public universities\n- Covers undergraduate and graduate programs\n- No limit on number of eligible dependents per veteran\n- Renewable each academic year\n- Includes children, spouses, and registered domestic partners',
    how_to_get_it:
      '1. Veteran must have service-connected disability rating of 0% or higher\n2. Or veteran must have died of service-connected cause\n3. Or veteran must have died during active duty\n4. Dependent submits application through CalVet\n5. Provide DD214, disability rating letter, and proof of relationship\n6. Submit fee waiver certification to school financial aid office',
    timeframe: 'Academic year (renewable)',
    link_text: 'Apply Now',
  },
  'act-fee-waivers': {
    name: 'ACT Fee Waivers',
    description:
      'The ACT offers fee waivers for students from low-income families, removing financial barriers to college entrance testing.',
    what_they_offer:
      '- Two free ACT tests (with or without writing)\n- Free access to official ACT Self-Paced Course (Kaplan prep)\n- Send scores to up to 20 colleges for free\n- Ability to request college application fee waivers\n- Waived fees for late registration, standby testing, and test date changes',
    how_to_get_it:
      '1. Must be in 11th or 12th grade\n2. Must meet income eligibility guidelines\n3. Talk to your high school counselor about eligibility\n4. Counselor will provide fee waiver form\n5. Use fee waiver code when registering for ACT\n6. Present fee waiver at test center',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'ap-exam-fee-reductions': {
    name: 'AP Exam Fee Reductions',
    description:
      'The College Board offers significant fee reductions on AP (Advanced Placement) exams for students with demonstrated financial need.',
    what_they_offer:
      '- $37 College Board fee reduction per AP exam\n- Schools forgo $9 rebate, adding to the reduction\n- Final cost typically $53-62 per exam (down from $99)\n- Some California districts provide additional funding\n- Some students pay $0 for exams in participating districts',
    how_to_get_it:
      '1. Must demonstrate financial need (qualify for free/reduced lunch, etc.)\n2. Talk to your AP teacher or school counselor\n3. School will verify eligibility\n4. Fee reduction automatically applied at registration\n5. Pay reduced fee by deadline',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'california-college-promise-grant': {
    name: 'California College Promise Grant (CCPG)',
    description:
      'The California College Promise Grant (formerly BOG Fee Waiver) waives enrollment fees at all 116 California Community Colleges for eligible students.',
    what_they_offer:
      '- Waiver of enrollment fees ($46 per unit)\n- Covers entire academic year\n- Valid at all California Community Colleges\n- May qualify for additional financial aid\n- No limit on number of units covered',
    how_to_get_it:
      '1. Complete the FAFSA or California Dream Act Application\n2. Apply through CCCApply when enrolling in a community college\n3. Qualify based on income, receiving public benefits (CalFresh, TANF, etc.), or other criteria\n4. Grant automatically applied to your enrollment fees\n5. Renew each academic year',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'common-app-fee-waiver': {
    name: 'Common App Fee Waiver',
    description:
      'The Common Application offers fee waivers that eliminate college application fees at over 900 participating colleges for students with financial need.',
    what_they_offer:
      '- Waived application fees at participating colleges\n- Valid at over 900 Common App member schools\n- No limit on number of colleges\n- Covers the full application fee (typically $50-90)\n- Accepted at most selective colleges and universities',
    how_to_get_it:
      '1. Create a Common App account\n2. Complete the Profile section\n3. Answer the fee waiver questions in the Profile\n4. If eligible, fee waiver automatically applied\n5. Can also obtain fee waiver through school counselor\n6. Fee waiver travels with you to all Common App colleges',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sat-fee-waivers': {
    name: 'SAT Fee Waivers',
    description:
      'The College Board offers SAT fee waivers for low-income 11th and 12th grade students, covering test fees and providing additional benefits.',
    what_they_offer:
      '- Two free SAT tests (with or without Essay)\n- Unlimited score reports to colleges\n- Waived college application fees at many participating schools\n- Free CSS Profile for financial aid applications\n- Waived fees for late registration, standby testing, and changes\n- Access to Khan Academy Official SAT Practice (free for all)',
    how_to_get_it:
      '1. Must be in 11th or 12th grade\n2. Must meet income eligibility guidelines (similar to free/reduced lunch)\n3. Request fee waiver from your school counselor\n4. Counselor provides fee waiver card/code\n5. Use when registering for SAT online\n6. Present at test center if requested',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cal-grant': {
    name: 'Cal Grant',
    description:
      'Cal Grants are free money from the state of California to help eligible students pay for college tuition and fees at California colleges and universities.',
    what_they_offer:
      '- Cal Grant A: Covers tuition/fees at UC, CSU, or private colleges (up to $12,570)\n- Cal Grant B: Living allowance plus tuition for low-income students\n- Cal Grant C: Vocational/career technical training funding\n- Renewable for up to 4 years\n- No repayment required (not a loan)',
    how_to_get_it:
      '1. Complete FAFSA or California Dream Act Application by March 2 deadline\n2. Submit verified GPA to California Student Aid Commission\n3. Must be California resident for at least 1 year\n4. Must attend eligible California college\n5. Must meet income and asset requirements\n6. Must maintain satisfactory academic progress',
    timeframe: 'Annual (apply by March 2)',
    link_text: 'Apply Now',
  },
  'fafsa-help': {
    name: 'Free FAFSA Help',
    description:
      'Free help completing the FAFSA (Free Application for Federal Student Aid) is available through California Cash for College workshops and other programs.',
    what_they_offer:
      '- Free in-person FAFSA completion workshops\n- Help with California Dream Act Application\n- One-on-one assistance with financial aid forms\n- Virtual and in-person options available\n- Bilingual assistance in many locations\n- Help understanding financial aid awards',
    how_to_get_it:
      '1. Find a Cash for College workshop near you\n2. Bring required documents (tax returns, Social Security numbers, etc.)\n3. Work with trained volunteers to complete FAFSA\n4. Get help understanding next steps\n5. Workshops held at schools, libraries, and community centers',
    timeframe: 'October - March (FAFSA opens October 1)',
    link_text: 'Find a Workshop',
  },
  'pell-grant': {
    name: 'Federal Pell Grant',
    description:
      'The Federal Pell Grant provides free money for college to undergraduate students with financial need. Unlike loans, Pell Grants do not need to be repaid.',
    what_they_offer:
      '- Up to $7,395 per year (2024-2025)\n- Free money - no repayment required\n- Can be used for tuition, fees, books, and living expenses\n- Available at most colleges and universities\n- Can be combined with other financial aid',
    how_to_get_it:
      '1. Complete the FAFSA at studentaid.gov\n2. Must demonstrate financial need (based on EFC)\n3. Must be pursuing undergraduate degree\n4. Must be enrolled at least half-time\n5. Must be U.S. citizen or eligible noncitizen\n6. Amount depends on financial need, cost of attendance, and enrollment status',
    timeframe: 'Annual (renew FAFSA each year)',
    link_text: 'Learn More',
  },
  'head-start-bay-area': {
    name: 'Head Start / Early Head Start',
    description:
      'Head Start provides free early childhood education, health, nutrition, and family support services to children from low-income families from birth to age 5.',
    what_they_offer:
      '- Free preschool education for children 3-5 years\n- Early Head Start for infants and toddlers (0-3)\n- Health and developmental screenings\n- Nutritious meals and snacks\n- Parent engagement and family support services\n- Disability services and inclusion support\n- Full-day and part-day options available',
    how_to_get_it:
      '1. Income must be at or below federal poverty guidelines\n2. Or child is in foster care, homeless, or receiving public assistance\n3. Contact local Head Start agency to apply\n4. Complete application and provide income documentation\n5. Children are prioritized based on need',
    timeframe: 'School year (applications accepted year-round)',
    link_text: 'Find a Program',
  },
  'ca-state-preschool': {
    name: 'California State Preschool Program (CSPP)',
    description:
      'The California State Preschool Program provides free or low-cost preschool to income-eligible 3 and 4 year olds to prepare them for kindergarten.',
    what_they_offer:
      '- Free preschool for eligible children (ages 3-4)\n- Part-day and full-day programs available\n- Developmentally appropriate curriculum\n- Nutritious meals and snacks\n- Parent involvement opportunities\n- Transition support to kindergarten',
    how_to_get_it:
      '1. Must meet income eligibility (typically below 85% of State Median Income)\n2. Child must be 3 or 4 years old\n3. Programs available at school districts and community organizations\n4. Contact local school district or resource and referral agency\n5. Complete application and income verification',
    timeframe: 'School year',
    link_text: 'Find a Program',
  },
  'adult-school-sf': {
    name: 'San Francisco City College Adult Education',
    description:
      'City College of San Francisco offers free adult education classes including GED preparation, ESL, citizenship, and career training.',
    what_they_offer:
      '- Free GED and high school diploma preparation\n- Free ESL (English as a Second Language) classes\n- U.S. Citizenship preparation\n- Basic skills and literacy\n- Career and technical education\n- Computer literacy classes\n- Multiple locations throughout San Francisco',
    how_to_get_it:
      '1. Visit CCSF website or adult education center\n2. Take placement test if required\n3. Register for classes\n4. Classes are free for California residents\n5. Flexible schedules including evening and weekend options',
    timeframe: 'Ongoing (semester-based)',
    link_text: 'Enroll Now',
  },
  'alameda-adult-school': {
    name: 'Oakland Adult & Career Education',
    description:
      'Oakland Adult & Career Education provides free classes for adults including GED preparation, ESL, high school diploma, and career training.',
    what_they_offer:
      '- Free GED and high school diploma programs\n- ESL (English as a Second Language) at all levels\n- Career technical education\n- Digital literacy and computer classes\n- Citizenship preparation\n- Parent education classes',
    how_to_get_it:
      '1. Visit Oakland Adult & Career Education center\n2. Complete registration and assessment\n3. Enroll in appropriate classes\n4. Classes are free for eligible adults',
    timeframe: 'Ongoing',
    link_text: 'Register Now',
  },
  'smc-adult-education': {
    name: 'San Mateo Adult & Community Education',
    description:
      'San Mateo Adult & Community Education offers free and low-cost classes for adults including ESL, GED preparation, citizenship, and career skills.',
    what_they_offer:
      '- ESL classes at all levels (free)\n- GED and high school equivalency preparation\n- U.S. Citizenship classes\n- Career technical education\n- Computer and digital literacy\n- Parent education',
    how_to_get_it:
      '1. Visit San Mateo Adult School\n2. Complete registration\n3. Take placement test for ESL if needed\n4. Enroll in classes',
    timeframe: 'Ongoing (semester-based)',
    link_text: 'Enroll Now',
  },
  'scusd-adult-education': {
    name: 'San Jose Adult Education',
    description:
      'San Jose Unified School District Adult Education provides free classes for adults including ESL, GED, citizenship, and career training.',
    what_they_offer:
      '- Free ESL classes at all levels\n- GED and high school diploma preparation\n- Citizenship preparation\n- Career and technical education\n- Digital literacy classes\n- Parent education',
    how_to_get_it:
      '1. Visit San Jose Adult Education center\n2. Complete registration\n3. Take placement assessment\n4. Enroll in appropriate classes',
    timeframe: 'Ongoing',
    link_text: 'Register Now',
  },
  'khan-academy': {
    name: 'Khan Academy',
    description:
      'Khan Academy provides free online education with video lessons and practice exercises covering math, science, humanities, SAT prep, and more.',
    what_they_offer:
      '- Free video lessons on thousands of topics\n- Practice exercises with instant feedback\n- Personalized learning dashboard\n- SAT, LSAT, and other test prep (official SAT partnership)\n- K-12 math, science, and humanities\n- AP course preparation\n- College-level courses',
    how_to_get_it:
      '1. Visit khanacademy.org\n2. Create a free account\n3. Start learning at your own pace\n4. Track progress on personalized dashboard\n5. Available on web and mobile apps',
    timeframe: 'Always available',
    link_text: 'Start Learning',
  },
  'free-library-tutoring': {
    name: 'Free Library Tutoring Programs',
    description:
      'Bay Area public libraries offer free tutoring and homework help programs for students of all ages, including online tutoring services available with a library card.',
    what_they_offer:
      '- Free one-on-one tutoring (in-person and online)\n- Homework help in all subjects\n- Reading and literacy support\n- Math tutoring\n- SAT/ACT test prep resources\n- Online tutoring through Brainfuse or Tutor.com (varies by library)',
    how_to_get_it:
      '1. Get a free library card from your local library\n2. Check library website for tutoring programs\n3. Many libraries offer Brainfuse HelpNow or similar online tutoring\n4. In-person tutoring schedules vary by location\n5. Some programs require appointments',
    timeframe: 'Ongoing (varies by library)',
    link_text: 'Find Your Library',
  },
  'trio-upward-bound': {
    name: 'TRIO Upward Bound',
    description:
      'TRIO Upward Bound helps high school students from low-income families and first-generation college students prepare for and succeed in higher education.',
    what_they_offer:
      '- Academic tutoring and instruction\n- College campus visits and exploration\n- SAT/ACT preparation\n- Financial aid and scholarship guidance\n- Summer programs on college campuses\n- Mentoring and personal counseling\n- Help with college applications',
    how_to_get_it:
      '1. Must be in high school (typically 9th-12th grade)\n2. Must be low-income or potential first-generation college student\n3. Programs located at colleges throughout Bay Area\n4. Contact local Upward Bound program to apply\n5. Application typically includes interview and assessment',
    timeframe: 'During school year and summer',
    link_text: 'Find a Program',
  },
  eops: {
    name: 'EOPS/CARE (Extended Opportunity Programs)',
    description:
      'EOPS provides academic and financial support to low-income community college students, while CARE offers additional support to single parents on public assistance.',
    what_they_offer:
      '- Priority registration\n- Book vouchers and supplies\n- Academic counseling\n- Transfer assistance\n- Grant aid (in addition to other financial aid)\n- CARE program: childcare assistance, meal vouchers, additional grants for single parents',
    how_to_get_it:
      '1. Must be enrolled at California Community College\n2. Must meet income eligibility requirements\n3. Must be educationally disadvantaged\n4. Must enroll in at least 12 units\n5. Apply through college EOPS office\n6. CARE: must be single parent receiving CalWORKs/TANF',
    timeframe: 'Ongoing',
    link_text: 'Find Your College',
  },
  'school-meals-program': {
    name: 'Free & Reduced School Meals',
    description:
      'California schools provide free breakfast and lunch to students who qualify based on family income, and many districts now offer universal free meals to all students.',
    what_they_offer:
      '- Free or reduced-price breakfast and lunch\n- Many California districts now offer free meals to ALL students\n- Nutritious meals meeting federal nutrition standards\n- Available during school year\n- Some districts offer summer meal programs',
    how_to_get_it:
      '1. Complete free/reduced meal application through your school\n2. Household income must be at or below 185% of poverty for reduced price\n3. Household income at or below 130% for free meals\n4. Children in CalFresh, CalWORKs, or foster care automatically qualify\n5. Many California districts provide universal free meals regardless of income',
    timeframe: 'School year',
    link_text: 'Apply at Your School',
  },
  'summer-meals': {
    name: 'Summer Meals for Kids',
    description:
      'Free summer meals are available for children and teens 18 and under at schools, parks, libraries, and community sites throughout the Bay Area when school is out.',
    what_they_offer:
      '- Free breakfast and/or lunch\n- No registration required at most sites\n- No income verification\n- Available at parks, libraries, schools, community centers\n- Open to all children 18 and under',
    how_to_get_it:
      '1. Text "FOOD" to 304-304 to find nearby sites\n2. Or call 2-1-1 for summer meal locations\n3. Visit the CA Summer Meal Finder website\n4. Just show up - no paperwork required\n5. Sites operate throughout summer months',
    timeframe: 'Summer months (June-August)',
    link_text: 'Find Sites',
  },
  ymca: {
    name: 'YMCA',
    description:
      'The YMCA provides community programs and facilities focused on youth development, healthy living, and social responsibility, with financial assistance available to ensure access for all.',
    what_they_offer:
      '- Sliding-scale membership rates\n- Fitness facilities and classes\n- Youth sports and programs\n- Childcare and after-school care\n- Swimming lessons and pools\n- Community events and activities',
    how_to_get_it:
      '1. Find your local YMCA\n2. Inquire about membership options\n3. Ask about financial assistance\n4. Complete membership application\n5. Provide income documentation if needed\n6. Receive reduced-rate membership',
    timeframe: 'Ongoing',
    link_text: 'Find Membership',
  },
  'bacn-emergency-childcare': {
    name: 'Bay Area Crisis Nursery - Emergency Childcare',
    description:
      'Bay Area Crisis Nursery provides free emergency childcare for families in crisis, offering a safe, nurturing environment for young children while parents address urgent situations.',
    what_they_offer:
      '- FREE emergency childcare\n- For children birth to age 6\n- Up to 30 days per 6 months\n- Maximum 60 days per year\n- Safe, nurturing environment\n- Helps families during crisis',
    how_to_get_it:
      "1. Call Bay Area Crisis Nursery\n2. Explain your emergency situation\n3. Complete intake process\n4. Provide child's information\n5. Drop off child during operating hours\n6. Access ongoing support as needed",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'california-state-preschool': {
    name: 'California State Preschool Program',
    description:
      'The California State Preschool Program provides free, high-quality preschool education to income-eligible families, preparing children ages 3-5 for kindergarten success.',
    what_they_offer:
      '- Free part-day preschool\n- For children ages 3-5\n- High-quality early education\n- Kindergarten readiness focus\n- Available at multiple locations\n- Includes meals and snacks',
    how_to_get_it:
      '1. Check income eligibility requirements\n2. Find participating preschool providers\n3. Complete application process\n4. Provide income documentation\n5. Submit required paperwork\n6. Enroll child once approved',
    timeframe: 'Ongoing',
    link_text: 'Find Providers',
  },
  'calworks-child-care': {
    name: 'CalWORKs Child Care',
    description:
      'CalWORKs Child Care provides free or subsidized childcare for families receiving CalWORKs benefits, helping parents participate in work or training activities through three progressive stages.',
    what_they_offer:
      '- Free or subsidized child care\n- Stage 1: County-administered (current CalWORKs)\n- Stage 2: Transitional (leaving CalWORKs)\n- Stage 3: Long-term subsidized care\n- Supports work and training\n- Continuous coverage through stages',
    how_to_get_it:
      '1. Must be receiving CalWORKs benefits\n2. Contact your county welfare office\n3. Request child care assistance\n4. Choose approved child care provider\n5. Complete required paperwork\n6. Transition through stages as eligible',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'childrens-council-sf': {
    name: "Children's Council San Francisco",
    description:
      "Children's Council San Francisco helps income-eligible families access subsidized childcare, providing partial or complete coverage of childcare costs through state-funded programs.",
    what_they_offer:
      '- Partial or complete childcare coverage\n- For children ages 0-13\n- State-funded subsidy programs\n- Help finding quality care\n- Ongoing support and resources\n- Multiple program options',
    how_to_get_it:
      "1. Check income eligibility requirements\n2. Contact Children's Council\n3. Complete subsidy application\n4. Provide income documentation\n5. Choose approved childcare provider\n6. Receive ongoing subsidy support",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'choices-for-children': {
    name: 'Choices for Children',
    description:
      'Choices for Children provides subsidized childcare services to income-eligible families in Santa Clara County, helping parents work or attend school while their children receive quality care.',
    what_they_offer:
      '- Subsidized child care services\n- For income-eligible families\n- Multiple childcare options\n- Quality care for children\n- Supports working parents\n- Help with childcare costs',
    how_to_get_it:
      '1. Check income eligibility requirements\n2. Contact Choices for Children\n3. Complete application process\n4. Provide income documentation\n5. Choose approved childcare provider\n6. Receive subsidy based on funding',
    timeframe: 'Ongoing (based on funding availability)',
    link_text: 'Apply',
  },
  'head-start': {
    name: 'Head Start',
    description:
      'Head Start is a federally-funded program providing free, comprehensive early childhood education, health, nutrition, and family support services to low-income children and families.',
    what_they_offer:
      '- Free preschool education\n- For children ages 3-4\n- Comprehensive child development\n- Health and nutrition services\n- Family support programs\n- Special needs support included',
    how_to_get_it:
      '1. Check income eligibility requirements\n2. Find local Head Start program\n3. Complete application process\n4. Provide income and family documentation\n5. Participate in enrollment screening\n6. Enroll child in program',
    timeframe: 'Ongoing',
    link_text: 'Find Programs',
  },
  'a-greener-source': {
    name: 'A Greener Source',
    description:
      'A Greener Source is a nonprofit that diverts office furniture from landfills by donating it to other nonprofits, helping organizations furnish their spaces sustainably and at no cost.',
    what_they_offer:
      '- Free office desks and workstations\n- Chairs (office, conference, guest)\n- Filing cabinets and storage\n- Conference tables\n- Cubicle systems and panels\n- Other office furnishings as available',
    how_to_get_it:
      '1. Visit agreenersource.com and create an account\n2. Register your nonprofit organization\n3. Browse available furniture inventory online\n4. Request items through the website\n5. Schedule pickup or arrange delivery (fees may apply for delivery)',
    timeframe: 'Ongoing',
    link_text: 'Register',
  },
  'alameda-county-property-salvage': {
    name: 'Alameda County Property & Salvage Donations',
    description:
      "Alameda County's General Services Agency donates surplus county property to eligible nonprofit organizations, providing free equipment and supplies that would otherwise be disposed of.",
    what_they_offer:
      '- Surplus office furniture (desks, chairs, tables)\n- Office equipment and electronics\n- General supplies\n- Availability varies based on county surplus\n- Items provided as in-kind donations',
    how_to_get_it:
      '1. Must be a registered 501(c)(3) nonprofit in Alameda County\n2. Contact the Alameda County Property & Salvage division\n3. Complete donation request paperwork\n4. Browse available surplus items\n5. Arrange pickup of approved items',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'building-resources': {
    name: 'Building Resources',
    description:
      'Building Resources is a nonprofit reuse center in San Francisco that sells salvaged and donated building materials at affordable prices, with special programs for nonprofits.',
    what_they_offer:
      '- Salvaged lumber and wood products\n- Doors, windows, and hardware\n- Plumbing and electrical fixtures\n- Kitchen and bathroom cabinets\n- Landscaping materials\n- Paint and finishing supplies',
    how_to_get_it:
      '1. Visit the Building Resources warehouse\n2. Browse available materials\n3. Pay reduced prices (typically 50-90% off retail)\n4. Nonprofits may qualify for additional discounts or donations\n5. Transport materials yourself or arrange delivery',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'california-federal-surplus-program': {
    name: 'California Federal Surplus Property Program',
    description:
      'The California State Agency for Surplus Property administers federal surplus property, making it available to eligible nonprofits at a fraction of original cost.',
    what_they_offer:
      '- Federal surplus furniture and office equipment\n- Vehicles (cars, trucks, vans)\n- Technology and electronics\n- Tools and machinery\n- Medical equipment\n- Items at 0-15% of original acquisition cost',
    how_to_get_it:
      '1. Apply to become a Federal Donee through the California DGS\n2. Complete application with proof of 501(c)(3) status\n3. Pay annual enrollment fee\n4. Once approved, browse available federal surplus\n5. Request items and pay nominal service charges\n6. Arrange pickup or delivery',
    timeframe: 'Ongoing',
    link_text: 'Apply as Donee',
  },
  'city-of-san-jose-surplus': {
    name: 'City of San José Surplus Property Donation Program',
    description:
      'The City of San José donates surplus property valued at $1,500 or less to eligible nonprofit organizations, helping local groups access needed equipment and supplies.',
    what_they_offer:
      '- Surplus office furniture\n- Equipment and electronics\n- Supplies and materials\n- Items valued at $1,500 or less\n- Availability varies based on city surplus',
    how_to_get_it:
      '1. Must be a registered 501(c)(3) nonprofit\n2. Contact the City of San José surplus property office\n3. Submit donation request\n4. Browse available items when notified\n5. Arrange pickup of approved donations',
    timeframe: 'Ongoing - subject to availability',
    link_text: 'Learn More',
  },
  'santa-clara-county-surplus-donations': {
    name: 'Santa Clara County Surplus Property Donation Program',
    description:
      'Santa Clara County donates surplus property to eligible nonprofit organizations, providing free office furniture, equipment, and supplies.',
    what_they_offer:
      '- Surplus office furniture\n- Office equipment\n- General supplies\n- Technology items (when available)\n- Items provided free of charge',
    how_to_get_it:
      '1. Must be a registered 501(c)(3) nonprofit in Santa Clara County\n2. Submit a donation request through the county website\n3. Provide proof of nonprofit status\n4. Wait for approval and notification of available items\n5. Arrange pickup within specified timeframe',
    timeframe: 'Ongoing',
    link_text: 'Request Donation',
  },
  'santa-clara-county-library-surplus': {
    name: 'Santa Clara County Library District Surplus Property Donations',
    description:
      'The Santa Clara County Library District donates surplus library property to nonprofit organizations located within the county.',
    what_they_offer:
      '- Library shelving and display units\n- Furniture (tables, chairs, desks)\n- Library equipment\n- Technology items (when available)\n- Other surplus library property',
    how_to_get_it:
      '1. Must be a registered 501(c)(3) nonprofit in Santa Clara County\n2. Apply through the library district website\n3. Describe your organization and intended use\n4. Wait for notification of available surplus\n5. Arrange pickup of approved items',
    timeframe: 'Ongoing',
    link_text: 'Program Details',
  },
  'sf-virtual-warehouse': {
    name: 'San Francisco Virtual Warehouse',
    description:
      'The San Francisco Virtual Warehouse is a city program that provides free surplus office furniture, supplies, and equipment to nonprofits and public schools.',
    what_they_offer:
      '- Office furniture (desks, chairs, tables)\n- Office supplies\n- Electronics and technology\n- Filing and storage equipment\n- Miscellaneous surplus items\n- All items free of charge',
    how_to_get_it:
      '1. Must be a registered nonprofit or public school\n2. Complete enrollment at SF Environment website\n3. Create an account to access the virtual warehouse\n4. Browse and request available items online\n5. Schedule pickup at designated location',
    timeframe: 'Ongoing',
    link_text: 'Enrollment Instructions',
  },
  'scrap-sf': {
    name: "SCRAP (Scroungers' Center for Re-usable Art Parts)",
    description:
      'SCRAP is a creative reuse nonprofit that collects donated art and craft supplies and makes them available to teachers, artists, and nonprofits at very low cost.',
    what_they_offer:
      '- Fabric and textiles\n- Paper and cardboard products\n- Craft and sewing supplies\n- Art materials (paint, brushes, etc.)\n- Classroom resources\n- Unique and unusual materials',
    how_to_get_it:
      "1. Visit SCRAP's retail store in San Francisco\n2. Browse available materials\n3. Pay by the bag or by weight (very affordable)\n4. Teachers and nonprofits may qualify for additional discounts\n5. Membership programs available for frequent users",
    timeframe: 'Ongoing',
    link_text: 'Visit SCRAP',
  },
  'smc-surplus-property': {
    name: 'San Mateo County Surplus Property Program',
    description:
      'San Mateo County provides free surplus office furniture, supplies, and equipment to San Mateo County-based nonprofits and public schools.',
    what_they_offer:
      '- Office furniture (desks, chairs, tables)\n- Office supplies\n- Equipment and electronics\n- Filing and storage solutions\n- All items free of charge',
    how_to_get_it:
      '1. Must be a nonprofit or public school in San Mateo County\n2. Request an invitation through the online form\n3. Complete registration once invited\n4. Browse available items\n5. Request items and schedule pickup',
    timeframe: 'Ongoing',
    link_text: 'Request an Invitation',
  },
  'federal-federal-emergency-covid-19-funeral-assistance': {
    name: 'FEMA: Covid-19 Funeral Assistance',
    description:
      'Financial assistance for burial and funeral costs for someone who died of COVID-19. To be eligible, you were not reimbursed for funeral or burial expenses by any organization or agency.',
    what_they_offer:
      'Federal Emergency Management Agency (FEMA) offers support to people during natural disasters and national emergencies, including housing and funeral assistance.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased's death was COVID-19 related\n- The deceased died in the U.S.\n- The deceased died after May 20th, 2020\n- The applicant is a US citizen or an eligible non-citizen\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-social-security-retirement-benefits-for-child': {
    name: 'Social Security: Retirement Benefits for Children',
    description:
      'Replacement income for underaged children of qualified retirees and families receiving retirement benefits. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is under 18 years\n- The applicant’s marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is the child or spouse of a person who is receiving retirement or disability benefits\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-supplemental-security-income-ssi-for-child': {
    name: 'Social Security: Supplemental Security Income (ssi) for Children',
    description:
      'Monthly cash payments to meet the basic needs of children with disabilities and caretakers with limited income, savings, or other resources. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is under 18 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n- The applicant has limited income and resources\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-centers-for-medicare-with-disability': {
    name: 'Medicare/Medicaid: Medicare with Disabilities',
    description:
      'A health insurance program for Americans aged 65 and older, and for people with disabilities.',
    what_they_offer: 'Administers Medicare, Medicaid, and the Health Insurance Exchanges.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veteran-s-pension-with-disability': {
    name: "VA: Veteran's Pension with Disabilities",
    description:
      'Monthly payments to wartime veterans with specific age, disability, income, or net worth.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years\n- The applicant has a disability or impairment\n- The applicant has limited income and resources\n- The applicant served in the active military\n- The applicant’s service status is: honorable, general or other than dishonorable discharge\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veteran-readiness-and-employment-vr-e': {
    name: 'VA: Veteran Readiness And Employment (vr&e)',
    description:
      'Employment support for service members and veterans with a disability that limits their ability to work.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant served in the active military\n- The applicant's service status is: active-duty service member or honorable, general or other than dishonorable discharge\n- The applicant’s disability was caused or made worse by their active-duty military service\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-department-of-combat-related-special-compensation-crsc': {
    name: 'DOD: Combat-related Special Compensation (crsc)',
    description:
      'Pays added benefits to retirees with at least 20 years of service and who receive VA compensation for combat-related disabilities.',
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant served in the active military\n- The applicant’s service status is: retired from the service\n- The applicant’s disability was caused or made worse by their active-duty military service\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-ticket-to-work-program': {
    name: 'Social Security: Ticket To Work Program',
    description:
      'Career development for Social Security disability beneficiaries ages 18 to 64 years who would like to work.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is between 18-64 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-supplemental-security-income-ssi': {
    name: 'Social Security: Supplemental Security Income (ssi)',
    description:
      'Financial assistance to adults with disabilities, and people 65 and older without disabilities who meet specific financial limits. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n- The applicant has limited income and resources\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-social-security-disability-insurance-for-child-wit': {
    name: 'Social Security: Social Security Disability Insurance for Children with Disabilities',
    description:
      'Financial assistance to adult children with disabilities who are unable to work and whose parents receive disability benefits. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 18 years\n- The applicant’s marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-social-security-disability-insurance': {
    name: 'Social Security: Social Security Disability Insurance',
    description:
      'Financial assistance to people with disabilities. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- You worked and paid Social Security taxes on your earnings\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-financial-assistance-and-social-services-fass': {
    name: 'BIA: Financial Assistance And Social Services (fass)',
    description:
      'Direct assistance to American Indians and Alaska Natives, including financial, child, burial, emergency, and adult care assistance.',
    what_they_offer:
      'The Bureau of Indian Affairs enhances the quality of life and protects and improves the trust assets of American Indians, Indian tribes, and Alaska Natives.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has limited income and resources\n- The applicant is a member of an American Indian Tribe or an Alaska Native\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-federal-retirement-thrift-savings-plan-tsp': {
    name: 'TSP: Thrift Savings Plan (tsp)',
    description:
      "A retirement savings and investment plan sponsored by the Federal Government for members of the uniformed services and federal employees. The TSP offers similar savings and tax benefits that private corporations offer under '401(k)' plans.",
    what_they_offer:
      'Helps current and former civilian employees and members of the uniformed services prepare for their retirement with the Thrift Savings Plan (TSP).',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant worked and paid Social Security taxes\n- The applicant is over 60 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant served in the active military\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-retirement-benefits-for-parents': {
    name: 'Social Security: Retirement Benefits for Parents',
    description: 'Replacement income for qualified retirees and their families.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant’s marital status is unmarried or divorced\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is caring for the child of someone who died, is retired, or has a disability, and the child has a disability or is under 16 years\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-centers-for-medicare-savings-programs-msp': {
    name: 'Medicare/Medicaid: Medicare Savings Programs (msp)',
    description:
      'Get help paying Medicare insurance, like deductibles, coinsurance, and copayments.',
    what_they_offer: 'Administers Medicare, Medicaid, and the Health Insurance Exchanges.',
    how_to_get_it:
      'Eligibility requirements:\n-  The applicant is at least 65 years\n- The applicant has a disability or impairment\n- The applicant has limited income and resources\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veteran-s-pension': {
    name: "VA: Veteran's Pension",
    description:
      'Monthly payments to wartime veterans with specific age, disability, income, or net worth criteria.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years\n- The applicant has limited income and resources\n- The applicant served in the active military\n- The applicant’s service status is: honorable, general or other than dishonorable discharge\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-supplemental-security-income-ssi-for-adults': {
    name: 'Social Security: Supplemental Security Income (ssi) for Adults',
    description:
      'Financial assistance to meet basic needs for food, clothing, and shelter for people who are older or with disabilities. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has limited income and resources\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-retirement-benefits': {
    name: 'Social Security: Retirement Benefits',
    description:
      'Replacement income for qualified retirees and their families.&nbsp;You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant worked and paid Social Security taxes\n- The applicant is at least 62 years\n- The applicant is a US citizen or an eligible non-citizen\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-coal-miner-worker-s-compensation': {
    name: "Dept of Labor: Coal Miner Worker's Compensation",
    description:
      'Compensation to coal miners who were totally disabled by black lung disease (pneumoconiosis) or surviving spouses of miners whose deaths are attributable to this disease.&nbsp;Also provides medical coverage for treatment of related lung diseases.',
    what_they_offer:
      'Promotes and improves the welfare, working conditions, opportunities, benefits and rights of wage earners, job seekers, and retirees of the United States.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n- The applicant worked in the coal mining industry and suffer from black lung disease\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-coal-miner-worker-s-compensation-for-surviving-spo': {
    name: "Dept of Labor: Coal Miner Worker's Compensation For Surviving Spouse",
    description:
      'Compensation to surviving spouses of coal miners totally disabled by or whose deaths are attributable to black lung disease (pneumoconiosis).',
    what_they_offer:
      'Promotes and improves the welfare, working conditions, opportunities, benefits and rights of wage earners, job seekers, and retirees of the United States.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased worked in the coal mines and their death was due to black lung disease (pneumoconiosis)\n- The applicant's relationship to the deceased is: spouse\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-presidential-memorial-certificate': {
    name: 'VA: Presidential Memorial Certificate',
    description:
      'An engraved Presidential Memorial Certificate (PMC) signed by the current president honoring the military service of a veteran or reservist.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member, honorable, general or other than dishonorable discharge, or member of the National Guard/Reserves\n- One of the following applies to the deceased: died while on active duty, died as a result of a service-related disability/illness, died while receiving/traveling to VA care, or died while receiving/eligible for VA compensation\n- The applicant’s relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veterans-burial-allowance': {
    name: 'VA: Veterans Burial Allowance',
    description: 'Assistance with burial, funeral, and transportation costs of a deceased veteran.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased died within the last two years\n- The deceased served in the active military\n- The deceased's service status is: honorable, general or other than dishonorable discharge\n- One of the following applies to the deceased: died as a result of a service-related disability/illness, died while receiving/traveling to VA care, or died while receiving/eligible for VA compensation\n- The applicant's relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-survivors-pension-for-spouse': {
    name: 'VA: Survivors Pension for Spouses',
    description:
      'Monthly payments to surviving spouses of wartime veterans with certain income and net worth limits.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The deceased's service status is: honorable, general or other than dishonorable discharge\n- The applicant’s marital status is unmarried or widowed\n- The applicant’s relationship to the deceased is: spouse\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-survivors-pension-for-child-with-disabilities': {
    name: 'VA: Survivors Pension for Children with Disabilities',
    description:
      'Monthly payments to qualified unmarried dependent children with disabilities of wartime veterans with certain income and net worth limits.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The deceased's service status is: honorable, general or other than dishonorable discharge\n- The applicant is under 18 years\n- The applicant's marital status is unmarried\n- The applicant's relationship to the deceased is: child\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veterans-medallions': {
    name: 'VA: Veterans Medallions',
    description:
      'A headstone medallion, grave marker, and Presidential Memorial Certificate for eligible veterans buried in a private cemetery.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The deceased's service status is: active-duty service member, honorable, general or other than dishonorable discharge, or a member of the National Guard/Reserves\n- The deceased is buried in a grave with a privately purchased headstone or an unmarked grave\n- The applicant's relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-veterans-headstone-and-grave-marker': {
    name: 'VA: Veterans Headstone And Grave Marker',
    description:
      'A headstone, grave or niche marker, or medallion to honor a veteran, service member, or eligible family member.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The deceased's service status is: active-duty service member, honorable, general or other than dishonorable discharge, or member of the National Guard/Reserves\n- The deceased is buried in a grave with a privately purchased headstone or an unmarked grave\n- The applicant's relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-life-insurance-for-survivors-of-veterans': {
    name: 'VA: Life Insurance for Survivors Of Veterans',
    description: "Payment from a veteran's or service member's life insurance policy.",
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member, honorable, general or other than dishonorable discharge, retired from the service, or member of the National Guard/Reserves\n- The applicant’s relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-dependency-and-indemnity-compensation-dic': {
    name: 'VA: Dependency And Indemnity Compensation (dic)',
    description:
      'Tax-free financial assistance to eligible dependents, spouses, or parents of service members and veterans.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member or honorable, general or other than dishonorable discharge\n- One of the following applies to the deceased: died while on active duty, died as a result of a service-related disability/illness, or died while receiving/eligible for VA compensation\n- The applicant’s relationship to the deceased is: child, parent, or spouse\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-civilian-health-and-medical-program-of-the-va-cham': {
    name: 'VA: Civilian Health And Medical Program Of The Va (champva)',
    description:
      'Health insurance for dependents and surviving spouses covering some health care services, supplies, and pharmacy benefits.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member or honorable, general or other than dishonorable discharge\n- One of the following applies to the deceased: died while on active duty or died as a result of a service-related disability/illness\n- The applicant's marital status is: unmarried or widowed\n- The applicant’s relationship to the deceased is: child or spouse\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-department-of-burial-benefits': {
    name: 'DOD: Burial Benefits',
    description:
      'Burial and transport assistance for the deceased, and travel support for the spouse, children, and immediate family members of the service member.',
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty member\n- One of the following applies to the deceased: died on active duty\n- The applicant's relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-social-security-lump-sum-death-benefit': {
    name: 'Social Security: Lump-sum Death Benefit',
    description:
      'Financial assistance of $255 to surviving spouses of a deceased person who qualified for Social Security benefits.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The deceased died within the last two years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: spouse or child\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-additional-disability-benefits-for-veterans': {
    name: 'VA: Additional Disability Benefits For Veterans',
    description:
      'Grants for people with a disability related to their military service to support with adaptive-equipment, special vehicles, clothing, dental assistance, and more.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant served in the active military\n- The applicant’s service status is: active-duty service member, Honorable, general or other than dishonorable discharge, or retired from the service\n- The applicant’s disability was caused or made worse by their active-duty military service\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-financial-assistance-and-social-services-fass-buri': {
    name: 'BIA: Financial Assistance And Social Services (fass) - Burial Assistance',
    description:
      'Burial assistance for deceased American Indians who do not have resources for funeral expenses or with certain income and net worth limits.',
    what_they_offer:
      'The Bureau of Indian Affairs enhances the quality of life and protects and improves the trust assets of American Indians, Indian tribes, and Alaska Natives.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased was a member of a federally recognized American Indian Tribe or an Alaska Native.\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-parents-caring-for-a-child': {
    name: 'Social Security: Survivors Benefits for Parents Caring For A Child',
    description:
      'Social Security survivors benefits to the person providing care for the child of a deceased worker.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant’s marital status is unmarried or widowed\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is caring for the child of someone who died, is retired, or has a disability, and the child has a disability or is under 16 years\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-annuity-for-military-surviving-spouses': {
    name: 'DOD: Annuity For Military Surviving Spouses',
    description: 'Financial support for surviving spouses of members of the uniformed services.',
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased died before 1978\n- The deceased served in the active military\n- The service status of the deceased is: retired from the service\n- The applicant’s relationship to the deceased is: spouse\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-education-benefits-gi-bill-for-survivors': {
    name: 'VA: Education Benefits (gi Bill) for Survivors',
    description:
      'VA education benefits or job training for dependents and survivors of a veteran. You must have a high school or GED diploma to be eligible.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member or honorable, general or other than dishonorable discharge\n- One of the following applies to the deceased: died while on active duty or died as a result of a service-related disability/illness\n- The applicant’s relationship to the deceased is: spouse or child\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-child-with-disabilities': {
    name: 'Social Security: Survivors Benefits for Children with Disabilities',
    description:
      'Social Security survivors benefits to a child, stepchild, grandchild, or adopted child with disabilities of eligible workers. You only need one application to apply for all SSA benefits.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant is under 18 years\n- The applicant's marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: child\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-spouse-with-disabilities': {
    name: 'Social Security: Survivors Benefits for Spouses with Disabilities',
    description:
      'Benefits for surviving spouses and certain divorced spouses with disabilities. Eligible survivors must have a disability that prevents them from working for more than a year. You only need one application to apply for all SSA benefits.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant is at least 50 years\n- The applicant’s marital status is widowed or divorced\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: spouse\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-public-safety-officers-educational-assistance-prog': {
    name: "DOJ: Public Safety Officers' Educational Assistance Program",
    description:
      'Financial assistance for higher education to spouses and children of police, fire, and emergency public safety officers killed in the line of duty.',
    what_they_offer:
      'Offers financial and educational support to help families of fallen public safety officers.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased was a public safety officer who died in the line of duty\n- The applicant’s relationship to the deceased is: spouse or child\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-public-safety-officers-death-benefits': {
    name: "DOJ: Public Safety Officers' Death Benefits",
    description:
      'A one-time benefit for survivors of law enforcement officers, firefighters, and other first responders whose deaths were related to an injury sustained during the line of duty.',
    what_they_offer:
      'Offers financial and educational support to help families of fallen public safety officers.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased was a public safety officer who died in the line of duty\n- The applicant’s relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-burial-flag': {
    name: 'VA: Burial Flag',
    description:
      'A United States flag for the coffin or urn in honor of the military service member.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member, honorable, general or other than dishonorable discharge, or member of the National Guard/Reserves\n- The applicant's relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-home-loan-program-for-survivors': {
    name: 'VA: Home Loan Program for Survivors',
    description: 'A VA-backed home loan to surviving spouses of veterans.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member or honorable, general or other than dishonorable discharge\n- One of the following applies to the deceased: died while on active duty, died as a result of a service-related disability/illness, Died while receiving/traveling to VA care, or died while receiving/eligible for VA compensation\n- The applicant’s marital status is\n- The applicant’s relationship to the deceased is: spouse\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-child': {
    name: 'Social Security: Survivors Benefits for Children',
    description:
      'Offers Social Security survivors benefits to a child, stepchild, grandchild, or adopted child of eligible workers.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      "Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant is under 18 years\n- The applicant's marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: child\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-department-of-survivor-benefit-plan': {
    name: 'DOD: Survivor Benefit Plan',
    description:
      "Offers up to 55% of a service member's retired pay for survivors of active duty service members and some retired and reserve members.",
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member, retired from the service, or member of the National Guard/Reserves\n- One of the following applies to the deceased: died while on active duty or died while on inactive-duty service training\n- The applicant’s relationship to the deceased is: spouse or child\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-burial-in-va-national-cemetery': {
    name: 'VA: Burial In Va National Cemetery',
    description:
      'Burial in VA national cemeteries for eligible veterans, service members, and some family members.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member, honorable, general or other than dishonorable discharge, or member of the National Guard/Reserves\n- One of the following applies to the deceased: died while on active duty, died as a result of a service-related disability/illness, died while receiving/traveling to VA care, or died while receiving/eligible for VA compensation\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-internal-revenue-tax-advantaged-retirement-plans-information': {
    name: 'IRS: Tax-advantaged Retirement Plans Information',
    description:
      'Learn about tax-advantaged retirement plans and how to manage retirement savings during changes in your life.',
    what_they_offer: 'Administers and enforces U.S. federal tax laws.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 62 years\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-internal-revenue-tax-relief-programs-for-people-with-disabilities': {
    name: 'IRS: Tax Relief Programs For People with Disabilities',
    description:
      'Programs that help people with disabilities save money with tax-favored accounts and maintain health, independence, and quality of life',
    what_they_offer: 'Administers and enforces U.S. federal tax laws.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-social-security-disability-insurance-for-child': {
    name: 'Social Security: Social Security Disability Insurance for Children',
    description:
      'Financial assistance to minor children whose parents receive disability benefits. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is under 18 years\n- The applicant’s marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is the child or spouse of a person who is receiving retirement or disability benefits\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-social-security-disability-insurance-for-parents': {
    name: 'Social Security: Social Security Disability Insurance for Parents',
    description:
      'Financial assistance to people with disabilities and their family members. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant’s marital status is unmarried or divorced\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is caring for the child of someone who died, is retired, or has a disability, and the child has a disability or is under 16 years\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-social-security-disability-insurance-for-spouse': {
    name: 'Social Security: Social Security Disability Insurance for Spouses',
    description:
      'Financial assistance to people with disabilities and their family. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      "Eligibility requirements:\n- The applicant is at least 62 years\n- The applicant's marital status is married\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is the child or spouse of a person who is receiving retirement or disability benefits\n\nVisit the official website or call for more information.",
    link_text: 'Official Website',
  },
  'federal-social-security-retirement-benefits-for-spouse': {
    name: 'Social Security: Retirement Benefits for Spouses',
    description:
      'A replacement income for spouses of qualified retirees. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 62 years\n- The applicant’s marital status is married\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant is the child or spouse of a person who is receiving retirement or disability benefits\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-retirement-benefits-for-child-with-disabilities': {
    name: 'Social Security: Retirement Benefits for Children with Disabilities',
    description:
      'A replacement income for adult children with disabilities of qualified retirees and families receiving retirement benefits. You only need one application to apply for all disability benefits offered by SSA.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is under 18 years\n- The applicant’s marital status is unmarried\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-public-safety-officers-disability-benefits': {
    name: "DOJ: Public Safety Officers' Disability Benefits",
    description:
      'A one-time benefit to public safety officers who were permanently and totally disabled as a result of an injury while in the line of duty.',
    what_they_offer:
      'Offers financial and educational support to help families of fallen public safety officers.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant is unable to work for a year or more because of a disability\n- You are a public safety officer who was catastrophically injured in the line of duty\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-centers-for-medicare-with-retirement': {
    name: 'Medicare/Medicaid: Medicare With Retirement',
    description:
      'A health insurance program for Americans aged 65 and older, and for people with disabilities.',
    what_they_offer: 'Administers Medicare, Medicaid, and the Health Insurance Exchanges.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years old\n- The applicant is a US citizen or an eligible non-citizen\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-concurrent-retirement-and-disability-payments-crdp': {
    name: 'DOD: Concurrent Retirement And Disability Payments (crdp)',
    description:
      'Offsets military retired pay due for VA disability compensation. Eligibility is automatic. No application is needed.',
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant’s date of birth is 60 years or older\n- The applicant has a disability or impairment\n- The deceased served in the active military\n- The applicant’s service status is: retired from the service or member of the National Guard or Reserves\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-death-gratuity': {
    name: 'DOD: Death Gratuity',
    description:
      'Tax free payment of $100,000 to eligible survivors of members of the Armed Forces who died while on active duty or while serving in certain reserve statuses.',
    what_they_offer:
      'Provides support for qualified spouses, children, and other family members of deceased service members.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: active-duty service member or member of the National Guard/Reserves\n- One of the following applies to the deceased: died while on active duty or Died while on inactive-duty service training\n- The applicant’s relationship to the deceased is: spouse, child, parent, or other family member\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-disability-compensation': {
    name: 'VA: Disability Compensation',
    description:
      'A monthly tax-free payment to veterans who got sick or injured while serving in the military or whose service made an existing condition worse.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n- The applicant served in the active military\n- The applicant’s disability was caused or made worse by their active-duty military service\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-extra-help-with-medicare-prescription-drug-plan-pa': {
    name: 'Social Security: Extra Help With Medicare Prescription Drug Plan (part D) Costs',
    description: 'Helps with the cost of prescription drugs, like deductibles and copays.&nbsp;',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant is at least 65 years old\n- The applicant has a disability or impairment\n- The applicant has limited income and resources\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-housing-improvement-program': {
    name: 'BIA: Housing Improvement Program',
    description:
      'Helps with home repair, renovation, replacement, and new housing for American Indian and Alaska Native individuals and families with no resources for standard housing.',
    what_they_offer:
      'The Bureau of Indian Affairs enhances the quality of life and protects and improves the trust assets of American Indians, Indian tribes, and Alaska Natives.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has limited income and resources\n- The applicant is a member of an American Indian Tribe or an Alaska Native\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-veterans-affairs-survivors-pension-for-child': {
    name: 'VA: Survivors Pension for Children',
    description:
      'Monthly payments to qualified unmarried dependent children of deceased wartime veterans.',
    what_they_offer:
      'Provides a wide range of benefits in support of veterans, service members, and their families.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased served in the active military\n- The service status of the deceased is: honorable, general or other than dishonorable discharge\n- The applicant is under 18 years\n- The applicant’s marital status is unmarried\n- The applicant’s relationship to the deceased is: child\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-parents': {
    name: 'Social Security: Survivors Benefits for Parents',
    description: 'Social Security survivors benefits to parents of eligible workers.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant is at least 62 years\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: parent\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-social-security-survivors-benefits-for-spouse': {
    name: 'Social Security: Survivors Benefits for Spouses',
    description:
      'Social Security survivors benefits to surviving spouses and certain divorced spouses of eligible workers.',
    what_they_offer:
      'Administers Social Security, as well as disability insurance, and other benefits.',
    how_to_get_it:
      'Eligibility requirements:\n- The deceased worked and paid Social Security taxes\n- The applicant is at least 60 years\n- The applicant’s marital status is widowed or divorced\n- The applicant is a US citizen or an eligible non-citizen\n- The applicant’s relationship to the deceased is: spouse\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-library-of-braille-and-audio-materials-service': {
    name: 'Library of Congress: Braille And Audio Materials Service',
    description:
      'Braille and audio materials and services at no cost for people who are blind or have a visual, physical, perceptual, or reading disability.',
    what_they_offer:
      'Provides Congress with research for the legislative process, administers the national copyright system, and manages the largest collection of books, recordings, photographs, maps and manuscripts in the world.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has a disability or impairment\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'federal-department-of-housing-choice-voucher-section-8': {
    name: 'HUD: Housing Choice Voucher (section 8)',
    description:
      'Learn if you are eligible for a Section 8 housing choice voucher to pay rent for private housing. Housing choice vouchers are for families with low incomes, seniors, and people with disabilities.Find your public housing agency to learn if you are eligible and apply.',
    what_they_offer:
      'Administers programs that provide housing and community development assistance and ensures fair and equal housing opportunities for everyone.',
    how_to_get_it:
      'Eligibility requirements:\n- The applicant has limited income and resources\n- The applicant is a U.S. citizen or eligible non-citizen\n\nVisit the official website or call for more information.',
    link_text: 'Official Website',
  },
  'calvet-benefits-portal': {
    name: 'CalVet Benefits & Services Portal',
    description:
      "The California Department of Veterans Affairs (CalVet) connects California's 1.6 million veterans and their families to state and federal benefits. The CalVet portal helps veterans discover and apply for housing, education, employment, healthcare, and financial assistance.",
    what_they_offer:
      '- Personalized benefits eligibility screening\n- Home loans with competitive rates (CalVet Home Loans)\n- College fee waivers for dependents (CalVet College Fee Waiver)\n- Veterans Homes of California (8 locations statewide)\n- Employment and career services\n- Claims assistance for VA benefits\n- Mental health and wellness resources\n- Veteran ID cards',
    how_to_get_it:
      '1. Visit calvet.ca.gov or call the CalVet helpline\n2. Complete the free benefits eligibility screening\n3. Get personalized recommendations for available programs\n4. Work with a CalVet representative to apply for benefits\n5. Visit a County Veterans Service Office (CVSO) for in-person help',
    timeframe: 'Ongoing',
    link_text: 'Explore Benefits',
  },
  'calvet-dvbe': {
    name: 'Disabled Veteran Business Enterprise (DVBE) Program',
    description:
      'The California Disabled Veteran Business Enterprise (DVBE) program helps veteran-owned businesses win state contracts. Certified DVBE businesses receive preference in state purchasing and contracting, with a goal that 3% of state contracts go to DVBEs.',
    what_they_offer:
      '- DVBE certification for state contract bidding\n- 3% statewide participation goal for DVBE contracts\n- Access to state procurement opportunities\n- Business development resources\n- Networking with prime contractors\n- Technical assistance and training\n- Bid preference on certain contracts',
    how_to_get_it:
      '1. Business must be at least 51% owned by service-disabled veteran\n2. Veteran must have 10% or greater service-connected disability\n3. Apply through California Department of General Services\n4. Submit DD214, VA disability rating letter, and business documents\n5. Complete DVBE application online\n6. Wait for certification review (typically 30-45 days)',
    timeframe: 'Ongoing',
    link_text: 'Apply for DVBE',
  },
  'calvet-caltap': {
    name: 'California Transition Assistance Program (CalTAP)',
    description:
      'CalTAP connects transitioning service members and veterans with their earned federal and state benefits through five pathways - Core Curriculum, Education, Employment, Entrepreneurship, and Service Providers. Since 2017, CalTAP has served over 12,000 veterans at military installations and college campuses.',
    what_they_offer:
      '- Benefits education and navigation\n- Employment and career services\n- Education pathway guidance\n- Entrepreneurship resources\n- Connection to local service providers\n- Continued support as needs change',
    how_to_get_it:
      '1. Attend a CalTAP workshop at a military installation\n2. Or visit a CalTAP session at a California college campus\n3. Complete intake and needs assessment\n4. Connect with local veteran service providers\n5. Receive ongoing support and referrals',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'calvet-vhhp': {
    name: 'Veterans Housing and Homelessness Prevention (VHHP)',
    description:
      'The Veterans Housing and Homelessness Prevention program develops affordable permanent supportive housing for veterans and their families who are experiencing homelessness or have extremely low income. CalVet has awarded $580.5 million to 99 housing projects with over 5,190 units.',
    what_they_offer:
      '- Affordable permanent housing for veterans\n- Supportive services included\n- Priority for homeless and at-risk veterans\n- Family housing available\n- Case management and support\n- Connection to VA benefits',
    how_to_get_it:
      '1. Contact your local County Veterans Service Office\n2. Verify veteran status and eligibility\n3. Complete housing needs assessment\n4. Get referral to VHHP housing project in your area\n5. Work with case manager through application process',
    timeframe: 'Ongoing (waitlists vary by location)',
    link_text: 'Learn More',
  },
  'va-vet-centers': {
    name: 'VA Vet Centers',
    description:
      'VA Vet Centers provide confidential community-based counseling, outreach, and referral services for eligible veterans, service members, and their families outside of traditional VA medical facilities.',
    what_they_offer:
      '- Confidential mental health counseling\n- Readjustment counseling services\n- PTSD and trauma support\n- Employment assistance\n- Family counseling\n- Community outreach and referrals',
    how_to_get_it:
      '1. Locate nearest Vet Center online\n2. Call or walk in during hours\n3. No VA enrollment required\n4. Services are confidential\n5. Meet with counselor or specialist\n6. Access ongoing support as needed',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'calvet-home-loans': {
    name: 'CalVet Home Loans',
    description:
      'CalVet Home Loans provides California veterans with competitive mortgage financing to purchase homes, farms, or manufactured homes. The program often offers below-market interest rates and unique benefits not available through conventional lenders.',
    what_they_offer:
      '- Competitive fixed interest rates\n- Low or no down payment options\n- Disaster protection (fire, earthquake, flood)\n- Rehabilitation and home improvement loans\n- Farm and manufactured home loans\n- No prepayment penalties\n- Sellers may assist with closing costs',
    how_to_get_it:
      '1. Must be an eligible California veteran\n2. Must purchase property in California\n3. Apply online at CalVet Home Loans website\n4. Get pre-qualified before house hunting\n5. Complete application with CalVet-approved lender\n6. Provide DD214, income verification, and credit check',
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  'calvet-property-tax-exemption': {
    name: 'Disabled Veteran Property Tax Exemption',
    description:
      "California offers one of the nation's most valuable property tax exemptions for disabled veterans. The exemption can eliminate thousands in annual property taxes based on disability rating and income level.",
    what_they_offer:
      '- Full or partial property tax exemption\n- Basic exemption up to $161,083 (2024) for 100% disabled\n- Low-income exemption up to $241,627 (2024) for qualifying veterans\n- Applies to primary residence only\n- Unmarried surviving spouses may also qualify\n- Annual savings can be thousands of dollars',
    how_to_get_it:
      "1. Must have service-connected disability from VA\n2. Must be California resident\n3. Property must be primary residence\n4. File claim with County Assessor's Office\n5. Provide VA disability rating letter and DD214\n6. Renew annually with county",
    timeframe: 'Annual (file by February 15 for full year)',
    link_text: 'Learn More',
  },
  'ca-military-retirement-tax-exclusion': {
    name: 'Military Retirement Income Tax Exclusion',
    description:
      'Starting in 2025, California veterans receiving military retirement pay can exclude up to $20,000 annually from state income taxes. Surviving spouses receiving Survivor Benefit Plan payments also qualify for this new tax break.',
    what_they_offer:
      '- Exclude up to $20,000 military retirement pay from state taxes\n- Survivor Benefit Plan payments also eligible\n- Available to military retirees of all ages\n- Surviving spouses qualify independently\n- Reduces California state income tax liability',
    how_to_get_it:
      '1. Must receive military retirement pay or SBP payments\n2. Must file California state income tax return\n3. Claim exclusion on California tax return (Form 540)\n4. Follow FTB instructions for military retirement exclusion\n5. Keep documentation of military retirement income',
    timeframe: 'Tax year 2025 and beyond',
    link_text: 'California FTB',
  },
  calable: {
    name: 'CalABLE',
    description:
      "CalABLE is California's tax-advantaged savings program for people with disabilities, allowing them to save money without affecting eligibility for public benefits like SSI and Medi-Cal.",
    what_they_offer:
      "- Tax-advantaged savings account (529A ABLE account)\n- Save up to $18,000 per year (2024 limit)\n- Account balances up to $100,000 don't affect SSI eligibility\n- Funds can be used for qualified disability expenses\n- Multiple investment options available\n- No California state income tax on earnings",
    how_to_get_it:
      '1. Must have qualifying disability that began before age 26\n2. Visit calable.ca.gov to open an account\n3. Complete online enrollment\n4. Choose investment options\n5. Start saving with as little as $25\n6. Manage account online',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'aarp-tax-aide': {
    name: 'AARP Foundation Tax-Aide',
    description:
      "AARP Foundation Tax-Aide is the nation's largest free volunteer-run tax assistance program, providing free tax preparation with a focus on taxpayers 50 and older with low to moderate income.",
    what_they_offer:
      '- Free tax preparation and e-filing\n- Help with federal and state returns\n- Assistance with tax credits (EITC, Child Tax Credit, etc.)\n- Special attention to seniors 50+\n- No age requirement to use the service\n- IRS-certified volunteers',
    how_to_get_it:
      '1. Use the AARP Tax-Aide locator to find a site near you\n2. Many sites require appointments; some accept walk-ins\n3. Bring all tax documents (W-2s, 1099s, ID, etc.)\n4. Meet with a volunteer preparer\n5. Review and sign your return\n6. File electronically or by mail',
    timeframe: 'January-April (varies by site)',
    link_text: 'Find Location',
  },
  'alameda-county-vita': {
    name: 'Alameda County Social Services Agency VITA',
    description:
      'Alameda County Social Services Agency offers free tax preparation through the IRS Volunteer Income Tax Assistance (VITA) program for low to moderate income residents.',
    what_they_offer:
      '- Free tax preparation for income up to $64,000\n- Help claiming Earned Income Tax Credit (EITC)\n- CalEITC (California Earned Income Tax Credit) assistance\n- IRS-certified volunteer preparers\n- E-filing available',
    how_to_get_it:
      '1. Check the Alameda County website for VITA site locations\n2. Make appointment through online scheduler (opens late January)\n3. Gather required documents (W-2s, 1099s, ID, Social Security cards)\n4. Attend your scheduled appointment\n5. File your return',
    timeframe: 'January-April',
    link_text: 'Schedule',
  },
  'community-gatepath-vita': {
    name: 'Community Gatepath (formerly CCRC) VITA',
    description:
      'Community Gatepath provides free tax preparation services for low-income individuals and families in Santa Clara County.',
    what_they_offer:
      '- Free tax preparation\n- Help with federal and state returns\n- Assistance with tax credits\n- IRS-certified volunteer preparers',
    how_to_get_it:
      '1. Check the Community Gatepath website for current information\n2. Locations and schedules vary by year\n3. Gather required tax documents\n4. Attend your appointment',
    timeframe: 'Seasonal',
    link_text: 'Learn More',
  },
  'csu-east-bay-vita': {
    name: 'CSU East Bay VITA',
    description:
      "CSU East Bay's accounting students provide free virtual tax preparation through the VITA program for taxpayers earning $84,000 or less.",
    what_they_offer:
      '- Free virtual tax preparation via Zoom\n- Available for income up to $84,000\n- Federal and state tax returns\n- IRS-certified student preparers supervised by faculty\n- Convenient online service',
    how_to_get_it:
      '1. Visit the CSU East Bay VITA website\n2. Schedule an appointment online\n3. Gather and scan/photograph your tax documents\n4. Attend your Zoom appointment\n5. Review and sign your return electronically',
    timeframe: 'February-April (Fridays & Saturdays)',
    link_text: 'Schedule',
  },
  'irs-vita-locator': {
    name: 'IRS VITA Site Locator',
    description:
      'The IRS VITA (Volunteer Income Tax Assistance) program offers free tax help to people who generally make $64,000 or less, persons with disabilities, and limited English speakers.',
    what_they_offer:
      '- Free tax preparation and e-filing\n- Help with EITC, Child Tax Credit, and other credits\n- Service for income generally $64,000 or less\n- Assistance in multiple languages\n- IRS-certified volunteers\n- Available at community centers, libraries, schools',
    how_to_get_it:
      '1. Use the IRS VITA locator tool to find a site\n2. Check site requirements (appointment vs. walk-in)\n3. Bring required documents (ID, Social Security cards, W-2s, 1099s)\n4. Meet with a volunteer preparer\n5. Review, sign, and file your return',
    timeframe: 'January-April (varies by site)',
    link_text: 'Find Location',
  },
  'ebaldc-vita': {
    name: 'EBALDC VITA',
    description:
      'East Bay Asian Local Development Corporation (EBALDC) offers free tax preparation through the VITA program at their SparkPoint Oakland center.',
    what_they_offer:
      '- Free tax preparation\n- Federal and state returns\n- Help with tax credits (EITC, CalEITC)\n- IRS-certified preparers\n- Multilingual assistance available',
    how_to_get_it:
      '1. Email sparkpoint@ebaldc.org for information\n2. Check website for current year schedule\n3. Make an appointment when available\n4. Bring required tax documents\n5. Complete your tax filing',
    timeframe: 'Seasonal (check website)',
    link_text: 'Contact',
  },
  'samaritan-house-vita': {
    name: 'Samaritan House VITA',
    description:
      'Samaritan House provides free tax preparation services for San Mateo County residents, including a convenient drop-off service option.',
    what_they_offer:
      '- Free tax preparation\n- Drop-off service available (no need to wait)\n- Federal and state returns\n- Help with tax credits\n- IRS-certified volunteers',
    how_to_get_it:
      '1. Call for tax questions or to schedule\n2. Gather all required documents\n3. Drop off documents or attend in-person appointment\n4. Receive call when return is ready for review\n5. Sign and file your return',
    timeframe: 'February-April',
    link_text: 'Contact',
  },
  'sf-state-vita': {
    name: 'SF State VITA',
    description:
      'San Francisco State University accounting students provide free tax preparation through the IRS VITA program for low to moderate income taxpayers.',
    what_they_offer:
      '- Free tax preparation\n- Federal and California state returns\n- IRS-certified student preparers\n- Faculty supervision\n- Service for students and community members',
    how_to_get_it:
      '1. Check SF State VITA website for schedule and location\n2. Gather required tax documents\n3. Attend during scheduled hours\n4. Work with a student preparer\n5. Review, sign, and file your return',
    timeframe: 'February-April',
    link_text: 'Learn More',
  },
  'sparkpoint-fremont-vita': {
    name: 'SparkPoint Fremont VITA',
    description:
      'SparkPoint Fremont at the Fremont Family Resource Center offers free tax preparation for current year and back taxes for low to moderate income families.',
    what_they_offer:
      '- Free current year tax preparation (February-April)\n- Free back tax preparation (year-round)\n- Federal and state returns\n- Help with tax credits\n- IRS-certified preparers',
    how_to_get_it:
      '1. Contact the Fremont Family Resource Center\n2. Schedule an appointment\n3. Gather required tax documents\n4. Attend your appointment\n5. Review and sign your return',
    timeframe: 'February-April for current year; year-round for back taxes',
    link_text: 'Contact',
  },
  'united-way-bay-area-taxes': {
    name: 'United Way Bay Area',
    description:
      'United Way Bay Area partners with local organizations to provide free, high-quality tax preparation at sites throughout the Bay Area.',
    what_they_offer:
      '- Free tax preparation at multiple sites\n- Service for low to moderate income residents\n- Help with EITC and other credits\n- IRS-certified volunteers\n- Multiple languages available',
    how_to_get_it:
      '1. Visit United Way Bay Area website\n2. Find a free tax preparation site near you\n3. Check if appointment is required\n4. Gather required documents\n5. Get your taxes filed for free',
    timeframe: 'January-April',
    link_text: 'Find Location',
  },
  'baec-entrepreneur-center': {
    name: 'Bay Area Entrepreneur Center',
    description:
      'The Bay Area Entrepreneur Center at Skyline College provides free resources and support for aspiring and current entrepreneurs in San Mateo County.',
    what_they_offer:
      '- Free business management guidance\n- One-on-one consulting with business advisors\n- Business workshops and training\n- Networking events\n- Technical assistance for startups\n- Help with business plans',
    how_to_get_it:
      '1. Visit the Bay Area Entrepreneur Center website\n2. Browse available workshops and events\n3. Schedule a one-on-one consultation\n4. Attend workshops and networking events\n5. Access ongoing support as your business grows',
    timeframe: 'Ongoing',
    link_text: 'Get Started',
  },
  'sf-score': {
    name: 'San Francisco SCORE',
    description:
      'SCORE is a nonprofit network of volunteer business mentors. San Francisco SCORE offers free mentoring and low-cost workshops to help small business owners succeed.',
    what_they_offer:
      '- Free one-on-one business mentoring\n- Mentors are experienced business professionals\n- Low-cost workshops on business topics\n- Online resources and templates\n- Guidance on starting, growing, or transitioning a business\n- Over 50 local mentors available',
    how_to_get_it:
      "1. Visit sanfrancisco.score.org\n2. Browse mentor profiles and areas of expertise\n3. Request a free mentoring session online\n4. Meet with your mentor (in-person or virtual)\n5. Continue meeting as needed—it's always free",
    timeframe: 'Ongoing',
    link_text: 'Find a Mentor',
  },
  'san-mateo-sbdc': {
    name: 'San Mateo Small Business Development Center',
    description:
      'The San Mateo SBDC provides free, confidential business advising to help small businesses start, grow, and succeed in San Mateo County.',
    what_they_offer:
      '- Free one-on-one business consulting\n- Help with business planning and strategy\n- Cash flow management assistance\n- Supply chain and operations guidance\n- Help with funding and loan applications\n- Disaster relief application assistance',
    how_to_get_it:
      '1. Visit the San Mateo SBDC website\n2. Request a free consultation\n3. Complete intake form describing your business needs\n4. Get matched with an advisor\n5. Meet for ongoing support as needed',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'nova-workforce': {
    name: 'NOVA Workforce Development',
    description:
      'NOVA Workforce connects job seekers with employment opportunities and training services, and helps businesses find qualified workers in Silicon Valley.',
    what_they_offer:
      '- Free career counseling and job search assistance\n- Skills training and certification programs\n- Resume and interview preparation\n- Job placement services\n- Connections to employers\n- Programs for youth, adults, and dislocated workers',
    how_to_get_it:
      '1. Visit the NOVA Workforce website or office\n2. Complete an orientation session\n3. Meet with a career counselor\n4. Access training and job search services\n5. Get connected to employment opportunities',
    timeframe: 'Ongoing',
    link_text: 'Get Started',
  },
  'ibank-small-business': {
    name: 'Small Business Finance Center (IBank)',
    description:
      "California's IBank Small Business Finance Center offers loan guarantee programs to help small businesses access capital for growth and recovery.",
    what_they_offer:
      "- Disaster Relief Loan Guarantee Program\n- Jump Start Loan Program (up to $10,000 for microenterprises)\n- Small Business Loan Guarantee Program\n- Focus on job creation in underserved communities\n- Help accessing capital when traditional loans aren't available",
    how_to_get_it:
      '1. Visit the IBank website to learn about programs\n2. Determine which program fits your needs\n3. Work with a participating lender (IBank provides the guarantee)\n4. Submit loan application through the lender\n5. IBank guarantee helps you get approved',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  calfile: {
    name: 'CalFile – Free State Tax Filing',
    description:
      "CalFile is California's free online tax filing service from the Franchise Tax Board, allowing eligible residents to file their state income tax returns at no cost directly with the state.",
    what_they_offer:
      '- Free California state tax return filing\n- File current year plus two prior years\n- Direct deposit refunds\n- Instant confirmation of filing\n- Secure, official FTB system\n- Available in English and Spanish',
    how_to_get_it:
      '1. Create a MyFTB account at ftb.ca.gov\n2. Wait for CalFile to open (typically mid-January)\n3. Gather W-2s, 1099s, and other tax documents\n4. Log in and complete your return online\n5. Review and submit electronically\n6. Receive refund via direct deposit or check',
    timeframe: 'January 20 – April 15 annually',
    link_text: 'File Free',
  },
  caleitc: {
    name: 'CalEITC – California Earned Income Tax Credit',
    description:
      'The California Earned Income Tax Credit (CalEITC) provides cash back to low-income working Californians. Combined with the federal EITC, families can receive thousands of dollars in tax refunds even if they owe no taxes.',
    what_they_offer:
      '- Cash back tax credit up to $3,529 (varies by income/family size)\n- Refundable credit – get money even if you owe no taxes\n- Young Child Tax Credit adds up to $1,117 for children under 6\n- Can be combined with federal EITC for larger refund\n- Available to ITIN filers (undocumented workers)\n- No minimum age requirement (federal EITC requires age 25+)',
    how_to_get_it:
      '1. Earned income must be under ~$30,950 (varies by family size)\n2. File California state tax return (Form 540)\n3. Complete Schedule CalEITC\n4. Claim Young Child Tax Credit if you have children under 6\n5. Use free tax prep services (VITA) for help filing\n6. File by April 15 to receive refund',
    timeframe: 'File by April 15 annually',
    link_text: 'Check Eligibility',
  },
  'alameda-food-bank': {
    name: 'Alameda County Community Food Bank',
    description:
      'The Alameda County Community Food Bank is one of the largest food banks in the nation, distributing millions of pounds of food annually through a network of partner agencies and direct distribution programs.',
    what_they_offer:
      '- Free groceries at 350+ distribution sites\n- Fresh produce, proteins, and staples\n- Mobile food pantries in underserved areas\n- No ID or income verification required\n- Culturally appropriate foods available\n- CalFresh (food stamps) application assistance',
    how_to_get_it:
      'Use the online Food Finder tool to locate a distribution site near you. Most sites operate on a first-come, first-served basis. Some require appointments; check individual site details.',
    timeframe: 'Ongoing',
    link_text: 'Find Food',
  },
  'alameda-meals-on-wheels': {
    name: 'Alameda Meals on Wheels',
    description:
      'Alameda Meals on Wheels delivers nutritious meals to homebound seniors and adults with disabilities in the City of Alameda, providing both nourishment and friendly check-ins.',
    what_they_offer:
      '- Hot lunch delivered Monday-Friday\n- Frozen weekend meals\n- Friendly volunteer visits and safety checks\n- Suggested donation, but no one turned away\n- Special diet accommodations available',
    how_to_get_it:
      'Call to apply. You must be 60+ or have a disability and be primarily homebound. A staff member will assess eligibility and schedule deliveries.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'bernal-heights-brown-bag': {
    name: 'Bernal Heights Neighborhood Center - Brown Bag Program',
    description:
      'Bernal Heights Neighborhood Center provides food assistance to San Francisco residents, including a weekly Brown Bag program for seniors and a food pantry serving all community members.',
    what_they_offer:
      '- Brown Bag Program: Supplemental groceries for seniors 60+ (Thursdays)\n- Weekly food pantry open to all SF residents\n- Fresh produce and shelf-stable items\n- No income verification required',
    how_to_get_it:
      'For the Brown Bag program, visit on Thursdays and bring proof of age (60+) and SF residency. For the general food pantry, visit during open hours. Contact the center for current schedule.',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'calfresh-online': {
    name: 'CalFresh Online',
    description:
      "CalFresh (California's SNAP/food stamps program) now allows beneficiaries to purchase groceries online from select retailers, making food access more convenient for those with transportation or mobility challenges.",
    what_they_offer:
      '- Online grocery ordering with EBT card\n- Available at Amazon, Walmart, Safeway, and more\n- Same eligible food items as in-store\n- Home delivery or store pickup options\n- Delivery fees may apply (varies by retailer)',
    how_to_get_it:
      "If you have a CalFresh EBT card, visit a participating retailer's website. Create an account, add your EBT card, and shop for eligible groceries. Check the CDSS website for the full list of participating stores.",
    timeframe: 'Ongoing',
    link_text: 'Get Started',
  },
  'calfresh-rmp': {
    name: 'CalFresh Restaurant Meals Program (RMP)',
    description:
      'The Restaurant Meals Program allows certain CalFresh recipients to use their EBT benefits at participating restaurants, helping those who may not have access to cooking facilities or ability to prepare meals.',
    what_they_offer:
      "- Use CalFresh EBT to buy prepared meals\n- Available at participating restaurants (fast food and sit-down)\n- Hot, ready-to-eat meals\n- Includes chains like Subway, Denny's, and local restaurants\n- Available in most Bay Area counties",
    how_to_get_it:
      'You must be a CalFresh recipient who is 60+, disabled, or homeless. Check if your county participates, then use the CDSS Restaurant Locator to find participating restaurants. Show your EBT card and ID when ordering.',
    timeframe: 'Ongoing',
    link_text: 'Find Restaurants',
  },
  'food-bank-contra-costa-solano': {
    name: 'Food Bank of Contra Costa & Solano',
    description:
      'The Food Bank of Contra Costa and Solano serves two counties with free food distribution, helping fight hunger through a network of partners and direct community programs.',
    what_they_offer:
      '- Free groceries at distribution sites\n- Mobile food pantries\n- Senior food programs\n- Fresh produce distributions\n- CalFresh enrollment assistance\n- No ID or proof of income required',
    how_to_get_it:
      'Use the online Food Locator to find a distribution site near you. Bring bags to carry food. Most sites operate weekly; check individual site schedules.',
    timeframe: 'Ongoing',
    link_text: 'Find Food',
  },
  'j-sei-meals-on-wheels': {
    name: 'J-Sei Meals on Wheels',
    description:
      'J-Sei provides culturally appropriate Japanese-style home-delivered meals to seniors in Alameda County, honoring cultural food traditions while ensuring nutrition and social connection.',
    what_they_offer:
      '- Japanese-style hot meals delivered to your home\n- Culturally appropriate menu\n- Available for seniors 60+ who have difficulty leaving home\n- Suggested donation, but never denied for inability to pay\n- Friendly check-ins with each delivery',
    how_to_get_it:
      'Call J-Sei to apply. You must be 60+ and have difficulty leaving your home to prepare or obtain food. Staff will assess eligibility and set up meal deliveries.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'market-match': {
    name: 'Market Match',
    description:
      'Market Match doubles the value of CalFresh and WIC benefits at participating farmers markets, making fresh, locally grown fruits and vegetables more affordable for low-income families.',
    what_they_offer:
      '- Double your CalFresh/EBT dollars (up to $10-15 match per visit)\n- Bonus funds for fresh fruits and vegetables only\n- Available at 250+ farmers markets statewide\n- WIC participants also eligible at many markets\n- Some markets offer senior bonus programs',
    how_to_get_it:
      'Bring your CalFresh EBT card to a participating farmers market. Visit the info booth, swipe your card, and receive matching tokens or scrip to spend on fresh produce. Check the website for participating markets.',
    timeframe: 'Ongoing',
    link_text: 'Find Markets',
  },
  'mow-contra-costa': {
    name: 'Meals on Wheels Contra Costa',
    description:
      'Meals on Wheels Contra Costa delivers nutritious meals to homebound seniors and adults with disabilities, providing nutrition, independence, and social connection through daily visits.',
    what_they_offer:
      '- Hot meal delivered Monday-Friday\n- Frozen weekend meals available\n- Special diets accommodated (diabetic, low-sodium, etc.)\n- Friendly safety check with each delivery\n- Suggested donation, but no one turned away for inability to pay',
    how_to_get_it:
      'Call to apply. You must be 60+ or have a qualifying disability and be primarily homebound. Staff will assess your needs and schedule meal deliveries.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'mow-diablo-region': {
    name: 'Meals on Wheels Diablo Region',
    description:
      'Meals on Wheels Diablo Region serves the eastern Contra Costa County area, delivering meals and providing vital social connections to homebound seniors and adults with disabilities.',
    what_they_offer:
      '- Home-delivered meals\n- Hot and frozen meal options\n- Nutrition designed for seniors\n- Wellness checks with each delivery\n- Volunteer companionship visits',
    how_to_get_it:
      'Call to request services. A staff member will assess your eligibility and needs. Services available to homebound seniors 60+ and adults with disabilities.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'mow-san-francisco': {
    name: 'Meals on Wheels San Francisco',
    description:
      'Meals on Wheels San Francisco delivers nutritious meals to homebound seniors and adults with disabilities throughout San Francisco, ensuring no one goes hungry due to age, illness, or isolation.',
    what_they_offer:
      '- Hot lunch delivered Monday-Friday\n- Weekend meal options\n- Culturally diverse menu options\n- Special diets accommodated\n- Friendly volunteer check-ins\n- No one turned away for inability to pay',
    how_to_get_it:
      'Call or apply online. You must be 60+ or have a disability and be primarily homebound. Staff will assess your needs and arrange meal delivery schedule.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'mow-san-mateo': {
    name: 'Meals on Wheels San Mateo County (Peninsula Volunteers)',
    description:
      'Peninsula Volunteers operates Meals on Wheels in San Mateo County, delivering nutritious meals to homebound adults 60+ while providing vital social connection and wellness checks.',
    what_they_offer:
      '- Hot meal delivered Monday-Friday\n- Frozen weekend meals available\n- Suggested donation of $5.25/meal, but never denied\n- Special diet accommodations\n- Friendly safety check with each delivery\n- Pet food available for clients with pets',
    how_to_get_it:
      'Call to apply. You must be 60+ and primarily homebound due to age, illness, or disability. A staff member will assess eligibility and schedule deliveries.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'project-open-hand': {
    name: 'Project Open Hand',
    description:
      "Project Open Hand provides medically tailored meals and groceries to people living with serious illnesses, as well as nutritious meals to seniors. Since 1985, they've served millions of meals with love.",
    what_they_offer:
      '- Medically tailored meals for people with critical illnesses\n- Nutrition counseling from registered dietitians\n- Home delivery available\n- Congregate meal programs for seniors\n- Grocery bags and wellness checks\n- Services available regardless of income',
    how_to_get_it:
      'Call or apply online. Programs available for people with HIV/AIDS, cancer, diabetes, kidney disease, and other serious illnesses. Senior congregate meals available at community sites. Referrals from healthcare providers welcome.',
    timeframe: 'Ongoing',
    link_text: 'Get Meals',
  },
  'rainbow-grocery': {
    name: 'Rainbow Grocery',
    description:
      'Rainbow Grocery is a worker-owned cooperative grocery store in San Francisco offering natural and organic foods, with discounts for seniors and EBT cardholders.',
    what_they_offer:
      '- 10% discount for shoppers 60+\n- 10% discount for EBT cardholders\n- Natural, organic, and local foods\n- Bulk foods to save money\n- Vegan and specialty diet options\n- Discounts apply to all purchases',
    how_to_get_it:
      'Show your EBT card or proof of age (60+) at checkout to receive 10% off your purchase. Discounts cannot be combined. Open daily.',
    timeframe: 'Ongoing',
    link_text: 'Visit Store',
  },
  'second-harvest-silicon-valley': {
    name: 'Second Harvest of Silicon Valley',
    description:
      'Second Harvest of Silicon Valley is one of the largest food banks in the nation, providing food to nearly half a million people each month through a network of 900+ partners and direct distribution sites.',
    what_they_offer:
      '- Free groceries at 900+ distribution sites\n- Fresh produce, proteins, dairy, and staples\n- Mobile food pantries\n- Home delivery for homebound individuals\n- No income verification required\n- CalFresh enrollment assistance',
    how_to_get_it:
      'Use the online Food Locator tool or call the Food Connection hotline. Find a site near you, check the schedule, and bring bags to carry food. Most sites require no ID or paperwork.',
    timeframe: 'Ongoing',
    link_text: 'Find Food',
  },
  'sf-marin-food-bank': {
    name: 'SF-Marin Food Bank',
    description:
      'The SF-Marin Food Bank provides food to 1 in 4 San Francisco and Marin County residents, operating the largest food pantry network in the region with free groceries and nutrition programs.',
    what_they_offer:
      '- Free groceries at 275+ pantry sites\n- Home delivery for homebound seniors and people with disabilities\n- Supplemental food for seniors 60+ at senior centers\n- Fresh produce, proteins, and staples\n- CalFresh application assistance\n- No income verification or ID required',
    how_to_get_it:
      'Use the online Food Locator or call the food bank. Find a pantry near you and check their schedule. Bring your own bags. For home delivery, call to assess eligibility.',
    timeframe: 'Ongoing',
    link_text: 'Find Food',
  },
  'sos-meals-on-wheels': {
    name: 'SOS Meals on Wheels',
    description:
      'SOS Meals on Wheels serves the Oakland and surrounding areas with daily home-delivered meals for homebound seniors, providing nutrition and social connection for over 50 years.',
    what_they_offer:
      '- Hot meal delivered daily, Monday-Friday\n- Frozen weekend meals\n- Special diets available (diabetic, low-sodium, pureed)\n- Friendly volunteer check-ins\n- Suggested donation, but no one turned away',
    how_to_get_it:
      'Call to apply. You must be 60+ and homebound due to illness, disability, or frailty. Staff will assess your needs and schedule meal deliveries.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sourcewise-meals-on-wheels': {
    name: 'Sourcewise Meals on Wheels',
    description:
      'Sourcewise provides Meals on Wheels throughout Santa Clara County, delivering two nutritious meals daily to homebound seniors and adults with disabilities.',
    what_they_offer:
      '- Two meals per day delivered to your home\n- Meals meet 2/3 of daily nutritional requirements\n- Hot and cold meal options\n- Special diets accommodated\n- Suggested contribution of $3/day, but never denied\n- Safety check with each delivery',
    how_to_get_it:
      'Call Sourcewise to apply. You must be 60+ or have a disability and be homebound. Staff will assess eligibility and arrange meal delivery.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'spectrum-mow': {
    name: 'Spectrum Community Services Meals on Wheels',
    description:
      'Spectrum Community Services delivers Meals on Wheels to seniors in central and east Contra Costa County, helping older adults maintain independence and nutrition at home.',
    what_they_offer:
      '- Home-delivered meals for seniors 60+\n- Available for those unable to prepare food\n- Nutrition designed for older adults\n- Friendly volunteer visits\n- Sliding scale donations accepted',
    how_to_get_it:
      'Call Spectrum Community Services to apply. You must be 60+ and unable to prepare your own meals due to health or mobility limitations.',
    timeframe: 'Ongoing',
    link_text: 'Contact',
  },
  'st-anthonys-dining': {
    name: "St. Anthony's Dining Room",
    description:
      "St. Anthony's Dining Room has served San Francisco's Tenderloin neighborhood since 1950, providing free hot meals daily with dignity and respect to all who are hungry, no questions asked.",
    what_they_offer:
      '- Free hot meals served daily\n- Dine-in or to-go options\n- No ID, referral, or questions asked\n- Breakfast and lunch available\n- Clean, safe, welcoming environment\n- Additional social services available on-site',
    how_to_get_it:
      'Simply show up during meal service hours. No paperwork, ID, or appointment needed. All are welcome. Check website for current hours.',
    timeframe: 'Ongoing',
    link_text: 'Visit',
  },
  'universal-school-meals': {
    name: 'Universal School Meals',
    description:
      'California became the first state to offer universal free school meals to all public school students regardless of family income, ensuring every child has access to nutritious breakfast and lunch.',
    what_they_offer:
      '- Free breakfast for all TK-12 students\n- Free lunch for all TK-12 students\n- Available at all California public schools\n- No income verification or application required\n- Nutritious, balanced meals meeting USDA standards\n- Available every school day',
    how_to_get_it:
      "Your child automatically qualifies. Simply have them request meals at school. No forms or applications needed. Contact your school's food services if you have questions about meal times or menus.",
    timeframe: 'Ongoing (school year)',
    link_text: 'Learn More',
  },
  'wic-program': {
    name: 'WIC – Women, Infants & Children',
    description:
      "WIC is California's nutrition program for pregnant and postpartum women, infants, and children under 5, providing healthy food, nutrition education, breastfeeding support, and healthcare referrals.",
    what_they_offer:
      '- Monthly benefits for healthy foods (fruits, vegetables, whole grains, milk, eggs)\n- Infant formula and baby food\n- WIC card accepted at most grocery stores\n- Nutrition counseling\n- Breastfeeding support and free breast pumps\n- Farmers market benefits\n- Referrals to healthcare and social services',
    how_to_get_it:
      "Apply online or contact your local WIC office. You'll need proof of income (up to 185% of poverty level), residency, and identity. Pregnant women, new mothers, infants, and children under 5 may qualify.",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'ymca-food-pantries': {
    name: 'YMCA Food Pantries',
    description:
      'The YMCA of San Francisco operates food pantries throughout the Bay Area, providing free groceries to families and individuals facing food insecurity.',
    what_they_offer:
      '- Free groceries at 17 Bay Area locations\n- Serves 6,900+ people weekly\n- Fresh produce, proteins, and staples\n- Diapers and essentials at some locations\n- No income verification required\n- Family-friendly environment',
    how_to_get_it:
      'Visit any YMCA food pantry location during open hours. Check the website for locations, days, and times. No registration required at most sites.',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'ecumenical-hunger-program': {
    name: 'Ecumenical Hunger Program',
    description:
      'The Ecumenical Hunger Program serves East Palo Alto and surrounding communities with nutritionally balanced food boxes, helping families stretch their food budgets.',
    what_they_offer:
      '- Nutritionally balanced food boxes\n- Fresh produce when available\n- Available for families and individuals\n- Appointment required\n- Serving East Palo Alto and neighboring communities\n- Additional services including clothing and furniture',
    how_to_get_it:
      'Call to schedule an appointment. First-time clients should bring proof of address. Food distribution is available on scheduled days.',
    timeframe: 'Ongoing',
    link_text: 'Schedule Appointment',
  },
  'jfcs-food-pantry': {
    name: 'JFCS Food Pantry',
    description:
      "Jewish Family and Children's Services (JFCS) operates a food pantry providing high-protein, nutritious food to seniors, disabled adults, and low-income families in Santa Clara County.",
    what_they_offer:
      '- High-protein nutritious food boxes\n- Available for seniors on fixed income\n- Serves disabled adults and low-income families\n- Kosher options available\n- Culturally sensitive food choices',
    how_to_get_it:
      'Contact JFCS to learn about eligibility and how to access the food pantry. Services available to Santa Clara County residents.',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'pvi-got-groceries': {
    name: 'Got Groceries Program',
    description:
      "Peninsula Volunteers' Got Groceries program provides weekly bags of free groceries to individuals and families facing food insecurity in San Mateo County.",
    what_they_offer:
      '- Full bag of groceries weekly\n- Fresh produce, proteins, and breads\n- Available to individuals and families\n- Distribution every Wednesday\n- No income verification required',
    how_to_get_it:
      'Visit a Got Groceries distribution site on Wednesdays. Check the Peninsula Volunteers website for locations and times. No registration required.',
    timeframe: 'Wednesdays',
    link_text: 'Learn More',
  },
  'usda-farmers-market-directory': {
    name: 'USDA Farmers Market Directory',
    description:
      "The USDA's national directory of over 7,000 farmers markets across the United States, searchable by location to find fresh, locally-grown produce and farm products near you.",
    what_they_offer:
      '- Searchable database of 7,000+ farmers markets\n- Market locations, hours, and directions\n- Products sold at each market\n- Accepted payment methods (cash, credit, SNAP/EBT)\n- Seasonal availability information',
    how_to_get_it:
      'Visit the USDA Local Food Portal and search by your city, state, or ZIP code to find farmers markets near you. Filter by products, payment options, and more.',
    timeframe: 'Seasonal (most markets spring-fall)',
    link_text: 'Find Markets',
  },
  'cdfa-certified-farmers-markets': {
    name: "California Certified Farmers' Markets",
    description:
      "The official California Department of Food and Agriculture directory of 750+ certified farmers' markets statewide, where California farmers sell directly to consumers.",
    what_they_offer:
      "- 750+ certified farmers' markets in California\n- Direct-from-farm produce and products\n- Markets listed by county\n- Certification ensures products are California-grown\n- Many markets accept CalFresh EBT and Market Match",
    how_to_get_it:
      "View the CDFA directory to find certified farmers' markets in your county. Markets are certified to ensure products come directly from California farms.",
    timeframe: 'Year-round (varies by market)',
    link_text: 'View Directory (PDF)',
  },
  'calvet-veterans-homes': {
    name: 'Veterans Homes of California',
    description:
      'The Veterans Homes of California operate 8 residential care facilities across the state providing housing, healthcare, and supportive services to eligible veterans and their spouses.',
    what_they_offer:
      "- Long-term residential care (domiciliary and skilled nursing)\n- On-site medical and dental care\n- Physical therapy and rehabilitation\n- Memory care for Alzheimer's/dementia\n- Social and recreational activities\n- Three meals daily\n- Transportation to VA medical appointments",
    how_to_get_it:
      '1. Must be California veteran with 90+ days active duty\n2. Must have honorable discharge\n3. Apply online or by mail through CalVet\n4. Submit DD214, medical records, and financial info\n5. Complete health assessment\n6. Select preferred home location',
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  '988-suicide-crisis-lifeline': {
    name: '988 Suicide & Crisis Lifeline',
    description:
      'The 988 Suicide & Crisis Lifeline is a national network of local crisis centers providing free, confidential emotional support 24/7 to people in suicidal crisis or emotional distress.',
    what_they_offer:
      '- 24/7 phone, text, and chat support\n- Trained crisis counselors available in English and Spanish\n- Specialized support for veterans (press 1)\n- LGBTQ+ specific support available\n- Deaf/hard of hearing support via TTY',
    how_to_get_it:
      'Call or text 988 from any phone, anytime. You can also chat online at 988lifeline.org. No appointment or insurance needed.',
    timeframe: '24/7',
    link_text: 'Call or Text 988',
  },
  'crisis-text-line': {
    name: 'Crisis Text Line',
    description:
      'Crisis Text Line is a free, 24/7 text-based mental health support service connecting people in crisis with trained volunteer counselors through text messages.',
    what_they_offer:
      '- Free 24/7 crisis support via text\n- Trained volunteer crisis counselors\n- Confidential conversations\n- Support for anxiety, depression, suicidal thoughts, abuse, and more\n- Available in English and Spanish',
    how_to_get_it:
      'Text HOME to 741741 from anywhere in the US. A trained crisis counselor will respond within minutes. Free on all carriers.',
    timeframe: '24/7',
    link_text: 'Text HOME to 741741',
  },
  'sf-suicide-prevention': {
    name: 'San Francisco Suicide Prevention',
    description:
      'San Francisco Suicide Prevention provides 24/7 confidential emotional support and crisis intervention through their hotline, operated by Felton Institute.',
    what_they_offer:
      '- 24/7 crisis phone support\n- Compassionate, judgment-free listening\n- Crisis intervention and de-escalation\n- Referrals to local mental health resources\n- Support for anyone in emotional distress',
    how_to_get_it:
      'Call 415-781-0500 anytime, day or night. Free and confidential. No appointment needed.',
    timeframe: '24/7',
    link_text: 'Call 415-781-0500',
  },
  'sf-behavioral-health-access': {
    name: 'SF Behavioral Health Access Line',
    description:
      "San Francisco's 24-hour behavioral health access line provides crisis support and helps connect residents to mental health and substance use services.",
    what_they_offer:
      '- 24/7 phone crisis support\n- Mental health service referrals\n- Substance use treatment referrals\n- Help scheduling counseling appointments within 48 hours\n- Information about SF behavioral health services',
    how_to_get_it:
      'Call 415-255-3737 or toll-free 888-246-3333 anytime. Available to San Francisco residents.',
    timeframe: '24/7',
    link_text: 'Call 415-255-3737',
  },
  'sf-mobile-crisis-team': {
    name: 'SF Mobile Crisis Team',
    description:
      "San Francisco's Mobile Crisis Team provides on-site mental health crisis intervention as an alternative to police response, sending trained clinicians to help people experiencing psychiatric emergencies.",
    what_they_offer:
      '- On-site crisis intervention\n- Mental health assessment\n- De-escalation support\n- Connection to appropriate services\n- Alternative to law enforcement response',
    how_to_get_it:
      'Call 415-970-4000 to request a mobile crisis team response. Available for mental health emergencies in San Francisco.',
    timeframe: '24/7',
    link_text: 'Call 415-970-4000',
  },
  'alameda-crisis-support': {
    name: 'Crisis Support Services of Alameda County',
    description:
      'Crisis Support Services of Alameda County provides 24/7 crisis intervention, suicide prevention, and grief support through phone and text services.',
    what_they_offer:
      '- 24/7 crisis phone line\n- Text support (text SAFE to 20121, 4-11pm)\n- Suicide prevention counseling\n- Grief support services\n- Warm line for emotional support',
    how_to_get_it:
      'Call 510-891-5600 anytime for crisis support. Text SAFE to 20121 between 4pm-11pm. Free and confidential.',
    timeframe: '24/7 phone; text 4-11pm',
    link_text: 'Call 510-891-5600',
  },
  'contra-costa-crisis-center': {
    name: 'Contra Costa Crisis Center',
    description:
      'The Contra Costa Crisis Center provides 24/7 crisis intervention, suicide prevention, and grief counseling services to Contra Costa County residents.',
    what_they_offer:
      '- 24/7 crisis and suicide hotline\n- Crisis text line (text HOPE to 20121)\n- Grief counseling line (800-837-1818)\n- Referrals to local resources\n- Confidential support',
    how_to_get_it:
      'Call 800-833-2900 anytime for crisis support. Text HOPE to 20121 (M-F 3-11pm). Grief line 800-837-1818.',
    timeframe: '24/7',
    link_text: 'Call 800-833-2900',
  },
  'santa-clara-suicide-crisis': {
    name: 'Santa Clara County Crisis Line',
    description:
      "Santa Clara County's 24/7 suicide and crisis hotline provides immediate support and connects callers to behavioral health services throughout the county.",
    what_they_offer:
      '- 24/7 suicide and crisis support\n- Mental health crisis intervention\n- Referrals to county behavioral health services\n- Support in multiple languages\n- Connection to mobile crisis teams',
    how_to_get_it:
      'Call 855-278-4204 anytime for crisis support. For general behavioral health services, call 800-704-0900.',
    timeframe: '24/7',
    link_text: 'Call 855-278-4204',
  },
  'marin-suicide-hotline': {
    name: 'Marin County Suicide Prevention Hotline',
    description:
      'Family Service Agency of Marin operates a 24/7 suicide prevention hotline and grief counseling line for Marin County residents in crisis.',
    what_they_offer:
      '- 24/7 suicide prevention hotline\n- 24/7 grief counseling line\n- Crisis intervention\n- Referrals to local services\n- Confidential support',
    how_to_get_it:
      'Call 415-499-1100 for suicide crisis support. Call 415-499-1195 for grief counseling. Both lines available 24/7.',
    timeframe: '24/7',
    link_text: 'Call 415-499-1100',
  },
  'napa-crisis-hotline': {
    name: 'Napa County Mental Health Crisis Line',
    description:
      "Napa County's 24-hour mental health crisis hotline provides immediate support for adults and youth experiencing mental health emergencies.",
    what_they_offer:
      '- 24/7 adult crisis support\n- Youth crisis line (1-800-843-5200)\n- Mental health crisis intervention\n- Referrals to county services\n- Mobile crisis response',
    how_to_get_it:
      'Adults call 707-253-4711. Youth call 1-800-843-5200. Both lines available 24/7.',
    timeframe: '24/7',
    link_text: 'Call 707-253-4711',
  },
  'solano-crisis-line': {
    name: 'Solano County Crisis Line',
    description:
      "Solano County's 24-hour crisis line provides immediate mental health support and crisis intervention for county residents.",
    what_they_offer:
      '- 24/7 crisis phone support\n- Mental health crisis intervention\n- Suicide prevention\n- Referrals to county services\n- Connection to mobile crisis teams',
    how_to_get_it:
      'Call 707-428-1131 anytime for crisis support. Free and confidential for Solano County residents.',
    timeframe: '24/7',
    link_text: 'Call 707-428-1131',
  },
  'sf-women-against-rape': {
    name: 'San Francisco Women Against Rape (SFWAR)',
    description:
      'SFWAR provides a 24-hour crisis hotline and support services for survivors of rape and sexual assault in San Francisco.',
    what_they_offer:
      '- 24/7 crisis hotline\n- Emotional support for survivors\n- Hospital accompaniment\n- Legal advocacy\n- Support groups\n- Counseling referrals',
    how_to_get_it:
      'Call 415-647-7273 anytime for immediate support. Services available to all survivors regardless of gender.',
    timeframe: '24/7',
    link_text: 'Call 415-647-7273',
  },
  'friendship-line-elderly': {
    name: 'Institute on Aging Friendship Line',
    description:
      'The Friendship Line is the only accredited 24/7 crisis line specifically for older adults, providing emotional support, crisis intervention, and friendly conversation.',
    what_they_offer:
      '- 24/7 crisis support for seniors\n- Friendly conversation and companionship calls\n- Grief support\n- Elder abuse reporting assistance\n- Referrals to local services\n- Support for loneliness and isolation',
    how_to_get_it:
      'Call 415-752-3778 or toll-free 1-800-971-0016 anytime. Free and confidential for adults 60+.',
    timeframe: '24/7',
    link_text: 'Call 415-752-3778',
  },
  'denti-cal': {
    name: 'Denti-Cal',
    description:
      "Denti-Cal is California's Medicaid dental program, providing comprehensive dental care to Medi-Cal beneficiaries at no cost, helping ensure oral health for low-income individuals and families.",
    what_they_offer:
      '- Preventive care (cleanings, exams, x-rays)\n- Restorative services (fillings, crowns)\n- Extractions and oral surgery\n- Dentures and partials\n- Emergency dental services\n- Orthodontics for children under 21 (when medically necessary)',
    how_to_get_it:
      'If you have Medi-Cal, you automatically have Denti-Cal. Find a Denti-Cal provider using the online provider search or call the Denti-Cal hotline at 1-800-322-6384.',
    timeframe: 'Ongoing',
    link_text: 'Find Provider',
  },
  'eyecare-america': {
    name: 'EyeCare America',
    description:
      'EyeCare America is a public service program of the American Academy of Ophthalmology providing eye care to seniors through volunteer ophthalmologists who donate their services.',
    what_they_offer:
      '- Free comprehensive eye exam\n- Up to one year of follow-up care\n- Diagnosis and treatment for eye diseases\n- Glaucoma and diabetic eye disease screening\n- No out-of-pocket costs for eligible patients',
    how_to_get_it:
      'You must be 65 or older, a US citizen or legal resident, not enrolled in an HMO or VA, and not seen an ophthalmologist in 3+ years. Check eligibility and find a volunteer doctor online or call 1-877-887-6327.',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'medi-cal': {
    name: 'Medi-Cal (Medicaid)',
    description:
      "Medi-Cal is California's Medicaid program, providing free or low-cost health coverage to millions of Californians including low-income adults, families, seniors, pregnant women, and people with disabilities.",
    what_they_offer:
      '- Doctor and hospital visits\n- Prescription medications\n- Preventive care and screenings\n- Mental health services\n- Dental care (Denti-Cal)\n- Vision care\n- Substance use treatment\n- Long-term care services',
    how_to_get_it:
      "Apply online at CoveredCA.com, through your county human services office, or by phone at 1-800-300-1506. You'll need proof of income, residency, and identity. Many people can enroll year-round.",
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  needymeds: {
    name: 'NeedyMeds',
    description:
      'NeedyMeds is a nonprofit providing a comprehensive database of patient assistance programs, helping people find affordable medications and healthcare services regardless of insurance status.',
    what_they_offer:
      '- Database of 1,500+ patient assistance programs\n- Free drug discount card (up to 80% off)\n- Listings of free/low-cost clinics\n- Coupons and rebates for medications\n- Disease-specific assistance programs\n- Information on government programs',
    how_to_get_it:
      'Visit needymeds.org and search by drug name, condition, or program type. Download the free NeedyMeds Drug Discount Card online or request one by mail. No registration required.',
    timeframe: 'Ongoing',
    link_text: 'Search Programs',
  },
  'planned-parenthood': {
    name: 'Planned Parenthood',
    description:
      'Planned Parenthood is a trusted healthcare provider offering sexual and reproductive health services on a sliding fee scale, ensuring care is accessible regardless of insurance status or ability to pay.',
    what_they_offer:
      '- Birth control and contraception counseling\n- STI testing and treatment\n- HIV testing\n- Cancer screenings (breast, cervical)\n- Pregnancy testing and options counseling\n- Abortion services\n- Transgender hormone therapy\n- General health care and wellness exams',
    how_to_get_it:
      'Find your nearest health center online or call 1-800-230-PLAN. Walk-ins welcome at many locations, but appointments recommended. Payment based on income; many services covered by Medi-Cal and Family PACT.',
    timeframe: 'Ongoing',
    link_text: 'Find Health Center',
  },
  'ryan-white-program': {
    name: 'Ryan White HIV/AIDS Program',
    description:
      'The Ryan White HIV/AIDS Program provides comprehensive care and support services for people living with HIV who are uninsured or underinsured, filling gaps in care not covered by other sources.',
    what_they_offer:
      '- Primary medical care and specialist visits\n- HIV medications and treatment\n- Mental health services\n- Substance abuse treatment\n- Case management\n- Transportation to appointments\n- Emergency financial assistance\n- Housing assistance',
    how_to_get_it:
      "Contact your local Ryan White provider or AIDS service organization. You'll need proof of HIV diagnosis, residency, and income. Use the HIV care locator to find services near you.",
    timeframe: 'Ongoing',
    link_text: 'Find HIV Care',
  },
  'samhsa-helpline': {
    name: 'SAMHSA National Helpline',
    description:
      "SAMHSA's National Helpline is a free, confidential, 24/7 treatment referral and information service for individuals and families facing mental health and/or substance use disorders.",
    what_they_offer:
      '- 24/7 confidential support\n- Treatment referrals in your area\n- Information about mental health and substance use\n- Support in English and Spanish\n- Referrals to local support groups\n- Information about state-funded treatment programs\n- Help finding sliding-scale or free treatment',
    how_to_get_it:
      'Call 1-800-662-4357 anytime, 24/7, 365 days a year. Specialists will connect you with local treatment facilities, support groups, and community organizations. TTY available at 1-800-487-4889.',
    timeframe: '24/7',
    link_text: 'Call Now',
  },
  'va-health-benefits': {
    name: 'VA Health Benefits',
    description:
      "VA Health Benefits provide comprehensive healthcare services to eligible veterans through the Veterans Health Administration, the nation's largest integrated healthcare system.",
    what_they_offer:
      "- Primary care and specialty care\n- Mental health services and counseling\n- Prescription medications\n- Preventive care and screenings\n- Women's health services\n- Urgent and emergency care\n- Telehealth appointments\n- Prosthetics and medical equipment",
    how_to_get_it:
      "Apply online at VA.gov, by phone at 1-877-222-8387, or in person at any VA medical center. You'll need your DD214 or other discharge documents. Most veterans who served on active duty are eligible.",
    timeframe: 'Ongoing',
    link_text: 'Apply for VA Health Care',
  },
  'wic-health': {
    name: 'WIC (Women, Infants, Children)',
    description:
      'WIC is a nutrition program providing healthy food, nutrition education, breastfeeding support, and healthcare referrals to pregnant and postpartum women, infants, and children under 5 in California.',
    what_they_offer:
      "- Monthly benefits for nutritious foods (fruits, vegetables, whole grains, milk, eggs)\n- Infant formula and baby food\n- Nutrition education and counseling\n- Breastfeeding support and breast pumps\n- Health screenings and referrals\n- Farmers' market benefits\n- WIC card accepted at most grocery stores",
    how_to_get_it:
      "Contact your local WIC office or call 1-888-942-9675. You'll need proof of income (up to 185% of poverty level), residency, and identity. Pregnant women, new mothers, infants, and children under 5 may qualify.",
    timeframe: 'Ongoing',
    link_text: 'Find WIC Office',
  },
  'smc-bhrs': {
    name: 'Behavioral Health and Recovery Services (BHRS)',
    description:
      'San Mateo County Behavioral Health and Recovery Services provides mental health and substance use treatment, prevention, and recovery services to residents of all ages in San Mateo County.',
    what_they_offer:
      '- Mental health assessment and treatment\n- Substance use disorder treatment\n- Crisis intervention services\n- Youth and family services\n- Older adult services\n- Peer support programs\n- Prevention and early intervention\n- Housing support for clients',
    how_to_get_it:
      'Call the Access Call Center at 1-800-686-0101 for a free assessment and referral. Services available for Medi-Cal recipients at no cost; sliding scale available for others.',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'smc-aging-adult-services': {
    name: 'Aging and Adult Services',
    description:
      'San Mateo County Aging and Adult Services provides protective services, in-home care, and nutrition programs to help older adults and people with disabilities live safely and independently.',
    what_they_offer:
      '- Adult Protective Services (abuse prevention)\n- In-Home Supportive Services (IHSS)\n- Public Guardian/Conservator services\n- Congregate and home-delivered meals\n- Senior centers and activities\n- Health insurance counseling (HICAP)\n- Long-term care ombudsman',
    how_to_get_it:
      'Call Aging and Adult Services at (650) 573-3900 for information and referrals. For abuse reports, call the 24-hour hotline at 1-800-675-8437. Services available to adults 60+ and adults with disabilities.',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'smc-pregnancy-children-families': {
    name: 'San Mateo County Pregnancy, Children and Families',
    description:
      "San Mateo County's Family Health Services provides prenatal care, home visiting, and child health programs to support healthy pregnancies and child development for families throughout the county.",
    what_they_offer:
      '- Free home visits for pregnant women and new parents\n- Black Infant Health program\n- Nurse-Family Partnership\n- Child health and disability prevention\n- Immunization services\n- School-based health centers\n- Dental services for children\n- Services in English, Spanish, and other languages',
    how_to_get_it:
      'Call (650) 573-2501 for program information. Free for Medi-Cal recipients; sliding fee scale for other county residents based on income.',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'calrx-naloxone': {
    name: 'CalRx OTC Naloxone Nasal Spray',
    description:
      "CalRx is California's initiative to make naloxone, a life-saving medication that reverses opioid overdoses, affordable and accessible to all residents without a prescription.",
    what_they_offer:
      '- 4mg naloxone nasal spray (Narcan-equivalent)\n- Twin pack for $19 plus shipping\n- No prescription required\n- Significantly below retail price ($45+)\n- Simple nasal spray administration\n- Shelf life of 2+ years',
    how_to_get_it:
      'Order online at CalRx.ca.gov. Add to cart, enter shipping information, and pay by credit card. Delivered directly to your home. Training videos available on the website.',
    timeframe: 'Ongoing',
    link_text: 'Order Naloxone',
  },
  'naloxone-distribution-project': {
    name: 'Naloxone Distribution Project (NDP)',
    description:
      "California's Naloxone Distribution Project provides free naloxone and fentanyl test strips to eligible nonprofit organizations working to prevent opioid overdose deaths in their communities.",
    what_they_offer:
      '- Free naloxone nasal sprays\n- Free fentanyl test strips\n- Training materials and resources\n- Support for community distribution\n- Available to eligible nonprofits statewide',
    how_to_get_it:
      'Organizations must apply through the California Department of Health Care Services. Eligible entities include community-based organizations, harm reduction programs, and healthcare providers serving at-risk populations.',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  adap: {
    name: 'AIDS Drug Assistance Program (ADAP)',
    description:
      "California's AIDS Drug Assistance Program provides life-saving HIV/AIDS medications and health insurance assistance to low-income Californians living with HIV who lack adequate coverage.",
    what_they_offer:
      '- Free HIV/AIDS medications (200+ drugs covered)\n- Health insurance premium assistance (OA-HIPP)\n- Medicare Part D premium assistance\n- Medi-Cal share of cost assistance\n- Covers residents with income up to 600% FPL\n- Available regardless of immigration status',
    how_to_get_it:
      "Apply through an ADAP enrollment site (clinics, AIDS service organizations, hospitals). You'll need proof of HIV diagnosis, California residency, income, and current insurance status.",
    timeframe: 'Ongoing',
    link_text: 'Find Enrollment Site',
  },
  'kick-it-california': {
    name: 'Kick It California (Quit Smoking Helpline)',
    description:
      "Kick It California is the state's free quit smoking and tobacco helpline, offering personalized coaching, a mobile app, and resources to help Californians quit tobacco, vaping, and marijuana.",
    what_they_offer:
      '- Free one-on-one phone coaching\n- Personalized quit plan\n- Mobile app for tracking progress\n- Text and email support\n- Resources for quitting vaping\n- Marijuana coaching (ages 13-29)\n- Available in English, Spanish, Chinese, Korean, Vietnamese\n- Free nicotine patches (while supplies last)',
    how_to_get_it:
      'Call 1-800-300-8086 or visit kickitca.org to get started. Coaching is free, confidential, and available in multiple languages. You can also enroll through the mobile app.',
    timeframe: 'Ongoing',
    link_text: 'Start Today',
  },
  'black-infant-health': {
    name: 'Black Infant Health Program',
    description:
      "The Black Infant Health Program is California's community-based program providing group support and education to Black women and birthing people during pregnancy and the first year of their baby's life.",
    what_they_offer:
      '- Weekly group sessions during pregnancy\n- Postpartum support groups\n- Life skills and stress management\n- Health education and resources\n- Social support and community building\n- Connection to prenatal care\n- Baby supplies and incentives\n- Available in 18+ California counties',
    how_to_get_it:
      'Contact your local Black Infant Health program through the state website. Programs are free and open to Black women and birthing people age 18+ who are pregnant or recently gave birth.',
    timeframe: 'Ongoing',
    link_text: 'Find Local Program',
  },
  'california-home-visiting': {
    name: 'California Home Visiting Program',
    description:
      'The California Home Visiting Program provides free, voluntary home visits to pregnant women and families with young children, offering parenting support, health education, and connections to community resources.',
    what_they_offer:
      '- Regular home visits by trained nurses or family specialists\n- Parenting education and support\n- Child development monitoring\n- Breastfeeding support\n- Connections to healthcare and social services\n- Goal setting and life skills\n- Support from pregnancy through age 5\n- Services in multiple languages',
    how_to_get_it:
      'Contact your local health department or use the state website to find programs in your area. Priority given to first-time parents, low-income families, and families with risk factors.',
    timeframe: 'Ongoing',
    link_text: 'Find Local Program',
  },
  'vaccines-for-children': {
    name: 'Vaccines for Children (VFC) Program',
    description:
      'The Vaccines for Children program provides free vaccines to children 18 and under who might not otherwise be vaccinated because of inability to pay, ensuring all children have access to life-saving immunizations.',
    what_they_offer:
      '- All recommended childhood vaccines free of charge\n- Available for children 0-18 years old\n- DTaP, Polio, MMR, Hepatitis, HPV, and more\n- Flu vaccines\n- COVID-19 vaccines\n- Catch-up vaccines for older children',
    how_to_get_it:
      "Find a VFC provider near you through the state immunization registry. Children qualify if uninsured, enrolled in Medi-Cal, underinsured, or American Indian/Alaska Native. Bring your child's immunization record.",
    timeframe: 'Ongoing',
    link_text: 'Find VFC Provider',
  },
  'prep-assistance-program': {
    name: 'PrEP Assistance Program (PrEP-AP)',
    description:
      "California's PrEP Assistance Program makes HIV prevention medication accessible to residents who might not otherwise afford it, covering the cost of PrEP medication, doctor visits, and lab tests.",
    what_they_offer:
      '- Free PrEP medication (Truvada, Descovy, or generic)\n- Coverage for doctor visits and HIV testing\n- Lab work costs covered\n- Available to residents with income up to 500% FPL\n- PrEP-AP Immediate Access: One free month for anyone\n- No immigration status requirements\n- Helps uninsured and underinsured individuals',
    how_to_get_it:
      "Enroll through an ADAP enrollment site or healthcare provider. For immediate access to one free month, contact a PrEP-AP provider. You'll need proof of California residency and income.",
    timeframe: 'Ongoing',
    link_text: 'Enroll Now',
  },
  'every-woman-counts': {
    name: 'Every Woman Counts',
    description:
      'Every Woman Counts provides free breast and cervical cancer screenings to uninsured and underinsured California women, helping detect cancer early when treatment is most effective.',
    what_they_offer:
      '- Free mammograms\n- Clinical breast exams\n- Pap tests (cervical cancer screening)\n- HPV tests\n- Follow-up diagnostic testing if needed\n- Connection to treatment through BCCTP\n- Available at hundreds of providers statewide',
    how_to_get_it:
      'Call 1-800-511-2300 to find a provider and check eligibility. You must be a California resident, age 21+, with income at or below 200% of the federal poverty level, and uninsured or underinsured for these services.',
    timeframe: 'Ongoing',
    link_text: 'Call to Enroll',
  },
  cpsp: {
    name: 'Comprehensive Perinatal Services Program (CPSP)',
    description:
      'The Comprehensive Perinatal Services Program provides enhanced prenatal and postpartum care to Medi-Cal recipients, offering additional support services beyond standard obstetric care to improve birth outcomes.',
    what_they_offer:
      '- Enhanced prenatal care visits\n- Nutrition counseling and education\n- Psychosocial assessment and support\n- Health education classes\n- Care coordination\n- Postpartum care through 60 days after delivery\n- Breastfeeding support\n- Referrals to community resources',
    how_to_get_it:
      "If you're pregnant and have Medi-Cal, ask your prenatal care provider if they're a CPSP provider. CPSP services are covered at no additional cost through Medi-Cal.",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'childhood-lead-poisoning-prevention': {
    name: 'Childhood Lead Poisoning Prevention Program',
    description:
      "California's Childhood Lead Poisoning Prevention Program provides screening, case management, and environmental investigation to protect children from lead exposure, which can cause learning disabilities and developmental delays.",
    what_they_offer:
      '- Free blood lead testing for children\n- Case management for children with elevated lead levels\n- Environmental investigation of lead sources\n- Home assessment and lead hazard identification\n- Nutritional counseling\n- Connection to developmental services\n- Education for parents and caregivers',
    how_to_get_it:
      "All children on Medi-Cal must be tested at ages 1 and 2. Contact your county health department's lead program if your child has been exposed to lead or you're concerned about lead in your home.",
    timeframe: 'Ongoing',
    link_text: 'Find County Program',
  },
  myturn: {
    name: 'MyTurn',
    description:
      "MyTurn is California's official vaccine scheduling and digital record system, making it easy to find vaccine appointments, access your immunization records, and stay up to date on recommended vaccines.",
    what_they_offer:
      '- COVID-19 vaccine appointments\n- Flu vaccine locations\n- Mpox vaccine scheduling\n- Routine vaccine appointments\n- Digital vaccine record access\n- Walk-in clinic locator\n- Support in 250+ languages\n- Mobile-friendly interface',
    how_to_get_it:
      'Visit myturn.ca.gov to search for vaccines near you. Enter your zip code, select the vaccine you need, and book an appointment. You can also access your digital vaccine record by verifying your identity.',
    timeframe: 'Ongoing',
    link_text: 'Find Vaccines',
  },
  'sf-behavioral-health-directory': {
    name: 'SF Mental Health & Substance Use Provider Directory',
    description:
      "San Francisco's official directory of mental health and substance use disorder treatment providers, maintained by the Department of Public Health Behavioral Health Services.",
    what_they_offer:
      '- Searchable mental health provider listings\n- Substance use disorder treatment facilities\n- Crisis services information\n- Community-based mental health clinics\n- Medi-Cal and uninsured services',
    how_to_get_it:
      'Visit the online directory or call the 24/7 Access Line at 888-246-3333 for help finding services and scheduling assessments.',
    timeframe: '24/7 Access Line',
    link_text: 'Search Directory',
  },
  'smc-behavioral-health-directory': {
    name: 'San Mateo County Behavioral Health Provider Directory',
    description:
      "San Mateo County's official directory of behavioral health providers, including mental health clinics, substance use treatment programs, and crisis services throughout the county.",
    what_they_offer:
      '- Mental health provider listings\n- Substance use treatment facilities\n- Youth and family services\n- Older adult behavioral health\n- Crisis intervention resources',
    how_to_get_it:
      'Visit the online directory or call the Access Call Center at 1-800-686-0101 for help finding providers and getting assessed for services.',
    timeframe: 'Ongoing',
    link_text: 'Search Directory',
  },
  'santa-clara-behavioral-health-directory': {
    name: 'Santa Clara County Behavioral Health Provider Directory',
    description:
      "Santa Clara County's official searchable directory of behavioral health providers, updated monthly with mental health clinics, substance use programs, and community services.",
    what_they_offer:
      "- Online searchable provider database\n- Mental health outpatient clinics\n- Substance use disorder treatment\n- Children's mental health services\n- Crisis and emergency services",
    how_to_get_it:
      'Search the online directory or call 1-800-704-0900 for help accessing mental health and substance use services in Santa Clara County.',
    timeframe: 'Ongoing',
    link_text: 'Search Directory',
  },
  'alameda-behavioral-health-directory': {
    name: 'Alameda County Behavioral Health Provider Directory',
    description:
      "Alameda County Behavioral Health's official provider directory, listing mental health clinics, substance use treatment facilities, and community resources throughout the East Bay.",
    what_they_offer:
      '- Mental health provider listings\n- Substance use treatment programs\n- Crisis services information\n- Peer support programs\n- Transitional age youth services',
    how_to_get_it:
      'Search the online directory or call the Mental Health Access Line at 1-800-491-9099. For substance use services, call 1-844-682-7215.',
    timeframe: 'Ongoing',
    link_text: 'Search Directory',
  },
  'contra-costa-behavioral-health-directory': {
    name: 'Contra Costa County Mental Health Provider Directory',
    description:
      "Contra Costa County's official mental health provider directory, updated weekly with licensed clinics, treatment programs, and crisis services for county residents.",
    what_they_offer:
      '- Weekly updated provider listings\n- Mental health treatment facilities\n- Substance use disorder services\n- Children and youth services\n- Crisis and emergency contacts',
    how_to_get_it:
      'Search the online directory or call the 24/7 Access Line at 1-888-678-7277. For crisis support, call the A3 Miles Hall Crisis Center at 844-844-5544.',
    timeframe: '24/7 Access Line',
    link_text: 'Search Directory',
  },
  'marin-behavioral-health-directory': {
    name: 'Marin County Behavioral Health Provider Directory',
    description:
      "Marin County Behavioral Health and Recovery Services' official provider directory, including Medi-Cal mental health providers and Drug Medi-Cal substance use treatment facilities.",
    what_they_offer:
      '- Medi-Cal mental health provider listings\n- Drug Medi-Cal substance use providers\n- Community mental health services\n- Crisis intervention resources\n- Recovery support services',
    how_to_get_it:
      'View the online provider directories or call the Access Line at 888-818-1115 for help finding mental health and substance use services in Marin County.',
    timeframe: 'Ongoing',
    link_text: 'View Directory',
  },
  'sonoma-behavioral-health-directory': {
    name: 'Sonoma County Behavioral Health Provider Directory',
    description:
      "Sonoma County's official behavioral health provider directories, listing mental health clinics and substance use disorder treatment providers serving county residents.",
    what_they_offer:
      '- Mental health provider directory (PDF)\n- Substance use treatment directory (PDF)\n- Community mental health centers\n- Crisis services information\n- Recovery resources',
    how_to_get_it:
      'Download the provider directories from the county website or call 1-800-870-8786 for help finding mental health and substance use services in Sonoma County.',
    timeframe: 'Ongoing',
    link_text: 'View Directories',
  },
  'napa-behavioral-health-directory': {
    name: 'Napa County Behavioral Health Provider Directory',
    description:
      "Napa County's official partners and providers directory for behavioral health services, including mental health treatment facilities and substance use programs.",
    what_they_offer:
      '- Mental health provider listings\n- Substance use treatment providers\n- Crisis services information\n- Community resources\n- Recovery support programs',
    how_to_get_it:
      'View the online directory or call the Access Line at 1-800-648-8650. For 24-hour crisis support, call 707-253-4711.',
    timeframe: 'Ongoing',
    link_text: 'View Directory',
  },
  'solano-behavioral-health-directory': {
    name: 'Solano County Behavioral Health Provider Directory',
    description:
      "Solano County Behavioral Health's official provider directory, listing mental health clinics and substance use treatment facilities serving residents throughout the county.",
    what_they_offer:
      '- Mental health provider listings\n- Substance use treatment providers\n- Access to services information\n- Crisis resources\n- Recovery programs',
    how_to_get_it:
      'View the online directory or call the Access Line at 1-800-547-0495 (Monday-Friday, 8am-5pm) or email BHAccess@SolanoCounty.com.',
    timeframe: 'Mon-Fri 8am-5pm',
    link_text: 'View Directory',
  },
  'court-fee-waivers': {
    name: 'Court Fee Waivers',
    description:
      'California courts offer fee waivers for individuals who cannot afford to pay court filing fees, ensuring access to the justice system regardless of income.',
    what_they_offer:
      '- Waiver of court filing fees\n- Waiver of motion fees and jury fees\n- Waiver of fees for court-appointed interpreter\n- Free copies of necessary court documents\n- Fee waiver for court reporter services in some cases',
    how_to_get_it:
      '1. Obtain Form FW-001 (Request to Waive Court Fees) from the court clerk or online\n2. Complete the form with income and household information\n3. You automatically qualify if you receive public benefits (Medi-Cal, CalFresh, SSI, etc.)\n4. Or if household income is 125% or below Federal Poverty Level\n5. Submit form to the court clerk before or with your first court filing\n6. Judge will review and approve or deny within 5 court days',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'justice-diversity-center': {
    name: 'Justice & Diversity Center (JDC)',
    description:
      'The Justice & Diversity Center is the nonprofit arm of the Bar Association of San Francisco, providing free legal services to those who cannot afford attorneys.',
    what_they_offer:
      '- Free legal clinics and advice sessions\n- Pro bono representation in civil matters\n- Legal help for housing, family law, immigration, and more\n- Corporate law assistance for nonprofits serving low-income communities\n- Lawyer referral services',
    how_to_get_it:
      '1. Visit the JDC website or call to learn about available programs\n2. Attend a free legal clinic in your area of need\n3. Complete intake and eligibility screening\n4. If eligible, receive free legal advice or representation\n5. Nonprofits can apply for corporate legal assistance separately',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'racial-equity-project': {
    name: 'Racial Equity Project (REP)',
    description:
      'The Racial Equity Project provides free legal support to Black-led nonprofit organizations in California, helping strengthen their organizational capacity and mission.',
    what_they_offer:
      '- Pro bono corporate legal services for Black-led nonprofits\n- Help with contracts, employment matters, and governance\n- Legal review and risk assessment\n- Board and compliance support\n- Partnership with major law firms',
    how_to_get_it:
      "1. Organization must be Black-led (Black executive director or majority Black board)\n2. Must be a registered 501(c)(3) nonprofit\n3. Apply through the JDC website\n4. Describe your legal needs and organization's mission\n5. If accepted, be matched with pro bono attorneys",
    timeframe: 'Ongoing',
    link_text: 'Apply for Support',
  },
  'sf-financial-justice-project': {
    name: 'SF Financial Justice Project',
    description:
      'The San Francisco Financial Justice Project works to reduce the impact of fines, fees, and financial penalties on low-income residents and communities of color.',
    what_they_offer:
      '- Reduction or elimination of parking tickets based on income\n- Help with towing and booting fee relief\n- Assistance with court fines and fees\n- Information about payment plans\n- Advocacy for systemic reform of punitive fees',
    how_to_get_it:
      "1. Visit sfgov.org/financialjustice to learn about available programs\n2. For parking ticket relief: Apply through SFMTA's Low-Income Payment Plan\n3. For towing relief: Contact the office directly\n4. Provide proof of income or public benefits enrollment\n5. Receive determination on fee reduction or elimination",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'sf-immigrant-support': {
    name: 'San Francisco Immigrant Support',
    description:
      'San Francisco provides resources and support for immigrants, including connections to free and low-cost immigration legal services regardless of immigration status.',
    what_they_offer:
      '- Free or low-cost immigration legal consultations\n- Help with citizenship and naturalization applications\n- DACA renewal assistance\n- Green card and visa support\n- Know Your Rights information\n- Referrals to trusted legal providers',
    how_to_get_it:
      '1. Visit immigrants.sfgov.org for list of legal service providers\n2. Call 311 for referrals to immigration legal help\n3. Attend a free immigration legal clinic\n4. Complete intake and eligibility screening with provider\n5. Receive legal assistance based on your needs',
    timeframe: 'Ongoing',
    link_text: 'Find Provider',
  },
  'uscis-i-912-fee-waiver': {
    name: 'USCIS I-912 Fee Waiver',
    description:
      'U.S. Citizenship and Immigration Services (USCIS) offers fee waivers for certain immigration applications for individuals who cannot afford the filing fees.',
    what_they_offer:
      '- Waiver of filing fees for certain immigration forms\n- Available for naturalization (N-400), green card renewal (I-90), and other forms\n- Based on income, receipt of means-tested benefits, or financial hardship\n- Does not affect your immigration case or chances of approval',
    how_to_get_it:
      '1. Download Form I-912 from uscis.gov\n2. Determine your basis for fee waiver (means-tested benefit, income below 150% FPL, or hardship)\n3. Gather supporting documents (benefit letters, tax returns, pay stubs)\n4. Submit I-912 with your immigration application\n5. USCIS will review and notify you of approval or denial\n6. If denied, you must pay the fee to continue your application',
    timeframe: 'Case-by-case',
    link_text: 'Learn More',
  },
  'clsepa-legal-services': {
    name: 'Community Legal Services in East Palo Alto',
    description:
      'Community Legal Services in East Palo Alto (CLSEPA) provides free legal assistance to low-income families in San Mateo County and surrounding areas.',
    what_they_offer:
      "- Immigration legal services (family petitions, DACA, citizenship)\n- Housing and tenant rights assistance\n- Workers' rights and wage theft claims\n- Criminal record clearance (expungement)\n- Consumer protection\n- Community education workshops",
    how_to_get_it:
      '1. Call CLSEPA or visit their website to schedule an appointment\n2. Complete intake and financial eligibility screening\n3. Must meet income guidelines (generally 200% FPL or below)\n4. Attend initial consultation with staff attorney\n5. Receive ongoing representation if case is accepted',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'legal-aid-smc': {
    name: 'Legal Aid Society of San Mateo County',
    description:
      'The Legal Aid Society of San Mateo County provides free civil legal services to low-income residents, helping protect their rights and improve their lives.',
    what_they_offer:
      '- Housing law (eviction defense, habitability issues)\n- Healthcare access (Medi-Cal, insurance appeals)\n- Economic security (public benefits, consumer issues)\n- Immigration assistance\n- Education rights\n- Protection from domestic violence and abuse',
    how_to_get_it:
      '1. Call the intake line or apply online\n2. Complete eligibility screening (income must be 200% FPL or below)\n3. Describe your legal issue\n4. If eligible, schedule appointment with attorney\n5. Receive legal advice, brief services, or full representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'project-sentinel-fair-housing': {
    name: 'Project Sentinel Fair Housing',
    description:
      'Project Sentinel is a nonprofit fair housing agency that works to eliminate housing discrimination and ensure equal housing opportunity for all Bay Area residents.',
    what_they_offer:
      '- Free fair housing education and counseling\n- Investigation of housing discrimination complaints\n- Legal advocacy and representation in fair housing cases\n- Landlord-tenant mediation services\n- First-time homebuyer education\n- Foreclosure prevention counseling',
    how_to_get_it:
      '1. Call or visit the Project Sentinel website\n2. Describe your housing situation or discrimination concern\n3. Staff will assess your case and explain your rights\n4. If discrimination is found, they can investigate and advocate on your behalf\n5. Services are free for all, regardless of income',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'bay-area-legal-aid': {
    name: 'Bay Area Legal Aid (BayLegal)',
    description:
      'Bay Area Legal Aid is the largest civil legal aid provider in the Bay Area, offering free legal help to low-income individuals in housing, public benefits, healthcare, consumer, and family law matters.',
    what_they_offer:
      '- Housing law (eviction defense, habitability, Section 8)\n- Public benefits (CalFresh, Medi-Cal, CalWORKs appeals)\n- Healthcare access and insurance issues\n- Consumer rights and debt issues\n- Domestic violence restraining orders\n- Immigration assistance\n- Senior law services',
    how_to_get_it:
      '1. Call the intake line at 800-551-5554\n2. Or apply online at baylegal.org\n3. Must meet income eligibility (generally 200% FPL or below)\n4. Complete phone or online intake\n5. If eligible, receive legal advice, brief services, or representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'legal-aid-at-work': {
    name: 'Legal Aid at Work',
    description:
      'Legal Aid at Work provides free legal services and resources to workers facing employment problems, including discrimination, wage theft, and wrongful termination.',
    what_they_offer:
      "- Free legal clinics for workers\n- Employment law advice and representation\n- Help with discrimination and harassment claims\n- Wage theft recovery assistance\n- Disability and pregnancy accommodation\n- Workers' rights education\n- Know Your Rights resources in multiple languages",
    how_to_get_it:
      "1. Call the Workers' Rights Clinic at 415-864-8208\n2. Or attend a free legal clinic (check website for schedule)\n3. Services available regardless of immigration status\n4. Complete intake to determine eligibility for representation\n5. Receive legal advice, referrals, or representation",
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'centro-legal-de-la-raza': {
    name: 'Centro Legal de la Raza',
    description:
      "Centro Legal de la Raza provides free bilingual legal services to low-income communities in the East Bay, specializing in immigration, housing, and workers' rights.",
    what_they_offer:
      "- Immigration legal services (family petitions, DACA, asylum, citizenship)\n- Tenant rights and eviction defense\n- Workers' rights and wage claims\n- Community education and outreach\n- Bilingual services (English/Spanish)\n- Know Your Rights workshops",
    how_to_get_it:
      '1. Call 510-437-1554 for intake\n2. Or visit during walk-in clinic hours\n3. Must meet income guidelines\n4. Complete intake and eligibility screening\n5. Receive legal advice or representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'asian-law-caucus': {
    name: 'Asian Law Caucus',
    description:
      "Asian Law Caucus provides free legal services and advocacy for Asian and Pacific Islander communities, focusing on immigration, workers' rights, and housing.",
    what_they_offer:
      "- Immigration legal services (family, asylum, DACA, citizenship)\n- Workers' rights and employment discrimination\n- Housing and tenant rights\n- Civil rights advocacy\n- Language access services\n- Community education workshops",
    how_to_get_it:
      '1. Call the intake line at 415-896-1701\n2. Complete eligibility screening\n3. Services prioritized for API community members\n4. Must meet income guidelines for most services\n5. Receive legal advice or representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'la-raza-centro-legal': {
    name: 'La Raza Centro Legal',
    description:
      "La Raza Centro Legal provides free legal services to Latino and immigrant communities in San Francisco, specializing in immigration, housing, and workers' rights.",
    what_they_offer:
      "- Immigration legal services (family petitions, DACA, asylum, citizenship)\n- Tenant rights and eviction defense\n- Workers' rights and wage claims\n- Community education\n- Bilingual services (English/Spanish)",
    how_to_get_it:
      '1. Call 415-575-3500 for intake\n2. Must meet income guidelines\n3. Complete intake screening\n4. Receive legal advice or representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'eviction-defense-collaborative': {
    name: 'Eviction Defense Collaborative',
    description:
      'The Eviction Defense Collaborative provides free legal help to San Francisco tenants facing eviction, offering same-day assistance at the courthouse.',
    what_they_offer:
      '- Free legal consultations for tenants facing eviction\n- Same-day help at SF Superior Court\n- Help responding to unlawful detainer lawsuits\n- Negotiation with landlords\n- Full representation in some cases\n- Tenant rights education',
    how_to_get_it:
      '1. Visit the EDC office at SF Superior Court (Civic Center Courthouse)\n2. Or call for an appointment\n3. Bring your eviction notice and any court papers\n4. Available to all SF tenants regardless of income\n5. Walk-in clinic hours available',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'tenants-union-sf': {
    name: 'San Francisco Tenants Union',
    description:
      'The San Francisco Tenants Union provides tenant counseling, education, and advocacy to help renters understand and exercise their rights under SF rent control laws.',
    what_they_offer:
      '- Tenant counseling and advice (free for members)\n- Help understanding rent control laws\n- Assistance with habitability complaints\n- Guidance on eviction defense\n- Tenant rights workshops\n- Advocacy for tenant-friendly policies',
    how_to_get_it:
      '1. Become a member ($50/year sliding scale)\n2. Attend drop-in counseling hours\n3. Call the counseling line for advice\n4. Attend free tenant rights workshops\n5. Get referrals to legal services if needed',
    timeframe: 'Ongoing',
    link_text: 'Join/Get Help',
  },
  'court-self-help-sf': {
    name: 'SF Superior Court Self-Help Center',
    description:
      'The SF Superior Court Self-Help Center provides free legal information and assistance to people representing themselves in court matters.',
    what_they_offer:
      '- Free help with court forms and procedures\n- Assistance with family law matters (divorce, custody, support)\n- Help with restraining orders\n- Small claims court assistance\n- Eviction/unlawful detainer guidance\n- Referrals to legal aid organizations',
    how_to_get_it:
      '1. Visit the Self-Help Center at SF Civic Center Courthouse\n2. Or call for information\n3. No appointment needed for many services\n4. Bring your court papers and case information\n5. Staff cannot give legal advice but can help with forms and procedures',
    timeframe: 'Ongoing',
    link_text: 'Visit Center',
  },
  'court-self-help-alameda': {
    name: 'Alameda County Court Self-Help Center',
    description:
      'The Alameda County Law Library Self-Help Center provides free assistance to people representing themselves in court matters.',
    what_they_offer:
      '- Free help with court forms and procedures\n- Family law assistance (divorce, custody, support)\n- Restraining order help\n- Small claims guidance\n- Landlord-tenant matters\n- Referrals to legal services',
    how_to_get_it:
      '1. Visit the Self-Help Center at Alameda County Law Library\n2. Or access online resources at acgov.org/law\n3. Bring your court papers\n4. Staff can help with forms but cannot give legal advice',
    timeframe: 'Ongoing',
    link_text: 'Visit Center',
  },
  'court-self-help-santa-clara': {
    name: 'Santa Clara County Self-Help Center',
    description:
      'The Santa Clara County Self-Help Center provides free assistance to people representing themselves in court matters.',
    what_they_offer:
      '- Free help with court forms and procedures\n- Family law workshops (divorce, custody, support)\n- Restraining order assistance\n- Small claims court help\n- Eviction defense resources\n- Debt collection guidance',
    how_to_get_it:
      '1. Visit the Self-Help Center at the downtown San Jose courthouse\n2. Or access online resources and virtual workshops\n3. Check website for workshop schedules\n4. Bring your court papers and case information',
    timeframe: 'Ongoing',
    link_text: 'Visit Center',
  },
  ilrc: {
    name: 'Immigrant Legal Resource Center (ILRC)',
    description:
      'The Immigrant Legal Resource Center provides legal training, resources, and advocacy to advance immigrant rights, with free resources for immigrants and legal providers.',
    what_they_offer:
      '- Know Your Rights resources in multiple languages\n- Immigration legal guides and manuals\n- Training for legal service providers\n- Policy advocacy for immigrant rights\n- Red Cards for asserting rights\n- Community education resources',
    how_to_get_it:
      '1. Visit ilrc.org for free resources\n2. Download Know Your Rights materials\n3. Find a legal service provider through their directory\n4. Access immigration law guides and manuals\n5. Order Red Cards for community distribution',
    timeframe: 'Ongoing',
    link_text: 'Access Resources',
  },
  'catholic-charities-immigration': {
    name: 'Catholic Charities Immigration Services',
    description:
      'Catholic Charities provides affordable immigration legal services throughout the Bay Area, including help with citizenship, green cards, asylum, and family petitions.',
    what_they_offer:
      '- Citizenship and naturalization applications\n- Green card applications and renewals\n- Family-based petitions\n- DACA applications and renewals\n- Asylum applications\n- Refugee resettlement services\n- Low-cost legal consultations',
    how_to_get_it:
      '1. Call your local Catholic Charities office\n2. Schedule a legal consultation\n3. Sliding scale fees based on income\n4. Bring all immigration documents to appointment\n5. Receive assistance with applications and representation',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'iiba-immigration': {
    name: 'Immigration Institute of the Bay Area',
    description:
      'The Immigration Institute of the Bay Area (IIBA) provides affordable immigration legal services to immigrant families throughout the Bay Area.',
    what_they_offer:
      '- Low-cost immigration legal consultations\n- Citizenship and naturalization assistance\n- Green card and family petition services\n- DACA renewal support\n- Deportation defense referrals\n- Legal workshops and Know Your Rights',
    how_to_get_it:
      '1. Call IIBA to schedule appointment\n2. Complete intake and eligibility screening\n3. Attend consultation with immigration specialist\n4. Receive case assessment and options\n5. Proceed with legal services if eligible',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'eblc-immigration': {
    name: 'East Bay Community Law Center - Immigration',
    description:
      'East Bay Community Law Center provides free immigration legal services to low-income immigrants in Alameda County, including representation and community education.',
    what_they_offer:
      '- Free immigration legal consultations\n- Representation in immigration court\n- Asylum application assistance\n- Family-based petitions\n- Naturalization and citizenship\n- Community education workshops',
    how_to_get_it:
      '1. Call EBCLC intake line\n2. Complete screening for services\n3. Must be low-income Alameda County resident\n4. Attend appointment with immigration attorney\n5. Receive representation or referrals',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'five-keys': {
    name: 'Five Keys Schools and Programs',
    description:
      'Five Keys provides education and workforce development for justice-involved individuals, offering high school diplomas, career training, and reentry support in the Bay Area.',
    what_they_offer:
      '- Free high school diploma programs\n- GED preparation\n- Career technical education\n- Job placement assistance\n- Workforce readiness training\n- Wraparound support services\n- Programs in jails and community',
    how_to_get_it:
      '1. Contact Five Keys enrollment\n2. Complete intake assessment\n3. Enroll in education or training program\n4. Attend classes (in-person or hybrid)\n5. Receive supportive services\n6. Graduate and access job placement',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'project-rebound': {
    name: 'Project Rebound',
    description:
      'Project Rebound helps formerly incarcerated individuals earn college degrees at California State University campuses, providing support services and a community of peers.',
    what_they_offer:
      '- CSU admission support\n- Financial aid navigation\n- Academic advising and tutoring\n- Peer mentorship from formerly incarcerated students\n- Career development\n- Community and belonging\n- Available at multiple CSU campuses',
    how_to_get_it:
      '1. Contact Project Rebound at your desired CSU\n2. Complete intake and assessment\n3. Receive application support\n4. Enroll at CSU campus\n5. Access ongoing support services\n6. Join peer community',
    timeframe: 'Ongoing',
    link_text: 'Find Campus',
  },
  'anti-recidivism-coalition': {
    name: 'Anti-Recidivism Coalition (ARC)',
    description:
      'The Anti-Recidivism Coalition provides reentry support, advocacy, and community for formerly and currently incarcerated people in California.',
    what_they_offer:
      '- Reentry support and case management\n- Housing assistance\n- Employment support and job training\n- Education navigation\n- Policy advocacy\n- Community and peer support\n- Leadership development',
    how_to_get_it:
      '1. Contact ARC intake line\n2. Must be currently or formerly incarcerated\n3. Complete intake assessment\n4. Meet with case manager\n5. Develop reentry plan\n6. Access services and join community',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'centerforce-reentry': {
    name: 'Centerforce Reentry Services',
    description:
      'Centerforce provides reentry services and family support for incarcerated individuals and their families, helping maintain connections and prepare for successful reintegration.',
    what_they_offer:
      "- Reentry planning and case management\n- Family visiting programs\n- Children's services and support\n- Housing assistance\n- Employment readiness\n- Connection to community resources",
    how_to_get_it:
      '1. Contact Centerforce for intake\n2. Currently or formerly incarcerated individuals welcome\n3. Family members also eligible\n4. Complete assessment\n5. Access services and support',
    timeframe: 'Ongoing',
    link_text: 'Get Help',
  },
  'lib-001': {
    name: 'Berkeley Tool Lending Library',
    description:
      'The Berkeley Public Library operates the only tool lending library in Northern California, allowing library cardholders to borrow tools for free.',
    what_they_offer:
      '- Power tools (drills, saws, sanders)\n- Lawn and garden equipment\n- Hand tools (hammers, wrenches, screwdrivers)\n- Specialty tools (tile cutters, pipe wrenches)\n- Automotive tools\n- Free to borrow with library card',
    how_to_get_it:
      '1. Get a Berkeley Public Library card (free for residents)\n2. Visit the Tool Lending Library at the South Branch\n3. Browse available tools in person\n4. Check out tools with your library card\n5. Return within the borrowing period (typically 3-7 days)',
    timeframe: 'Ongoing',
    link_text: 'Visit Program',
  },
  'lib-002': {
    name: 'California State Parks Library Pass',
    description:
      "California State Library's Parks Pass program allows library patrons to check out day-use passes for free entry to over 200 state parks.",
    what_they_offer:
      '- Free vehicle day-use entry to 200+ state parks\n- Covers 1 vehicle with up to 9 people or 1 motorcycle\n- Valid at participating state parks statewide\n- Does not cover camping or special events\n- Does not cover museums within parks',
    how_to_get_it:
      "1. Have a valid library card from a participating library\n2. Check your library's website for pass availability\n3. Reserve or check out a parks pass\n4. Bring the pass and your library card to the park\n5. Return pass by the due date",
    timeframe: 'Ongoing (funded through 2026)',
    link_text: 'Visit Program',
  },
  'lib-003': {
    name: 'Calm Meditation App',
    description:
      'San Mateo County Library provides free access to the Calm app, offering guided meditations, sleep stories, and stress management tools.',
    what_they_offer:
      '- Full access to Calm premium features\n- Guided meditations\n- Sleep stories\n- Relaxing music\n- Breathing exercises\n- Stress management courses',
    how_to_get_it:
      '1. Have a San Mateo County Library card\n2. Visit smcl.org/get-calm\n3. Follow instructions to create or link Calm account\n4. Access Calm via web browser or mobile app\n5. Enjoy unlimited access while program continues',
    timeframe: 'Ongoing',
    link_text: 'Visit Program',
  },
  'lib-004': {
    name: 'Discover & Go Museum Passes',
    description:
      'Discover & Go connects library cardholders with free and discounted admission to California museums, zoos, aquariums, and cultural institutions.',
    what_they_offer:
      '- Free or reduced admission to many cultural institutions\n- Museums, zoos, aquariums, gardens, and more\n- Passes cover varying group sizes\n- Available at participating libraries statewide\n- New passes released regularly',
    how_to_get_it:
      '1. Check if your library participates at discoverandgo.org\n2. Log in with your library card\n3. Browse available passes\n4. Reserve a pass for your preferred date\n5. Print or save pass to mobile device\n6. Present pass at venue for entry',
    timeframe: 'Pass release cycles vary',
    link_text: 'Visit Program',
  },
  'lib-005': {
    name: 'Hoopla Digital',
    description:
      'Hoopla is a digital media service that allows library cardholders to borrow movies, TV shows, music, ebooks, audiobooks, and comics for free.',
    what_they_offer:
      '- Streaming movies and TV shows\n- Music albums\n- Ebooks and audiobooks\n- Comics and graphic novels\n- No waitlists—instant access\n- Monthly borrowing limit varies by library',
    how_to_get_it:
      '1. Check if your library offers Hoopla\n2. Download the Hoopla app or visit hoopladigital.com\n3. Create an account using your library card\n4. Browse and borrow content instantly\n5. Content auto-returns after lending period',
    timeframe: 'Ongoing',
    link_text: 'Visit Program',
  },
  'lib-006': {
    name: 'Kanopy',
    description:
      'Kanopy is a free video streaming service for library cardholders offering thoughtful entertainment including films, documentaries, and educational content.',
    what_they_offer:
      '- Thousands of films and documentaries\n- Criterion Collection films\n- Independent and international cinema\n- Great Courses educational videos\n- PBS documentaries\n- Monthly credit system (varies by library)',
    how_to_get_it:
      '1. Check if your library offers Kanopy\n2. Visit kanopy.com and find your library\n3. Sign up with your library card\n4. Stream on web, mobile, or TV apps\n5. Credits refresh monthly',
    timeframe: 'Ongoing',
    link_text: 'Visit Program',
  },
  'lib-007': {
    name: 'New York Times Digital Access',
    description:
      'California State Library provides free digital access to The New York Times for all Californians through participating public libraries.',
    what_they_offer:
      '- Full access to NYTimes.com\n- New York Times Cooking\n- New York Times Games (Wordle, crosswords)\n- Archives back to 1851\n- 72-hour passes, renewable unlimited times',
    how_to_get_it:
      "1. Visit your library's website or the State Library's NYT page\n2. Click the link to access the New York Times\n3. Create a free NYT account or log in\n4. Enjoy 72 hours of full access\n5. Return to library site to renew when pass expires",
    timeframe: '72-hour passes, renewable',
    link_text: 'Visit Program',
  },
  'sfpl-elibrary': {
    name: 'SFPL eLibrary',
    description:
      "San Francisco Public Library's eLibrary provides free digital access to ebooks, audiobooks, databases, learning courses, and streaming content.",
    what_they_offer:
      '- Ebooks and audiobooks (Libby, OverDrive)\n- Digital magazines and newspapers\n- Streaming movies and music\n- LinkedIn Learning courses\n- Research databases\n- Language learning (Mango Languages)',
    how_to_get_it:
      '1. Get a San Francisco Public Library card (free for residents)\n2. Visit sfpl.org/elibrary\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on computer or mobile devices',
    timeframe: 'Ongoing',
    link_text: 'Browse eLibrary',
  },
  'sfpl-digital-collections': {
    name: 'SF Digital Collections',
    description:
      "San Francisco's digital collections provide free access to digitized historical photos, documents, manuscripts, and audiovisual materials from the city's archives.",
    what_they_offer:
      '- Historical photographs of San Francisco\n- Manuscripts and archival documents\n- Maps and ephemera\n- Audiovisual materials\n- Born-digital collections\n- Free to browse without library card',
    how_to_get_it:
      '1. Visit digitalsf.org\n2. Browse or search collections\n3. View and download materials for free\n4. No library card required for access',
    timeframe: 'Ongoing',
    link_text: 'Explore Collections',
  },
  'open-library': {
    name: 'Open Library',
    description:
      'Open Library is a project of the Internet Archive that provides free access to millions of books, with the goal of creating one web page for every book ever published.',
    what_they_offer:
      '- Millions of free ebooks\n- Borrowing system for in-copyright books\n- Read online or download\n- Multiple formats available\n- Community-contributed book data\n- Connect with your local library card',
    how_to_get_it:
      '1. Visit openlibrary.org\n2. Create a free account (or use Internet Archive, Google, or library card)\n3. Browse or search for books\n4. Read online or borrow ebooks\n5. Return borrowed books to allow others to read',
    timeframe: 'Ongoing',
    link_text: 'Browse Library',
  },
  'libby-app': {
    name: 'Libby by OverDrive',
    description:
      "Libby is the free reading app from OverDrive that connects library cardholders to their library's collection of ebooks, audiobooks, and magazines.",
    what_they_offer:
      "- Ebooks from your library's collection\n- Audiobooks for on-the-go listening\n- Digital magazines\n- Sync across devices\n- Read offline\n- Works with multiple library cards",
    how_to_get_it:
      "1. Download the free Libby app (iOS or Android)\n2. Open the app and find your library\n3. Sign in with your library card number\n4. Browse and borrow from your library's collection\n5. Books automatically return—no late fees",
    timeframe: 'Ongoing',
    link_text: 'Get Libby',
  },
  'california-digital-newspaper-collection': {
    name: 'California Digital Newspaper Collection',
    description:
      'The California Digital Newspaper Collection provides free access to digitized California newspapers from 1846 to the present for historical research.',
    what_they_offer:
      '- Digitized California newspapers from 1846-present\n- Searchable full text\n- Historical newspapers from across the state\n- Free to access without library card\n- High-quality scans of original pages',
    how_to_get_it:
      '1. Visit cdnc.ucr.edu\n2. Search by keyword, date, or location\n3. Browse available newspaper titles\n4. View and download pages for free\n5. No registration or library card required',
    timeframe: 'Ongoing',
    link_text: 'Search Newspapers',
  },
  'career-online-high-school': {
    name: 'Career Online High School',
    description:
      'Career Online High School is a free program through participating California libraries that allows adults to earn an accredited high school diploma and career certificate.',
    what_they_offer:
      '- Accredited high school diploma\n- Career certificate in your chosen field\n- Career portfolio with resume and cover letter\n- Academic coach support\n- Self-paced online learning\n- 8 career certificate tracks available',
    how_to_get_it:
      '1. Must be 19+ years old (or 18 in some libraries)\n2. Have a library card in good standing at a participating library\n3. Complete the prerequisite courses (free orientation)\n4. Apply to the program\n5. If accepted, complete coursework online\n6. Graduate with diploma and career certificate',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'online-archive-of-california': {
    name: 'Online Archive of California',
    description:
      'The Online Archive of California provides free access to finding aids and primary source collections from over 200 California libraries, archives, and museums.',
    what_they_offer:
      '- Finding aids to archival collections\n- Primary source materials\n- Collections from 200+ institutions\n- Photographs and documents\n- Historical records\n- Free to search and browse',
    how_to_get_it:
      '1. Visit oac.cdlib.org\n2. Search or browse collections by topic or institution\n3. Find detailed descriptions of archival materials\n4. Identify materials of interest\n5. Contact holding institution for access to originals',
    timeframe: 'Ongoing',
    link_text: 'Browse Collections',
  },
  'alameda-county-library-digital': {
    name: 'Alameda County Library Digital Resources',
    description:
      'Alameda County Library provides free digital resources including ebooks, audiobooks, databases, and online learning for cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming video and music\n- Online databases and research tools\n- Learning platforms (LinkedIn Learning, etc.)\n- Magazines and newspapers\n- Language learning resources',
    how_to_get_it:
      '1. Get an Alameda County Library card (free for residents)\n2. Visit aclibrary.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'oakland-library-digital': {
    name: 'Oakland Public Library Digital Resources',
    description:
      'Oakland Public Library provides free digital resources including ebooks, audiobooks, streaming media, and learning platforms for Oakland cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks\n- Streaming movies and music\n- Online learning courses\n- Research databases\n- Magazines and newspapers\n- Language learning',
    how_to_get_it:
      '1. Get an Oakland Public Library card (free for Oakland residents)\n2. Visit oaklandlibrary.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'san-mateo-county-library-digital': {
    name: 'San Mateo County Library Digital Resources',
    description:
      'San Mateo County Library offers free digital resources including ebooks, audiobooks, streaming content, and online learning for all cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming video (Kanopy)\n- Calm meditation app access\n- LinkedIn Learning\n- Research databases\n- Digital magazines',
    how_to_get_it:
      '1. Get a San Mateo County Library card (free for residents)\n2. Visit smcl.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'peninsula-library-digital': {
    name: 'Peninsula Library System E-Services',
    description:
      'Peninsula Library System provides e-services and digital resources for cardholders from member libraries throughout San Mateo County.',
    what_they_offer:
      '- Shared digital collections\n- Ebooks and audiobooks\n- Research databases\n- Interlibrary loan services\n- Digital reference services',
    how_to_get_it:
      '1. Have a library card from a PLS member library\n2. Visit plsinfo.org/e-services\n3. Browse available resources\n4. Sign in with your library card\n5. Access content online',
    timeframe: 'Ongoing',
    link_text: 'Browse E-Services',
  },
  'contra-costa-library-digital': {
    name: 'Contra Costa County Library Digital Resources',
    description:
      'Contra Costa County Library provides free digital resources including ebooks, audiobooks, streaming media, and learning platforms for cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming movies and TV\n- Online learning platforms\n- Research databases\n- Digital magazines and newspapers\n- Language learning resources',
    how_to_get_it:
      '1. Get a Contra Costa County Library card (free for residents)\n2. Visit ccclib.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'sfpl-services': {
    name: 'San Francisco Public Library Services',
    description:
      'San Francisco Public Library offers a wide range of free services and programs beyond just books, including digital resources, programs, and community offerings.',
    what_they_offer:
      '- Digital resources (eBooks, streaming, databases)\n- Technology lending (laptops, WiFi hotspots)\n- Free programs and events\n- Homework help and tutoring\n- Job search assistance\n- Social worker services',
    how_to_get_it:
      '1. Get a San Francisco Public Library card (free)\n2. Visit sfpl.org/services\n3. Explore available services\n4. Many services available online or in-person\n5. Some programs require registration',
    timeframe: 'Ongoing',
    link_text: 'Browse Services',
  },
  'santa-clara-county-library-digital': {
    name: 'Santa Clara County Library Digital Resources',
    description:
      'Santa Clara County Library District offers free digital resources including ebooks, audiobooks, streaming content, and online learning for cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming movies and music\n- Online learning (LinkedIn Learning, Coursera)\n- Research databases\n- Digital magazines\n- Language learning resources',
    how_to_get_it:
      '1. Get a Santa Clara County Library card (free for residents)\n2. Visit sccld.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'marin-county-library-digital': {
    name: 'Marin County Free Library Digital Resources',
    description:
      'Marin County Free Library provides free digital resources including ebooks, audiobooks, streaming media, and learning platforms for cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming video and music\n- Online learning platforms\n- Research databases\n- Digital magazines and newspapers\n- Language learning',
    how_to_get_it:
      '1. Get a Marin County Free Library card (free for residents)\n2. Visit marinlibrary.org/resource\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'sonoma-county-library-digital': {
    name: 'Sonoma County Library eLibrary',
    description:
      'Sonoma County Library provides free eLibrary resources including ebooks, audiobooks, streaming content, and online learning for all cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming movies and music\n- Online learning platforms\n- Research databases\n- Digital magazines\n- Homework help resources',
    how_to_get_it:
      '1. Get a Sonoma County Library card (free for residents)\n2. Visit sonomalibrary.org/elibrary\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse eLibrary',
  },
  'solano-county-library-digital': {
    name: 'Solano County Library 24/7 Digital Library',
    description:
      'Solano County Library provides 24/7 digital library resources including ebooks, audiobooks, streaming media, and online learning for cardholders.',
    what_they_offer:
      '- Ebooks and audiobooks via Libby\n- Streaming video and music\n- Online learning platforms\n- Research databases\n- Digital magazines and newspapers\n- Available 24/7',
    how_to_get_it:
      '1. Get a Solano County Library card (free for residents)\n2. Visit solanolibrary.com/247-digital-library\n3. Browse available digital resources\n4. Sign in with your library card\n5. Access content anytime, on any device',
    timeframe: 'Ongoing',
    link_text: 'Browse Digital Library',
  },
  'napa-county-library-databases': {
    name: 'Napa County Library Databases',
    description:
      'Napa County Library provides free access to research databases and digital resources for all cardholders.',
    what_they_offer:
      '- Research databases\n- Ebooks and audiobooks\n- Digital magazines and newspapers\n- Learning resources\n- Consumer and business information\n- Genealogy databases',
    how_to_get_it:
      "1. Get a Napa County Library card (free for residents)\n2. Visit the library's databases page\n3. Browse available resources\n4. Sign in with your library card\n5. Access content on any device",
    timeframe: 'Ongoing',
    link_text: 'Browse Databases',
  },
  'banfield-foundation': {
    name: 'Banfield Foundation - Pet Owner Resources',
    description:
      'The Banfield Foundation is a nonprofit that helps pets and the people who love them by providing resources, grants, and support to pet owners facing financial hardship.',
    what_they_offer:
      '- Comprehensive directory of financial assistance programs\n- Pet food bank locations nationwide\n- Low-cost veterinary service locator\n- Emergency pet care resources\n- Information on keeping pets during housing transitions',
    how_to_get_it:
      '1. Visit the Banfield Foundation website\n2. Use the resource directory to find assistance in your area\n3. Filter by type of help needed (food, vet care, housing, etc.)\n4. Contact listed organizations directly for assistance',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'bebhs-spay-bay': {
    name: 'Berkeley-East Bay Humane Society - Spay the Bay',
    description:
      "Berkeley-East Bay Humane Society's Spay the Bay program provides affordable spay/neuter services to help reduce pet overpopulation in the East Bay.",
    what_they_offer:
      '- Low-cost spay and neuter surgeries\n- Vaccinations at reduced prices\n- Microchipping services\n- Services for cats and dogs\n- Additional discounts for low-income residents',
    how_to_get_it:
      '1. Visit the Spay the Bay website\n2. Check eligibility for low-income discounts (if applicable)\n3. Schedule an appointment online or by phone\n4. Bring your pet to the scheduled appointment\n5. Pay the reduced fee at time of service',
    timeframe: 'Ongoing',
    link_text: 'Schedule',
  },
  'hssv-pet-pantry': {
    name: 'HSSV Pet Pantry',
    description:
      "The Humane Society Silicon Valley's Pet Pantry program helps families keep their pets by providing free pet food during times of financial hardship.",
    what_they_offer:
      '- Free dog and cat food\n- Pet supplies when available\n- No proof of income required\n- Pick up every 30 days\n- Helps families avoid surrendering pets due to cost',
    how_to_get_it:
      '1. Must be a Santa Clara County resident\n2. Visit the HSSV Pet Pantry during distribution hours\n3. Bring ID showing Santa Clara County address\n4. Receive up to 30 days of food per visit\n5. Return monthly as needed',
    timeframe: 'Every 30 days',
    link_text: 'Learn More',
  },
  'humane-world': {
    name: 'Humane World',
    description:
      "Humane World provides a comprehensive directory of resources for pet owners who are struggling to afford their pet's care, helping keep families and pets together.",
    what_they_offer:
      '- Directory of pet financial assistance programs\n- List of veterinary payment plan providers\n- Pet insurance information\n- Low-cost vet clinic locator\n- Resources organized by state and type of assistance',
    how_to_get_it:
      '1. Visit the Humane World website\n2. Navigate to the financial assistance section\n3. Browse resources by location or type of help needed\n4. Contact listed organizations directly',
    timeframe: 'Ongoing',
    link_text: 'Browse Resources',
  },
  'joybound-vet-care': {
    name: 'Joybound People & Pets - Community Veterinary Care',
    description:
      "Joybound People & Pets (formerly Tony La Russa's ARF) provides low-cost veterinary care to help Contra Costa County residents keep their pets healthy.",
    what_they_offer:
      '- Low-cost medical exams and treatments\n- Vaccinations at reduced prices\n- Basic diagnostic services\n- Care for dogs and cats\n- Income-based pricing available',
    how_to_get_it:
      '1. Must be a Contra Costa County resident\n2. Contact Joybound to verify eligibility\n3. Provide proof of income if applying for reduced rates\n4. Schedule appointment for your pet\n5. Pay reduced fee at time of service',
    timeframe: 'Ongoing',
    link_text: 'Contact',
  },
  'joybound-pet-food': {
    name: 'Joybound People & Pets - Free Pet Food',
    description:
      "Joybound's pet food assistance program helps Contra Costa County families keep their pets by providing free food during financial hardship.",
    what_they_offer:
      '- Free dog food\n- Free cat food\n- Pet supplies when available\n- No-judgment assistance\n- Helps prevent pet surrender due to cost',
    how_to_get_it:
      '1. Must be a Contra Costa County resident\n2. Contact Joybound to request assistance\n3. Provide basic information about your pets\n4. Arrange pickup or delivery of food',
    timeframe: 'Ongoing',
    link_text: 'Contact',
  },
  'joybound-vaccinations': {
    name: 'Joybound People & Pets - Free Vaccination Clinics',
    description:
      'Joybound holds free vaccination clinics throughout Contra Costa County to help ensure all pets have access to essential preventive care.',
    what_they_offer:
      '- Free rabies vaccinations\n- Free DHPP/FVRCP vaccines\n- Microchipping at low or no cost\n- No appointment needed at clinics\n- Multiple clinic locations across the county',
    how_to_get_it:
      '1. Check the Joybound website for upcoming clinic dates and locations\n2. Bring your pet to the clinic during scheduled hours\n3. No appointment or proof of income required\n4. Wait in line for service (first come, first served)',
    timeframe: 'Monthly',
    link_text: 'Find Clinic',
  },
  'joybound-pet-safety-net': {
    name: 'Joybound People & Pets - Pet Safety Net',
    description:
      "Joybound's Pet Safety Net provides emergency resources to help families keep their pets during times of crisis or financial hardship.",
    what_they_offer:
      '- Emergency pet food assistance\n- Veterinary care financial assistance\n- Pet supplies (leashes, bowls, beds)\n- Temporary foster care during emergencies\n- Counseling to prevent pet surrender',
    how_to_get_it:
      '1. Must be a Contra Costa County resident\n2. Contact Joybound to explain your situation\n3. Staff will assess needs and available resources\n4. Receive assistance based on availability and need',
    timeframe: 'As needed',
    link_text: 'Get Help',
  },
  'joybound-spay-neuter': {
    name: 'Joybound People & Pets - Spay/Neuter Clinic',
    description:
      'Joybound offers low-cost spay and neuter services to help reduce pet overpopulation and keep pets healthy.',
    what_they_offer:
      '- Low-cost spay surgeries\n- Low-cost neuter surgeries\n- Services for dogs and cats\n- Additional discounts for income-qualified residents\n- Pre-surgery health check included',
    how_to_get_it:
      '1. Contact Joybound to schedule an appointment\n2. Provide proof of income for discounted rates (if applicable)\n3. Follow pre-surgery instructions\n4. Bring pet to scheduled appointment\n5. Pay reduced fee at time of service',
    timeframe: 'Ongoing',
    link_text: 'Schedule',
  },
  'marin-humane-pet-care': {
    name: 'Marin Humane Society - Pet Care Assistance',
    description:
      'Marin Humane Society provides pet care assistance to help vulnerable Marin County residents keep and care for their pets.',
    what_they_offer:
      '- Pet Meals on Wheels (food delivery for homebound seniors)\n- Financial assistance for veterinary care\n- Pet food pantry\n- Services for people living with HIV/AIDS\n- Support for hospice recipients',
    how_to_get_it:
      '1. Contact Marin Humane Society to inquire about assistance\n2. Must be a Marin County resident\n3. Explain your situation and needs\n4. Provide documentation as required (age, income, medical status)\n5. Receive assistance based on program eligibility',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'muttville-cuddle-club': {
    name: 'Muttville Senior Dog Rescue - Cuddle Club',
    description:
      "Muttville's Cuddle Club brings the joy of dogs to seniors 62+ through free events where they can spend time with gentle senior dogs—no adoption required.",
    what_they_offer:
      "- Free cuddle time with senior dogs\n- Social events for seniors 62+\n- Therapeutic animal interaction\n- No commitment or adoption required\n- Events at senior centers and Muttville's office",
    how_to_get_it:
      "1. Must be 62 years or older\n2. Check Muttville's website for upcoming Cuddle Club events\n3. Register for an event if required\n4. Attend and enjoy time with the dogs\n5. No cost or obligation",
    timeframe: 'Ongoing',
    link_text: 'Find Event',
  },
  'muttville-seniors-for-seniors': {
    name: 'Muttville Senior Dog Rescue - Seniors for Seniors',
    description:
      "Muttville's Seniors for Seniors program offers free adoptions of senior dogs (7+ years) to seniors 62 and older, helping both seniors and dogs find companionship.",
    what_they_offer:
      "- Free adoption of senior dogs (7 years and older)\n- All dogs are spayed/neutered and vaccinated\n- Behavioral assessment completed\n- Ongoing support after adoption\n- Return policy if it doesn't work out",
    how_to_get_it:
      "1. Must be 62 years or older\n2. Visit Muttville's website to view adoptable senior dogs\n3. Complete an adoption application\n4. Meet with dogs at Muttville or adoption events\n5. Take home your new companion at no cost",
    timeframe: 'Ongoing',
    link_text: 'Adopt',
  },
  'phs-mobile-spay-neuter': {
    name: 'Peninsula Humane Society - Mobile Spay/Neuter Van',
    description:
      "Peninsula Humane Society's mobile spay/neuter van travels throughout San Mateo County providing accessible, low-cost sterilization services.",
    what_they_offer:
      '- Free or low-cost spay/neuter surgeries\n- Services for cats and dogs\n- Mobile van visits different neighborhoods\n- Additional services may include vaccines\n- Income-qualified pricing available',
    how_to_get_it:
      '1. Check the PHS website for mobile van schedule and locations\n2. Call to schedule an appointment\n3. Provide proof of income for free services (if applicable)\n4. Bring pet to scheduled location on appointment day',
    timeframe: 'By appointment',
    link_text: 'Schedule',
  },
  'phs-vaccine-clinics': {
    name: 'Peninsula Humane Society SPCA Low-Cost Vaccine Clinics',
    description:
      'Peninsula Humane Society & SPCA offers regular low-cost vaccine clinics providing essential preventive care for dogs and cats.',
    what_they_offer:
      '- Low-cost vaccinations (rabies, DHPP, FVRCP)\n- Microchipping services\n- Nail trims\n- No appointment needed for most services\n- Both dog and cat services available',
    how_to_get_it:
      '1. Check the PHS website for vaccine clinic schedule\n2. Arrive during clinic hours (first come, first served)\n3. Bring pet and payment (cash or card)\n4. Complete brief intake form\n5. Wait for services',
    timeframe: 'Monthly',
    link_text: 'Schedule',
  },
  'pet-help-finder': {
    name: 'Pet Help Finder',
    description:
      'Pet Help Finder is a searchable database that helps pet owners locate low-cost veterinary services and financial assistance programs by zip code.',
    what_they_offer:
      '- Searchable database of low-cost vet clinics\n- Financial assistance program listings\n- Pet food bank locations\n- Emergency assistance resources\n- Results customized by location',
    how_to_get_it:
      '1. Visit pethelpfinder.org\n2. Enter your zip code\n3. Select the type of help you need\n4. Browse results for your area\n5. Contact providers directly for services',
    timeframe: 'Ongoing',
    link_text: 'Search',
  },
  'pets-in-need': {
    name: 'Pets in Need - Low-Cost Vet Services',
    description:
      'Pets in Need operates a community veterinary clinic in Redwood City providing affordable care to help families keep their pets healthy.',
    what_they_offer:
      '- Low-cost wellness exams\n- Spay and neuter surgeries\n- Vaccinations and preventive care\n- Microchipping\n- Basic medical treatments\n- Additional discounts for income-qualified',
    how_to_get_it:
      "1. Visit the Pets in Need website or call for appointment\n2. Schedule your pet's appointment\n3. Bring proof of income for discounted rates (if applicable)\n4. Pay reduced fees at time of service",
    timeframe: 'Ongoing',
    link_text: 'Schedule',
  },
  'pets-of-homeless': {
    name: 'Pets of the Homeless',
    description:
      'Pets of the Homeless is a nonprofit providing free veterinary care and pet food to pets of people experiencing homelessness.',
    what_they_offer:
      '- Free veterinary care through participating providers\n- Free pet food at distribution sites\n- Emergency veterinary assistance\n- Directory of homeless-friendly pet resources\n- No proof of homelessness required at most sites',
    how_to_get_it:
      '1. Visit petsofthehomeless.org\n2. Use the locator to find participating providers near you\n3. Contact the provider directly for services\n4. Bring your pet during operating hours\n5. Most services are first come, first served',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'sf-spca-community-clinic': {
    name: 'San Francisco SPCA - Community Clinic',
    description:
      "The SF SPCA's Community Clinic provides affordable preventative care to help all San Francisco pets stay healthy.",
    what_they_offer:
      '- Affordable wellness exams\n- Vaccinations at reduced prices\n- Parasite prevention (flea, tick, heartworm)\n- Treatment for minor conditions\n- Microchipping services',
    how_to_get_it:
      '1. Call or book online for an appointment\n2. Income verification not required but discounts available\n3. Bring your pet to the clinic at scheduled time\n4. Pay affordable fees at time of service',
    timeframe: 'Ongoing',
    link_text: 'Schedule',
  },
  'sf-spca-spay-neuter': {
    name: 'San Francisco SPCA - Spay/Neuter',
    description:
      'The SF SPCA offers affordable spay and neuter services with tiered pricing to make sterilization accessible to all San Francisco residents.',
    what_they_offer:
      '- Tiered pricing based on ability to pay\n- Spay and neuter for dogs and cats\n- All surgeries include pain medication\n- Post-operative care instructions\n- Some free services for SF residents in need',
    how_to_get_it:
      '1. Must be a San Francisco resident\n2. Call or visit the website to learn about pricing tiers\n3. Schedule an appointment\n4. Bring proof of SF residency\n5. Pay based on your tier at time of service',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'sf-aid-for-animals': {
    name: 'SF Aid for Animals (SFAFA)',
    description:
      'SF Aid for Animals provides financial assistance for urgent veterinary care to low-income Bay Area residents, helping them avoid having to surrender or euthanize pets due to cost.',
    what_they_offer:
      '- Financial grants for urgent veterinary care\n- Assistance with life-saving procedures\n- Works with participating veterinary hospitals\n- Covers portion of vet bills based on need\n- Helps prevent economic euthanasia',
    how_to_get_it:
      '1. Must be a Bay Area resident\n2. Must demonstrate financial need\n3. Pet must be treated at a participating veterinary hospital\n4. Apply through the SFAFA website\n5. Hospital will work with SFAFA on payment',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'the-pet-fund': {
    name: 'The Pet Fund',
    description:
      'The Pet Fund provides financial assistance for non-basic, non-emergency veterinary care to pet owners who cannot afford treatment.',
    what_they_offer:
      '- Financial assistance for non-emergency vet care\n- Help with ongoing treatment costs\n- Covers conditions like diabetes, cancer treatment, etc.\n- Does NOT cover routine care or emergencies\n- Waitlist may apply',
    how_to_get_it:
      '1. Visit thepetfund.com to apply\n2. Complete the application form\n3. Provide documentation of financial need\n4. Provide veterinary estimate for needed care\n5. Wait for approval (waitlist common)\n6. If approved, funds sent to veterinarian',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'vet-billing': {
    name: 'Vet Billing - Payment Plans',
    description:
      'Vet Billing maintains a directory of veterinary practices that offer payment plans or financing options, helping pet owners manage veterinary costs over time.',
    what_they_offer:
      "- Directory of vets offering payment plans\n- Information on veterinary financing options\n- Searchable by location\n- Details on each vet's payment policies",
    how_to_get_it:
      '1. Visit vetbilling.com\n2. Enter your location to search\n3. Browse list of participating veterinarians\n4. Contact vets directly to discuss payment options\n5. Arrange payment plan at time of service',
    timeframe: 'Ongoing',
    link_text: 'Search',
  },
  'vetco-clinics': {
    name: 'VETCO Clinics',
    description:
      'VETCO operates walk-in vaccination clinics inside Petco stores, providing convenient and affordable preventive care for dogs and cats.',
    what_they_offer:
      '- Affordable vaccinations\n- Microchipping services\n- Heartworm testing\n- Flea and tick prevention\n- No appointment needed\n- Located inside Petco stores',
    how_to_get_it:
      '1. Visit vetcoclinics.com to find a clinic near you\n2. Check the schedule for your local Petco\n3. Walk in during clinic hours (no appointment needed)\n4. Complete a brief health form\n5. Pay affordable fees at time of service',
    timeframe: 'Weekly',
    link_text: 'Find Location',
  },
  'vip-petcare': {
    name: 'VIP Petcare',
    description:
      'VIP Petcare provides walk-in wellness clinics at pet stores throughout Northern California, offering affordable preventive care without the need for an appointment.',
    what_they_offer:
      '- Walk-in vaccination clinics\n- Microchipping\n- Health testing (heartworm, FeLV/FIV)\n- Flea and tick prevention\n- No exam fee for most services\n- Weekend hours available',
    how_to_get_it:
      '1. Visit vippetcare.com to find a clinic location\n2. Check the schedule for your preferred location\n3. Walk in during clinic hours (no appointment needed)\n4. Bring your pet and wait for service\n5. Pay at time of service',
    timeframe: 'Weekly',
    link_text: 'Find Clinic',
  },
  'imls-aircraft-carrier-hornet-foundation': {
    name: 'Aircraft Carrier Hornet Foundation',
    description: 'Museum dedicated to preserving and presenting local and regional history.',
  },
  'ca-sp-albany-smr': {
    name: 'Albany SMR',
    description:
      "Albany SMR is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'nps-alca': {
    name: 'Alcatraz Island',
    description:
      "Alcatraz Island, home to the infamous former federal penitentiary. Take a ferry to explore the cellhouse, gardens, and learn about the island's rich history from Civil War fort to Native American occupation.",
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'imls-alexander-f-morrison-planetarium': {
    name: 'Alexander F. Morrison Planetarium',
    description:
      'Part of California Academy of Sciences, Morrison Planetarium is the largest all-digital dome in the world featuring stunning visualizations of the cosmos.',
  },
  'america-the-beautiful-pass': {
    name: 'America the Beautiful — NPS Pass',
    description:
      'The National Park Service offers lifetime and annual passes providing access to over 2,000 federal recreation sites across the United States, including national parks, wildlife refuges, and forests.',
    what_they_offer:
      '- Senior Pass (62+): $80 lifetime or $20 annual pass\n- Military Pass: Free annual pass for active duty and dependents\n- Access Pass: Free lifetime pass for persons with permanent disabilities\n- All passes cover entrance fees and standard amenity fees',
    how_to_get_it:
      'Purchase online at recreation.gov, by phone at 1-888-275-8747, or in person at any federal recreation site that charges entrance fees. Access Pass requires documentation of permanent disability.',
    timeframe: 'Ongoing',
    link_text: 'Get Pass',
  },
  'imls-american-bookbinders-museum': {
    name: 'American Bookbinders Museum',
    description:
      'The only museum of its kind in North America, showcasing the artistry, history, and craft of bookbinding from the 1600s to present.',
  },
  'imls-anderson-art-collection': {
    name: 'Anderson Art Collection',
    description:
      'Private collection of 20th century American art available through tours and loans to museums worldwide.',
  },
  'ca-sp-angel-island-sp': {
    name: 'Angel Island SP',
    description:
      "Angel Island State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-ano-nuevo-sp': {
    name: 'Ano Nuevo SP',
    description:
      "Ano Nuevo State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-antioch-dunes-national-wildlife-refuge': {
    name: 'Antioch Dunes National Wildlife Refuge',
    description:
      "Antioch Dunes National Wildlife Refuge is the only national wildlife refuge in the country established to protect endangered plants and insects – the Antioch Dunes evening primrose, the Contra Costa wallflower, and the Lange's metalmark butterfly. Created in 1980, the 55-acre refuge was once part of a larger sand dune system that stretched two miles along the southern bank of the San Joaquin River east of the City of Antioch. The sand dunes were formed by ancient deposits of glacial sands carrie",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'aquarium-of-bay': {
    name: 'Aquarium of the Bay',
    description:
      'Aquarium of the Bay is a nonprofit aquarium located on Pier 39 in San Francisco, dedicated to protecting, restoring, and inspiring conservation of San Francisco Bay and its watershed. The aquarium features over 20,000 local marine animals including sharks, rays, jellyfish, and river otters.',
    what_they_offer:
      '- Bay Area residents: $5 off general admission with local ID\n- Military discount: 10% off for active duty, veterans, and families\n- EBT/Museums for All: Reduced admission (check current rates)\n- Children under 3: Free admission\n- Annual passes available with unlimited visits',
    how_to_get_it:
      'Purchase tickets at the door or online. Bring valid Bay Area ID for local discount, military ID for military discount, or EBT card for Museums for All pricing. Discounts cannot be combined.',
    timeframe: 'Ongoing',
    link_text: 'Get Tickets',
  },
  'ca-sp-armstrong-redwoods-snr': {
    name: 'Armstrong Redwoods SNR',
    description:
      "Armstrong Redwoods State Natural Reserve is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-art-works-downtown': {
    name: 'Art Works Downtown',
    description:
      'Nonprofit art center featuring 4 galleries, 27 art studios, and rotating exhibits by Bay Area artists.',
  },
  'imls-arts-benicia': {
    name: 'Arts Benicia',
    description:
      'Community-based visual arts center providing classes, exhibitions, and networking for artists.',
  },
  'asian-art-museum': {
    name: 'Asian Art Museum',
    description:
      "The Asian Art Museum of San Francisco houses one of the world's most comprehensive collections of Asian art, spanning 6,000 years of history with over 18,000 artworks from across the Asian continent.",
    what_they_offer:
      '- Free admission: First Sundays each month for everyone\n- Museums for All: $1 admission for EBT cardholders + guests\n- Seniors (65+): $12 admission (regularly $20)\n- Students with ID: $12 admission\n- Military/Veterans: Free admission with valid ID\n- Children under 6: Always free\n- SF residents: Free admission on select Thursdays',
    how_to_get_it:
      'Visit the museum and present your EBT card, student ID, military ID, or proof of age at the admissions desk. Check the website for free day schedules and any advance reservation requirements.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'ca-sp-austin-creek-sra': {
    name: 'Austin Creek SRA',
    description:
      "Austin Creek State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-bale-grist-mill-shp': {
    name: 'Bale Grist Mill SHP',
    description:
      "Bale Grist Mill State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'bay-area-discovery-museum': {
    name: 'Bay Area Discovery Museum',
    description:
      "The Bay Area Discovery Museum is a hands-on children's museum nestled at the foot of the Golden Gate Bridge in Sausalito, featuring indoor and outdoor exhibits designed to spark creativity and curiosity in children ages 0-10.",
    what_they_offer:
      '- EBT/WIC cardholders: $5 admission per person\n- Caregivers of visitors with disabilities: Free admission\n- Pay-What-You-Can days: Admission at any price you choose\n- Members: Unlimited free visits year-round\n- Children under 1: Free admission\n- Regular admission: $18 per person',
    how_to_get_it:
      'For EBT/WIC discount, show your benefits card at the admissions desk. Check the museum website for scheduled Pay-What-You-Can days. Advance reservations recommended for all visits.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-u-s-army-corps-of-engineers-bay-model-visitor-cent': {
    name: 'Bay Model Visitor Center',
    description:
      'Free federal visitor center featuring a 1.5-acre hydraulic model of San Francisco Bay and Sacramento-San Joaquin Delta.',
  },
  'daly-city-bayshore-community-center': {
    name: 'Bayshore Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'ca-sp-bean-hollow-sb': {
    name: 'Bean Hollow SB',
    description:
      "Bean Hollow State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-benicia-capitol-shp': {
    name: 'Benicia Capitol SHP',
    description:
      "Benicia Capitol State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-benicia-sra': {
    name: 'Benicia SRA',
    description:
      "Benicia State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-bethany-reservoir-sra': {
    name: 'Bethany Reservoir SRA',
    description:
      "Bethany Reservoir State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-fac-boat-in-sites-lake-sonoma': {
    name: 'BOAT-IN SITES (LAKE SONOMA)',
    description:
      "Overview Lake Sonoma's Boat-In Sites are scattered around beautiful Lake Sonoma, only a 45-minute drive north of Santa Rosa and a two-hour drive from San Francisco. BOAT-IN CAMPGROUNDS ARE ACCESSIBLE BY WATER OR HIKING ONLY, THERE IS NO VEHICLE ACCESS TO ANY BOAT-IN CAMPGROUND World famous vineyards and a land rich in history surround the lake, where visitors enjoy boating, fishing and exploring the area's extensive trail network. Recreation The lake provides great boating and swimming opportuni",
    what_they_offer: 'Campground at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'imls-bolinas-museum': {
    name: 'Bolinas Museum',
    description:
      'Premier fine arts museum in Marin County, dedicated to collecting, preserving and exhibiting the art and history of coastal Marin. Free admission.',
  },
  'ca-sp-bothe-napa-valley-sp': {
    name: 'Bothe Napa Valley SP',
    description:
      "Bothe Napa Valley State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'brisbane-brisbane-community-pool': {
    name: 'Brisbane Community Pool',
    description:
      'Public swimming pool offering recreational swimming, lap lanes, and swim programs for residents of all ages.',
  },
  'daly-city-broadmoor-community-center': {
    name: 'Broadmoor Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'ca-sp-burleigh-h-murray-ranch-prop': {
    name: 'Burleigh H Murray Ranch Prop',
    description:
      "Burleigh H Murray Ranch Prop is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-butano-sp': {
    name: 'Butano SP',
    description:
      "Butano State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-c-e-smith-museum-of-anthropology': {
    name: 'C. E. Smith Museum of Anthropology',
    description:
      'Teaching museum at Cal State East Bay demonstrating human diversity and the range of human achievement throughout the world. Free admission.',
  },
  'cal-academy': {
    name: 'California Academy of Sciences',
    description:
      'The California Academy of Sciences in Golden Gate Park is a world-class scientific and cultural institution featuring a natural history museum, aquarium, planetarium, and rainforest all under one living roof.',
    what_they_offer:
      '- Museums for All: $3 per person with EBT card\n- SF Resident Free Days: Free admission for SF residents (check schedule)\n- Neighborhood Free Days: Free for specific SF zip codes (rotating)\n- Children under 3: Always free\n- Regular admission: $34-39 for adults',
    how_to_get_it:
      'For Museums for All, present your EBT card and photo ID at the admissions desk. For SF Resident Free Days, bring proof of residence. Reservations are required for all visits - book online in advance.',
    timeframe: 'Ongoing',
    link_text: 'Reserve Tickets',
  },
  'ca-state-parks-adventure-pass': {
    name: 'California State Parks Adventure Pass',
    description:
      "California State Parks offers free access to fourth graders and their families as part of the Every Kid Outdoors initiative, encouraging young people to explore the state's natural and cultural heritage.",
    what_they_offer:
      '- Free day-use passes to 54 participating state parks\n- Valid for fourth graders at California public schools\n- Covers the student and their family members',
    how_to_get_it:
      'Apply online through Reserve California. Fourth graders at public schools can register with their school information to receive passes.',
    timeframe: 'Ongoing (funded through 2026)',
    link_text: 'Apply',
  },
  'ca-state-parks-disabled-discount': {
    name: 'California State Parks Disabled Discount Pass',
    description:
      'California State Parks provides lifetime access to residents with permanent disabilities, making outdoor recreation more accessible and affordable for all Californians.',
    what_they_offer:
      '- Lifetime pass for individuals with permanent disabilities\n- 50% discount on vehicle day-use fees\n- 50% discount on family camping fees\n- 50% discount on boat-use fees at state parks',
    how_to_get_it:
      "Apply online or by mail through California State Parks. You'll need to provide proof of California residency and documentation of permanent disability from a licensed physician or government agency.",
    timeframe: 'Lifetime',
    link_text: 'Apply',
  },
  'ca-state-parks-distinguished-veteran': {
    name: 'California State Parks Distinguished Veteran Pass',
    description:
      'California honors its veterans with free lifetime access to state parks for those who meet distinguished service requirements, recognizing their sacrifice and service to our country.',
    what_they_offer:
      '- Free lifetime pass to California state parks\n- Covers vehicle day-use fees at all state parks\n- Includes free camping at all state park campgrounds\n- Free boat-use fees at participating locations',
    how_to_get_it:
      'Apply through California State Parks with proof of honorable discharge and eligibility. Qualifying criteria include Medal of Honor recipients, former POWs, and veterans with service-connected disabilities rated 50% or higher.',
    timeframe: 'Lifetime',
    link_text: 'Apply',
  },
  'ca-sp-candlestick-point-sra': {
    name: 'Candlestick Point SRA',
    description:
      "Candlestick Point State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'cartoon-art-museum': {
    name: 'Cartoon Art Museum',
    description:
      "The Cartoon Art Museum is one of only a handful of museums in the United States dedicated to the art of cartoons, animation, and comics. Located in San Francisco's Fisherman's Wharf, it celebrates the history and cultural impact of cartoon art.",
    what_they_offer:
      '- EBT/SNAP/Medi-Cal: Free or reduced admission\n- Pay-What-You-Wish days: Admission at your chosen price\n- Students with ID: $8 admission\n- Seniors (65+): $8 admission\n- Military: Discounted admission with valid ID\n- Children under 5: Free\n- Regular admission: $12 for adults',
    how_to_get_it:
      'Present your benefits card, student ID, or military ID at admission. Check the museum website for Pay-What-You-Wish day schedule. Advance tickets recommended but walk-ins welcome.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'recgov-cedar-roughs-wilderness': {
    name: 'Cedar Roughs Wilderness',
    description:
      'Overview The Cedar Roughs Wilderness now contains a total of 6,287 acres and is managed by the Bureau of Land Management. All of the Wilderness is in the state of California. In 2006 the Cedar Roughs Wilderness became part of the now over 109 million acre National Wilderness Preservation System. In wilderness, you can enjoy challenging recreational activities and extraordinary opportunities for solitude. In an age of "...increasing population, accompanied by expanding settlement and growing mech',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'chabot-space-center': {
    name: 'Chabot Space & Science Center',
    description:
      'Chabot Space & Science Center in the Oakland hills features interactive space science exhibits, planetarium shows, and three historic telescopes offering free public viewing nights. The center inspires curiosity about the universe and our place in it.',
    what_they_offer:
      '- EBT cardholders: $5 admission per person\n- Free telescope viewing: Friday and Saturday evenings (weather permitting)\n- Children under 2: Free admission\n- Members: Unlimited visits plus guest discounts\n- Regular admission: $24 for adults, $18 for children',
    how_to_get_it:
      'Show your EBT card at the admissions desk for reduced admission. Telescope viewing is free and open to the public on clear Friday and Saturday nights - no reservation needed.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'recgov-channel-islands-national-marine-sanctuary': {
    name: 'Channel Islands National Marine Sanctuary',
    description:
      'The waters that swirl around the five islands within Channel Islands National Marine Sanctuary create a special place for several species of plants and animals. Year round, this sanctuary provides wildlife viewing opportunities of dolphins and whales, pinnipeds, and seabirds. This sanctuary also has forests of giant kelp that are home to numerous populations of fish and invertebrates. Make this visit memorable by participating in several activities such as tidepooling, kayaking, snorkeling, fish',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-charles-m-schulz-museum-and-research-center': {
    name: 'Charles M Schulz Museum and Research Center',
    description: 'Museum dedicated to the life and art of Peanuts creator Charles M. Schulz.',
  },
  'childrens-creativity-museum': {
    name: "Children's Creativity Museum",
    description:
      "The Children's Creativity Museum in San Francisco's Yerba Buena Gardens is an interactive arts and technology museum for children ages 2-12, featuring hands-on exhibits that encourage creativity through music, animation, and digital media.",
    what_they_offer:
      '- Museums for All: Reduced admission with EBT card (cardholder + guests)\n- Must have at least one child in the group\n- Children under 2: Free admission\n- Regular admission: $16 per person',
    how_to_get_it:
      'Present your physical EBT or SNAP benefits card along with a photo ID at the admissions desk. Groups must include at least one child to qualify. Reservations recommended.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'childrens-discovery-museum-sj': {
    name: "Children's Discovery Museum",
    description:
      "Children's Discovery Museum of San Jose is one of the largest children's museums in the country, featuring interactive exhibits that inspire children to explore, question, and discover the world around them.",
    what_they_offer:
      '- Museums for All: $5 per person for up to 4 people\n- Valid for EBT, BIC, or WIC cardholders\n- Children under 1: Free admission\n- Regular admission: $18 per person',
    how_to_get_it:
      'Present your EBT, BIC (Benefits Identification Card), or WIC card at the admissions desk. Discount applies to cardholder plus up to 3 additional guests. Advance reservations recommended.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'childrens-fairyland': {
    name: "Children's Fairyland",
    description:
      "Children's Fairyland is a whimsical storybook theme park on the shores of Lake Merritt in Oakland, designed for children ages 0-8. As one of the first theme parks in America, it has delighted families since 1950 with its enchanting sets, live animals, and puppet shows.",
    what_they_offer:
      '- EBT/WIC cardholders: $5 admission per person\n- Children under 1: Free admission\n- Regular admission: $15 per person\n- Annual passes available for frequent visitors',
    how_to_get_it:
      'Present your EBT or WIC card at the admission booth. Discount applies to all members of your party. No advance reservation required but recommended on weekends and holidays.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-children-s-museum-of-sonoma-county': {
    name: "Children's Museum of Sonoma County",
    description:
      "Interactive museum with hands-on STEAM exhibits for children ages 0-10. Features indoor and outdoor exhibits including Mary's Garden and Little Russian River.",
  },
  'ca-sp-china-camp-sp': {
    name: 'China Camp SP',
    description:
      "China Camp State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'el-granada-coastside-hope': {
    name: 'Coastside Hope',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'colma-colma-community-center': {
    name: 'Colma Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'recgov-contra-loma-reservoir': {
    name: 'Contra Loma Reservoir',
    description:
      'Contra Loma Dam and reservoir are part of the Central Valley Project - Delta Division and offers recreational opportunities for the East Bay area near San Francisco. Numerous hiking trails exist as part of the facility and the area provides excellent access to the Contra Costa Canal Regional Trail. The trail system provides for bikes, equestrian and pedestrian use and are available from 5:00 am to 10:00 pm daily. The park also provides picnic and other day use facilities and adjacent to the Anti',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-cordell-bank-national-marine-sanctuary': {
    name: 'Cordell Bank National Marine Sanctuary',
    description:
      'Entirely offshore, Cordell Bank National Marine Sanctuary protects soft seafloor habitat, a rocky bank, deep-sea canyons, and diverse wildlife, while acting as a feeding ground for many marine mammals and seabirds. This protected area is home to several habitats and species that can be visited from afar through educational resources such as panels and exhibits. Visitors can enjoy this extraordinarily rich marine ecosystem by boating, fishing, and watching wildlife from the mainland.',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'san-mateo-coyote-point-marina': {
    name: 'Coyote Point Marina',
    description:
      'Recreational marina with boat slips, launch facilities, and waterfront amenities.',
  },
  'la-honda-cuesta-la-honda-recreation-center': {
    name: 'Cuesta La Honda Recreation Center',
    description: 'Recreational facility offering sports, fitness classes, and community programs.',
  },
  'daly-city-daly-city-community-services-center': {
    name: 'Daly City Community Services Center',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'east-palo-alto-david-e-lewis-reentry-center': {
    name: 'David E. Lewis Reentry Center',
    description:
      'Support center providing resources and services for individuals transitioning back into the community.',
  },
  'imls-di-rosa-preserve': {
    name: 'di Rosa Center for Contemporary Art',
    description:
      'Collection of 1,600 works of Northern California art on 217 protected acres with galleries, sculpture park, 35-acre lake, and walking trails.',
  },
  'daly-city-doelger-senior-center': {
    name: 'Doelger Senior Center',
    description:
      'Resource center providing programs, social activities, and services specifically designed for older adults.',
  },
  'recgov-don-edwards-san-francisco-bay-national-wildlife-re': {
    name: 'Don Edwards San Francisco Bay National Wildlife Refuge',
    description:
      'Don Edwards San Francisco Bay National Wildlife Refuge is located in a vast cultural and natural landscape. As part of the San Francisco Bay National Wildlife Refuge Complex, a complex of seven refuges spanning over 125 miles and 11 counties, the protected habitats and wildlife are just as diverse as the urban communities surrounding them. Our location gives us the perfect opportunity to connect, work with, and serve the public, schools, and nearby community groups. The first people who called t',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-dutra-museum-foundation': {
    name: 'Dutra Museum Foundation',
    description:
      "Museum featuring Northern California dredging history, the California Delta, and the Dutra Family's involvement in maritime heritage.",
    link_text: 'Visit Website',
  },
  'recgov-elkhorn-slough-national-estuarine-research-reserve': {
    name: 'Elkhorn Slough National Estuarine Research Reserve',
    description:
      'Elkhorn Slough is one of the relatively few undisturbed coastal wetlands remaining in California. The main channel of the slough, which winds inland nearly seven miles, is flanked by a broad salt marsh second in size only to San Francisco Bay. More than 400 species of invertebrates, 80 species of fish and 200 species of birds have been identified in Elkhorn Slough. The channels and tidal creeks of the slough are nurseries for many species of fish. Additionally, the slough is on the Pacific flywa',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-ellicott-slough-national-wildlife-refuge': {
    name: 'Ellicott Slough National Wildlife Refuge',
    description:
      'Ellicott Slough National Wildlife Refuge is located in Santa Cruz County within the Monterey Bay area. The refuge, established in 1975 to protect the endangered Santa Cruz long-toed salamander, supports two of the 24 known breeding populations of the salamander. When the California red-legged frog was listed as a threatened species in 1996 and the California tiger salamander in 2004, the purpose of the refuge expanded to include protection of these two species. Over time more properties were add',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-emeryville-center-for-the-arts': {
    name: 'Emeryville Center for the Arts',
    description:
      'Art organization celebrating local art in Emeryville with annual exhibitions and community events.',
    link_text: 'Visit Website',
  },
  'ca-sp-emeryville-crescent-smr': {
    name: 'Emeryville Crescent SMR',
    description:
      "Emeryville Crescent SMR is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'nps-euon': {
    name: "Eugene O'Neill National Historic Site",
    description:
      "Eugene O'Neill National Historic Site preserves Tao House, where the Nobel Prize-winning playwright wrote his most celebrated works including Long Day's Journey Into Night and The Iceman Cometh.",
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  exploratorium: {
    name: 'Exploratorium',
    description:
      "The Exploratorium is San Francisco's world-renowned museum of science, art, and human perception. Located on Pier 15, it features over 650 interactive exhibits that encourage hands-on exploration and discovery.",
    what_they_offer:
      '- California PreK-12 public school teachers: Free admission\n- Museums for All: $3 admission for up to 4 people\n- Valid with EBT/SNAP, Medi-Cal, WIC, or Lifeline Pass\n- After Dark (18+): $3 admission with qualifying card\n- Discounted memberships: $39 Family, $19 Dual After Dark\n- Must purchase at ticket window (not available online)',
    how_to_get_it:
      'California PreK-12 public school teachers can apply for free admission online and bring teacher ID. For low-income discounts, visit the ticket window with your EBT, SNAP, Medi-Cal, WIC card, or Lifeline Pass. These discounts are not available for online purchases.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'redwood-city-fair-oaks-community-center': {
    name: 'Fair Oaks Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'imls-falkirk-cultural-center': {
    name: 'Falkirk Cultural Center',
    description:
      'Historic 1888 Queen Anne mansion on the National Register of Historical Places, serving as a cultural center since 1974.',
  },
  'recgov-farallon-islands-national-wildlife-refuge': {
    name: 'Farallon Islands National Wildlife Refuge',
    description:
      'The Farallon Islands National Wildlife Refuge is located on the pacific coast approximately 28 miles west of San Francisco California. Totaling 211 acres, it is composed of several islands in four groups: the North Farallon, Middle Farallon, South Farallon Islands, and Noonday Rock. The North Farallon, Middle Farallon, and Noonday Rock were designated as the Farallon Refuge by President Theodore Roosevelt in 1909 to protect seabirds and marine mammals. South Farallon Islands is the largest islan',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'fine-arts-museums-sf': {
    name: 'Fine Arts Museums of San Francisco',
    description:
      'The Fine Arts Museums of San Francisco comprise the de Young Museum in Golden Gate Park and the Legion of Honor in Lincoln Park. Together they house an encyclopedic collection spanning over 5,000 years of ancient and European art, American art, textiles, and more.',
    what_they_offer:
      '- Free Saturdays: Free for all Bay Area residents (proof required)\n- Free First Tuesdays: Free admission for everyone\n- Museums for All: $3 with EBT or Medi-Cal card\n- Youth under 18: Always free\n- College students with ID: Discounted admission\n- Military/Veterans: Free with valid ID\n- Seniors (65+): $12 admission',
    how_to_get_it:
      'Bring Bay Area ID for Free Saturdays, EBT/Medi-Cal card for reduced admission, or other qualifying documentation. Check website for specific dates and any reservation requirements.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'moss-beach-fitzgerald-marine-reserve': {
    name: 'Fitzgerald Marine Reserve',
    description:
      'Protected coastal area featuring tide pools, wildlife viewing, and educational programs.',
  },
  'recgov-folsom-dam': {
    name: 'Folsom Dam',
    description:
      "Settlement of the basin began about 1844. In 1848, discovery of gold near the present site of Coloma precipitated a great influx of gold seekers from all parts of the country. At the height of the gold rush, the American River foothill area was one of the most populous in the State. Early miners quickly recognized the potential of riverflows to help in dredging, panning, and sluicing for gold. Diversion dams began appearing on the river in the 1850's. As mining activities declined, two of the da",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-folsom-lake': {
    name: 'Folsom Lake',
    description:
      'Recreation at Folsom Reservoir is managed by the California Department of Parks and Recreation under agreement with the Bureau of Reclamation, Central California Area Office. The reservoir was created by Folsom Dam across the American River. The dam is a feature of the Central Valley Project - American River Division - Folsom and Sly Park Units . Folsom Lake offers 75 miles of shoreline. Usually open 7 days a week, 7:00 a.m. to 10:00 p.m., contact the park office for seasonal variations. Facilit',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-folsom-s-canal-rec-trail': {
    name: 'Folsom S. Canal Rec. Trail',
    description:
      'The 69 mile long Folsom South Canal originates at Nimbus Dam on the American River in Sacramento County and extends southward, paralleling and to the east of State Highway 99 through San Joaquin County. Canal bikeway is open year round, and can be accessed at many locations. Call for details.',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'nps-fopo': {
    name: 'Fort Point National Historic Site',
    description:
      "Fort Point National Historic Site, a pre-Civil War military fort located beneath the Golden Gate Bridge. Explore the brick fortress and learn about the fort's role in San Francisco's defense.",
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'ca-sp-fort-ross-shp': {
    name: 'Fort Ross SHP',
    description:
      "Fort Ross State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-franks-tract-sra': {
    name: 'Franks Tract SRA',
    description:
      "Franks Tract State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-gallery-route-one': {
    name: 'Gallery Route One',
    description:
      'Non-profit arts organization presenting contemporary art exhibitions and educational programs since 1983.',
  },
  'imls-gardens-at-heather-farms': {
    name: 'Gardens at Heather Farms',
    description:
      "Six-acre public garden featuring the Cowden Rose Garden, Children's Garden, Sensory Garden, and Community Garden. Free admission and open daily.",
    link_text: 'Visit Website',
  },
  'golden-gate-park-gardens': {
    name: 'Gardens of Golden Gate Park',
    description:
      "Golden Gate Park's gardens include the Conservatory of Flowers (a Victorian greenhouse with tropical plants), Japanese Tea Garden (the oldest public Japanese garden in the US), and San Francisco Botanical Garden (featuring 9,000 plant species from around the world).",
    what_they_offer:
      '- SF Residents: Free admission to Botanical Garden with ID\n- Veterans/Active Military: Free admission with ID\n- Museums for All: Reduced admission with EBT card\n- Free hours: Early morning entry at select gardens\n- Children under 5: Free at all gardens\n- Regular admission varies by garden ($10-15 adults)',
    how_to_get_it:
      'Show SF proof of residency, military ID, or EBT card at the entrance. Visit early mornings for free admission hours at certain gardens. Check individual garden websites for current free hours and policies.',
    timeframe: 'Ongoing; scheduled free days/hours',
    link_text: 'Plan Visit',
  },
  'golden-bear-pass': {
    name: 'Golden Bear Pass',
    description:
      "California State Parks offers the Golden Bear Pass to ensure that cost is not a barrier to enjoying the state's natural treasures, providing free access to income-eligible residents and seniors.",
    what_they_offer:
      '- Free vehicle day-use access to many California state parks\n- Valid for one calendar year\n- Available to CalWORKs, SSI, and Tribal TANF recipients\n- Also available to seniors 62+ below income threshold',
    how_to_get_it:
      "Apply online at the California State Parks website. You'll need to show proof of enrollment in CalWORKs, SSI, or Tribal TANF, or proof of age 62+ with income documentation.",
    timeframe: 'Annual (calendar year)',
    link_text: 'Apply',
  },
  'nps-goga': {
    name: 'Golden Gate National Recreation Area',
    description:
      'Golden Gate National Recreation Area spans over 80,000 acres of coastal parkland including beaches, historic military sites, and iconic views of the Golden Gate Bridge and San Francisco Bay.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'imls-golden-state-model-railroad-museum': {
    name: 'Golden State Model Railroad Museum',
    description:
      '10,000 sqft operating model railroad exhibit featuring O, HO, and N scale layouts replicating California railroading locations. On the National Register of Historic Places.',
  },
  'recgov-fac-gray-pine-flat-day-use': {
    name: 'Gray Pine Flat Day Use',
    description: 'Gray Pine Flat Day Use is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'ca-sp-gray-whale-cove-sb': {
    name: 'Gray Whale Cove SB',
    description:
      "Gray Whale Cove State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-great-falls-basin-wsa': {
    name: 'Great Falls Basin WSA',
    description:
      'A perennial spring supplies the water flowing through a short distance in the Great Falls Basin Wilderness, and that reach has cut a narrow and deep slot in the bedrock forming several falls. The steep mountainous terrain includes granite outcrops which provide opportunities for cross country hiking and exploration. Elevations range from 2,000-4,500 feet. Vegetation is mixed desert scrub, with the dominant plant being creosote. In the higher elevations, the vegetation changes to heavier upland s',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-greater-farallones-national-marine-sanctuary': {
    name: 'Greater Farallones National Marine Sanctuary',
    description:
      'An area of 3,295 square miles off the northern and central California coast, Greater Farallones National Marine Sanctuary protects the wildlife and habitats of one of the most diverse and bountiful marine environments in the world. This sanctuary shelters a diverse collection of marine habitats and supports an abundance of life, including many threatened or endangered species. Located 30 miles west of the Golden Gate Bridge, the Farallon Islands are a national wildlife refuge that offers resting',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'ca-sp-half-moon-bay-sb': {
    name: 'Half Moon Bay SB',
    description:
      "Half Moon Bay State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-happy-hollow-park-zoo': {
    name: 'Happy Hollow Park & Zoo',
    description:
      'AZA-accredited zoo and amusement park with over 140 animals, family rides, carousel, and Puppet Castle Theater.',
  },
  'imls-headlands-center-for-the-arts': {
    name: 'Headlands Center for the Arts',
    description:
      'Multidisciplinary arts center in historic Fort Barry with artist-in-residence program and public programming.',
  },
  'half-moon-bay-health-coastside-clinic': {
    name: 'Health - Coastside Clinic',
    description: 'Community health clinic offering medical services and wellness programs.',
  },
  'daly-city-health-daly-city-youth-clinic': {
    name: 'Health - Daly City Youth Clinic',
    description:
      'Health clinic providing medical services focused on adolescent health and wellness.',
  },
  'redwood-city-health-sequoia-teen-wellness-center': {
    name: 'Health - Sequoia Teen Wellness Center',
    description: 'Community health clinic offering medical services and wellness programs.',
  },
  'south-san-francisco-health-ssf-clinic': {
    name: 'Health - SSF Clinic',
    description: 'Community health clinic offering medical services and wellness programs.',
  },
  'ca-sp-henry-w-coe-sp': {
    name: 'Henry W Coe SP',
    description:
      "Henry W Coe State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-heritage-museum-of-san-francisco': {
    name: 'Heritage Museum of San Francisco',
    description: 'Museum with diverse collections and exhibits.',
  },
  'imls-historic-ships-memorial-at-pacific-square': {
    name: 'Historic Ships Memorial at Pacific Square',
    description: 'Museum with diverse collections and exhibits.',
  },
  'imls-international-art-museum-of-america': {
    name: 'International Art Museum of America',
    description:
      'Art museum featuring paintings and precious art by world-renowned artists from 12 countries. Free admission. Open Wed-Sun 10am-5pm.',
    link_text: 'Visit Website',
  },
  'imls-international-museum-of-women': {
    name: 'International Museum of Women',
    description:
      "Online museum covering women's issues worldwide. Now part of Global Fund for Women since 2014.",
    link_text: 'Visit Website',
  },
  'ca-sp-jack-london-shp': {
    name: 'Jack London SHP',
    description:
      "Jack London State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-jack-london-state-historic-park': {
    name: 'Jack London State Historic Park',
    description:
      "Historic park featuring Jack London's home and ranch. National Historic Landmark with hiking trails, museums, and the House of Happy Walls.",
    link_text: 'Visit Website',
  },
  'nps-jomu': {
    name: 'John Muir National Historic Site',
    description:
      'John Muir National Historic Site preserves the home of famed naturalist and conservationist John Muir, "Father of the National Parks." Tour his Victorian home and the orchards he tended.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'imls-kimbookai-children-s-edutainment-museum': {
    name: "Kimbookai Children's Edutainment Museum",
    description: 'Interactive museum designed for children and families with hands-on exhibits.',
  },
  'recgov-knoxville-management-area': {
    name: 'Knoxville Management Area',
    description:
      "Note: Click here to view our California State Parks OHV grant preliminary applications . The public comment period will be open from March 4, 2025 to May 5, 2025. Instructions on how to provide public comments can be found here . Due to its close proximity to the Sacramento and San Francisco Bay Area regions, and because of its varied terrain, Knoxville's 17,700 acres attract many off-highway vehicle (OHV) enthusiasts each year. The landscape is characterized by steep and rolling hills with the",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-knoxville-recreation-area': {
    name: 'Knoxville Recreation Area',
    description:
      "Due to its close proximity to the Sacramento and San Francisco Bay Area regions, and because of its varied terrain, Knoxville's 17,700 acres attract many off-highway vehicle (OHV) enthusiasts each year. The landscape is characterized by steep and rolling hills with the vegetation varying from scattered hardwoods and grasses to dense chaparral brush. California gray pine and Macnab cypress are also dispersed throughout the area. Of particular note, are unusual plant communities unique to the area",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'ca-sp-kruse-rhododendron-snr': {
    name: 'Kruse Rhododendron SNR',
    description:
      "Kruse Rhododendron State Natural Reserve is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-lake-berryessa': {
    name: 'Lake Berryessa',
    description:
      "Nestled between Blue Ridge and Cedar Roughs, east of the Napa Valley, Lake Berryessa offers year-round recreation opportunities. Lake Berryessa's water reaches temperatures of up to 75 degrees in the summer, making it an ideal place for water sports. Anglers enjoy fishing for both cold and warm water species, such as rainbow trout, bass, catfish, crappie, and bluegill. The Bureau of Reclamation provides two large day use areas (Oak Shores and Smittle Creek), Capell Cove launch ramp, and many sma",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-fac-lake-berryessa-day-use': {
    name: 'Lake Berryessa - Day Use',
    description: 'Lake Berryessa - Day Use is a activity pass available through Recreation.gov.',
    what_they_offer:
      'Activity Pass at Lake Berryessa. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'ca-sp-lake-del-valle-sra': {
    name: 'Lake Del Valle SRA',
    description:
      "Lake Del Valle State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-lake-natoma': {
    name: 'Lake Natoma',
    description:
      'Recreation at Lake Natoma is managed by the California Department of Parks and Recreation under agreement with the Bureau of Reclamation. The Lake was created by Nimbus Dam across the American River. Lake Natoma is a regulating reservoir for releases from Folsom Lake. The Dam and Lake are features of the Central Valley project. Usually open 7 days per week, summer hours (April 1-October 15) are 6:00 a.m. to 9:00 p.m. Winter hours (October 16 - March 30) are 7:00 a.m. to 7:00 p.m. Facilities incl',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-lake-solano': {
    name: 'Lake Solano',
    description:
      'Lake Solano Park, Solano Project , is located at the base of coastal foothills at the western edge of the Sacramento Valley and offers an array of recreational opportunities. Through an agreement with the Bureau of Reclamation, Lake Solano has been administered as a recreational area by the County of Solano since 1971. More than 200,000 visitors a year enjoy a wealth of recreational activities both on and off the water. Lake Solano is formed by Putah Diversion Dam .The park caters especially to',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-lake-sonoma': {
    name: 'Lake Sonoma',
    description:
      'Lake Sonoma is located in the wine-growing region of Sonoma County, CA. A picturesque lake with secluded vehicle and boat-in camping available for the fishing and boating enthusiast.',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-lamorinda-arts-alliance': {
    name: 'Lamorinda Arts Alliance',
    description:
      'Organization of local artists serving Lafayette, Moraga, Orinda and East Bay communities. Provides exhibits, education, and coordination for artists.',
    link_text: 'Visit Website',
  },
  'lawrence-hall-science': {
    name: 'Lawrence Hall of Science',
    description:
      "The Lawrence Hall of Science is UC Berkeley's public science center, perched in the hills above campus with stunning bay views. It offers hands-on exhibits, planetarium shows, and outdoor science activities for all ages.",
    what_they_offer:
      '- EBT cardholders: $1 admission per person\n- Cal Day: Free admission (one day per year in April)\n- Children under 3: Free admission\n- UC Berkeley students/staff: Free with ID\n- Regular admission: $16 adults, $13 children',
    how_to_get_it:
      'Present your EBT card at the admissions desk. No limit on number of people in your party. Advance reservations recommended on weekends and during school breaks.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-lawson-galleries': {
    name: 'Lawson Galleries',
    description: 'Art museum featuring collections and exhibitions.',
  },
  'recgov-fac-liberty-glen-lake-sonoma': {
    name: 'LIBERTY GLEN (LAKE SONOMA)',
    description:
      "Overview Liberty Glen Campground is located at the top of Rockpile Road overlooking Lake Sonoma. A short 45-minute drive north of Santa Rosa and a two-hour drive from San Francisco. World famous vineyards and a rich history surround the lake, where visitors enjoy boating, fishing and exploring the area's extensive trail network. Recreation Lake Sonoma offers a wide variety of recreational activities such as, Archery Range, Air Rifle Range, Disc Golf, Outdoor Gym, Dog Park as well as other nearby",
    what_they_offer: 'Campground at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'daly-city-lincoln-community-center': {
    name: 'Lincoln Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'recgov-fac-little-flat-day-use': {
    name: 'Little Flat Day Use',
    description: 'Little Flat Day Use is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'imls-livermore-heritage-guild': {
    name: 'Livermore Heritage Guild',
    description:
      'Historical society and research center in the 1911 Carnegie Library with extensive archives, newspapers, photos, and oral histories.',
  },
  'recgov-fac-lone-rock-day-use': {
    name: 'Lone Rock Day Use',
    description: 'Lone Rock Day Use is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'ca-sp-marconi-conference-center-shp': {
    name: 'Marconi Conference Center SHP',
    description:
      "Marconi Conference Center State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-marin-islands-national-wildlife-refuge': {
    name: 'Marin Islands National Wildlife Refuge',
    description: 'More info to come.',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-mountain-bike-hall-of-fame': {
    name: 'Marin Museum of Bicycling & Mountain Bike Hall of Fame',
    description:
      'Premier bicycle history museum at the birthplace of mountain biking, featuring 19th century bikes and the Mountain Bike Hall of Fame.',
  },
  'imls-mountain-bike-hall-of-fame-and-museum': {
    name: 'Marin Museum of Bicycling & Mountain Bike Hall of Fame',
    description:
      'Premier bicycle history museum at the birthplace of mountain biking, featuring 19th century bikes and the Mountain Bike Hall of Fame.',
  },
  'imls-marin-womens-hall-of-fame': {
    name: "Marin Women's Hall of Fame",
    description:
      'Since 1987, recognizes Marin women of distinction, preserves their stories, and inspires future generations. Operated by YWCA Golden Gate Silicon Valley.',
    link_text: 'Visit Website',
  },
  'imls-maritime-museum-san-francisco': {
    name: 'Maritime Museum-San Francisco',
    description:
      'National Park Service museum in the historic Aquatic Park Bathhouse featuring West Coast maritime history and WPA-era art.',
  },
  'imls-markham-arboretum': {
    name: 'Markham Arboretum',
    description:
      '16-acre nature park featuring International Garden, Community Garden, and native plants. Volunteer-run with emphasis on quiet discovery.',
    link_text: 'Visit Website',
  },
  'ca-sp-marsh-creek-state-park': {
    name: 'Marsh Creek State Park',
    description:
      "Marsh Creek State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-martial-cottle-park-sra': {
    name: 'Martial Cottle Park SRA',
    description:
      "Martial Cottle Park State Recreation Area is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-mclaughlin-eastshore-sp-ss': {
    name: 'McLaughlin Eastshore SP SS',
    description:
      "McLaughlin Eastshore State Park SS is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'loma-mar-memorial-park': {
    name: 'Memorial Park',
    description: 'Public park offering trails, picnic areas, and outdoor recreation opportunities.',
  },
  'imls-mexican-museum': {
    name: 'Mexican Museum',
    description:
      'First US museum devoted exclusively to Mexican, Chicano, and Latino art. Collection of 16,000+ art objects (currently relocating to Yerba Buena).',
  },
  'ca-sp-montara-sb': {
    name: 'Montara SB',
    description:
      "Montara State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-monterey-bay-national-marine-sanctuary': {
    name: 'Monterey Bay National Marine Sanctuary',
    description:
      'Monterey Bay National Marine Sanctuary is one of the most spectacular marine protected areas. This sanctuary also has one of the largest underwater canyons and closest-to-shore deep ocean environments. By balancing activities and commercial uses with protection of natural resources, the vast area of waters provides some of the best wildlife viewing, as well as a variety of marine life, including several species of marine mammals, seabirds and shorebirds, invertebrates, and algae. Visitors can en',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'redwood-city-motorpool': {
    name: 'MotorPool',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'ca-sp-mount-diablo-sp': {
    name: 'Mount Diablo SP',
    description:
      "Mount Diablo State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-mount-tamalpais-sp': {
    name: 'Mount Tamalpais SP',
    description:
      "Mount Tamalpais State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'nps-muwo': {
    name: 'Muir Woods National Monument',
    description:
      'Muir Woods National Monument protects old-growth coast redwood trees, some over 1,000 years old. Walk among these ancient giants in one of the last remaining old-growth redwood forests.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'imls-musee-mecanique': {
    name: 'Musée Mécanique',
    description:
      "World's largest privately owned collection of coin-operated antique arcade machines with 300+ games. Free admission.",
  },
  'imls-museo-italo-americano': {
    name: 'Museo Italo Americano',
    description:
      'First US museum devoted to Italian and Italian-American art and culture, with galleries, library, and Italian language classes.',
  },
  'museum-craft-design': {
    name: 'Museum of Craft and Design',
    description:
      "The Museum of Craft and Design (MCD) in San Francisco's Dogpatch neighborhood explores the creative process through contemporary craft and design. It's the only museum in San Francisco devoted exclusively to craft and design.",
    what_they_offer:
      '- Free First Thursdays: Free admission for everyone\n- EBT/Benefits cardholders: Free admission\n- First responders: Free admission with ID\n- Military: Free admission with ID\n- Students with ID: $6 admission\n- Seniors (65+): $6 admission\n- Children under 6: Free admission\n- Regular admission: $12 adults',
    how_to_get_it:
      'Visit on First Thursday for free entry, or show your EBT card, military/first responder ID, student ID, or proof of age at admission. Walk-ins welcome.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-museum-of-performance-design': {
    name: 'Museum of Performance & Design',
    description:
      'Founded 1947, preserves Bay Area performing arts history with 3.5 million items including photos, costumes, and archives from SF Ballet, Opera, and more.',
    link_text: 'Visit Website',
  },
  'imls-museum-of-russian-culture': {
    name: 'Museum of Russian Culture',
    description:
      'Established 1948, features folk costumes, art, photographs from pre-revolutionary Russia, and WWII memorabilia. Free admission, open Wed & Sat 10:30am-2:30pm.',
    link_text: 'Visit Website',
  },
  'moad-museum': {
    name: 'Museum of the African Diaspora (MoAD)',
    description:
      'The Museum of the African Diaspora (MoAD) in San Francisco celebrates the history, art, and cultural contributions of people of African descent. Located in the Yerba Buena arts district, it features rotating contemporary art exhibitions and cultural programs.',
    what_they_offer:
      '- Museums for All: $3 admission with EBT card\n- Active Military: Free admission with valid ID\n- Students with ID: $8 admission\n- Seniors (65+): $8 admission\n- Children under 5: Free admission\n- Community/Free days: Check website for schedule\n- Regular admission: $12 adults',
    how_to_get_it:
      'Present your EBT card, military ID, student ID, or proof of age at the admissions desk. Check website for community free day schedules.',
    timeframe: 'Ongoing',
    link_text: 'Get Tickets',
  },
  'imls-museum-of-the-san-ramon-valley': {
    name: 'Museum of the San Ramon Valley',
    description:
      'Local history museum in the restored 1891 Southern Pacific Depot and 1888 schoolhouse, both on the National Register of Historic Places.',
  },
  'museums-for-all': {
    name: 'Museums for All',
    description:
      "Museums for All is a national program connecting low-income families with cultural institutions, ensuring that financial barriers don't prevent anyone from experiencing the enrichment museums offer.",
    what_they_offer:
      "- Free or reduced admission ($3 or less per person)\n- Admission for EBT cardholder plus up to 4 guests\n- Access to 1,700+ participating museums nationwide\n- Includes science centers, children's museums, art museums, and more",
    how_to_get_it:
      'Visit any participating museum and present your EBT (SNAP/CalFresh) card along with a photo ID at the admissions desk. No reservation needed at most locations, but some may require advance booking.',
    timeframe: 'Ongoing',
    link_text: 'Find Museum',
  },
  'imls-napa-auto-museum': {
    name: 'Napa Auto Museum',
    description: 'Museum with diverse collections and exhibits.',
  },
  'imls-napa-valley-museum': {
    name: 'Napa Valley Museum',
    description:
      'Nonprofit museum offering exhibitions and programs on art, nature, and history since 1972. Free for Yountville Veterans Home residents and active military.',
  },
  'recgov-naras-pacific-region-san-francisco': {
    name: "NARA's Pacific Region - San Francisco",
    description:
      "NARA's Pacific Region (San Francisco) has more than 48,000 cubic feet of archival holdings dating from 1850 to the 1980s, including textual documents, photographs, maps, and architectural drawings. These archival holdings were created or received by the Federal courts and more than 100 Federal agencies in northern California, Guam, Hawaii, Nevada (except Clark County), American Samoa, and the Trust Territory of the Pacific Islands. Federal law requires that agencies transfer permanently valuable",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-natalie-and-james-thompson-art-gallery': {
    name: 'Natalie and James Thompson Art Gallery',
    description:
      'San Jose State University art gallery featuring student exhibitions, Tuesday Night Lectures, and internationally renowned artists. Part of SJSU School of Art and Design.',
    link_text: 'Visit Website',
  },
  'imls-national-liberty-ship-memorial': {
    name: "National Liberty Ship Memorial (SS Jeremiah O'Brien)",
    description:
      'Rare survivor of the 6,939-ship D-Day armada, one of only two operational Liberty ships remaining. National Historic Landmark.',
  },
  'imls-naturebridge': {
    name: 'NatureBridge',
    description:
      'Environmental education nonprofit since 1971. Programs for students at Yosemite and Golden Gate National Recreation Area (Marin Headlands).',
    link_text: 'Visit Website',
  },
  'recgov-nimbus-fish-hatchery': {
    name: 'Nimbus Fish Hatchery',
    description:
      'Nimbus Dam , on the American River 7 miles below Folsom Dam formed Lake Natoma to reregulate the releases for power made through Folsom Powerplant. The Nimbus Fish Hatchery was built on the left bank below the dam to compensate for the spawning areas of salmon and steelhead that were inundated by construction of Nimbus Dam. Nimbus Dam is a feature of the Central Valley Project - American River Division - Folsom and Sly Park Units . Open year-round for fish rearing and educational actvities. Fish',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-fac-no-name-flat-day-use': {
    name: 'No Name Flat Day Use',
    description: 'No Name Flat Day Use is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'recgov-oneill-forebay': {
    name: "O'Neill Forebay",
    description:
      "O'Neill Dam and Forebay are joint Federal-State facilities located on San Luis Creek 2.5 miles downstream from San Luis Dam. O'Neill Forebay Dam is a feature of the Central Valley Project - San Joaquin Division - San Luis Unit . The reservoir has a surface area of 2,250 acres and 14 miles of shoreline. The Park includes boating, camping, picnic facilities, fishing, hiking, and serves as a major family destination for many in the west central valley. Currently an expansion of the Maderos boat ram",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-fac-oak-shores-day-use-area-ca': {
    name: 'OAK SHORES DAY USE AREA (CA)',
    description:
      'Overview Nestled between Blue Ridge and Cedar Roughs east of Napa Valley, Lake Berryessa provides ample public recreation opportunities. Popular activities on and around the large, yet uncrowded lake include fishing, boating, water skiing, wake boarding, jet skiing, sailing, swimming, kayaking, canoeing, wildlife viewing, hiking, biking and picnicking. The Dufer Point Visitor Center offers year-round interpretive events and exhibits highlighting natural and cultural resources. Lake Berryessa is',
    what_they_offer: 'Campground at Lake Berryessa. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'oakland-museum': {
    name: 'Oakland Museum of California',
    description:
      "The Oakland Museum of California (OMCA) is a multidisciplinary museum celebrating California's art, history, and natural sciences. Located near Lake Merritt, it features gardens, exhibitions, and the popular Friday Nights @ OMCA events.",
    what_they_offer:
      '- EBT cardholders: $1 admission per person\n- Free First Sundays: Free admission for everyone\n- Children under 9: Free admission\n- Friday Nights @ OMCA: Half-price admission with food trucks and live music\n- Regular admission: $16 adults',
    how_to_get_it:
      'Present your EBT card at the admissions desk for $1 admission any day. Visit on the first Sunday of each month for free entry. No reservations required for most visits.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-oakland-zoo': {
    name: 'Oakland Zoo',
    description: 'Wildlife facility dedicated to animal conservation and education.',
  },
  'oakland-zoo': {
    name: 'Oakland Zoo – Bay to Zoo',
    description:
      'Oakland Zoo is home to over 850 native and exotic animals on 100 acres in the Oakland hills. The zoo is committed to conservation and education, featuring the California Trail exhibit showcasing native wildlife.',
    what_they_offer:
      '- Bay to Zoo program: $5 admission for low-income families\n- Must show qualifying documentation\n- Children under 2: Free admission\n- Regular admission: $28 adults, $22 children',
    how_to_get_it:
      "Purchase Bay to Zoo tickets online or at the gate. You'll need to show documentation of participation in CalFresh, WIC, Medi-Cal, or similar assistance programs. Valid for cardholder and immediate family members.",
    timeframe: 'Ongoing',
    link_text: 'Get Tickets',
  },
  'ca-sp-olompali-shp': {
    name: 'Olompali SHP',
    description:
      "Olompali State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'daly-city-pacelli-event-center': {
    name: 'Pacelli Event Center',
    description: 'Venue available for community events, meetings, and recreational activities.',
  },
  'imls-pacific-bus-museum': {
    name: 'Pacific Bus Museum',
    description:
      'Collection of 20+ fully-restored running buses from the 1920s-1990s. Open 1st and 3rd Saturday, 10am-2pm. $5 donation for adults.',
  },
  'ca-sp-pacifica-sb': {
    name: 'Pacifica SB',
    description:
      "Pacifica State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-peninsula-museum-of-art': {
    name: 'Peninsula Museum of Art',
    description:
      'Nonprofit art museum (physical locations closed; virtual exhibitions available online).',
  },
  'ca-sp-pescadero-sb': {
    name: 'Pescadero SB',
    description:
      "Pescadero State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-petaluma-adobe-shp': {
    name: 'Petaluma Adobe SHP',
    description:
      "Petaluma Adobe State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-philippine-folklife-museum-foundation': {
    name: 'Philippine Folklife Museum Foundation',
    description: 'Museum with diverse collections and exhibits.',
  },
  'ca-sp-pigeon-point-light-station-shp': {
    name: 'Pigeon Point Light Station SHP',
    description:
      "Pigeon Point Light Station State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'moss-beach-pillar-ridge-community-center': {
    name: 'Pillar Ridge Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'imls-planetarium': {
    name: 'Planetarium',
    description:
      'Science and technology museum with interactive exhibits and educational programs.',
  },
  'imls-playland-not-at-the-beach': {
    name: 'Playland-Not-At-The-Beach',
    description:
      "Nonprofit museum celebrating bygone amusements, featuring artifacts from San Francisco's historic Playland at the Beach and Sutro Baths.",
  },
  'ca-sp-point-montara-light-station': {
    name: 'Point Montara Light Station',
    description:
      "Point Montara Light Station is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'nps-pore': {
    name: 'Point Reyes National Seashore',
    description:
      'Point Reyes National Seashore features dramatic coastal cliffs, pristine beaches, and diverse wildlife including tule elk. Explore the historic lighthouse and Point Reyes Station.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'ca-sp-pomponio-sb': {
    name: 'Pomponio SB',
    description:
      "Pomponio State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'nps-poch': {
    name: 'Port Chicago Naval Magazine National Memorial',
    description:
      'Port Chicago Naval Magazine National Memorial commemorates the 1944 explosion that killed 320 men and the subsequent mutiny trial of African American sailors who refused unsafe working conditions.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'portola-valley-portola-community-center': {
    name: 'Portola Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'ca-sp-portola-redwoods-sp': {
    name: 'Portola Redwoods SP',
    description:
      "Portola Redwoods State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-portuguese-heritage-society-of-california': {
    name: 'Portuguese Heritage Society of California',
    description:
      'Operates the Portuguese Historical Museum at History Park and hosts the annual Dia de Portugal Festival on the second Saturday of June.',
    link_text: 'Visit Website',
  },
  'nps-prsf': {
    name: 'Presidio of San Francisco',
    description:
      'Presidio of San Francisco, a former military post turned national park, offers trails, historic architecture, art installations, and stunning views of the Golden Gate Bridge and bay.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'recgov-fac-public-boat-ramp-lake-sonoma': {
    name: 'Public Boat Ramp (Lake Sonoma)',
    description:
      'Public Boat Ramp (Lake Sonoma) is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'la-honda-puente-de-la-costa-sur-la-honda': {
    name: 'Puente de la Costa Sur, La Honda',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'pescadero-puente-de-la-costa-sur-pescadero': {
    name: 'Puente de la Costa Sur, Pescadero',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'recgov-fac-putah-canyon-campground-napa-ca-bor': {
    name: 'Putah Canyon Campground- Napa, CA (BOR)',
    description:
      'Overview Located in beautiful Napa County, Putah Canyon Campground is approximately 1/2 mile north of Pope Canyon Road, on Berryessa Knoxville Road, Napa, CA. It takes about 45 minutes from both Winters and Napa. Perfect for a quick getaway. Recreation Boating Fishing Swimming Stand-up Paddleboarding (SUPs) Kayaking Natural Features Putah Canyon Campground is located on the Northwestern shore of Lake Berryessa in Napa County, a resorvior created by the United States Bureau of Reclamation in 1957',
    what_they_offer: 'Campground at Lake Berryessa. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'recgov-fac-putah-canyon-day-use-and-boat-launch': {
    name: 'Putah Canyon Day Use and Boat Launch',
    description:
      'Putah Canyon Day Use and Boat Launch is a activity pass available through Recreation.gov.',
    what_they_offer:
      'Activity Pass at Lake Berryessa. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'imls-redwood-empire-live-steamers': {
    name: 'Redwood Empire Live Steamers',
    description:
      'Volunteer-run miniature railroad offering free train rides May-October, first weekend of the month, noon-4pm. Features steam and diesel locomotives on 2,000-foot track.',
    link_text: 'Visit Website',
  },
  'ca-sp-robert-louis-stevenson-sp': {
    name: 'Robert Louis Stevenson SP',
    description:
      "Robert Louis Stevenson State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-robert-w-crown-memorial-sb': {
    name: 'Robert W Crown Memorial SB',
    description:
      "Robert W Crown Memorial State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-rosicrucian-egyptian-museum': {
    name: 'Rosicrucian Egyptian Museum',
    description: 'Largest collection of Egyptian artifacts on exhibit in western North America.',
  },
  'imls-rosicrucian-planetarium': {
    name: 'Rosicrucian Planetarium',
    description:
      'Part of the Rosicrucian Egyptian Museum, featuring astronomy shows and one of the largest Egyptian artifact collections in the western United States.',
    link_text: 'Visit Website',
  },
  'nps-rori': {
    name: 'Rosie the Riveter WWII Home Front National Historical Park',
    description:
      'Rosie the Riveter/WWII Home Front National Historical Park commemorates the contributions of American civilians on the World War II home front, especially women who worked in wartime industries.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  'recgov-s-f-bay-model-regional-visitor-center': {
    name: 'S F Bay Model Regional Visitor Center',
    description:
      'The Bay Model was built in 1957 as a research tool to test the impact of proposed changes to San Francisco Bay and its related waterways. The model has been used to study the effects of chemical/oil spills, altering of shipping channels, levee failures, and bay in-filling. The hydraulic model was used to simulate currents, tidal action, sediment movement and the mixing of fresh and salt water. In 1980 the visitor center portion was added, and the Model adopted the function of an Educational Cent',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'ca-sp-salt-point-sp': {
    name: 'Salt Point SP',
    description:
      "Salt Point State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-samuel-p-taylor-sp': {
    name: 'Samuel P Taylor SP',
    description:
      "Samuel P Taylor State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-san-bruno-mountain-sp': {
    name: 'San Bruno Mountain SP',
    description:
      "San Bruno Mountain State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'san-carlos-san-carlos-airport': {
    name: 'San Carlos Airport',
    description: 'General aviation airport serving private and business aircraft.',
  },
  'recgov-san-francisco-bay-national-estuarine-research-rese': {
    name: 'San Francisco Bay National Estuarine Research Reserve',
    description:
      "The San Francisco Bay National Estuarine Research Reserve comprises two components located along the salinity gradient of the San Francisco Bay. The reserve's 3,710 acres are located at China Camp State Park in San Rafael and Rush Ranch in Suisun City, 30 miles north and 50 miles northeast of San Francisco, respectively. A primary focus of the reserve is to support tidal marsh restoration through research, monitoring and education. These sites serve as valuable reference sites in the San Francis",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'imls-san-francisco-jewelry-museum': {
    name: 'San Francisco Jewelry Museum',
    description: 'Museum with diverse collections and exhibits.',
  },
  'nps-safr': {
    name: 'San Francisco Maritime National Historical Park',
    description:
      'San Francisco Maritime National Historical Park preserves a fleet of historic vessels and the maritime heritage of the Pacific Coast. Visit Hyde Street Pier to board historic ships.',
    what_they_offer:
      '- Free or low-cost access to trails, beaches, and historic sites\n- Ranger-led walks, talks, and educational programs\n- Visitor centers with exhibits and park information\n- Junior Ranger programs for children',
    how_to_get_it:
      'Most National Park Service sites in the Bay Area offer free admission. Some sites have entrance fees:\n- Standard entrance fee: $15-$35 per vehicle (where applicable)\n- Alcatraz ferry tickets sold separately\n\n**Save with park passes:**\n- **America the Beautiful Pass**: $80/year for unlimited access to 2,000+ federal recreation areas\n- **Every Kid Outdoors Pass**: Free for 4th graders and their families\n- **Access Pass**: Free lifetime pass for visitors with permanent disabilities\n- **Senior Pass**: $80 lifetime or $20/year for ages 62+',
    link_text: 'Visit Website',
  },
  sfmoma: {
    name: 'San Francisco Museum of Modern Art (SFMOMA)',
    description:
      'SFMOMA is one of the largest museums of modern and contemporary art in the United States, featuring an expansive collection of painting, sculpture, photography, architecture, design, and media arts in its distinctive building in downtown San Francisco.',
    what_they_offer:
      '- Youth under 19: Always free\n- Museums for All: $5 for SF residents with EBT/Medi-Cal\n- Free days: Several free admission days throughout the year\n- Military/Veterans: $5 admission with ID\n- Discover & Go: Free passes through local libraries\n- Regular admission: $30 adults',
    how_to_get_it:
      'Youth enter free without reservation. For Museums for All, bring EBT or Medi-Cal card plus SF proof of residence. Check library for Discover & Go passes. Reserve tickets online for free days.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'imls-san-francisco-zoological-gardens': {
    name: 'San Francisco Zoo & Gardens',
    description:
      'AZA-accredited 100-acre zoo with 2,000+ animals including grizzlies, gorillas, and the largest outdoor lemur habitat in the US.',
  },
  'ca-sp-san-gregorio-sb': {
    name: 'San Gregorio SB',
    description:
      "San Gregorio State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'recgov-san-joaquin-river-national-wildlife-refuge': {
    name: 'San Joaquin River National Wildlife Refuge',
    description:
      'The San Joaquin River National Wildlife Refuge located in Stanislaus County encompasses more than 7,300 acres of riparian woodlands, wetlands, and grasslands that host a diversity of wildlife native to California’s Great Central Valley. The refuge is situated where three major Valley rivers – San Joaquin, Tuolumne, and Stanislaus – join creating a mosaic of habitats that provide ideal conditions for great wildlife and plant diversity. The refuge was established in 1987 under the Endangered Speci',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'sj-museum-art': {
    name: 'San Jose Museum of Art',
    description:
      'The San Jose Museum of Art is the leading museum of modern and contemporary art in Silicon Valley, located in a beautiful historic building in downtown San Jose. It features rotating exhibitions and a growing permanent collection.',
    what_they_offer:
      '- EBT cardholders: Free admission\n- Children under 6: Free admission\n- First Fridays: Free admission for everyone (5-10pm)\n- Students with ID: $5 admission\n- Seniors (65+): $8 admission\n- Regular admission: $12 adults',
    how_to_get_it:
      'Present your EBT card at the admissions desk for free entry any day. No reservation required. Visit on First Friday evenings for free community nights with art activities and entertainment.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'recgov-san-justo-reservoir': {
    name: 'San Justo Reservoir',
    description:
      'San Justo Dam and Reservoir are features of the San Felipe Project. The reservoir is approximately 3 miles southwest of Hollister, California . Facilities open for use Wednesday through Sunday. Operation hours: sunrise to sunset. Good access roads. The park offers recreation to anglers, boaters, windsurfers, picnickers, and mountain bikers. Boat size restricted to 16 feet. Gas engines prohibited. Ideal for small sailboats and windsurfers in the beginning to intermediate range. Experienced surfer',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-san-luis-reservoir': {
    name: 'San Luis Reservoir',
    description:
      "Recreation area lakes include O'Neill Forebay, San Luis Reservoir, and Los Banos Creek Reservoir. All are part of the California Water Project and operated jointly by the California Department of Parks and Recreation, the California Department of Water Resources, and the Bureau of Reclamation. Office hours; 8:00a.m. - 4:30p.m., Monday through Friday. Closed holidays. Facilities open 7 days a week. Good access roads. Camping, boating, picnicking, and swimming. Regular strong winds make O'Neill Fo",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'recgov-san-pablo-bay-national-wildlife-refuge': {
    name: 'San Pablo Bay National Wildlife Refuge',
    description:
      "In response to rapidly disappearing wetlands and its prime location within the Pacific Flyway, the refuge was created in 1974 to protect migratory birds, wetland habitat, and endangered species. The refuge and San Pablo Bay supports the largest wintering population of canvasbacks on the west coast of the United States and protects the endangered salt marsh harvest mouse and California Ridgway's rail. The San Pablo Bay National Wildlife Refuge lies along the north shore of San Pablo Bay in Sonoma",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'pacifica-san-pedro-valley-park': {
    name: 'San Pedro Valley Park',
    description: 'Public park offering trails, picnic areas, and outdoor recreation opportunities.',
  },
  'imls-sanchez-art-center': {
    name: 'Sanchez Art Center',
    description:
      'Nonprofit arts center with three exhibition galleries and annual juried shows. Free admission. Home to the Art Guild of Pacifica.',
  },
  'redwood-city-schc-fair-oaks-clinic': {
    name: 'SCHC - Fair Oaks Clinic',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'imls-secession-gallery': {
    name: 'Secession Gallery',
    description: 'Art museum featuring collections and exhibitions.',
  },
  'senior-golden-bear-pass': {
    name: 'Senior Golden Bear Pass',
    description:
      "California State Parks offers discounted annual passes for seniors age 62 and over, providing access to the state's beautiful parks, beaches, and historic sites during off-peak periods.",
    what_they_offer:
      '- Annual pass for seniors 62+ and their spouse/domestic partner\n- Free vehicle day-use entry to many state parks\n- Valid during non-peak season only (check specific park schedules)',
    how_to_get_it:
      "Purchase online or at any California State Park entrance station. You'll need proof of age (62 or older). The pass is $25 per year.",
    timeframe: 'Annual (calendar year)',
    link_text: 'Purchase',
  },
  'redwood-city-siena-youth-center': {
    name: 'Siena Youth Center',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'san-mateo-smmc-clinics': {
    name: 'SMMC - Clinics',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'ca-sp-sonoma-coast-sp': {
    name: 'Sonoma Coast SP',
    description:
      "Sonoma Coast State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-sonoma-museum-of-visual-art': {
    name: 'Sonoma Museum of Visual Art',
    description: 'Art museum featuring collections and exhibitions.',
  },
  'ca-sp-sonoma-shp': {
    name: 'Sonoma SHP',
    description:
      "Sonoma State Historic Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-sonoma-valley-museum-of-art': {
    name: 'Sonoma Valley Museum of Art',
    description:
      "Contemporary and modern art museum one block from Sonoma's historic Town Plaza. Free admission on Wednesdays.",
  },
  'recgov-fac-south-lake-trailhead': {
    name: 'South Lake Trailhead',
    description: 'South Lake Trailhead is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'redwood-city-st-francis-center': {
    name: 'St Francis Center',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'redwood-city-star-vista-daybreak-shelter': {
    name: 'Star Vista/Daybreak Shelter',
    description:
      "Public facility with free WiFi access provided through San Mateo County's public WiFi network.",
  },
  'imls-starab-planetarium': {
    name: 'Starab Planetarium',
    description:
      'Science and technology museum with interactive exhibits and educational programs.',
  },
  'recgov-stone-lakes-national-wildlife-refuge': {
    name: 'Stone Lakes National Wildlife Refuge',
    description:
      'Established in 1992, Stone Lakes National Wildlife Refuge is an urban refuge located 10 miles from downtown Sacramento sandwiched between the city of Elk Grove and agricultural lands. Conserving and enhancing Central Valley habitat and wildlife, the refuge hosts a variety of Central Valley habitats including grassland savannah, riparian forest, wetlands, and native freshwater lakes. Year-round and seasonal public use activities include the free environmental education site Blue Heron Trails , do',
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'ca-sp-sugarloaf-ridge-sp': {
    name: 'Sugarloaf Ridge SP',
    description:
      "Sugarloaf Ridge State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-sunnyvale-heritage-park-museum': {
    name: 'Sunnyvale Heritage Park Museum',
    description:
      'Historical museum in a replica of the 1850 Martin Murphy House, with heritage orchard and agricultural history exhibits. Free admission.',
  },
  'recgov-the-geysers': {
    name: 'The Geysers',
    description:
      "The Geysers encompasses about 7,100 acres of public lands and straddles the Lake County/Sonoma County line. The Geysers is administered by BLM's Ukiah Field Office.",
    what_they_offer:
      'Outdoor recreation including hiking, wildlife viewing, and nature experiences. Some sites offer camping, picnicking, and water activities.',
    how_to_get_it:
      'Visit Recreation.gov to check availability, make reservations, and plan your visit. Some areas are free to visit while others may require permits or fees.',
    timeframe: 'Varies by location and activity',
    link_text: 'Visit Recreation.gov',
  },
  'the-tech-interactive': {
    name: 'The Tech Interactive',
    description:
      'The Tech Interactive (formerly The Tech Museum) is a hands-on science and technology center in downtown San Jose. Featuring innovative exhibits on robotics, virtual reality, renewable energy, and more, it inspires the next generation of innovators.',
    what_they_offer:
      '- EBT cardholders: $5 admission per person\n- Children under 3: Free admission\n- Regular admission: $32 adults, $27 children\n- IMAX films: Additional fee',
    how_to_get_it:
      'Present your EBT card at the admissions desk. Discount applies to everyone in your party. Advance tickets recommended on weekends and during school breaks.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'ca-sp-thornton-sb': {
    name: 'Thornton SB',
    description:
      "Thornton State Beach is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'ca-sp-tomales-bay-sp': {
    name: 'Tomales Bay SP',
    description:
      "Tomales Bay State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-treasure-island-museum-association': {
    name: 'Treasure Island Museum',
    description:
      'Free museum covering the 1939 Golden Gate International Exposition, Navy history, and island development. Open daily.',
  },
  'ca-sp-trione-annadel-sp': {
    name: 'Trione Annadel SP',
    description:
      "Trione Annadel State Park is part of California's state park system, offering outdoor recreation, natural beauty, and opportunities to connect with California's landscapes and heritage.",
    what_they_offer:
      '- Day use access for hiking, picnicking, and nature viewing\n- Camping facilities (reservations at ReserveCalifornia.com)\n- Ranger-led programs and interpretive activities\n- Scenic trails and wildlife viewing opportunities',
    how_to_get_it:
      'Most California State Parks require a day use or camping fee:\n- Day use: $8-$15 per vehicle (varies by park)\n- Camping: $25-$65 per night (varies by campsite type)\n\n**Save with park passes:**\n- **California Adventure Pass**: Free day use for 4th graders\n- **Disabled Discount Pass**: 50% off day use and camping\n- **Distinguished Veteran Pass**: Free day use for eligible veterans\n- **Golden Bear Pass**: Free day use for income-eligible Californians',
    link_text: 'Visit Website',
  },
  'imls-uc-berkeley-art-museum': {
    name: 'UC Berkeley Art Museum (BAMPFA)',
    description:
      'Berkeley Art Museum and Pacific Film Archive with 25,000+ artworks and 18,000 films. Free for UC Berkeley students and first Thursdays.',
  },
  'imls-valle-del-sur': {
    name: 'Valle Del Sur',
    description: 'Art museum featuring collections and exhibitions.',
  },
  'imls-valley-children-s-museum': {
    name: "Valley Children's Museum",
    description: 'Interactive museum designed for children and families with hands-on exhibits.',
  },
  'walt-disney-family-museum': {
    name: 'Walt Disney Family Museum',
    description:
      "The Walt Disney Family Museum in San Francisco's Presidio tells the story of Walt Disney's life through interactive galleries featuring original artwork, early drawings, films, music, and a stunning model of Disneyland.",
    what_they_offer:
      '- US Military/Dependents: Free general admission with ID\n- Museums for All: Reduced admission for SF EBT/CalFresh/Medi-Cal holders\n- Discount covers cardholder plus guests\n- Students with ID: $25 admission\n- Seniors (65+): $25 admission\n- Children 6-17: $20 admission\n- Children under 6: Free with adult\n- Regular admission: $30 adults',
    how_to_get_it:
      'For military free admission, show valid military or dependent ID. For Museums for All, present your SF benefits card and proof of SF residency at the admissions desk.',
    timeframe: 'Ongoing',
    link_text: 'Plan Visit',
  },
  'daly-city-war-memorial-community-center': {
    name: 'War Memorial Community Center',
    description:
      'Multi-purpose community facility offering meeting rooms, recreational programs, and public services for local residents.',
  },
  'recgov-fac-warm-springs-rec-area': {
    name: 'WARM SPRINGS REC AREA',
    description:
      "Overview Warm Springs Recreation Area is a day-use park located at Lake Sonoma, which is just a 45 minute drive north of Santa Rosa and a 2 hour trip from San Francisco. There is no overnight camping available at this facility World famous vineyards and a land rich in history surround the lake, where visitors enjoy boating, fishing and exploring the area's extensive trail network. Recreation The Woodland Ridge Nature Trail begins at the park and winds up the ridge, rewarding hikers with great vi",
    what_they_offer: 'Campground at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  'east-palo-alto-wic-epa': {
    name: 'WIC - EPA',
    description:
      'Women, Infants, and Children (WIC) nutrition program office providing food assistance and health education.',
  },
  'redwood-city-wic-rwc': {
    name: 'WIC - RWC',
    description:
      'Women, Infants, and Children (WIC) nutrition program office providing food assistance and health education.',
  },
  'san-mateo-wic-san-mateo': {
    name: 'WIC - San Mateo',
    description:
      'Women, Infants, and Children (WIC) nutrition program office providing food assistance and health education.',
  },
  'south-san-francisco-ymca-community-resource-center': {
    name: 'YMCA Community Resource Center',
    description:
      'YMCA facility offering fitness programs, youth activities, and community services.',
  },
  'recgov-fac-yorty-creek-recreation-area-day-use': {
    name: 'Yorty Creek Recreation Area Day Use',
    description:
      'Yorty Creek Recreation Area Day Use is a activity pass available through Recreation.gov.',
    what_they_offer: 'Activity Pass at Lake Sonoma. Reservations available through Recreation.gov.',
    how_to_get_it:
      'Make a reservation through Recreation.gov. Book early as popular sites fill up quickly.',
    timeframe: 'Varies by season',
    link_text: 'Make Reservation',
  },
  '7-eleven-gold-pass': {
    name: '7-Eleven Gold Pass',
    description:
      "7-Eleven is one of the world's largest convenience store chains. Their Gold Pass membership offers exclusive deals, rewards, and discounts on food, drinks, and everyday items.",
    what_they_offer:
      '- 40% off Gold Pass membership ($5.99/month instead of regular price)\n- Available for EBT/SNAP recipients, military/veterans, and college students\n- Exclusive member deals on food, drinks, and snacks\n- 30-day free trial for new customers',
    how_to_get_it:
      "1. Download the 7-Eleven app on your smartphone\n2. Create an account or sign in\n3. Go to 'Community Discounts' in the app settings\n4. Verify your eligibility (EBT card, military ID, or .edu email)\n5. Start your discounted membership",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'amazon-prime-access': {
    name: 'Amazon Prime Access',
    description:
      "Amazon is the world's largest online retailer. Prime Access offers a discounted Prime membership for those receiving government assistance, providing free shipping, streaming, and more.",
    what_they_offer:
      '- Discounted Prime membership at $6.99/month (regularly $14.99/month)\n- Free two-day shipping on millions of items\n- Prime Video streaming (movies, TV shows)\n- Prime Music, Prime Reading, and more\n- 30-day free trial for new customers',
    how_to_get_it:
      '1. Visit amazon.com/primeaccess\n2. Verify eligibility through EBT card or government assistance documentation\n3. Or verify income through a third-party service\n4. Complete enrollment and start your membership\n5. Re-verify eligibility every 12 months',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'att-access': {
    name: 'AT&T Access',
    description:
      'AT&T is one of the largest telecommunications companies in the United States. AT&T Access provides affordable high-speed internet service to qualifying low-income households.',
    what_they_offer:
      '- Affordable high-speed internet service\n- Free installation (no installation fees)\n- No annual contract required\n- In-home WiFi included\n- Access to AT&T WiFi hotspots',
    how_to_get_it:
      '1. Check if AT&T service is available at your address\n2. Verify eligibility through SNAP, SSI, or other qualifying programs\n3. Apply online at att.com/access or call customer service\n4. Schedule installation appointment\n5. No credit check required',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'california-lifeline': {
    name: 'California LifeLine Program',
    description:
      'California LifeLine is a state program that provides discounted home phone and cell phone services to eligible low-income households, ensuring everyone has access to basic communication services.',
    what_they_offer:
      '- Discounted or free home phone service\n- Discounted or free cell phone service with data\n- Choice of multiple participating phone companies\n- Basic features included (caller ID, voicemail, etc.)',
    how_to_get_it:
      '1. Check eligibility (must participate in Medi-Cal, CalFresh, SSI, or meet income guidelines)\n2. Visit californialifeline.com or call the hotline\n3. Choose a participating phone company\n4. Submit application with proof of eligibility\n5. Receive service within a few weeks of approval',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  good360: {
    name: 'Good360',
    description:
      'Good360 is a nonprofit organization that partners with major retailers and manufacturers to distribute donated goods to nonprofits and schools, including technology equipment.',
    what_they_offer:
      '- Donated technology including laptops, monitors, tablets\n- Office supplies and equipment\n- Various retail goods and merchandise\n- Availability varies based on donor shipments',
    how_to_get_it:
      '1. Register your nonprofit organization at good360.org\n2. Complete the membership application\n3. Pay annual membership fee (varies by organization size)\n4. Browse available products in the online catalog\n5. Request items and arrange shipping/pickup',
    timeframe: 'Ongoing',
    link_text: 'Become a Member',
  },
  'goodstack-nonprofit-discounts': {
    name: 'Goodstack Nonprofit Discounts',
    description:
      'Goodstack (formerly Percent) is a platform that helps nonprofits access discounted software and technology tools from major companies like Zoom, Adobe, Asana, and OpenAI.',
    what_they_offer:
      '- Discounted access to Zoom, Adobe Acrobat, Asana, and more\n- OpenAI/ChatGPT plans for nonprofits\n- Various SaaS and cloud service discounts\n- Centralized platform to manage all nonprofit discounts',
    how_to_get_it:
      '1. Visit causes.goodstack.io\n2. Verify your nonprofit status (501c3 or equivalent)\n3. Create an organizational account\n4. Browse available discounts and offers\n5. Claim discounts directly through the platform',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'instacart-ebt': {
    name: 'Instacart for EBT/SNAP',
    description:
      'Instacart is a grocery delivery and pickup service. They offer special discounts for EBT/SNAP recipients, making grocery delivery more accessible and affordable.',
    what_they_offer:
      '- 50% off Instacart+ membership for one year\n- Skip delivery and pickup fees at participating stores\n- New customers get $0 delivery on first 3 orders\n- Use EBT/SNAP benefits for eligible food items',
    how_to_get_it:
      '1. Download the Instacart app or visit instacart.com\n2. Create an account\n3. Add your EBT card to your payment methods\n4. Apply for the discounted Instacart+ membership\n5. Start shopping with reduced fees',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'internet-essentials': {
    name: 'Internet Essentials by Xfinity',
    description:
      "Internet Essentials is Comcast/Xfinity's low-cost internet program designed to help connect low-income families to affordable high-speed internet at home.",
    what_they_offer:
      '- Affordable high-speed internet (up to 50 Mbps)\n- WiFi modem included at no extra cost\n- No credit check or term contract\n- Option to purchase low-cost computer\n- Free internet training resources',
    how_to_get_it:
      '1. Check if Xfinity service is available in your area\n2. Verify eligibility through SNAP, Medicaid, SSI, public housing, or other programs\n3. Apply online at internetessentials.com or by phone\n4. Receive equipment and self-install or schedule technician',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'kanopy-students': {
    name: 'Kanopy for Students',
    description:
      'Kanopy is a video streaming service that partners with libraries and universities to provide free access to thousands of films, documentaries, and educational videos.',
    what_they_offer:
      '- Free streaming of thousands of films and documentaries\n- Criterion Collection, indie films, and world cinema\n- Educational and documentary content\n- Access through participating campus libraries',
    how_to_get_it:
      '1. Check if your college or university participates\n2. Visit kanopy.com/signup/find/university\n3. Search for your school\n4. Sign in with your campus credentials\n5. Start streaming immediately',
    timeframe: 'Ongoing',
    link_text: 'Find Your School',
  },
  'tech-exchange': {
    name: 'Tech Exchange',
    description:
      'Tech Exchange is a Bay Area nonprofit that provides affordable refurbished technology to nonprofits, schools, and community organizations, along with digital training and support.',
    what_they_offer:
      '- Refurbished computers and laptops at low cost\n- Technology equipment for nonprofits and schools\n- Digital literacy training programs\n- Technical support services\n- E-waste recycling',
    how_to_get_it:
      '1. Visit techexchange.org to browse available equipment\n2. Verify your nonprofit or school status\n3. Request equipment through the website\n4. Schedule pickup at their Oakland location or arrange delivery',
    timeframe: 'Ongoing',
    link_text: 'Request Equipment',
  },
  'techsoup-discount-marketplace': {
    name: 'TechSoup Discount Marketplace',
    description:
      'TechSoup is the leading nonprofit technology assistance organization, helping nonprofits access donated and discounted software, hardware, and cloud services from major tech companies.',
    what_they_offer:
      '- Microsoft 365 and Office products at deep discounts\n- Adobe Creative Cloud for nonprofits\n- Hardware from Dell, Lenovo, and others\n- Cloud services from AWS, Google, and Microsoft\n- Training and learning resources',
    how_to_get_it:
      '1. Register your nonprofit at techsoup.org\n2. Complete the validation process (verify 501c3 status)\n3. Pay small administrative fees for products\n4. Browse catalog and request products\n5. Receive digital products instantly or hardware by mail',
    timeframe: 'Ongoing',
    link_text: 'Explore Discounts',
  },
  't-mobile-project-10million': {
    name: 'T-Mobile Project 10Million',
    description:
      'T-Mobile Project 10Million is a $10.7 billion initiative to provide free internet connectivity to millions of underserved student households across America, helping close the homework gap.',
    what_they_offer:
      '- Free mobile hotspot device\n- 200GB high-speed data per year for 5 years\n- Free Web Guard content filtering for safety\n- Optional $10 data pass for additional 10GB when needed',
    how_to_get_it:
      '1. Household must have K-12 student(s)\n2. Must qualify for National School Lunch Program or similar\n3. School district or school must participate\n4. Apply through your school or district\n5. Receive hotspot device and instructions',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'walmart-plus-assist': {
    name: 'Walmart+ Assist',
    description:
      "Walmart+ is Walmart's membership program offering free delivery, fuel discounts, and more. Walmart+ Assist provides this membership at half price for those receiving government assistance.",
    what_they_offer:
      '- 50% off Walmart+ membership ($6.47/month or $49/year)\n- Free delivery from your local store (no minimum order)\n- Member prices on fuel at Walmart and Murphy stations\n- Scan & Go for faster in-store checkout\n- Free 30-day trial for new customers',
    how_to_get_it:
      '1. Visit walmart.com/plus/assist\n2. Verify eligibility through SNAP, Medicaid, SSI, TANF, or WIC\n3. Complete verification through third-party service\n4. Start your discounted membership\n5. Re-verify eligibility annually',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'world-computer-exchange': {
    name: 'World Computer Exchange',
    description:
      'World Computer Exchange is a nonprofit that collects donated computers and distributes them to schools, libraries, and community organizations in developing countries and underserved US communities.',
    what_they_offer:
      '- Donated computers and technology equipment\n- Equipment for educational and nonprofit use\n- Multiple Bay Area drop-off locations for donations\n- Computers refurbished and distributed to those in need',
    how_to_get_it:
      '1. Visit worldcomputerexchange.org\n2. Complete the request form for your organization\n3. Provide documentation of nonprofit or educational status\n4. Coordinate pickup or delivery of equipment',
    timeframe: 'Ongoing',
    link_text: 'Get Computers',
  },
  'spectrum-internet-assist': {
    name: 'Spectrum Internet Assist',
    description:
      "Spectrum Internet Assist is Charter Communications' affordable internet program for qualifying low-income households, including seniors receiving SSI and families with students in free lunch programs.",
    what_they_offer:
      '- Affordable high-speed internet service (30 Mbps)\n- No data caps or contracts\n- Free modem included\n- Free internet security suite\n- In-home WiFi available for additional fee',
    how_to_get_it:
      '1. Check if Spectrum service is available in your area\n2. Must have student in National School Lunch Program (NSLP) or Community Eligibility Provision (CEP)\n3. Or be 65+ and receiving Supplemental Security Income (SSI)\n4. Apply online or call Spectrum\n5. Cannot have prior Spectrum debt within last 12 months',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'menlo-park-library-hotspots': {
    name: 'Menlo Park Library Wi-Fi Hotspots',
    description:
      'The Menlo Park Library offers portable WiFi hotspot devices that library cardholders can borrow, providing free internet access at home or on the go.',
    what_they_offer:
      '- Free 7-day checkout of portable WiFi hotspot\n- High-speed internet access anywhere\n- No data limits during checkout period\n- Available to all library cardholders',
    how_to_get_it:
      '1. Get a Menlo Park Library card (free for residents)\n2. Check availability of hotspots online or at the library\n3. Place a hold or visit the library to check out\n4. Return within 7 days to avoid late fees',
    timeframe: 'Ongoing',
    link_text: 'Check Availability',
  },
  'calvet-troops-to-trucks': {
    name: 'Troops to Trucks (CDL Waiver Program)',
    description:
      "The California Troops to Trucks program allows qualifying service members and veterans with military driving experience to obtain a commercial driver's license (CDL) without taking the driving skills test. This fast-tracks veterans into high-demand trucking careers.",
    what_they_offer:
      '- CDL skills test waiver for qualified veterans\n- Applies to non-passenger commercial vehicles\n- Faster path to Class A or B commercial license\n- No need to retake driving portion of CDL test\n- Leverages existing military driving experience',
    how_to_get_it:
      '1. Must have military motor vehicle operator experience\n2. Must have clean driving record (no serious violations in past 2 years)\n3. Apply at California DMV with military driving documentation\n4. Provide DD214 showing MOS with driving duties\n5. Complete written CDL knowledge test\n6. Skills test is waived - receive CDL',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'ac-transit-stpp': {
    name: 'AC Transit',
    description:
      'AC Transit (Alameda-Contra Costa Transit District) is the third-largest public bus system in California, serving the East Bay including Oakland, Berkeley, and surrounding cities with local and transbay service.',
    what_they_offer:
      '- Student Transit Pass Program (STPP): Free unlimited rides for eligible middle and high school students\n- Program covers all AC Transit local and transbay routes\n- Valid throughout the school year',
    how_to_get_it:
      "1. Program is available through participating school districts\n2. Your school will provide information about enrollment\n3. Students receive a Clipper card loaded with the pass\n4. Contact your school's administration for enrollment details",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'bart-discount': {
    name: 'BART',
    description:
      'BART (Bay Area Rapid Transit) is a heavy rail rapid transit system serving the San Francisco Bay Area, connecting San Francisco, Oakland, Berkeley, and surrounding suburbs with 50 stations across 131 miles of track.',
    what_they_offer:
      '- High-Value Discount: Approximately 6.25% savings when using Clipper Autoload\n- Discount automatically applied when card balance is reloaded\n- Works on all BART stations and routes',
    how_to_get_it:
      '1. Get a Clipper card at any BART station or online\n2. Set up Autoload on your Clipper account at clippercard.com\n3. Choose an amount to automatically add when balance is low\n4. Discount is applied automatically to each Autoload transaction',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'bart-muni-a-pass': {
    name: 'BART + Muni',
    description:
      'A joint program between BART and SFMTA offering unlimited transit within San Francisco on both systems with a single monthly pass.',
    what_they_offer:
      '- "A" Fast Pass: Unlimited Muni rides plus unlimited BART rides within San Francisco\n- Valid on all Muni buses, light rail, cable cars, and historic streetcars\n- Valid on BART between San Francisco stations only',
    how_to_get_it:
      '1. Purchase through Clipper card website or retail locations\n2. Load the monthly "A" pass onto your Clipper card\n3. Pass is valid for one calendar month\n4. Tap Clipper card when boarding Muni or entering BART',
    timeframe: 'Monthly',
    link_text: 'Buy Pass',
  },
  'bike-share-for-all': {
    name: 'Bike Share for All (Bay Wheels)',
    description:
      "Bay Wheels (operated by Lyft) is the Bay Area's bike share system with thousands of bikes available at stations throughout San Francisco, Oakland, Berkeley, and San Jose. Bike Share for All makes it affordable for low-income residents.",
    what_they_offer:
      '- Discounted annual membership: $5/year for first year (regularly $149)\n- Unlimited 60-minute rides on classic bikes\n- Reduced per-minute rates for e-bikes\n- No credit card required—can pay with cash or prepaid card',
    how_to_get_it:
      '1. Visit the Bike Share for All website or call customer service\n2. Provide proof of eligibility (Clipper START, Calfresh/EBT, or income verification)\n3. Complete enrollment online or at a Lyft community hub\n4. Receive your membership and start riding',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'caltrain-youth-fares': {
    name: 'Caltrain Dollar Fares for Youth',
    description:
      'Caltrain is a commuter rail line running 77 miles along the San Francisco Peninsula, connecting San Francisco to San Jose and Gilroy. The Dollar Fares program makes train travel extremely affordable for young riders.',
    what_they_offer:
      '- $1 One-Way fare for youth 18 and under\n- $2 Day Pass for unlimited rides in one day\n- Valid on all Caltrain routes and zones\n- No income requirements—available to all youth',
    how_to_get_it:
      '1. Get a Clipper card with Youth designation at clippercard.com\n2. Or show valid ID proving age 18 or under when purchasing tickets\n3. Tap Clipper card or show ticket when boarding\n4. Youth ages 4 and under ride free with paying adult',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'city-coach-solano': {
    name: 'City Coach',
    description:
      'City Coach is the local public transit service for the City of Vacaville in Solano County, providing fixed-route bus service throughout the city.',
    what_they_offer:
      '- Free rides for Solano Community College students\n- Valid on all City Coach routes within Vacaville\n- No additional fees or passes required',
    how_to_get_it:
      '1. Must be currently enrolled at Solano Community College\n2. Show your valid student ID to the bus driver when boarding\n3. No separate application or pass needed',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'clipper-baypass': {
    name: 'Clipper BayPass',
    description:
      'Clipper BayPass is a pilot program providing unlimited transit access across all 24 Bay Area transit agencies on a single pass, designed primarily for college students at participating institutions.',
    what_they_offer:
      '- Unlimited rides on all 24 Bay Area transit agencies\n- Includes BART, Muni, AC Transit, Caltrain, VTA, and more\n- Single pass covers all transit systems\n- Significant savings compared to paying per ride',
    how_to_get_it:
      "1. Check if your college or university participates in the program\n2. Register through your school's transportation or parking office\n3. Link your student ID to a Clipper card\n4. Program eligibility and fees vary by institution",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'clipper-start': {
    name: 'Clipper START',
    description:
      'Clipper START is a regional program that provides discounted transit fares for low-income adults on participating Bay Area transit systems, helping make public transportation more accessible.',
    what_they_offer:
      '- 50% off single-ride fares on most participating transit agencies\n- 20% off on BART\n- Valid on AC Transit, BART, Caltrain, Golden Gate Transit/Ferry, Muni, SamTrans, and more\n- Discounts automatically applied when using Clipper card',
    how_to_get_it:
      '1. Check income eligibility (200% or below Federal Poverty Level)\n2. Apply online at clipperstartcard.com\n3. Provide proof of income or participation in qualifying benefit programs\n4. Receive Clipper START card by mail within 2-3 weeks\n5. Load cash value and ride with automatic discounts',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'dmv-reduced-fee-id': {
    name: 'DMV Reduced-Fee ID Card',
    description:
      'The California Department of Motor Vehicles offers reduced-fee identification cards for income-eligible residents, providing an affordable way to obtain government-issued photo ID.',
    what_they_offer:
      '- Reduced-fee state ID card (regularly $35, reduced to $8)\n- Valid government-issued photo identification\n- Can be used for identification purposes, voting, and more\n- Available to qualifying low-income residents',
    how_to_get_it:
      "1. Contact your county's Public Assistance Agency or social services office\n2. Request Form DL 937 (Fee Waiver Certification)\n3. Agency will verify your eligibility and complete the form\n4. Take the certified DL 937 form to any DMV office\n5. Complete ID card application and pay reduced fee",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'emergency-ride-home-marin': {
    name: 'Emergency Ride Home',
    description:
      'Marin Commutes provides emergency ride home reimbursement for people who use alternative transportation to get to work or school, ensuring you can get home quickly in case of an emergency.',
    what_they_offer:
      '- Reimbursement for emergency rides home\n- Up to $125 per ride\n- Maximum $500 per year\n- Covers taxi, Uber/Lyft, or rental car costs',
    how_to_get_it:
      '1. Register with Marin Commutes before needing the service\n2. Use alternative transportation (carpool, transit, bike, walk) regularly\n3. When emergency occurs, take taxi/rideshare/rental car home\n4. Submit reimbursement request online within 5 business days\n5. Include receipt and reason for emergency',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'emery-go-round': {
    name: 'Emery Go-Round',
    description:
      'Emery Go-Round is a free shuttle bus service operated by the Emeryville Transportation Management Association, connecting Emeryville destinations with the MacArthur BART station.',
    what_they_offer:
      '- Completely free shuttle service\n- Multiple routes throughout Emeryville\n- Connection to MacArthur BART station\n- Frequent service during business hours\n- No pass or registration required',
    how_to_get_it:
      '1. No registration or pass needed\n2. Check the route map and schedule online\n3. Go to any Emery Go-Round stop\n4. Board when shuttle arrives—no fare required',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  '511-emergency-rides-contra-costa': {
    name: '511 Emergency Rides',
    description:
      '511 Contra Costa provides emergency ride services for commuters who use alternative transportation, ensuring workers and students can get home safely in case of unexpected emergencies.',
    what_they_offer:
      '- 6 free emergency Lyft or Uber rides per year\n- Available for qualified emergencies (illness, family emergency, unscheduled overtime)\n- Covers ride from school/work to home',
    how_to_get_it:
      "1. Register with 511 Contra Costa's Guaranteed Ride Home program\n2. Must work or attend college in Contra Costa County\n3. Use alternative transportation (transit, carpool, bike, walk) at least 2 days/week\n4. Request ride through the program when emergency occurs",
    timeframe: 'Ongoing',
    link_text: 'Register',
  },
  '511-transit-incentives-contra-costa': {
    name: '511 Transit Incentives',
    description:
      '511 Contra Costa offers incentives to encourage workers and students to try public transit, providing free Clipper card value when you commit to taking transit.',
    what_they_offer:
      '- Free $25 Clipper card for taking the transit pledge\n- One-time incentive to try transit\n- Can be used on any transit agency that accepts Clipper',
    how_to_get_it:
      '1. Visit the 511 Contra Costa website\n2. Complete the transit pledge online\n3. Must work or attend college in Contra Costa County\n4. Receive $25 Clipper card by mail or at designated pickup location',
    timeframe: 'Ongoing',
    link_text: 'Claim offer',
  },
  'lime-access': {
    name: 'Lime Access',
    description:
      'Lime is a micromobility company offering electric scooters and bikes for short trips. Lime Access makes these transportation options affordable for low-income riders.',
    what_they_offer:
      '- Discounted or free Lime scooter and bike rides\n- Up to 30 minutes free per ride (varies by market)\n- 50% off all rides after free minutes\n- Available in Bay Area cities where Lime operates',
    how_to_get_it:
      '1. Download the Lime app on your smartphone\n2. Create an account\n3. Apply for Lime Access in the app settings\n4. Provide proof of income eligibility (SNAP, Medicaid, LIHEAP, or similar)\n5. Approval usually within a few days',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'low-cost-auto-insurance': {
    name: 'Low Cost Auto Insurance',
    description:
      "California's Low Cost Automobile Insurance Program (CLCA) is a state-sponsored program providing affordable liability insurance for income-eligible drivers who might otherwise go uninsured.",
    what_they_offer:
      "- State-sponsored low-cost liability insurance\n- Meets California's minimum insurance requirements\n- Annual premiums typically $400-$800 depending on county\n- Covers bodily injury and property damage liability",
    how_to_get_it:
      "1. Check income eligibility (250% of Federal Poverty Level or less)\n2. Must have valid California driver's license\n3. Must own a vehicle valued at $25,000 or less\n4. Good driving record required (limited violations allowed)\n5. Apply online or by phone\n6. Choose from participating insurance companies",
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'marin-transit-students': {
    name: 'Marin Transit',
    description:
      'Marin Transit provides local bus service throughout Marin County, connecting communities with schools, shopping, and employment centers. The agency partners with College of Marin to offer free rides for students.',
    what_they_offer:
      '- Free rides for College of Marin students\n- Valid on all Marin Transit local routes\n- No additional fees or passes required\n- Show student ID to ride free',
    how_to_get_it:
      '1. Must be currently enrolled at College of Marin\n2. Obtain your valid student ID from the college\n3. Show student ID to bus driver when boarding\n4. Ride any Marin Transit local route for free',
    timeframe: 'School-year durations apply',
    link_text: 'Learn More',
  },
  'muni-free': {
    name: 'Muni',
    description:
      "San Francisco Municipal Transportation Agency (SFMTA) operates Muni, the city's public transit system including buses, light rail (Metro), cable cars, and historic streetcars. Multiple free and discounted fare programs are available.",
    what_they_offer:
      '- Free Muni for Youth (ages 5-18): Free on all Muni except cable cars\n- Free Muni for Seniors/Disabled: For income-eligible seniors 65+ and people with disabilities\n- Lifeline Pass: Discounted monthly pass for low-income adults\n- Free rides with Chase Center event tickets (game day)\n- Veterans and military discounts available',
    how_to_get_it:
      '1. Youth: Apply online at sfmta.com/freemunioryouth\n2. Seniors/Disabled: Apply online with proof of age, disability, and income\n3. Lifeline Pass: Apply through SFMTA with proof of low income\n4. Chase Center: Show your event ticket on game day for free Muni\n5. All programs require Clipper card',
    timeframe: 'Ongoing; some seasonal',
    link_text: 'Learn More',
  },
  'petaluma-transit-free': {
    name: 'Petaluma Transit',
    description:
      'Petaluma Transit is the local public bus service for the City of Petaluma in Sonoma County, providing fixed-route service throughout the city and connections to regional transit.',
    what_they_offer:
      '- All local bus routes are completely free\n- No fare required for any rider\n- Service throughout Petaluma\n- Connections to regional transit available',
    how_to_get_it:
      '1. No registration, pass, or payment needed\n2. Check route map and schedule online\n3. Go to any Petaluma Transit stop\n4. Board when bus arrives—completely free',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'clipper-access': {
    name: 'Clipper Access (RTC)',
    description:
      'Clipper Access (formerly RTC Clipper Card) provides discounted fares for people with disabilities on participating Bay Area transit systems. The Regional Transit Connection program offers reduced fares across the entire Bay Area transit network.',
    what_they_offer:
      '- Reduced fares on most Bay Area transit agencies\n- Typically 50% or more off regular adult fares\n- Valid on BART, Muni, AC Transit, Caltrain, VTA, SamTrans, and more\n- Discounts automatically applied when using Clipper Access card\n- Works on all Clipper-accepting transit agencies',
    how_to_get_it:
      '1. Complete the RTC/Clipper Access application at clippercard.com\n2. Provide proof of disability (Medicare card, SSI/SSDI documentation, or medical certification)\n3. Submit application online or by mail\n4. Once approved, receive Clipper Access card by mail\n5. Load cash value and ride with automatic discounts',
    timeframe: 'Ongoing',
    link_text: 'Apply for Clipper Access',
  },
  samtrans: {
    name: 'SamTrans Way2Go Pass',
    description:
      "SamTrans is San Mateo County's public transit bus service. The Way2Go Pass program provides free unlimited transit for eligible college students through SparkPoint centers.",
    what_they_offer:
      '- FREE unlimited SamTrans bus pass\n- Valid on all SamTrans routes\n- Additional transit support services available\n- Helps students access education and employment',
    how_to_get_it:
      '1. Must be enrolled at a participating college (Skyline, Cañada, CSM)\n2. Visit your campus SparkPoint center\n3. Complete program intake and eligibility verification\n4. Receive Way2Go pass loaded on Clipper card',
    timeframe: 'Academic year',
    link_text: 'Apply',
  },
  'samtrans-youth': {
    name: 'SamTrans',
    description:
      'SamTrans offers a special Summer Youth Pass for young riders, making it easy and affordable for youth to travel throughout San Mateo County during summer months.',
    what_they_offer:
      '- Summer Youth Pass: Unlimited local bus rides June through August\n- Valid on all SamTrans local routes\n- Affordable flat rate for entire summer\n- Great for summer activities, jobs, and recreation',
    how_to_get_it:
      '1. Purchase Summer Youth Pass before or during summer\n2. Available at SamTrans sales outlets and online\n3. Must be 18 years old or younger\n4. Load pass onto Clipper card\n5. Valid June 1 through August 31',
    timeframe: 'Seasonal',
    link_text: 'Buy Pass',
  },
  'santa-rosa-citybus': {
    name: 'Santa Rosa CityBus',
    description:
      'Santa Rosa CityBus provides local public transit service throughout the City of Santa Rosa in Sonoma County, with multiple routes connecting neighborhoods, schools, shopping, and employment centers.',
    what_they_offer:
      '- Free rides for youth 18 and under\n- Free rides for children with paying adult\n- Free rides for veterans with valid ID\n- Free rides for SRJC students with student ID\n- Free rides for some city and county workers',
    how_to_get_it:
      '1. Youth: Show ID proving age 18 or under\n2. Veterans: Show valid military or VA ID\n3. SRJC Students: Show current student ID\n4. City/County Workers: Show employee ID (if eligible)\n5. No separate application needed—just show ID when boarding',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'senior-clipper-card': {
    name: 'Senior Clipper Card',
    description:
      'The Senior Clipper Card provides discounted fares for riders 65 and older on participating Bay Area transit systems.',
    what_they_offer:
      '- Discounted fares on most Bay Area transit agencies\n- Typically 50% off regular adult fares\n- Valid on BART, Muni, AC Transit, Caltrain, and more\n- Discounts automatically applied when using Senior Clipper card',
    how_to_get_it:
      "1. Visit clippercard.com to apply online\n2. Provide proof of age (65 or older)\n3. Valid ID options include driver's license, passport, or Medicare card\n4. Receive Senior Clipper card by mail\n5. Load cash value or passes and ride with automatic senior discounts",
    timeframe: 'Ongoing',
    link_text: 'Visit website',
  },
  'bay-area-park-ride': {
    name: 'Bay Area Park & Ride Lots',
    description:
      'Free parking lots located near major transit hubs and freeway on-ramps throughout the Bay Area, allowing commuters to park and continue their trip via transit, carpool, or vanpool.',
    what_they_offer:
      '- Free parking at designated lots\n- Locations near BART, Caltrain, and bus stations\n- Convenient for carpool and vanpool meetups\n- Reduces single-occupancy vehicle trips\n- Open to all commuters',
    how_to_get_it:
      '1. Visit 511.org to find Park & Ride lots near you\n2. No registration required for most lots\n3. Drive to lot and park in designated spaces\n4. Continue commute via transit, carpool, or vanpool\n5. Some lots may have time limits or overnight restrictions',
    timeframe: 'Ongoing',
    link_text: 'Find Lots',
  },
  'express-lanes-start': {
    name: 'I-880/I-80 Express Lanes START Program',
    description:
      'The START (Savings for Tolling and Reduced Traffic) program provides a 50% discount on express lane tolls for income-eligible drivers on I-880 and I-80 express lanes in Alameda County.',
    what_they_offer:
      '- 50% discount on express lane tolls\n- Available on I-880 Express Lanes\n- Available on I-80 Express Lanes\n- Helps lower-income commuters access faster travel times\n- Works with FasTrak Flex toll tag',
    how_to_get_it:
      '1. Must have household income at or below 200% of federal poverty level\n2. Apply online at expresslanesstart.org\n3. Provide proof of income and residency\n4. Receive FasTrak Flex toll tag if approved\n5. Discount automatically applied when using express lanes',
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  'smc-101-express-lanes-go-card': {
    name: 'San Mateo 101 Express Lanes Go Card',
    description:
      'The San Mateo 101 Express Lanes equity program provides discounted tolls for low-income drivers using the US-101 express lanes in San Mateo County.',
    what_they_offer:
      '- Significant toll discounts for eligible drivers\n- Valid on US-101 Express Lanes in San Mateo County\n- Helps lower-income commuters access express lanes\n- Works with FasTrak toll tag',
    how_to_get_it:
      '1. Must meet income eligibility requirements\n2. Apply online at 101expresslanes.org\n3. Provide proof of income\n4. Receive toll discount on eligible trips',
    timeframe: 'Ongoing',
    link_text: 'Apply Now',
  },
  'bay-area-casual-carpool': {
    name: 'Bay Area Casual Carpool',
    description:
      'Casual carpooling (also called "slugging") is an informal ridesharing system where drivers pick up passengers at designated locations to meet carpool requirements for bridge tolls and HOV lanes.',
    what_they_offer:
      '- Free rides for passengers to San Francisco\n- Reduced bridge tolls for drivers (carpool rate)\n- HOV lane access for drivers\n- No formal registration required\n- Multiple pickup locations throughout East Bay',
    how_to_get_it:
      '1. Find a casual carpool pickup location near you\n2. Line up at designated spots during commute hours\n3. Drivers pull up and passengers get in\n4. Ride is free for passengers\n5. Drivers benefit from carpool toll rates and HOV access',
    timeframe: 'Weekday commute hours',
    link_text: 'Find Locations',
  },
  'bay-area-vanpool': {
    name: 'Bay Area Vanpool Program',
    description:
      '511.org helps commuters form and join vanpools, where groups of 5-15 people share a van for their daily commute, splitting costs and reducing traffic.',
    what_they_offer:
      '- Help finding or forming a vanpool\n- Vanpool matching service\n- Subsidies available through some employers\n- Reduced commute costs compared to driving alone\n- HOV lane access\n- Some vanpools subsidized by MTC',
    how_to_get_it:
      '1. Visit 511.org/vanpool to search for existing vanpools\n2. Enter your home and work locations\n3. Join an existing vanpool or start a new one\n4. Split monthly costs with vanpool members\n5. Many employers offer vanpool subsidies',
    timeframe: 'Ongoing',
    link_text: 'Find Vanpool',
  },
  'bay-area-biking-maps': {
    name: 'Bay Area Biking Maps & Trails',
    description:
      '511.org provides comprehensive biking resources including interactive maps, trail information, and route planning tools for cyclists throughout the Bay Area.',
    what_they_offer:
      '- Interactive bike route maps\n- Trail information and conditions\n- Bike-friendly route planning\n- Information on bike lanes and paths\n- Safety tips and resources\n- Bike share program information',
    how_to_get_it:
      '1. Visit 511.org/biking/maps-n-trails\n2. Use interactive map to find bike routes\n3. Filter by trail type, difficulty, or location\n4. Plan your route using the bike trip planner\n5. Download maps for offline use',
    timeframe: 'Ongoing',
    link_text: 'View Maps',
  },
  'guaranteed-ride-home': {
    name: 'Guaranteed Ride Home',
    description:
      'County-based programs that provide free or reimbursed emergency rides home for commuters who use alternative transportation (transit, carpool, vanpool, biking, or walking) to get to work.',
    what_they_offer:
      '- Free or reimbursed rides home during emergencies\n- Covers illness, family emergencies, unscheduled overtime\n- Available via taxi, Uber/Lyft, or rental car\n- Typically 2-4 free rides per year\n- Separate programs in each Bay Area county',
    how_to_get_it:
      "1. Must commute using alternative transportation (not driving alone)\n2. Register with your county's program (free)\n3. When emergency arises, use taxi or rideshare\n4. Submit receipt for reimbursement\n5. Contact your county program for specific requirements",
    timeframe: 'Ongoing',
    link_text: 'Register Now',
  },
  'commute-rewards': {
    name: 'Bay Area Commute Rewards',
    description:
      'County-level incentive programs that reward Bay Area commuters for using alternatives to driving alone, including transit, carpooling, biking, and walking.',
    what_they_offer:
      '- Cash rewards or prizes for sustainable commuting\n- Tracking tools for commute trips\n- Challenges and competitions\n- Different programs by county\n- Rewards vary by county program',
    how_to_get_it:
      "1. Visit 511.org/carpool/rewards\n2. Find your county's commute rewards program\n3. Register through your county's website\n4. Log your alternative commute trips\n5. Earn rewards based on program rules",
    timeframe: 'Ongoing',
    link_text: 'Find Program',
  },
  'safe-routes-to-school': {
    name: 'Bay Area Safe Routes to School',
    description:
      'Regional initiative helping students travel safely to and from school through walking, biking, and transit, with programs in all nine Bay Area counties.',
    what_they_offer:
      '- Engineering improvements to school routes\n- Crossing guard programs\n- Free or subsidized transit passes (varies by county)\n- Walking and biking safety education\n- Incentive programs and contests\n- Community education campaigns',
    how_to_get_it:
      "1. Contact your county's Safe Routes to School program\n2. Programs available through participating schools\n3. Some counties offer free transit passes for youth\n4. Schools can request safety assessments\n5. Visit sparetheairyouth.org for county contacts",
    timeframe: 'School year',
    link_text: 'Find Program',
  },
  'bay-area-cycling-organizations': {
    name: 'Bay Area Bicycle Coalitions',
    description:
      'Regional bicycle advocacy organizations providing resources, community support, and advocacy for cyclists throughout the Bay Area.',
    what_they_offer:
      '- Bicycle route information and maps\n- Riding clubs and group rides\n- Bike repair resources and workshops\n- Safety education and classes\n- Advocacy for bike infrastructure\n- Community events and programs',
    how_to_get_it:
      '1. Visit 511.org/biking/cycling-organizations\n2. Find your local bicycle coalition\n3. Join as a member (many have free options)\n4. Access resources, maps, and community\n5. Participate in group rides and events',
    timeframe: 'Ongoing',
    link_text: 'Find Coalition',
  },
  'bikelink-bike-lockers': {
    name: 'BikeLink Bike Lockers',
    description:
      'BikeLink operates secure electronic bike lockers at BART stations and transit hubs throughout the Bay Area. These on-demand lockers are available 24/7 and rent for just 5 cents per hour.',
    what_they_offer:
      '- Secure electronic bike lockers at BART stations\n- Available 24/7, no reservation needed\n- Low cost: 5¢/hour\n- Works with BikeLink card ($20 includes $20 credit) or BikeLink app\n- Weather-protected storage',
    how_to_get_it:
      '1. Get a BikeLink card ($20, includes $20 of rental credit)\n2. Or download the BikeLink app\n3. Find an available locker at any BART station\n4. Swipe card or tap phone to lock your bike\n5. Same to unlock when returning',
    timeframe: 'Ongoing',
    link_text: 'Find Lockers',
  },
  'bikeep-smart-racks': {
    name: 'Bikeep Free Bike Parking at BART',
    description:
      'Bikeep smart bike racks at select BART stations provide free secure bike parking. The racks feature industrial-grade steel locking arms and electronic security with zero theft incidents reported across 1 million parking sessions.',
    what_they_offer:
      '- Free secure bike parking at select BART stations\n- Smart locking arm secures frame and wheel\n- 24-hour maximum continuous parking\n- Industrial-grade security with alarm system\n- Works with registered Clipper card',
    how_to_get_it:
      '1. Register online at bikehub.com (takes 30 seconds)\n2. Link your physical Clipper card to your account\n3. Find an available Bikeep rack at the station\n4. Tap your Clipper card to lock your bike\n5. Tap again to unlock when returning',
    timeframe: 'Ongoing',
    link_text: 'Register',
  },
  caltrain: {
    name: 'Caltrain',
    description:
      'Caltrain is a commuter rail line serving the San Francisco Peninsula and Santa Clara Valley, running from San Francisco to Gilroy. Stations offer bike parking, car parking, and transit connections.',
    what_they_offer:
      '- Commuter rail service from SF to Gilroy\n- BikeLink e-lockers at most stations (5¢/hour)\n- Parking at most stations ($5.50/day or $82.50/month)\n- Free parking at stations south of San Jose Diridon\n- Accessible stations with elevators at select locations\n- Restrooms at SF, San Jose Diridon, and pilot stations',
    how_to_get_it:
      '1. Plan your trip at caltrain.com\n2. Buy tickets at station vending machines or use Clipper card\n3. BikeLink e-lockers: Download BikeLink app for 100+ free hours\n4. Parking: Pay at ticket machine or via ParkMobile app\n5. Bikes allowed on all trains in designated cars',
    timeframe: 'Ongoing',
    link_text: 'View Stations',
  },
  'bay-area-ada-paratransit': {
    name: 'Bay Area ADA Paratransit',
    description:
      'ADA Paratransit is a shared-ride, door-to-door transportation service for people who cannot use regular public transit due to a disability. Bay Area transit agencies provide coordinated paratransit service with regional certification—eligibility with one operator grants access to all Bay Area paratransit programs.',
    what_they_offer:
      '- Door-to-door pickup and drop-off service\n- Shared rides via small buses, vans, taxis, or sedans\n- Service available during same hours as regular fixed-route transit\n- Regional certification accepted by all Bay Area operators\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Contact your local transit agency to request an application\n2. Complete the ADA paratransit eligibility application\n3. You may need to complete an in-person assessment\n4. Once certified, you can use paratransit across the Bay Area\n5. Call 511 and say "paratransit" then your city name for local info',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'ac-transit-paratransit': {
    name: 'AC Transit: East Bay Paratransit',
    description:
      'East Bay Paratransit is a shared-ride, door-to-door service for people who are unable to use AC Transit or BART due to a disability. The service covers Alameda and western Contra Costa counties.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service area covers AC Transit and BART service areas\n- Same-day and advance reservation options\n- Free rides for personal care attendants\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Apply for ADA paratransit eligibility\n2. Complete application at actransit.org/paratransit\n3. In-person assessment may be required\n4. Once certified, call to schedule rides',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'samtrans-paratransit': {
    name: 'SamTrans: Redi-Wheels Paratransit',
    description:
      "Redi-Wheels is SamTrans' ADA paratransit service providing door-to-door transportation for San Mateo County residents who cannot use regular bus service due to a disability.",
    what_they_offer:
      '- Door-to-door shared ride service\n- Service throughout San Mateo County\n- Advance reservation required (1-7 days ahead)\n- Wheelchair accessible vehicles\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the ADA paratransit application\n2. Application available at samtrans.com or by calling\n3. In-person eligibility assessment may be required\n4. Once certified, schedule rides by phone or online',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sfmta-paratransit': {
    name: 'SFMTA: SF Paratransit',
    description:
      'SF Paratransit provides door-to-door transportation for San Francisco residents who are unable to use Muni due to a disability. Services include van rides, taxi vouchers, and group van service.',
    what_they_offer:
      '- SF Access van service (shared-ride, door-to-door)\n- Taxi program with discounted vouchers\n- Group Van service for regular trips\n- Shop-a-Round shuttle for grocery shopping\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the SF Paratransit eligibility application\n2. Applications available online or at SFMTA offices\n3. Functional assessment may be required\n4. Choose service options based on your needs\n5. Schedule rides by phone or through the app',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'vta-paratransit': {
    name: 'VTA: ACCESS Paratransit',
    description:
      'VTA ACCESS is an ADA paratransit service providing door-to-door transportation for Santa Clara County residents who cannot use regular VTA buses or light rail due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service throughout Santa Clara County\n- Reservations accepted 1-7 days in advance\n- Wheelchair accessible vehicles\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the VTA ACCESS eligibility application\n2. Download application at vta.org or call for copy\n3. In-person eligibility assessment required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'golden-gate-paratransit': {
    name: 'Golden Gate Transit: Paratransit',
    description:
      'Golden Gate Transit provides ADA paratransit service for eligible riders who cannot use regular Golden Gate Transit bus or ferry service due to a disability. Service operates in Marin and Sonoma counties.',
    what_they_offer:
      '- Door-to-door paratransit service\n- Covers Golden Gate Transit bus and ferry service areas\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the ADA paratransit application\n2. Application available at goldengatetransit.org\n3. Assessment may be required\n4. Once certified, call to schedule rides',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'marin-transit-paratransit': {
    name: 'Marin Transit: Paratransit',
    description:
      'Marin Transit provides ADA paratransit service for Marin County residents who cannot use regular local bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service throughout Marin County\n- Advance reservations required\n- Wheelchair accessible vehicles\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the Marin Transit paratransit application\n2. Application available at marintransit.org\n3. In-person assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'county-connection-paratransit': {
    name: 'County Connection: LINK Paratransit',
    description:
      "LINK is County Connection's ADA paratransit service for Central Contra Costa County residents who cannot use regular bus service due to a disability.",
    what_they_offer:
      '- Door-to-door shared ride service\n- Service in Central Contra Costa County\n- Same-day and advance reservations\n- Wheelchair accessible vehicles\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the LINK paratransit application\n2. Application at countyconnection.com/paratransit\n3. In-person assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'fast-paratransit': {
    name: 'FAST: DART Paratransit',
    description:
      "DART (Dial-A-Ride Transit) is FAST's paratransit service for Fremont residents who cannot use regular bus service due to a disability.",
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Fremont city limits\n- Advance reservations required\n- Wheelchair accessible vehicles\n- Personal care attendants ride free',
    how_to_get_it:
      '1. Complete the DART paratransit application\n2. Application available at fasttransit.org\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'tri-delta-paratransit': {
    name: 'Tri Delta Transit: Paratransit',
    description:
      'Tri Delta Transit provides ADA paratransit service for eastern Contra Costa County residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service in eastern Contra Costa (Antioch, Brentwood, Pittsburg, Oakley)\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Application at trideltatransit.com\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'westcat-paratransit': {
    name: 'WestCAT: Paratransit',
    description:
      'WestCAT provides ADA paratransit service for western Contra Costa County residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service in western Contra Costa (Pinole, Hercules, Rodeo, Crockett)\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Application at westcat.org\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'union-city-paratransit': {
    name: 'Union City Transit: Paratransit',
    description:
      'Union City Transit provides ADA paratransit service for Union City residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Union City\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Contact Union City Transit for application\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'soltrans-paratransit': {
    name: 'SolTrans: Paratransit',
    description:
      'SolTrans provides ADA paratransit service for Vallejo and Benicia residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service in Vallejo and Benicia\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Application at soltrans.org\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'napa-vine-paratransit': {
    name: 'Vine Transit: Vine Go Paratransit',
    description:
      "Vine Go is Napa County's ADA paratransit service for residents who cannot use regular Vine bus service due to a disability.",
    what_they_offer:
      '- Door-to-door shared ride service\n- Service throughout Napa County\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the Vine Go eligibility application\n2. Application at vinetransit.com\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'vacaville-city-coach-paratransit': {
    name: 'City Coach: Paratransit',
    description:
      'City Coach provides door-to-door paratransit service for Vacaville residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Vacaville\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Application at citycoach.com\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'santa-rosa-paratransit': {
    name: 'Santa Rosa CityBus: Paratransit',
    description:
      'Santa Rosa CityBus provides ADA paratransit service for Santa Rosa residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Santa Rosa\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Contact Santa Rosa CityBus for application\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sonoma-county-paratransit': {
    name: 'Sonoma County Transit: Paratransit',
    description:
      'Sonoma County Transit provides ADA paratransit service for Sonoma County residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service throughout Sonoma County\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Application at sctransit.com\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'petaluma-paratransit': {
    name: 'Petaluma Transit: Paratransit',
    description:
      'Petaluma Transit provides ADA paratransit service for Petaluma residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Petaluma\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Contact Petaluma Transit for application\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'rio-vista-paratransit': {
    name: 'Rio Vista Delta Breeze: Paratransit',
    description:
      'Rio Vista Delta Breeze provides ADA paratransit service for Rio Vista residents who cannot use regular bus service due to a disability.',
    what_they_offer:
      '- Door-to-door shared ride service\n- Service within Rio Vista\n- Advance reservations required\n- Wheelchair accessible vehicles',
    how_to_get_it:
      '1. Complete the paratransit eligibility application\n2. Contact Delta Breeze for application\n3. Assessment may be required\n4. Once certified, schedule rides by phone',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cid-borrow-battery': {
    name: 'CID Borrow a Backup Battery',
    description:
      'The Center for Independence of Individuals with Disabilities (CID) provides portable backup batteries to individuals who depend on electricity for medical equipment during Public Safety Power Shutoffs (PSPS).',
    what_they_offer:
      '- Portable backup battery loans during PSPS events\n- Batteries sized for medical equipment (CPAP, oxygen, etc.)\n- No cost to borrow\n- Priority support for Medical Baseline customers\n- Advance notification of PSPS events',
    how_to_get_it:
      "1. Enroll in PG&E's Medical Baseline program\n2. Register with CID's PSPS preparedness program\n3. Provide medical documentation of equipment needs\n4. When PSPS is announced, contact CID to arrange battery pickup\n5. Return battery after power is restored",
    timeframe: 'During PSPS events',
    link_text: 'Learn More',
  },
  cleanpowersf: {
    name: 'CleanPowerSF',
    description:
      "CleanPowerSF is San Francisco's community choice energy program that provides 100% renewable electricity to residents and businesses, with additional bill relief options for qualifying low-income customers.",
    what_they_offer:
      '- 100% renewable electricity at competitive rates\n- Automatic enrollment for SF residents and businesses\n- Bill relief programs for low-income customers\n- SuperGreen option for 100% CA solar/wind\n- Combined savings with PG&E CARE/FERA programs',
    how_to_get_it:
      "1. CleanPowerSF enrollment is automatic for SF residents\n2. For bill relief, enroll in PG&E's CARE or FERA program\n3. CARE/FERA discounts apply to both PG&E delivery and CleanPowerSF generation\n4. Contact CleanPowerSF for additional assistance options\n5. Low-income customers can request rate comparisons",
    timeframe: 'Limited funding',
    link_text: 'Learn More',
  },
  'ebmud-assistance': {
    name: 'EBMUD Customer Assistance Program',
    description:
      'The East Bay Municipal Utility District (EBMUD) Customer Assistance Program provides significant discounts on water and wastewater bills for income-eligible households in Alameda and Contra Costa counties.',
    what_they_offer:
      '- 35% discount on water and wastewater bills (Tier 1)\n- 50% discount for households at 100% federal poverty level (Tier 2)\n- Crisis assistance for customers facing shutoff\n- Flexible payment arrangements\n- Free leak detection assistance',
    how_to_get_it:
      '1. Check income eligibility (based on federal poverty guidelines)\n2. Download application from EBMUD website or call to request\n3. Provide proof of income (tax return, benefit letter, pay stubs)\n4. Submit application by mail, email, or in person\n5. Renew every two years to maintain discount',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  liheap: {
    name: 'LIHEAP',
    description:
      'The Low Income Home Energy Assistance Program (LIHEAP) is a federally funded program that helps low-income households pay their energy bills and make energy-efficient home improvements.',
    what_they_offer:
      '- Up to $3,000 per year for energy bill assistance\n- Help preventing utility disconnection\n- Energy efficiency improvements (weatherization)\n- Energy-related home repairs\n- Crisis assistance for emergencies\n- Assistance with heating and cooling costs',
    how_to_get_it:
      '1. Find your local LIHEAP provider through CSD website\n2. Check income eligibility (typically 60% of state median income)\n3. Gather documents: ID, utility bills, income verification\n4. Submit application through local Community Action Agency\n5. If approved, payment goes directly to utility company',
    timeframe: 'Funding cycles',
    link_text: 'Apply',
  },
  'medical-baseline': {
    name: 'Medical Baseline Allowance',
    description:
      'The Medical Baseline Allowance program provides additional low-cost energy to customers with qualifying medical conditions that require extra electricity or gas, and includes priority notification before power shutoffs.',
    what_they_offer:
      '- Additional baseline energy at lowest tier rates\n- 500 extra kWh of electricity per month\n- 25 extra therms of gas per month (for heating)\n- Advance notification of Public Safety Power Shutoffs (PSPS)\n- Protection from disconnection during extreme weather\n- Eligibility for free portable battery program',
    how_to_get_it:
      '1. Have doctor complete Medical Baseline certification form\n2. Qualifying conditions include: life-support equipment, heating/cooling for medical conditions, CPAP/BiPAP, electric wheelchair, etc.\n3. Submit form to your utility provider (PG&E, SCE, SDG&E, etc.)\n4. Recertify every 2 years (or as required)\n5. Contact utility immediately if medical equipment is affected by outage',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'pce-ebike-rebate': {
    name: 'E-Bike Rebate',
    description:
      'Peninsula Clean Energy offers e-bike rebates to help income-qualified San Mateo County residents transition to clean transportation, reducing both costs and carbon emissions.',
    what_they_offer:
      '- Up to $1,000 rebate for new electric bicycle\n- Available to CARE or FERA program participants\n- Can combine with state CARB e-bike rebate\n- Works with most e-bike retailers\n- Covers standard and cargo e-bikes',
    how_to_get_it:
      "1. Must be a Peninsula Clean Energy customer\n2. Must be enrolled in PG&E's CARE or FERA program\n3. Purchase a new qualifying electric bicycle\n4. Submit rebate application with proof of purchase\n5. Receive rebate check within 6-8 weeks",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pce-heat-pump-rebate': {
    name: 'Heat Pump Heating & Cooling Rebate',
    description:
      'Peninsula Clean Energy offers rebates for San Mateo County residents to replace gas furnaces with efficient electric heat pumps that provide both heating and cooling.',
    what_they_offer:
      '- $1,500 base rebate for heat pump installation\n- Additional $1,000 for CARE/FERA customers ($2,500 total)\n- Replaces gas furnace with electric heat pump\n- Provides both heating and air conditioning\n- Can combine with BayREN and federal incentives\n- Access to vetted contractor network',
    how_to_get_it:
      "1. Verify you're a Peninsula Clean Energy customer\n2. Get quotes from licensed HVAC contractors\n3. Choose a qualifying heat pump system\n4. Complete installation with required permits\n5. Submit rebate application with documentation\n6. Receive rebate check after approval",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pce-home-upgrade-services': {
    name: 'Home Upgrade Services',
    description:
      "Peninsula Clean Energy's Home Upgrade Services provides no-cost electrification for income-eligible homeowners, converting gas appliances to electric with a full-service approach from assessment to installation.",
    what_they_offer:
      '- Free in-home energy assessment\n- No-cost installation of electric appliances\n- Heat pump water heaters and HVAC systems\n- Induction cooktops and electric dryers\n- Electrical panel upgrades if needed\n- All permits and inspections handled\n- Pre-vetted, quality contractors\n- Fixed, transparent pricing',
    how_to_get_it:
      '1. Complete online eligibility survey\n2. Must own single-family home in San Mateo County\n3. Meet income guidelines (typically 80% AMI or below)\n4. Schedule free in-home assessment\n5. Review and approve recommended upgrades\n6. PCE coordinates installation and rebates',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'pce-used-ev-rebate': {
    name: 'Used Electric Vehicle Rebate',
    description:
      'Peninsula Clean Energy helps income-qualified San Mateo County residents afford electric vehicles with a $2,000 rebate toward used plug-in hybrids or fully-electric vehicles.',
    what_they_offer:
      '- $2,000 rebate for used EV purchase\n- Covers plug-in hybrid and fully-electric vehicles\n- Must purchase from licensed dealer\n- Can combine with federal tax credits\n- Can combine with other state/local rebates\n- Stackable with Clean Cars for All program',
    how_to_get_it:
      "1. Verify you're a Peninsula Clean Energy customer\n2. Confirm income eligibility (CARE/FERA enrollment)\n3. Purchase qualifying used EV from licensed dealer\n4. Apply within 180 days of purchase\n5. Submit proof of purchase and vehicle registration\n6. Receive rebate check after approval",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pce-water-heater-rebate': {
    name: 'Water Heater Rebate',
    description:
      'Peninsula Clean Energy offers substantial rebates for San Mateo County residents to replace gas or electric water heaters with efficient heat pump water heaters.',
    what_they_offer:
      '- $2,500 rebate for replacing gas water heater\n- $500 rebate for replacing electric resistance water heater\n- Additional $1,000 for CARE/FERA customers\n- Additional $1,000 for electrical panel upgrade\n- Up to $4,000 total rebate possible\n- Can combine with zero-interest loan program\n- Access to pre-vetted contractors',
    how_to_get_it:
      "1. Verify you're a Peninsula Clean Energy customer\n2. Get quotes from licensed plumbers/contractors\n3. Choose a qualifying heat pump water heater\n4. Complete installation with required permits\n5. Submit rebate application with documentation\n6. Optional: Apply for zero-interest loan for remaining costs",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pce-zero-interest-loan': {
    name: 'Zero Interest Loan for Upgrades',
    description:
      'Peninsula Clean Energy offers zero-interest financing to help San Mateo County residents electrify their homes without upfront costs, with convenient repayment through monthly utility bills.',
    what_they_offer:
      '- Up to $10,000 zero-interest loan\n- No money down required\n- 5-year repayment term\n- Covers heat pump water heaters\n- Covers heat pump HVAC systems\n- Covers electrical panel upgrades\n- Covers energy efficiency improvements\n- Repayment on monthly electric bill',
    how_to_get_it:
      '1. Must be a Peninsula Clean Energy customer\n2. Choose qualifying electrification project\n3. Get quotes from licensed contractors\n4. Apply for financing through PCE\n5. Complete installation\n6. Loan payments added to monthly electric bill',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-amp': {
    name: 'Arrearage Management Plan (AMP)',
    description:
      "PG&E's Arrearage Management Plan helps CARE-enrolled customers reduce their past-due utility debt by forgiving up to $8,000 over 12 months when they make consistent on-time payments.",
    what_they_offer:
      '- Up to $8,000 in debt forgiveness\n- 1/12 of debt forgiven each month\n- Must make on-time payments for 12 months\n- Prevents disconnection while enrolled\n- Can re-enroll if you fall behind\n- Works alongside CARE discount',
    how_to_get_it:
      '1. Must be enrolled in PG&E CARE program\n2. Must owe at least $500 on your account\n3. Account must be more than 90 days past due\n4. Contact PG&E or apply online to enroll\n5. Make on-time monthly payments for 12 months\n6. 1/12 of your debt is forgiven each month you pay on time',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-automated-response': {
    name: 'Automated Response Technology Program',
    description:
      "PG&E's Automated Response Technology Program rewards customers for enrolling smart home devices that can automatically adjust energy use during peak demand periods, helping stabilize the grid.",
    what_they_offer:
      '- $25 enrollment bonus per device\n- Monthly lottery entry for $500 prize\n- Eligible devices: smart thermostats, batteries, EV chargers\n- Automatic adjustments during peak times\n- Helps reduce energy costs\n- Supports grid reliability',
    how_to_get_it:
      "1. Must be a PG&E residential customer\n2. Own a compatible smart device (Nest, ecobee, Tesla, etc.)\n3. Device must be connected to Wi-Fi\n4. Enroll through PG&E's website or app\n5. Allow device to auto-adjust during demand events\n6. Receive $25 bonus and lottery entries",
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'pge-care': {
    name: 'PG&E CARE & FERA',
    description:
      "PG&E's CARE (California Alternate Rates for Energy) and FERA (Family Electric Rate Assistance) programs provide significant utility bill discounts for income-qualified households.",
    what_they_offer:
      '- CARE: 35% discount on electricity, 20% on natural gas\n- FERA: 18% discount on electricity for larger households\n- Gateway to many other programs and rebates\n- Protection from service disconnection during extreme weather\n- Eligibility for Medical Baseline if medically necessary\n- Automatic re-enrollment every 2 years',
    how_to_get_it:
      '1. Check income eligibility (based on household size and income)\n2. CARE: Income at or below 200% federal poverty level\n3. FERA: 3+ person household, slightly higher income limits\n4. Apply online at pge.com/care\n5. Or call PG&E or submit mail-in application\n6. Provide income verification if requested',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpuc-esa': {
    name: 'CPUC Energy Savings Assistance (ESA) Program',
    description:
      'The Energy Savings Assistance Program provides free home energy upgrades and weatherization services to income-qualified households, helping reduce energy bills and improve comfort.',
    what_they_offer:
      '- Free energy assessment of your home\n- LED lighting upgrades\n- New energy-efficient refrigerator\n- Weatherization (insulation, caulking, weather stripping)\n- HVAC repairs or replacement\n- Heat pump water heater installation\n- Smart power strips\n- All services and equipment at no cost',
    how_to_get_it:
      '1. Check income eligibility (typically 200% federal poverty level)\n2. Contact PG&E to request free assessment\n3. Technician visits home to evaluate needs\n4. Receive free installation of qualifying upgrades\n5. Renters and homeowners both eligible\n6. May qualify through CARE enrollment',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-generator-battery-rebate': {
    name: 'Generator & Battery Rebate',
    description:
      'PG&E provides rebates for generators and portable battery storage to help customers in high fire-threat areas prepare for power outages during Public Safety Power Shutoffs.',
    what_they_offer:
      '- $300 rebate on generator purchase\n- $300 rebate on portable battery storage\n- For customers in Tier 2 or 3 High Fire-Threat Districts\n- Must be enrolled in CARE or FERA\n- Helps maintain power during PSPS events\n- One rebate per household per year',
    how_to_get_it:
      "1. Verify you're in Tier 2 or 3 High Fire-Threat District\n2. Must be enrolled in CARE or FERA program\n3. Purchase qualifying generator or battery\n4. Apply online within 90 days of purchase\n5. Submit proof of purchase and CARE/FERA enrollment\n6. Receive rebate check",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sgip-home-battery-sgip': {
    name: 'Home Battery Rebate (SGIP)',
    description:
      'The Self-Generation Incentive Program (SGIP) Equity program provides substantial incentives for income-qualified households to install home battery storage, covering up to 85% of the cost.',
    what_they_offer:
      '- 85% discount on battery storage systems\n- $850 per kWh incentive\n- Covers Tesla Powerwall, Enphase, and other brands\n- Backup power during outages\n- Can pair with solar for maximum savings\n- Priority for Medical Baseline customers',
    how_to_get_it:
      '1. Must meet income eligibility (CARE/FERA or similar)\n2. Work with SGIP-registered contractor\n3. Contractor submits application on your behalf\n4. Get approved before installation\n5. Install qualifying battery storage system\n6. Incentive applied to project cost',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-induction-test-drive': {
    name: 'Induction Cooktop Test Drive',
    description:
      "PG&E's Induction Cooktop Test Drive lets customers try induction cooking at home before making a purchase decision, with a free two-week loaner including everything needed to get started.",
    what_they_offer:
      '- Free two-week induction cooktop loan\n- Portable single-burner induction unit\n- Induction-compatible pan included\n- Instructions and cooking tips\n- Pre-paid return shipping label\n- No cost or obligation to buy',
    how_to_get_it:
      '1. Must be a PG&E customer\n2. Visit the Induction Loaner Library website\n3. Reserve an available induction cooktop\n4. Receive unit by mail\n5. Try it for two weeks\n6. Return using included shipping label',
    timeframe: 'Ongoing',
    link_text: 'Request',
  },
  'pge-match-payment': {
    name: 'PG&E Match My Payment Program',
    description:
      "PG&E's Match My Payment Program helps customers reduce past-due balances by matching every dollar they pay, up to $1,000, effectively cutting their debt in half.",
    what_they_offer:
      '- PG&E matches your payments dollar-for-dollar\n- Up to $1,000 in matching funds\n- Pay $500, PG&E pays $500 for you\n- Helps clear past-due balances faster\n- One-time program (once per account)\n- Available while funds last',
    how_to_get_it:
      '1. Must be a PG&E residential customer\n2. Must have at least $100 past due balance\n3. Meet income eligibility requirements\n4. Contact PG&E to check availability and enroll\n5. Make payments toward your balance\n6. PG&E matches each payment up to $1,000 total',
    timeframe: 'While funds last',
    link_text: 'Apply',
  },
  'pge-permanent-battery-rebate': {
    name: 'Permanent Battery Storage Rebate',
    description:
      'PG&E offers a substantial rebate for permanent home battery storage to customers who have experienced frequent Enhanced Powerline Safety Settings (EPSS) outages, helping them maintain power reliability.',
    what_they_offer:
      '- $7,500 rebate for permanent battery storage\n- For customers with 5+ EPSS outages since Jan 2023\n- Must enroll in Automated Demand Response\n- Must be on time-of-use rate plan\n- Can combine with SGIP incentives\n- Covers Tesla Powerwall, Enphase, and other systems',
    how_to_get_it:
      '1. Use PG&E lookup tool to check EPSS outage history\n2. Must have 5+ outages since January 1, 2023\n3. Enroll in Automated Demand Response program\n4. Switch to time-of-use rate plan\n5. Apply and get approved before installation\n6. Install qualifying battery storage system',
    timeframe: 'Funds exhausted; check back in 2026',
    link_text: 'Check Status',
  },
  'pge-portable-battery': {
    name: 'Portable Battery Program',
    description:
      'PG&E provides free portable backup batteries to customers who depend on electricity for medical equipment and have experienced power shutoffs, ensuring they can maintain critical care during outages.',
    what_they_offer:
      '- Free portable backup battery\n- For Medical Baseline customers\n- For Self-Identified Vulnerable customers\n- Powers medical devices during outages\n- For those who experienced PSPS or EPSS outages\n- Battery shipped directly to your home',
    how_to_get_it:
      '1. Must be enrolled in Medical Baseline program\n2. Or registered as Self-Identified Vulnerable customer\n3. Must rely on electricity for medical equipment\n4. Must have experienced PSPS or EPSS outage\n5. Apply through PG&E website or call\n6. Battery shipped to your address at no cost',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-reach': {
    name: 'Relief for Energy Assistance through Community Help (REACH)',
    description:
      'The REACH program provides emergency bill assistance for PG&E customers facing disconnection, offering up to $300 to help income-eligible households avoid losing power or gas service.',
    what_they_offer:
      '- Up to $300 energy bill credit\n- Helps prevent service disconnection\n- For customers who received shutoff notice\n- Available once every 12 months\n- Payment goes directly to PG&E bill\n- Can combine with other assistance programs',
    how_to_get_it:
      '1. Must be income-eligible (up to 200% federal poverty level)\n2. Must have received 15-day or 48-hour disconnection notice\n3. Apply online or call REACH hotline\n4. Provide proof of income if requested\n5. Credit applied directly to your PG&E account\n6. Can reapply after 12 months if needed',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-residential-charging': {
    name: 'Residential Charging Solutions Rebate',
    description:
      "PG&E's Residential Charging Solutions Rebate covers up to 100% of the cost of home EV charging equipment and installation for income-qualified customers, making electric vehicle ownership more accessible.",
    what_they_offer:
      '- Up to 100% rebate on EV charger cost\n- Covers installation by licensed electrician\n- PG&E-approved charging equipment\n- Available for CARE/FERA customers\n- Level 2 charging capability\n- Faster home charging than standard outlet',
    how_to_get_it:
      '1. Must be enrolled in CARE or FERA program\n2. Must own or lease an electric vehicle\n3. Choose PG&E-approved charging equipment\n4. Hire licensed California electrician\n5. Complete installation and inspection\n6. Apply for rebate with documentation',
    timeframe: 'While funds last',
    link_text: 'Apply',
  },
  'pge-used-ev-rebate': {
    name: 'Used Electric Vehicle Rebate',
    description:
      'PG&E offers a $4,000 rebate for income-qualified customers purchasing pre-owned electric vehicles, making EVs more affordable whether buying from dealers or private sellers.',
    what_they_offer:
      '- $4,000 rebate for used EV purchase\n- Covers Battery Electric Vehicles (BEV)\n- Covers Plug-in Hybrid Electric Vehicles (PHEV)\n- Purchase from dealer or private party\n- Can combine with federal tax credits\n- Can combine with other state/local rebates',
    how_to_get_it:
      '1. Must be a PG&E customer\n2. Meet income eligibility (CARE/FERA or income-qualified)\n3. Purchase or lease qualifying used EV\n4. Apply within 180 days of purchase\n5. Submit proof of purchase and registration\n6. Receive rebate after approval',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-v2x-pilot': {
    name: 'Vehicle-to-Everything (V2X) Pilot Program',
    description:
      "PG&E's V2X pilot program provides rebates for bidirectional EV chargers that can power your home using your electric vehicle's battery during outages or peak demand periods.",
    what_they_offer:
      '- $2,500-$4,000 rebate for V2X charger\n- Additional $1,500 for early adopters\n- Powers home from EV battery\n- Backup power during outages\n- Can sell energy back to grid\n- Compatible with select EVs (Ford F-150 Lightning, etc.)',
    how_to_get_it:
      "1. Must be a PG&E residential customer\n2. Own a V2X-compatible electric vehicle\n3. Purchase approved bidirectional charger\n4. Hire licensed electrician for installation\n5. Apply through PG&E's V2X portal\n6. Receive rebate after installation verification",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'pge-wattersaver': {
    name: 'WatterSaver',
    description:
      'WatterSaver is a demand response program that pays customers to enroll their smart electric water heaters, automatically shifting water heating to off-peak times to save money and support the grid.',
    what_they_offer:
      '- $50 enrollment bonus\n- $5 per month for participation\n- Automatic water heating optimization\n- Shifts heating to lower-cost times\n- No change to hot water availability\n- Smart control via Wi-Fi',
    how_to_get_it:
      '1. Must have Wi-Fi-enabled electric water heater\n2. Compatible brands include Rheem, A.O. Smith, Bradford White\n3. Sign up on WatterSaver website\n4. Connect water heater to Wi-Fi\n5. Receive $50 enrollment bonus\n6. Earn $5/month ongoing (program currently on hold)',
    timeframe: 'Program on hold; sign up for notifications',
    link_text: 'Get Notified',
  },
  'baaqmd-clean-cars-ev': {
    name: 'Clean Cars for All - EV',
    description:
      "The Bay Area Air Quality Management District's Clean Cars for All program provides substantial incentives for income-qualified residents to replace older polluting vehicles with new or used electric vehicles.",
    what_they_offer:
      '- $10,000-$12,000 rebate for EV purchase or lease\n- New or used battery electric vehicles qualify\n- Additional $2,000 for home EV charger\n- Trade in pre-2008 gas or diesel vehicle\n- Covers purchase or lease up to 4 years\n- Can combine with federal tax credits',
    how_to_get_it:
      '1. Must live in Bay Area (9-county region)\n2. Household income at or below 400% federal poverty level\n3. Own a registered pre-2008 gas/diesel vehicle\n4. Vehicle must be running and pass smog\n5. Apply and get pre-approved BEFORE purchase\n6. Trade in old vehicle and buy/lease qualifying EV',
    timeframe: 'While funding lasts',
    link_text: 'Apply',
  },
  'baaqmd-clean-cars-fuel-cell': {
    name: 'Clean Cars for All - Fuel Cell Vehicle',
    description:
      'The Clean Cars for All program also offers rebates for hydrogen fuel cell vehicles, providing another zero-emission option for Bay Area residents replacing older polluting vehicles.',
    what_they_offer:
      '- $10,000 rebate for fuel cell vehicle\n- New or used fuel cell vehicles qualify\n- Trade in pre-2007 gas or diesel vehicle\n- Covers purchase or lease\n- Zero emissions, hydrogen-powered\n- Can combine with other incentives',
    how_to_get_it:
      '1. Must live in Bay Area (9-county region)\n2. Household income at or below 400% federal poverty level\n3. Own a registered pre-2007 gas/diesel vehicle\n4. Vehicle must be running and pass smog\n5. Apply and get pre-approved BEFORE purchase\n6. Trade in old vehicle and buy/lease fuel cell vehicle',
    timeframe: 'While funding lasts',
    link_text: 'Apply',
  },
  'baaqmd-clean-cars-ebike-transit': {
    name: 'Clean Cars for All - E-Bike & Transit Credit',
    description:
      "For those who don't need a car, Clean Cars for All offers a mobility option combining an e-bike and transit credits, providing sustainable transportation alternatives when trading in an older vehicle.",
    what_they_offer:
      '- $7,500 total value mobility package\n- Electric bicycle included\n- Bay Area transit credit/passes\n- Trade in pre-2008 gas or diesel vehicle\n- Supports car-free lifestyle\n- Covers multiple transit agencies',
    how_to_get_it:
      '1. Must live in Bay Area (9-county region)\n2. Household income at or below 400% federal poverty level\n3. Own a registered pre-2008 gas/diesel vehicle\n4. Vehicle must be running and pass smog\n5. Apply and get pre-approved\n6. Trade in old vehicle and receive e-bike + transit credits',
    timeframe: 'While funding lasts',
    link_text: 'Apply',
  },
  'baaqmd-vehicle-buyback': {
    name: 'Vehicle Buy Back Program',
    description:
      "BAAQMD's Vehicle Buy Back program pays $2,000 for older vehicles to be scrapped, reducing air pollution from high-emitting cars while providing owners compensation for retiring their vehicles.",
    what_they_offer:
      '- $2,000 payment for your old vehicle\n- Vehicle must be year 2000 or older\n- Cars and small trucks eligible\n- Vehicle must be running\n- No income requirements\n- Open to all Bay Area residents',
    how_to_get_it:
      '1. Must own vehicle for at least 2 years\n2. Vehicle registered in Bay Area for 2+ years\n3. Vehicle must be year 2000 or older\n4. Must be in running condition\n5. Contact BAAQMD to schedule inspection\n6. If approved, receive $2,000 and vehicle is scrapped',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'baaqmd-wood-stove': {
    name: 'Wood Stove Replacement Program',
    description:
      "BAAQMD's Wood Stove Replacement Program helps Bay Area residents replace wood-burning stoves with clean electric heat pumps, improving air quality and reducing home heating costs.",
    what_they_offer:
      '- Up to $6,500 base incentive for heat pump replacement\n- Additional $4,000 for Food Stamps/WIC/SSI recipients\n- Up to $10,500 total for income-qualified households\n- Up to $1,000 for removal only (no replacement)\n- Priority for disadvantaged communities\n- Covers installation costs',
    how_to_get_it:
      '1. Sign up for program notifications on BAAQMD website\n2. Must have wood-burning stove or fireplace\n3. Apply when program reopens (January 13, 2026)\n4. Submit income documentation if claiming additional rebate\n5. Get approved and schedule installation\n6. Receive incentive after project completion',
    timeframe: 'Reopens January 13, 2026',
    link_text: 'Sign Up for Notifications',
  },
  'carb-ebike-rebate': {
    name: 'E-Bike Rebate',
    description:
      'The California Air Resources Board (CARB) E-Bike Incentive Project provides substantial point-of-sale discounts for income-qualified residents to purchase new electric bicycles.',
    what_they_offer:
      '- Up to $2,000 instant discount on new e-bike\n- Point-of-sale reduction (no waiting for rebate)\n- Covers standard and cargo e-bikes\n- Additional for adaptive e-bikes\n- Available at participating retailers\n- Vouchers released in rounds',
    how_to_get_it:
      '1. Sign up for email notifications on CARB website\n2. When vouchers available, apply online quickly\n3. Meet income eligibility (typically 300% federal poverty level)\n4. Receive voucher code if selected\n5. Use voucher at participating e-bike retailer\n6. Discount applied at checkout',
    timeframe: 'Limited vouchers; sign up for notifications',
    link_text: 'Sign Up',
  },
  'ca-old-vehicle-retirement': {
    name: 'Old Vehicle Retirement',
    description:
      "California's Consumer Assistance Program offers payment to retire vehicles that have failed smog inspections, helping low-income residents get problem vehicles off the road.",
    what_they_offer:
      '- $1,500 for vehicles that failed previous smog check\n- $2,000 for vehicles that failed most recent inspection\n- Vehicle must be retired (scrapped)\n- No repair required before retiring\n- Payment issued after vehicle retirement\n- Helps reduce air pollution',
    how_to_get_it:
      '1. Vehicle must have failed a smog check\n2. Check income eligibility on BAR website\n3. Must have owned and registered vehicle for 2+ years\n4. Submit application through Bureau of Automotive Repair\n5. Get vehicle dismantled at authorized facility\n6. Receive payment after retirement confirmation',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'dcap-clean-cars': {
    name: 'Driving Clean Assistance Program: Clean Cars 4 All',
    description:
      'The Driving Clean Assistance Program provides comprehensive support for income-qualified Californians to trade in old gas vehicles for clean alternatives, including financial counseling and down payment help.',
    what_they_offer:
      '- Up to $10,000 toward clean vehicle purchase\n- Additional $2,000 charging/fueling card\n- Alternative: $7,500 mobility option (e-bike + transit)\n- Down payment assistance\n- Financial counseling services\n- Lender referrals for financing',
    how_to_get_it:
      '1. Check income eligibility on DCAP website\n2. MUST apply BEFORE trading in your car\n3. Vehicle must meet age and emissions requirements\n4. Complete application with income documentation\n5. Get pre-approved before vehicle purchase\n6. Trade in old vehicle and purchase/lease clean vehicle',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'federal-ev-charger-credit': {
    name: 'Home EV Charger Federal Tax Credit',
    description:
      'The federal 30C tax credit provides a 30% tax credit for installing electric vehicle charging equipment at home, available in eligible low-income and rural census tracts.',
    what_they_offer:
      '- 30% tax credit on EV charger installation\n- Up to $1,000 maximum credit\n- Covers charger equipment and installation\n- Available in eligible census tracts\n- Reduces federal income tax owed\n- Applies to primary and secondary homes',
    how_to_get_it:
      '1. Check if your address is in eligible census tract\n2. Use Rewiring America eligibility map tool\n3. Purchase and install EV charging equipment\n4. Keep all receipts and documentation\n5. File IRS Form 8911 with tax return\n6. Credit reduces your tax liability',
    timeframe: 'Through June 30, 2026',
    link_text: 'Check Eligibility',
  },
  'weatherization-assistance': {
    name: 'Weatherization Assistance Program',
    description:
      "California's Weatherization Assistance Program provides free energy efficiency upgrades to help low-income households reduce energy costs and improve home comfort and safety.",
    what_they_offer:
      '- Free home energy audit\n- Insulation (attic, wall, floor)\n- Air sealing and weatherstripping\n- Heating system repairs or replacement\n- Water heater repairs or replacement\n- Minor home repairs for energy efficiency\n- All services at no cost',
    how_to_get_it:
      '1. Find your local weatherization provider\n2. Check income eligibility (typically 200% federal poverty level)\n3. Submit application with income documentation\n4. Technician conducts home energy audit\n5. Eligible improvements installed at no cost\n6. Both homeowners and renters can apply',
    timeframe: 'Ongoing',
    link_text: 'Check Availability',
  },
  'bayren-ease': {
    name: 'Efficiency and Sustainable Energy (EASE) Home Program',
    description:
      "BayREN's EASE Home Program covers 80% of home efficiency upgrade costs for income-qualified Bay Area homeowners, with a capped out-of-pocket maximum and vetted contractors.",
    what_they_offer:
      '- 80% of upgrade costs covered by BayREN\n- Your share capped at $1,000 maximum\n- Insulation upgrades\n- Duct sealing and HVAC improvements\n- Help applying for additional rebates\n- Fixed pricing with pre-vetted contractors\n- No surprise costs',
    how_to_get_it:
      '1. Check income eligibility (varies by household size)\n2. Apply through BayREN website\n3. Schedule free home energy assessment\n4. Review recommended improvements and costs\n5. BayREN handles rebate applications\n6. Pay your capped share (max $1,000)',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'bayren-home-assessment': {
    name: 'Home Energy Assessment',
    description:
      'BayREN offers rebates for professional home energy assessments, providing homeowners with a comprehensive score and report identifying upgrades that can reduce energy costs.',
    what_they_offer:
      '- $200 rebate for energy assessment\n- Professional in-home evaluation\n- Home Energy Score (1-10 rating)\n- Detailed report of improvement opportunities\n- Cost and savings estimates\n- Prioritized upgrade recommendations\n- Helps plan home electrification',
    how_to_get_it:
      '1. Find a BayREN-qualified assessor on website\n2. Schedule in-home energy assessment\n3. Assessor evaluates home and provides score\n4. Receive detailed report with recommendations\n5. Submit rebate application with assessment receipt\n6. Receive $200 rebate',
    timeframe: 'Ongoing',
    link_text: 'Find an Assessor',
  },
  'calwater-rebates': {
    name: 'Water Conservation Rebates',
    description:
      'Cal Water offers a variety of rebates for water-saving products and landscape improvements, plus free conservation kits to help customers reduce water usage and lower bills.',
    what_they_offer:
      '- High-efficiency toilet rebates\n- Smart irrigation controller rebates\n- Lawn replacement/turf conversion rebates\n- High-efficiency faucet rebates\n- Free water conservation kit\n- Leak detection resources\n- Various seasonal promotions',
    how_to_get_it:
      "1. Verify you're a Cal Water customer\n2. Browse available rebates on website\n3. Check product eligibility requirements\n4. Purchase qualifying water-saving product\n5. Submit rebate application with proof of purchase\n6. Request free conservation kit separately",
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'energy-smart-homes-electrification': {
    name: 'Whole Building Electrification',
    description:
      'The Energy Smart Homes program provides incentives for fully electrifying homes by removing all gas appliances and switching to efficient electric alternatives.',
    what_they_offer:
      '- $4,250+ total incentive for full electrification\n- Heat pump HVAC system incentive\n- Heat pump water heater incentive\n- Induction cooking incentive\n- Electric dryer incentive\n- Covers single-family homes\n- Covers multi-family low-rise and ADUs',
    how_to_get_it:
      '1. Plan to replace ALL gas appliances with electric\n2. Apply through Energy Smart Homes website\n3. Get quotes from contractors\n4. Complete installation of all electric appliances\n5. Submit documentation for rebate\n6. Receive incentive after verification',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'golden-state-heat-pump-water': {
    name: 'Heat Pump Water Heater',
    description:
      'Golden State Rebates offers instant discounts on heat pump water heaters at participating retailers, making it easy to upgrade from gas or electric tank water heaters.',
    what_they_offer:
      '- $500-$900 instant discount at checkout\n- No rebate forms to submit\n- Applied when replacing gas water heater\n- Applied when replacing electric tank heater\n- Can combine with utility and federal incentives\n- Available at major home improvement stores',
    how_to_get_it:
      '1. Find participating retailer on website\n2. Shop for qualifying heat pump water heater\n3. Discount applied automatically at checkout\n4. Must replace existing gas or electric tank\n5. No paperwork required\n6. Stack with other available incentives',
    timeframe: 'Ongoing',
    link_text: 'Find Retailer',
  },
  'golden-state-gas-water-heater': {
    name: 'High Efficiency Gas Water Heater',
    description:
      'For those not ready to switch to electric, Golden State Rebates offers a discount on high-efficiency gas water heaters at participating retailers.',
    what_they_offer:
      '- $75 instant discount at checkout\n- No rebate forms to submit\n- For high-efficiency gas models\n- Must replace similar-sized gas unit\n- Can combine with federal incentives\n- Available at major home improvement stores',
    how_to_get_it:
      '1. Find participating retailer on website\n2. Shop for qualifying high-efficiency gas water heater\n3. Discount applied automatically at checkout\n4. Must replace existing gas unit of similar size\n5. No paperwork required\n6. Can stack with federal tax credits if applicable',
    timeframe: 'Ongoing',
    link_text: 'Find Retailer',
  },
  'golden-state-room-ac': {
    name: 'Room Air Conditioner',
    description:
      'Golden State Rebates provides instant discounts on Energy Star-certified room air conditioners at participating retailers across California.',
    what_they_offer:
      '- $90 instant discount at checkout\n- No rebate forms to submit\n- Must be Energy Star certified\n- Portable and window units eligible\n- Available at major home improvement stores\n- Automatic discount at register',
    how_to_get_it:
      '1. Find participating retailer on website\n2. Shop for Energy Star-certified room AC\n3. Discount applied automatically at checkout\n4. No paperwork or forms required\n5. Take unit home same day\n6. Save on cooling costs with efficient model',
    timeframe: 'Ongoing',
    link_text: 'Find Retailer',
  },
  'golden-state-smart-thermostat': {
    name: 'Smart Thermostat',
    description:
      'Golden State Rebates offers instant discounts on smart thermostats at participating retailers, helping Californians save energy with programmable temperature control.',
    what_they_offer:
      '- $40-$60 instant discount at checkout\n- No rebate forms to submit\n- Popular brands like Nest, ecobee, Honeywell\n- Helps reduce heating/cooling costs\n- Remote control via smartphone\n- Available at major retailers',
    how_to_get_it:
      '1. Home must have AC and gas furnace\n2. Must replace non-smart thermostat\n3. Find participating retailer on website\n4. Shop for qualifying smart thermostat\n5. Discount applied automatically at checkout\n6. No paperwork required',
    timeframe: 'Ongoing',
    link_text: 'Find Retailer',
  },
  ohmconnect: {
    name: 'OhmConnect',
    description:
      'OhmConnect is a free program that pays Californians to reduce energy use during peak demand times, while offering bonuses and free smart home devices.',
    what_they_offer:
      '- $50 sign-up credit\n- Earn rewards for reducing energy during peak hours\n- Free or discounted smart thermostat\n- Free smart plugs for automation\n- Cash rewards via PayPal or gift cards\n- No cost to participate',
    how_to_get_it:
      '1. Sign up free on OhmConnect website\n2. Connect your utility account\n3. Receive #OhmHour alerts during peak demand\n4. Reduce energy use during those periods\n5. Earn points redeemable for cash/prizes\n6. Automate savings with free smart devices',
    timeframe: 'Ongoing',
    link_text: 'Sign Up',
  },
  'quitcarbon-rebate': {
    name: 'QuitCarbon Rebate',
    description:
      'QuitCarbon offers additional rebates when you use their free home electrification planning service and their network of contractors for qualifying projects over $4,000.',
    what_they_offer:
      '- $100 rebate for first qualifying upgrade\n- $200 rebate for second qualifying upgrade\n- Up to $300 total\n- Covers heat pump HVAC\n- Covers heat pump water heater\n- Covers solar/battery installations\n- Covers battery-equipped induction ranges',
    how_to_get_it:
      "1. Use QuitCarbon's free electrification planning\n2. Get referral to their contractor network\n3. Complete project over $4,000\n4. Contractor and sales must be QuitCarbon referrals\n5. Receive $100 for first upgrade\n6. Receive $200 for second upgrade",
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'recology-discount': {
    name: 'Recology 25% Low-Income Discount Program',
    description:
      'Recology San Francisco offers a 25% discount on garbage collection bills for income-qualified San Francisco residents, helping reduce the cost of essential waste services.',
    what_they_offer:
      '- 25% discount on garbage collection bills\n- Applies to all Recology refuse services\n- Includes recycling and composting\n- Automatic discount once enrolled\n- Available to income-qualified residents\n- Renew periodically to maintain discount',
    how_to_get_it:
      '1. Must be a San Francisco resident\n2. Check income eligibility requirements\n3. Submit application through SF.gov\n4. Provide income documentation\n5. Once approved, discount applied to future bills\n6. Re-certify as required',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'redwood-city-electrification': {
    name: 'Building Electrification Rebate Program',
    description:
      'The City of Redwood City offers rebates to help residents electrify their homes with heat pump water heaters, HVAC systems, and electrical panel upgrades.',
    what_they_offer:
      '- $500 rebate for heat pump water heater\n- $500 rebate for high-efficiency heat pump HVAC\n- Up to $500 for electrical panel upgrade\n- Additional $500 for CARE customers on each rebate\n- Can combine with other incentives\n- For Redwood City residents only',
    how_to_get_it:
      '1. Must be a Redwood City resident\n2. Install qualifying equipment\n3. Apply through City of Redwood City website\n4. Submit proof of purchase and installation\n5. CARE customers submit CARE enrollment proof\n6. Receive rebate check',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'redwood-city-ev-charger': {
    name: 'Electric Vehicle (EV) Charger Rebate Program',
    description:
      'The City of Redwood City offers rebates for residents installing Level 2 EV chargers at home, making electric vehicle ownership more convenient.',
    what_they_offer:
      '- $500 rebate for Level 2 EV charger\n- Covers charger purchase and installation\n- For Redwood City residents only\n- Faster charging than standard outlet\n- Can combine with federal tax credit\n- Can combine with utility rebates',
    how_to_get_it:
      '1. Must be a Redwood City resident\n2. Purchase and install Level 2 EV charger\n3. Use licensed electrician for installation\n4. Apply through City of Redwood City website\n5. Submit proof of purchase and installation\n6. Receive rebate check',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'redwood-city-lawn-equipment': {
    name: 'Electric Lawn Care Equipment Rebate',
    description:
      'The City of Redwood City offers rebates for switching from gas-powered lawn equipment to electric, reducing noise and air pollution in the community.',
    what_they_offer:
      '- Up to $150 rebate for residents\n- Up to $300 rebate for businesses\n- Covers leaf blowers\n- Covers string trimmers\n- Covers hedge trimmers, edgers, tillers\n- Must trade in gas-powered equipment',
    how_to_get_it:
      '1. Must be Redwood City resident or business\n2. Purchase qualifying electric lawn equipment\n3. Turn in old gas-powered equipment at designated location\n4. Apply through City of Redwood City website\n5. Submit proof of purchase and trade-in\n6. Receive rebate check',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'redwood-city-solar': {
    name: 'Solar Rebate Program',
    description:
      'The City of Redwood City offers rebates for residents installing solar panels, helping reduce electricity costs and promote renewable energy.',
    what_they_offer:
      '- $500 rebate for solar installation\n- For Redwood City residents only\n- Can combine with federal 30% tax credit\n- Can combine with utility incentives\n- Reduces electricity bills\n- Increases home value',
    how_to_get_it:
      '1. Must be a Redwood City resident\n2. Install qualifying solar PV system\n3. Use licensed solar installer\n4. Apply through City of Redwood City website\n5. Submit proof of installation\n6. Receive rebate check',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'rising-sun-green-house': {
    name: 'Green House Call',
    description:
      'Rising Sun Center for Opportunity provides free virtual energy assessments and ships free energy and water-saving products directly to Bay Area residents at no cost.',
    what_they_offer:
      '- Free virtual energy assessment\n- Free LED lightbulbs shipped to you\n- Free low-flow shower heads\n- Free faucet aerators\n- Free smart power strips\n- Personalized energy-saving tips\n- Youth employment program benefit',
    how_to_get_it:
      '1. Complete online survey on Rising Sun website\n2. Schedule virtual Green House Call\n3. Meet with trained youth intern virtually\n4. Receive personalized recommendations\n5. Free products shipped to your home\n6. No cost or obligation',
    timeframe: 'While funds last',
    link_text: 'Complete the Survey',
  },
  'sfpuc-cap': {
    name: 'SFPUC Customer Assistance Program (CAP)',
    description:
      'The San Francisco Public Utilities Commission Customer Assistance Program provides significant discounts on water and sewer bills plus protections from shutoffs for income-qualified San Francisco residents.',
    what_they_offer:
      '- 40% discount on water and sewer bills\n- Protection from service shutoffs\n- No late fees for CAP participants\n- Applies to all SFPUC water/sewer charges\n- Automatic enrollment renewal\n- Crisis assistance available',
    how_to_get_it:
      '1. Must be a San Francisco resident\n2. Check income eligibility requirements\n3. Enroll through SFPUC website or call\n4. Provide proof of income\n5. Once approved, discount applied to bills\n6. Re-certify periodically',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'thermostat-care-mercury': {
    name: 'Mercury Thermostat Recycling Rebate',
    description:
      'Thermostat Recycling Corporation pays $30 per mercury thermostat recycled at designated drop-off locations, helping safely dispose of hazardous mercury while rewarding environmentally responsible behavior.',
    what_they_offer:
      '- $30 mail-in rebate per thermostat\n- Proper disposal of hazardous mercury\n- Multiple thermostats allowed per rebate\n- Drop-off at participating HVAC contractors\n- Drop-off at some home improvement stores\n- Environmental benefit',
    how_to_get_it:
      '1. Remove old mercury thermostat carefully\n2. Find nearest drop-off location on website\n3. Bring thermostat to designated location\n4. Get receipt or confirmation of drop-off\n5. Submit rebate form with documentation\n6. Receive $30 rebate check per thermostat',
    timeframe: 'Ongoing',
    link_text: 'Find Location',
  },
  'svp-ebike-rebate': {
    name: 'Electric Bicycle Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents purchasing new electric bicycles, with additional incentives for income-qualified customers.',
    what_they_offer:
      '- 10% rebate on new e-bike, up to $300\n- Additional $200 for income-qualified customers\n- Up to $500 total for income-qualified\n- Covers standard and cargo e-bikes\n- New purchases only\n- For Santa Clara residents only',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Purchase new qualifying electric bicycle\n3. Submit application within 60 days of purchase\n4. Include proof of purchase and residency\n5. Income-qualified submit additional documentation\n6. Receive rebate check',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-ev-charger-rebate': {
    name: 'EV Charging Station Rebate',
    description:
      'Silicon Valley Power provides rebates for installing EV charging stations at homes, apartments, schools, nonprofits, and businesses in Santa Clara.',
    what_they_offer:
      '- Up to $550 rebate for EV charger installation\n- Available for residential homes\n- Available for multifamily properties\n- Available for schools and nonprofits\n- Available for commercial facilities\n- Level 2 charging stations eligible',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Purchase and install qualifying EV charger\n3. Use licensed electrician for installation\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase and installation\n6. Receive rebate after approval',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-used-ev-rebate': {
    name: 'Income-Qualified Pre-Owned Electric Vehicle Rebate',
    description:
      'Silicon Valley Power offers substantial rebates for income-qualified Santa Clara residents purchasing pre-owned electric vehicles, with bonuses for efficiency and LIHEAP eligibility.',
    what_they_offer:
      '- $1,500 rebate for fully electric vehicles\n- $1,000 rebate for plug-in hybrids\n- Additional $1,000 bonus for LIHEAP-eligible\n- Additional $1,000 for vehicles with MPGe 117+\n- Up to $3,500 total possible\n- Pre-owned vehicles qualify',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Meet income eligibility requirements\n3. Purchase qualifying pre-owned EV\n4. Apply online after purchase\n5. Submit proof of purchase and income\n6. LIHEAP customers submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-induction-cooktop-rebate': {
    name: 'Induction Cooktop, Range & Oven Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents switching from gas to induction cooking, with enhanced rebates for income-qualified customers.',
    what_they_offer:
      '- Up to $750 rebate for induction range\n- Up to $950 for income-qualified customers\n- Covers induction cooktops\n- Covers induction ranges\n- Covers wall ovens\n- Must replace gas cooking equipment',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Replace gas cooking equipment with induction\n3. Purchase qualifying induction cooktop/range/oven\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase and installation\n6. Income-qualified submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-heat-pump-dryer-rebate': {
    name: 'Heat Pump Clothes Dryer Rebate',
    description:
      'Silicon Valley Power provides rebates for Santa Clara residents switching from gas to high-efficiency heat pump dryers, which use less energy than standard electric dryers.',
    what_they_offer:
      '- Up to $250 rebate for heat pump dryer\n- Up to $350 for income-qualified customers\n- Must replace gas dryer\n- Heat pump dryers use 50% less energy\n- More efficient than standard electric dryers\n- Gentler on clothes',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Replace gas dryer with heat pump dryer\n3. Purchase qualifying heat pump clothes dryer\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase\n6. Income-qualified submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-electric-dryer-rebate': {
    name: 'Electric Clothes Dryer Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents switching from gas to standard electric dryers, with enhanced rebates for income-qualified customers.',
    what_they_offer:
      '- Up to $150 rebate for electric dryer\n- Up to $350 for income-qualified customers\n- Must replace gas dryer\n- Standard electric dryer option\n- More affordable than heat pump option\n- Eliminates gas combustion indoors',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Replace gas dryer with electric dryer\n3. Purchase qualifying electric clothes dryer\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase\n6. Income-qualified submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-hpwh-gas-rebate': {
    name: 'Heat Pump Water Heater Rebate (Gas Replacement)',
    description:
      'Silicon Valley Power offers one of the highest heat pump water heater rebates in California for Santa Clara residents replacing gas water heaters.',
    what_they_offer:
      '- Up to $5,500 rebate for heat pump water heater\n- Up to $6,500 for income-qualified customers\n- Must replace gas water heater\n- ENERGY STAR certified models required\n- Significant energy savings\n- Can combine with federal tax credits',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Replace existing gas water heater\n3. Purchase ENERGY STAR heat pump water heater\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase and installation\n6. Income-qualified submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-hpwh-electric-rebate': {
    name: 'Heat Pump Water Heater Rebate (Electric Replacement)',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents upgrading from inefficient electric resistance water heaters to efficient heat pump models.',
    what_they_offer:
      '- $500 rebate for heat pump water heater\n- Additional $500 for income-qualified customers\n- Must replace electric resistance water heater\n- ENERGY STAR certified models required\n- Significant energy savings (50-70%)\n- Lower operating costs',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Obtain permit from City of Santa Clara\n3. Replace electric resistance water heater\n4. Purchase ENERGY STAR heat pump water heater\n5. Apply online through SVP rebate platform\n6. Submit permit and proof of purchase',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-heat-pump-hvac-rebate': {
    name: 'Heat Pump HVAC Rebate',
    description:
      'Silicon Valley Power offers one of the most generous heat pump HVAC rebates in California for Santa Clara residents replacing gas furnaces.',
    what_they_offer:
      '- Up to $10,000 rebate ($3,000 per ton)\n- Up to $11,000 for income-qualified customers\n- Replaces gas furnace and/or AC\n- High-efficiency heat pump provides heating and cooling\n- Significant energy savings\n- Improved indoor air quality',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Replace gas furnace and/or AC with heat pump\n3. Use licensed HVAC contractor\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase and installation\n6. Income-qualified submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-hvac-tuneup-rebate': {
    name: 'HVAC Tune-Up Rebate',
    description:
      'Silicon Valley Power provides rebates for Santa Clara residents to have their HVAC systems professionally tuned up, improving efficiency and extending equipment life.',
    what_they_offer:
      '- Up to $75 rebate for HVAC tune-up\n- Must use CA licensed contractor\n- Improves system efficiency\n- Extends equipment lifespan\n- Reduces energy costs\n- Ensures proper operation',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Schedule HVAC tune-up with licensed contractor\n3. Have contractor perform full system check\n4. Get receipt with contractor license number\n5. Apply online through SVP rebate platform\n6. Submit proof of service',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-circuit-pauser-rebate': {
    name: 'Circuit Pauser or Splitter Rebate',
    description:
      'Silicon Valley Power offers rebates for circuit pausers/splitters that allow Santa Clara residents to add electric appliances without expensive panel upgrades.',
    what_they_offer:
      '- Up to $50 rebate for circuit pauser/splitter\n- Up to $150 for income-qualified customers\n- Enables electrification without panel upgrade\n- Smart load management device\n- Works with multiple appliances\n- Cost-effective alternative to panel upgrade',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Must apply as add-on to other SVP electrification rebate\n3. Purchase qualifying circuit pauser/splitter\n4. Have device installed by licensed electrician\n5. Apply online through SVP rebate platform\n6. Submit with main rebate application',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-smart-panel-rebate': {
    name: 'Smart Electric Panel Rebate',
    description:
      'Silicon Valley Power offers significant rebates for smart electric panels that enable home electrification without costly main service upgrades.',
    what_they_offer:
      '- $4,000 rebate for smart electric panel\n- Additional $1,000-$2,000 for income-qualified\n- Supports KOBEN, Lumin, SPAN panels\n- Avoids expensive main service upgrade\n- Smart load management and monitoring\n- Enables full home electrification',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. For projects starting July 1, 2025 or later\n3. Purchase qualifying smart panel (KOBEN, Lumin, SPAN)\n4. Have installed by licensed electrician\n5. Apply online through SVP rebate platform\n6. Submit proof of purchase and installation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-panel-upgrade-rebate': {
    name: 'Main Service Panel Upgrade Rebate',
    description:
      'Silicon Valley Power provides rebates for Santa Clara residents upgrading electrical panels to support EV chargers and electric appliances.',
    what_they_offer:
      '- Up to $1,500 rebate for panel upgrade\n- Up to $2,500 for income-qualified customers\n- Increases panel capacity for electrification\n- Supports EV charger installation\n- Supports electric appliance installation\n- Must be add-on to other SVP rebate',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Must apply as add-on to other SVP electrification rebate\n3. Upgrade main panel to higher amperage\n4. Use licensed electrician for installation\n5. Apply online through SVP rebate platform\n6. Submit with main rebate application',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-prewire-rebate': {
    name: 'New Circuits for Future Electric Appliances Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents to prewire circuits for future electric appliances, making electrification easier down the road.',
    what_they_offer:
      '- Up to $500 per circuit (max 4 circuits)\n- Up to $2,000 total for standard customers\n- Up to $1,000 per circuit for income-qualified\n- Up to $4,000 total for income-qualified\n- Prepares home for future electrification\n- Add-on to other electrification rebate',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Must apply as add-on to other SVP electrification rebate\n3. Have electrician install circuits for future appliances\n4. Circuits for EV charger, water heater, dryer, etc.\n5. Apply online through SVP rebate platform\n6. Submit with main rebate application',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-battery-storage-rebate': {
    name: 'Battery Storage Rebate',
    description:
      'Silicon Valley Power provides rebates for battery storage systems paired with solar PV, with enhanced incentives for income-qualified customers.',
    what_they_offer:
      '- $0.15 per Wh up to $2,700 base rebate\n- Additional $2,000 for FRAP customers\n- Additional $2,000 for LIHEAP-eligible\n- Up to $6,700 total for income-qualified\n- Must pair with solar PV system\n- Backup power during outages',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Valid for batteries purchased/installed after July 1, 2024\n3. Must install with or have existing solar PV\n4. Apply online through SVP rebate platform\n5. Submit proof of purchase and installation\n6. FRAP/LIHEAP customers submit additional documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-hoa-energy-grant': {
    name: 'Energy Efficiency Grant for HOAs',
    description:
      'Silicon Valley Power offers substantial grants to HOAs in Santa Clara for energy efficiency upgrades to common areas, reducing shared utility costs for residents.',
    what_they_offer:
      '- Up to $25,000 grant for energy efficiency\n- For HOAs with 25+ units on D-1 rate\n- Funds common area upgrades\n- Lighting, HVAC, and other efficiency projects\n- 20% matching funds required from HOA\n- Reduces shared utility costs',
    how_to_get_it:
      '1. HOA must be in Santa Clara with 25+ units\n2. Must be on D-1 electric rate\n3. Plan energy efficiency upgrades for common areas\n4. Submit application by June 30 or December 31\n5. Include scope of work and quotes\n6. HOA provides 20% matching funds',
    timeframe: 'Biannual application deadlines',
    link_text: 'Apply',
  },
  'svp-income-qualified-solar': {
    name: 'Income-Qualified Solar Grant',
    description:
      'Silicon Valley Power provides substantial solar grants to income-qualified Santa Clara homeowners who have been on the FRAP assistance program, helping low-income residents access renewable energy.',
    what_they_offer:
      '- Free solar PV system grant\n- $3.50 per watt incentive\n- Up to 3 kW system covered\n- Significant reduction in electricity bills\n- Access to clean renewable energy\n- First come, first served basis',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Must be on FRAP assistance program for 1+ year\n3. Must be a homeowner in Santa Clara\n4. Apply through SVP rebate program\n5. Wait for approval (funds limited)\n6. Work with approved solar installer',
    timeframe: 'While funds last',
    link_text: 'Apply',
  },
  'svp-pool-pump-rebate': {
    name: 'Variable Speed Pool Pump Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents who upgrade to energy-efficient variable speed pool pumps, reducing electricity consumption for pool maintenance.',
    what_they_offer:
      '- $100 rebate for pool pump upgrade\n- Must be ENERGY STAR certified\n- Variable speed pump required\n- Qualifying controller included\n- Significant energy savings over single-speed pumps\n- Lower pool maintenance costs',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Purchase ENERGY STAR variable speed pool pump\n3. Ensure pump has qualifying controller\n4. Have pump professionally installed\n5. Apply online through SVP rebate platform\n6. Submit proof of purchase and installation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'svp-solar-tuneup-rebate': {
    name: 'Solar Tune-Up Rebate',
    description:
      'Silicon Valley Power offers rebates for Santa Clara residents to have their existing solar PV systems professionally inspected and tuned up, ensuring optimal performance and energy generation.',
    what_they_offer:
      '- Up to $1,500 rebate for solar tune-up\n- Professional system inspection\n- Performance optimization\n- Identification of issues or degradation\n- Cleaning and maintenance\n- Ensures maximum energy production',
    how_to_get_it:
      '1. Must be a Silicon Valley Power customer\n2. Must have existing solar PV system\n3. Hire California licensed contractor\n4. Have system inspected and tuned up\n5. Apply online through SVP rebate platform\n6. Submit contractor invoice and documentation',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-sj-cares': {
    name: 'SJ Cares Discount',
    description:
      "San Jose Clean Energy provides an additional 10% discount on electricity charges for income-qualified customers already enrolled in PG&E's CARE or FERA programs, helping reduce energy costs.",
    what_they_offer:
      '- 10% discount on SJCE electricity charges\n- Automatic enrollment for CARE/FERA customers\n- Stacks with existing PG&E discounts\n- No separate application needed\n- Applies to monthly electricity bill\n- Ongoing savings while enrolled',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Enroll in CARE or FERA through PG&E\n3. Once enrolled, SJ Cares discount is automatic\n4. No additional application required\n5. Discount appears on monthly bill\n6. Maintain CARE/FERA eligibility to keep discount',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'sjce-solar-access': {
    name: 'Solar Access Program',
    description:
      "San Jose Clean Energy's Solar Access Program provides significant electricity bill discounts for income-qualified residents living in Environmental Justice Communities, stackable with other discounts for up to 55% savings.",
    what_they_offer:
      '- 20% off electricity bill\n- Stacks with CARE/FERA discounts\n- Up to 55% total savings possible\n- Available in Environmental Justice Communities\n- No solar installation required\n- Access to community solar benefits',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must live in qualifying Environmental Justice Community\n3. Must meet income eligibility requirements\n4. Verify qualification on Solar Access webpage\n5. Complete enrollment process\n6. Discount applied to monthly bill',
    timeframe: 'Ongoing',
    link_text: 'Check Eligibility',
  },
  'sjce-ecohome-hpwh': {
    name: 'EcoHome Heat Pump Water Heater Rebate',
    description:
      'San Jose Clean Energy offers substantial rebates for replacing gas water heaters with energy-efficient heat pump water heaters, with enhanced rebates for income-qualified residents and Environmental Justice Communities.',
    what_they_offer:
      '- $2,000 rebate for heat pump water heater\n- $3,000 for EJ Community or income-qualified residents\n- Replaces gas water heater\n- 3-4x more efficient than traditional water heaters\n- Significant energy cost savings\n- Reduces carbon footprint',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Reserve funds online before installation\n3. Purchase qualifying heat pump water heater\n4. Have professionally installed within 120 days\n5. Submit final documentation and receipts\n6. EJ Community or income-qualified submit additional docs for enhanced rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ecohome-hvac': {
    name: 'EcoHome Heat Pump HVAC Rebate',
    description:
      'San Jose Clean Energy offers rebates for replacing gas furnaces with efficient heat pump HVAC systems that provide both heating and cooling, with enhanced rebates for qualifying residents.',
    what_they_offer:
      '- $1,500 rebate for heat pump HVAC\n- $2,500 for EJ Community or income-qualified residents\n- Replaces gas furnace\n- Single system for heating and cooling\n- High efficiency operation\n- Lower energy costs',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Reserve funds online before installation\n3. Purchase qualifying heat pump HVAC system\n4. Have professionally installed within 120 days\n5. Submit final documentation and receipts\n6. EJ Community or income-qualified submit additional docs for enhanced rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ecohome-battery': {
    name: 'EcoHome Battery Storage Rebate',
    description:
      'San Jose Clean Energy provides substantial rebates for home battery storage systems paired with solar PV, with significantly enhanced rebates for income-qualified residents and Environmental Justice Communities.',
    what_they_offer:
      '- $125 per kWh rebate for battery storage\n- Up to $3,250 maximum rebate\n- $400 per kWh for EJ/income-qualified residents\n- Up to $10,400 maximum for qualifying residents\n- Must be paired with solar PV\n- Backup power during outages',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must have or install solar PV system\n3. Reserve funds online before installation\n4. Purchase qualifying battery storage system\n5. Have professionally installed within 120 days\n6. Submit final documentation and receipts',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ecohome-panel': {
    name: 'EcoHome Panel Upgrade Rebate',
    description:
      'San Jose Clean Energy offers rebates for electrical panel upgrades when done alongside other EcoHome electrification projects, helping homes support additional electric appliances.',
    what_they_offer:
      '- $1,000 rebate for panel upgrade\n- Must be add-on to other EcoHome rebate\n- Supports home electrification\n- Increased electrical capacity\n- Enables additional electric appliances\n- Future-proofs home electrical system',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must be claiming another EcoHome rebate\n3. Include panel upgrade in project scope\n4. Have professionally installed within 120 days\n5. Apply as add-on with primary rebate\n6. Submit documentation for panel upgrade',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ecohome-insulation': {
    name: 'EcoHome Attic Insulation Rebate',
    description:
      'San Jose Clean Energy offers rebates for attic insulation when done alongside other EcoHome electrification projects, improving home energy efficiency and comfort.',
    what_they_offer:
      '- $500 rebate for attic insulation\n- Must be add-on to other EcoHome rebate\n- Improves home energy efficiency\n- Better temperature regulation\n- Reduces heating and cooling costs\n- Enhances comfort year-round',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must be claiming another EcoHome rebate\n3. Include attic insulation in project scope\n4. Have professionally installed within 120 days\n5. Apply as add-on with primary rebate\n6. Submit documentation for insulation work',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ecohome-prewire': {
    name: 'EcoHome Circuit Prewiring Rebate',
    description:
      'San Jose Clean Energy offers rebates for circuit prewiring when done alongside other EcoHome electrification projects, preparing homes for future electric appliance installations.',
    what_they_offer:
      '- $500 rebate for circuit prewiring\n- Must be add-on to other EcoHome rebate\n- Prepares home for future electrification\n- Enables future appliance installations\n- Reduces future installation costs\n- Part of comprehensive electrification support',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must be claiming another EcoHome rebate\n3. Include circuit prewiring in project scope\n4. Have professionally installed within 120 days\n5. Apply as add-on with primary rebate\n6. Submit documentation for prewiring work',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ev-new': {
    name: 'New EV Instant Rebate',
    description:
      'San Jose Clean Energy offers substantial instant rebates on new electric vehicles for income-qualified residents, making EV ownership more accessible for lower-income households.',
    what_they_offer:
      '- $4,000 instant rebate on new EV\n- Applied at point of sale\n- Maximum vehicle price $60,000\n- For battery electric vehicles only\n- Available at participating dealerships\n- Immediate savings, no waiting for rebate',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must be within 100% Area Median Income\n3. Or be enrolled in CARE or FERA program\n4. Apply online for income verification\n5. Or present CARE/FERA documentation at dealership\n6. Purchase new EV at participating dealership',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-ev-used': {
    name: 'Used EV Instant Rebate',
    description:
      'San Jose Clean Energy provides instant rebates on used electric vehicles for income-qualified residents, offering an affordable pathway to EV ownership.',
    what_they_offer:
      '- $2,000 instant rebate on used EV\n- Applied at point of sale\n- Maximum vehicle price $60,000\n- For battery electric vehicles only\n- Available at participating dealerships\n- More affordable entry to EV ownership',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must be within 100% Area Median Income\n3. Or be enrolled in CARE or FERA program\n4. Apply online for income verification\n5. Or present CARE/FERA documentation at dealership\n6. Purchase used EV at participating dealership',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'sjce-peak-rewards': {
    name: 'Peak Rewards Program',
    description:
      "San Jose Clean Energy's Peak Rewards program pays customers to reduce electricity usage during peak demand periods, with no penalty for non-participation.",
    what_they_offer:
      '- Earn $0.50-$1.00 per kWh reduced\n- $20 enrollment bonus\n- Up to 6 earning opportunities per month\n- No penalty for non-participation\n- Voluntary response to alerts\n- Easy money for reducing peak usage',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Create FlexSaver account online\n3. Enroll in Peak Rewards program\n4. Receive Peak Rewards Alerts\n5. Reduce usage during peak events\n6. Earn rewards based on reduction',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'sjce-peak-rewards-thermostat': {
    name: 'Peak Rewards for Smart Thermostats',
    description:
      'San Jose Clean Energy pays customers annually for enrolling eligible smart thermostats in their demand response program, with automatic adjustments during peak events.',
    what_they_offer:
      '- $35 per year for thermostat enrollment\n- Compatible with Google Nest or Sensi\n- Automatic adjustments during peak events\n- Option to override any adjustment\n- Set-and-forget participation\n- Annual payment for participation',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must have Google Nest or Sensi smart thermostat\n3. Enroll thermostat through program portal\n4. Allow thermostat to connect to program\n5. Thermostat auto-adjusts during peak events\n6. Override option always available',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'sjce-peak-rewards-ev-charger': {
    name: 'Peak Rewards for EV Chargers',
    description:
      'San Jose Clean Energy pays EV owners for enrolling eligible chargers in their managed charging program, pausing charging during peak events with override option.',
    what_they_offer:
      '- $25 enrollment bonus\n- $9 per month ongoing payment\n- Compatible with Emporia EV charger\n- Managed charging during peak events\n- Option to override any pause\n- Annual earnings of $108+ after bonus',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must have Emporia EV charger\n3. Enroll charger through program portal\n4. Allow charger to connect to program\n5. Charging pauses during peak events\n6. Override option always available',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'sjce-peak-rewards-battery': {
    name: 'Peak Rewards for Battery Storage',
    description:
      'San Jose Clean Energy rewards battery storage owners for enrolling in their demand response program, providing both upfront bonuses and ongoing quarterly payments.',
    what_they_offer:
      '- $10 per kWh enrollment bonus\n- $0.13 per kWh quarterly ongoing payment\n- Supports grid during peak demand\n- Battery discharges during peak events\n- Helps prevent outages\n- Significant ongoing income from battery',
    how_to_get_it:
      '1. Must be a San Jose Clean Energy customer\n2. Must have eligible battery storage system\n3. Enroll battery through program portal\n4. Allow battery to connect to program\n5. Battery responds during demand events\n6. Receive quarterly payments',
    timeframe: 'Ongoing',
    link_text: 'Enroll',
  },
  'cpau-rap': {
    name: 'Rate Assistance Program (RAP)',
    description:
      'The City of Palo Alto Utilities Rate Assistance Program provides significant discounts on utility bills for residents experiencing financial hardship or medical conditions requiring higher utility use.',
    what_they_offer:
      '- Up to 25% off gas charges\n- Up to 25% off electricity charges\n- For financial hardship situations\n- For medical conditions requiring higher utility use\n- Applied to monthly utility bills\n- Ongoing assistance while eligible',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Must demonstrate financial hardship\n3. Or have medical condition requiring higher utility use\n4. Complete application form\n5. Submit supporting documentation\n6. Discount applied once approved',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-reap': {
    name: 'Residential Energy Assistance Program (REAP)',
    description:
      "The City of Palo Alto's REAP program provides free home energy and water efficiency upgrades to income-qualified residents, helping reduce utility costs through improved efficiency.",
    what_they_offer:
      '- Free weather stripping installation\n- Free attic insulation\n- Free heating system upgrades\n- Free water heater replacement\n- Free efficient showerheads\n- Free energy-efficient lighting',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Must be eligible for RAP program\n3. Or live in deed-restricted affordable housing\n4. Or participate in other income-qualified programs\n5. Complete application and home assessment\n6. Receive free efficiency installations',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-project-pledge': {
    name: 'ProjectPLEDGE',
    description:
      'ProjectPLEDGE provides one-time utility bill assistance for Palo Alto residents facing financial hardship, helping cover past-due utility balances.',
    what_they_offer:
      '- One-time utility bill assistance\n- Up to $750 in assistance\n- Covers past-due amounts\n- Credit cannot exceed outstanding balance\n- Helps prevent service disconnection\n- Funded through community donations',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Must be the customer-of-record on account\n3. Must have past-due utility balance\n4. Demonstrate financial hardship\n5. Complete application process\n6. Credit applied to account if approved',
    timeframe: 'While funds last',
    link_text: 'Apply',
  },
  'cpau-hpwh-rebate': {
    name: 'Heat Pump Water Heater Rebate',
    description:
      'City of Palo Alto Utilities offers one of the most generous heat pump water heater rebates in the region, with affordable financing options that make the switch accessible for all residents.',
    what_they_offer:
      '- $3,500 rebate for heat pump water heater\n- Full-service installation as low as $2,300\n- Payment plan: $1,100 with $20/month for 5 years\n- Replaces gas water heater\n- High efficiency and lower operating costs\n- Professional installation available',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Reserve funds online before installation\n3. Choose full-service or DIY installation\n4. Have heat pump water heater installed within 120 days\n5. Submit final documentation\n6. Select payment option (full rebate or financing)',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-hp-hvac-rebate': {
    name: 'Heat Pump HVAC Rebate',
    description:
      'City of Palo Alto Utilities offers rebates for replacing gas furnaces with efficient heat pump HVAC systems that provide both heating and cooling from a single unit.',
    what_they_offer:
      '- $2,500 rebate for heat pump HVAC\n- Replaces gas furnace\n- Single system for heating and cooling\n- High efficiency operation\n- Lower energy costs\n- Reduced carbon footprint',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Reserve funds online before installation\n3. Purchase qualifying heat pump HVAC system\n4. Have professionally installed within 120 days\n5. Submit final documentation and receipts\n6. Receive rebate after approval',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-gas-meter-removal': {
    name: 'Gas Meter Removal Incentive',
    description:
      "City of Palo Alto Utilities rewards residents who fully electrify their homes and disconnect from natural gas service, supporting the city's sustainability goals.",
    what_they_offer:
      '- $2,500 incentive for gas meter removal\n- Rewards full home electrification\n- Stacks with other electrification rebates\n- Eliminates gas service charges\n- Zero-emission home achievement\n- Supports city climate goals',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Replace all gas appliances with electric\n3. Request gas meter disconnection from CPAU\n4. Confirm gas meter has been removed\n5. Submit documentation of electrification\n6. Receive incentive after verification',
    timeframe: 'Ongoing',
    link_text: 'Learn More',
  },
  'cpau-ev-charger-mf-rebate': {
    name: 'EV Charger Rebate for Multi-Family and Non-Profits',
    description:
      'City of Palo Alto Utilities provides substantial rebates for installing EV charging infrastructure at multi-family buildings, schools, and non-profit organizations.',
    what_they_offer:
      '- Up to $80,000 in rebates\n- For schools and educational facilities\n- For non-profit organizations\n- For multi-family residential buildings\n- For mixed-use properties\n- Supports EV adoption in shared spaces',
    how_to_get_it:
      '1. Must be eligible property type in Palo Alto\n2. Must be CPAU electric customer\n3. Apply through CPAU before installation\n4. Get project approval\n5. Install EV charging infrastructure\n6. Submit documentation for rebate',
    timeframe: 'While funds last',
    link_text: 'Apply',
  },
  'cpau-transformer-upgrade-rebate': {
    name: 'Transformer Upgrade Rebate Program',
    description:
      'City of Palo Alto Utilities helps offset the cost of electrical infrastructure upgrades needed for EV charger installations, making charging infrastructure more affordable.',
    what_they_offer:
      '- Up to $10,000 for single-family homes\n- Up to $100,000 for multi-family/schools/non-profits\n- Covers utility service connection fees\n- Covers substructure work costs\n- Enables higher-capacity EV charging\n- Reduces infrastructure barriers',
    how_to_get_it:
      '1. Must be a City of Palo Alto Utilities customer\n2. Plan EV charger installation requiring upgrades\n3. Apply through CPAU before work begins\n4. Get project scope approved\n5. Complete infrastructure upgrades\n6. Submit documentation for rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-landscape-conversion': {
    name: 'Landscape Conversion Rebate',
    description:
      'City of Palo Alto offers rebates for converting water-intensive lawns and pools to sustainable, drought-tolerant landscaping through a partnership with Valley Water.',
    what_they_offer:
      '- Up to $4 per square foot rebate\n- For lawn to low-water landscape conversion\n- For swimming pool removal and conversion\n- Sustainable landscaping options\n- Significant water savings\n- Artificial turf not eligible',
    how_to_get_it:
      '1. Must be a City of Palo Alto water customer\n2. Apply through Valley Water before starting\n3. Get project pre-approved\n4. Convert lawn or pool to sustainable landscape\n5. Complete project per guidelines\n6. Submit final documentation for rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-graywater-rebate': {
    name: 'Graywater Laundry-to-Landscape Rebate',
    description:
      'City of Palo Alto offers rebates for installing graywater systems that reuse washing machine water for landscape irrigation, reducing water consumption.',
    what_they_offer:
      '- Up to $400 rebate\n- For laundry-to-landscape graywater systems\n- Reuses washer rinse water\n- Irrigates landscape with recycled water\n- Reduces potable water use\n- Sustainable water management',
    how_to_get_it:
      '1. Must be a City of Palo Alto water customer\n2. Apply through Valley Water before starting\n3. Get project pre-approved\n4. Install graywater laundry-to-landscape system\n5. Ensure proper installation and connections\n6. Submit final documentation for rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
  'cpau-stormwater-rebates': {
    name: 'Stormwater Rebates Program',
    description:
      'City of Palo Alto offers rebates for various stormwater management features that capture and filter rainwater, reducing runoff and protecting local waterways.',
    what_they_offer:
      '- Rebates for rain barrels\n- Rebates for cisterns\n- Rebates for pervious pavement\n- Rebates for rain gardens\n- Reduces stormwater runoff\n- Protects local water quality',
    how_to_get_it:
      '1. Must be a City of Palo Alto property owner\n2. Choose qualifying stormwater feature\n3. Apply through City of Palo Alto\n4. Obtain building permit if required\n5. Install stormwater management feature\n6. Submit documentation for rebate',
    timeframe: 'Ongoing',
    link_text: 'Apply',
  },
};

export default { ui, programs };
