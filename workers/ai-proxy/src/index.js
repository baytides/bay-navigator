/**
 * Bay Navigator AI Proxy Worker
 * Routes AI requests through Cloudflare Workers to add CORS headers.
 * - /api/chat  → ollama.baytides.org (Ollama native API, streaming)
 * - /v1/*      → ai.baytides.org (OpenAI-compatible API, intent parsing)
 * All other requests go to baynavigator.org
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
};

function corsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function proxyHeaders(request, targetHost) {
  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'origin') {
      headers.set(key, value);
    }
  }
  headers.set('Host', targetHost);
  return headers;
}

async function proxyRequest(request, targetUrl, targetHost) {
  const headers = proxyHeaders(request, targetHost);
  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    const isAiPath = url.pathname.startsWith('/api/chat') || url.pathname.startsWith('/api/tags');
    const isOpenAiPath = url.pathname.startsWith('/v1/');

    // CORS preflight for AI paths
    if (request.method === 'OPTIONS' && (isAiPath || isOpenAiPath)) {
      return corsResponse();
    }

    // /api/chat and /api/tags → Ollama native API (ollama.baytides.org)
    if (isAiPath) {
      const ollamaOrigin = env.OLLAMA_ORIGIN || env.AI_ORIGIN;
      const targetUrl = ollamaOrigin + url.pathname + url.search;
      return proxyRequest(request, targetUrl, new URL(ollamaOrigin).host);
    }

    // /v1/* → OpenAI-compatible API (ai.baytides.org)
    if (isOpenAiPath) {
      const targetUrl = env.AI_ORIGIN + url.pathname + url.search;
      return proxyRequest(request, targetUrl, new URL(env.AI_ORIGIN).host);
    }

    // All other requests go to main site
    const mainUrl = env.MAIN_ORIGIN + url.pathname + url.search;
    return proxyRequest(request, mainUrl, 'baynavigator.org');
  },
};
