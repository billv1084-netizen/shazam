// SHAZAM progressive overload view: every session per exercise, compared to the one before.
// No screens, no network: give it the program and the Hevy workouts.
import { loggedSets, localDay, splitSingle } from './rules.js';

function dayNum(day) {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 864e5;
}
const total = sets => sets.reduce((a, s) => a + s.r, 0);
const topW = sets => Math.max(...sets.map(s => s.w));
const same = (a, b) => Math.abs(a - b) < 0.05;

/**
 * Compares one session with the one before it (both have work sets).
 * Returns { kind, label }. kind: 'up' (better), 'same', 'down' (worse), 'skip' (not judged).
 */
export function judge(prev, cur, ctx) {
  if (!prev) return { kind: 'skip', label: 'First session' };
  if (cur.plan != null && cur.work.length < cur.plan)
    return { kind: 'skip', label: `Cut short (${cur.work.length} of ${cur.plan} sets)` };
  if (cur.plan == null && cur.day < ctx.startDate && cur.work.length < prev.work.length)
    return { kind: 'skip', label: `Fewer sets than last time (${cur.work.length}, was ${prev.work.length})` };
  if (prev.day < ctx.startDate && cur.day >= ctx.startDate)
    return { kind: 'skip', label: 'New program started' };
  if (ctx.breakDays.some(b => b > prev.day && b <= cur.day))
    return { kind: 'skip', label: 'First session after a week off' };

  const a = topW(prev.work), b = topW(cur.work);
  if (!same(a, b)) return b > a
    ? { kind: 'up', label: `More weight (${a} to ${b})` }
    : { kind: 'down', label: `Less weight (${a} to ${b})` };
  // Same weight: total reps over the sets both sessions have.
  const n = Math.min(prev.work.length, cur.work.length);
  const ra = total(prev.work.slice(0, n)), rb = total(cur.work.slice(0, n));
  const over = n < Math.max(prev.work.length, cur.work.length) ? ` over the first ${n} sets` : '';
  if (rb > ra) return { kind: 'up', label: `More reps (${ra} to ${rb}${over})` };
  if (rb < ra) return { kind: 'down', label: `Fewer reps (${ra} to ${rb}${over})` };
  return { kind: 'same', label: `Same weight and reps (${rb}${over})` };
}

/**
 * Builds the history for every exercise logged since program.historyStart.
 * Returns {
 *   groups:    [{ key, title, ids: [exId] }]  the program's routines, in gym order
 *   dropped:   [exId]                          logged but no longer in the program
 *   exercises: { [exId]: { id, name, bench, sessions } }  sessions oldest first
 * }
 * Each session: { day, workoutId, routine, sets, single, work, plan, kind, label }.
 */
export function buildProgress(program, workouts) {
  const planned = new Map(); // `${routineId}|${exId}` -> planned work sets
  const inProgram = new Map();
  for (const r of program.routines)
    for (const ex of r.exercises) {
      planned.set(`${r.id}|${ex.id}`, ex.sets);
      if (!inProgram.has(ex.id)) inProgram.set(ex.id, ex);
    }

  const sorted = workouts
    .filter(w => localDay(w.start_time) >= program.historyStart)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // First workout day after each week off (any routine).
  const breakDays = [];
  let prevDay = null;
  for (const w of sorted) {
    const day = localDay(w.start_time);
    if (prevDay && dayNum(day) - dayNum(prevDay) - 1 >= program.weekOffDays) breakDays.push(day);
    prevDay = day;
  }

  const exercises = {};
  for (const w of sorted) {
    const day = localDay(w.start_time);
    const ids = [...new Set(w.exercises.map(e => e.exercise_template_id))];
    for (const id of ids) {
      const sets = loggedSets(w, id);
      if (!sets.length) continue;
      const ex = inProgram.get(id);
      const bench = ex?.rule === 'mondayBench';
      const { single, backs } = bench ? splitSingle(sets) : { single: null, backs: sets };
      const title = w.exercises.find(e => e.exercise_template_id === id)?.title;
      const h = (exercises[id] ??= { id, name: ex?.name ?? title ?? id, bench, sessions: [] });
      h.sessions.push({
        day, workoutId: w.id, routine: w.title ?? '', sets, single, work: backs,
        plan: day >= program.startDate ? planned.get(`${w.routine_id}|${id}`) ?? null : null,
      });
    }
  }

  const ctx = { startDate: program.startDate, breakDays };
  for (const h of Object.values(exercises)) {
    let prev = null;
    for (const s of h.sessions) {
      if (!s.work.length) { Object.assign(s, { kind: 'skip', label: 'Back-offs not done' }); continue; }
      Object.assign(s, judge(prev, s, ctx));
      prev = s;
    }
  }

  const groups = program.routines.map(r => ({ key: r.key, title: r.title, ids: r.exercises.map(e => e.id) }));
  const dropped = Object.keys(exercises).filter(id => !inProgram.has(id))
    .sort((a, b) => exercises[a].name.localeCompare(exercises[b].name));
  for (const id of inProgram.keys())
    exercises[id] ??= { id, name: inProgram.get(id).name, bench: inProgram.get(id).rule === 'mondayBench', sessions: [] };
  return { groups, dropped, exercises };
}

// Chart points for one exercise: work-set weight and total reps per session (plus the single on bench).
export function chartPoints(h) {
  return h.sessions.filter(s => s.work.length || s.single).map(s => ({
    day: s.day, kind: s.kind,
    weight: s.work.length ? topW(s.work) : null,
    reps: s.work.length ? total(s.work) : null,
    single: s.single?.w ?? null,
  }));
}
