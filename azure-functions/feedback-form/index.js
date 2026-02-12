const { EmailClient } = require('@azure/communication-email');

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://baynavigator.org',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Rate limiting: 3 submissions per IP per hour
const submissions = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const MAX_SUBMISSIONS_PER_IP = 3;

function isRateLimited(ip) {
  const now = Date.now();
  const record = submissions.get(ip);

  if (!record) {
    submissions.set(ip, { count: 1, firstSubmission: now });
    return false;
  }

  if (now - record.firstSubmission > RATE_LIMIT_WINDOW) {
    submissions.set(ip, { count: 1, firstSubmission: now });
    return false;
  }

  if (record.count >= MAX_SUBMISSIONS_PER_IP) {
    return true;
  }

  record.count++;
  return false;
}

function sanitize(str, maxLength = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function escapeHtml(str) {
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, (char) => htmlEntities[char]);
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  const clientIp = req.headers['x-forwarded-for'] || req.headers['x-client-ip'] || 'unknown';

  if (isRateLimited(clientIp)) {
    context.res = {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'Too many submissions. Please try again later.',
      }),
    };
    return;
  }

  try {
    const body = req.body || {};

    const type = sanitize(body.type, 50);
    const name = sanitize(body.name, 100);
    const email = sanitize(body.email, 254);
    const subject = sanitize(body.subject, 200);
    const message = sanitize(body.message, 5000);
    const url = sanitize(body.url, 500);
    const platform = sanitize(body.platform, 50);

    const errors = [];
    if (!type) errors.push('Feedback type is required');
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    else if (!isValidEmail(email)) errors.push('Invalid email format');
    if (!subject) errors.push('Subject is required');
    if (!message) errors.push('Message is required');

    if (errors.length > 0) {
      context.res = {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false, errors }),
      };
      return;
    }

    const typeLabel =
      type === 'bug' ? 'Bug Report' : type === 'feature' ? 'Feature Request' : 'General Feedback';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600; }
    .badge-bug { background: #fef2f2; color: #991b1b; }
    .badge-feature { background: #eff6ff; color: #1e40af; }
    .badge-feedback { background: #f0fdf4; color: #166534; }
    .field { margin-bottom: 16px; }
    .label { font-weight: bold; color: #555; }
    .value { margin-top: 4px; }
    .message { background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 8px; white-space: pre-wrap; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(typeLabel)}</h1>
    <p><span class="badge badge-${type === 'bug' ? 'bug' : type === 'feature' ? 'feature' : 'feedback'}">${escapeHtml(typeLabel)}</span></p>

    <div class="field">
      <div class="label">Subject</div>
      <div class="value">${escapeHtml(subject)}</div>
    </div>

    <div class="field">
      <div class="label">From</div>
      <div class="value">${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>&gt;</div>
    </div>

    ${
      platform
        ? `<div class="field">
      <div class="label">Platform</div>
      <div class="value">${escapeHtml(platform)}</div>
    </div>`
        : ''
    }

    ${
      url
        ? `<div class="field">
      <div class="label">Page URL</div>
      <div class="value"><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></div>
    </div>`
        : ''
    }

    <h2 style="margin-top: 24px; color: #374151;">Message</h2>
    <div class="message">${escapeHtml(message).replace(/\n/g, '<br>')}</div>

    <div class="footer">
      <p>Submitted via Bay Navigator feedback form</p>
      <p>IP: ${escapeHtml(clientIp)} | ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;

    const emailText = `${typeLabel}
${'='.repeat(typeLabel.length)}

Subject: ${subject}
From: ${name} <${email}>
${platform ? `Platform: ${platform}` : ''}
${url ? `Page URL: ${url}` : ''}

Message
-------
${message}

---
Submitted via Bay Navigator feedback form
IP: ${clientIp} | ${new Date().toISOString()}
`;

    const connectionString = process.env.AZURE_COMMS_CONNECTION_STRING;
    const senderEmail = process.env.AZURE_COMMS_SENDER;
    const recipientEmail = process.env.FEEDBACK_EMAIL || 'info@baytides.org';

    if (!connectionString || !senderEmail) {
      throw new Error('Email configuration missing');
    }

    const emailClient = new EmailClient(connectionString);

    const emailMessage = {
      senderAddress: senderEmail,
      content: {
        subject: `[${typeLabel}] ${subject}`,
        plainText: emailText,
        html: emailHtml,
      },
      recipients: {
        to: [{ address: recipientEmail }],
      },
      replyTo: [{ address: email, displayName: name }],
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();

    if (result.status === 'Succeeded') {
      context.res = {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          message: 'Thank you! Your feedback has been submitted.',
        }),
      };
    } else {
      throw new Error(`Email sending failed with status: ${result.status}`);
    }
  } catch (error) {
    context.log.error('Feedback form error:', error);

    context.res = {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: 'An error occurred. Please try again or email info@baytides.org directly.',
      }),
    };
  }
};
