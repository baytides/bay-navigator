/**
 * Push Notification Sender
 *
 * Sends push notifications to registered devices via Azure Notification Hub.
 * Requires function-level authentication (API key).
 */

const { NotificationHubsClient } = require('@azure/notification-hubs');

// Notification Hub client (lazy init)
let hubClient = null;

function getHubClient() {
  if (!hubClient) {
    const connectionString = process.env.NOTIFICATION_HUB_CONNECTION;
    const hubName = process.env.NOTIFICATION_HUB_NAME || 'baynavigator-hub';

    if (!connectionString) {
      throw new Error('NOTIFICATION_HUB_CONNECTION_STRING not configured');
    }

    hubClient = new NotificationHubsClient(connectionString, hubName);
  }
  return hubClient;
}

/**
 * Build platform-specific notification payloads
 */
function buildNotificationPayloads(notification) {
  const { title, body, data = {}, badge, sound = 'default' } = notification;

  return {
    // Web Push (Browser)
    browser: JSON.stringify({
      title,
      body,
      icon: '/assets/images/favicons/favicon-192.webp',
      badge: '/assets/images/favicons/badge-72.webp',
      tag: data.tag || 'baynavigator',
      data,
      requireInteraction: data.requireInteraction || false,
    }),

    // APNs (iOS/macOS)
    apns: JSON.stringify({
      aps: {
        alert: { title, body },
        badge: badge || 0,
        sound,
        'thread-id': data.threadId || 'default',
        'mutable-content': 1,
      },
      ...data,
    }),

    // FCM (Android)
    fcm: JSON.stringify({
      notification: { title, body },
      android: {
        priority: 'high',
        notification: {
          channelId: data.channelId || 'default',
          icon: 'ic_notification',
          color: '#0d9488',
        },
      },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    }),
  };
}

/**
 * Send notification to devices matching tags
 */
async function sendNotification(context, body) {
  const { notification, tags, platforms } = body;

  if (!notification || !notification.title || !notification.body) {
    return {
      status: 400,
      body: { success: false, error: 'notification.title and notification.body are required' },
    };
  }

  try {
    const client = getHubClient();
    const payloads = buildNotificationPayloads(notification);

    // Build tag expression
    // If tags provided, use them; otherwise send to all
    let tagExpression = null;
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Use OR logic for multiple tags
      tagExpression = tags.join(' || ');
    }

    const results = {
      sent: [],
      failed: [],
    };

    // Determine which platforms to send to
    const targetPlatforms = platforms || ['web', 'ios', 'android'];

    // Send to each platform
    for (const platform of targetPlatforms) {
      try {
        let result;

        switch (platform) {
          case 'web':
            result = await client.sendNotification(
              { body: payloads.browser, platform: 'browser' },
              { tagExpression }
            );
            break;

          case 'ios':
            result = await client.sendNotification(
              { body: payloads.apns, platform: 'apns' },
              { tagExpression }
            );
            break;

          case 'android':
            result = await client.sendNotification(
              { body: payloads.fcm, platform: 'fcm' },
              { tagExpression }
            );
            break;
        }

        results.sent.push({ platform, trackingId: result?.trackingId });
        context.log(`Sent notification to ${platform}: ${result?.trackingId}`);
      } catch (platformError) {
        context.log.error(`Failed to send to ${platform}:`, platformError);
        results.failed.push({ platform, error: platformError.message });
      }
    }

    return {
      status: 200,
      body: {
        success: results.sent.length > 0,
        results,
      },
    };
  } catch (error) {
    context.log.error('Send notification error:', error);
    return {
      status: 500,
      body: { success: false, error: 'Failed to send notification' },
    };
  }
}

module.exports = async function (context, req) {
  const result = await sendNotification(context, req.body || {});

  context.res = {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  };
};
