/**
 * baynavigator.org/mcp -> the Carl MCP Function App.
 *
 * WHY A WORKER RATHER THAN AN AZURE PLAN UPGRADE: baynavigator.org is already
 * fronted by Cloudflare, so every route on the domain passes through here no
 * matter what is behind it. Upgrading the Static Web App from Free to Standard
 * (~$9/mo) to use a linked backend would have paid Azure for routing that
 * Cloudflare is already doing for free — and the traffic would still have come
 * through Cloudflare afterwards.
 *
 * Streaming is the reason this proxies rather than redirects. MCP's Streamable
 * HTTP transport answers POST with either JSON or an SSE stream, and a redirect
 * would break session continuity while a buffering proxy would stall the
 * stream. `fetch` here returns the upstream Response with its body untouched,
 * so chunks pass straight through.
 */

const UPSTREAM = 'https://baynavigator-carl-mcp.azurewebsites.net';

/** MCP clients are servers, not browsers, but Claude.ai connectors are both. */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID',
  // Without this a browser client cannot read the session id it must echo back.
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // /mcp and anything beneath it; everything else is not ours to serve.
    if (!url.pathname.startsWith('/mcp')) {
      return new Response('Not found', { status: 404 });
    }

    const target = new URL(url.pathname + url.search, UPSTREAM);

    const headers = new Headers(request.headers);
    // Host must match the upstream or App Service routes to the wrong site.
    headers.delete('host');
    // Preserve the real client for the function's own logging.
    const clientIp = request.headers.get('CF-Connecting-IP');
    if (clientIp) headers.set('X-Forwarded-For', clientIp);
    headers.set('X-Forwarded-Host', url.host);
    headers.set('X-Forwarded-Proto', 'https');

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
        // Do not let the platform buffer an SSE stream while it waits for an end.
        redirect: 'manual',
      });
    } catch (err) {
      // Say which hop failed. A bare 502 here sends people hunting in the wrong
      // codebase, because the MCP server itself is fine.
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: `Bay Navigator MCP is unreachable at the origin (${err.message}). The proxy is healthy; the Function App is not responding.`,
          },
          id: null,
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } }
      );
    }

    const out = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(CORS)) out.set(k, v);
    // An SSE stream must not be buffered or transformed on the way back.
    if ((out.get('content-type') || '').includes('text/event-stream')) {
      out.set('Cache-Control', 'no-cache, no-transform');
      out.delete('content-length');
    }

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: out,
    });
  },
};
