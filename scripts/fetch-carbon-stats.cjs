/**
 * Fetch Carbon Stats Script
 * Runs daily via GitHub Actions to update public/data/carbon-stats.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Carbon factors (grams CO2e)
const CARBON_FACTORS = {
  pageViewGrams: 0.2,
  aiQueryGrams: 1.5,
  ciMinuteGrams: 0.4,
  cdnRequestGrams: 0.0001,
};

// Provider stats
const PROVIDER_STATS = {
  azure: {
    name: 'Microsoft Azure',
    carbonNeutralSince: 2012,
    renewableEnergy: 100,
    renewableEnergySince: 2025,
    carbonNegativeTarget: 2030,
  },
  cloudflare: {
    name: 'Cloudflare',
    renewableEnergy: 100,
    netZeroSince: 2025,
  },
  github: {
    name: 'GitHub',
    carbonNeutralSince: 2019,
    renewableEnergy: 100,
  },
  azureVM: {
    name: 'Azure Virtual Machine',
    renewableEnergy: 100,
    carbonNeutralSince: 2012,
    note: 'Powers Carl AI Chat (Ollama/Llama 3.1 8B)',
  },
  azureOpenAI: {
    name: 'Azure OpenAI',
    model: 'GPT-4o-mini',
    carbonNeutral: true,
    note: 'Used only for Simple Language accessibility feature',
  },
};

async function getCloudflareStats() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;

  if (!token || !zoneId) {
    console.log('Cloudflare credentials not configured');
    return null;
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

    const query = `{
      viewer {
        zones(filter: {zoneTag: "${zoneId}"}) {
          httpRequests1dGroups(limit: 30, filter: {date_gt: "${dateFilter}"}) {
            sum {
              requests
              bytes
              cachedRequests
              cachedBytes
            }
            dimensions {
              date
            }
          }
        }
      }
    }`;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('Cloudflare API error:', data.errors);
      return null;
    }

    const groups = data.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

    const totals = groups.reduce(
      (acc, day) => ({
        requests: acc.requests + (day.sum?.requests || 0),
        bytes: acc.bytes + (day.sum?.bytes || 0),
        cachedRequests: acc.cachedRequests + (day.sum?.cachedRequests || 0),
      }),
      { requests: 0, bytes: 0, cachedRequests: 0 }
    );

    return {
      requests: totals.requests,
      bytesTransferred: totals.bytes,
      cachedRequests: totals.cachedRequests,
      cacheHitRate:
        totals.requests > 0 ? ((totals.cachedRequests / totals.requests) * 100).toFixed(1) : '0',
      daysIncluded: groups.length,
      source: 'cloudflare_api',
    };
  } catch (error) {
    console.error('Cloudflare fetch error:', error.message);
    return null;
  }
}

async function getGitHubStats() {
  try {
    const response = await fetch(
      'https://api.github.com/repos/baytides/baynavigator/actions/runs?per_page=100',
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.log('GitHub API error:', response.status);
      return null;
    }

    const data = await response.json();
    const runs = data.workflow_runs || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRuns = runs.filter((run) => new Date(run.created_at) > thirtyDaysAgo);

    const workflowCounts = {};
    recentRuns.forEach((run) => {
      workflowCounts[run.name] = (workflowCounts[run.name] || 0) + 1;
    });

    const estimatedMinutes = recentRuns.length * 2;

    return {
      totalRuns: recentRuns.length,
      workflowBreakdown: workflowCounts,
      estimatedMinutes,
      successfulRuns: recentRuns.filter((r) => r.conclusion === 'success').length,
      source: 'github_api',
    };
  } catch (error) {
    console.error('GitHub fetch error:', error.message);
    return null;
  }
}

async function getOllamaStats() {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 10000);
    const response = await fetch('https://ai.baytides.org/stats', {
      signal: controller.signal,
    });
    if (!response.ok) {
      console.log('Ollama stats API error:', response.status);
      return null;
    }
    const data = await response.json();
    return {
      totalChats: data.totalChats || 0,
      chatsToday: data.chatsToday || 0,
      chatsThisMonth: data.chatsThisMonth || 0,
      model: data.model || 'qwen2.5:3b-instruct',
      provider: data.provider || 'Azure VM',
      source: 'ollama_stats_api',
    };
  } catch (error) {
    console.error('Ollama stats fetch error:', error.message);
    return null;
  }
}

async function getAzureStats() {
  // Check if Azure CLI is available and logged in
  try {
    execSync('az account show', { stdio: 'pipe' });
  } catch {
    console.log('Azure CLI not available or not logged in');
    return null;
  }

  const subscriptionId = '7848d90a-1826-43f6-a54e-090c2d18946f';
  const openAiResourceGroup = 'baytides-discounts-rg';
  const openAiAccount = 'baynavigator-openai';
  const functionAppResourceGroup = 'baytides-rg';
  const functionApp = 'baytides-integrity';

  // Calculate date range (last 30 days)
  const endTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startTime = startDate.toISOString().split('T')[0] + 'T00:00:00Z';

  try {
    // Get Azure OpenAI request count
    const openAiResourceId = `/subscriptions/${subscriptionId}/resourceGroups/${openAiResourceGroup}/providers/Microsoft.CognitiveServices/accounts/${openAiAccount}`;
    const openAiCmd = `az monitor metrics list --resource "${openAiResourceId}" --metric "TotalCalls" --interval P1D --aggregation Total --start-time ${startTime} --end-time ${endTime} -o json`;

    let aiRequests = 0;
    try {
      const openAiResult = JSON.parse(execSync(openAiCmd, { stdio: 'pipe' }).toString());
      const timeseries = openAiResult?.value?.[0]?.timeseries?.[0]?.data || [];
      aiRequests = timeseries.reduce((sum, d) => sum + (d.total || 0), 0);
    } catch (err) {
      console.error('Failed to fetch OpenAI metrics:', err.message);
    }

    // Get Function App execution count
    const functionAppResourceId = `/subscriptions/${subscriptionId}/resourceGroups/${functionAppResourceGroup}/providers/Microsoft.Web/sites/${functionApp}`;
    const functionCmd = `az monitor metrics list --resource "${functionAppResourceId}" --metric "FunctionExecutionCount" --interval P1D --aggregation Total --start-time ${startTime} --end-time ${endTime} -o json`;

    let functionExecutions = 0;
    try {
      const functionResult = JSON.parse(execSync(functionCmd, { stdio: 'pipe' }).toString());
      const timeseries = functionResult?.value?.[0]?.timeseries?.[0]?.data || [];
      functionExecutions = timeseries.reduce((sum, d) => sum + (d.total || 0), 0);
    } catch (err) {
      console.error('Failed to fetch Function App metrics:', err.message);
    }

    return {
      aiRequests: Math.round(aiRequests),
      functionExecutions: Math.round(functionExecutions),
      source: 'azure_monitor',
    };
  } catch (error) {
    console.error('Azure fetch error:', error.message);
    return null;
  }
}

async function main() {
  console.log('Fetching carbon stats...');

  const [cloudflareStats, githubStats, azureStats, ollamaStats] = await Promise.all([
    getCloudflareStats(),
    getGitHubStats(),
    getAzureStats(),
    getOllamaStats(),
  ]);

  // Use real data where available, fall back to null (no estimates)
  const usage = {
    cdnRequests: cloudflareStats?.requests ?? null,
    cdnBytesTransferred: cloudflareStats?.bytesTransferred ?? null,
    cdnCacheHitRate: cloudflareStats?.cacheHitRate ?? null,
    aiQueries: azureStats?.aiRequests ?? null,
    aiChatQueries: ollamaStats?.chatsThisMonth ?? null,
    functionExecutions: azureStats?.functionExecutions ?? null,
    ciRuns: githubStats?.totalRuns ?? null,
    ciMinutes: githubStats?.estimatedMinutes ?? null,
    ciWorkflows: githubStats?.workflowBreakdown ?? null,
  };

  const dataSources = {
    cloudflare: cloudflareStats ? 'live' : 'unavailable',
    github: githubStats ? 'live' : 'unavailable',
    azure: azureStats ? 'live' : 'unavailable',
    ollama: ollamaStats ? 'live' : 'unavailable',
  };

  // Calculate emissions (use 0 if data unavailable)
  // Note: AI Chat uses self-hosted Llama 3.1 8B on Azure VM's renewable-powered servers
  const AI_CHAT_QUERY_GRAMS = 0.8; // Llama 3.1 8B on renewable energy
  const grossEmissions = {
    cdn: (usage.cdnRequests || 0) * CARBON_FACTORS.cdnRequestGrams,
    ai: (usage.aiQueries || 0) * CARBON_FACTORS.aiQueryGrams,
    aiChat: (usage.aiChatQueries || 0) * AI_CHAT_QUERY_GRAMS,
    ci: (usage.ciMinutes || 0) * CARBON_FACTORS.ciMinuteGrams,
  };

  const totalGrossGrams = Object.values(grossEmissions).reduce((a, b) => a + b, 0);
  const renewableOffset = 100;
  const netEmissionsGrams = totalGrossGrams * (1 - renewableOffset / 100);

  const stats = {
    generated: new Date().toISOString(),
    period: 'last_30_days',
    dataFreshness: dataSources,

    summary: {
      totalGrossEmissionsKg: (totalGrossGrams / 1000).toFixed(3),
      renewableEnergyPercent: renewableOffset,
      netEmissionsKg: netEmissionsGrams.toFixed(3),
      greenRating: 'A+',
      carbonNeutral: true,
    },

    usage,

    emissionsBySource: {
      cdn: {
        grams: grossEmissions.cdn.toFixed(1),
        percent:
          totalGrossGrams > 0 ? ((grossEmissions.cdn / totalGrossGrams) * 100).toFixed(1) : '0',
      },
      ai: {
        grams: grossEmissions.ai.toFixed(1),
        percent:
          totalGrossGrams > 0 ? ((grossEmissions.ai / totalGrossGrams) * 100).toFixed(1) : '0',
        note: 'Azure OpenAI (Simple Language)',
      },
      aiChat: {
        grams: grossEmissions.aiChat.toFixed(1),
        percent:
          totalGrossGrams > 0 ? ((grossEmissions.aiChat / totalGrossGrams) * 100).toFixed(1) : '0',
        note: 'Bay Tides AI Chat (Ollama)',
      },
      ci: {
        grams: grossEmissions.ci.toFixed(1),
        percent:
          totalGrossGrams > 0 ? ((grossEmissions.ci / totalGrossGrams) * 100).toFixed(1) : '0',
      },
    },

    providers: PROVIDER_STATS,
    carbonFactors: CARBON_FACTORS,

    comparison: {
      paperFormGrams: 10,
      drivingMileGrams: 400,
      equivalentMilesDriven: (totalGrossGrams / 400).toFixed(2),
      equivalentPaperPages: Math.round(totalGrossGrams / 10),
    },

    notes: [
      'All infrastructure providers use 100% renewable energy',
      'Azure has been carbon neutral since 2012',
      'GitHub Actions runners are powered by renewable energy',
      'Cloudflare operates a carbon-neutral network',
      'Azure VM runs on 100% renewable energy infrastructure',
      'Bay Tides AI Chat logs are anonymized - no IP addresses stored',
      'Usage data is updated daily via GitHub Actions',
    ],
  };

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write stats file
  const outputPath = path.join(outputDir, 'carbon-stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2));

  console.log('Carbon stats updated successfully!');
  console.log(`- Cloudflare: ${dataSources.cloudflare} (${usage.cdnRequests ?? 'N/A'} requests)`);
  console.log(`- GitHub: ${dataSources.github} (${usage.ciRuns ?? 'N/A'} runs)`);
  console.log(
    `- Azure: ${dataSources.azure} (${usage.aiQueries ?? 'N/A'} Simple Language queries, ${usage.functionExecutions ?? 'N/A'} function executions)`
  );
  console.log(`- Ollama: ${dataSources.ollama} (${usage.aiChatQueries ?? 'N/A'} AI Chat queries)`);
  console.log(`- Total gross emissions: ${stats.summary.totalGrossEmissionsKg} kg CO₂e`);
}

main().catch(console.error);
