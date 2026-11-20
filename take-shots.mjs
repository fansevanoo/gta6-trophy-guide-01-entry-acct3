import { chromium } from '/home/hatch/workspace/xe-sdk/node_modules/playwright-core/index.mjs';
import { mkdirSync, statSync, readFileSync } from 'node:fs';

const browser=await chromium.launch({executablePath:'/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox','--no-zygote','--single-process','--allow-file-access-from-files']});
const page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
await page.goto(new URL('./app/index.html',import.meta.url).href);
await page.waitForFunction(()=>window.vaultReady);
await page.evaluate(()=>{localStorage.setItem('platinum-vault-v1',JSON.stringify({version:1,character:'Jason',earned:{Jason:[2,3,4,5,6,8,9,10,11,12,13,16,20,21],Lucia:[2,3,8,16,20,21]},meditation:{Jason:5,Lucia:3},revealed:[],spoilers:false,view:'Vault',selected:28,minutes:60}));});
await page.reload();await page.waitForFunction(()=>window.vaultReady);
mkdirSync(new URL('./screenshots/',import.meta.url),{recursive:true});
async function shot(file){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:new URL('./screenshots/'+file,import.meta.url).pathname,type:'png',animations:'disabled'});const buffer=readFileSync(new URL('./screenshots/'+file,import.meta.url));const width=buffer.readUInt32BE(16),height=buffer.readUInt32BE(20),bytes=buffer.length;if(width!==1280||height!==800||bytes>262144)throw Error(file+' exceeds screenshot limits');console.log(file,width+'×'+height,bytes+' bytes');}
await shot('01-vault-overview.png');
await page.click('nav [data-view="Silver"]');await page.click('[data-select="17"]');
await shot('02-hall-tracker.png');
await page.click('nav [data-view="Vault"]');await page.click('[data-open="28"]');
await page.selectOption('#kind-filter','Missable');
await shot('03-exhibit-28.png');
await page.click('nav [data-view="Sources"]');
await shot('04-sources-confidence.png');
await browser.close();
