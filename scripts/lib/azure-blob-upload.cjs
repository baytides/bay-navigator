/**
 * Shared Azure Blob Storage upload utility
 *
 * Uploads JSON data to Azure Blob Storage using SharedKey authentication.
 * Used by all sync scripts to push data without git commits.
 *
 * Usage:
 *   const { uploadToBlob } = require('./lib/azure-blob-upload.cjs');
 *   await uploadToBlob({ container: 'api-data', blob: 'my-data.json', data: jsonString });
 *
 * Environment variables:
 *   AZURE_STORAGE_KEY - SharedKey for baytidesstorage account
 */

const crypto = require('crypto');
const https = require('https');

const STORAGE_ACCOUNT = 'baytidesstorage';

/**
 * Upload a JSON string to Azure Blob Storage.
 *
 * @param {Object} opts
 * @param {string} opts.container - Blob container name (e.g. 'api-data')
 * @param {string} opts.blob - Blob name (e.g. 'earthquake-alerts.json')
 * @param {string} opts.data - JSON string to upload
 * @param {string} [opts.cacheControl] - Cache-Control header value
 * @param {string} [opts.label] - Label for log messages (defaults to blob name)
 * @returns {Promise<boolean>} true if upload succeeded
 */
async function uploadToBlob({ container, blob, data, cacheControl, label }) {
  const storageKey = process.env.AZURE_STORAGE_KEY || '';
  const tag = label || blob;

  if (!storageKey) {
    console.log(`[${tag}] No AZURE_STORAGE_KEY set, skipping blob upload`);
    return false;
  }

  const now = new Date().toUTCString();
  const contentLength = Buffer.byteLength(data, 'utf-8');
  const contentType = 'application/json';
  const cache = cacheControl || 'public, max-age=300, stale-while-revalidate=900';
  const blobType = 'BlockBlob';

  const canonicalizedHeaders = [
    `x-ms-blob-cache-control:${cache}`,
    `x-ms-blob-content-type:${contentType}`,
    `x-ms-blob-type:${blobType}`,
    `x-ms-date:${now}`,
    `x-ms-version:2020-10-02`,
  ].join('\n');

  const canonicalizedResource = `/${STORAGE_ACCOUNT}/${container}/${blob}`;

  const stringToSign = [
    'PUT',
    '', // Content-Encoding
    '', // Content-Language
    contentLength,
    '', // Content-MD5
    contentType,
    '', // Date
    '', // If-Modified-Since
    '', // If-Match
    '', // If-None-Match
    '', // If-Unmodified-Since
    '', // Range
    canonicalizedHeaders,
    canonicalizedResource,
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', Buffer.from(storageKey, 'base64'))
    .update(stringToSign, 'utf-8')
    .digest('base64');

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: `${STORAGE_ACCOUNT}.blob.core.windows.net`,
        path: `/${container}/${blob}`,
        method: 'PUT',
        headers: {
          Authorization: `SharedKey ${STORAGE_ACCOUNT}:${signature}`,
          'Content-Type': contentType,
          'Content-Length': contentLength,
          'x-ms-date': now,
          'x-ms-version': '2020-10-02',
          'x-ms-blob-type': blobType,
          'x-ms-blob-content-type': contentType,
          'x-ms-blob-cache-control': cache,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode === 201) {
            console.log(`[${tag}] Uploaded to Azure Blob Storage`);
            resolve(true);
          } else {
            console.warn(`[${tag}] Blob upload failed: HTTP ${res.statusCode} - ${body.slice(0, 200)}`);
            resolve(false);
          }
        });
      }
    );

    req.on('error', (e) => {
      console.warn(`[${tag}] Blob upload error: ${e.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

module.exports = { uploadToBlob };
