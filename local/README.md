# Local Mac Mini Automation

> ## ⚠️ Mostly superseded — September 2026
>
> The four data syncs below now run in **GitHub Actions**, not on this machine:
>
> | launchd job | replaced by |
> | --- | --- |
> | `com.baytides.missing-persons-sync` | `.github/workflows/sync-missing-persons.yml` |
> | `com.baytides.nps-parks-sync` | `.github/workflows/sync-nps-parks.yml` |
> | `com.baytides.open-data-sync` | `.github/workflows/sync-open-data.yml` |
> | `com.baytides.sports-sync` | `.github/workflows/sync-sports.yml` |
>
> They have been **persistently disabled** (`launchctl disable`), not deleted. To
> bring one back: `launchctl enable gui/$(id -u)/com.baytides.<job>`.
>
> **Why they had to go.** Each runner did `git fetch && git checkout main && git pull`
> against this working copy on a timer — every 15 minutes for missing persons.
> If anyone had another branch checked out, it was silently swapped to `main`
> mid-edit. `launchctl` recorded 74 runs. It also meant data freshness depended on
> one machine staying awake.
>
> **Still local, not yet rehomed:**
>
> - `com.baytides.pmtiles-update` — needs tile-generation tooling in CI.
> - `com.baytides.telegram-bot` — a long-running process, so it needs a container
>   rather than a cron.
> - `org.baytides.carl-stats` — served stats for the retired Carl backend; it can
>   almost certainly be retired too.


This directory contains files for running Bay Navigator automation tasks on the local Mac Mini (carl-ai-vm).

**Philosophy**: Since the Mac Mini runs 24/7 for Carl AI, we maximize its usage by running all time-based data sync tasks locally instead of consuming GitHub Actions minutes.

## Services Overview

| Service | Schedule | Description |
|---------|----------|-------------|
| Missing Persons | Every 15 min | NCMEC missing children data + push notifications |
| Sports Data | Every 3 hours | Giants/Warriors/49ers/Earthquakes schedules & scores |
| Open Data | Daily 6am | Bay Area Socrata portals aggregation |
| NPS Parks | Weekly Sun 6am | National Parks Service recreation data |
| PMTiles | Every 2 days | Bay Area map tiles extraction & upload |
| Telegram Bot | Always running | AI-powered Telegram bot connected to Carl |

## Quick Install

```bash
./local/install-services.sh
```

## Missing Persons Sync

Runs every 15 minutes via macOS launchd.

### Setup

1. Install the launchd service:

```bash
cp local/com.baytides.missing-persons-sync.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.baytides.missing-persons-sync.plist
```

2. Check service status:

```bash
launchctl list | grep baytides
```

3. View logs:

```bash
tail -f local/logs/missing-persons-sync.log
tail -f local/logs/missing-persons-sync.error.log
```

4. Manual run:

```bash
./local/run-missing-persons-sync.sh
```

### Uninstall

```bash
launchctl unload ~/Library/LaunchAgents/com.baytides.missing-persons-sync.plist
rm ~/Library/LaunchAgents/com.baytides.missing-persons-sync.plist
```

## Environment Variables

### For Data Sync Scripts

Create a `.env.local` file in the project root with:

```
CARL_API_URL=https://ai.baytides.org
PUSH_FUNCTION_KEY=<azure-function-key>
AZURE_STORAGE_KEY=<azure-storage-key>
```

### For Telegram Bot

Create a `.env` file in `telegram-bot/` directory with:

```
TELEGRAM_BOT_TOKEN=<your-bot-token-from-botfather>
OLLAMA_URL=https://ai.baytides.org
OLLAMA_MODEL=qwen2.5:3b
```

Both files are gitignored for security.

## How It Works

1. `com.baytides.missing-persons-sync.plist` - launchd configuration (runs every 15 minutes)
2. `run-missing-persons-sync.sh` - Wrapper script that:
   - Pulls latest changes from GitHub
   - Runs the sync script
   - Commits and pushes any changes
3. `scripts/sync-missing-persons.cjs` - Main sync script (also in scripts/)

## Notes

- The GitHub Actions workflow is disabled to prevent conflicts
- Git commits are made as "Bay Navigator Mac Mini" <steven@baytides.org>
- Logs are stored in `local/logs/` (gitignored)
- The plist file should be copied to `~/Library/LaunchAgents/` (not gitignored)
