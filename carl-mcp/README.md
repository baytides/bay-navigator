# Carl — Bay Navigator MCP server

Carl is Bay Navigator's Bay Area community-resource assistant. This package exposes
Carl as an [MCP](https://modelcontextprotocol.io) server, so **any** AI chatbot —
Claude, ChatGPT, Cursor, Zed, VS Code, a local model — can answer Bay Area questions
grounded in real, current data instead of guessing.

Carl brings the knowledge. The host chatbot brings the intelligence. There is no
model to run and no GPU to pay for.

## What Carl knows

| Source                 | Entries | Covers                                                                                                                                                       |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bay Navigator programs | ~820    | Food, housing, healthcare, legal aid, transit, utilities, childcare, seniors, veterans, immigration                                                          |
| California state code  | ~325    | Tenant rights, civil code sections people actually ask about                                                                                                 |
| Municipal ordinances   | ~2,700  | Full text for 8 cities — San Jose (686), Fremont (762), Daly City (406), Oakland (394), Mountain View (296), Redwood City (169), Richmond (20), Berkeley (5) |
| Museum free admission  | ~60     | Free days, resident pathways, library passes                                                                                                                 |
| Crisis lines           | live    | 988, 2-1-1, domestic safety, LGBTQ+ youth, county crisis teams                                                                                               |

All of it is public data from [baynavigator.org](https://baynavigator.org), rebuilt on
first use so Carl is never staler than the site.

## Install

### Claude Code

```bash
claude mcp add carl -- npx -y @baytides/carl-mcp
```

### Claude Desktop / Cursor / Windsurf

Add to your MCP config (`claude_desktop_config.json`, `.cursor/mcp.json`, …):

```json
{
  "mcpServers": {
    "carl": {
      "command": "npx",
      "args": ["-y", "@baytides/carl-mcp"]
    }
  }
}
```

### VS Code

```bash
code --add-mcp '{"name":"carl","command":"npx","args":["-y","@baytides/carl-mcp"]}'
```

### ChatGPT and other web clients

Web clients cannot spawn a local process — they need a URL. Point them at the hosted
endpoint as a custom connector:

```
https://baynavigator-carl-mcp.azurewebsites.net/mcp
```

No auth — it serves the same public data as the website. Health check:
[`/health`](https://baynavigator-carl-mcp.azurewebsites.net/health).

See [Self-hosting](#self-hosting) to run your own instead.

Requires Node 22.5+ (for built-in `node:sqlite`).

## Tools

| Tool                 | Use it for                                                             |
| -------------------- | ---------------------------------------------------------------------- |
| `search_resources`   | The main entry point. Any "what help exists for…" question.            |
| `get_resource`       | Full detail for one entry — eligibility, how to apply, phone, address. |
| `find_local_code`    | "Is X legal in \<city\>" — ordinance and state-law text.               |
| `list_filters`       | Valid category / county / city values, with counts.                    |
| `transit_directions` | Transit links plus a nudge toward fare assistance.                     |
| `get_emergency_help` | Verified crisis lines. Call this first if someone is unsafe.           |

Everything is read-only. Carl never writes anything.

### Try it

> "My hours got cut and I'm short on groceries in Oakland this week."

> "Can I keep chickens in my San Jose backyard?"

> "Which Bay Area museums are free for kids this month?"

## Design notes

**Grounded by construction.** Every result carries its source URL and a corpus `id`,
so the host model can cite and drill down rather than paraphrase from memory.

**A no-match is never silent.** An empty tool result invites the host model to fill the
silence, and a confidently invented food bank address sends someone to a locked door.
So Carl's no-match response says plainly that nothing was found and routes to 2-1-1.
See `src/guidance.mjs`.

**One retrieval contract, three implementations.** `scripts/generate/lib/knowledge-pack.cjs`
in the main repo defines `searchCorpus()` as the retrieval contract.
`LocalRetrievalService.swift` mirrors it on Apple devices; this package is the third
twin and _imports the builder verbatim_ rather than reimplementing it, so ranking is
identical across web, Apple, and MCP. `npm test` fails if the vendored copy drifts.

**One deliberate divergence.** The shared contract matches tokens with `OR` + prefix,
which is right where a typo-correcting LLM step runs _before_ search. An MCP host has
no such step, so `"zxqw nonexistent thing"` matched unrelated ordinances on the word
"thing". `src/corpus.mjs` adds a precision floor (`CARL_RELEVANCE_RATIO`, default 0.5)
as a post-filter, leaving contract ranking untouched. Set it to `0` to disable.

## Self-hosting

### Any Node host / Docker

```bash
npm install -g @baytides/carl-mcp
PORT=8080 node "$(npm root -g)/@baytides/carl-mcp/src/http-server.mjs"
```

Serves MCP at `/mcp` and a corpus health check at `/health`. Stateless, so it scales
horizontally without session affinity.

### Azure Functions

`http/` is a deploy-ready Functions v4 app.

```bash
cd http && npm install
func azure functionapp publish <app-name>
```

> Note: the repo's other functions in `azure-functions/` use the v3 programming model
> (`function.json` + CommonJS). v3 and v4 cannot coexist in one Function App, so this
> deploys as its own app.

## Configuration

| Variable                | Default                               | Purpose                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CARL_DATA_BASE`        | `https://baynavigator.org/data`       | Primary site data root.                                                                                                                                                                                                                                                                                   |
| `CARL_DATA_FALLBACK`    | the Static Web App origin             | Tried when the primary refuses — see the Cloudflare note below.                                                                                                                                                                                                                                           |
| `CARL_MUNI_BASE`        | Azure Blob municipal-codes container  | Ordinance full text.                                                                                                                                                                                                                                                                                      |
| `CARL_CACHE_TTL_MS`     | `21600000` (6h)                       | How long a built corpus stays fresh.                                                                                                                                                                                                                                                                      |
| `CARL_CACHE_DIR`        | `$XDG_CACHE_HOME`/`~/.cache/carl-mcp` | Where the built corpus is cached. Created mode `0700`; refused, and the corpus built in memory instead, if the path exists but is a symlink or is owned by another user. When there is no usable home directory the corpus is built in memory instead — there is deliberately no temp-directory fallback. |
| `CARL_RELEVANCE_RATIO`  | `0.5`                                 | Precision floor; `0` disables.                                                                                                                                                                                                                                                                            |
| `CARL_FETCH_TIMEOUT_MS` | `20000`                               | Per-request network timeout.                                                                                                                                                                                                                                                                              |
| `CARL_ALLOWED_HOSTS`    | unset                                 | Azure only: enables DNS-rebinding protection.                                                                                                                                                                                                                                                             |
| `CARL_VERBOSE`          | unset                                 | `1` for stderr diagnostics.                                                                                                                                                                                                                                                                               |

> **Why datacenter deploys need the fallback:** `baynavigator.org` is behind
> Cloudflare, which challenges traffic from datacenter ASNs. A laptop gets `200`; the
> identical request from an Azure Function gets `403`. Carl tries `CARL_DATA_BASE`
> first and falls back to the Static Web App's own hostname, which serves
> byte-identical files with no Cloudflare in front. Local testing never reproduces
> this — local testing is the case that succeeds.

> **Why `/data` and not `/api`:** Azure Static Web Apps reserves `/api/*` for its
> Functions backend, so the build relocates the JSON to `/data/*`. The site's own
> `metadata.json` still advertises `/api/...` paths — those return 500. Don't "fix"
> `CARL_DATA_BASE` to match it.

## Development

```bash
npm install
npm test                  # unit tests, offline
npm run inspect           # MCP Inspector against the stdio server
npm run sync:contract     # re-vendor the retrieval contract after changing it
CARL_VERBOSE=1 npm start  # stdio server with diagnostics
```

First run builds the corpus from live data (~6s) and caches it.

## Caveats

- **Municipal coverage is 8 cities, and two of them are thin.** Berkeley (5 sections)
  and Richmond (20) scraped only partially, so `find_local_code` will often find
  nothing for them. It says so plainly rather than guessing — for those cities and
  for the ~100 Bay Area cities with no coverage at all. Widening this is a scraper
  job (`scripts/deep-scrape-municipal-codes.cjs`), not an MCP change.
- **Carl is not a caseworker.** Programs close and rules change. Carl links to sources
  so people can verify; 2-1-1 is the human fallback throughout.
- **No personalization.** Carl has no memory, no accounts, and receives no user data
  beyond the query text the host sends.

## License

MIT. Data remains subject to [LICENSE-DATA](../LICENSE-DATA) in the main repo.
