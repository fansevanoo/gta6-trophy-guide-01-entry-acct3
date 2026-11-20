/* The Platinum Vault: independent, local-first collection ledger. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const grades = ['Platinum', 'Gold', 'Silver', 'Bronze'];
  const key = 'platinum-vault-v1';
  const fresh = () => ({version:1, character:'Jason', earned:{Jason:[],Lucia:[]}, meditation:{Jason:0,Lucia:0}, revealed:[], spoilers:false, view:'Vault', selected:28, minutes:30});
  let state = fresh(), data, query = '', kind = 'All', grade = 'All';
  const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid = s => s && s.version === 1 && ['Jason','Lucia'].includes(s.character) && s.earned && ['Jason','Lucia'].every(c => Array.isArray(s.earned[c]) && s.earned[c].every(n => Number.isInteger(n) && n >= 1 && n <= 55)) && ['Vault','Planner','Sources',...grades].includes(s.view) && Array.isArray(s.revealed) && s.revealed.every(n => Number.isInteger(n) && n >= 1 && n <= 55) && [30,60,120].includes(s.minutes) && Number.isInteger(s.selected) && s.selected >= 1 && s.selected <= 55 && typeof s.spoilers === 'boolean' && s.meditation && ['Jason','Lucia'].every(c => Number.isInteger(s.meditation[c]) && s.meditation[c] >= 0 && s.meditation[c] <= 18);
  const done = t => state.earned[state.character].includes(t.id);
  const shielded = t => t.hidden && !state.spoilers && !done(t) && !state.revealed.includes(t.id);
  const count = c => state.earned[c].length;
  const refs = nums => nums.map(n => `<button class="citation" data-source="${n}" aria-label="Read source ${n}">[${n}]</button>`).join('');
  const citeText = text => esc(text).replace(/\[(\d+)\]/g, (_, n) => refs([Number(n)]));
  const title = t => shielded(t) ? 'Sealed exhibit' : esc(t.name);
  function notify(text) { $('#toast').textContent = text; $('#toast').classList.add('visible'); setTimeout(() => $('#toast').classList.remove('visible'), 2600); }
  function persist() { try { localStorage.setItem(key, JSON.stringify(state)); } catch { notify('Device storage unavailable. Export a save before closing.'); } }
  function restoreHash() {
    if (!location.hash.startsWith('#vault=')) return;
    try { const incoming = JSON.parse(decodeURIComponent(location.hash.slice(7))); if (!valid(incoming)) throw Error(); state = incoming; persist(); }
    catch { notify('Collection link could not be restored. Your local save is intact.'); }
  }
  function go(view) { state.view = view; query = ''; kind = 'All'; grade = 'All'; persist(); render(); window.scrollTo(0,0); }
  function openExhibit(id) { const t = data.trophies.find(t => t.id === id); state.selected = id; state.view = t.grade; query = ''; kind = 'All'; grade = 'All'; persist(); render(); window.scrollTo(0,0); }
  function setEarned(id) {
    const list = state.earned[state.character];
    state.earned[state.character] = list.includes(id) ? list.filter(n => n !== id) : [...list,id];
    persist(); render();
  }
  function progress() {
    const n = count(state.character), p = Math.round(n / 55 * 100);
    return `<section class="panel progress-panel"><p class="eyebrow">${state.character.toUpperCase()}'S COLLECTION</p><div class="ring" role="progressbar" aria-label="Trophies earned" aria-valuenow="${n}" aria-valuemin="0" aria-valuemax="55" style="--progress:${n/55*100}"><div class="ring-inner"><strong>${n}<span style="font-size:19px;color:var(--muted)"> / 55</span></strong><small>${p}% SECURED</small></div></div><p class="time-note">~${Math.round(200*(55-n)/55)} hours remaining*</p><div class="grade-breakdown">${grades.map(g => `<div class="grade-line"><span class="${g.toLowerCase()}"><i class="swatch"></i>${g}</span><span>${data.trophies.filter(t => t.grade===g && done(t)).length} / ${data.trophies.filter(t=>t.grade===g).length}</span></div>`).join('')}</div></section>`;
  }
  function confidence() { return `<p class="eyebrow">EVIDENCE, NOT GUESSWORK</p><h2>Know what is certain.</h2><div class="confidence-bar" aria-label="47 High, 7 Medium, 1 Low"></div><div class="confidence-labels">${['High','Medium','Low'].map(c => `<div><strong>${data.trophies.filter(t=>t.confidence===c).length}</strong> <span>${c}</span></div>`).join('')}</div>`; }
  const cup = `<svg viewBox="0 0 160 185" aria-hidden="true"><defs><linearGradient id="metal"><stop stop-color="#7f8e9f"/><stop offset=".28" stop-color="#e4eaf2"/><stop offset=".52" stop-color="#a1adbf"/><stop offset=".72" stop-color="#eff3fa"/><stop offset="1" stop-color="#64768b"/></linearGradient></defs><path fill="none" stroke="url(#metal)" stroke-width="7" d="M43 36H22v21c0 24 17 35 38 35m57-56h21v21c0 24-17 35-38 35"/><path fill="url(#metal)" stroke="#d6e0eb" d="M42 22h76l-5 45c-2 25-19 37-28 39v23l18 11v10H57v-10l18-11v-23C63 102 48 88 46 67z"/><path fill="#172638" stroke="#d8c18e" d="M54 150h52v13H54zM44 163h72v10H44z"/><path fill="#c5ab6e" d="m80 42 6 14 16 2-12 10 3 16-13-8-13 8 3-16-12-10 16-2z"/><path stroke="#fff9" d="M50 27h60M51 34l4 30"/></svg>`;
  function vault() {
    return `<div class="vault-grid">${progress()}<section class="panel centerpiece"><p class="eyebrow">THE CROWN OF THE COLLECTION</p><span class="case-number">EXHIBIT 001 · PLATINUM</span><div class="trophy-art">${cup}</div><div class="plinth"></div><h2>Vice Got a Price!</h2><p>Congratulations! You're a Leonida Legend.</p><button class="text-button" data-open="1">Explore the platinum exhibit →</button></section><section class="panel risk-panel"><p class="eyebrow">CURATOR'S PRIORITY</p><span class="tag">01 POSSIBLE MISSABLE</span><h3>A quiet moment.<br>A permanent risk.</h3><p>Before leaving Chapter 1, join Lucia for the balcony meditation at Jason's house.</p><p>The requirement is disputed. Take the minute. Keep the save. ${refs([1,4,5,8])}</p><button data-open="28">View Positive Mental Attitude ↗</button></section></div><div class="below-grid"><section class="panel"><div class="section-label"><h2>Enter the halls</h2><span class="source-ref">55 exhibits · 4 collections</span></div><div class="hall-doors">${grades.map((g,i)=>`<button class="door ${g.toLowerCase()}" data-go="${g}"><b>0${i+1} <span style="float:right;font-size:25px;color:inherit">♜</span></b><span>${g} Hall</span><small>${data.trophies.filter(t=>t.grade===g).length} ${i===0?'masterpiece':'exhibits'} →</small></button>`).join('')}</div></section><section class="panel">${confidence()}<button class="text-button" data-go="Sources" style="margin-top:18px">18 sources. 10 disagreements. Full disclosure →</button></section></div><p class="source-ref">*Planning estimate: ~200 h total; up to 300 h per Push Square. Remaining time is a simple trophy-weighted estimate, not a gameplay prediction. ${refs([1,3,4])}</p>`;
  }
  function toolbar() { return `<div class="toolbar"><input id="search" type="search" placeholder="Search this hall…  /" aria-label="Search collection" value="${esc(query)}"><select id="grade-filter" aria-label="Filter grade"><option>All</option>${grades.map(g=>`<option ${grade===g?'selected':''}>${g}</option>`).join('')}</select><select id="kind-filter" aria-label="Filter kind">${['All','Story','Missable','Collectibles','Activities','Strangers','Crime','Misc','Money','Online','Unearned'].map(k=>`<option ${kind===k?'selected':''}>${k}</option>`).join('')}</select><label><input type="checkbox" id="spoilers" ${state.spoilers?'checked':''}> Reveal spoilers</label></div>`; }
  function filtered() {
    return data.trophies.filter(t => t.grade === state.view && (grade === 'All' || grade === t.grade) && (kind === 'All' || (kind === 'Missable' ? t.missable : kind === 'Unearned' ? !done(t) : t.stage.startsWith(kind))) && (!query || (!shielded(t) && (t.name+' '+t.description+' '+t.stage).toLowerCase().includes(query.toLowerCase()))));
  }
  function detail(t) {
    if (shielded(t)) return `<section class="panel detail" id="detail" data-id="${t.id}"><p class="eyebrow">EXHIBIT ${String(t.id).padStart(3,'0')} · ${t.grade.toUpperCase()}</p><div class="shield"><div class="lock">◇</div><h2>A story worth protecting.</h2><p>This hidden trophy's name, description and guide<br>stay sealed until you earn it or choose to reveal it.</p><button id="reveal">Open this exhibit</button></div><label class="earned-control"><input id="earned" type="checkbox"> Earned by ${state.character}</label></section>`;
    const completion = t.id===14 ? `<details class="completion"><summary>Open the full 100% completion inventory</summary><p class="source-ref">Targets from the supplied research ${refs([1,4,8])}. Use the in-game completion menu as the live authority.</p><ul>${data.completionChecklist.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></details>` : '';
    return `<section class="panel detail" id="detail" data-id="${t.id}"><p class="eyebrow">EXHIBIT ${String(t.id).padStart(3,'0')} / ${t.grade.toUpperCase()} HALL</p>${t.missable?'<span class="tag">POSSIBLE MISSABLE · SAVE IN CHAPTER 1</span>':''}<h2>${esc(t.name)}</h2><p class="description">${esc(t.description)}</p><div class="metadata"><span>${esc(t.stage)}</span><span>${t.confidence} confidence</span><span>${t.hidden?'Hidden':'Visible'} trophy</span></div><p class="eyebrow">ACQUISITION NOTES</p><ol>${t.steps.map(s=>`<li>${esc(s.text)} ${refs(s.citations)}</li>`).join('')}</ol><p class="curator-note">${citeText(t.guide)}</p>${completion}${t.id===28?`<div class="metadata"><label>Jason meditations <input id="med-Jason" aria-label="Jason meditation count" type="number" min="0" max="18" value="${state.meditation.Jason}" style="width:53px"></label><label>Lucia meditations <input id="med-Lucia" aria-label="Lucia meditation count" type="number" min="0" max="18" value="${state.meditation.Lucia}" style="width:53px"></label><span>Combined: ${state.meditation.Jason+state.meditation.Lucia} / 18 credits</span></div>`:''}<label class="earned-control"><input id="earned" type="checkbox" ${done(t)?'checked':''}> ${done(t)?'Secured':'Mark earned'} by ${state.character} <span style="margin-left:auto"><kbd>x</kbd></span></label></section>`;
  }
  function hall() {
    const list = filtered();
    if (!list.some(t => t.id === state.selected) && list.length) state.selected = list[0].id;
    return `${toolbar()}<div class="hall-layout"><div><div class="section-label"><span class="eyebrow">${state.view.toUpperCase()} COLLECTION</span><span class="source-ref">${list.length} exhibits · ${data.trophies.filter(t=>t.grade===state.view&&done(t)).length} secured</span></div><div class="exhibit-list" aria-label="Exhibits">${list.length?list.map(t=>`<button class="exhibit ${state.selected===t.id?'active':''}" data-select="${t.id}"><span class="medal">${shielded(t)?'◇':'♜'}</span><span><span class="exhibit-no">NO. ${String(t.id).padStart(3,'0')} · ${t.grade.toUpperCase()}</span><h3>${title(t)}</h3><p>${shielded(t)?'Hidden trophy · spoiler shield active':esc(t.description)}</p></span><span class="check-sign">${done(t)?'✓':'›'}</span></button>`).join(''):'<p class="empty">No exhibits match these filters.</p>'}</div><p class="source-ref">${state.character}: ${count(state.character)} / 55 secured · Saved locally<br><kbd>j</kbd> next · <kbd>k</kbd> previous · <kbd>x</kbd> mark earned</p></div>${list.length?detail(data.trophies.find(t=>t.id===state.selected)):'<div class="panel empty">Try another search or kind.</div>'}</div>`;
  }
  function planner() {
    const candidates = data.trophies.filter(t=>!done(t)).sort((a,b)=>Number(b.missable)-Number(a.missable)||a.id-b.id);
    const picks = candidates.slice(0, state.minutes===30?2:state.minutes===60?4:6);
    return `<div class="planner-grid"><section class="panel"><p class="eyebrow">A SESSION WITH PURPOSE</p><h2>Reserve your next run.</h2><p class="source-ref">A suggested queue, not a promise of unlock time. Protect the missable first.</p><div class="duration" role="group" aria-label="Session duration">${[30,60,120].map(m=>`<button data-minutes="${m}" aria-pressed="${state.minutes===m}">${m} min</button>`).join('')}</div><div id="plan-list">${picks.map((t,i)=>`<article class="plan-item" data-plan-id="${t.id}"><span class="number">0${i+1}</span><div>${t.missable?'<span class="tag">DO FIRST · CHAPTER 1</span>':''}<h3>${title(t)}</h3><p>${shielded(t)?'Protected story objective':esc(t.stage)} · ${t.confidence} confidence</p></div><button data-open="${t.id}">View ↗</button></article>`).join('')||'<p>Collection complete. Enjoy the vault.</p>'}</div></section><section class="panel roadmap"><p class="eyebrow">THE ROAD TO PLATINUM</p><h2>One playthrough. Four halls.</h2><div class="metadata"><span>~200 h</span><span>4/10 difficulty</span><span>0 online</span></div><div class="road-step"><h3>01 / Story & the balcony</h3><p>60–80 h. Follow the story, optional missions, vehicle scans and animal studies. Protect #28 in Chapter 1. ${refs([1,4,8])}</p></div><div class="road-step"><h3>02 / Complete the collection</h3><p>~100 h. Use Progress > Stats > 100% Completion, including 70 of 80 challenges. Story progress carries over. ${refs([1,4,8])}</p></div><div class="road-step"><h3>03 / The final exhibits</h3><p>~10 h. Finish stranger strands and miscellaneous trophies in free roam. ${refs([1,4,8])}</p></div><p class="curator-note">15 manual saves + autosave. Keep chapter-start and chapter-end saves. No mission replay or New Game+. Cheats disable trophies and saving. Keep them off. ${refs([1,3,4,5])}</p><p class="source-ref">The estimates are approximate and do not sum to a guaranteed runtime. D2 records estimates up to 300 h.</p></section></div>`;
  }
  function sources() { return `<div class="sources-intro"><section class="panel">${confidence()}</section><section class="panel"><p class="eyebrow">CURATOR'S RESEARCH RECORD · 20 NOV 2026</p><h2>Show the evidence.</h2><p>Names, descriptions and grades follow PSN data reported by planetgta6 [2], cross-checked by the supplied research. Rockstar has not published an official list [13]. Methods are independently paraphrased. High = corroborated method; Medium = single-source detail or a disputed subclaim; Low = unresolved trigger.</p><p>18 sources: 8 full reads and 10 detailed excerpts in the research record. PSNProfiles and TrueTrophies are attributed cross-checks, not independently read sources. Source domains below are plain text for an entirely offline collection.</p></section></div><div class="source-columns"><section class="panel"><p class="eyebrow">THE REFERENCE SHELF</p><h2>18 numbered sources</h2>${data.sources.map(s=>`<article class="source-row" id="source-${s.id}"><h3>[${s.id}] ${esc(s.name)}</h3><span class="domain">${esc(s.domain)}</span><p>${esc(s.title)}</p><p>${esc(s.scope)}</p></article>`).join('')}</section><section class="panel"><p class="eyebrow">THE DISAGREEMENT REGISTER</p><h2>10 calls, openly recorded</h2>${data.disagreements.map(d=>`<article class="disagreement" id="${d.id}"><h3>${d.id} / ${esc(d.title)}</h3><p>${citeText(d.text)}</p></article>`).join('')}</section></div>`; }
  function render() {
    const tally = data.trophies;
    $('#page-title').textContent = state.view==='Vault'?'The Platinum Vault':grades.includes(state.view)?state.view+' Hall':state.view==='Planner'?'The run planner':'Sources & confidence';
    $('#breadcrumb').textContent = 'PRIVATE COLLECTION / '+(state.view==='Vault'?'OVERVIEW':state.view.toUpperCase());
    $('#audit').innerHTML = `<span><strong>${tally.length}</strong> trophies</span><span><strong>${grades.map(g=>tally.filter(t=>t.grade===g).length).join(' / ')}</strong> P · G · S · B</span><span><strong>${tally.filter(t=>t.hidden).length}</strong> hidden</span><span><strong>${tally.reduce((n,t)=>n+t.steps.length,0)}</strong> guide steps</span><span><strong>${tally.reduce((n,t)=>n+t.steps.reduce((m,s)=>m+s.citations.length,0),0)}</strong> step citations</span><span><strong>${data.sources.length}</strong> sources · <strong>${data.disagreements.length}</strong> disputes</span>`;
    $('#jason-count').textContent = count('Jason')+'/55'; $('#lucia-count').textContent = count('Lucia')+'/55';
    for(const c of ['Jason','Lucia']) $('#'+c.toLowerCase()).setAttribute('aria-pressed',state.character===c);
    document.querySelectorAll('nav [data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);b.setAttribute('aria-current',b.dataset.view===state.view?'page':'false');});
    $('#view').innerHTML = state.view==='Vault'?vault():state.view==='Planner'?planner():state.view==='Sources'?sources():hall();
    bindView();
  }
  function bindView() {
    document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openExhibit(Number(b.dataset.open)));
    document.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>{state.selected=Number(b.dataset.select);persist();render();});
    document.querySelectorAll('[data-source]').forEach(b=>b.onclick=()=>{const n=b.dataset.source;go('Sources');$('#source-'+n).scrollIntoView({block:'center'});$('#source-'+n).setAttribute('tabindex','-1');$('#source-'+n).focus({preventScroll:true});});
    document.querySelectorAll('[data-minutes]').forEach(b=>b.onclick=()=>{state.minutes=Number(b.dataset.minutes);persist();render();});
    if($('#search')) $('#search').oninput=e=>{const pos=e.target.selectionStart;query=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);};
    if($('#grade-filter')) $('#grade-filter').onchange=e=>{grade=e.target.value;if(grades.includes(grade)){state.view=grade;persist();}render();};
    if($('#kind-filter')) $('#kind-filter').onchange=e=>{kind=e.target.value;render();};
    if($('#spoilers')) $('#spoilers').onchange=e=>{state.spoilers=e.target.checked;persist();render();};
    if($('#earned')) $('#earned').onchange=()=>setEarned(state.selected);
    if($('#reveal')) $('#reveal').onclick=()=>{state.revealed.push(state.selected);persist();render();};
    for(const c of ['Jason','Lucia']) if($('#med-'+c)) $('#med-'+c).onchange=e=>{state.meditation[c]=Math.max(0,Math.min(18,Math.floor(Number(e.target.value)||0)));persist();render();};
  }
  document.querySelectorAll('nav [data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));
  $('.brand').onclick=e=>{e.preventDefault();go('Vault');};
  for(const c of ['Jason','Lucia']) $('#'+c.toLowerCase()).onclick=()=>{state.character=c;persist();render();};
  $('#export').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));a.download='platinum-vault-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify('Collection exported.');};
  $('#import').onchange=async e=>{try {const file=e.target.files[0];if(!file)return;const incoming=JSON.parse(await file.text());if(!valid(incoming))throw Error();state=incoming;persist();render();notify('Collection restored.');}catch{notify('Invalid save. Your collection was not changed.');}e.target.value='';};
  $('#share').onclick=async()=>{const hash='#vault='+encodeURIComponent(JSON.stringify(state));history.replaceState(null,'',hash);try {await navigator.clipboard.writeText(location.href);notify('Collection link copied.');}catch{const area=document.createElement('textarea');area.value=location.href;document.body.append(area);area.select();const copied=document.execCommand('copy');area.remove();notify(copied?'Collection link copied.':'Collection link is in the address bar.');}};
  $('#print').onclick=()=>{const old=$('#view').innerHTML;$('#view').innerHTML='<h1 class="print-title">The Platinum Vault · '+state.character+'</h1>'+data.trophies.map(t=>`<article class="print-row"><h3>${done(t)?'☑':'☐'} ${t.grade} · ${title(t)}</h3>${shielded(t)?'<p>Hidden trophy · sealed</p>':`<p>${esc(t.description)}</p><p>${esc(t.guide)}</p>`}</article>`).join('');window.print();$('#view').innerHTML=old;bindView();};
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
    if(e.key==='/'){e.preventDefault();if(!grades.includes(state.view))go('Bronze');$('#search').focus();}
    if(e.key==='x'&&grades.includes(state.view)&&filtered().length){e.preventDefault();setEarned(state.selected);}
    if(['j','k'].includes(e.key)&&grades.includes(state.view)){e.preventDefault();const list=filtered();if(!list.length)return;const i=list.findIndex(t=>t.id===state.selected);state.selected=list[(i+(e.key==='j'?1:-1)+list.length)%list.length].id;persist();render();$('.exhibit.active').scrollIntoView({block:'nearest'});}
  });
  window.addEventListener('hashchange',()=>{restoreHash();if(data)render();});
  async function boot() {
    try {const saved=JSON.parse(localStorage.getItem(key));if(valid(saved))state=saved;}catch{}
    restoreHash();
    try { const response=await fetch('data/trophies.json');data=await response.json();render();window.vaultReady=true; }
    catch {$('#view').innerHTML='<section class="panel"><h2>Open the collection locally</h2><p>Serve the app directory with a local static server. For direct file access, enable the browser’s local file access setting.</p></section>';}
  }
  boot();
})();
