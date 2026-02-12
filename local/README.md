# Local Mac Mini Automation

This directory contains files for running Bay Navigator automation tasks on the local Mac Mini (carl-ai-vm).

## Missing Persons Sync

The missing persons sync runs every 15 minutes via macOS launchd.

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

Create a `.env.local` file in the project root with:

```
CARL_API_URL=https://ai.baytides.org
PUSH_FUNCTION_KEY=<azure-function-key>
```

This file is gitignored for security.

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
