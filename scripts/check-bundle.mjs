import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { stdout } from 'node:process';
import { URL } from 'node:url';

const manifestUrl = new URL('../dist/.vite/manifest.json', import.meta.url);
assert.ok(existsSync(manifestUrl), 'Build manifest is missing. Run npm run build first.');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
const pdfKey = Object.keys(manifest).find((key) => key.endsWith('src/lib/pdf.ts'));
assert.ok(entryKey, 'The build manifest has no application entry.');
assert.ok(pdfKey, 'The PDF extraction module is missing from the build manifest.');

const staticModules = new Set();
const dynamicModules = new Set();
function visitStatic(key) {
  if (staticModules.has(key)) return;
  staticModules.add(key);
  const item = manifest[key];
  assert.ok(item, `Manifest module ${key} is missing.`);
  for (const dependency of item.imports ?? []) visitStatic(dependency);
  for (const dependency of item.dynamicImports ?? []) dynamicModules.add(dependency);
}
visitStatic(entryKey);

assert.ok(!staticModules.has(pdfKey), 'PDF.js extraction is reachable from the initial static module graph.');
assert.ok(dynamicModules.has(pdfKey), 'PDF extraction is not a dynamic intake dependency.');
const pdfFile = manifest[pdfKey].file;
assert.ok(pdfFile && existsSync(new URL(`../dist/${pdfFile}`, import.meta.url)), 'The lazy PDF chunk was not emitted.');

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.ok(!html.includes(pdfFile), 'The initial HTML eagerly references the PDF extraction chunk.');
stdout.write(`Bundle check passed: ${pdfKey} is lazy-loaded in ${pdfFile}; initial static modules: ${staticModules.size}.\n`);
