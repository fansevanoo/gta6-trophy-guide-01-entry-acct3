import { chromium } from '/home/hatch/workspace/xe-sdk/node_modules/playwright-core/index.mjs';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

const shots = JSON.parse(readFileSync(new URL('./shots.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ executablePath: '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell', headless: true, args: ['--no-sandbox', '--no-zygote', '--single-process', '--allow-file-access-from-files'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
await page.goto(new URL('./app/index.html', import.meta.url).href);
await page.waitForFunction(() => window.vaultReady);
await page.evaluate(seed => { localStorage.setItem('platinum-vault-v1', JSON.stringify(seed)); }, shots.seed);
await page.reload();
await page.waitForFunction(() => window.vaultReady);
mkdirSync(new URL('./screenshots/', import.meta.url), { recursive: true });
for (const shot of shots.shots) {
  await page.click('nav [data-view="' + shot.view + '"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  const path = new URL('./screenshots/' + shot.file, import.meta.url).pathname;
  await page.screenshot({ path, type: 'jpeg', quality: shots.quality || 80, animations: 'disabled' });
  const bytes = statSync(path).size;
  if (bytes > shots.max_bytes) throw new Error(shot.file + ' exceeds ' + shots.max_bytes + ' bytes (' + bytes + ')');
  console.log(shot.file, '1280x800', bytes + ' bytes');
}
await browser.close();
