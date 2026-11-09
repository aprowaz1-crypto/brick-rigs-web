import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { t } from '../js/i18n.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (path) => fs.readFileSync(`${root}${path}`, 'utf8');
const exists = (path) => fs.existsSync(`${root}${path}`);

const html = read('index.html');
const i18n = read('js/i18n.js');

test('every SVG sprite reference has a matching symbol', () => {
  const symbols = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]));
  const uses = [...html.matchAll(/<use href="#([^"]+)"/g)].map((match) => match[1]);
  assert.ok(symbols.size > 10);
  for (const id of uses) assert.ok(symbols.has(id), `missing symbol #${id}`);
});

test('all local page assets exist', () => {
  const refs = [...html.matchAll(/(?:href|src)="\.\/([^"#]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    assert.ok(exists(ref), `missing local asset ${ref}`);
  }
});

test('manifest icons and shortcuts point to real files', () => {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.length >= 3);
  for (const icon of manifest.icons) {
    assert.ok(exists(icon.src.replace(/^\.\//, '')), `missing icon ${icon.src}`);
  }
  for (const shortcut of manifest.shortcuts || []) {
    for (const icon of shortcut.icons || []) {
      assert.ok(exists(icon.src.replace(/^\.\//, '')), `missing shortcut icon ${icon.src}`);
    }
  }
});

test('service worker shell lists real files', () => {
  const sw = read('sw.js');
  const shell = [...sw.matchAll(/'\.\/([^']+)'/g)].map((match) => match[1]);
  assert.ok(shell.length > 10);
  for (const path of shell) assert.ok(exists(path), `missing cached file ${path}`);
});

test('every data-i18n key exists in both dictionaries', () => {
  const ukStart = i18n.indexOf('uk: {');
  const enStart = i18n.indexOf('en: {');
  const enEnd = i18n.indexOf('\n};', enStart);
  const keysFrom = (chunk) => new Set([...chunk.matchAll(/'([a-zA-Z0-9._-]+)':/g)].map((m) => m[1]));
  const uk = keysFrom(i18n.slice(ukStart, enStart));
  const en = keysFrom(i18n.slice(enStart, enEnd));

  const used = new Set();
  const attributes = [...html.matchAll(/data-i18n(?:-placeholder|-title|-aria)?="([^"]+)"/g)];
  for (const match of attributes) used.add(match[1]);

  for (const key of used) {
    assert.ok(uk.has(key), `missing Ukrainian key ${key}`);
    assert.ok(en.has(key), `missing English key ${key}`);
  }
  for (const key of uk) {
    assert.ok(en.has(key), `English dictionary is missing ${key}`);
    assert.notEqual(t(key), key, `empty translation for ${key}`);
  }
});

test('app loads the QR generator before the module entry point', () => {
  const qr = html.indexOf('vendor/qrcode.js');
  const module = html.indexOf('js/app.js');
  assert.ok(qr > 0);
  assert.ok(module > qr);
});
