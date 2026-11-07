// SHAZAM rules engine. No screens, no network: give it the program and the Hevy
// workouts, it replays every session in order and returns the next targets.

const KG_PER_LB = 0.45359237;

export const kgToLb = kg => (kg == null ? null : Math.round((kg / KG_PER_LB) * 100) / 100);
export const lbToKg = lb => lb * KG_PER_LB;
export const roundTo = (w, step) => +(Math.round(w / step) * step).toFixed(2);

// Local calendar day (YYYY-MM-DD) of an ISO timestamp.
export function localDay(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayNum(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
}

// Logged working sets for one exercise in one workout (warm-ups and drop sets left out).
export function loggedSets(workout, exId) {
  return workout.exercises
    .filter(e => e.exercise_template_id === exId)
    .flatMap(e => e.sets)
    .filter(s => s.type !== 'warmup' && s.type !== 'dropset')
    .map(s => ({ w: kgToLb(s.weight_kg) ?? 0, r: s.reps ?? 0, rpe: s.rpe ?? null }));
}

// "180 x 10, 9, 8" or "75 x 12, 105 x 10"
export function fmtSets(sets) {
  if (!sets.length) return '';
  const rpe = s => (s.rpe != null ? ` @${s.rpe}` : '');
  if (sets.every(s => s.w === sets[0].w)) return `${sets[0].w} x ${sets.map(s => s.r + rpe(s)).join(', ')}`;
  return sets.map(s => `${s.w} x ${s.r}${rpe(s)}`).join(', ');
}

const total = sets => sets.reduce((a, s) => a + s.r, 0);
const setNo = i => `set ${i + 1}`;

// ---------- one exercise, one session ----------

// Accessories and pulldowns: every set at the top of the range = weight up.
function evalStrict(ex, st, sets, ctx) {
  const [lo, hi] = ex.reps;
  const use = sets.slice(0, ex.sets);
  const base = use[use.length - 1].w;
  const lowered = use.some(s => s.w > base);
  const atBase = use.filter(s => s.w === base);
  const pre = lowered ? `Weight lowered partway, so next time starts at ${base}. ` : '';

  if (use.length < ex.sets)
    return { weight: base, kind: 'short', counted: false, reason: `Cut short (${use.length} of ${ex.sets} sets): weight stays` };
  if (ctx.afterBreak) {
    st.missStreak = 0;
    return { weight: base, kind: 'break', counted: false, reason: 'First session after a week off: weight holds' };
  }
  if (!lowered && atBase.every(s => s.r >= hi)) {
    st.missStreak = 0;
    return { weight: roundTo(base + ex.jump, 0.5), kind: 'up', counted: true, reason: `Every set hit ${hi}` };
  }
  const miss = use.findIndex(s => s.r < lo);
  if (miss >= 0) {
    st.missStreak++;
    const why = `${setNo(miss)} had ${use[miss].r}, below ${lo}`;
    if (st.missStreak >= 2) {
      st.missStreak = 0;
      return { weight: roundTo(base * 0.9, ex.jump), kind: 'down', counted: true,
        reason: `${pre}2 misses in a row (${why}): down about 10%` };
    }
    return { weight: base, kind: 'miss', counted: true, reason: `${pre}Miss 1 of 2 (${why}): weight holds` };
  }
  st.missStreak = 0;
  const short = use.findIndex(s => s.r < hi);
  return { weight: base, kind: 'hold', counted: true,
    reason: `${pre}Holds: ${setNo(short)} had ${use[short].r}, needs ${hi}` };
}

// Monday bench: heavy single by RPE, then back-offs on the loose rule with an RPE limit.
function evalMondayBench(ex, st, sets, ctx) {
  let single = null;
  let backs = sets;
  if (sets.length && sets[0].r <= 2 && (sets.length === 1 || sets[0].w > sets[1].w)) {
    single = sets[0];
    backs = sets.slice(1);
  }
  const out = {};

  // The single
  if (!single) {
    out.single = { weight: st.single, reason: 'Single not logged: stays' };
  } else {
    const b = single.w;
    const sp = ex.single;
    if (ctx.afterBreak) { st.lowSingle = 0; out.single = { weight: b, reason: 'First session after a week off: holds' }; }
    else if (single.rpe == null) { st.lowSingle = 0; out.single = { weight: b, reason: 'No RPE logged: holds' }; }
    else if (single.rpe >= 9) { st.lowSingle = 0; out.single = { weight: b - sp.down, reason: `RPE ${single.rpe}: down ${sp.down}` }; }
    else if (single.rpe <= 7) {
      st.lowSingle++;
      if (st.lowSingle >= 2) { st.lowSingle = 0; out.single = { weight: b + sp.up, reason: `RPE 7 or less two weeks in a row: up ${sp.up}` }; }
      else out.single = { weight: b, reason: `RPE ${single.rpe}: holds (a second easy week means up ${sp.up})` };
    } else { st.lowSingle = 0; out.single = { weight: b, reason: `RPE ${single.rpe}: on target, holds` }; }
  }

  // The back-offs
  if (!backs.length) return { ...out, weight: st.weight, kind: 'none', counted: false, reason: 'Back-offs not done: weight stays' };
  const [lo, hi] = ex.reps;
  const use = backs.slice(0, ex.sets);
  const base = use[use.length - 1].w;
  const lowered = use.some(s => s.w > base);
  if (use.length < ex.sets)
    return { ...out, weight: base, kind: 'short', counted: false, reason: `Cut short (${use.length} of ${ex.sets} back-offs): weight stays` };
  if (ctx.afterBreak)
    return { ...out, weight: base, kind: 'break', counted: false, reason: 'First session after a week off: weight holds' };

  const best = Math.max(...use.map(s => s.r));
  const below = use.findIndex(s => s.r < lo);
  const noRpe = use.findIndex(s => s.rpe == null);
  const hard = use.findIndex(s => s.rpe != null && s.rpe > 8.5);
  if (!lowered && best >= hi && below < 0 && noRpe < 0 && hard < 0)
    return { ...out, weight: base + ex.jump, kind: 'up', counted: true, reason: `Best set hit ${hi}, every set RPE 8.5 or less` };

  const why = lowered ? `weight lowered partway, starts at ${base}`
    : best < hi ? `best set ${best}, needs ${hi}`
    : below >= 0 ? `${setNo(below)} had ${use[below].r}, below ${lo}`
    : noRpe >= 0 ? `no RPE on ${setNo(noRpe)}`
    : `${setNo(hard)} was RPE ${use[hard].rpe}, needs 8.5 or less`;

  // Back-off total reps flat for 3 Mondays at the same weight: drop about 5% and rebuild.
  const hist = [...st.history.filter(h => h.counted), { weight: base, total: total(use) }].slice(-3);
  if (hist.length === 3 && hist.every(h => h.weight === base) && hist[2].total <= hist[0].total)
    return { ...out, weight: roundTo(base * 0.95, 1), kind: 'down', counted: true,
      reason: `Back-off reps flat for 3 Mondays (${hist.map(h => h.total).join(', ')}): down about 5% to rebuild` };

  return { ...out, weight: base, kind: 'hold', counted: true, reason: `Holds: ${why}` };
}

// Thursday volume bench: progresses on its own by the last set's RPE.
function evalVolumeBench(ex, st, sets, ctx) {
  const [, hi] = ex.reps;
  const use = sets.slice(0, ex.sets);
  const base = use[use.length - 1].w;
  const lowered = use.some(s => s.w > base);
  if (use.length < ex.sets)
    return { weight: base, kind: 'short', counted: false, reason: `Cut short (${use.length} of ${ex.sets} sets): weight stays` };
  if (ctx.afterBreak) {
    st.hardStreak = 0;
    return { weight: base, kind: 'break', counted: false, reason: 'First session after a week off: weight holds' };
  }
  const last = use[use.length - 1];
  if (!lowered && use.every(s => s.r >= hi) && last.rpe != null && last.rpe <= 8.5) {
    st.hardStreak = 0;
    return { weight: base + ex.jump, kind: 'up', counted: true, reason: `All ${ex.sets} sets hit ${hi}, last set RPE ${last.rpe}` };
  }
  if (last.rpe != null && last.rpe >= 9.5) {
    st.hardStreak++;
    if (st.hardStreak >= 2) {
      st.hardStreak = 0;
      return { weight: base - 5, kind: 'down', counted: true, reason: `Last set RPE 9.5 or more two Thursdays in a row: down 5` };
    }
    return { weight: base, kind: 'hold', counted: true, reason: `Last set RPE ${last.rpe}: holds (a second one in a row means down 5)` };
  }
  st.hardStreak = 0;
  const short = use.findIndex(s => s.r < hi);
  const why = lowered ? `weight lowered partway, starts at ${base}`
    : short >= 0 ? `${setNo(short)} had ${use[short].r}, needs ${hi}`
    : last.rpe == null ? 'no RPE on the last set' : `last set RPE ${last.rpe}, needs 8.5 or less`;
  return { weight: base, kind: 'hold', counted: true, reason: `Holds: ${why}` };
}

const EVAL = { strict: evalStrict, mondayBench: evalMondayBench, volumeBench: evalVolumeBench };

// Accessories: 3 sessions in a row at the same weight with no added reps = stall (flag only).
function stallFlag(st, res) {
  if (!['hold', 'miss'].includes(res.kind)) return null;
  const h = st.history.filter(x => x.counted).slice(-3);
  if (h.length === 3 && h.every(x => x.weight === h[0].weight) && h[2].total <= h[0].total)
    return `Stalled: 3 sessions at ${h[0].weight} with no added reps. Worth a look.`;
  return null;
}

// ---------- replay ----------

function applyResets(program, routine, ex, st, day) {
  for (const [i, r] of program.resets.entries()) {
    if (r.routine !== routine.key || r.exercise !== ex.id || r.date > day || st.resets.has(i)) continue;
    st.resets.add(i);
    st.weight = r.weight;
    st.missStreak = st.lowSingle = st.hardStreak = 0;
    st.history = [];
    st.result = { kind: 'reset', reason: r.reason, flags: [], resetDate: r.date };
  }
}

/**
 * Replays every workout since program.startDate and returns the next targets.
 * @param program  PROGRAM from program.js
 * @param workouts Hevy workouts (any order, any routine)
 * @param today    'YYYY-MM-DD' (resets dated on or before this day apply)
 */
export function computeTargets(program, workouts, today) {
  const states = new Map();
  const key = (r, ex) => `${r.key}|${ex.id}`;
  for (const r of program.routines)
    for (const ex of r.exercises)
      states.set(key(r, ex), {
        weight: ex.start, single: ex.single?.start ?? null,
        missStreak: 0, lowSingle: 0, hardStreak: 0, history: [], resets: new Set(),
        result: { kind: 'start', reason: 'Starting weight (not done yet)', flags: [] },
        last: null,
      });

  const byId = new Map(program.routines.map(r => [r.id, r]));
  const sorted = workouts
    .filter(w => localDay(w.start_time) >= program.startDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const pendingBreak = {};
  const lastDone = {};
  let prevDay = null;
  for (const w of sorted) {
    const day = localDay(w.start_time);
    // A week off: weekOffDays or more empty days between two workouts (any routine).
    if (prevDay && dayNum(day) - dayNum(prevDay) - 1 >= program.weekOffDays)
      for (const r of program.routines) pendingBreak[r.key] = true;
    prevDay = day;

    const routine = byId.get(w.routine_id);
    if (!routine) continue;
    const afterBreak = !!pendingBreak[routine.key];
    pendingBreak[routine.key] = false;
    lastDone[routine.key] = day;

    for (const ex of routine.exercises) {
      const st = states.get(key(routine, ex));
      applyResets(program, routine, ex, st, day);
      const sets = loggedSets(w, ex.id);
      if (!sets.length) continue; // not done (or swapped out): ignored
      const res = EVAL[ex.rule](ex, st, sets, { afterBreak });
      const flags = [];
      if (res.kind !== 'none') {
        const work = benchWork(ex, sets).slice(0, ex.sets);
        st.history.push({ day, weight: work[work.length - 1].w, total: total(work), counted: res.counted });
        if (ex.rule === 'strict') { const f = stallFlag(st, res); if (f) flags.push(f); }
      }
      st.weight = res.weight;
      if (res.single) st.single = res.single.weight;
      st.result = { kind: res.kind, reason: res.reason, single: res.single, flags };
      st.last = { day, sets, workoutId: w.id };
    }
  }

  // Resets that are due today but have no session yet.
  for (const r of program.routines)
    for (const ex of r.exercises) applyResets(program, r, ex, states.get(key(r, ex)), today);

  const out = program.routines.map(r => ({
    key: r.key, id: r.id, title: r.title, lastDone: lastDone[r.key] ?? null,
    exercises: r.exercises.map(ex => {
      const st = states.get(key(r, ex));
      return { ex, weight: st.weight, single: st.single, kind: st.result.kind, reason: st.result.reason,
        singleReason: st.result.single?.reason ?? null, flags: [...st.result.flags], last: st.last,
        resetDate: st.result.resetDate ?? null };
    }),
  }));

  // Thursday bench warning if it passes 95% of Monday's back-offs.
  const mon = out.flatMap(r => r.exercises).find(e => e.ex.rule === 'mondayBench');
  for (const e of out.flatMap(r => r.exercises))
    if (e.ex.rule === 'volumeBench' && mon && e.weight > mon.weight * 0.95)
      e.flags.push(`Above 95% of Monday's back-offs (${mon.weight}). Keep it a volume day.`);

  return out;
}

// Work sets the history tracks: Monday bench tracks the back-offs, everything else all sets.
function benchWork(ex, sets) {
  if (ex.rule !== 'mondayBench') return sets;
  if (sets.length && sets[0].r <= 2 && (sets.length === 1 || sets[0].w > sets[1].w)) return sets.slice(1);
  return sets;
}

/**
 * Weights already changed in Hevy since the routine's last workout (a Send, Claude, or Bill in the app).
 * Those stand until the next workout, so SHAZAM doesn't keep offering to undo them.
 * A planned reset dated after that change still wins.
 * Returns { [exId]: { weight?, single? } } with SHAZAM's own pick kept for display.
 */
export function keptInHevy(routine, targets, existing, workouts) {
  if (!existing?.updated_at) return {};
  const saved = workouts.filter(w => w.routine_id === routine.id).map(w => Date.parse(w.created_at || w.end_time || w.start_time));
  const lastSaved = saved.length ? Math.max(...saved) : 0;
  if (Date.parse(existing.updated_at) <= lastSaved + 60e3) return {};
  const changedDay = localDay(existing.updated_at);
  const kept = {};
  for (const c of diffRoutine(routine, targets, existing).changes) {
    const e = targets.exercises.find(x => x.ex.id === c.ex.id);
    if (c.from == null || (c.part === 'work' && e.kind === 'reset' && e.resetDate > changedDay)) continue;
    (kept[c.ex.id] ??= {})[c.part === 'single' ? 'single' : 'weight'] = c.from;
  }
  return kept;
}

// ---------- Hevy routine body and comparison ----------

// The sets SHAZAM wants in Hevy for one exercise, in lb.
export function plannedSets(ex, target) {
  const sets = [];
  for (const [w, r] of ex.warmups ?? []) sets.push({ type: 'warmup', lb: w, reps: r, range: null });
  if (ex.single) sets.push({ type: 'normal', lb: target.single, reps: 1, range: null });
  for (let i = 0; i < ex.sets; i++) sets.push({ type: 'normal', lb: target.weight, reps: null, range: [...ex.reps] });
  return sets;
}

// Body for PUT /v1/routines/{id}. overrides: { [exId]: { weight?, single? } }
export function buildRoutineBody(routine, targets, existing, overrides = {}) {
  return {
    routine: {
      title: routine.title,
      notes: existing?.notes ?? null,
      exercises: routine.exercises.map((ex, i) => {
        const t = { ...targets.exercises[i], ...(overrides[ex.id] ?? {}) };
        return {
          exercise_template_id: ex.id,
          superset_id: null,
          rest_seconds: ex.rest,
          notes: ex.note,
          sets: plannedSets(ex, t).map(s => ({
            type: s.type,
            weight_kg: lbToKg(s.lb),
            reps: s.reps,
            rep_range: s.range ? { start: s.range[0], end: s.range[1] } : null,
          })),
        };
      }),
    },
  };
}

// Hevy routine exercise -> same shape as plannedSets.
function hevySets(e) {
  return e.sets.map(s => {
    const range = s.rep_range && s.rep_range.end != null ? [s.rep_range.start, s.rep_range.end] : null;
    return { type: s.type, lb: kgToLb(s.weight_kg), reps: range ? null : (s.reps ?? s.rep_range?.start ?? null), range };
  });
}
const sameSet = (a, b) => a.type === b.type && Math.abs((a.lb ?? 0) - (b.lb ?? 0)) < 0.05 && a.reps === b.reps &&
  JSON.stringify(a.range) === JSON.stringify(b.range);

/**
 * Compares SHAZAM's plan with the routine as it is in Hevy now.
 * Returns { changes: [{ ex, part, from, to }], structure: [text], same: bool }
 */
export function diffRoutine(routine, targets, existing, overrides = {}) {
  const changes = [];
  const structure = [];
  const have = existing?.exercises ?? [];
  if (have.map(e => e.exercise_template_id).join() !== routine.exercises.map(e => e.id).join())
    structure.push('Exercises in Hevy differ from the plan (added, removed or moved)');
  routine.exercises.forEach((ex, i) => {
    const t = { ...targets.exercises[i], ...(overrides[ex.id] ?? {}) };
    const want = plannedSets(ex, t);
    const h = have.find(e => e.exercise_template_id === ex.id);
    if (!h) { changes.push({ ex, part: 'work', from: null, to: t.weight }); return; }
    const got = hevySets(h);
    const hevyWork = got.filter(s => s.type === 'normal' && s.range);
    const from = hevyWork.length ? hevyWork[hevyWork.length - 1].lb : null;
    if (from !== t.weight) changes.push({ ex, part: 'work', from, to: t.weight });
    if (ex.single) {
      const hs = got.find(s => s.type === 'normal' && !s.range);
      const fromS = hs ? hs.lb : null;
      if (fromS !== t.single) changes.push({ ex, part: 'single', from: fromS, to: t.single });
    }
    const weightsOnly = want.length === got.length && want.every((s, j) => sameSet({ ...s, lb: 0 }, { ...got[j], lb: 0 }));
    if (!weightsOnly) structure.push(`${ex.name}: sets or rep ranges differ from the plan`);
    else if (!want.every((s, j) => sameSet(s, got[j])) && !changes.some(c => c.ex === ex))
      structure.push(`${ex.name}: set weights differ from each other in Hevy`);
    if ((h.notes ?? '') !== ex.note) structure.push(`${ex.name}: note differs from the plan`);
    if ((h.rest_seconds ?? null) !== ex.rest) structure.push(`${ex.name}: rest timer differs`);
  });
  return { changes, structure, same: !changes.length && !structure.length };
}
