# Getting Started with Azure Integration

This quick start guide will help you deploy Bay Navigator to Azure in under 30 minutes.

## ✅ Prerequisites Checklist

Before you begin, make sure you have:

- [ ] Azure account ([sign up free](https://azure.microsoft.com/free/))
- [ ] Azure CLI installed ([install guide](https://docs.microsoft.com/cli/azure/install-azure-cli))
- [ ] Node.js 20+ installed ([download](https://nodejs.org/))
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

## 🚀 Step-by-Step Deployment

### Step 1: Clone the Repository (2 minutes)

```bash
git clone https://github.com/baytides/baynavigator.git
cd baynavigator
```

### Step 2: Login to Azure (1 minute)

```bash
az login
```

This will open a browser window for authentication.

### Step 3: Create Resource Group (1 minute)

```bash
# Choose a region close to you
# Options: westus2, eastus, centralus, westeurope, etc.

az group create \
  --name baynavigator-rg \
  --location westus2
```

### Step 4: Deploy Infrastructure (10 minutes)

```bash
# This creates all Azure resources
az deployment group create \
  --resource-group baynavigator-rg \
  --template-file infrastructure/bicep/main.bicep \
  --parameters infrastructure/bicep/parameters.json.example
```

**What this creates:**

- ✅ Cosmos DB account, database, and container
- ✅ Azure Functions app
- ✅ Storage account
- ✅ Application Insights

**Wait time**: ~5-10 minutes while Azure provisions resources.

### Step 5: Configure Function App (Automatic with Managed Identity)

The Function App now uses **Managed Identity** (Azure AD) for authentication. No keys required!

Your Function App has been automatically assigned:

- ✅ **Cosmos DB Data Contributor** role on Cosmos DB
- ✅ **Cognitive Services User** role on Translator
- ✅ **Storage Account Key Operator** role on storage accounts

### Step 6: Migrate Data to Cosmos DB (5 minutes)

```bash
# Set environment variables (use values from Step 5)
export COSMOS_DB_ENDPOINT="https://your-cosmos-account.documents.azure.com:443/"
export AZURE_TRANSLATOR_ENDPOINT="https://your-translator.cognitiveservices.azure.com/"
export COSMOS_DB_DATABASE_NAME="baynavigator"
export COSMOS_DB_CONTAINER_NAME="programs"

# Install migration script dependencies
cd scripts
npm install

# Run migration
npm run migrate

# You should see: "✅ Upload complete!"
```

### Step 7: Deploy Azure Functions (5 minutes)

```bash
# Get your Function App name
az functionapp list \
  --resource-group baynavigator-rg \
  --query "[].{Name:name}" -o table

# Install Azure Functions Core Tools (if not already installed)
npm install -g azure-functions-core-tools@4

# Install function dependencies
cd ../azure-functions
npm install

# Deploy to Azure
func azure functionapp publish <your-function-app-name>
```

### Step 8: Test Your API (2 minutes)

```bash
# Get your Function App URL
az functionapp show \
  --resource-group baynavigator-rg \
  --name <your-function-app-name> \
  --query defaultHostName -o tsv

# Test the API (replace <url> with your Function App URL)
curl https://<url>/api/programs
curl https://<url>/api/categories
```

You should see JSON responses with your program data!

### Step 9: Configure GitHub Actions (5 minutes)

1. **Get Function App Publish Profile:**

   ```bash
   az functionapp deployment list-publishing-profiles \
     --resource-group baynavigator-rg \
     --name <your-function-app-name> \
     --xml
   ```

2. **Add GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add these secrets:

   | Secret Name                          | Value                         |
   | ------------------------------------ | ----------------------------- |
   | `AZURE_FUNCTION_APP_NAME`            | Your function app name        |
   | `AZURE_FUNCTION_APP_PUBLISH_PROFILE` | XML output from command above |
   | `AZURE_RESOURCE_GROUP`               | `baynavigator-rg`             |

3. **Test GitHub Actions:**
   - Go to Actions tab in GitHub
   - Click "Deploy Azure Functions"
   - Click "Run workflow"

## ✨ You're Done!

Congratulations! You now have:

✅ **Azure Cosmos DB** storing your program data
✅ **Azure Functions** providing a REST API
✅ **Application Insights** monitoring your app
✅ **GitHub Actions** auto-deploying on every push
✅ **Total cost**: ~$0.02/month (essentially free!)

## 🧪 Testing Your Deployment

### Test the API

```bash
# Get all programs
curl https://<your-function-app>.azurewebsites.net/api/programs

# Get programs by category
curl "https://<your-function-app>.azurewebsites.net/api/programs?category=Food"

# Get a specific program
curl https://<your-function-app>.azurewebsites.net/api/programs/alameda-food-bank

# Get categories
curl https://<your-function-app>.azurewebsites.net/api/categories
```

### View Monitoring

```bash
# Stream live logs
func azure functionapp logstream <your-function-app-name>
```

Or visit: [Azure Portal](https://portal.azure.com) → Your Function App → Monitor

## 📊 Next Steps

### Optional Enhancements

1. **Update Static Web App to use API**
   - Modify `assets/js/search-filter.js` to fetch from API
   - See `AZURE_INTEGRATION.md` for examples

2. **Set up alerts**

   ```bash
   # Get notified if monthly cost exceeds $1
   az monitor metrics alert create \
     --name "High Cost Alert" \
     --resource-group baynavigator-rg \
     --condition "total Cost > 1"
   ```

3. **Enable Application Insights**
   - View in Azure Portal
   - Set up custom dashboards
   - Configure availability tests

4. **Add more API endpoints**
   - See `azure-functions/README.md` for guide
   - Examples: Submit program, favorites, email alerts

## 🐛 Troubleshooting

### Issue: "Deployment failed"

**Check:**

```bash
# View deployment errors
az deployment group show \
  --resource-group baynavigator-rg \
  --name main \
  --query properties.error
```

### Issue: "Migration failed"

**Common causes:**

- Wrong Cosmos DB credentials
- Cosmos DB not ready yet (wait 5 minutes)
- Network/firewall issues

**Solution:**

```bash
# Verify connection
az cosmosdb show \
  --resource-group baynavigator-rg \
  --name <cosmos-account-name>
```

### Issue: "Function app not responding"

**Solution:**

```bash
# Restart function app
az functionapp restart \
  --resource-group baynavigator-rg \
  --name <function-app-name>

# Check logs
func azure functionapp logstream <function-app-name>
```

### Issue: "CORS errors"

**Solution:**
Update allowed origins in `infrastructure/bicep/main.bicep`:

```bicep
cors: {
  allowedOrigins: [
    'https://baynavigator.org'
    'https://your-domain.com'  // Add your domain
    'http://localhost:4000'
  ]
}
```

Then redeploy infrastructure.

## 💰 Cost Management

### Monitor Spending

```bash
# View current costs
az consumption usage list \
  --start-date 2025-12-01 \
  --end-date 2025-12-31

# Set up cost alert
az consumption budget create \
  --resource-group baynavigator-rg \
  --budget-name "Monthly Budget" \
  --amount 5 \
  --time-grain Monthly
```

### Stay in Free Tier

Your deployment should use:

- Cosmos DB: <100 RU/s (free tier: 1000 RU/s)
- Functions: <10k executions/day (free tier: 1M/month)
- Storage: <100 MB (free tier: 5 GB)
- App Insights: <500 MB/month (free tier: 5 GB/month)

**Total: $0.00-0.02/month** 🎉

## 🔐 Security Checklist

Before going to production:

- [ ] Review CORS settings in Bicep file
- [ ] Enable Azure Key Vault for secrets (optional)
- [ ] Set up backup for Cosmos DB
- [ ] Configure custom domain with SSL
- [ ] Enable authentication for admin functions
- [ ] Review Application Insights data retention
- [ ] Set up budget alerts

## 📚 Learn More

- [Azure Cosmos DB Tutorial](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Functions Quickstart](https://docs.microsoft.com/azure/azure-functions/)
- [Infrastructure as Code with Bicep](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Full Integration Guide](AZURE_INTEGRATION.md)

## 🆘 Need Help?

- **Documentation**: See `infrastructure/README.md` and `azure-functions/README.md`
- **Issues**: [Open a GitHub issue](https://github.com/baytides/baynavigator/issues)
- **Discussions**: [Ask the community](https://github.com/baytides/baynavigator/discussions)
- **Azure Support**: [Azure Community](https://docs.microsoft.com/answers/products/azure)

## 🎉 Success!

You've successfully deployed Bay Navigator to Azure! Your app is now:

- ✅ Scalable (handles any traffic)
- ✅ Fast (global CDN + serverless)
- ✅ Reliable (99.9% uptime SLA)
- ✅ Monitored (Application Insights)
- ✅ Affordable (essentially free!)
- ✅ Open source (all code on GitHub)

**Share your deployment!** Tweet @AzureSupport with #AzureOpenSource

---

Made with ❤️ for the open source community
