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
// Canonical start marker — re-asserted on every run so the "do not edit"
// warning can't be weakened or lost by a manual edit.
const START_MARKER =
  '<!-- stories:start — DO NOT EDIT cards below by hand; they are generated. Edit content.json, then run `pnpm run generate:index`. -->';

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Inline SVGs reused across every card (kept here so the generated markup
// matches the hand-written template exactly).
const ICON_BOOK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
const ICON_ARROW =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';

function renderCard(story) {
  return `				<li class="card">
					<a class="card-link" href="/stories/${story.slug}/">
						<span class="card-cover" style="background-image: ${story.gradient};" aria-hidden="true">
							<span class="badge">${ICON_BOOK}</span>
						</span>
						<span class="card-content">
							<time class="card-date">${formatDateID(story.publishedDate)}</time>
							<h3 class="card-title">${escapeHtml(story.title)}</h3>
							<p class="card-desc">${escapeHtml(story.description)}</p>
							<span class="card-cta">Baca cerita ${ICON_ARROW}</span>
						</span>
					</a>
				</li>`;
}

const indexPath = join(REPO_ROOT, 'src', 'index.html');
const html = readFileSync(indexPath, 'utf8');

const startIdx = html.indexOf(START);
// Always look for the end marker *after* the start marker, so the whole region
// between them is replaced regardless of what was hand-edited in there.
const endIdx = startIdx === -1 ? -1 : html.indexOf(END, startIdx);
if (startIdx === -1 || endIdx === -1) {
  throw new Error(
    `Could not find the "stories:start"/"stories:end" markers in ${indexPath}. ` +
      'Make sure both marker comments exist inside <ul class="cards">.',
  );
}

// Re-assert the canonical start marker (preserving its indentation), discard
// everything between the markers (any manual edits), and re-emit the cards from
// content.json. The end marker line is kept as-is.
const lineStart = html.lastIndexOf('\n', startIdx) + 1;
const indent = html.slice(lineStart, startIdx);
const cards = loadStories().map(renderCard).join('\n');
const updated = `${html.slice(0, lineStart)}${indent}${START_MARKER}\n${cards}\n${indent}${html.slice(endIdx)}`;

writeFileSync(indexPath, updated);
console.log(`Synced story cards in ${indexPath}`);
