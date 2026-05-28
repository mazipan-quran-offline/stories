#!/usr/bin/env node
// Regenerates src/sitemap.xml from content.json.
// Wired into `pnpm run build` so the sitemap always matches the published content.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContent, loadStories, REPO_ROOT } from './content.mjs';

function buildSitemap() {
  const { site } = loadContent();
  const stories = loadStories();

  const urls = [
    `<url> <loc>${site.baseUrl}/</loc> <changefreq>daily</changefreq> <priority>0.7</priority> </url>`,
    ...stories.map(
      (story) =>
        `<url> <loc>${site.baseUrl}/${story.slug}/</loc> <changefreq>weekly</changefreq> <priority>0.7</priority> </url>`,
    ),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.join('\n')}
</urlset>
`;
}

const outPath = join(REPO_ROOT, 'src', 'sitemap.xml');
writeFileSync(outPath, buildSitemap());
console.log(`Generated ${outPath}`);
