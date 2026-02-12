# Ask Carl Telegram Bot

Telegram bot for Bay Navigator that uses Ollama for AI-powered responses about Bay Area community resources.

## Setup

1. **Install dependencies:**

   ```bash
   cd telegram-bot
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your bot token
   ```

3. **Make sure Ollama is running:**

   ```bash
   ollama serve
   # In another terminal, pull a model if needed:
   ollama pull llama3.2
   ```

4. **Start the bot:**

   **Manual testing:**
   ```bash
   npm start
   # Or: node bot.cjs
   ```

   **Install as always-on service (Mac Mini):**
   ```bash
   cd /Users/steven/Github/bay-navigator/local
   ./install-services.sh
   ```

   The bot will run automatically at startup and restart if it crashes.

## Environment Variables

| Variable             | Description               | Default                  |
| -------------------- | ------------------------- | ------------------------ |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Required                 |
| `OLLAMA_URL`         | Ollama API URL            | `http://localhost:11434` |
| `OLLAMA_MODEL`       | Model to use              | `llama3.2`               |

## Bot Commands

- `/start` - Start conversation with Carl
- `/help` - Show available commands and examples
- `/about` - Learn about Carl and privacy
- `/clear` - Clear conversation history

## Features

- Conversational memory (per-user, in-memory)
- Bay Area community resource knowledge
- Privacy-focused (no persistent storage)
- Graceful error handling
- Runs 24/7 as launchd service on Mac Mini

## Service Management

Once installed as a service, manage it with launchctl:

```bash
# Check status
launchctl list | grep telegram-bot

# View logs
tail -f ../local/logs/telegram-bot.log
tail -f ../local/logs/telegram-bot.error.log

# Restart service
launchctl unload ~/Library/LaunchAgents/com.baytides.telegram-bot.plist
launchctl load ~/Library/LaunchAgents/com.baytides.telegram-bot.plist

# Stop service
launchctl unload ~/Library/LaunchAgents/com.baytides.telegram-bot.plist
```

The service is configured to:
- Start automatically at login (`RunAtLoad: true`)
- Restart automatically if it crashes (`KeepAlive: true`)
- Wait 60 seconds before restarting after a crash (`ThrottleInterval: 60`)
