// SHAZAM screens. The rules live in rules.js, the program in program.js.
import { PROGRAM } from './program.js';
import { computeTargets, diffRoutine, buildRoutineBody, keptInHevy, fmtSets, localDay } from './rules.js';
import { Hevy } from './hevy.js';
import { buildProgress, chartPoints } from './progress.js';

const VERSION = 'v3.2';
const KEY_STORE = 'shazam_hevy_key';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const getKey = () => { try { return localStorage.getItem(KEY_STORE) || ''; } catch { return ''; } };
const setKey = k => { try { k ? localStorage.setItem(KEY_STORE, k) : localStorage.removeItem(KEY_STORE); } catch {} };

const S = {
  loading: false, error: null, loadedAt: null,
  workouts: [], hevyRoutines: new Map(), targets: [],
  overrides: {}, // edits made on this screen: { routineKey: { exId: { weight?, single? } } }
  kept: {},      // weights changed in Hevy since the last workout, same shape
  showAll: {}, sending: null,
  progress: null, progEx: null, // Progress screen: history, and the exercise open (null = the list)
};

const progOf = key => PROGRAM.routines.find(p => p.key === key);

// Hevy's kept weights, then this screen's edits on top.
function effective(rKey) {
  const out = {};
  for (const src of [S.kept[rKey] || {}, S.overrides[rKey] || {}])
    for (const [id, v] of Object.entries(src)) out[id] = { ...(out[id] || {}), ...v };
  return out;
}

// ---------- loading ----------

async function load() {
  const key = getKey();
  if (!key) { S.error = null; renderTargets(); return; }
  S.loading = true; S.error = null; renderTargets(); renderProgressIfOpen();
  try {
    const hevy = new Hevy(key);
    const [workouts, routines] = await Promise.all([hevy.workoutsSince(PROGRAM.historyStart), hevy.routines()]);
    S.workouts = workouts;
    S.hevyRoutines = new Map(routines.map(r => [r.id, r]));
    S.targets = computeTargets(PROGRAM, workouts, localDay(new Date().toISOString()));
    S.overrides = {};
    S.kept = Object.fromEntries(S.targets.map(t => [t.key, keptInHevy(progOf(t.key), t, S.hevyRoutines.get(t.id), workouts)]));
    S.progress = buildProgress(PROGRAM, workouts);
    S.loadedAt = new Date();
  } catch (e) {
    S.error = e.message || String(e);
  }
  S.loading = false;
  renderTargets();
  renderProgressIfOpen();
  updateHeader();
}

function updateHeader() {
  const mon = S.targets.flatMap(r => r.exercises).find(e => e.ex.rule === 'mondayBench');
  $('h-single').textContent = mon?.single ? mon.single + ' lb' : '—';
}

// ---------- targets page ----------

const fmtDay = day => {
  if (!day) return 'Not done yet';
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};
const kindClass = k => ({ up: 'k-up', down: 'k-down', reset: 'k-reset' }[k] || '');

function weightInput(rKey, exId, part, value, step) {
  const edited = S.overrides[rKey]?.[exId]?.[part] != null;
  return `<input type="number" inputmode="decimal" step="${step}" value="${esc(value)}" class="${edited ? 'edited' : ''}"
    data-ov="${esc(rKey)}|${esc(exId)}|${part}" aria-label="Target weight">`;
}

function exerciseRow(r, e, change) {
  const ov = effective(r.key)[e.ex.id] || {};
  const kept = S.kept[r.key]?.[e.ex.id] || {};
  const keptNote = part => kept[part] != null && S.overrides[r.key]?.[e.ex.id]?.[part] == null
    ? ` Changed in Hevy to ${kept[part]} (SHAZAM's pick: ${part === 'single' ? e.single : e.weight}).` : '';
  const lines = [];
  const step = e.ex.jump < 1 ? 0.5 : e.ex.jump < 2.5 ? 1 : 2.5;
  if (e.ex.single && (!change || change.part === 'single')) {
    const c = change?.part === 'single' ? change : null;
    lines.push(`<div class="chg-top"><div class="chg-name">Bench single</div>
      <div class="chg-w">${c && c.from != null ? `${esc(c.from)} &rarr;` : ''} ${weightInput(r.key, e.ex.id, 'single', ov.single ?? e.single, 1)}</div></div>
      <div class="why">${esc((e.singleReason || 'Starting weight') + keptNote('single'))}</div>`);
  }
  if (!change || change.part === 'work') {
    const c = change?.part === 'work' ? change : null;
    lines.push(`<div class="chg-top" ${lines.length ? 'style="margin-top:8px"' : ''}><div class="chg-name ${kindClass(e.kind)}">${esc(e.ex.single ? 'Bench back-offs' : e.ex.name)}</div>
      <div class="chg-w">${c && c.from != null ? `${esc(c.from)} &rarr;` : ''} ${weightInput(r.key, e.ex.id, 'weight', ov.weight ?? e.weight, step)}</div></div>
      <div class="why">${esc(e.ex.sets)} x ${esc(e.ex.reps.join('-'))}. ${esc(e.reason + keptNote('weight'))}</div>`);
  }
  const last = e.last ? `<div class="last">Last: ${esc(fmtDay(e.last.day))}, ${esc(fmtSets(e.last.sets))}</div>` : '';
  const flags = (!change || change.part === 'work') ? e.flags.map(f => `<div class="flag">${esc(f)}</div>`).join('') : '';
  return `<div class="chg">${e.ex.single && !change ? `<div class="chg-name" style="margin-bottom:6px">${esc(e.ex.name)}</div>` : ''}${lines.join('')}${last}${flags}</div>`;
}

function routineCard(r) {
  const existing = S.hevyRoutines.get(r.id);
  const diff = diffRoutine(progOf(r.key), r, existing, effective(r.key));
  const keptIds = Object.keys(S.kept[r.key] || {});
  const flagged = r.exercises.filter(e => (e.flags.length || keptIds.includes(e.ex.id)) && !diff.changes.some(c => c.ex.id === e.ex.id));
  const showAll = !!S.showAll[r.key];

  let body = '';
  if (!existing) body += `<div class="err">This routine isn't in Hevy (id ${esc(r.id)}). Tell Claude.</div>`;
  body += diff.changes.map(c => exerciseRow(r, r.exercises.find(e => e.ex.id === c.ex.id), c)).join('');
  body += flagged.map(e => exerciseRow(r, e, null)).join('');
  if (diff.structure.length)
    body += `<div class="struct"><b>Hevy changed this routine:</b><br>${diff.structure.map(esc).join('<br>')}<br>Send puts the plan back.</div>`;
  if (diff.same && !flagged.length) body += `<div class="sub">Hevy already has these targets.</div>`;

  body += `<button class="toggle" data-toggle="${esc(r.key)}">${showAll ? 'Hide' : 'Show all'} ${r.exercises.length} exercises</button>`;
  if (showAll) body += `<div class="allx">${r.exercises.map(e => exerciseRow(r, e, null)).join('')}</div>`;

  const sending = S.sending === r.key;
  if (!diff.same && existing)
    body += `<button class="btn btn-bolt send" data-send="${esc(r.key)}" ${S.sending ? 'disabled' : ''}>${sending ? 'Sending…' : 'Send to Hevy'}</button>`;

  return `<div class="card" id="card-${esc(r.key)}">
    <div class="r-head"><div><div class="title-l">${esc(r.title)}</div><div class="sub">Last done ${esc(fmtDay(r.lastDone))}</div></div>
    <span class="chip ${diff.same ? 'ok' : 'todo'}">${diff.same ? 'Up to date' : 'Needs sending'}</span></div>
    ${body}</div>`;
}

function renderTargets() {
  const el = $('page-targets');
  if (!getKey()) {
    el.innerHTML = `<div class="card hero"><div class="eyebrow">Welcome</div><div class="title-xl">Connect Hevy</div>
      <div class="sub">SHAZAM reads your workouts from Hevy and works out the next targets.</div></div>
      <div class="card"><div class="empty">Add your Hevy API key in <b>Settings</b> to start.</div>
      <button class="btn btn-primary" data-page="settings">Go to Settings</button></div>`;
    return;
  }
  const n = S.workouts.filter(w => localDay(w.start_time) >= PROGRAM.startDate).length;
  let html = `<div class="card hero"><div class="eyebrow">Next targets</div><div class="title-xl">Review &amp; send</div>
    <div class="sub">${S.loading ? 'Reading Hevy…' : S.loadedAt ? `Read from Hevy at ${esc(S.loadedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}. ${n} workouts since ${esc(fmtDay(PROGRAM.startDate))}.` : ''}</div>
    <div style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-refresh ${S.loading ? 'disabled' : ''}>Refresh</button></div></div>`;
  html += `<div class="key"><span class="k-up">&#9679; Up</span><span>&#9679; Same</span><span class="k-down">&#9679; Down</span><span class="k-reset">&#9679; Planned reset</span></div>`;
  if (S.error) html += `<div class="err">${esc(S.error)}</div>`;
  if (S.targets.length) html += S.targets.map(routineCard).join('');
  el.innerHTML = html;
}

// ---------- progress page ----------

const shortDay = day => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const markClass = k => ({ up: 'k-up', down: 'k-down', skip: 'k-skip' }[k] || '');
const markShort = s => (s.kind === 'same' ? 'Same' : s.label.split(' (')[0]);
const dot = k => `<span class="mk ${markClass(k)}">${k === 'skip' ? '&#9675;' : '&#9679;'}</span>`;

function renderProgressIfOpen() {
  if ($('page-progress').classList.contains('active')) renderProgress();
}

function renderProgress() {
  const el = $('page-progress');
  if (!getKey()) { el.innerHTML = `<div class="card"><div class="empty">Add your Hevy API key in <b>Settings</b> to see your progress.</div></div>`; return; }
  if (!S.progress) {
    el.innerHTML = S.error ? `<div class="err">${esc(S.error)}</div>` : `<div class="card"><div class="empty">Reading Hevy…</div></div>`;
    return;
  }
  el.innerHTML = S.progEx && S.progress.exercises[S.progEx] ? progressDetail(S.progress.exercises[S.progEx]) : progressList();
}

const progKey = `<div class="key"><span class="k-up">&#9679; Better</span><span>&#9679; Same</span><span class="k-down">&#9679; Worse</span><span class="k-skip">&#9675; Not judged</span></div>`;

function progressRow(h) {
  const last = h.sessions[h.sessions.length - 1];
  const sub = last ? `${esc(shortDay(last.day))} &middot; ${esc(fmtSets(last.work.length ? last.work : last.sets))}` : 'No sessions yet';
  return `<button class="p-row" data-ex="${esc(h.id)}">
    <div class="p-main"><div class="p-name">${esc(h.name)}</div><div class="p-sub">${sub}</div>
    ${last ? `<div class="p-mark ${markClass(last.kind)}">${dot(last.kind)} ${esc(markShort(last))}</div>` : ''}</div>
    <span class="p-go">&rsaquo;</span></button>`;
}

function progressList() {
  const P = S.progress;
  let html = `<div class="card hero"><div class="eyebrow">Progressive overload</div><div class="title-xl">Progress</div>
    <div class="sub">Every session since ${esc(fmtDay(PROGRAM.historyStart))}, compared with the one before. Tap an exercise.</div></div>${progKey}`;
  html += P.groups.map(g => `<div class="card"><div class="title-l" style="margin-bottom:6px">${esc(g.title)}</div>
    ${g.ids.map(id => progressRow(P.exercises[id])).join('')}</div>`).join('');
  if (P.dropped.length)
    html += `<details class="card dropped"><summary>No longer in the program (${P.dropped.length})</summary>
      ${P.dropped.map(id => progressRow(P.exercises[id])).join('')}</details>`;
  return html;
}

function sessionRow(h, s, prev) {
  const divider = prev && prev.day < PROGRAM.startDate && s.day >= PROGRAM.startDate
    ? `<div class="p-div">New program started ${esc(fmtDay(PROGRAM.startDate))}</div>` : '';
  const sets = h.bench
    ? `${s.single ? `<div>Single ${esc(fmtSets([s.single]))}</div>` : ''}<div>${s.work.length ? `Back-offs ${esc(fmtSets(s.work))}` : 'No back-offs'}</div>`
    : `<div>${esc(fmtSets(s.sets))}</div>`;
  return `<div class="s-row" id="s-${esc(s.workoutId)}"><div class="s-top"><div class="s-day">${esc(fmtDay(s.day))}</div>
    <div class="s-rt">${esc(s.routine)}</div></div>
    <div class="s-sets">${sets}</div>
    <div class="s-mark ${markClass(s.kind)}">${dot(s.kind)} ${esc(s.label)}</div></div>${divider}`;
}

function progressDetail(h) {
  const pts = chartPoints(h);
  const list = h.sessions.map((s, i) => sessionRow(h, s, h.sessions[i - 1])).reverse().join('');
  let charts = '';
  if (pts.length) {
    const series = [{ key: 'weight', name: h.bench ? 'Back-offs' : 'Weight', cls: 'c-main' }];
    if (h.bench) series.push({ key: 'single', name: 'Single', cls: 'c-single', dash: true });
    charts = `<div class="card">
      <div class="c-title">Weight (lb)</div>
      ${h.bench ? `<div class="c-legend"><span><i class="lg c-main"></i>Back-offs</span><span><i class="lg c-single dash"></i>Single</span></div>` : ''}
      ${lineChart(pts, series)}
      <div class="c-title" style="margin-top:14px">Total reps${h.bench ? ' (back-offs)' : ''}</div>
      ${barChart(pts)}
      <div class="c-tip" id="c-tip">Tap a dot or bar to see that session.</div></div>`;
  }
  return `<button class="toggle" data-back>&lsaquo; All exercises</button>
    <div class="card"><div class="title-l">${esc(h.name)}</div>
    <div class="sub">${h.sessions.length} session${h.sessions.length === 1 ? '' : 's'} since ${esc(fmtDay(PROGRAM.historyStart))}</div></div>
    ${charts}${progKey}
    <div class="card">${list || '<div class="empty">No sessions yet.</div>'}</div>`;
}

// ---------- charts (plain SVG) ----------

const CW = 340, PADL = 34, PADR = 12;
function xScale(pts) {
  const days = pts.map(p => Date.parse(p.day));
  const lo = Math.min(...days), hi = Math.max(...days);
  return day => (hi === lo ? (PADL + CW - PADR) / 2 : PADL + ((Date.parse(day) - lo) / (hi - lo)) * (CW - PADL - PADR));
}
function niceTicks(lo, hi, count = 3) {
  if (lo === hi) { lo -= 5; hi += 5; }
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
  const start = Math.floor(lo / step) * step, end = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = start; v <= end + 1e-9; v += step) ticks.push(+v.toFixed(2));
  return ticks;
}
// The "new program" line, when the chart spans Nov 2.
function programLine(pts, x, top, bottom) {
  if (!(pts[0].day < PROGRAM.startDate && pts[pts.length - 1].day >= PROGRAM.startDate)) return '';
  const xs = x(PROGRAM.startDate);
  return `<line x1="${xs}" x2="${xs}" y1="${top}" y2="${bottom}" class="c-prog"/>
    <text x="${xs > CW - 80 ? xs - 3 : xs + 3}" y="${top + 8}" class="c-ax" text-anchor="${xs > CW - 80 ? 'end' : 'start'}">New program</text>`;
}
function xLabels(pts, x, y) {
  const first = pts[0], last = pts[pts.length - 1];
  const l = [`<text x="${x(first.day)}" y="${y}" class="c-ax" text-anchor="${pts.length === 1 ? 'middle' : 'start'}">${esc(shortDay(first.day))}</text>`];
  if (pts.length > 1) l.push(`<text x="${x(last.day)}" y="${y}" class="c-ax" text-anchor="end">${esc(shortDay(last.day))}</text>`);
  return l.join('');
}

function lineChart(pts, series) {
  const H = 150, top = 10, bottom = H - 20;
  const vals = series.flatMap(s => pts.map(p => p[s.key]).filter(v => v != null));
  const ticks = niceTicks(Math.min(...vals), Math.max(...vals));
  const lo = ticks[0], hi = ticks[ticks.length - 1];
  const x = xScale(pts), y = v => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
  let svg = ticks.map(t => `<line x1="${PADL}" x2="${CW - PADR}" y1="${y(t)}" y2="${y(t)}" class="c-grid"/>
    <text x="${PADL - 5}" y="${y(t) + 3}" class="c-ax" text-anchor="end">${t}</text>`).join('');
  svg += programLine(pts, x, top, bottom);
  for (const s of series) {
    const sp = pts.map((p, i) => ({ ...p, i })).filter(p => p[s.key] != null);
    if (sp.length > 1)
      svg += `<polyline points="${sp.map(p => `${x(p.day)},${y(p[s.key])}`).join(' ')}" class="c-line ${s.cls}${s.dash ? ' dash' : ''}"/>`;
    svg += sp.map(p => `<circle cx="${x(p.day)}" cy="${y(p[s.key])}" r="4.5" class="c-pt ${s.cls}${p.kind === 'skip' && s.key === 'weight' ? ' hollow' : ''}"/>
      <circle cx="${x(p.day)}" cy="${y(p[s.key])}" r="14" class="c-hit" data-pt="${p.i}"/>`).join('');
  }
  svg += xLabels(pts, x, H - 4);
  return `<svg viewBox="0 0 ${CW} ${H}" class="chart" role="img" aria-label="Weight over time">${svg}</svg>`;
}

function barChart(pts) {
  const H = 110, top = 8, bottom = H - 20;
  const vals = pts.map(p => p.reps).filter(v => v != null);
  if (!vals.length) return '';
  const ticks = niceTicks(0, Math.max(...vals), 2);
  const hi = ticks[ticks.length - 1];
  const x = xScale(pts), y = v => bottom - (v / hi) * (bottom - top);
  const bw = Math.max(6, Math.min(18, (CW - PADL - PADR) / pts.length - 4));
  let svg = ticks.map(t => `<line x1="${PADL}" x2="${CW - PADR}" y1="${y(t)}" y2="${y(t)}" class="c-grid"/>
    <text x="${PADL - 5}" y="${y(t) + 3}" class="c-ax" text-anchor="end">${t}</text>`).join('');
  svg += programLine(pts, x, top, bottom);
  svg += pts.map((p, i) => {
    if (p.reps == null) return '';
    const bx = Math.min(Math.max(x(p.day) - bw / 2, PADL), CW - PADR - bw), h = bottom - y(p.reps), r = Math.min(4, h / 2, bw / 2);
    // Rounded top, square at the baseline.
    const d = `M${bx},${bottom} V${y(p.reps) + r} Q${bx},${y(p.reps)} ${bx + r},${y(p.reps)} H${bx + bw - r} Q${bx + bw},${y(p.reps)} ${bx + bw},${y(p.reps) + r} V${bottom} Z`;
    return `<path d="${d}" class="c-bar${p.kind === 'skip' ? ' hollow' : ''}"/>
      <rect x="${bx - 3}" y="${top}" width="${bw + 6}" height="${bottom - top}" class="c-hit" data-pt="${i}"/>`;
  }).join('');
  svg += xLabels(pts, x, H - 4);
  return `<svg viewBox="0 0 ${CW} ${H}" class="chart" role="img" aria-label="Total reps over time">${svg}</svg>`;
}

function showPoint(i) {
  const h = S.progress.exercises[S.progEx];
  const p = chartPoints(h)[i];
  const s = h.sessions.find(x => x.day === p.day && (x.work.length || x.single));
  const tip = $('c-tip');
  if (!s || !tip) return;
  const sets = h.bench ? [s.single && `single ${fmtSets([s.single])}`, s.work.length && `back-offs ${fmtSets(s.work)}`].filter(Boolean).join('; ') : fmtSets(s.sets);
  tip.innerHTML = `<b>${esc(fmtDay(s.day))}</b>: ${esc(sets)}<br><span class="${markClass(s.kind)}">${dot(s.kind)} ${esc(s.label)}</span>`;
  document.querySelectorAll('.c-hit.on').forEach(e => e.classList.remove('on'));
  document.querySelectorAll(`.c-hit[data-pt="${i}"]`).forEach(e => e.classList.add('on'));
}

// ---------- sending ----------

async function send(rKey) {
  const r = S.targets.find(t => t.key === rKey);
  const prog = progOf(rKey);
  const loaded = S.hevyRoutines.get(r.id);
  S.sending = rKey; renderTargets();
  try {
    const hevy = new Hevy(getKey());
    // Re-read first, so a change made in Hevy since SHAZAM loaded isn't overwritten.
    const now = await hevy.routine(r.id);
    if (now.updated_at !== loaded.updated_at) {
      toast('This routine changed in Hevy since SHAZAM loaded. Reloaded: check it again.', 'err');
      S.sending = null;
      await load();
      return;
    }
    await hevy.putRoutine(r.id, buildRoutineBody(prog, r, now, effective(rKey)));
    toast(`${r.title} sent to Hevy`, 'ok');
  } catch (e) {
    toast(e.message || String(e), 'err');
  }
  S.sending = null;
  await load();
}

// ---------- settings page ----------

function renderSettings() {
  const has = !!getKey();
  $('page-settings').innerHTML = `
    <div class="card"><div class="title-l" style="margin-bottom:12px">Hevy</div>
      <div class="field"><label for="key">API key</label>
        <input id="key" type="password" autocomplete="off" placeholder="${has ? 'Saved on this device' : 'Paste your Hevy API key'}">
        <div class="help">From Hevy: Settings, Developer. Saved only in this browser on this device, never anywhere else.</div></div>
      <div class="btn-row"><button class="btn btn-primary btn-sm" data-savekey>Save and test</button>
      ${has ? '<button class="btn btn-ghost btn-sm" data-forget>Forget key</button>' : ''}</div>
      <div class="sub" id="key-status" style="margin-top:10px"></div></div>
    <div class="card" style="font-size:12px;color:var(--muted);line-height:1.6">
      SHAZAM ${VERSION}. Reads every workout since ${esc(fmtDay(PROGRAM.startDate))} and replays the rules.
      Only the ${PROGRAM.routines.length} Shazam routines are ever changed, and only when you tap Send.
      To change the program, tell Claude.</div>`;
}

async function saveKey() {
  const v = $('key').value.trim();
  if (!v) { $('key-status').textContent = 'Paste a key first.'; return; }
  $('key-status').textContent = 'Testing…';
  try {
    const u = await new Hevy(v).user();
    setKey(v);
    $('key').value = '';
    $('key-status').textContent = `Connected as ${u?.data?.name || u?.name || 'your Hevy account'}.`;
    renderSettings();
    $('key-status').textContent = `Connected as ${u?.data?.name || u?.name || 'your Hevy account'}.`;
    load();
  } catch (e) {
    $('key-status').textContent = e.message;
  }
}

// ---------- plate calculator ----------

const BAR = 45;
const PLATES = [45, 35, 25, 10, 5, 2.5, 1, 0.75, 0.5];
const PC_COLORS = { 45: '#C0392B', 35: '#2980B9', 25: '#E0922A', 10: '#27AE60', 5: '#6B7785', 2.5: '#A7AEB5', 1: '#FFC72C', 0.75: '#F0A500', 0.5: '#9CA3AF' };
let pcMode = 'olympic';

function pcPlates(total, barW) {
  let side = (total - barW) / 2;
  if (side <= 0) return [];
  const out = [];
  for (const p of PLATES) {
    let c = 0;
    while (side + 1e-6 >= p) { side -= p; c++; }
    if (c) out.push({ w: p, c });
    side = Math.round(side * 100) / 100;
  }
  return out;
}

function renderPlates() {
  const mon = S.targets.flatMap(r => r.exercises).find(e => e.ex.rule === 'mondayBench');
  const start = mon?.weight || 135;
  $('page-plates').innerHTML = `
    <div class="card hero"><div class="eyebrow">Tool</div><div class="title-xl">Plate Calculator</div><div class="sub">What to load on each side</div></div>
    <div class="card">
      <div class="pc-mode">
        <button data-pc="olympic" class="${pcMode === 'olympic' ? 'sel' : ''}">&#9889; Olympic Bar<small>bar = ${BAR} lb</small></button>
        <button data-pc="machine" class="${pcMode === 'machine' ? 'sel' : ''}">&#128296; Plate-Loaded Machine<small>per side, no bar</small></button>
      </div>
      <div class="pc-wt"><input type="number" inputmode="decimal" id="pc-weight" value="${start}"><span style="color:var(--muted)">lb total</span></div>
      <div class="pc-adj">${[-5, -1, 1, 5, 45].map(d => `<button data-adj="${d}">${d > 0 ? '+' : '&minus;'}${Math.abs(d)}</button>`).join('')}</div>
      <div id="pc-result"></div>
    </div>
    <div class="card" style="font-size:12px;color:var(--muted);line-height:1.5;">
      <strong style="color:var(--text)">Olympic Bar</strong> subtracts the ${BAR} lb bar, then splits the rest evenly across both sides.<br>
      <strong style="color:var(--text)">Plate-Loaded Machine</strong> (pendulum squat, leg press, Hammer Strength) treats the carriage as zero and splits the number across both sides.
    </div>`;
  pcCalc();
}

function pcCalc() {
  const i = $('pc-weight'), r = $('pc-result');
  if (!i || !r) return;
  const total = parseFloat(i.value) || 0;
  const barW = pcMode === 'olympic' ? BAR : 0;
  if (total <= 0) { r.innerHTML = ''; return; }
  if (pcMode === 'olympic' && total < barW) { r.innerHTML = `<div class="pc-note warn">That's less than the ${barW} lb bar.</div>`; return; }
  const plates = pcPlates(total, barW);
  const perSide = plates.reduce((s, p) => s + p.c * p.w, 0);
  const achievable = barW + perSide * 2;
  const chips = plates.flatMap(p => Array(p.c).fill(p.w)).map(w =>
    `<div class="pc-plate" style="height:${34 + (w / 45) * 52}px;background:${PC_COLORS[w]};${w < 5 ? 'color:#1A1A1A;' : ''}">${w}</div>`).join('');
  r.innerHTML = `
    <div class="pc-side">Each side &bull; ${perSide} lb</div>
    <div class="pc-stack">${pcMode === 'olympic' ? '<div class="pc-plate" style="height:24px;width:46px;background:var(--ink);">BAR</div>' : ''}${chips || `<span style="color:var(--muted);font-size:13px">just the ${pcMode === 'olympic' ? 'bar' : 'carriage'}</span>`}</div>
    <div class="pc-total">${achievable} lb total</div>
    ${Math.abs(achievable - total) < 0.05 ? '' : `<div class="pc-note warn">Closest loadable: ${achievable} lb (you entered ${total}).</div>`}
    <div class="pc-note">${plates.map(p => p.c + '×' + p.w).join(' + ')}${plates.length ? ' per side' : ''}</div>`;
}

// ---------- shared UI ----------

let toastT;
function toast(msg, kind) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (kind ? ' ' + kind : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.className = 'toast'), 3500);
}

function confirmModal(title, body, ok) {
  $('modal-t').textContent = title;
  $('modal-p').textContent = body;
  $('modal').classList.add('on');
  $('modal-ok').onclick = () => { $('modal').classList.remove('on'); ok(); };
  $('modal-no').onclick = () => $('modal').classList.remove('on');
}

function showPage(p) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.pg === p));
  document.querySelectorAll('.page').forEach(x => x.classList.toggle('active', x.id === 'page-' + p));
  if (p === 'targets') renderTargets();
  if (p === 'progress') renderProgress();
  if (p === 'plates') renderPlates();
  if (p === 'settings') renderSettings();
}

document.addEventListener('click', ev => {
  const pt = ev.target.closest('[data-pt]');
  if (pt) { showPoint(+pt.dataset.pt); return; }
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.pg) { if (t.dataset.pg === 'progress') S.progEx = null; showPage(t.dataset.pg); }
  else if (t.dataset.ex) { S.progEx = t.dataset.ex; renderProgress(); window.scrollTo(0, 0); }
  else if ('back' in t.dataset) { S.progEx = null; renderProgress(); window.scrollTo(0, 0); }
  else if (t.dataset.page) showPage(t.dataset.page);
  else if ('refresh' in t.dataset) load();
  else if (t.dataset.toggle) { S.showAll[t.dataset.toggle] = !S.showAll[t.dataset.toggle]; renderTargets(); }
  else if (t.dataset.send) {
    const r = S.targets.find(x => x.key === t.dataset.send);
    confirmModal(`Send ${r.title}?`, 'This replaces the routine in Hevy with these targets, sets and notes.', () => send(r.key));
  }
  else if ('savekey' in t.dataset) saveKey();
  else if ('forget' in t.dataset) confirmModal('Forget the API key?', 'SHAZAM will stop reading Hevy on this device until you add it again.', () => { setKey(''); S.targets = []; S.progress = null; renderSettings(); updateHeader(); });
  else if (t.dataset.pc) { pcMode = t.dataset.pc; renderPlates(); }
  else if (t.dataset.adj) { const i = $('pc-weight'); i.value = Math.max(0, (parseFloat(i.value) || 0) + +t.dataset.adj); pcCalc(); }
});

document.addEventListener('change', ev => {
  const i = ev.target;
  if (!i.dataset.ov) return;
  const [rKey, exId, part] = i.dataset.ov.split('|');
  const r = S.targets.find(x => x.key === rKey);
  const e = r.exercises.find(x => x.ex.id === exId);
  const v = parseFloat(i.value);
  S.overrides[rKey] = S.overrides[rKey] || {};
  S.overrides[rKey][exId] = S.overrides[rKey][exId] || {};
  if (!(v >= 0) || v === (S.kept[rKey]?.[exId]?.[part] ?? e[part])) delete S.overrides[rKey][exId][part];
  else S.overrides[rKey][exId][part] = v;
  renderTargets();
});

document.addEventListener('input', ev => { if (ev.target.id === 'pc-weight') pcCalc(); });

// ---------- start ----------

$('ver').textContent = VERSION;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && getKey() && !S.loading && !S.sending) load(); });
renderTargets();
load();
