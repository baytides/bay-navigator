# Azure AI Translator Setup Guide

This guide will help you configure Azure AI Translator for Bay Navigator.

## 🎯 Benefits of Azure AI Translator

✅ **Privacy-focused**: All translation happens server-side through your own Azure account
✅ **No third-party tracking**: Unlike Google Translate widgets, no visitor data is shared
✅ **High quality**: Professional-grade translations from Microsoft
✅ **Cost-effective**: Free tier includes 2M characters/month
✅ **Fast**: Translations are cached for repeat visits

---

## 📋 Prerequisites

- Azure account (create free account at [azure.microsoft.com](https://azure.microsoft.com/free/))
- Azure CLI installed (optional, but recommended)
- Bay Navigator Azure Functions deployed
- Function App system-assigned managed identity enabled

---

## 🚀 Step 1: Create Azure Translator Resource

## 🔑 Step 2: Secure Authentication (Managed Identity)

We now use Azure AD (managed identity) instead of keys. Disable local/auth keys on the Translator resource and grant the Function App access.

### Azure CLI (recommended)

```bash
export SUBSCRIPTION_ID="<your-subscription-id>"
export RG="<your-resource-group>"
export TRANSLATOR="<your-translator-name>"          # e.g., baynavigator-translator
export FUNCAPP="<your-function-app-name>"           # e.g., baynavigator-api

# Disable local (key) auth on Translator
az cognitiveservices account update \
   --subscription "$SUBSCRIPTION_ID" \
   --resource-group "$RG" \
   --name "$TRANSLATOR" \
   --disable-local-auth true \
   --public-network-access Disabled

# Ensure Function App has a system-assigned managed identity
az functionapp identity assign \
   --subscription "$SUBSCRIPTION_ID" \
   --resource-group "$RG" \
   --name "$FUNCAPP"

# Give the Function App access to Translator (Cognitive Services User)
FUNC_MI_PRINCIPAL_ID=$(az functionapp identity show \
   --subscription "$SUBSCRIPTION_ID" \
   --resource-group "$RG" \
   --name "$FUNCAPP" \
   --query principalId -o tsv)

az role assignment create \
   --assignee "$FUNC_MI_PRINCIPAL_ID" \
   --role "Cognitive Services User" \
   --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG/providers/Microsoft.CognitiveServices/accounts/$TRANSLATOR"

# (Optional) Add Private Endpoint instead of public access
# az network private-endpoint create ... --group-ids account --subresource TextTranslation

# Configure app settings (endpoint only; no key needed)
    "AZURE_TRANSLATOR_REGION": "westus2",
   --subscription "$SUBSCRIPTION_ID" \
   --resource-group "$RG" \
   --name "$FUNCAPP" \
   --settings \
      AZURE_TRANSLATOR_ENDPOINT="https://$TRANSLATOR.cognitiveservices.azure.com"
```

### For Local Development

Use `AzureWebJobsStorage` and `FUNCTIONS_WORKER_RUNTIME` as usual. To run Translator locally with MI, sign in via `az login` and start Functions; no key is required. If you must use a key locally, add `AZURE_TRANSLATOR_KEY` and `AZURE_TRANSLATOR_REGION`, but prefer managed identity.

> Note: The Function code now requests an AAD token for `https://cognitiveservices.azure.com/.default` and sends `Authorization: Bearer <token>`. Subscription keys are no longer used.

---

    "AZURE_TRANSLATOR_ENDPOINT": "https://api.cognitive.microsofttranslator.com"

}
}

````

3. Replace `YOUR_KEY_HERE` with your actual key from Step 2

### For Production (Azure)

1. Go to your Function App in Azure Portal
2. Click **"Configuration"** under Settings
3. Click **"New application setting"** and add:
   - **Name**: `AZURE_TRANSLATOR_KEY`
   - **Value**: Your API key
4. Add another setting:
   - **Name**: `AZURE_TRANSLATOR_REGION`
   - **Value**: `westus2` (or your region)
5. Add another setting:
   - **Name**: `AZURE_TRANSLATOR_ENDPOINT`
   - **Value**: `https://api.cognitive.microsofttranslator.com`
6. Click **"Save"**

### Using Azure CLI

```bash
# Set app settings in Azure Function App
az functionapp config appsettings set \
  --name YOUR_FUNCTION_APP_NAME \
  --resource-group baynavigator-rg \
  --settings \
    AZURE_TRANSLATOR_KEY="YOUR_KEY_HERE" \
    AZURE_TRANSLATOR_REGION="westus2" \
    AZURE_TRANSLATOR_ENDPOINT="https://api.cognitive.microsofttranslator.com"
````

---

## 🔧 Step 4: Update Client Configuration

1. Open `assets/js/azure-translator.js`
2. Find this line:
   ```javascript
   this.apiEndpoint = apiEndpoint || 'https://YOUR_FUNCTION_APP.azurewebsites.net/api/translate';
   ```
3. Replace `YOUR_FUNCTION_APP` with your actual Function App name

**Example:**

```javascript
this.apiEndpoint = apiEndpoint || 'https://baynavigator-api.azurewebsites.net/api/translate';
```

---

## 🧪 Step 5: Test the Translation

### Local Testing

1. Start Azure Functions locally:

   ```bash
   cd azure-functions
   func start
   ```

2. Test the translate endpoint:

   ```bash
   curl -X POST http://localhost:7071/api/translate \
     -H "Content-Type: application/json" \
     -d '{
       "texts": ["Hello", "Welcome to Bay Navigator"],
       "targetLang": "es",
       "sourceLang": "en"
     }'
   ```

3. You should get a response like:
   ```json
   {
     "success": true,
     "sourceLang": "en",
     "targetLang": "es",
     "translations": ["Hola", "Bienvenido a Bay Navigator"],
     "count": 2
   }
   ```

### Production Testing

1. Build and serve your site:

   ```bash
   bundle exec jekyll build
   bundle exec jekyll serve
   ```

2. Open http://localhost:4000
3. Click the **Translate** button in the utility bar
4. Select a language (e.g., Spanish)
5. The page should translate automatically

---

## 📊 Step 6: Monitor Usage

### Check Translation Usage

1. Go to Azure Portal
2. Open your Translator resource
3. Click **"Metrics"** in the left menu
4. View:
   - Characters translated
   - API calls
   - Errors

### Set Up Alerts

1. In Metrics, click **"New alert rule"**
2. Set condition: Characters translated > 1.8M (90% of free tier)
3. Add email notification
4. This warns you before hitting the free tier limit

---

## 💰 Cost Information

### Free Tier (F0)

- **Included**: 2 million characters per month
- **Cost**: $0

### Standard Tier (S1) - If you exceed free tier

- **First 2M characters**: Included in $10/month base fee
- **Additional characters**: $10 per 1 million characters

### Example Costs

For a typical page with ~5,000 characters:

- **Free tier**: 400 page translations per month
- **Standard tier**: Unlimited for ~$10/month + overages

**Note**: Bay Navigator caches translations, so repeat visitors in the same language don't count against your quota.

---

## 🔐 Security Best Practices

### ✅ DO:

- Store API keys in Azure Function App Settings (environment variables)
- Use the Azure Functions proxy (never expose keys to client-side)
- Monitor usage regularly
- Rotate API keys periodically

### ❌ DON'T:

- Commit API keys to git
- Expose API keys in client-side JavaScript
- Share API keys publicly
- Use the same key for multiple projects

### Rotating Keys

If you need to rotate keys (recommended every 90 days):

```bash
# Regenerate keys
az cognitiveservices account keys regenerate \
  --name baynavigator-translator \
  --resource-group baynavigator-rg \
  --key-name key1

# Get new key
az cognitiveservices account keys list \
  --name baynavigator-translator \
  --resource-group baynavigator-rg
```

Then update your Function App settings with the new key.

---

## 🐛 Troubleshooting

### "Azure Translator API key not configured"

**Solution**: Make sure you added `AZURE_TRANSLATOR_KEY` to your Function App settings.

### "Translation service error"

**Solutions**:

1. Check your API key is correct
2. Verify the region matches your resource (e.g., `westus2`)
3. Check Azure Translator resource is active
4. View Function App logs for details

### "Translation failed. Please try again."

**Solutions**:

1. Open browser console (F12) to see detailed error
2. Check network tab for failed requests
3. Verify Function App URL is correct in `azure-translator.js`
4. Test the API endpoint directly with curl

### Viewing Function Logs

```bash
# Stream logs from Azure
az webapp log tail \
  --name YOUR_FUNCTION_APP_NAME \
  --resource-group baynavigator-rg
```

---

## 📈 Performance Optimization

### Caching Strategy

The client automatically caches translations in memory. To improve performance:

1. **Add localStorage caching**:
   - Persists translations across sessions
   - Reduces API calls for repeat visitors

2. **Pre-translate common content**:
   - Create static translations for frequently used text
   - Only use API for dynamic content

3. **Batch translations**:
   - The current implementation already batches all page text
   - Maximum 1000 characters per API call (adjust if needed)

---

## 🌍 Supported Languages

Currently configured languages:

- 🇺🇸 English (en)
- 🇪🇸 Spanish (es)
- 🇨🇳 Chinese Simplified (zh-Hans)
- 🇵🇭 Tagalog (tl)
- 🇻🇳 Vietnamese (vi)
- 🇰🇷 Korean (ko)
- 🇷🇺 Russian (ru)
- 🇸🇦 Arabic (ar)
- 🇮🇷 Persian (fa)
- 🇯🇵 Japanese (ja)
- 🇫🇷 French (fr)
- 🇮🇳 Hindi (hi)

Azure Translator supports 100+ languages. To add more:

1. Edit `azure-functions/Translate/index.js` - add language code to `supportedLanguages` array
2. Edit `assets/js/azure-translator.js` - add language to `getSupportedLanguages()` method
3. Redeploy functions

---

## 📚 Additional Resources

- [Azure Translator Documentation](https://learn.microsoft.com/azure/ai-services/translator/)
- [Translator API Reference](https://learn.microsoft.com/azure/ai-services/translator/reference/v3-0-reference)
- [Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)
- [Language Support](https://learn.microsoft.com/azure/ai-services/translator/language-support)

---

## 🆘 Getting Help

1. **Check Function Logs**: Azure Portal → Function App → Monitor → Logs
2. **Test API Directly**: Use curl or Postman to test the `/api/translate` endpoint
3. **Open an Issue**: Create issue on GitHub with error details
4. **Azure Support**: For Azure-specific issues, contact Azure support

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Azure Translator resource created with Free tier
- [ ] API key added to Azure Function App settings
- [ ] Region matches your Translator resource location
- [ ] Function App URL updated in `azure-translator.js`
- [ ] Translation works in local development
- [ ] Translation works in production
- [ ] Usage monitoring/alerts configured
- [ ] API keys secured (not in git)
- [ ] Tested with multiple languages
- [ ] Cache is working (check network tab for reduced API calls)

---

## 🎉 You're All Set!

Your site now has privacy-focused, server-side translation powered by Azure AI Translator!

Users can:

- Translate the entire site into 12 languages
- Have their language preference remembered
- Get high-quality translations without being tracked
- Enjoy fast translations thanks to caching
