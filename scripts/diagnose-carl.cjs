#!/usr/bin/env node
/**
 * Carl Performance Diagnostics for Bay Navigator
 *
 * Tests Carl (Ollama) server performance and identifies bottlenecks.
 *
 * Usage:
 *   node scripts/diagnose-carl.cjs
 *
 * Environment variables:
 *   CARL_API_KEY  - API key for Carl (ai.baytides.org)
 */

const CARL_ENDPOINT = process.env.CARL_ENDPOINT || 'https://ai.baytides.org/api/chat';
const CARL_API_KEY = process.env.CARL_API_KEY || process.env.PUBLIC_OLLAMA_API_KEY || '';
const TAGS_ENDPOINT = CARL_ENDPOINT.replace('/api/chat', '/api/tags');

// ============================================================================
// TEST HELPERS
// ============================================================================

async function callCarl(prompt, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 60000);

  const start = Date.now();

  try {
    const response = await fetch(CARL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CARL_API_KEY,
      },
      body: JSON.stringify({
        model: options.model || 'qwen2.5:3b-instruct',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: options.maxTokens || 100,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.message?.content || data.response || '';

    return {
      success: true,
      latency,
      content,
      tokens: content.split(/\s+/).length,
    };
  } catch (error) {
    clearTimeout(timeout);
    return {
      success: false,
      latency: Date.now() - start,
      error: error.message,
    };
  }
}

async function getModelInfo() {
  try {
    const response = await fetch(TAGS_ENDPOINT, {
      headers: { 'X-API-Key': CARL_API_KEY },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function formatMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// DIAGNOSTIC TESTS
// ============================================================================

async function runDiagnostics() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          Carl (Ollama) Performance Diagnostics             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Endpoint: ${CARL_ENDPOINT}`);
  console.log(`API Key:  ${CARL_API_KEY ? '***' + CARL_API_KEY.slice(-4) : '(not set)'}\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // Test 1: Model Info
  // ─────────────────────────────────────────────────────────────────────────
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ 1. Model Information                                       │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const modelInfo = await getModelInfo();
  if (modelInfo && modelInfo.models) {
    console.log('Loaded models:\n');
    for (const model of modelInfo.models) {
      console.log(`  📦 ${model.name}`);
      console.log(`     Size: ${formatBytes(model.size)}`);
      console.log(`     Modified: ${new Date(model.modified_at).toLocaleDateString()}`);
      if (model.details) {
        console.log(`     Family: ${model.details.family || 'unknown'}`);
        console.log(`     Parameters: ${model.details.parameter_size || 'unknown'}`);
        console.log(`     Quantization: ${model.details.quantization_level || 'unknown'}`);
      }
      console.log();
    }
  } else {
    console.log('  ⚠️  Could not fetch model info (API key required?)\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 2: Cold Start Latency
  // ─────────────────────────────────────────────────────────────────────────
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ 2. Cold Start Latency (first request)                      │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('  Sending first request...');
  const coldStart = await callCarl('Say "hello"', { maxTokens: 10 });

  if (coldStart.success) {
    console.log(`  ✓ Response: "${coldStart.content.slice(0, 50)}..."`);
    console.log(`  ⏱️  Latency: ${formatMs(coldStart.latency)}`);

    if (coldStart.latency > 10000) {
      console.log('  ⚠️  HIGH: Model may be loading from disk (cold start)\n');
    } else if (coldStart.latency > 3000) {
      console.log('  ⚡ MODERATE: Consider keeping model warm\n');
    } else {
      console.log('  ✅ GOOD: Model appears to be loaded in memory\n');
    }
  } else {
    console.log(`  ❌ Failed: ${coldStart.error}\n`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 3: Warm Latency (repeated requests)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ 3. Warm Latency (5 sequential requests)                    │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const warmLatencies = [];
  for (let i = 1; i <= 5; i++) {
    process.stdout.write(`  Request ${i}/5...`);
    const result = await callCarl(`Count to ${i}`, { maxTokens: 20 });
    if (result.success) {
      warmLatencies.push(result.latency);
      console.log(` ${formatMs(result.latency)}`);
    } else {
      console.log(` ❌ ${result.error}`);
    }
  }

  if (warmLatencies.length > 0) {
    const avg = warmLatencies.reduce((a, b) => a + b, 0) / warmLatencies.length;
    const min = Math.min(...warmLatencies);
    const max = Math.max(...warmLatencies);

    console.log(`\n  📊 Statistics:`);
    console.log(`     Average: ${formatMs(avg)}`);
    console.log(`     Min:     ${formatMs(min)}`);
    console.log(`     Max:     ${formatMs(max)}`);

    if (avg > 5000) {
      console.log('  ⚠️  SLOW: Consider upgrading CPU or using smaller model\n');
    } else if (avg > 2000) {
      console.log('  ⚡ MODERATE: Acceptable for most use cases\n');
    } else {
      console.log('  ✅ FAST: Good performance\n');
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 4: Concurrent Requests
  // ─────────────────────────────────────────────────────────────────────────
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ 4. Concurrent Requests (3 parallel)                        │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  console.log('  Sending 3 requests in parallel...');
  const concurrentStart = Date.now();

  const concurrentResults = await Promise.all([
    callCarl('What is 1+1?', { maxTokens: 10 }),
    callCarl('What is 2+2?', { maxTokens: 10 }),
    callCarl('What is 3+3?', { maxTokens: 10 }),
  ]);

  const concurrentTotal = Date.now() - concurrentStart;
  const concurrentSuccess = concurrentResults.filter((r) => r.success).length;
  const concurrentAvg =
    concurrentResults.filter((r) => r.success).reduce((sum, r) => sum + r.latency, 0) /
    concurrentSuccess;

  console.log(`  ✓ Completed: ${concurrentSuccess}/3 successful`);
  console.log(`  ⏱️  Total wall time: ${formatMs(concurrentTotal)}`);
  console.log(`  ⏱️  Average per request: ${formatMs(concurrentAvg)}`);

  const parallelism = concurrentAvg / concurrentTotal;
  if (parallelism > 0.8) {
    console.log('  ⚠️  QUEUED: Requests appear to be processed sequentially');
    console.log('     Consider: OLLAMA_NUM_PARALLEL=4 or upgrade CPU\n');
  } else {
    console.log(`  ✅ PARALLEL: ~${(1 / parallelism).toFixed(1)}x parallelism achieved\n`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Test 5: Long Context Test
  // ─────────────────────────────────────────────────────────────────────────
  console.log('┌────────────────────────────────────────────────────────────┐');
  console.log('│ 5. Long Context Test (500 token prompt)                    │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const longPrompt = `
Here is a detailed description of a social services program:

The Community Food Bank provides free groceries to families in need throughout the Bay Area.
Services include weekly food distributions, emergency food boxes, senior meal programs,
and nutrition education classes. Eligibility is based on household income and family size.
To apply, visit one of our 15 distribution centers with proof of residence and ID.
We serve over 50,000 families each month and partner with local schools, churches, and
community centers. Our mobile pantry visits underserved neighborhoods every Tuesday and
Thursday. Additional services include CalFresh enrollment assistance, cooking demonstrations,
and referrals to other social services. We accept donations of non-perishable food items
and monetary contributions. Volunteer opportunities are available for sorting, packing,
and distributing food. Our mission is to end hunger in the Bay Area by providing healthy
food and building community connections.

Summarize this program in one sentence.
`.trim();

  console.log(`  Prompt: ${longPrompt.split(/\s+/).length} words`);
  console.log('  Sending request...');

  const longResult = await callCarl(longPrompt, { maxTokens: 50 });

  if (longResult.success) {
    console.log(`  ✓ Response: "${longResult.content.slice(0, 80)}..."`);
    console.log(`  ⏱️  Latency: ${formatMs(longResult.latency)}`);

    const tokensPerSecond =
      (longPrompt.split(/\s+/).length + longResult.tokens) / (longResult.latency / 1000);
    console.log(`  📈 Throughput: ~${tokensPerSecond.toFixed(0)} tokens/sec\n`);
  } else {
    console.log(`  ❌ Failed: ${longResult.error}\n`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                        Summary                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const issues = [];
  const recommendations = [];

  if (coldStart.latency > 10000) {
    issues.push('High cold start latency (model loading from disk)');
    recommendations.push('Add a warmup request on server start');
  }

  if (warmLatencies.length > 0) {
    const avg = warmLatencies.reduce((a, b) => a + b, 0) / warmLatencies.length;
    if (avg > 5000) {
      issues.push('Slow response times');
      recommendations.push('Upgrade to more vCPUs (8+) or use GPU');
      recommendations.push('Consider smaller model (q4_K_M instead of q8_0)');
    }
  }

  if (parallelism > 0.8) {
    issues.push('Limited parallelism');
    recommendations.push('Set OLLAMA_NUM_PARALLEL=4 in server config');
  }

  if (issues.length === 0) {
    console.log('  ✅ No significant issues detected!\n');
  } else {
    console.log('  ⚠️  Issues detected:\n');
    issues.forEach((issue) => console.log(`     - ${issue}`));
    console.log('\n  💡 Recommendations:\n');
    recommendations.forEach((rec) => console.log(`     - ${rec}`));
  }

  console.log('\n  For more detailed server metrics, SSH into the droplet and run:');
  console.log('    htop                    # Check CPU/memory usage');
  console.log('    ollama ps               # Check loaded models');
  console.log('    journalctl -u ollama    # Check server logs\n');
}

// ============================================================================
// MAIN
// ============================================================================

runDiagnostics().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
