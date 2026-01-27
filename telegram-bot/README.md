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
   ```bash
   npm start
   ```

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
