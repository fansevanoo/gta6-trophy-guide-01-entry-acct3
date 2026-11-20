import { chromium } from '/home/hatch/workspace/xe-sdk/node_modules/playwright-core/index.mjs';
import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const executablePath='/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';
let browser;
try {
  browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--no-zygote','--single-process','--allow-file-access-from-files']});
} catch (error) {
  console.log('0/26 PASS · console error: NOT MEASURED · page error: NOT MEASURED');
  console.error('Browser launch failed before app initialization:', error.message.split('Call log:')[0]);
  process.exit(1);
}
const page=await browser.newPage({viewport:{width:1280,height:800},acceptDownloads:true});
const consoleErrors=[],pageErrors=[],requests=[];
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
page.on('pageerror',e=>pageErrors.push(e.message));
page.on('request',r=>requests.push(r.url()));
let passed=0;
async function check(name,fn){try{await fn();passed++;console.log('PASS',name);}catch(e){console.log('FAIL',name,e.message);}}
const hall=async name=>page.locator(`nav [data-view="${name}"]`).click();
const value=async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('platinum-vault-v1')));
await page.goto(new URL('./app/index.html',import.meta.url).href);
await page.waitForFunction(()=>window.vaultReady);
await check('01 Vault overview and audit',async()=>{assert.equal(await page.locator('h1').textContent(),'The Platinum Vault');assert.ok((await page.locator('#audit').textContent()).includes('55'));assert.equal(await page.locator('.ring').count(),1);});
for(const [i,g,n] of [[2,'Platinum',1],[3,'Gold',2],[4,'Silver',6],[5,'Bronze',46]])await check(`${String(i).padStart(2,'0')} ${g} Hall`,async()=>{await hall(g);assert.equal(await page.locator('.exhibit').count(),n);assert.equal(await page.locator('h1').textContent(),g+' Hall');});
await check('06 Grade filter',async()=>{await page.selectOption('#grade-filter','Silver');assert.equal(await page.locator('.exhibit').count(),6);assert.equal(await page.locator('h1').textContent(),'Silver Hall');await page.selectOption('#grade-filter','Bronze');assert.equal(await page.locator('.exhibit').count(),46);await page.selectOption('#grade-filter','All');});
await check('07 Search names and empty state',async()=>{await page.fill('#search','Positive Mental');assert.equal(await page.locator('.exhibit').count(),1);assert.equal(await page.locator('#detail').getAttribute('data-id'),'28');await page.fill('#search','no-such-exhibit');assert.equal(await page.locator('.exhibit').count(),0);await page.fill('#search','');});
await check('08 Hidden shield hides name description and guide',async()=>{await page.locator('[data-select="2"]').click();assert.equal(await page.locator('#reveal').count(),1);assert.ok(!(await page.locator('#detail').textContent()).includes('Gone Fishing'));assert.ok(!(await page.locator('[data-select="2"]').textContent()).includes('Just Like Paradise'));});
await check('09 Individually reveal hidden trophy',async()=>{await page.click('#reveal');assert.ok((await page.locator('#detail').textContent()).includes('Just Like Paradise'));});
await check('10 Earned hidden trophy opens automatically',async()=>{await page.locator('[data-select="3"]').click();await page.check('#earned');assert.ok((await page.locator('#detail').textContent()).includes('Paradise Lost'));assert.ok((await value()).earned.Jason.includes(3));});
await check('11 Jason / Lucia isolated progress and dual counter',async()=>{await page.click('#lucia');assert.equal(await page.locator('#reveal').count(),1);assert.equal(await page.locator('#jason-count').textContent(),'1/55');assert.equal(await page.locator('#lucia-count').textContent(),'0/55');await page.check('#earned');assert.equal(await page.locator('#lucia-count').textContent(),'1/55');await page.click('#jason');});
await check('12 Meditation dual counters persist',async()=>{await page.fill('#search','Positive Mental');await page.fill('#med-Jason','3');await page.locator('#med-Jason').press('Tab');await page.fill('#med-Lucia','2');await page.locator('#med-Lucia').press('Tab');assert.ok((await page.locator('#detail').textContent()).includes('Combined: 5 / 18'));});
for(const [i,m,n] of [[13,30,2],[14,60,4],[15,120,6]])await check(`${i} Planner ${m} minutes missable first`,async()=>{await hall('Planner');await page.click(`[data-minutes="${m}"]`);assert.equal(await page.locator('.plan-item').count(),n);assert.equal(await page.locator('.plan-item').first().getAttribute('data-plan-id'),'28');assert.equal(await page.locator(`[data-minutes="${m}"]`).getAttribute('aria-pressed'),'true');});
await check('16 Shortcut / focuses search',async()=>{await page.locator('h1').click();await page.keyboard.press('/');assert.equal(await page.locator('#search').evaluate(e=>e===document.activeElement),true);});
await check('17 Shortcut j advances exhibit',async()=>{await page.locator('h1').click();const before=await page.locator('#detail').getAttribute('data-id');await page.keyboard.press('j');assert.notEqual(await page.locator('#detail').getAttribute('data-id'),before);});
await check('18 Shortcut k returns exhibit',async()=>{const before=await page.locator('#detail').getAttribute('data-id');await page.keyboard.press('k');assert.notEqual(await page.locator('#detail').getAttribute('data-id'),before);});
await check('19 Shortcut x toggles earned',async()=>{const before=(await value()).earned.Jason.length;await page.keyboard.press('x');assert.equal((await value()).earned.Jason.length,before+1);});
await check('20 Export downloads valid JSON',async()=>{const pending=page.waitForEvent('download');await page.click('#export');const download=await pending;assert.equal(download.suggestedFilename(),'platinum-vault-save.json');const saved=JSON.parse(readFileSync(await download.path(),'utf8'));assert.equal(saved.version,1);assert.ok(saved.earned.Jason.length);});
await check('21 Import restores collection',async()=>{const restore=await value();restore.earned.Jason=[2,3,4,5,6];await page.setInputFiles('#import',{name:'restore.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(restore))});await page.waitForFunction(()=>JSON.parse(localStorage.getItem('platinum-vault-v1')).earned.Jason.length===5);assert.equal(await page.locator('#jason-count').textContent(),'5/55');});
await check('22 Copy link hash restores after reload',async()=>{await page.click('#share');assert.ok(page.url().includes('#vault='));await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForFunction(()=>window.vaultReady);assert.equal((await value()).earned.Jason.length,5);assert.equal((await value()).meditation.Lucia,2);});
await check('23 Progress ring updates with checklist',async()=>{await hall('Vault');const before=Number(await page.locator('.ring').getAttribute('aria-valuenow'));await page.click('[data-open="28"]');await page.check('#earned');await hall('Vault');assert.equal(Number(await page.locator('.ring').getAttribute('aria-valuenow')),before+1);});
await check('24 Sources, D1–D10, citations, kind filters and spoiler toggle',async()=>{await hall('Sources');assert.equal(await page.locator('.source-row').count(),18);assert.equal(await page.locator('.disagreement').count(),10);assert.equal(await page.locator('.confidence-labels strong').allTextContents().then(x=>x.join('/')),'47/7/1');await hall('Bronze');await page.selectOption('#kind-filter','Missable');assert.equal(await page.locator('.exhibit').count(),1);await page.selectOption('#kind-filter','Online');assert.equal(await page.locator('.exhibit').count(),0);await page.selectOption('#kind-filter','All');await page.check('#spoilers');assert.equal(await page.locator('.exhibit h3', {hasText:'Sealed exhibit'}).count(),0);await page.locator('[data-select="28"]').click();await page.locator('#detail [data-source="4"]').first().click();assert.equal(await page.locator('#page-title').textContent(),'Sources & confidence');assert.equal(await page.evaluate(()=>document.activeElement.id),'source-4');assert.ok(requests.every(u=>u.startsWith('file:')||u.startsWith('blob:')));});
await check('25 Zero console errors',async()=>assert.deepEqual(consoleErrors,[]));
await check('26 Zero page errors',async()=>assert.deepEqual(pageErrors,[]));
console.log(`${passed}/26 PASS · ${consoleErrors.length} console error · ${pageErrors.length} page error`);
if(consoleErrors.length)console.log(consoleErrors);if(pageErrors.length)console.log(pageErrors);
await browser.close();
if(passed!==26)process.exitCode=1;
