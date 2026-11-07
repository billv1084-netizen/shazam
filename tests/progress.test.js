// Run with: npm test
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM } from '../program.js';
import { lbToKg } from '../rules.js';
import { buildProgress, chartPoints } from '../progress.js';

// ---------- helpers (same shape as Hevy workouts) ----------

const routine = key => PROGRAM.routines.find(r => r.key === key);
const exId = (key, name) => {
  const ex = routine(key).exercises.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
  if (!ex) throw new Error(`no ${name} in ${key}`);
  return ex.id;
};
function sets(spec) {
  return spec.split(',').map(s => s.trim()).map((s, i) => {
    const m = s.match(/^(w?)([\d.]+)x(\d+)(?:@([\d.]+))?$/);
    if (!m) throw new Error('bad set ' + s);
    return { index: i, type: m[1] ? 'warmup' : 'normal', weight_kg: lbToKg(+m[2]), reps: +m[3], rpe: m[4] ? +m[4] : null };
  });
}
let n = 0;
// '#ID|Title' logs an exercise that isn't in that routine's plan.
function workout(day, key, exercises) {
  return {
    id: 'w' + ++n, title: routine(key).title, routine_id: routine(key).id,
    start_time: `${day}T22:00:00+00:00`,
    exercises: Object.entries(exercises).map(([name, spec]) => {
      const [id, title] = name.startsWith('#') ? name.slice(1).split('|') : [exId(key, name), name];
      return { exercise_template_id: id, title, notes: null, sets: sets(spec) };
    }),
  };
}
const sessions = (p, key, name) => p.exercises[exId(key, name)].sessions;
const kinds = list => list.map(s => s.kind);

// Real Monday bench, Oct 6 to Nov 2.
const BENCH = [
  workout('2026-10-06', 'monday', { 'Bench Press': 'w135x10, w185x4, 255x1@9, 235x5, 235x5, 235x4' }),
  workout('2026-10-12', 'monday', { 'Bench Press': 'w135x10, 245x1@8, 235x6, 235x6, 235x5' }),
  workout('2026-10-20', 'monday', { 'Bench Press': 'w135x10, 246x1@8, 236x6@8.5, 236x5@9, 236x5@9' }),
  workout('2026-10-27', 'monday', { 'Bench Press': 'w135x10, 250x1@8.5, 237x5@8.5, 237x5@9.5, 237x5@9.5' }),
  workout('2026-11-02', 'monday', { 'Bench Press': 'w135x10, 250x1@8, 237x6@9.5, 237x5@9.5, 237x5@10' }),
];

// ---------- Monday bench ----------

test('Monday bench is judged on the back-offs, the single is kept apart', () => {
  const s = sessions(buildProgress(PROGRAM, BENCH), 'monday', 'Bench Press');
  assert.deepEqual(kinds(s), ['skip', 'up', 'up', 'up', 'skip']);
  assert.equal(s[0].label, 'First session');
  assert.equal(s[1].label, 'More reps (14 to 17)');
  assert.equal(s[2].label, 'More weight (235 to 236)');
  assert.equal(s[4].label, 'New program started');
  assert.equal(s[1].single.w, 245);
  assert.equal(s[1].work.length, 3);
});

test('chart points carry the back-off weight, total reps and the single', () => {
  const p = buildProgress(PROGRAM, BENCH);
  const pts = chartPoints(p.exercises[exId('monday', 'Bench Press')]);
  assert.deepEqual(pts[1], { day: '2026-10-12', kind: 'up', weight: 235, reps: 17, single: 245 });
  assert.equal(pts.length, 5);
});

test('warm-ups are never counted', () => {
  const s = sessions(buildProgress(PROGRAM, BENCH), 'monday', 'Bench Press');
  assert.ok(s.every(x => x.sets.every(set => set.w > 205)));
});

// ---------- the marker rule ----------

test('weight up counts as better even when reps drop', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-02', 'monday', { 'Incline Chest': '180x10, 180x9, 180x8' }),
    workout('2026-11-09', 'monday', { 'Incline Chest': '185x9, 185x8, 185x7' }),
  ]);
  assert.deepEqual(kinds(sessions(p, 'monday', 'Incline Chest')), ['skip', 'up']);
});

test('same weight: more reps up, fewer reps down, same is same', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x9, 180x8' }),
    workout('2026-11-10', 'tuesday', { 'Low Row': '180x10, 180x10, 180x9' }),
    workout('2026-11-11', 'tuesday', { 'Low Row': '180x10, 180x10, 180x9' }),
    workout('2026-11-12', 'tuesday', { 'Low Row': '180x10, 180x9, 180x9' }),
  ]);
  const s = sessions(p, 'tuesday', 'Low Row');
  assert.deepEqual(kinds(s), ['skip', 'up', 'same', 'down']);
  assert.equal(s[1].label, 'More reps (27 to 29)');
  assert.equal(s[3].label, 'Fewer reps (29 to 28)');
});

test('less weight is down (a 10% drop looks like what it is)', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-02', 'monday', { 'Lateral Raise': '80x10, 80x9, 80x8, 80x8' }),
    workout('2026-11-09', 'monday', { 'Lateral Raise': '72.5x12, 72.5x12, 72.5x12, 72.5x12' }),
  ]);
  assert.equal(sessions(p, 'monday', 'Lateral Raise')[1].label, 'Less weight (80 to 72.5)');
});

test('reps are compared over the sets both sessions have (an extra set is not "more reps")', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-03', 'tuesday', { 'Bicep': '42.5x12, 42.5x12, 42.5x12, 42.5x12' }),
    workout('2026-11-10', 'tuesday', { 'Bicep': '42.5x12, 42.5x12, 42.5x12, 42.5x12, 42.5x10' }),
  ]);
  const s = sessions(p, 'tuesday', 'Bicep')[1];
  assert.equal(s.kind, 'same');
  assert.equal(s.label, 'Same weight and reps (48 over the first 4 sets)');
});

// ---------- not judged ----------

test('cut short (fewer sets than the plan) is not judged, and the next session still compares fairly', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-03', 'tuesday', { 'Leg Curl': '95x10, 95x10, 95x10, 95x10' }),
    workout('2026-11-10', 'tuesday', { 'Leg Curl': '100x10, 100x8' }),
    workout('2026-11-11', 'tuesday', { 'Leg Curl': '100x10, 100x9, 100x8, 100x8' }),
  ]);
  const s = sessions(p, 'tuesday', 'Leg Curl');
  assert.equal(s[1].label, 'Cut short (2 of 4 sets)');
  assert.equal(s[2].kind, 'up'); // 18 to 19 over the first 2 sets
});

test('before the new program: fewer sets than last time is not judged', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-10-06', 'tuesday', { 'Low Row': '175x10, 175x10, 175x10, 175x9' }),
    workout('2026-10-08', 'tuesday', { 'Low Row': '180x10, 180x9' }),
  ]);
  assert.equal(sessions(p, 'tuesday', 'Low Row')[1].label, 'Fewer sets than last time (2, was 4)');
});

test('first session after a week off is not judged (8+ days with no workout)', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-02', 'monday', { 'Overhead': '57.5x12, 57.5x12, 57.5x12, 57.5x12' }),
    workout('2026-11-13', 'friday', { 'Incline Fly': '150x12, 150x12, 150x12' }),
    workout('2026-11-23', 'monday', { 'Overhead': '57.5x10, 57.5x10, 57.5x9, 57.5x8' }),
  ]);
  assert.equal(sessions(p, 'monday', 'Overhead')[1].label, 'First session after a week off');
});

test('a week off between workouts of other routines still counts', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-03', 'tuesday', { 'Lat Pulldown': '185x10, 185x9, 185x7, 185x7' }),
    workout('2026-11-06', 'friday', { 'Incline Fly': '150x12, 150x12, 150x12' }),
    workout('2026-11-23', 'monday', { 'Overhead': '57.5x12, 57.5x12, 57.5x12, 57.5x12' }),
    workout('2026-11-24', 'tuesday', { 'Lat Pulldown': '185x8, 185x8, 185x7, 185x6' }),
  ]);
  assert.equal(sessions(p, 'tuesday', 'Lat Pulldown')[1].kind, 'skip');
});

// ---------- grouping ----------

test('groups follow the program in gym order; shared exercises share one history', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-11-03', 'tuesday', { 'Rear Delt': '100x12, 100x12, 100x12, 100x9' }),
    workout('2026-11-06', 'friday', { 'Rear Delt': '100x12, 100x12, 100x12' }),
  ]);
  assert.deepEqual(p.groups.map(g => g.title), ['Shazam Monday', 'Shazam Tuesday', 'Shazam Thursday', 'Shazam Friday']);
  assert.equal(p.groups[0].ids[0], exId('monday', 'Bench Press'));
  const id = exId('tuesday', 'Rear Delt');
  assert.ok(p.groups[1].ids.includes(id) && p.groups[3].ids.includes(id));
  assert.equal(p.exercises[id].sessions.length, 2);
  assert.equal(p.exercises[id].sessions[1].routine, 'Shazam Friday');
});

test('exercises no longer in the program go to the dropped list with their Hevy name', () => {
  const p = buildProgress(PROGRAM, [
    workout('2026-10-09', 'thursday', { '#ABCD1234|Shoulder Press (Machine Plates)': '125x10, 125x9' }),
    workout('2026-11-06', 'friday', { '#3092FADD|Triceps Extension (Machine)': '75x12, 105x10' }),
  ]);
  assert.deepEqual(p.dropped.map(id => p.exercises[id].name), ['Shoulder Press (Machine Plates)', 'Triceps Extension (Machine)']);
  assert.equal(p.exercises['3092FADD'].sessions[0].kind, 'skip');
});

test('exercises in the program with no sessions yet are listed empty', () => {
  const p = buildProgress(PROGRAM, []);
  assert.deepEqual(p.exercises[exId('friday', 'Skullcrusher')].sessions, []);
  assert.deepEqual(p.dropped, []);
});

test('workouts before the history start are left out', () => {
  const p = buildProgress(PROGRAM, [workout('2026-09-29', 'monday', { 'Incline Chest': '175x10, 175x10, 175x10' })]);
  assert.deepEqual(sessions(p, 'monday', 'Incline Chest'), []);
});
