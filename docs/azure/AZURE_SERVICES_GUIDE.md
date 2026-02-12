# Azure Services Guide

Complete guide to all Azure services used by Bay Navigator.

## 🏗️ Architecture Overview

```
Users → Front Door (CDN) → Static Web Apps (Jekyll)
                         ↓
                    API Management
                         ↓
                  Azure Functions
                    ↓        ↓
              Redis Cache  Cosmos DB
                    ↓
              Key Vault (Secrets)
                    ↓
         Application Insights (Monitoring)
```

## 📊 Services Deployed

### 1. Azure Static Web Apps

**Purpose:** Host Jekyll static website  
**SKU:** Free  
**Endpoint:** https://wonderful-coast-09041e01e.2.azurestaticapps.net  
**Custom Domain:** baynavigator.org (configured separately)

**Features:**

- Automatic deployment from GitHub
- Built-in SSL certificates
- Global CDN distribution
- Serverless API functions (not used - we use separate Functions app)

---

### 2. Azure Front Door (Standard)

**Purpose:** Global CDN and traffic acceleration  
**Endpoint:** https://baynavigator-web-b9gzhvbpdedgc2hn.z02.azurefd.net  
**Resource:** `baynavigator-fd`

**Configuration:**

- Origin: Static Web App
- HTTPS redirect enabled
- Health probes every 120s
- Caching enabled

**Benefits:**

- Faster load times globally
- DDoS protection
- Web Application Firewall (WAF) capable
- Custom domain support

**Cost:** ~$15-25/month

---

### 3. Azure Functions (Consumption)

**Purpose:** Serverless REST API backend  
**Runtime:** Node.js 20  
**Resource:** `baynavigator-func-prod-clx32fwtnzehq`

**Endpoints:**

- `/api/programs` - Get all programs (with filters)
- `/api/programs/{id}` - Get single program
- `/api/categories` - Get all categories
- `/api/areas` - Get all areas
- `/api/stats` - Get statistics
- `/api/translate` - Translate text

**Features:**

- Managed identity authentication to Cosmos/Key Vault
- Application Insights integration
- Redis caching layer (1-hour TTL)
- Automatic scaling
- GitHub Actions deployment

**Cost:** Free tier (1M requests/month), then ~$0.20/million

---

### 4. Azure Cosmos DB (Serverless)

**Purpose:** NoSQL database for program data  
**API:** Core (SQL)  
**Resource:** `baynavigator-cosmos-prod-clx32fwtnzehq`

**Configuration:**

- Database: `baynavigator`
- Container: `programs`
- Partition Key: `/category`
- Consistency: Session

**Cost:** $0.25/million RUs + $0.25/GB/month storage

---

### 5. Azure Cache for Redis (Basic C0)

**Purpose:** Server-side caching for API responses  
**SKU:** Basic C0 (250MB)  
**Resource:** `baynavigator-redis`  
**Endpoint:** `baynavigator-redis.redis.cache.windows.net:6380`

**Cache Strategy:**

- Programs listings: 1 hour TTL
- Translation results: 24 hours TTL
- Categories/Areas: 24 hours TTL

**Benefits:**

- Reduces Cosmos DB RU consumption
- Faster API response times
- Reduces Functions execution time

**Cost:** Free tier

---

### 6. Azure Key Vault (Standard)

**Purpose:** Centralized secret management  
**Resource:** `baynavigator-kv-prod`  
**URL:** https://baynavigator-kv-prod.vault.azure.net/

**Secrets Stored:**

- Cosmos DB connection strings
- Redis access keys
- API keys for external services
- Translator service keys

**Access:** Functions app uses Managed Identity with "Key Vault Secrets User" role

**Cost:** $0.03 per 10,000 operations

---

### 7. Application Insights

**Purpose:** Application monitoring and analytics  
**Resource:** `baynavigator-insights-prod`

**Metrics Tracked:**

- API response times
- Cache hit/miss rates
- Error rates and exceptions
- Custom metrics (programs returned, etc.)
- User analytics (page views, sessions)

**Dashboards Available:**

- Performance metrics
- Failure analysis
- Live metrics stream
- Usage analytics

**Cost:** Free tier (5GB/month), then $2.30/GB

---

### 8. API Management (Consumption)

**Purpose:** API gateway with rate limiting and analytics  
**Resource:** `baynavigator-api`  
**Status:** Deploying (30-45 minutes)

**Planned Features:**

- Rate limiting: 100 requests/min per IP
- API key management
- Request/response caching
- Analytics dashboard
- OpenAPI documentation portal
- CORS policies

**Cost:** Consumption tier ($3.50/million calls)

---

### 9. Azure Monitor Alerts

**Purpose:** Proactive monitoring and notifications

**Configured Alerts:**

1. **Functions-HighErrors**
   - Triggers: >5 HTTP 5xx errors in 5 minutes
   - Action: Email to steven@baytides.org

2. **Cosmos-HighRU**
   - Triggers: >1000 RUs consumed in 5 minutes
   - Action: Email to steven@baytides.org

**Action Group:** `BayAreaDiscounts-Alerts`

**Cost:** Free (5 alert rules included)

---

## 🔐 Security Configuration

### Managed Identities

- Functions app has system-assigned managed identity
- Used for passwordless auth to:
  - Cosmos DB (Data Contributor)
  - Key Vault (Secrets User)
  - Storage Account

### Network Security

- Storage has firewall with Azure Services allowed
- GitHub Actions IPs whitelisted
- Redis requires TLS 1.2+
- Key Vault uses RBAC authorization

---

## 💰 Cost Estimate

| Service         | Tier         | Monthly Cost     |
| --------------- | ------------ | ---------------- |
| Static Web Apps | Free         | $0               |
| Front Door      | Standard     | $15-25           |
| Functions       | Consumption  | $0-5             |
| Cosmos DB       | Serverless   | $5-15            |
| Redis Cache     | Basic C0     | $0               |
| Key Vault       | Standard     | $0-1             |
| App Insights    | 5GB free     | $0-3             |
| API Management  | Consumption  | $0-10            |
| Alerts          | 5 rules free | $0               |
| **Total**       |              | **$20-60/month** |

---

## 📈 Performance Improvements

### Without Caching:

- API response: 200-400ms
- Cosmos DB reads: ~5 RU per query
- Cold start: 1-3 seconds

### With Redis Caching:

- Cached response: 20-50ms (10x faster)
- Cosmos DB reads: Reduced 80-90%
- Cache hit rate: Target 70%+

### With Front Door:

- Global latency: <100ms
- Static assets cached at edge
- DDoS protection

---

## 🔧 Local Development

### Required Environment Variables:

```bash
# Cosmos DB
COSMOS_DB_ENDPOINT=https://baynavigator-cosmos-prod-clx32fwtnzehq.documents.azure.com:443/
COSMOS_DB_DATABASE_NAME=baynavigator
COSMOS_DB_CONTAINER_NAME=programs

# Redis Cache (optional for local dev)
REDIS_HOST=baynavigator-redis.redis.cache.windows.net
REDIS_KEY=<from Azure Portal>

# Key Vault (optional for local dev)
KEY_VAULT_URL=https://baynavigator-kv-prod.vault.azure.net/

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=<from Functions app settings>
```

### Testing Locally:

```bash
cd azure-functions
npm install
func start
```

---

## 📚 Related Documentation

- [AZURE_INTEGRATION.md](AZURE_INTEGRATION.md) - Integration overview
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - API documentation
- [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) - Deployment details
- [OpenAPI Spec](../openapi/baynavigator-api.yaml) - API specification

---

## 🎯 Next Steps

1. **Configure Custom Domain on Front Door**
   - Point baynavigator.org to Front Door endpoint
   - Configure SSL certificate

2. **Complete API Management Setup**
   - Import Functions API
   - Configure rate limiting policies
   - Set up developer portal

3. **Optimize Caching Strategy**
   - Monitor cache hit rates
   - Adjust TTLs based on data update frequency
   - Implement cache warming for popular queries

4. **Set Up Budget Alerts**
   - Configure Azure budget alerts at $50/month
   - Set up cost analysis dashboards

---

_Last Updated: December 2025_
