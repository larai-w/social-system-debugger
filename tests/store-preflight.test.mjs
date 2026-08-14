import assert from 'node:assert/strict';
import test from 'node:test';

import { exitCode } from '../scripts/store-preflight.mjs';
import { readFileSync } from 'node:fs';

test('store preflight fails closed when any release gate is blocked', () => {
  assert.equal(exitCode([{ status: 'PASS' }]), 0);
  assert.equal(exitCode([{ status: 'PASS' }, { status: 'BLOCKED' }]), 1);
});

test('native release identifiers and weekly endpoint are fixed', () => {
  const capacitorConfig = JSON.parse(readFileSync('capacitor.config.json', 'utf8'));
  const webConfig = readFileSync('web/config.js', 'utf8');
  const scenario = readFileSync('web/js/scenario.js', 'utf8');

  assert.equal(capacitorConfig.appId, 'jp.veai.socialdebugger');
  assert.match(
    webConfig,
    /nativeContentBaseUrl:\s*["']https:\/\/d3gpx0wi0z904j\.cloudfront\.net\/content\/weekly["']/
  );
  assert.match(scenario, /IS_NATIVE_SCENARIO_RUNTIME[\s\S]+nativeContentBaseUrl/);
  assert.match(scenario, /:\s*SCENARIO_CONFIG\.contentBaseUrl/);
});
