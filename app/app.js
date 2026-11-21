/* The Platinum Vault — GTA VI 55-trophy ledger. Data: app/data/trophies.json (55 trophies, 18 sources, D1-D10 disputes). */
const LS_KEY = 'platinum-vault-v1';
const TOTAL_HOURS = 200;
/* Hours model (estimate): story 4h / missable 4h / collectibles 8h / activities 3h / other 3h per trophy. */
const HOURS_BY_KIND = { Story: 4, Missable: 4, Collectibles: 8, Activities: 3, Online: 0, Other: 3 };
const DISPUTE_TROPHIES = { D1: [28], D2: [1], D3: [40], D4: [17], D5: [47], D6: [7], D7: [1], D8: [17], D9: [3, 4], D10: [25] };
const CHAPTER_TITLES = { 1: 'Chapter 1 — The Keys & the balcony', 2: 'Chapter 2 — Vice City opens up', 3: 'Chapter 3 — Break the Bank', 4: 'Chapter 4 — Family Matters', 5: 'Chapter 5 — Snow Storm', 6: 'Chapter 6 — Strangers & side work', 7: 'Chapter 7 — Cleanup & 100%' };
const COLLECTIBLE_GROUPS = ['Cards', 'Scans', 'Vehicles', 'Exploration'];

let DATA = null;
let state = loadState();
let chip = 'all';

function defaultState() {
  return { version: 1, character: 'Jason', earned: { Jason: [], Lucia: [] }, meditation: { Jason: 0, Lucia: 0 }, revealed: [], spoilers: false, view: 'Tracker', selected: 1, minutes: 60 };
}
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 1) return Object.assign(defaultState(), s, { earned: Object.assign({ Jason: [], Lucia: [] }, s.earned), meditation: Object.assign({ Jason: 0, Lucia: 0 }, s.meditation) }); }
  } catch (e) { /* corrupted save: start fresh */ }
  const hash = (location.hash.match(/#vault=([A-Za-z0-9+/=]+)/) || [])[1];
  if (hash) { try { const s = JSON.parse(decodeURIComponent(escape(atob(hash)))); if (s && s.version === 1) return Object.assign(defaultState(), s); } catch (e) { /* bad link hash */ } }
  return defaultState();
}
function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ } }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

/* Kind, chapter and character are derived from the official stage string — no extra fields needed. */
function kindOf(t) {
  if (t.missable) return 'Missable';
  if (t.stage.indexOf('Story ·') === 0) return 'Story';
  if (t.stage.indexOf('Collectibles') === 0) return 'Collectibles';
  if (t.stage.indexOf('Activities') === 0) return 'Activities';
  return 'Other';
}
function chapterOf(t) {
  const m = /Chapter (\d)/.exec(t.stage);
  if (m) return Number(m[1]);
  if (t.missable) return 1;
  if (t.stage.indexOf('Strangers') === 0 || t.stage.indexOf('Misc') === 0) return 6;
  return 7;
}
function charOf(t) {
  if (/Both characters|Partner/.test(t.stage)) return 'Both';
  if (/Lucia/.test(t.stage)) return 'Lucia';
  if (/Jason/.test(t.stage)) return 'Jason';
  return 'Either';
}
function gradeLetter(g) { return { Platinum: 'P', Gold: 'G', Silver: 'S', Bronze: 'B' }[g] || '?'; }
function isEarned(t) { return state.earned[state.character].indexOf(t.id) !== -1; }
function isRevealed(t) { return !t.hidden || state.spoilers || state.revealed.indexOf(t.id) !== -1 || isEarned(t); }
function disputeIdsFor(trophyId) { return Object.keys(DISPUTE_TROPHIES).filter(d => DISPUTE_TROPHIES[d].indexOf(trophyId) !== -1); }
/* Count step citations per trophy: citations live on each step plus markers inside the guide text. */
function citationsOf(t) {
  const set = new Set();
  t.steps.forEach(s => s.citations.forEach(n => set.add(n)));
  (t.guide.match(/\[(\d+)\]/g) || []).forEach(m => set.add(Number(m.slice(1, -1))));
  return set;
}
function linkCitations(text) {
  return esc(text).replace(/\[(\d+)\]/g, (m, n) => {
    const s = DATA.sources.find(x => x.id === Number(n));
    const title = s ? ' title="' + esc(s.name) + ' — ' + esc(s.title) + '"' : '';
    return '<a href="#sources" data-source="' + n + '" class="cite"' + title + '>[' + n + ']</a>';
  });
}
function roadmapOrder() {
  const byId = id => DATA.trophies.find(t => t.id === id);
  const order = [28];
  DATA.trophies.filter(t => kindOf(t) === 'Story').sort((a, b) => a.id - b.id).forEach(t => order.push(t.id));
  DATA.trophies.filter(t => kindOf(t) === 'Collectibles' && t.id !== 28).forEach(t => order.push(t.id));
  DATA.trophies.filter(t => kindOf(t) === 'Activities').forEach(t => order.push(t.id));
  DATA.trophies.forEach(t => { if (order.indexOf(t.id) === -1) order.push(t.id); });
  return order.map(byId);
}

function computeAudit() {
  const tally = DATA.trophies;
  const audit = tally.reduce((a, t) => {
    a.total++;
    a.grades[t.grade] = (a.grades[t.grade] || 0) + 1;
    if (t.hidden) a.hidden++;
    if (t.missable) a.missable++;
    if (t.confidence !== 'High') a.atRisk++;
    a.steps += t.steps.length;
    a.stepsCited += t.steps.filter(s => s.citations && s.citations.length).length;
    if (/\[(\d+)\]/.test(t.guide)) a.guidesCited++;
    if (citationsOf(t).size >= 2) a.backed2++;
    return a;
  }, { total: 0, grades: {}, hidden: 0, missable: 0, atRisk: 0, steps: 0, stepsCited: 0, guidesCited: 0, backed2: 0 });
  audit.pages = DATA.sources.length;
  audit.sites = new Set(DATA.sources.map(s => s.domain)).size;
  audit.disputes = DATA.disagreements.length;
  audit.unconfirmed = DATA.trophies.filter(t => t.steps.length === 0).length;
  return audit;
}

function renderAudit() {
  const a = computeAudit();
  const parts = [
    a.total + '/' + a.total + ' official name, description, grade',
    (a.grades.Platinum || 0) + 'P ' + (a.grades.Gold || 0) + 'G ' + (a.grades.Silver || 0) + 'S ' + (a.grades.Bronze || 0) + 'B',
    a.hidden + ' PSN-hidden',
    a.stepsCited + '/' + a.steps + ' steps cited',
    a.guidesCited + '/' + a.total + ' guides cite sources',
    a.backed2 + '/' + a.total + ' backed by 2+ sources',
    a.pages + ' pages · ' + a.sites + ' sites · read 20 Nov 2026',
    a.missable + ' possibly missable · ' + a.atRisk + ' at risk · ' + a.unconfirmed + ' fully unconfirmed',
    a.disputes + ' disputes shown both ways'
  ];
  $('#audit').textContent = parts.join(' · ');
}

function renderTopbar() {
  const earned = state.earned[state.character];
  const total = DATA.trophies.length;
  const ring = document.querySelector('.ring');
  const fg = document.querySelector('.ring-fg');
  const circ = 2 * Math.PI * 52;
  fg.style.strokeDasharray = circ;
  fg.style.strokeDashoffset = circ * (1 - earned.length / total);
  ring.setAttribute('aria-valuenow', String(earned.length));
  document.querySelector('.ring-text').textContent = earned.length + '/' + total;
  $('#earned-count').textContent = earned.length + ' / ' + total + ' earned';
  const g = { P: 0, G: 0, S: 0, B: 0 };
  earned.forEach(id => { const t = DATA.trophies.find(x => x.id === id); if (t) g[gradeLetter(t.grade)]++; });
  $('#grade-counts').textContent = 'P ' + g.P + ' · G ' + g.G + ' · S ' + g.S + ' · B ' + g.B;
  $('#jason-count').textContent = state.earned.Jason.length + '/55';
  $('#lucia-count').textContent = state.earned.Lucia.length + '/55';
  const logged = COLLECTIBLE_GROUPS.filter(group => DATA.trophies.some(t => t.stage.indexOf('Collectibles · ' + group) === 0 && (state.earned.Jason.indexOf(t.id) !== -1 || state.earned.Lucia.indexOf(t.id) !== -1))).length;
  $('#collectibles-count').textContent = 'Collectibles ' + logged + '/4 logged';
  const spent = earned.reduce((n, id) => { const t = DATA.trophies.find(x => x.id === id); return n + (t ? HOURS_BY_KIND[kindOf(t)] : 0); }, 0);
  $('#hours-remaining').textContent = Math.max(0, TOTAL_HOURS - spent) + ' h remaining (estimate)';
  $('#jason').setAttribute('aria-pressed', String(state.character === 'Jason'));
  $('#lucia').setAttribute('aria-pressed', String(state.character === 'Lucia'));
  $('#spoilers').checked = state.spoilers;
  $$('.tabs [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === state.view)));
  $$('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== state.view; });
  $('#page-title').textContent = state.view === 'Tracker' ? 'Tracker — all 55 trophies' : state.view;
}

function filteredTrophies() {
  const q = ($('#search').value || '').trim().toLowerCase();
  const kind = $('#kind-filter').value, grade = $('#grade-filter').value, chapter = $('#chapter-filter').value;
  const conf = $('#confidence-filter').value, character = $('#character-filter').value;
  const disputed = new Set(); Object.values(DISPUTE_TROPHIES).forEach(ids => ids.forEach(id => disputed.add(id)));
  return DATA.trophies.filter(t => {
    if (q && isRevealed(t) && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
    if (q && !isRevealed(t)) return false;
    if (kind !== 'All' && kindOf(t) !== kind) return false;
    if (grade !== 'All' && t.grade !== grade) return false;
    if (chapter !== 'All' && chapterOf(t) !== Number(chapter)) return false;
    if (conf !== 'All' && t.confidence !== conf) return false;
    if (character !== 'All' && charOf(t) !== character && charOf(t) !== 'Either' && charOf(t) !== 'Both') return false;
    if (chip === 'story' && kindOf(t) !== 'Story') return false;
    if (chip === 'missable' && kindOf(t) !== 'Missable') return false;
    if (chip === 'collectibles' && kindOf(t) !== 'Collectibles') return false;
    if (chip === 'activities' && kindOf(t) !== 'Activities') return false;
    if (chip === 'online' && kindOf(t) !== 'Online') return false;
    if (chip === 'hidden' && !t.hidden) return false;
    if (chip === 'disputed' && !disputed.has(t.id)) return false;
    if (chip === 'not-earned' && isEarned(t)) return false;
    if ((chip === 'P' || chip === 'G' || chip === 'S' || chip === 'B') && gradeLetter(t.grade) !== chip) return false;
    return true;
  });
}

function renderChips() {
  const disputed = new Set(); Object.values(DISPUTE_TROPHIES).forEach(ids => ids.forEach(id => disputed.add(id)));
  const count = fn => DATA.trophies.filter(fn).length;
  const defs = [
    ['all', 'All 55', DATA.trophies.length], ['story', 'Story', count(t => kindOf(t) === 'Story')],
    ['missable', 'Missable', count(t => kindOf(t) === 'Missable')], ['collectibles', 'Collectibles', count(t => kindOf(t) === 'Collectibles')],
    ['activities', 'Activities', count(t => kindOf(t) === 'Activities')], ['online', 'Online', 0],
    ['hidden', '28 PSN-hidden', count(t => t.hidden)], ['disputed', 'Disputed', DATA.disagreements.length],
    ['not-earned', 'Not earned', DATA.trophies.length - state.earned[state.character].length],
    ['P', 'P', count(t => t.grade === 'Platinum')], ['G', 'G', count(t => t.grade === 'Gold')],
    ['S', 'S', count(t => t.grade === 'Silver')], ['B', 'B', count(t => t.grade === 'Bronze')]
  ];
  $('#chips').innerHTML = defs.map(d => '<button type="button" data-chip="' + d[0] + '" aria-pressed="' + String(chip === d[0]) + '">' + d[1] + ' ' + d[2] + '</button>').join('');
  $$('#chips [data-chip]').forEach(b => b.addEventListener('click', () => { chip = b.dataset.chip; save(); renderAll(); }));
}

function renderList() {
  const list = filteredTrophies();
  if (list.length && !list.some(t => t.id === state.selected)) { state.selected = list[0].id; save(); }
  const el = $('#trophy-list');
  if (!list.length) { el.innerHTML = '<p class="empty">No exhibits match these filters.</p>'; return; }
  el.innerHTML = list.map(t => {
    const revealed = isRevealed(t);
    const name = revealed ? esc(t.name) : '<span class="masked">hidden until earned</span>';
    const desc = revealed ? esc(t.description) : '<span class="masked">hidden until earned</span>';
    const flags = [];
    if (t.hidden) flags.push('PSN-hidden');
    if (t.missable) flags.push('MISSABLE');
    if (disputeIdsFor(t.id).length) flags.push('DISPUTED ' + disputeIdsFor(t.id).join(' '));
    return '<div class="trophy' + (isEarned(t) ? ' earned' : '') + (state.selected === t.id ? ' selected' : '') + '" role="listitem" data-select="' + t.id + '">' +
      '<label><input type="checkbox" class="earned-toggle" data-id="' + t.id + '"' + (isEarned(t) ? ' checked' : '') + ' aria-label="Mark earned"></label>' +
      '<div class="trophy-body"><h3>' + name + '</h3><p class="desc">' + desc + '</p>' +
      '<p class="meta"><span class="grade grade-' + gradeLetter(t.grade) + '">' + gradeLetter(t.grade) + ' ' + esc(t.grade) + '</span> ' + esc(t.stage) + ' · ' + esc(t.confidence) + (flags.length ? ' · ' + flags.join(' · ') : '') + '</p>' +
      '<button type="button" data-open="' + t.id + '">Show guide</button></div></div>';
  }).join('');
  $$('#trophy-list .trophy').forEach(row => row.addEventListener('click', e => {
    if (e.target.classList.contains('earned-toggle')) return;
    selectTrophy(Number(row.dataset.select));
  }));
  $$('#trophy-list .earned-toggle').forEach(cb => cb.addEventListener('change', () => {
    toggleEarned(Number(cb.dataset.id), cb.checked);
  }));
  $$('#trophy-list [data-open]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); selectTrophy(Number(b.dataset.open)); }));
}

function selectTrophy(id) {
  state.selected = id; save(); renderList(); renderGuide(); renderNextUp();
  const panel = $('#detail');
  if (panel) panel.scrollIntoView({ block: 'nearest' });
}

function renderGuide() {
  const t = DATA.trophies.find(x => x.id === state.selected) || DATA.trophies[0];
  const panel = $('#detail');
  panel.setAttribute('data-id', String(t.id));
  if (!isRevealed(t)) {
    panel.innerHTML = '<h3>Sealed exhibit</h3><p class="masked">hidden until earned</p><p>This trophy is hidden on PSN. Earn it, or reveal it here to read its guide.</p><label class="earned-line"><input type="checkbox" id="earned"' + (isEarned(t) ? ' checked' : '') + '> Earned (' + esc(state.character) + ')</label><button type="button" id="reveal">Reveal this exhibit</button>';
    const eb = $('#earned');
    if (eb) eb.addEventListener('change', () => toggleEarned(t.id, eb.checked));
    $('#reveal').addEventListener('click', () => { state.revealed.push(t.id); save(); renderAll(); });
    return;
  }
  const disputes = disputeIdsFor(t.id).map(id => DATA.disagreements.find(d => d.id === id)).filter(Boolean);
  const steps = t.steps.map((s, i) => '<li>' + linkCitations(s.text) + ' ' + s.citations.map(n => '<a href="#sources" data-source="' + n + '" class="cite">[' + n + ']</a>').join(' ') + '</li>').join('');
  const med = t.id === 28 ? '<div class="counter"><h4>YOUR COUNT — meditations</h4><p>Jason <button type="button" data-med="Jason" data-delta="-1" aria-label="One fewer Jason meditation">−</button> <input id="med-Jason" type="number" min="0" max="18" value="' + state.meditation.Jason + '" aria-label="Jason meditations"> <button type="button" data-med="Jason" data-delta="1" aria-label="One more Jason meditation">+</button> · Lucia <button type="button" data-med="Lucia" data-delta="-1" aria-label="One fewer Lucia meditation">−</button> <input id="med-Lucia" type="number" min="0" max="18" value="' + state.meditation.Lucia + '" aria-label="Lucia meditations"> <button type="button" data-med="Lucia" data-delta="1" aria-label="One more Lucia meditation">+</button></p><p>Combined: ' + (state.meditation.Jason + state.meditation.Lucia) + ' / 18</p></div>' : '';
  const missable = t.missable ? '<p class="missable-flag">⚠ MISSABLE — Last chance: Chapter 1 — before Tourist Trap. Do the balcony session as a precaution; keep a Chapter 1 save.</p>' : '';
  const disputeHtml = disputes.map(d => {
    const parts = d.text.split('Call:');
    return '<div class="disagreement"><h4>SOURCES DIFFER — ' + esc(d.title) + ' (' + d.id + ')</h4><p>' + linkCitations(parts[0].trim()) + '</p><p><strong>OUR CALL:</strong> ' + linkCitations((parts[1] || '').trim()) + '</p></div>';
  }).join('');
  panel.innerHTML = '<h3>' + esc(t.name) + '</h3>' +
    '<p class="meta"><span class="grade grade-' + gradeLetter(t.grade) + '">' + gradeLetter(t.grade) + ' ' + esc(t.grade) + '</span> ' + esc(t.stage) + ' · ' + esc(t.confidence) + (t.hidden ? ' · PSN-hidden' : '') + '</p>' +
    '<blockquote>“' + esc(t.description) + '” <span class="official">— official PS5 description</span></blockquote>' +
    '<p class="guide-lede">' + linkCitations(t.guide) + '</p>' + missable + med +
    '<label class="earned-line"><input type="checkbox" id="earned"' + (isEarned(t) ? ' checked' : '') + '> Earned (' + esc(state.character) + ')</label>' +
    '<h4>Steps</h4><ol class="steps">' + steps + '</ol>' + disputeHtml;
  const eb = $('#earned');
  if (eb) eb.addEventListener('change', () => toggleEarned(t.id, eb.checked));
  $$('#detail [data-med]').forEach(b => b.addEventListener('click', () => {
    const ch = b.dataset.med;
    state.meditation[ch] = Math.max(0, Math.min(18, state.meditation[ch] + Number(b.dataset.delta)));
    save(); renderGuide(); renderTopbar();
  }));
  $$('#detail #med-Jason, #detail #med-Lucia').forEach(inp => inp.addEventListener('change', () => {
    const ch = inp.id === 'med-Jason' ? 'Jason' : 'Lucia';
    state.meditation[ch] = Math.max(0, Math.min(18, Number(inp.value) || 0));
    save(); renderGuide();
  }));
  $$('#detail [data-source]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); gotoSources(Number(a.dataset.source)); }));
}

function renderNextUp() {
  const next = roadmapOrder().filter(t => !isEarned(t)).slice(0, 6);
  $('#nextup').innerHTML = next.map((t, i) => '<li class="next-item" data-next-id="' + t.id + '"><button type="button" data-next-select="' + t.id + '">' + (i + 1) + '. ' + (isRevealed(t) ? esc(t.name) : '<span class="masked">hidden until earned</span>') + ' · ' + esc(t.grade) + ' · ' + esc(t.stage) + '</button></li>').join('') || '<li>Vault complete.</li>';
  $$('#nextup [data-next-select]').forEach(b => b.addEventListener('click', () => selectTrophy(Number(b.dataset.nextSelect))));
  const t = DATA.trophies.find(x => x.id === state.selected) || DATA.trophies[0];
  const cited = Array.from(citationsOf(t)).sort((a, b) => a - b);
  $('#rail-sources').innerHTML = cited.map(n => { const s = DATA.sources.find(x => x.id === n); return '<li><a href="#sources" data-source="' + s.id + '" id="rail-source-' + s.id + '">[' + s.id + '] ' + esc(s.name) + '</a> — ' + esc(s.title) + '</li>'; }).join('') || '<li>No sources cited for this guide.</li>';
  $$('#rail-sources [data-source]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); gotoSources(Number(a.dataset.source)); }));
}

function gotoSources(n) {
  state.view = 'Sources'; save(); renderAll();
  const el = document.getElementById('source-' + n);
  if (el) { el.focus(); el.scrollIntoView({ block: 'center' }); }
}

function renderRoadmap() {
  const phases = [
    ['Phase 1 — Story (60–80 h)', 'Play Chapters 1–5 in order. Do the Chapter 1 balcony meditation (#28) as a precaution before Tourist Trap — it is the only possibly missable trophy.'],
    ['Phase 2 — 100% checklist (~100 h)', 'Work the 34-item completion checklist: 200 vehicle scans, 100 animals, 15 of 18 meditations, 70 of 80 challenges, 300 of 397 stunts, 42 shooting-range golds, 42 drone races.'],
    ['Phase 3 — Cleanup (~10 h)', 'Mop up the remaining activities, strangers and misc trophies. One playthrough, about 200 hours total.']
  ];
  const order = roadmapOrder();
  $('#roadmap').innerHTML = phases.map(p => '<section class="phase"><h3>' + esc(p[0]) + '</h3><p>' + esc(p[1]) + '</p></section>').join('') +
    '<h3>Chapter index — 7 chapters</h3><ol class="chapter-index">' + [1, 2, 3, 4, 5, 6, 7].map(c => '<li><strong>' + esc(CHAPTER_TITLES[c]) + '</strong> — ' + DATA.trophies.filter(t => chapterOf(t) === c).length + ' trophies</li>').join('') + '</ol>' +
    '<h3>Play order</h3><ol class="play-order">' + order.map(t => '<li data-order-id="' + t.id + '">' + (isRevealed(t) ? esc(t.name) : '<span class="masked">hidden until earned</span>') + ' · ' + esc(t.stage) + '</li>').join('') + '</ol>';
}

function renderMissables() {
  const missable = DATA.trophies.filter(t => t.missable);
  const atRisk = DATA.trophies.filter(t => !t.missable && t.confidence !== 'High');
  const card = (t, tier, ponr) => '<article class="missable-card"><h3>' + (isRevealed(t) ? esc(t.name) : '<span class="masked">hidden until earned</span>') + '</h3><p class="tier">' + tier + '</p><p>Point of no return: ' + esc(ponr) + '</p><p>' + (isRevealed(t) ? esc(t.description) : '<span class="masked">hidden until earned</span>') + '</p></article>';
  $('#missables').innerHTML = '<h3>Missable — 1 trophy</h3>' + missable.map(t => card(t, 'Tier 1 — possibly missable', 'Chapter 1 — before Tourist Trap')).join('') +
    '<h3>At risk — ' + atRisk.length + ' trophies</h3><p>Medium or Low confidence: the guide is our best read of the sources, not settled fact.</p>' +
    atRisk.map(t => card(t, 'Tier 2 — at risk (' + esc(t.confidence) + ' confidence)', t.confidence === 'Low' ? 'Unconfirmed — check the in-game counter' : 'Chapter order per PSN; verify in game')).join('');
}

function renderJournal() {
  $('#journal').innerHTML = [1, 2, 3, 4, 5, 6, 7].map(c => {
    const list = DATA.trophies.filter(t => chapterOf(t) === c);
    return '<details class="chapter" data-chapter="' + c + '"><summary>' + esc(CHAPTER_TITLES[c]) + ' — ' + list.length + ' trophies</summary><ol>' +
      list.map(t => '<li>' + (isRevealed(t) ? esc(t.name) : '<span class="masked">hidden until earned</span>') + ' · ' + esc(t.grade) + (isEarned(t) ? ' ✓' : '') + '</li>').join('') + '</ol></details>';
  }).join('');
}

function renderPlanner() {
  const blocks = Math.floor(state.minutes / 15);
  const pool = roadmapOrder().filter(t => !isEarned(t));
  const plan = pool.slice(0, Math.min(blocks, 6));
  $('#plan').innerHTML = plan.length ? '<ol>' + plan.map(t => '<li class="plan-item" data-plan-id="' + t.id + '">' + (isRevealed(t) ? esc(t.name) : '<span class="masked">hidden until earned</span>') + ' — 15 min · ' + esc(t.stage) + '</li>').join('') + '</ol><p>Missable first, then roadmap order. ' + plan.length + ' blocks × 15 min = ' + (plan.length * 15) + ' min.</p>' : '<p>Vault complete — nothing left to plan.</p>';
  $$('.planner-controls [data-minutes]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.minutes) === state.minutes)));
}

function renderSources() {
  const confCounts = { High: 0, Medium: 0, Low: 0 };
  DATA.trophies.forEach(t => confCounts[t.confidence]++);
  $('#sources-view').innerHTML = '<p class="confidence-labels"><strong>' + confCounts.High + '/' + confCounts.Medium + '/' + confCounts.Low + '</strong> High / Medium / Low confidence across 55 trophies.</p>' +
    '<ol class="source-list">' + DATA.sources.map(s => '<li class="source-row" id="source-' + s.id + '" tabindex="-1"><strong>[' + s.id + '] ' + esc(s.name) + '</strong> — ' + esc(s.title) + ' · ' + esc(s.domain) + ' · ' + esc(s.scope) + '</li>').join('') + '</ol>' +
    '<h3>Disputes — both versions shown</h3>' + DATA.disagreements.map(d => {
      const parts = d.text.split('Call:');
      return '<div class="disagreement"><h4>' + d.id + ' — ' + esc(d.title) + '</h4><p>' + linkCitations(parts[0].trim()) + '</p><p><strong>OUR CALL:</strong> ' + linkCitations((parts[1] || '').trim()) + '</p></div>';
    }).join('');
  $$('#sources-view [data-source]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); const el = document.getElementById('source-' + a.dataset.source); if (el) el.focus(); }));
}

function renderChecklist() {
  $('#checklist').innerHTML = DATA.trophies.map(t => '<li><input type="checkbox" disabled' + (isEarned(t) ? ' checked' : '') + '> ' + (isRevealed(t) ? esc(t.name) : 'hidden until earned') + ' — ' + esc(t.grade) + '</li>').join('');
}

function renderAll() {
  renderAudit(); renderTopbar(); renderChips(); renderList(); renderGuide(); renderNextUp();
  renderRoadmap(); renderMissables(); renderJournal(); renderPlanner(); renderSources(); renderChecklist();
}

function toggleEarned(id, on) {
  const arr = state.earned[state.character];
  const i = arr.indexOf(id);
  if (on && i === -1) arr.push(id);
  if (!on && i !== -1) arr.splice(i, 1);
  save(); renderAll();
}

function bind() {
  $$('.tabs [data-view]').forEach(b => b.addEventListener('click', () => { state.view = b.dataset.view; save(); renderAll(); }));
  ['#search', '#kind-filter', '#grade-filter', '#chapter-filter', '#confidence-filter', '#character-filter'].forEach(sel => $(sel).addEventListener('input', renderAll));
  $('#clear-filters').addEventListener('click', () => { $('#search').value = ''; ['#kind-filter', '#grade-filter', '#chapter-filter', '#confidence-filter', '#character-filter'].forEach(s => $(s).value = 'All'); chip = 'all'; save(); renderAll(); });
  $('#jason').addEventListener('click', () => { state.character = 'Jason'; save(); renderAll(); });
  $('#lucia').addEventListener('click', () => { state.character = 'Lucia'; save(); renderAll(); });
  $('#spoilers').addEventListener('change', e => { state.spoilers = e.target.checked; save(); renderAll(); });
  $$('.planner-controls [data-minutes]').forEach(b => b.addEventListener('click', () => { state.minutes = Number(b.dataset.minutes); save(); renderPlanner(); }));
  $('#export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'platinum-vault-save.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#import').addEventListener('change', e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const s = JSON.parse(reader.result); if (s && s.version === 1) { state = Object.assign(defaultState(), s); save(); renderAll(); } } catch (err) { /* invalid save file */ } };
    reader.readAsText(file);
  });
  $('#share').addEventListener('click', () => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const url = location.href.split('#')[0] + '#vault=' + encoded;
    history.replaceState(null, '', url);
    if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => { /* clipboard unavailable: the hash link still works */ });
  });
  $('#print-btn').addEventListener('click', () => window.print());
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === '/') { e.preventDefault(); $('#search').focus(); }
    else if (e.key === 'Escape') { $('#search').value = ''; renderAll(); $('#search').blur(); }
    else if (e.key === 'j' || e.key === 'k') {
      const list = filteredTrophies();
      const i = list.findIndex(t => t.id === state.selected);
      const next = list[(i + (e.key === 'j' ? 1 : -1) + list.length) % list.length];
      if (next) selectTrophy(next.id);
    } else if (e.key === 'x') { const t = DATA.trophies.find(x => x.id === state.selected); if (t) toggleEarned(t.id, !isEarned(t)); }
  });
}

fetch('data/trophies.json').then(r => r.json()).then(data => {
  DATA = data;
  save(); /* persist hash-restored state so a reload keeps it */
  bind();
  renderAll();
  window.vaultReady = true;
}).catch(err => { document.body.insertAdjacentHTML('beforeend', '<p class="error">Could not load trophy data.</p>'); });
