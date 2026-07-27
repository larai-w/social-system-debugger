import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = (path) => fileURLToPath(new URL('../' + path, import.meta.url));
const campaignsDir = root('promo/campaigns');
const expectedCampaigns = [
  'page1-safe',
  'page2-classic-shock',
  'page2-resonance',
  'page2-shock-lab',
  'page2-timelapse',
  'page3-distance',
  'page4-meeting',
  'page4-outcome',
  'sector-h-characters',
  'sector-h-flow',
];

test('finished promo campaigns keep reel and X copy together', () => {
  const actualCampaigns = readdirSync(campaignsDir)
    .filter((name) => statSync(`${campaignsDir}/${name}`).isDirectory())
    .sort();

  assert.deepEqual(actualCampaigns, expectedCampaigns);

  const recorder = readFileSync(root('scripts/record-social-reels.mjs'), 'utf8');
  for (const campaign of expectedCampaigns) {
    const reelPath = `promo/campaigns/${campaign}/reel.html`;
    const post = readFileSync(`${campaignsDir}/${campaign}/post.md`, 'utf8');

    assert.ok(statSync(`${campaignsDir}/${campaign}/reel.html`).size > 0, `${reelPath} is empty`);
    assert.match(recorder, new RegExp(reelPath.replaceAll('/', '\\/')));
    assert.match(post, /https:\/\/larai-w\.github\.io\/social-system-debugger\//);
    assert.match(post, /#社会デバッガー/);
    assert.match(post, /※/);
  }
});
