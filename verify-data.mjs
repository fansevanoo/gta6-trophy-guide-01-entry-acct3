import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const data = JSON.parse(readFileSync(new URL('./app/data/trophies.json', import.meta.url)));
const t = data.trophies;
let passed = 0;
function check(name, fn) { try { fn(); passed++; console.log('PASS',name); } catch(e) { console.log('FAIL',name,e.message); } }
check('55 trophies',()=>assert.equal(t.length,55));
check('IDs 1–55 in order',()=>assert.deepEqual(t.map(x=>x.id),Array.from({length:55},(_,i)=>i+1)));
check('Grades 1 / 2 / 6 / 46',()=>assert.deepEqual(['Platinum','Gold','Silver','Bronze'].map(g=>t.filter(x=>x.grade===g).length),[1,2,6,46]));
check('28 hidden, 27 visible',()=>{assert.equal(t.filter(x=>x.hidden===true).length,28);assert.equal(t.filter(x=>x.hidden===false).length,27);});
check('Required fields and cited nonblank steps',()=>{for(const x of t){for(const field of ['name','description','guide','stage','confidence','grade'])assert.ok(typeof x[field]==='string'&&x[field].trim());assert.equal(typeof x.missable,'boolean');assert.ok(x.steps.length>0);assert.match(x.guide,/\[\d+\]/);for(const s of x.steps){assert.ok(s.text.trim());assert.ok(s.citations.length);for(const n of s.citations)assert.ok(Number.isInteger(n)&&n>=1&&n<=18&&data.sources.some(r=>r.id===n));}}});
check('Confidence 47 / 7 / 1; only #28 missable',()=>{assert.deepEqual(['High','Medium','Low'].map(c=>t.filter(x=>x.confidence===c).length),[47,7,1]);assert.deepEqual(t.filter(x=>x.missable).map(x=>x.id),[28]);assert.deepEqual(t.filter(x=>x.confidence==='Medium').map(x=>x.id),[25,28,44,45,49,50,51]);assert.equal(t.find(x=>x.confidence==='Low').id,29);});
check('Computed audit, 18 sources and D1–D10',()=>{assert.deepEqual(data.sources.map(s=>s.id),Array.from({length:18},(_,i)=>i+1));assert.deepEqual(data.disagreements.map(d=>d.id),Array.from({length:10},(_,i)=>'D'+(i+1)));for(const d of data.disagreements)assert.ok(d.title.trim()&&d.text.trim());for(const s of data.sources)assert.ok(s.name&&s.domain&&s.title&&s.scope);const app=readFileSync(new URL('./app/app.js',import.meta.url),'utf8');assert.ok(app.includes('tally.reduce')&&app.includes('step citations'));for(const marker of JSON.stringify(data).matchAll(/\[(\d+)\]/g))assert.ok(data.sources.some(s=>s.id===Number(marker[1])));});
const steps=t.reduce((n,x)=>n+x.steps.length,0);
const stepCitations=t.reduce((n,x)=>n+x.steps.reduce((m,s)=>m+s.citations.length,0),0);
const textMarkers=(JSON.stringify(data).match(/\[\d+\]/g)||[]).length;
const guideMarkers=t.reduce((n,x)=>n+(x.guide.match(/\[\d+\]/g)||[]).length,0);
console.log(JSON.stringify({steps,stepCitations,guideMarkers,textMarkers,totalTrophyCitationMarkers:stepCitations+guideMarkers,allCitationOccurrences:stepCitations+textMarkers}));
console.log(`${passed}/7 PASS`);
if(passed!==7)process.exitCode=1;
