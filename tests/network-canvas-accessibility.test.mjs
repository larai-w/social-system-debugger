import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');

test('network canvases expose a named graphic and their existing state text', () => {
  for (const [canvas, heading, states] of [
    ['agentCanvas', 'agentCanvasHeading', 'agSt1 agSt2'],
    ['p3Canvas', 'p3CanvasHeading', 'p3St1 p3St2'],
    ['p4Canvas', 'p4CanvasHeading', 'p4St1 p4St2'],
  ]) {
    assert.match(
      html,
      new RegExp(
        `id="${canvas}" role="img" aria-labelledby="${heading}" aria-describedby="${states}"`
      )
    );
    assert.match(html, new RegExp(`id="${heading}"`));
  }
});
