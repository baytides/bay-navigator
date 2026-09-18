/**
 * Site-wide structured data and canonical metadata.
 *
 * These lived inline in BaseLayout. SiteLayout emitted none of it — no
 * Open Graph, no canonical, no JSON-LD — so every page converted to the new
 * layout quietly lost its structured data, the homepage included. Extracting
 * them here means the two layouts cannot drift while the migration is in
 * progress, and there is one place to correct a fact like the repository URL.
 */

export const SITE_URL = 'https://baynavigator.org';

export const DEFAULT_DESCRIPTION =
  'Free and low-cost programs for food, housing, health care and utilities across the nine-county San Francisco Bay Area.';

/** Canonical absolute URL for a pathname. */
export function canonicalUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).href;
}

/** Absolute URL for an Open Graph image path. */
export function absoluteImageUrl(image: string): string {
  return new URL(image, SITE_URL).href;
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Bay Tides',
  alternateName: 'Bay Navigator',
  url: SITE_URL,
  logo: `${SITE_URL}/assets/images/logo/logo.webp`,
  description:
    'Bay Tides is a 501(c)(3) nonprofit working to protect the San Francisco Bay. Bay Navigator connects Bay Area residents with free and low-cost programs.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Redwood City',
    addressRegion: 'CA',
    addressCountry: 'US',
  },
  areaServed: {
    '@type': 'Place',
    name: 'San Francisco Bay Area',
  },
  // The repository moved to baytides/bay-navigator; the old path still
  // redirects, but sameAs is an identity claim and should name the real one.
  sameAs: ['https://github.com/baytides/bay-navigator', 'https://baytides.org'],
};

/** WebSite schema, including the sitelinks search box target. */
export function websiteSchema(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Bay Navigator',
    url: SITE_URL,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'Bay Tides',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/directory?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
