import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Absolute path to the repository root. */
export const REPO_ROOT = ROOT;

/** Read and parse the content single-source-of-truth. */
export function loadContent() {
  const raw = readFileSync(join(ROOT, 'content.json'), 'utf8');
  return JSON.parse(raw);
}

/** Stories sorted newest-first by publishedDate. */
export function loadStories() {
  const { stories } = loadContent();
  return [...stories].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

/** Format an ISO date (YYYY-MM-DD) as an Indonesian date, e.g. "02 Juli 2020". */
export function formatDateID(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${String(day).padStart(2, '0')} ${MONTHS_ID[month - 1]} ${year}`;
}
