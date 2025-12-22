# Mobile App Development Roadmap
## Bay Area Discounts - iOS & Android Native Apps

This document outlines the path to converting the Bay Area Discounts web application into native iOS and Android mobile apps.

---

## Current Architecture Assessment

### ✅ Strengths (Ready for Mobile)
- **Progressive Web App (PWA)** - Already has service worker (`sw.js`) and offline capabilities
- **Mobile-First Design** - Responsive CSS with touch-friendly UI
- **API-Ready Backend** - Azure Functions provide REST API for program data
- **Static Assets** - All resources (images, CSS, JS) are well-organized
- **Clean Data Model** - Programs stored in CosmosDB with structured schema
- **Accessibility** - WCAG 2.2 AAA compliance ensures usable mobile interface
- **Local Storage** - Favorites and preferences already use localStorage

### ⚠️ Areas Needing Mobile Optimization
- **Bundle Size** - 6 CSS files + 12 JS files need consolidation
- **Image Optimization** - SVG logo is good; need optimized PNGs for app icons
- **API Authentication** - Need token-based auth for mobile API calls
- **Offline Strategy** - Enhance service worker for full offline program browsing
- **Push Notifications** - Infrastructure needed for program updates/alerts

---

## Technology Stack Recommendations

### Option 1: React Native (Recommended)
**Pros:**
- Single codebase for iOS & Android
- Large community and ecosystem
- Can reuse JavaScript logic from web app
- Expo framework simplifies development
- Hot reloading for faster development

**Cons:**
- Larger app size than native
- Some performance overhead
- May need native modules for advanced features

**Estimated Timeline:** 8-12 weeks

### Option 2: Flutter
**Pros:**
- Excellent performance (compiled to native)
- Beautiful UI out of the box
- Hot reload and dev tools
- Single codebase

**Cons:**
- Dart language (new learning curve)
- Can't reuse existing JavaScript
- Smaller ecosystem than React Native

**Estimated Timeline:** 10-14 weeks

### Option 3: Native Swift (iOS) + Kotlin (Android)
**Pros:**
- Best performance
- Full platform capabilities
- Native look and feel

**Cons:**
- Two separate codebases
- 2x development time
- 2x maintenance burden

**Estimated Timeline:** 16-20 weeks

---

## Mobile App Features

### Phase 1: MVP (Minimum Viable Product)
- [ ] Browse all discount programs
- [ ] Filter by eligibility and area
- [ ] Search programs by keyword
- [ ] View program details
- [ ] Save favorite programs locally
- [ ] Offline browsing of downloaded programs
- [ ] Share programs via system share sheet

### Phase 2: Enhanced Features
- [ ] Push notifications for new programs
- [ ] Location-based county detection
- [ ] QR code scanner for program enrollment
- [ ] Dark mode (already working in web)
- [ ] Accessibility features (voice over, dynamic type)
- [ ] Multi-language support (English, Spanish, Chinese)

### Phase 3: Advanced Features
- [ ] User accounts (optional, for cross-device sync)
- [ ] Application status tracking
- [ ] Program recommendations based on eligibility
- [ ] In-app enrollment for select programs
- [ ] Calendar integration for program deadlines
- [ ] Analytics and usage insights

---

## API Preparation

### Current Azure Functions
Your existing backend needs these enhancements for mobile:

```javascript
// NEW: Mobile API Endpoints
/api/programs/search          // GET - Search with filters
/api/programs/:id            // GET - Single program details
/api/programs/categories     // GET - All categories
/api/programs/areas          // GET - All areas
/api/favorites/sync          // POST - Sync favorites (if accounts added)
/api/notifications/register  // POST - Register for push notifications
```

### Authentication Strategy
For mobile apps, implement token-based auth:

```javascript
// Recommended: Azure AD B2C or Firebase Auth
headers: {
  'Authorization': 'Bearer <access_token>',
  'X-API-Version': '1.0'
}
```

### Rate Limiting
Protect API from abuse:
```javascript
// Implement in Azure Function
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};
```

---

## Data Sync Strategy

### Offline-First Architecture
```
1. App Launch
   ↓
2. Load cached programs from local storage
   ↓
3. Display UI immediately
   ↓
4. Background sync with API
   ↓
5. Update UI with new data
```

### Storage Options
- **iOS**: Core Data or Realm
- **Android**: Room Database or Realm
- **React Native**: AsyncStorage + WatermelonDB
- **Flutter**: Hive or Drift

### Sync Logic
```javascript
// Pseudo-code for sync strategy
async function syncPrograms() {
  const lastSyncTime = await getLastSyncTime();
  const updates = await api.getPrograms({ since: lastSyncTime });

  if (updates.length > 0) {
    await db.upsertPrograms(updates);
    await setLastSyncTime(Date.now());
  }
}
```

---

## GitHub CLI Optimizations

### Automated Release Management
Create GitHub Actions workflow for mobile releases:

```yaml
# .github/workflows/mobile-release.yml
name: Mobile App Release

on:
  push:
    tags:
      - 'mobile-v*'

jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build iOS app
        run: |
          cd mobile
          fastlane ios build
      - name: Upload to TestFlight
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
        run: fastlane ios beta

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Android app
        run: |
          cd mobile
          ./gradlew assembleRelease
      - name: Upload to Play Store
        env:
          PLAY_STORE_KEY: ${{ secrets.PLAY_STORE_KEY }}
        run: fastlane android beta
```

### GitHub CLI Commands for Mobile Development

```bash
# Create mobile app repository
gh repo create bayareadiscounts-mobile --public

# Set up branch protection for releases
gh api repos/baytides/bayareadiscounts-mobile/branches/main/protection \
  --method PUT \
  --field required_status_checks[strict]=true \
  --field required_pull_request_reviews[required_approving_review_count]=1

# Automated changelog generation
gh release create mobile-v1.0.0 \
  --title "Bay Area Discounts Mobile v1.0.0" \
  --notes-file CHANGELOG.md \
  --target main

# Monitor app issues
gh issue list --label "mobile-bug" --state open
```

---

## Azure CLI Optimizations

### Current Setup Improvements

```bash
# 1. Enable Application Insights for better monitoring
az monitor app-insights component create \
  --app bayareadiscounts-insights \
  --location westus2 \
  --resource-group baytides-discounts-rg \
  --application-type web

# 2. Set up staging environment for mobile API testing
az staticwebapp environment create \
  --name baytides-discounts-app \
  --resource-group baytides-discounts-rg \
  --environment-name staging

# 3. Configure custom domain with SSL
az staticwebapp hostname set \
  --name baytides-discounts-app \
  --resource-group baytides-discounts-rg \
  --hostname api.bayareadiscounts.com

# 4. Enable diagnostic logs
az monitor diagnostic-settings create \
  --name diagnostics \
  --resource baytides-discounts-app \
  --logs '[{"category":"FunctionAppLogs","enabled":true}]' \
  --metrics '[{"category":"AllMetrics","enabled":true}]'
```

### Cost Optimization
Your current Azure setup is on Free tier. For mobile app scale:

```bash
# Check current usage
az staticwebapp usage show \
  --name baytides-discounts-app \
  --resource-group baytides-discounts-rg

# Recommended: Upgrade to Standard tier when ready
# Standard tier: $9/month, includes:
# - Custom domains
# - 100GB bandwidth
# - SLA guarantee
# - Staging environments
```

---

## Deployment Pipeline Enhancement

### Improved `deploy.sh` Script

```bash
#!/bin/bash
# Enhanced deployment with mobile app considerations

set -e

# Configuration
REPO="baytides/bayareadiscounts"
WORKFLOW="deploy.yml"
ENVIRONMENT="${1:-production}"  # Allow staging/production

echo "🚀 Bay Area Discounts Deployment"
echo "Environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
  echo "❌ Error: Invalid environment. Use 'staging' or 'production'"
  exit 1
fi

# Download latest successful build
echo "📦 Downloading latest build..."
LATEST_RUN=$(gh run list \
  --workflow=$WORKFLOW \
  --status=success \
  --limit=1 \
  --json databaseId \
  --jq '.[0].databaseId')

if [ -z "$LATEST_RUN" ]; then
  echo "❌ No successful build found"
  exit 1
fi

echo "   Using build: $LATEST_RUN"
DEPLOY_DIR="/tmp/bayarea-deploy-$ENVIRONMENT"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"
gh run download "$LATEST_RUN" -n site -D "$DEPLOY_DIR" -R "$REPO"

# Get deployment token
echo "🔑 Retrieving deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name baytides-discounts-app \
  --resource-group baytides-discounts-rg \
  --query "properties.apiKey" \
  -o tsv)

# Deploy to Azure
echo "🚀 Deploying to $ENVIRONMENT..."
swa deploy "$DEPLOY_DIR" \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env "$ENVIRONMENT"

# Verify deployment
echo "✅ Verifying deployment..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://bayareadiscounts.com)
if [ "$RESPONSE" = "200" ]; then
  echo "✅ Deployment successful!"
  echo "🌐 Site: https://bayareadiscounts.com"
else
  echo "⚠️  Warning: Site returned HTTP $RESPONSE"
fi

# Post-deployment tasks
echo "📊 Deployment metrics:"
echo "   Build: $LATEST_RUN"
echo "   Time: $(date)"
echo "   Environment: $ENVIRONMENT"
```

---

## Web Performance Optimizations (Prep for Mobile)

### 1. Bundle Optimization

```javascript
// webpack.config.js (create this)
module.exports = {
  mode: 'production',
  entry: {
    main: './assets/js/index.js',
    vendor: ['favorites.js', 'search-filter.js']
  },
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
};
```

### 2. Image Optimization

```bash
# Create optimized app icons
# Use a tool like ImageMagick or online services

# iOS icon sizes (all required)
mkdir -p mobile/ios/icons
for size in 20 29 40 58 60 76 80 87 120 152 167 180 1024; do
  convert banner.svg -resize ${size}x${size} mobile/ios/icons/icon-${size}.png
done

# Android icon sizes
mkdir -p mobile/android/icons
for size in 48 72 96 144 192 512; do
  convert banner.svg -resize ${size}x${size} mobile/android/icons/icon-${size}.png
done
```

### 3. Service Worker Enhancement

```javascript
// sw.js - Enhanced for mobile app
const CACHE_NAME = 'bayarea-v2';
const URLS_TO_CACHE = [
  '/',
  '/assets/css/responsive-optimized.css',
  '/assets/js/search-filter.js',
  '/assets/js/favorites.js',
  '/assets/images/logo/banner.svg'
];

// Background sync for offline submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/images/logo/icon-192.png',
    badge: '/assets/images/logo/badge-72.png',
    data: { url: data.url }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
```

---

## Recommended Next Steps

### Immediate (Week 1-2)
1. ✅ **Decide on mobile framework** - React Native recommended
2. ✅ **Set up mobile repository** - `bayareadiscounts-mobile`
3. ✅ **Create app mockups** - Design mobile-specific screens
4. ✅ **API audit** - Document all endpoints needed

### Short-term (Week 3-6)
1. ✅ **Enhance Azure Functions** - Add mobile-specific endpoints
2. ✅ **Implement authentication** - Azure AD B2C or Firebase
3. ✅ **Build MVP** - Core features only
4. ✅ **Internal testing** - TestFlight (iOS) & Internal Testing (Android)

### Medium-term (Week 7-12)
1. ✅ **Beta testing** - Invite community members
2. ✅ **Analytics integration** - Firebase Analytics or App Center
3. ✅ **Push notification setup** - FCM (Firebase Cloud Messaging)
4. ✅ **App Store preparation** - Screenshots, descriptions, metadata

### Long-term (Month 4+)
1. ✅ **Public launch** - Submit to App Store & Play Store
2. ✅ **Marketing campaign** - Community outreach
3. ✅ **Feature expansion** - Phase 2 & 3 features
4. ✅ **Continuous improvement** - Based on user feedback

---

## Cost Estimates

### Development Costs (if hiring)
- React Native developer: $75-150/hr × 300-500 hours = $22,500-75,000
- UI/UX designer: $50-100/hr × 40-80 hours = $2,000-8,000
- Backend enhancements: $75-125/hr × 80-120 hours = $6,000-15,000

### Infrastructure Costs (monthly)
- Azure Static Web Apps (Standard): $9/month
- Azure CosmosDB: ~$25/month (current usage)
- Firebase (for push notifications): Free tier → $25/month at scale
- App Store Developer Account: $99/year
- Google Play Developer Account: $25 one-time
- **Total: ~$60-80/month**

### DIY Development (if you build it yourself)
- Time investment: 300-500 hours over 3-6 months
- Learning resources: $0-500 (courses, books)
- Testing devices: $0-1000 (if you don't have iOS/Android devices)

---

## Testing Strategy

### Unit Testing
```javascript
// Jest for React Native
describe('ProgramCard', () => {
  it('displays program name correctly', () => {
    const program = { name: 'Test Program' };
    const { getByText } = render(<ProgramCard program={program} />);
    expect(getByText('Test Program')).toBeTruthy();
  });
});
```

### Integration Testing
```javascript
// Detox for E2E testing
describe('Favorites Flow', () => {
  it('should save and display favorite programs', async () => {
    await element(by.id('program-1')).tap();
    await element(by.id('favorite-button')).tap();
    await element(by.id('favorites-tab')).tap();
    await expect(element(by.text('Test Program'))).toBeVisible();
  });
});
```

### Beta Testing Platforms
- **iOS**: TestFlight (100 external testers, free)
- **Android**: Google Play Internal Testing (unlimited, free)
- **Cross-platform**: Firebase App Distribution

---

## Resources & Documentation

### React Native Learning
- [React Native Official Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/) - Navigation library

### Azure Mobile Services
- [Azure Mobile Apps](https://learn.microsoft.com/en-us/azure/developer/mobile-apps/)
- [Azure Notification Hubs](https://learn.microsoft.com/en-us/azure/notification-hubs/)
- [Azure App Center](https://learn.microsoft.com/en-us/appcenter/) - Testing & Analytics

### App Store Guidelines
- [iOS App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://support.google.com/googleplay/android-developer/answer/9859673)

---

## Questions to Answer Before Starting

1. **Budget**: What's the budget for development and ongoing costs?
2. **Timeline**: Is there a target launch date?
3. **Team**: Will you hire developers or build it yourself?
4. **Features**: What features are must-haves vs. nice-to-haves?
5. **Platforms**: iOS only, Android only, or both simultaneously?
6. **Backend**: Should we build a dedicated mobile API or adapt existing Azure Functions?
7. **Analytics**: What metrics do you want to track?
8. **Monetization**: Will the app remain free, or consider in-app donations?

---

*This roadmap is a living document. Update it as decisions are made and progress is achieved.*

**Last Updated**: 2025-12-21
**Author**: Bay Area Discounts Development Team
