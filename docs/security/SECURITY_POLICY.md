# Security Policy

## Supported Versions

| Version  | Supported          |
| -------- | ------------------ |
| Latest   | :white_check_mark: |
| < Latest | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security details to: **security [at] baytides [dot] org**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 1 month

### What to Expect

- Acknowledgment of your report
- Regular updates on fix progress
- Credit in release notes (if desired)
- Notification when fix is deployed

## Security Measures

### Infrastructure Security

- ✅ **HTTPS Only**: All traffic encrypted via TLS 1.3
- ✅ **Static Site Architecture**: No server-side database to breach
- ✅ **GitHub Pages Hosting**: Enterprise-grade security infrastructure
- ✅ **Cloudflare CDN**: DDoS protection and traffic filtering
- ✅ **No User Accounts**: No passwords or credentials to compromise

### Application Security

- ✅ **Content Security Policy (CSP)**: Prevents XSS attacks and unauthorized scripts
- ✅ **X-Frame-Options: DENY**: Prevents clickjacking attacks
- ✅ **X-Content-Type-Options**: Prevents MIME-type sniffing
- ✅ **Referrer-Policy**: Protects user privacy
- ✅ **Permissions-Policy**: Disables camera, microphone, geolocation access
- ✅ **Subresource Integrity (SRI)**: Verifies third-party resource integrity
- ✅ **Input Sanitization**: All user inputs (search, filters) sanitized client-side

### Data Security

- ✅ **No PII Collection**: We don't collect personal information
- ✅ **No Cookies**: Zero tracking cookies used
- ✅ **Local Storage Only**: User preferences stored on user's device only
- ✅ **No Server-Side Database**: Nothing to breach
- ✅ **Open Source**: All code publicly auditable on GitHub

### Privacy by Design

- ✅ **Privacy-First Analytics**: Self-hosted Plausible (aggregate data only, no personal identifiers)
- ✅ **No IP Logging**: We don't log visitor IP addresses
- ✅ **No User Tracking**: No behavioral tracking or profiling
- ✅ **GDPR/CCPA Compliant**: Exceeds privacy law requirements

### Accessibility Security

- ✅ **WCAG 2.2 AAA Compliant**: Highest accessibility standard
- ✅ **Keyboard Accessible**: All features work without mouse
- ✅ **Screen Reader Compatible**: Proper ARIA labels and semantics
- ✅ **No Accessibility-Tracking**: Accessibility features work without analytics

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No hardcoded secrets, API keys, or credentials
- [ ] All user inputs validated and sanitized
- [ ] All outputs properly encoded (XSS prevention)
- [ ] Dependencies up to date (run `npm audit`)
- [ ] Error messages don't leak sensitive information
- [ ] HTTPS used for all external requests
- [ ] No inline JavaScript (CSP compliance)
- [ ] Accessibility maintained (WCAG 2.2 AAA)
- [ ] No third-party trackers or analytics scripts
- [ ] Local storage used appropriately (no sensitive data)

## Responsible Disclosure

We follow responsible disclosure practices:

1. Security researchers given time to report privately
2. We acknowledge and work on fixes before public disclosure
3. Coordinated disclosure once fix is deployed
4. Credit given to researchers (unless anonymous preferred)

## Bug Bounty

Currently, we do not offer a bug bounty program as this is an open-source community project sponsored by a nonprofit organization. However, we deeply appreciate security research and will:

- Publicly acknowledge contributions
- Fast-track fixes for reported issues
- Give prominent credit in release notes

## Security Updates

Security updates are released as soon as fixes are available:

- **Critical**: Immediate deployment
- **High**: Within 48 hours
- **Medium/Low**: Next scheduled release

## Open Source Transparency

This project is fully open source. You can verify our security claims by:

1. **Reviewing our code**: [github.com/baytides/baynavigator](https://github.com/baytides/baynavigator)
2. **Inspecting network traffic**: Use browser developer tools (F12) to verify no tracking
3. **Checking for cookies**: Browser settings will confirm zero cookies
4. **Auditing dependencies**: Run `npm audit` to check for vulnerabilities

## Contact

- **Security Issues**: security [at] baytides [dot] org
- **General Contact**: hello [at] baytides [dot] org
- **Project Maintainer**: [@baytides](https://github.com/baytides)

---

_Last Updated: December 26, 2025_
