/**
 * Knowledge Pack builder — the shared on-device retrieval foundation.
 *
 * Produces a SQLite/FTS5 corpus + manifest that the apps bundle and query
 * locally, so the AI assistant can do retrieval without the network. The
 * `searchCorpus()` signature here is the RETRIEVAL CONTRACT that the Swift and
 * Dart local-retrieval layers mirror.
 *
 * Pure functions only (no CLI side effects) so they are unit-testable. The CLI
 * wrapper lives in scripts/generate/generate-knowledge-pack.cjs.
 *
 * Retrieval design (matches the existing remote Typesense/Fuse contract):
 *   - search fields, in priority order: name > keywords > description
 *   - category filtering
 *   - lexical FTS5 only (no typo tolerance); the on-device intent-parse LLM
 *     step corrects spelling and expands keywords before search runs.
 */

'use strict';

function normalizeResources() {
  throw new Error('not implemented');
}

function buildDatabase() {
  throw new Error('not implemented');
}

function searchCorpus() {
  throw new Error('not implemented');
}

function buildManifest() {
  throw new Error('not implemented');
}

module.exports = {
  normalizeResources,
  buildDatabase,
  searchCorpus,
  buildManifest,
};
