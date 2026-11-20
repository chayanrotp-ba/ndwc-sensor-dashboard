import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const exactUrl = pathToFileURL(resolve('src/components/Exact.js')).href;

test('stale or malformed browser storage cannot stop the dashboard module from loading', () => {
  const script = `
    const values = new Map([
      ['ndwc.station-thresholds.v2', JSON.stringify({ types: [], stations: 'legacy' })],
      ['ndwc.rain-name-lists.v1', '{broken-json'],
      ['ddpm_masterdata_levelnames_split_v5', '{broken-json'],
      ['ndwc.warning-ddpm.v1', JSON.stringify([])],
    ]);
    globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    await import(${JSON.stringify(exactUrl)});
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
