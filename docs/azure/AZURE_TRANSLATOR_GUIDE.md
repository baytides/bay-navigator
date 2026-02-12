# Azure AI Translator Integration Guide

This guide explains how to integrate Azure AI Translator with Bay Navigator.

## 🎯 Current Implementation

The utility bar now uses a **clean language selection modal** that redirects to translated versions via Google Translate's URL proxy. This is the simplest approach for static sites.

### Why This Approach?

For **static Jekyll sites** like Bay Navigator, full Azure AI Translator integration requires:

- Server-side rendering or middleware
- API key management
- Translating all content on every page load
- Caching strategy for performance

The current solution provides:
✅ **11 languages** supported
✅ **Beautiful modal UI** with flags and native language names
✅ **No API costs** (uses Google Translate's free URL proxy)
✅ **Zero configuration** required
✅ **Instant translation** (redirects to translated page)

---

## 🚀 Option 1: Current Solution (Recommended for Static Sites)

**Location:** `_includes/utility-bar.html`

The translate button opens a modal with 12 language options. Clicking a language redirects to a translated version of the page (or back to original English).

**Supported Languages:**

- 🇺🇸 English (US) - Return to original page
- 🇪🇸 Spanish (Español)
- 🇨🇳 Chinese Simplified (简体中文)
- 🇵🇭 Tagalog
- 🇻🇳 Vietnamese (Tiếng Việt)
- 🇰🇷 Korean (한국어)
- 🇷🇺 Russian (Русский)
- 🇸🇦 Arabic (العربية)
- 🇮🇷 Persian (فارسی)
- 🇯🇵 Japanese (日本語)
- 🇫🇷 French (Français)
- 🇮🇳 Hindi (हिन्दी)

---

## 🔧 Option 2: Azure AI Translator with Azure Functions

For a **more Azure-native solution**, you can use Azure AI Translator API with server-side translation.

### Prerequisites

1. **Azure Translator Resource**

   ```bash
   # Create Azure Translator resource
   az cognitiveservices account create \
     --name baynavigator-translator \
     --resource-group baynavigator-rg \
     --kind TextTranslation \
     --sku F0 \
     --location westus2

   # Get API key
   az cognitiveservices account keys list \
     --name baynavigator-translator \
     --resource-group baynavigator-rg
   ```

2. **Add to local.settings.json**
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AZURE_TRANSLATOR_KEY": "your-key-here",
       "AZURE_TRANSLATOR_REGION": "westus2",
       "AZURE_TRANSLATOR_ENDPOINT": "https://api.cognitive.microsofttranslator.com"
     }
   }
   ```

### Implementation

#### Step 1: Enhanced Azure Function

Replace `azure-functions/Translate/index.js` with:

```javascript
const axios = require('axios');
const crypto = require('crypto');

module.exports = async function (context, req) {
  context.res = {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    return;
  }

  try {
    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      context.res.status = 400;
      context.res.body = { error: 'Missing text or targetLang' };
      return;
    }

    const key = process.env.AZURE_TRANSLATOR_KEY;
    const region = process.env.AZURE_TRANSLATOR_REGION;
    const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;

    const response = await axios.post(`${endpoint}/translate`, [{ text }], {
      params: {
        'api-version': '3.0',
        to: targetLang,
      },
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-type': 'application/json',
        'X-ClientTraceId': crypto.randomUUID(),
      },
    });

    context.res.status = 200;
    context.res.body = {
      translatedText: response.data[0].translations[0].text,
      detectedLanguage: response.data[0].detectedLanguage,
    };
  } catch (error) {
    context.log.error('Translation error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
};
```

#### Step 2: Install Dependencies

```bash
cd azure-functions
npm install axios
```

#### Step 3: Client-Side Implementation

For **client-side translation** of dynamic content (search results, etc.), use the Azure Function:

```javascript
async function translateText(text, targetLang) {
  try {
    const response = await fetch('https://your-function-app.azurewebsites.net/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });

    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Fallback to original text
  }
}

// Example usage
const translatedTitle = await translateText('Free Food Programs', 'es');
// Returns: "Programas de Alimentos Gratis"
```

---

## 🌐 Option 3: Azure Static Web Apps with Localization

For **true multi-language support**, use Azure Static Web Apps with pre-translated content.

### Folder Structure

```
baynavigator/
├── en/
│   ├── index.html
│   └── programs.html
├── es/
│   ├── index.html
│   └── programs.html
├── zh-Hans/
│   ├── index.html
│   └── programs.html
└── ...
```

### Jekyll Configuration

```yaml
# _config.yml
languages: ['en', 'es', 'zh-Hans', 'tl', 'vi', 'ko', 'ru', 'ar', 'fa', 'ja', 'fr', 'hi']
default_lang: 'en'
exclude_from_localization: ['images', 'css', 'js']
```

### Routing in Azure Static Web Apps

```json
{
  "routes": [
    {
      "route": "/es/*",
      "rewrite": "/es/index.html"
    },
    {
      "route": "/zh-Hans/*",
      "rewrite": "/zh-Hans/index.html"
    }
  ]
}
```

---

## 💰 Cost Comparison

| Solution                                   | Free Tier      | Cost After Free Tier |
| ------------------------------------------ | -------------- | -------------------- |
| **Google Translate URL Proxy**             | Unlimited      | Free forever         |
| **Azure AI Translator**                    | 2M chars/month | $10 per 1M chars     |
| **Azure Static Web Apps (pre-translated)** | Included       | Storage + bandwidth  |

---

## 📊 Feature Comparison

| Feature                       | Current (URL Proxy) | Azure AI Translator | Pre-translated Static  |
| ----------------------------- | ------------------- | ------------------- | ---------------------- |
| **Implementation Complexity** | ✅ Very Simple      | ⚠️ Moderate         | ❌ Complex             |
| **Translation Quality**       | ✅ Excellent        | ✅ Excellent        | ✅ Perfect (human)     |
| **SEO Friendly**              | ⚠️ Limited          | ⚠️ Limited          | ✅ Excellent           |
| **Offline Support**           | ❌ No               | ❌ No               | ✅ Yes (with PWA)      |
| **Real-time Updates**         | ✅ Instant          | ✅ Instant          | ❌ Requires rebuild    |
| **Cost**                      | ✅ Free             | ⚠️ Usage-based      | ✅ Free (storage only) |
| **Customization**             | ⚠️ Limited          | ✅ Full control     | ✅ Full control        |

---

## 🎯 Recommendation

**For Bay Navigator, stick with the current solution** because:

1. **Free forever** - No API costs
2. **Zero maintenance** - No API keys to manage
3. **Excellent quality** - Google Translate is very accurate
4. **Simple implementation** - Just a modal with language selection
5. **Fast for users** - Redirects to cached translated pages

**Consider Azure AI Translator if:**

- You need to translate user-generated content (comments, reviews)
- You want to translate dynamic search results in real-time
- You need offline translation capability
- You want to customize translation memory or glossaries

**Consider pre-translated static pages if:**

- You want perfect SEO for multilingual content
- You have budget for professional translation services
- You need to comply with specific accessibility requirements per language
- You want the fastest possible page loads

---

## 🔐 Security Notes

If you do use Azure AI Translator:

1. **Never expose API keys in client-side code**
2. **Always use Azure Functions** as a proxy
3. **Implement rate limiting** to prevent abuse
4. **Use Azure Key Vault** for API key storage
5. **Monitor usage** in Azure Portal to avoid unexpected costs

```javascript
// ❌ NEVER DO THIS (exposes API key)
fetch('https://api.cognitive.microsofttranslator.com/translate', {
  headers: { 'Ocp-Apim-Subscription-Key': 'your-key-here' },
});

// ✅ ALWAYS DO THIS (proxy through Azure Function)
fetch('https://your-function-app.azurewebsites.net/api/translate', {
  method: 'POST',
  body: JSON.stringify({ text: 'Hello', targetLang: 'es' }),
});
```

---

## 📚 Resources

- [Azure AI Translator Documentation](https://learn.microsoft.com/azure/ai-services/translator/)
- [Azure Static Web Apps Localization](https://learn.microsoft.com/azure/static-web-apps/localization)
- [Google Translate API](https://cloud.google.com/translate/docs)
- [Jekyll Multilingual Plugin](https://github.com/kurtsson/jekyll-multiple-languages-plugin)

---

## 🆘 Need Help?

1. **Check Azure Function logs** in Azure Portal → Function App → Monitor → Logs
2. **Test the translate endpoint** with curl:
   ```bash
   curl https://your-function-app.azurewebsites.net/api/translate \
     -H "Content-Type: application/json" \
     -d '{"text":"Hello","targetLang":"es"}'
   ```
3. **Open an issue** on GitHub with error details
