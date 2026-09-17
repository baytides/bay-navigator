#!/usr/bin/env node
/**
 * Self-hostable Streamable HTTP transport — `node src/http-server.mjs`.
 *
 * The same MCP server as stdio, reachable over a URL. Use this for Docker, a
 * VM, or any host that is not Azure Functions (which has its own thin wrapper
 * in http/src/functions/mcp.mjs).
 *
 * Stateless, like the Functions build: a fresh server per request, so the
 * process can sit behind any load balancer without session affinity. Carl is
 * read-only, so there is no state worth keeping between calls.
 */

import http from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createCarlServer, warmUp } from './server.mjs';
import { getCorpus } from './corpus.mjs';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const MCP_PATH = process.env.CARL_MCP_PATH || '/mcp';
const MAX_BODY_BYTES = 1024 * 1024; // generous for JSON-RPC; blocks memory abuse

const log = (msg) => process.stderr.write(`[carl] ${msg}\n`);

/** Read and parse a JSON body, rejecting oversized payloads. */
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

const jsonRpcError = (res, status, code, message) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }));
};

export function createHttpServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/health') {
      try {
        const db = await getCorpus();
        const { count } = db.prepare('SELECT COUNT(*) AS count FROM resources').get();
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, records: count }));
      } catch (err) {
        res.writeHead(503, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
      return;
    }

    if (url.pathname !== MCP_PATH) {
      jsonRpcError(res, 404, -32601, `Not found. MCP endpoint is ${MCP_PATH}`);
      return;
    }

    const server = createCarlServer({ log });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true,
    });

    try {
      const body = req.method === 'POST' ? await readJsonBody(req) : undefined;
      await server.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (err) {
      log(`request failed: ${err.stack || err.message}`);
      if (!res.headersSent) jsonRpcError(res, 400, -32700, err.message);
      else res.end();
    } finally {
      await transport.close().catch(() => {});
      await server.close().catch(() => {});
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  warmUp({ log });
  const server = createHttpServer();
  server.listen(PORT, HOST, () => log(`carl-mcp listening on http://${HOST}:${PORT}${MCP_PATH}`));
  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => server.close(() => process.exit(0)));
  }
}
