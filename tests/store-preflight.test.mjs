import assert from 'node:assert/strict';
import test from 'node:test';

import { exitCode } from '../scripts/store-preflight.mjs';

test('store preflight fails closed when any release gate is blocked', () => {
  assert.equal(exitCode([{ status: 'PASS' }]), 0);
  assert.equal(exitCode([{ status: 'PASS' }, { status: 'BLOCKED' }]), 1);
});
