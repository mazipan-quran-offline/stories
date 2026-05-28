#!/usr/bin/env node
// Syncs the story cards on the landing page (src/index.html) from content.json.
//
// This does NOT regenerate the whole file — src/index.html is a hand-maintained
// template. The script only replaces the markup between the marker comments:
//
//   <!-- stories:start ... -->
//   ...cards...
//   <!-- stories:end -->
//
// It is intentionally NOT part of `pnpm run build`. Run it locally whenever
// content.json changes (new story, edited metadata) and commit src/index.html:
//
//   pnpm run generate:index

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatDateID, loadStories, REPO_ROOT } from './content.mjs';

const START = '<!-- stories:start';
const END = '<!-- stories:end -->';

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderCard(story) {
  return `				<li class="card" style="background-image: ${story.gradient};">
					<a href="/stories/${story.slug}/">
						<h3>${escapeHtml(story.title)}</h3>
					</a>
					<small>${formatDateID(story.publishedDate)}</small>
					<p>${escapeHtml(story.description)}</p>
				</li>`;
}

const indexPath = join(REPO_ROOT, 'src', 'index.html');
const html = readFileSync(indexPath, 'utf8');

const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  throw new Error(
    `Could not find the "stories:start"/"stories:end" markers in ${indexPath}. ` +
      'Make sure both marker comments exist inside <ul class="cards">.',
  );
}

const startLineEnd = html.indexOf('\n', startIdx) + 1;
const cards = loadStories().map(renderCard).join('\n');
const updated = `${html.slice(0, startLineEnd)}${cards}\n\t\t\t\t${html.slice(endIdx)}`;

writeFileSync(indexPath, updated);
console.log(`Synced story cards in ${indexPath}`);
