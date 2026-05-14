/**
 * build-header.mjs
 * Injects the common header template (templates/_header.html) into every
 * HTML file in the project.  Run before deploy so one edit propagates
 * to all pages automatically.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = join(__dirname, '..');

// ── load template ────────────────────────────────────────────────────────────
const headerHtml = readFileSync(
  join(ROOT, 'templates/_header.html'),
  'utf8'
).trim();

// ── collect all .html files (recursive) ─────────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', '.git', 'templates']);

function collectHtml(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) results.push(...collectHtml(join(dir, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

// also inject into template files (blog/news/works detail templates)
function collectTemplates(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.html') && !e.name.startsWith('_'))
    .map(e => join(dir, e.name));
}

const staticFiles   = collectHtml(ROOT);
const templateFiles = collectTemplates(join(ROOT, 'templates'));
const allFiles      = [...staticFiles, ...templateFiles];

// ── regex to match existing <header class="site-header">…</header> ──────────
// Uses [\s\S]*? for multiline lazy match
const HEADER_RE = /<header class="site-header">[\s\S]*?<\/header>/;

// ── inject ───────────────────────────────────────────────────────────────────
let updated = 0;
let skipped = 0;

for (const filePath of allFiles) {
  const rel     = relative(ROOT, filePath);
  const content = readFileSync(filePath, 'utf8');

  if (!HEADER_RE.test(content)) {
    console.log(`  skip  (no header): ${rel}`);
    skipped++;
    continue;
  }

  const next = content.replace(HEADER_RE, headerHtml);
  if (next === content) {
    console.log(`  same             : ${rel}`);
    continue;
  }

  writeFileSync(filePath, next, 'utf8');
  console.log(`  updated          : ${rel}`);
  updated++;
}

console.log(`\nDone — ${updated} file(s) updated, ${skipped} skipped.`);
