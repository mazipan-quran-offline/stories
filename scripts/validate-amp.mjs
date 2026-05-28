#!/usr/bin/env node
// Validates every AMP story page under src/ with the official amphtml-validator.
//
// Only files that declare the AMP runtime (`<html ⚡>` / `<html amp>`) are
// checked — the landing page (src/index.html) is plain HTML and is skipped.
//
// Exits non-zero if any story fails, so it can gate CI.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import amphtmlValidator from 'amphtml-validator';

const SRC = join(dirname(), 'src');

function dirname() {
  return join(fileURLToPath(import.meta.url), '..', '..');
}

/** Recursively collect every .html file under a directory. */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const isAmp = (html) => /<html[^>]*(⚡|\samp\b)/i.test(html);

const validator = await amphtmlValidator.getInstance();
let failures = 0;
let checked = 0;

for (const file of htmlFiles(SRC).sort()) {
  const html = readFileSync(file, 'utf8');
  if (!isAmp(html)) continue;
  checked += 1;

  const result = validator.validateString(html);
  const rel = file.slice(SRC.length - 3);
  if (result.status === 'PASS') {
    console.log(`PASS  ${rel}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${rel}`);
    for (const error of result.errors) {
      const loc = `${rel}:${error.line}:${error.col}`;
      const msg = `${loc} ${error.severity}: ${error.message}`;
      console.error(error.specUrl ? `${msg} (see ${error.specUrl})` : msg);
    }
  }
}

console.log(`\nValidated ${checked} AMP file(s); ${failures} failed.`);
if (failures > 0) process.exit(1);
