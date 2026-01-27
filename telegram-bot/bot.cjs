#!/usr/bin/env node
/**
 * Ask Carl Telegram Bot
 * Uses Ollama for AI responses about Bay Area resources
 */

const { Telegraf } = require('telegraf');

// Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('Error: TELEGRAM_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Carl's system prompt with Bay Navigator context
const CARL_SYSTEM_PROMPT = `You are Carl, a friendly AI assistant for Bay Navigator (baynavigator.org). You help Bay Area residents find free and low-cost community resources.

PERSONALITY:
- Named after "Karl the Fog" but spelled with a C for Chat
- Friendly, helpful, and knowledgeable about the Bay Area
- Privacy-focused - you don't store conversations
- Created by Bay Tides

KEY KNOWLEDGE AREAS:
1. Community Programs: Food assistance (CalFresh, food banks), housing help, healthcare (Medi-Cal), utility assistance (CARE, FERA, LIHEAP)
2. Libraries: Free tutoring (Brainfuse, Tutor.com), museum passes, tool libraries, seed libraries
3. Transit: BART, Muni, Caltrain, AC Transit, VTA, Clipper card discounts
4. Parks: Regional parks, state parks, national parks in the Bay Area
5. Government: City services, county resources, state programs
6. Municipal Codes: Local laws and regulations for Bay Area cities

RESPONSE GUIDELINES:
- Keep responses concise for Telegram (under 500 words)
- Always suggest visiting baynavigator.org for detailed information
- Be honest if you don't know something
- Focus on practical, actionable help
- For legal questions, suggest consulting official municipal code sources

COUNTIES COVERED: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano, Sonoma

Remember: You're here to help people access resources they may not know about!`;

// Helper function to call Ollama
async function askOllama(userMessage, conversationHistory = []) {
  const messages = [
    { role: 'system', content: CARL_SYSTEM_PROMPT },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'Sorry, I had trouble generating a response.';
  } catch (error) {
    console.error('Ollama error:', error);
    if (error.code === 'ECONNREFUSED') {
      return "I'm having trouble connecting to my brain right now. Please make sure Ollama is running and try again!";
    }
    return "Sorry, I ran into an issue. Please try again in a moment.";
  }
}

// Simple conversation history per user (in-memory, not persistent)
const conversations = new Map();
const MAX_HISTORY = 10;

function getConversationHistory(userId) {
  return conversations.get(userId) || [];
}

function addToConversation(userId, role, content) {
  const history = conversations.get(userId) || [];
  history.push({ role, content });

  // Keep only last N messages
  if (history.length > MAX_HISTORY * 2) {
    history.splice(0, 2);
  }

  conversations.set(userId, history);
}

function clearConversation(userId) {
  conversations.delete(userId);
}

// Initialize bot
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Start command
bot.start((ctx) => {
  const firstName = ctx.from?.first_name || 'friend';
  ctx.reply(
    `👋 Hey ${firstName}! I'm Carl, your Bay Area community resource assistant.\n\n` +
    `I can help you find:\n` +
    `🍎 Food assistance programs\n` +
    `🏠 Housing resources\n` +
    `🏥 Healthcare options\n` +
    `📚 Library services\n` +
    `🚇 Transit information\n` +
    `📋 Local laws & regulations\n\n` +
    `Just ask me anything about Bay Area resources!\n\n` +
    `Type /help for more commands or visit baynavigator.org`
  );
});

// Help command
bot.help((ctx) => {
  ctx.reply(
    `🌉 *Carl Help*\n\n` +
    `*Commands:*\n` +
    `/start - Start conversation\n` +
    `/help - Show this help\n` +
    `/about - Learn about Carl\n` +
    `/donate - Support Bay Navigator\n\n` +
    `*Ask me about:*\n` +
    `• "How do I apply for CalFresh?"\n` +
    `• "Free tutoring for my kids"\n` +
    `• "Noise ordinance in San Jose"\n` +
    `• "BART senior discount"\n` +
    `• "Food banks near Oakland"\n\n` +
    `Visit baynavigator.org for full resource listings!`,
    { parse_mode: 'Markdown' }
  );
});

// About command
bot.command('about', (ctx) => {
  ctx.reply(
    `🌫️ *About Carl*\n\n` +
    `I'm an AI assistant named after Karl the Fog (but spelled with a C for Chat!).\n\n` +
    `I was created by Bay Tides to help Bay Area residents discover free and low-cost community resources.\n\n` +
    `*Privacy:* I run on open-source AI (Ollama) and don't store your conversations permanently. Your privacy matters!\n\n` +
    `*Powered by:* Bay Navigator (baynavigator.org)\n` +
    `*AI Model:* ${OLLAMA_MODEL}`,
    { parse_mode: 'Markdown' }
  );
});

// Donate command - uses Telegram Stars
bot.command('donate', async (ctx) => {
  // Telegram Stars donation amounts (1 Star ≈ $0.02 USD)
  const donationOptions = [
    { stars: 50, label: '50 ⭐ (~$1)' },
    { stars: 250, label: '250 ⭐ (~$5)' },
    { stars: 500, label: '500 ⭐ (~$10)' },
  ];

  await ctx.reply(
    `💙 *Support Bay Navigator*\n\n` +
    `Thank you for considering a donation! Your support helps us maintain Bay Navigator and keep Carl running.\n\n` +
    `Choose an amount below to donate with Telegram Stars:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: donationOptions.map(d => [{
          text: `Donate ${d.label}`,
          callback_data: `stars_${d.stars}`
        }])
      }
    }
  );
});

// Handle Stars donation button callbacks
bot.action(/stars_(\d+)/, async (ctx) => {
  const stars = parseInt(ctx.match[1]);
  await ctx.answerCbQuery();

  try {
    // Send invoice for Telegram Stars (digital goods - no provider_token needed)
    await ctx.replyWithInvoice({
      title: 'Support Bay Navigator',
      description: `Donate ${stars} Stars to help keep Bay Navigator free for the Bay Area community.`,
      payload: `donation_stars_${ctx.from.id}_${Date.now()}`,
      provider_token: '', // Empty for Telegram Stars
      currency: 'XTR', // XTR = Telegram Stars
      prices: [{ label: 'Donation', amount: stars }],
    });
  } catch (error) {
    console.error('Invoice error:', error);
    ctx.reply(
      `Sorry, there was an issue creating the donation. You can also support us at baynavigator.org/donate`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Pre-checkout handler (required for payments)
bot.on('pre_checkout_query', (ctx) => {
  // Approve the checkout
  ctx.answerPreCheckoutQuery(true);
});

// Successful payment handler
bot.on('successful_payment', (ctx) => {
  const payment = ctx.message.successful_payment;
  const stars = payment.total_amount;

  ctx.reply(
    `🎉 *Thank you for your donation!*\n\n` +
    `Your generous contribution of ${stars} ⭐ helps keep Bay Navigator free for everyone.\n\n` +
    `Together, we're making Bay Area resources more accessible! 💙`,
    { parse_mode: 'Markdown' }
  );
});


// Handle all text messages
bot.on('text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  // Show typing indicator
  await ctx.sendChatAction('typing');

  // Get conversation history
  const history = getConversationHistory(userId);

  // Get response from Ollama
  const response = await askOllama(userMessage, history);

  // Save to conversation history
  addToConversation(userId, 'user', userMessage);
  addToConversation(userId, 'assistant', response);

  // Send response (split if too long for Telegram)
  if (response.length > 4000) {
    const chunks = response.match(/.{1,4000}/gs) || [response];
    for (const chunk of chunks) {
      await ctx.reply(chunk);
    }
  } else {
    await ctx.reply(response);
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Oops! Something went wrong. Please try again.');
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Start bot
console.log('🌫️ Carl is starting up...');
console.log(`📡 Ollama URL: ${OLLAMA_URL}`);
console.log(`🤖 Model: ${OLLAMA_MODEL}`);

bot.launch()
  .then(() => {
    console.log('✅ Carl is ready to help Bay Area residents!');
    console.log('🔗 @BayCarlbot is now live');
  })
  .catch((err) => {
    console.error('Failed to start bot:', err);
    process.exit(1);
  });
