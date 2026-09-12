import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../web/index.html', import.meta.url), 'utf8');
const ui = await readFile(new URL('../web/js/ui.js', import.meta.url), 'utf8');

test('feedback submission results are announced through a polite status region', () => {
  assert.match(html, /id="fbStatus" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(
    ui,
    /status\.textContent=tt\('✓ 送信しました。ありがとうございます','✓ Sent\. Thank you!'\)/
  );
  assert.match(
    ui,
    /status\.textContent=tt\('送信に失敗しました。時間をおいて再度お試しください','Sending failed\. Please try again later\.'/
  );
});

test('researcher links use a named disclosure control and semantic hidden state', () => {
  assert.match(html, /id="fbResearcher" aria-controls="fbDevTop"/);
  assert.match(html, /id="fbDevTop" hidden/);
  assert.match(ui, /if\(top\)top\.hidden=!researcherMode;/);
  assert.match(ui, /if\(note\)note\.hidden=researcherMode;/);
});

test('feedback type radio buttons have a shared native group label', () => {
  assert.match(html, /<fieldset style="border:0;padding:0;margin:0 0 12px">/);
  assert.match(
    html,
    /<legend class="pd" style="margin-bottom:5px" data-i18n="fb_type_label">種別<\/legend>/
  );
  assert.match(html, /<input type="radio" name="fbType" value="improvement" checked>/);
  assert.match(html, /<input type="radio" name="fbType" value="bug">/);
  assert.match(html, /<input type="radio" name="fbType" value="other">/);
});
