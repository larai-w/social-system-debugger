import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');

const dialogs = [
  ['auditModal', 'auditTitle'],
  ['introModal', 'introTitle'],
  ['sharePopModal', 'sharePopTitle'],
  ['pwaInstallModal', 'pwaInstallTitle'],
  ['shareGuideModal', 'shareGuideTitle'],
  ['feedbackModal', 'feedbackTitle'],
  ['discoveryModal', 'discoveryTitle'],
  ['scenarioModal', 'scenarioTitle'],
  ['rewindModal', 'rewindTitle'],
  ['shareCommentModal', 'shareCommentTitle'],
];

test('every non-metric dialog has an accessible name from its visible title', () => {
  for (const [dialog, title] of dialogs) {
    assert.match(
      html,
      new RegExp(`role="dialog" aria-modal="true" aria-labelledby="${title}" id="${dialog}"`)
    );
    assert.match(html, new RegExp(`id="${title}"`));
  }
});
