#!/usr/bin/env node
/**
 * Ejecuta todos los test/*.test.js (compatible Windows + Linux CI).
 * npm no expande globs en todos los shells.
 */
const { readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const root = join(__dirname, '..');
const testDir = join(root, 'test');

const files = readdirSync(testDir)
  .filter((name) => name.endsWith('.test.js'))
  .sort()
  .map((name) => join(testDir, name));

if (files.length === 0) {
  console.error('[test] No hay archivos en test/*.test.js');
  process.exit(1);
}

const tsxBin = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx'
);

const result = spawnSync(
  tsxBin,
  ['--import', './test/setup.js', '--test', ...files],
  {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32'
  }
);

if (result.error) {
  console.error('[test]', result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);
