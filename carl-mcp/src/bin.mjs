#!/usr/bin/env node
/**
 * stdio entry point — `npx -y @baytides/carl-mcp`.
 *
 * stdout is the MCP wire protocol, so every diagnostic MUST go to stderr.
 * A stray console.log here corrupts the session and the host silently drops it.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createCarlServer, warmUp, SERVER_VERSION } from './server.mjs';

const verbose = process.argv.includes('--verbose') || process.env.CARL_VERBOSE === '1';
const log = (msg) => {
  if (verbose) process.stderr.write(`[carl] ${msg}\n`);
};

async function main() {
  if (process.argv.includes('--version')) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return;
  }

  const server = createCarlServer({ log });
  const transport = new StdioServerTransport();

  // Connect before warming: the host gets a responsive server immediately and
  // the ~6s corpus build overlaps with the client's own initialization.
  await server.connect(transport);
  log(`carl-mcp ${SERVER_VERSION} connected over stdio`);
  warmUp({ log });

  const shutdown = async () => {
    try {
      await server.close();
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  process.stderr.write(`[carl] fatal: ${err.stack || err.message}\n`);
  process.exit(1);
});
