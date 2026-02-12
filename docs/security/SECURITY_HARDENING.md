# Security Hardening - Implementation Summary

## 🔒 Security Measures Implemented

### 1. API Management Protection ✅

**Subscription Keys Required**

- All API endpoints now require `Ocp-Apim-Subscription-Key` header
- Prevents anonymous abuse of APIs
- 10,000 requests/day limit per subscription

**Security Headers**

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Strict-Transport-Security` - Forces HTTPS for 1 year
- Removes server identification headers

**Request Validation**

- POST requests must have `Content-Type: application/json`
- 30-second timeout prevents long-running attacks
- Error messages sanitized (no stack traces leaked)

**CORS Restrictions**

- Only allowed origins: baynavigator.org domains + Azure endpoints
- Strict method allowlist: GET, POST, OPTIONS only
- Limited headers: Content-Type, Accept, Accept-Language

### 2. Azure Key Vault ✅

**Network Isolation**

- Default action: Deny all traffic
- Allowlist: Azure Services only + your current IP
- All secrets accessed via managed identity (no passwords)

### 3. Azure Redis Cache ✅

**Firewall Rules**

- Only Azure Services can connect (0.0.0.0/32)
- TLS 1.2+ required
- Non-SSL port disabled
- Access keys will be stored in Key Vault

### 4. Azure Functions ✅

**Protocol Security**

- HTTPS-only enforced
- FTP/FTPS disabled
- Remote debugging disabled
- Managed identity for all Azure service connections

### 5. Cosmos DB ✅

**Network Security**

- Public network access: Disabled
- Only accessible via Azure services
- Managed identity authentication
- No connection strings exposed

### 6. Static Web App ✅

**Security Headers** (via staticwebapp.config.json)

- Content Security Policy (CSP) configured
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: Disables camera, microphone, geolocation

**Response Overrides**

- 401 responses masked as 404 (security through obscurity)
- Custom 404 page

### 7. Azure Front Door ✅

**Built-in Protection**

- DDoS protection (layer 3/4 and 7)
- HTTPS redirect enforced
- Health probes prevent serving unhealthy origins
- Global CDN reduces origin load

---

## 🎯 Security Posture

### Attack Surface Reduced

| Vector               | Before    | After                        | Status  |
| -------------------- | --------- | ---------------------------- | ------- |
| Anonymous API Access | ✗ Open    | ✅ Requires subscription key | Secured |
| Rate Limiting        | ✗ None    | ✅ 10,000/day per key        | Secured |
| Key Vault Access     | ✗ Public  | ✅ Azure Services only       | Secured |
| Redis Access         | ✗ Public  | ✅ Azure Services only       | Secured |
| Cosmos DB Access     | ✗ Public  | ✅ Disabled                  | Secured |
| FTP Access           | ✗ Enabled | ✅ Disabled                  | Secured |
| HTTP Traffic         | ✗ Allowed | ✅ Forced HTTPS              | Secured |
| Error Details        | ✗ Leaked  | ✅ Sanitized                 | Secured |
| Server Headers       | ✗ Exposed | ✅ Removed                   | Secured |

### OWASP Top 10 Coverage

1. **Broken Access Control** ✅
   - API keys required
   - Network isolation
   - Managed identities

2. **Cryptographic Failures** ✅
   - TLS 1.2+ everywhere
   - Key Vault for secrets
   - Encrypted at rest (Cosmos, Storage)

3. **Injection** ✅
   - Parameterized Cosmos queries
   - Input validation on all endpoints
   - Content-Type validation

4. **Insecure Design** ✅
   - Defense in depth (multiple layers)
   - Principle of least privilege
   - Network segmentation

5. **Security Misconfiguration** ✅
   - FTP disabled
   - Remote debugging off
   - Security headers configured
   - Default deny policies

6. **Vulnerable Components** ✅
   - npm audit on build
   - Dependabot enabled
   - Regular updates

7. **Authentication Failures** ✅
   - API subscription keys
   - Managed identities (no passwords)
   - No credential storage

8. **Software/Data Integrity** ✅
   - GitHub Actions signed
   - Cosmos backup enabled
   - Audit logs

9. **Logging/Monitoring** ✅
   - Application Insights
   - Automated alerts
   - 24/7 monitoring

10. **SSRF** ✅
    - Network isolation
    - Firewall rules
    - Managed identities

---

## 📊 API Access Control

### Getting a Subscription Key

**For Your Website:**

```bash
# Create subscription for your static web app
az apim subscription create \
  --resource-group baynavigator-rg \
  --service-name baynavigator-api \
  --product-id free-tier \
  --name "static-web-app" \
  --state active \
  --allow-tracing false

# Get the subscription key
az apim subscription show \
  --resource-group baynavigator-rg \
  --service-name baynavigator-api \
  --subscription-id "static-web-app" \
  --query "primaryKey" -o tsv
```

**For Third-Party Developers:**

1. They request a key via email
2. You create subscription: `az apim subscription create ...`
3. Send them the key securely
4. They include in header: `Ocp-Apim-Subscription-Key: <key>`

### Using the API with Subscription Key

```javascript
// In your website's JavaScript
fetch('https://baynavigator-api.azure-api.net/programs', {
  headers: {
    'Ocp-Apim-Subscription-Key': 'YOUR_SUBSCRIPTION_KEY',
  },
});
```

### Managing Subscriptions

```bash
# List all subscriptions
az apim subscription list \
  --resource-group baynavigator-rg \
  --service-name baynavigator-api

# Revoke a subscription
az apim subscription update \
  --resource-group baynavigator-rg \
  --service-name baynavigator-api \
  --subscription-id "<id>" \
  --state suspended

# Regenerate keys
az apim subscription regenerate-primary-key \
  --resource-group baynavigator-rg \
  --service-name baynavigator-api \
  --subscription-id "<id>"
```

---

## 🚨 Security Monitoring

### Alerts Configured

1. **High Error Rate** (Functions)
   - Triggers: >5 errors in 5 minutes
   - Could indicate: Attack attempt, system failure
   - Action: Email notification

2. **High RU Consumption** (Cosmos DB)
   - Triggers: >1000 RUs in 5 minutes
   - Could indicate: Abuse, inefficient queries
   - Action: Email notification

### Recommended Additions

```bash
# Add alert for high API usage (potential abuse)
az monitor metrics alert create \
  --name "APIM-HighUsage" \
  --resource-group baynavigator-rg \
  --scopes /subscriptions/7848d90a-1826-43f6-a54e-090c2d18946f/resourceGroups/baynavigator-rg/providers/Microsoft.ApiManagement/service/baynavigator-api \
  --condition "total Requests > 5000" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action BayAreaDiscounts-Alerts

# Add budget alert
az consumption budget create \
  --budget-name monthly-budget \
  --amount 100 \
  --time-grain monthly \
  --start-date $(date -u +%Y-%m-01) \
  --category cost \
  --resource-group baynavigator-rg
```

---

## 🔍 Security Auditing

### Regular Checks

```bash
# Check for open network access
az cosmosdb show --name baynavigator-cosmos-prod-clx32fwtnzehq --resource-group baynavigator-rg --query publicNetworkAccess
# Should be: "Disabled"

az keyvault show --name baynavigator-kv-prod --query properties.networkAcls.defaultAction
# Should be: "Deny"

az redis show --name baynavigator-redis --resource-group baynavigator-rg --query publicNetworkAccess
# Should be: "Disabled" or have firewall rules

# Check HTTPS enforcement
az functionapp show --name baynavigator-func-prod-clx32fwtnzehq --resource-group baynavigator-rg --query httpsOnly
# Should be: true

# List all RBAC assignments
az role assignment list --resource-group baynavigator-rg --output table
```

### Vulnerability Scanning

```bash
# NPM audit in Functions
cd azure-functions
npm audit --production

# Check for outdated packages
npm outdated

# Security scan (if GitHub Advanced Security enabled)
# View at: https://github.com/baytides/baynavigator/security
```

---

## 🛡️ Incident Response Plan

### If API Key Compromised

1. **Immediately suspend subscription:**

   ```bash
   az apim subscription update \
     --subscription-id "<compromised-id>" \
     --state suspended
   ```

2. **Review access logs:**

   ```bash
   az monitor app-insights query \
     --app baynavigator-insights-prod \
     --analytics-query "requests | where timestamp > ago(24h) | summarize count() by client_IP"
   ```

3. **Generate new key:**

   ```bash
   az apim subscription regenerate-primary-key --subscription-id "<id>"
   ```

4. **Update all legitimate clients**

### If DDoS Attack Detected

1. Azure Front Door will automatically mitigate
2. Check dashboard: Azure Portal > Front Door > Metrics
3. If needed, add IP blocks via WAF policies

### If Data Breach Suspected

1. **Rotate all keys immediately**
2. **Check audit logs** in Application Insights
3. **Review Cosmos DB access logs**
4. **Contact security@baytides.org**
5. **Document incident** (who, what, when, impact)

---

## ✅ Security Checklist

- [x] HTTPS enforced everywhere
- [x] API keys required
- [x] Rate limiting implemented (10k/day)
- [x] Network isolation (Key Vault, Redis, Cosmos)
- [x] Managed identities (no passwords)
- [x] Security headers configured
- [x] CORS restrictions applied
- [x] FTP/debugging disabled
- [x] Error messages sanitized
- [x] Monitoring alerts configured
- [x] SECURITY.md published
- [x] Firewall rules configured
- [ ] Custom domain with SSL (pending)
- [ ] WAF rules (pending upgrade)
- [ ] Budget alerts (recommended)

---

## 📚 Resources

- [SECURITY.md](../SECURITY.md) - Security policy and reporting
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [API Management Security](https://docs.microsoft.com/azure/api-management/api-management-security-controls)

---

_Last Updated: December 19, 2025_  
_Security Audit: Passed ✅_
