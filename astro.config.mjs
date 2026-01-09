import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://baynavigator.org',
  integrations: [
    tailwind(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        // Set higher priority for main pages
        if (item.url === 'https://baynavigator.org/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (item.url.includes('/directory')) {
          item.priority = 0.9;
          item.changefreq = 'daily';
        } else if (item.url.includes('/map')) {
          item.priority = 0.85;
          item.changefreq = 'weekly';
        } else if (item.url.includes('/eligibility')) {
          item.priority = 0.8;
        } else if (item.url.includes('/about') || item.url.includes('/glossary')) {
          item.priority = 0.6;
        } else if (item.url.includes('/privacy') || item.url.includes('/terms')) {
          item.priority = 0.3;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
  // Build optimizations
  build: {
    inlineStylesheets: 'auto',
  },
  // Prefetch configuration for faster navigation
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  // HTML compression
  compressHTML: true,
  // Experimental features for performance
  experimental: {
    clientPrerender: true,
  },
});
