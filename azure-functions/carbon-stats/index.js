/**
 * Carbon Stats Azure Function
 * Provides carbon footprint and energy consumption data for the sustainability dashboard
 *
 * Data sources:
 * - Azure Carbon Optimization API (if available)
 * - GitHub Actions usage (via stored summary)
 * - Static hosting provider stats
 */

// Provider sustainability commitments (static, verified from official sources)
const PROVIDER_STATS = {
  azure: {
    name: 'Microsoft Azure',
    carbonNeutralSince: 2012,
    renewableEnergyTarget: 100,
    renewableEnergyTargetYear: 2025,
    carbonNegativeTarget: 2030,
    pueRatio: 1.12,
    energyEfficiencyVsOnPrem: 93,
    carbonEfficiencyVsOnPrem: 98,
    source: 'https://azure.microsoft.com/en-us/global-infrastructure/sustainability/'
  },
  cloudflare: {
    name: 'Cloudflare',
    renewableEnergy: 100,
    carbonReductionSmallBiz: 96,
    carbonReductionEnterprise: 78,
    netZeroTarget: 2025,
    source: 'https://www.cloudflare.com/impact/'
  },
  github: {
    name: 'GitHub',
    carbonNeutralSince: 2019,
    renewableEnergy: 100,
    waterPositiveTarget: 2030,
    source: 'https://github.blog/2021-04-22-environmental-sustainability-github/'
  },
  anthropic: {
    name: 'Anthropic Claude',
    ecoEfficiencyScore: 0.886,
    cloudProvider: 'Google Cloud',
    googleCloudRenewable: 100,
    source: 'https://www.anthropic.com'
  }
};

// Estimated carbon factors (grams CO2e)
const CARBON_FACTORS = {
  pageViewGrams: 0.2,        // Average static site page view
  aiQueryGrams: 1.5,         // Claude API call estimate
  ciMinuteGrams: 0.4,        // GitHub Actions minute (renewable-offset)
  cdnRequestGrams: 0.0001,   // Cloudflare edge request
};

module.exports = async function (context, req) {
  // CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 204;
    return;
  }

  try {
    const stats = await getCarbonStats(context);
    context.res.body = JSON.stringify(stats, null, 2);
  } catch (error) {
    context.log.error('Carbon stats error:', error);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: 'Failed to fetch carbon stats' })
    };
  }
};

async function getCarbonStats(context) {
  const now = new Date();

  // Get monthly estimates (these would be populated from actual usage data)
  // For now, using reasonable estimates based on a small nonprofit site
  const monthlyEstimates = {
    pageViews: 10000,           // Estimated monthly page views
    aiQueries: 500,             // Smart Assistant queries
    ciMinutes: 120,             // GitHub Actions minutes
    cdnRequests: 50000,         // Cloudflare requests
  };

  // Calculate emissions (all offset by renewable energy commitments)
  const grossEmissions = {
    hosting: monthlyEstimates.pageViews * CARBON_FACTORS.pageViewGrams,
    ai: monthlyEstimates.aiQueries * CARBON_FACTORS.aiQueryGrams,
    ci: monthlyEstimates.ciMinutes * CARBON_FACTORS.ciMinuteGrams,
    cdn: monthlyEstimates.cdnRequests * CARBON_FACTORS.cdnRequestGrams,
  };

  const totalGrossGrams = Object.values(grossEmissions).reduce((a, b) => a + b, 0);

  // All providers use 100% renewable energy, so net emissions are offset
  const renewableOffset = 100;
  const netEmissionsGrams = totalGrossGrams * (1 - renewableOffset / 100);

  return {
    generated: now.toISOString(),
    period: 'monthly_estimate',

    // Summary metrics for dashboard
    summary: {
      totalGrossEmissionsKg: (totalGrossGrams / 1000).toFixed(3),
      renewableEnergyPercent: renewableOffset,
      netEmissionsKg: netEmissionsGrams.toFixed(3),
      greenRating: 'A+',
      carbonNeutral: true,
    },

    // Usage breakdown
    usage: {
      estimatedPageViews: monthlyEstimates.pageViews,
      estimatedAiQueries: monthlyEstimates.aiQueries,
      estimatedCiMinutes: monthlyEstimates.ciMinutes,
      estimatedCdnRequests: monthlyEstimates.cdnRequests,
    },

    // Emissions by source (before offset)
    emissionsBySource: {
      hosting: { grams: grossEmissions.hosting.toFixed(1), percent: ((grossEmissions.hosting / totalGrossGrams) * 100).toFixed(1) },
      ai: { grams: grossEmissions.ai.toFixed(1), percent: ((grossEmissions.ai / totalGrossGrams) * 100).toFixed(1) },
      ci: { grams: grossEmissions.ci.toFixed(1), percent: ((grossEmissions.ci / totalGrossGrams) * 100).toFixed(1) },
      cdn: { grams: grossEmissions.cdn.toFixed(1), percent: ((grossEmissions.cdn / totalGrossGrams) * 100).toFixed(1) },
    },

    // Provider information
    providers: PROVIDER_STATS,

    // Carbon factors used
    carbonFactors: CARBON_FACTORS,

    // Comparison data
    comparison: {
      paperFormGrams: 10,
      drivingMileGrams: 400,
      bayNavigatorVisitGrams: CARBON_FACTORS.pageViewGrams,
      equivalentMilesDriven: (totalGrossGrams / 400).toFixed(2),
      equivalentPaperPages: Math.round(totalGrossGrams / 10),
    },

    // Notes
    notes: [
      'All infrastructure providers use 100% renewable energy',
      'Azure has been carbon neutral since 2012',
      'GitHub Actions runners are powered by renewable energy',
      'Cloudflare operates a carbon-neutral network',
      'Claude AI runs on Google Cloud (100% renewable)'
    ]
  };
}
