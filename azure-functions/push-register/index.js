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

// Tags are echoed straight into Notification Hub targeting expressions, and
// every field below arrives from an unauthenticated caller. Accept only short,
// well-formed tags from a known set of prefixes so a client cannot subscribe
// itself to arbitrary targeting groups or flood the hub with tags.
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 64;
const ALLOWED_TAG_PREFIXES = ['county:', 'city:', 'topic:', 'lang:'];
const TAG_PATTERN = /^[a-zA-Z0-9:_-]+$/;
const MAX_TOKEN_LENGTH = 4096;

function sanitizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(
      (tag) =>
        tag.length > 0 &&
        tag.length <= MAX_TAG_LENGTH &&
        TAG_PATTERN.test(tag) &&
        ALLOWED_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix))
    )
    .slice(0, MAX_TAGS);
}

// Counties become `county:<value>` tags, so they get the same treatment.
function sanitizeTagValue(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_TAG_LENGTH) return null;
  return /^[a-zA-Z0-9 _-]+$/.test(trimmed) ? trimmed.replace(/ /g, '-') : null;
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

  const tokenLength = typeof token === 'string' ? token.length : JSON.stringify(token).length;
  if (tokenLength > MAX_TOKEN_LENGTH) {
    return {
      status: 400,
      body: { success: false, error: 'Token is too large' },
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

    // Build tags for targeting. `platform` is already checked against PLATFORMS
    // above; caller-supplied tags are filtered by sanitizeTags().
    const allTags = [`platform:${platform}`, ...sanitizeTags(tags)];

    // Add preference-based tags
    if (preferences.weatherAlerts) {
      allTags.push('weather:enabled');
      if (preferences.weatherCounties && Array.isArray(preferences.weatherCounties)) {
        preferences.weatherCounties.slice(0, MAX_TAGS).forEach((county) => {
          const safeCounty = sanitizeTagValue(county);
          if (safeCounty) allTags.push(`county:${safeCounty}`);
        });
      }
    }
    if (preferences.programUpdates) allTags.push('programs:enabled');
    if (preferences.announcements) allTags.push('announcements:enabled');
    if (preferences.missingPersons) allTags.push('missing-persons:enabled');

    // Create installation object based on platform
    let installation;

    switch (platform) {
      case PLATFORMS.WEB: {
        // Web Push (Browser Push API)
        // Token should be the full PushSubscription JSON
        let pushSubscription;
        try {
          pushSubscription = typeof token === 'string' ? JSON.parse(token) : token;
        } catch (parseError) {
          return {
            status: 400,
            body: { success: false, error: 'Invalid web push subscription' },
          };
        }
        installation = {
          installationId,
          platform: 'browser',
          pushChannel: JSON.stringify(pushSubscription),
          tags: allTags,
        };
        break;
      }

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
      body: { success: false, error: 'Failed to register device' },
    };
  }
}

/**
 * Unregister a device from push notifications
 */
async function unregisterDevice(context, body) {
  const { platform, token, installationId: providedId } = body;

  // Can unregister by installationId or by platform+token. A caller-supplied id
  // must match the shape generateInstallationId() produces (32 hex characters)
  // so arbitrary strings are never forwarded to the hub.
  let installationId = null;
  if (typeof providedId === 'string' && /^[0-9a-f]{32}$/.test(providedId.trim())) {
    installationId = providedId.trim();
  }
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
