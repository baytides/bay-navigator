/**
 * Push Notification Device Registration
 *
 * Registers devices with Azure Notification Hub for push notifications.
 * Supports Web Push (VAPID), APNs (iOS), and FCM (Android).
 */

const { NotificationHubsClient } = require('@azure/notification-hubs');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Platform identifiers
const PLATFORMS = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
};

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
 * Generate a unique installation ID for the device
 */
function generateInstallationId(platform, token) {
  // Use a hash of platform + token for consistent IDs
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${platform}:${token}`).digest('hex').substring(0, 32);
}

/**
 * Register a device for push notifications
 */
async function registerDevice(context, body) {
  const { platform, token, tags = [], preferences = {} } = body;

  // Validate required fields
  if (!platform || !token) {
    return {
      status: 400,
      body: { success: false, error: 'Platform and token are required' },
    };
  }

  if (!Object.values(PLATFORMS).includes(platform)) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Invalid platform. Must be one of: ${Object.values(PLATFORMS).join(', ')}`,
      },
    };
  }

  try {
    const client = getHubClient();
    const installationId = generateInstallationId(platform, token);

    // Build tags for targeting
    const allTags = [`platform:${platform}`, ...tags];

    // Add preference-based tags
    if (preferences.weatherAlerts) {
      allTags.push('weather:enabled');
      if (preferences.weatherCounties && Array.isArray(preferences.weatherCounties)) {
        preferences.weatherCounties.forEach((county) => {
          allTags.push(`county:${county}`);
        });
      }
    }
    if (preferences.programUpdates) allTags.push('programs:enabled');
    if (preferences.announcements) allTags.push('announcements:enabled');
    if (preferences.missingPersons) allTags.push('missing-persons:enabled');

    // Create installation object based on platform
    let installation;

    switch (platform) {
      case PLATFORMS.WEB:
        // Web Push (Browser Push API)
        // Token should be the full PushSubscription JSON
        const pushSubscription = typeof token === 'string' ? JSON.parse(token) : token;
        installation = {
          installationId,
          platform: 'browser',
          pushChannel: JSON.stringify(pushSubscription),
          tags: allTags,
        };
        break;

      case PLATFORMS.IOS:
        // APNs
        installation = {
          installationId,
          platform: 'apns',
          pushChannel: token,
          tags: allTags,
        };
        break;

      case PLATFORMS.ANDROID:
        // FCM V1
        installation = {
          installationId,
          platform: 'fcmV1',
          pushChannel: token,
          tags: allTags,
        };
        break;
    }

    // Create or update the installation
    await client.createOrUpdateInstallation(installation);

    context.log(`Registered device: ${installationId} (${platform})`);

    return {
      status: 200,
      body: {
        success: true,
        installationId,
        message: 'Device registered for push notifications',
      },
    };
  } catch (error) {
    context.log.error('Registration error:', error.message, error.stack);
    return {
      status: 500,
      body: { success: false, error: 'Failed to register device', details: error.message },
    };
  }
}

/**
 * Unregister a device from push notifications
 */
async function unregisterDevice(context, body) {
  const { platform, token, installationId: providedId } = body;

  // Can unregister by installationId or by platform+token
  let installationId = providedId;
  if (!installationId && platform && token) {
    installationId = generateInstallationId(platform, token);
  }

  if (!installationId) {
    return {
      status: 400,
      body: { success: false, error: 'installationId or platform+token required' },
    };
  }

  try {
    const client = getHubClient();
    await client.deleteInstallation(installationId);

    context.log(`Unregistered device: ${installationId}`);

    return {
      status: 200,
      body: { success: true, message: 'Device unregistered' },
    };
  } catch (error) {
    // 404 is OK - device wasn't registered
    if (error.statusCode === 404) {
      return {
        status: 200,
        body: { success: true, message: 'Device was not registered' },
      };
    }

    context.log.error('Unregister error:', error);
    return {
      status: 500,
      body: { success: false, error: 'Failed to unregister device' },
    };
  }
}

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: corsHeaders,
    };
    return;
  }

  let result;

  if (req.method === 'POST') {
    result = await registerDevice(context, req.body || {});
  } else if (req.method === 'DELETE') {
    result = await unregisterDevice(context, req.body || {});
  } else {
    result = {
      status: 405,
      body: { success: false, error: 'Method not allowed' },
    };
  }

  context.res = {
    status: result.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(result.body),
  };
};
