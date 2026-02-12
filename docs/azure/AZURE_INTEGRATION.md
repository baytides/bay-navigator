# Azure Integration Guide

This document explains how Bay Navigator integrates with Microsoft Azure while remaining fully open source.

## 🎯 Overview

Bay Navigator uses Azure services for hosting and backend infrastructure while keeping **all code open source on GitHub**. This is a reference implementation showing how to build a modern, scalable web application using Azure's generous free tiers.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Bay Navigator                          │
│                  Complete Architecture                          │
└─────────────────────────────────────────────────────────────────┘

      Users
        │
        ├─────────────────────┬──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Website    │      │  Mobile App  │      │  Third-Party │
│  (Jekyll)    │      │  (Future)    │      │    Apps      │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                      │
       └──────────────┬──────┴──────────────────────┘
                      ▼
              ┌─────────────────┐
              │ Azure Static    │
              │   Web Apps      │◄────── GitHub Actions
              └────────┬────────┘        (Auto Deploy)
                       │
                       │ REST API
                       ▼
              ┌─────────────────┐
              │ Azure Functions │◄────── GitHub Actions
              │  (Node.js 20)   │        (Auto Deploy)
              └────────┬────────┘
                       │
                       │ Cosmos SDK
                       ▼
              ┌─────────────────┐
              │  Cosmos DB      │
              │  (Serverless)   │
              │  Partition: cat │
              └─────────────────┘
                       │
                       │ Telemetry
                       ▼
              ┌─────────────────┐
              │  Application    │
              │    Insights     │
              │  (Monitoring)   │
              └─────────────────┘
```

## 📦 Azure Services Used

### 1. Azure Static Web Apps (Current)

**What it does**: Hosts the Jekyll static website
**Cost**: Free tier
**Open source**: ✅ GitHub Actions workflow public
**Code location**: `.github/workflows/azure-static-web-apps-*.yml`

### 2. Azure Cosmos DB (New)

**What it does**: NoSQL database for program data
**Cost**: Serverless - pay per request (1000 RU/s free)
**Open source**: ✅ Schema and queries in repo
**Code location**: `infrastructure/bicep/main.bicep`

**Why Cosmos DB?**

- Real-time updates without rebuilding site
- Better search and filtering capabilities
- API access for third-party integrations
- Geographic distribution (future: multi-region)
- Automatic indexing and scaling

### 3. Azure Functions (New)

**What it does**: Serverless REST API
**Cost**: Consumption plan (1M executions free)
**Open source**: ✅ All function code in repo
**Code location**: `azure-functions/`

**API Endpoints**:

- `GET /api/programs` - List programs with filters
- `GET /api/programs/{id}` - Get single program
- `GET /api/categories` - List categories

### 4. Application Insights (New)

**What it does**: Monitoring, analytics, and error tracking
**Cost**: Free tier (5 GB/month)
**Open source**: ✅ Configuration in repo
**Code location**: `infrastructure/bicep/main.bicep`

**What it tracks**:

- API response times
- Error rates and stack traces
- Popular programs/categories
- User demographics (anonymous)
- Performance bottlenecks

## 💰 Cost Analysis

| Service              | Free Tier        | Expected Usage | Monthly Cost    |
| -------------------- | ---------------- | -------------- | --------------- |
| Static Web Apps      | Unlimited        | 100% covered   | $0.00           |
| Cosmos DB            | 1000 RU/s, 25 GB | 50 RU/s, <1 GB | $0.00           |
| Azure Functions      | 1M executions    | ~50k requests  | $0.00           |
| Storage (Functions)  | 5 GB             | <100 MB        | $0.02           |
| Application Insights | 5 GB data        | ~500 MB        | $0.00           |
| **Total**            |                  |                | **$0.02/month** |

**Scaling costs** (10,000 visitors/day):

- Cosmos DB: ~$5/month
- Azure Functions: Still free
- Application Insights: Still free
- **Total: ~$5/month**

## 🔓 How This Remains Open Source

### What's Public (in GitHub)

✅ All application code
✅ Azure Functions (serverless API)
✅ Infrastructure as Code (Bicep templates)
✅ Database schema and queries
✅ CI/CD workflows
✅ Configuration files (with placeholders)
✅ Documentation and setup guides

### What's Private (Azure secrets)

🔒 Database connection strings
🔒 API keys
🔒 Service principal credentials
🔒 Actual program data (though licensed CC BY 4.0)

### License Compliance

- **Code**: MIT License (requires attribution)
- **Data**: CC BY 4.0 (requires attribution)
- Anyone can fork and deploy their own instance
- Azure services are optional - code works with any cloud provider

## 🚀 Deployment Options

### Option 1: Use Azure (Recommended)

Follow the guide in `infrastructure/README.md`

- Free tier covers most usage
- Easy GitHub Actions integration
- 5-minute setup

### Option 2: Use Other Cloud Providers

The code is cloud-agnostic:

- Replace Cosmos DB with MongoDB Atlas, DynamoDB, or Firebase
- Replace Functions with AWS Lambda, Google Cloud Functions, or Vercel
- Replace Static Web Apps with Netlify, Vercel, or GitHub Pages

### Option 3: Self-Host

Run everything on your own server:

- Use MongoDB or PostgreSQL for data
- Use Express.js or Next.js for API
- Host static site anywhere

## 📋 Quick Start

### Prerequisites

- Azure account (free at https://azure.microsoft.com/free/)
- Azure CLI installed
- Node.js 20+
- Git

### 1. Clone Repository

```bash
git clone https://github.com/baytides/baynavigator.git
cd baynavigator
```

### 2. Deploy Infrastructure

```bash
# Login to Azure
az login

# Create resource group
az group create --name baynavigator-rg --location westus2

# Deploy resources
az deployment group create \
  --resource-group baynavigator-rg \
  --template-file infrastructure/bicep/main.bicep
```

### 3. Migrate Data

```bash
# Get Cosmos DB credentials from Azure Portal

# Set environment variables
export COSMOS_DB_ENDPOINT="https://xxx.documents.azure.com:443/"
export COSMOS_DB_KEY="your-key"

# Run migration
cd scripts
npm install
npm run migrate
```

### 4. Deploy Functions

```bash
cd azure-functions
npm install
func azure functionapp publish <your-function-app-name>
```

### 5. Configure GitHub Actions

Add these secrets to your GitHub repository:

- `AZURE_FUNCTION_APP_NAME`
- `AZURE_FUNCTION_APP_PUBLISH_PROFILE`
- Other secrets (see `infrastructure/README.md`)

## 🔄 Data Flow

### Static Site (Current)

```
YAML files → Jekyll build → Static HTML → Azure Static Web Apps
```

### Dynamic API (New)

```
Admin adds program → Cosmos DB → Azure Functions API → Website/Apps
```

### Hybrid Approach (Recommended)

```
YAML files (version control) → Migration script → Cosmos DB
                                                      ↓
Website ←──────────────── Azure Functions API ←──────┘
```

## 🌟 Benefits of Azure Integration

### For Users

✅ Faster search (server-side with Cosmos DB)
✅ Real-time updates (no rebuild needed)
✅ Better mobile experience (API access)
✅ More features (favorites, notifications)

### For Developers

✅ Easy to contribute (all code is open)
✅ Modern stack (serverless, NoSQL)
✅ Free to deploy (generous free tiers)
✅ Production-ready (automatic scaling)

### For the Project

✅ Community ownership (MIT license)
✅ Sustainability (Azure sponsorship potential)
✅ Ecosystem growth (third-party apps welcome)
✅ Data portability (easy export/import)

## 🛠️ Development Workflow

### Local Development

```bash
# Run Jekyll site locally
bundle exec jekyll serve

# Run Azure Functions locally
cd azure-functions
func start

# Both running:
# - Website: http://localhost:4000
# - API: http://localhost:7071
```

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/new-endpoint

# 2. Make changes to code
# Edit azure-functions/NewFunction/index.js

# 3. Test locally
func start

# 4. Commit and push
git add .
git commit -m "Add new API endpoint"
git push origin feature/new-endpoint

# 5. Create pull request
# GitHub Actions will test and deploy automatically
```

## 📊 Monitoring & Analytics

### Application Insights Dashboard

View in Azure Portal:

- Request counts and latency
- Error rates and types
- Popular programs
- Geographic distribution
- Custom metrics

### Cosmos DB Metrics

- Request units consumed
- Storage usage
- Query performance
- Indexing efficiency

### Cost Management

Set up alerts for:

- Monthly spending > $1
- Cosmos DB RU/s > 100
- Function executions > 100k

## 🔐 Security Best Practices

✅ **All traffic HTTPS only**
✅ **CORS configured for specific origins**
✅ **Secrets in Azure Key Vault** (not in code)
✅ **Connection strings in environment variables**
✅ **Read-only API (no write access publicly)**
✅ **Input validation and sanitization**
✅ **Rate limiting** (via Azure API Management)
✅ **Monitoring and alerts**

## 🌍 Community Contributions

### How to Contribute

1. **Add programs**: Edit YAML files, run migration
2. **Improve API**: Add new Azure Functions
3. **Enhance frontend**: Update Jekyll templates
4. **Write documentation**: Help others deploy
5. **Report bugs**: Open GitHub issues
6. **Share feedback**: Start discussions

### Fork for Your City

Want to create "Seattle Discounts" or "NYC Benefits"?

```bash
# 1. Fork this repo
# 2. Update _config.yml with your city
# 3. Deploy to your own Azure account
# 4. Replace program data with your city's programs
# 5. Share with your community!
```

## 📚 Resources

### Documentation

- [Infrastructure Setup](../infrastructure/README.md)
- [Azure Functions API](../azure-functions/README.md)
- [Main README](../README.md)
- [Contributing Guide](CONTRIBUTING.md)

### Azure Resources

- [Azure Free Account](https://azure.microsoft.com/free/)
- [Cosmos DB Pricing](https://azure.microsoft.com/pricing/details/cosmos-db/)
- [Functions Pricing](https://azure.microsoft.com/pricing/details/functions/)
- [Azure for Students](https://azure.microsoft.com/free/students/)

### Learning

- [Azure Functions Tutorial](https://docs.microsoft.com/azure/azure-functions/)
- [Cosmos DB Getting Started](https://docs.microsoft.com/azure/cosmos-db/)
- [Infrastructure as Code with Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)

## 🆘 Support

- **Technical issues**: [Open a GitHub issue](https://github.com/baytides/baynavigator/issues)
- **Azure questions**: [Azure Community Support](https://docs.microsoft.com/answers/products/azure)
- **General questions**: [Start a discussion](https://github.com/baytides/baynavigator/discussions)

## 📝 License

This project uses dual licensing:

- **Code**: MIT License (requires attribution)
- **Data**: CC BY 4.0 (requires attribution)

See [LICENSE](LICENSE) and [LICENSE-DATA](LICENSE-DATA) for details.

---

**Built with ❤️ for the Bay Area community**
**Powered by Azure (but works anywhere!)**
