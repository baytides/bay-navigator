# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email details to the maintainers via [GitHub Security Advisories](../../security/advisories/new)
3. Include steps to reproduce, impact assessment, and any suggested fixes

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Supported Versions

| Version           | Supported   |
| ----------------- | ----------- |
| Latest (`main`)   | Yes         |
| Previous releases | Best effort |

## Security Measures

### Hosting & Infrastructure

- **Azure Static Web Apps** with global CDN and DDoS protection
- **Cloudflare** (Project Galileo) provides additional CDN, WAF, and DDoS mitigation
- **HTTPS/TLS 1.3** enforced with HSTS preload (1 year)
- **Tor hidden service** available for censorship-resistant access

### Content Security Policy

Strict CSP headers limit resource loading to explicitly allowed origins:

- `default-src 'self'`
- `connect-src` allowlist: Azure services, Typesense search, Carl AI endpoints, Plausible analytics
- `frame-ancestors 'none'` (no embedding)
- `upgrade-insecure-requests` enforced

### Additional Security Headers

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`
- `Permissions-Policy` restricts camera, microphone, geolocation, payment APIs

### Code Security

- **CodeQL** analysis on every push and PR, plus weekly scheduled scans
- **OSV-Scanner** for dependency vulnerability detection on PRs and weekly
- **Dependabot** automated dependency updates with auto-merge for patches
- **Pre-commit hooks** via Husky for local linting

### Data Privacy

- **No user accounts, no cookies, no tracking pixels**
- **No personal data collected or stored**
- **Self-hosted Plausible Analytics** — aggregate metrics only, no IPs or identifiers
- **GPS coordinates never leave the device** — all distance calculations are client-side
- Mobile crash reporting (Sentry) is opt-in only

### AI Services (Carl)

- **Self-hosted on dedicated hardware** — Ollama + vLLM run on a Mac Mini, not third-party cloud AI
- **Queries are not stored or used for training**
- **No PII is sent to AI endpoints** — client-side sanitization before any LLM call
- AI endpoints accessible via Tor for maximum privacy

### Azure Functions

- Function-level authorization keys for sensitive endpoints
- Azure managed identities where possible
- No secrets in code — all credentials via GitHub Secrets or Azure Key Vault

## Scope

The following are in scope for security reports:

- baynavigator.org (web application)
- Azure Functions endpoints
- Carl AI endpoints (ai.baytides.org, ollama.baytides.org)
- Mobile applications (iOS, Android)
- GitHub Actions workflows
- Infrastructure-as-code (Bicep templates)

## Out of Scope

- Third-party services we link to (program websites)
- Plausible Analytics instance
- Denial of service attacks
