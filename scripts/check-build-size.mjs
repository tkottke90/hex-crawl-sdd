#!/usr/bin/env node
// T091 — Build size verification
// Run after `npm run build`. Verifies:
//   1. A Phaser chunk (phaser.[hash].js) exists in dist/assets/
//   2. All non-Phaser JS totals < 500 KB (uncompressed)
//
// Usage: node scripts/check-build-size.mjs

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distAssets = join(__dirname, '..', 'dist', 'assets');

let pass = true;

// ── Check dist/assets exists ──────────────────────────────────────────────────
let files;
try {
  files = readdirSync(distAssets);
} catch {
  console.error('✗ dist/assets/ not found — run `npm run build` first');
  process.exit(1);
}

// ── 1. Phaser chunk ───────────────────────────────────────────────────────────
const phaserChunk = files.find((f) => f.startsWith('phaser') && f.endsWith('.js'));
if (phaserChunk) {
  const sizeKB = (statSync(join(distAssets, phaserChunk)).size / 1024).toFixed(1);
  console.log(`✓ Phaser chunk present: ${phaserChunk} (${sizeKB} KB)`);
} else {
  console.error('✗ No Phaser chunk found (expected phaser.[hash].js in dist/assets/)');
  pass = false;
}

// ── 2. Initial JS bundle size (excluding Phaser) ──────────────────────────────
const LIMIT_BYTES = 500 * 1024; // 500 KB

let initialJsBytes = 0;
const counted = [];
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  if (file.startsWith('phaser')) continue; // exclude the Phaser chunk
  const size = statSync(join(distAssets, file)).size;
  initialJsBytes += size;
  counted.push({ file, sizeKB: (size / 1024).toFixed(1) });
}

for (const { file, sizeKB } of counted) {
  console.log(`  · ${file} — ${sizeKB} KB`);
}

const totalKB = (initialJsBytes / 1024).toFixed(1);
if (initialJsBytes <= LIMIT_BYTES) {
  console.log(`✓ Initial JS total: ${totalKB} KB  (limit: 500 KB)`);
} else {
  console.error(`✗ Initial JS total: ${totalKB} KB EXCEEDS 500 KB limit`);
  pass = false;
}

if (!pass) process.exit(1);
