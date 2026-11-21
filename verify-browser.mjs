import { chromium } from '/home/hatch/workspace/xe-sdk/node_modules/playwright-core/index.mjs';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const executablePath = '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
let browser;
try {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox', '--no-zygote', '--single-process', '--allow-file-access-from-files'] });
} catch (error) {
  console.log('0/26 PASS · console error: NOT MEASURED · page error: NOT MEASURED');
  console.error('Browser launch failed before app initialization:', error.message.split('Call log:')[0]);
  process.exit(1);
}
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
const consoleErrors = [], pageErrors = [], requests = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(e.message));
page.on('request', r => requests.push(r.url()));
let passed = 0;
async function check(name, fn) { try { await fn(); passed++; console.log('PASS', name); } catch (e) { console.log('FAIL', name, e.message); } }
const view = async name => page.locator('nav [data-view="' + name + '"]').click();
const value = async () => page.evaluate(() => JSON.parse(localStorage.getItem('platinum-vault-v1')));
await page.goto(new URL('./app/index.html', import.meta.url).href);
await page.waitForFunction(() => window.vaultReady);
await check('01 Tracker overview and audit', async () => {
  assert.equal(await page.locator('h1').textContent(), 'The Platinum Vault');
  assert.ok((await page.locator('#audit').textContent()).includes('55/55 official'));
  assert.equal(await page.locator('.ring').count(), 1);
  assert.equal(await page.locator('#earned-count').textContent(), '0 / 55 earned');
  assert.ok((await page.locator('.saved').textContent()).includes('SAVED IN THIS BROWSER'));
});
await check('02 Grade chips filter the list', async () => {
  await page.locator('[data-chip="P"]').click(); assert.equal(await page.locator('.trophy').count(), 1);
  await page.locator('[data-chip="G"]').click(); assert.equal(await page.locator('.trophy').count(), 2);
  await page.locator('[data-chip="S"]').click(); assert.equal(await page.locator('.trophy').count(), 6);
  await page.locator('[data-chip="B"]').click(); assert.equal(await page.locator('.trophy').count(), 46);
  await page.locator('[data-chip="all"]').click(); assert.equal(await page.locator('.trophy').count(), 55);
});
await check('03 Kind filter select', async () => {
  await page.selectOption('#kind-filter', 'Missable'); assert.equal(await page.locator('.trophy').count(), 1);
  await page.selectOption('#kind-filter', 'Online'); assert.equal(await page.locator('.trophy').count(), 0);
  await page.selectOption('#kind-filter', 'Story'); assert.equal(await page.locator('.trophy').count(), 12);
  await page.selectOption('#kind-filter', 'All');
});
await check('04 Search names and empty state', async () => {
  await page.fill('#search', 'Positive Mental'); assert.equal(await page.locator('.trophy').count(), 1);
  assert.equal(await page.locator('#detail').getAttribute('data-id'), '28');
  await page.fill('#search', 'no-such-trophy'); assert.equal(await page.locator('.trophy').count(), 0);
  await page.fill('#search', '');
});
await check('05 Hidden shield hides name description and guide', async () => {
  await page.locator('[data-select="2"]').click();
  assert.equal(await page.locator('#reveal').count(), 1);
  assert.ok(!(await page.locator('#detail').textContent()).includes('Gone Fishing'));
  assert.ok(!(await page.locator('[data-select="2"]').textContent()).includes('Just Like Paradise'));
});
await check('06 Individually reveal hidden trophy', async () => {
  await page.click('#reveal');
  assert.ok((await page.locator('#detail').textContent()).includes('Just Like Paradise'));
});
await check('07 Earned hidden trophy opens automatically', async () => {
  await page.locator('[data-select="3"]').click();
  await page.check('#earned');
  assert.ok((await page.locator('#detail').textContent()).includes('Paradise Lost'));
  assert.ok((await value()).earned.Jason.includes(3));
});
await check('08 Jason / Lucia isolated progress', async () => {
  await page.click('#lucia');
  assert.equal(await page.locator('#jason-count').textContent(), '1/55');
  assert.equal(await page.locator('#lucia-count').textContent(), '0/55');
  await page.locator('[data-select="3"]').click();
  await page.check('#earned');
  assert.equal(await page.locator('#lucia-count').textContent(), '1/55');
  await page.click('#jason');
});
await check('09 Meditation dual counters persist', async () => {
  await page.fill('#search', 'Positive Mental');
  await page.fill('#med-Jason', '3'); await page.locator('#med-Jason').press('Tab');
  await page.fill('#med-Lucia', '2'); await page.locator('#med-Lucia').press('Tab');
  assert.ok((await page.locator('#detail').textContent()).includes('Combined: 5 / 18'));
});
for (const [i, m, n] of [[10, 30, 2], [11, 60, 4], [12, 120, 6]]) await check(`${i} Planner ${m} minutes missable first`, async () => {
  await view('Planner'); await page.click('[data-minutes="' + m + '"]');
  assert.equal(await page.locator('.plan-item').count(), n);
  assert.equal(await page.locator('.plan-item').first().getAttribute('data-plan-id'), '28');
  assert.equal(await page.locator('[data-minutes="' + m + '"]').getAttribute('aria-pressed'), 'true');
});
await check('13 Shortcut / focuses search', async () => {
  await view('Tracker');
  await page.fill('#search', '');
  await page.locator('h1').click(); await page.keyboard.press('/');
  assert.equal(await page.locator('#search').evaluate(e => e === document.activeElement), true);
});
await check('14 Shortcut j advances trophy', async () => {
  await view('Tracker'); await page.locator('h1').click();
  const before = await page.locator('#detail').getAttribute('data-id');
  await page.keyboard.press('j');
  assert.notEqual(await page.locator('#detail').getAttribute('data-id'), before);
});
await check('15 Shortcut k returns trophy', async () => {
  const before = await page.locator('#detail').getAttribute('data-id');
  await page.keyboard.press('k');
  assert.notEqual(await page.locator('#detail').getAttribute('data-id'), before);
});
await check('16 Shortcut x toggles earned', async () => {
  const before = (await value()).earned.Jason.length;
  await page.keyboard.press('x');
  assert.equal((await value()).earned.Jason.length, before + 1);
});
await check('17 Export downloads valid JSON', async () => {
  const pending = page.waitForEvent('download');
  await page.click('#export');
  const download = await pending;
  assert.equal(download.suggestedFilename(), 'platinum-vault-save.json');
  const saved = JSON.parse(readFileSync(await download.path(), 'utf8'));
  assert.equal(saved.version, 1);
  assert.ok(saved.earned.Jason.length);
});
await check('18 Import restores collection', async () => {
  const restore = await value();
  restore.earned.Jason = [2, 3, 4, 5, 6];
  await page.setInputFiles('#import', { name: 'restore.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(restore)) });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('platinum-vault-v1')).earned.Jason.length === 5);
  assert.equal(await page.locator('#jason-count').textContent(), '5/55');
});
await check('19 Copy link hash restores after reload', async () => {
  await page.click('#share');
  assert.ok(page.url().includes('#vault='));
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForFunction(() => window.vaultReady);
  assert.equal((await value()).earned.Jason.length, 5);
  assert.equal((await value()).meditation.Lucia, 2);
});
await check('20 Progress ring updates with checklist', async () => {
  await view('Tracker');
  const before = Number(await page.locator('.ring').getAttribute('aria-valuenow'));
  await page.locator('[data-open="28"]').click();
  await page.check('#earned');
  assert.equal(Number(await page.locator('.ring').getAttribute('aria-valuenow')), before + 1);
});
await check('21 Sources, D1-D10, citations, kind filters and spoiler toggle', async () => {
  await view('Sources');
  assert.equal(await page.locator('#sources-view .source-row').count(), 18);
  assert.equal(await page.locator('#sources-view .disagreement').count(), 10);
  assert.equal(await page.locator('.confidence-labels strong').textContent(), '47/7/1');
  await view('Tracker');
  await page.selectOption('#kind-filter', 'Missable'); assert.equal(await page.locator('.trophy').count(), 1);
  await page.selectOption('#kind-filter', 'Online'); assert.equal(await page.locator('.trophy').count(), 0);
  await page.selectOption('#kind-filter', 'All');
  await page.check('#spoilers');
  assert.equal(await page.locator('.trophy .masked').count(), 0);
  await page.locator('[data-select="28"]').click();
  await page.locator('#detail [data-source="4"]').first().click();
  assert.equal(await page.locator('#page-title').textContent(), 'Sources');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'source-4');
  assert.ok(requests.every(u => u.startsWith('file:') || u.startsWith('blob:')));
});
await check('22 Roadmap phases and 7 chapters', async () => {
  await view('Roadmap');
  assert.equal(await page.locator('.phase').count(), 3);
  assert.equal(await page.locator('.chapter-index li').count(), 7);
  assert.ok((await page.locator('[data-panel="Roadmap"]').textContent()).includes('200 hours'));
});
await check('23 Missables tiers and points of no return', async () => {
  await view('Missables');
  assert.equal(await page.locator('.missable-card').count(), 8);
  assert.ok((await page.locator('[data-panel="Missables"]').textContent()).includes('before Tourist Trap'));
});
await check('24 Journal lists all 55 across 7 chapters', async () => {
  await view('Journal');
  assert.equal(await page.locator('.chapter').count(), 7);
  const total = await page.evaluate(() => Array.from(document.querySelectorAll('.chapter ol li')).length);
  assert.equal(total, 55);
});
await check('25 Zero console errors', async () => assert.deepEqual(consoleErrors, []));
await check('26 Zero page errors', async () => assert.deepEqual(pageErrors, []));
console.log(`${passed}/26 PASS · ${consoleErrors.length} console error · ${pageErrors.length} page error`);
if (consoleErrors.length) console.log(consoleErrors);
if (pageErrors.length) console.log(pageErrors);
await browser.close();
if (passed !== 26) process.exitCode = 1;
