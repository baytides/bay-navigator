/**
 * Carl over Streamable HTTP — the remote transport.
 *
 * WHY BOTH TRANSPORTS: stdio (`npx @baytides/carl-mcp`) covers desktop clients
 * that spawn a local process — Claude Desktop, Claude Code, Cursor, Zed, VS
 * Code. Web clients like ChatGPT can only reach a URL, so they need this.
 *
 * STATELESS BY DESIGN: a Functions consumption plan scales across instances
 * with no request affinity, so a session created on instance A would 404 on
 * instance B. Omitting `sessionIdGenerator` puts the transport in stateless
 * mode — a fresh server per request, no cross-request state. Carl is read-only,
 * so there is nothing to keep anyway.
 *
 * The corpus is the expensive part (~6s to build). It is cached on the
 * instance's local disk and in module scope, so only the first request after a
 * cold start pays for it.
 */

import { app } from '@azure/functions';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createCarlServer, warmUp } from '@baytides/carl-mcp';

// Module scope survives between invocations on a warm instance.
warmUp({ log: (m) => console.log(`[carl] ${m}`) });

/** Hosts permitted in the Host header — blocks DNS-rebinding attacks. */
const ALLOWED_HOSTS = (process.env.CARL_ALLOWED_HOSTS || '')
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean);

async function handler(request, context) {
  const log = (m) => context.log(`[carl] ${m}`);

  // A fresh server+transport per request: required for stateless mode, and it
  // keeps one malformed request from poisoning later ones.
  const server = createCarlServer({ log });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true, // plain JSON replies; no SSE stream to keep open
    ...(ALLOWED_HOSTS.length
      ? { enableDnsRebindingProtection: true, allowedHosts: ALLOWED_HOSTS }
      : {}),
  });

  try {
    await server.connect(transport);
    return await transport.handleRequest(request.request ?? request);
  } catch (err) {
    log(`request failed: ${err.stack || err.message}`);
    return {
      status: 500,
      jsonBody: {
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      },
    };
  } finally {
    // Stateless: nothing should outlive the response.
    await transport.close().catch(() => {});
    await server.close().catch(() => {});
  }
}

app.http('mcp', {
  route: 'mcp',
  methods: ['GET', 'POST', 'DELETE'],
  authLevel: 'anonymous', // public civic data; no secrets behind this
  handler,
});

/** Liveness probe that also reports whether the corpus is warm. */
app.http('health', {
  route: 'health',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async () => {
    const { getCorpus } = await import('@baytides/carl-mcp/corpus');
    try {
      const db = await getCorpus();
      const { count } = db.prepare('SELECT COUNT(*) AS count FROM resources').get();
      return { jsonBody: { ok: true, records: count } };
    } catch (err) {
      return { status: 503, jsonBody: { ok: false, error: err.message } };
    }
  },
});
