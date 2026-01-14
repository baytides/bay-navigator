/**
 * Link Checker Azure Function
 * Runs weekly (Monday 9am UTC) to check all program URLs
 * Creates GitHub issue if broken links found
 * Optional: Slack notifications via Bot Token (recommended over webhooks)
 */

const https = require('https');
const http = require('http');

/**
 * Sanitize string for safe logging (prevent log injection/forging)
 */
function sanitizeForLog(str) {
  if (typeof str !== 'string') return String(str);
  // Replace newlines, carriage returns, and other control characters
  return str.replace(/[\r\n\x00-\x1f]/g, ' ').substring(0, 500);
}

// Configuration
const PROGRAMS_API_URL = 'https://baynavigator.org/api/programs.json';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'baytides/baynavigator';

// Slack configuration (Bot Token approach - not webhooks)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN; // xoxb-... token from Slack App
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID; // Channel ID (e.g., C01234567)

/**
 * Fetch JSON from URL
 */
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}`));
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Check if a URL is accessible
 * Returns: { url, status, ok, error, redirectUrl }
 */
function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    try {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(
        url,
        {
          timeout,
          headers: {
            'User-Agent': 'BayNavigator-LinkChecker/1.0',
          },
        },
        (res) => {
          const duration = Date.now() - startTime;
          const result = {
            url,
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 400,
            duration,
            redirectUrl: res.headers.location || null,
          };

          // Handle redirects as OK
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            result.ok = true;
          }

          resolve(result);
        }
      );

      req.on('error', (error) => {
        resolve({
          url,
          status: 0,
          ok: false,
          error: error.message,
          duration: Date.now() - startTime,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          url,
          status: 0,
          ok: false,
          error: 'Timeout',
          duration: timeout,
        });
      });
    } catch (error) {
      resolve({
        url,
        status: 0,
        ok: false,
        error: `Invalid URL: ${error.message}`,
        duration: 0,
      });
    }
  });
}

/**
 * Send Slack notification via Bot Token (chat.postMessage API)
 */
async function sendSlackNotification(text, blocks = null) {
  if (!SLACK_BOT_TOKEN || !SLACK_CHANNEL_ID) {
    return false;
  }

  const payload = JSON.stringify({
    channel: SLACK_CHANNEL_ID,
    text: text,
    ...(blocks && { blocks }),
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'slack.com',
        path: '/api/chat.postMessage',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.ok) {
              console.log('Slack notification sent successfully');
              resolve(true);
            } else {
              console.log(`Slack API error: ${sanitizeForLog(response.error)}`);
              resolve(false);
            }
          } catch {
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.log(`Slack request error: ${sanitizeForLog(err.message)}`);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Create GitHub issue for broken links
 */
async function createGitHubIssue(brokenLinks) {
  if (!GITHUB_TOKEN) {
    console.log('GitHub token not configured, skipping issue creation');
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  const title = `🔗 Broken Links Report - ${today}`;
  const body = `## Broken Links Found

The weekly link checker found **${brokenLinks.length}** broken link(s):

${brokenLinks
  .map(
    (link) =>
      `### ${link.programName}
- **ID:** \`${link.programId}\`
- **URL:** ${link.url}
- **Error:** ${link.error || `HTTP ${link.status}`}`
  )
  .join('\n\n')}

---
*This issue was automatically created by the Azure Functions link checker.*
*Run date: ${new Date().toISOString()}*`;

  const payload = JSON.stringify({
    title,
    body,
    labels: ['broken-link', 'automated'],
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${GITHUB_REPO}/issues`,
        method: 'POST',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'User-Agent': 'BayNavigator-LinkChecker',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Accept: 'application/vnd.github.v3+json',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 201) {
            try {
              const issue = JSON.parse(data);
              console.log(`GitHub issue created: ${issue.html_url}`);
              resolve(true);
            } catch {
              resolve(true);
            }
          } else {
            console.log(
              `GitHub issue creation failed: ${res.statusCode} - ${sanitizeForLog(data)}`
            );
            resolve(false);
          }
        });
      }
    );

    req.on('error', (err) => {
      console.log(`GitHub request error: ${sanitizeForLog(err.message)}`);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

/**
 * Main function handler
 */
module.exports = async function (context, timer) {
  const startTime = Date.now();
  context.log('Link checker started at:', new Date().toISOString());

  if (timer.isPastDue) {
    context.log('Timer is past due, running anyway');
  }

  try {
    // Fetch all programs
    context.log('Fetching programs from API...');
    const data = await fetchJson(PROGRAMS_API_URL);
    const programs = data.programs || [];
    context.log(`Found ${programs.length} programs to check`);

    // Check all URLs (with concurrency limit)
    const brokenLinks = [];
    const batchSize = 10;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (program) => {
          if (!program.link) return null;

          const result = await checkUrl(program.link);
          if (!result.ok) {
            return {
              programId: program.id,
              programName: program.name,
              url: program.link,
              status: result.status,
              error: result.error,
            };
          }
          return null;
        })
      );

      brokenLinks.push(...results.filter((r) => r !== null));

      // Progress log every 50 programs
      if ((i + batchSize) % 50 === 0 || i + batchSize >= programs.length) {
        context.log(
          `Checked ${Math.min(i + batchSize, programs.length)}/${programs.length} programs`
        );
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    context.log(`Link check completed in ${duration}s. Found ${brokenLinks.length} broken links.`);

    // Report results
    if (brokenLinks.length > 0) {
      context.log('Broken links found:', JSON.stringify(brokenLinks, null, 2));

      // Create GitHub issue
      const issueCreated = await createGitHubIssue(brokenLinks);
      context.log(`GitHub issue created: ${issueCreated}`);

      // Slack notification
      await sendSlackNotification(
        `🔗 *${brokenLinks.length} broken links* found on baynavigator.org`,
        [
          {
            type: 'header',
            text: { type: 'plain_text', text: '🔗 Broken Links Report', emoji: true },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: brokenLinks
                .slice(0, 10)
                .map((l) => `• *${l.programName}*: ${l.error || `HTTP ${l.status}`}`)
                .join('\n'),
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Check GitHub issues for full report • ${brokenLinks.length} total broken`,
              },
            ],
          },
        ]
      );
    } else {
      context.log('All links are healthy!');

      // Slack success notification
      await sendSlackNotification(
        `✅ Weekly link check passed! All ${programs.length} program links are healthy.`,
        [
          {
            type: 'header',
            text: { type: 'plain_text', text: '✅ Link Check Passed', emoji: true },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `All *${programs.length}* program links are working correctly.`,
            },
          },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `Completed in ${duration}s` }],
          },
        ]
      );
    }

    context.res = {
      status: 200,
      body: {
        success: true,
        checked: programs.length,
        broken: brokenLinks.length,
        duration: `${duration}s`,
      },
    };
  } catch (error) {
    context.log.error('Link checker failed:', error);

    context.res = {
      status: 500,
      body: { success: false, error: error.message },
    };
  }
};
