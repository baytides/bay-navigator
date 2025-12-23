// Minimal API client with ETag support and optional caching
const DEFAULT_BASE_URL = 'https://bayareadiscounts.com/api';

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined || val === null || val === '') return;
    search.append(key, String(val));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

class ApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL;
    this.fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);
    if (!this.fetchFn) throw new Error('fetch is not available; provide fetchFn');
    this.cache = options.cache || null; // expected interface: get(key), set(key, value)
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}${buildQuery(options.params)}`;
    const headers = Object.assign({ Accept: 'application/json' }, options.headers || {});

    const cacheKey = `body:${url}`;
    const etagKey = `etag:${url}`;

    const cachedEtag = this.cache ? this.cache.get(etagKey) : undefined;
    if (cachedEtag) headers['If-None-Match'] = cachedEtag;

    const res = await this.fetchFn(url, {
      method: options.method || 'GET',
      headers,
      signal: options.signal,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (res.status === 304) {
      const cachedBody = this.cache ? this.cache.get(cacheKey) : undefined;
      if (cachedBody !== undefined) {
        return { data: cachedBody, etag: cachedEtag, fromCache: true };
      }
      // fall through to fetch body if cache missing
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        message = errorJson.error || errorJson.message || message;
      } catch (err) {
        const text = await res.text();
        if (text) message = text;
      }
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    const etag = res.headers.get('etag');

    if (this.cache && etag) {
      this.cache.set(etagKey, etag);
      this.cache.set(cacheKey, data);
    }

    return { data, etag, fromCache: false };
  }

  // Convenience endpoint wrappers
  getPrograms(params = {}) {
    // Static JSON API - params are ignored, all programs returned
    return this.request('/programs.json', { params });
  }

  getProgramById(id) {
    if (!id) throw new Error('id is required');
    return this.request(`/programs/${encodeURIComponent(id)}.json`);
  }

  getCategories() {
    return this.request('/categories.json');
  }

  getAreas() {
    return this.request('/areas.json');
  }

  getStats() {
    // Stats not available in static API - return metadata instead
    return this.request('/metadata.json');
  }
}

module.exports = { ApiClient, DEFAULT_BASE_URL };
