// Run with: npm test
process.env.TZ = 'America/New_York';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROGRAM } from '../program.js';
import { computeTargets, buildRoutineBody, diffRoutine, keptInHevy, lbToKg, kgToLb, fmtSets } from '../rules.js';

// ---------- helpers ----------

const routine = key => PROGRAM.routines.find(r => r.key === key);
const exId = (key, name) => {
  const ex = routine(key).exercises.find(e => e.name.toLowerCase().includes(name.toLowerCase()));
  if (!ex) throw new Error(`no ${name} in ${key}`);
  return ex.id;
};

// "w135x10, 250x1@8, 237x6@9.5" -> Hevy sets
function sets(spec) {
  return spec.split(',').map(s => s.trim()).map((s, i) => {
    const m = s.match(/^(w?)([\d.]+)x(\d+)(?:@([\d.]+))?$/);
    if (!m) throw new Error('bad set ' + s);
    return { index: i, type: m[1] ? 'warmup' : 'normal', weight_kg: lbToKg(+m[2]), reps: +m[3], rpe: m[4] ? +m[4] : null };
  });
}

let n = 0;
// workout('2026-11-02', 'monday', { 'Bench': 'w135x10, 250x1@8, ...' })
function workout(day, key, exercises) {
  return {
    id: 'w' + ++n,
    routine_id: routine(key).id,
    start_time: `${day}T22:00:00+00:00`,
    exercises: Object.entries(exercises).map(([name, spec]) => ({
      exercise_template_id: name.startsWith('#') ? name.slice(1) : exId(key, name),
      notes: null,
      sets: sets(spec),
    })),
  };
}

const target = (out, key, name) => out.find(r => r.key === key).exercises.find(e => e.ex.id === exId(key, name));

// The real week of Nov 2 (first week of the new program).
const NOV2 = [
  workout('2026-11-02', 'monday', {
    'Bench Press': 'w135x10, w185x4, w205x2, w225x1, 250x1@8, 237x6@9.5, 237x5@9.5, 237x5@10',
    'Pendulum': '7.5x10, 7.5x10, 7.5x10, 7.5x10@10',
    'Incline Chest': '180x10, 180x9, 180x8@10',
    'Lateral Raise': '80x12, 80x12, 80x10, 80x10',
    'Overhead': '57.5x12, 57.5x12, 57.5x12, 57.5x10',
  }),
  workout('2026-11-03', 'tuesday', {
    'Lat Pulldown': '185x10@10, 185x9@9.5, 185x7@10, 185x7@10',
    'Low Row': '180x10, 180x10, 180x10',
    'Leg Curl': '95x10, 95x10, 95x10, 95x10',
    'Rear Delt': '100x12, 100x12, 100x12, 100x9',
    'Bicep': '42.5x12, 42.5x12, 42.5x12, 42.5x12',
  }),
  workout('2026-11-05', 'thursday', {
    'Bench Press-Volume': 'w135x10, w185x4, w210x1, 217x8, 217x8, 217x8, 217x7@9.5',
    'Close Grip': '180x10, 180x9@9.5, 180x7@10',
    'Iso-Lateral Row': '180x12, 180x12, 180x11',
    'Hip Thrust': '160x10, 160x10',
    'Arsenal': '37.5x12, 37.5x12, 37.5x10, 37.5x10',
    'Rope': '65x12, 65x12',
    'Bayesian': '20x10, 20x10',
  }),
  workout('2026-11-06', 'friday', {
    '#C7973E0E': '140x10, 140x10', // Leg Press: not in Friday's plan any more
    'Incline Fly': '145x12, 145x12, 145x12',
    '#3092FADD': '75x12, 105x10', // Hammer triceps machine: not in the plan
    'Seated Dip': '205x10, 205x10, 205x10',
  }),
];

// ---------- the real week matches the targets Claude set by hand on Nov 7 ----------

test('week of Nov 2 gives the same targets Claude set in Hevy on Nov 7', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const want = {
    monday: { 'Bench Press': 237, 'Pendulum': 10, 'Incline Chest': 180, 'Lateral Raise': 80, 'Overhead': 57.5 },
    tuesday: { 'Lat Pulldown': 185, 'Low Row': 185, 'Leg Curl': 100, 'Rear Delt': 100, 'Bicep': 45 },
    thursday: { 'Bench Press-Volume': 217, 'Close Grip': 180, 'Iso-Lateral Row': 180, 'Hip Thrust': 170,
      'Arsenal': 37.5, 'Rope': 67.5, 'Bayesian': 20, 'Leg Press': 150 },
    friday: { 'Incline Fly': 150, 'Seated Dip': 205, 'Skullcrusher': 20, 'Rear Delt': 100, 'Bayesian': 20 },
  };
  for (const [key, exs] of Object.entries(want))
    for (const [name, w] of Object.entries(exs))
      assert.equal(target(out, key, name).weight, w, `${key} ${name}`);
  assert.equal(target(out, 'monday', 'Bench Press').single, 250);
});

test('Nov 2 bench back-offs 237 x 6, 5, 5 at RPE 9.5+ hold, and say why', () => {
  const t = target(computeTargets(PROGRAM, NOV2, '2026-11-07'), 'monday', 'Bench Press');
  assert.equal(t.kind, 'hold');
  assert.match(t.reason, /RPE 9.5, needs 8.5 or less/);
  assert.match(t.singleReason, /RPE 8: on target/);
});

test('reasons read plainly', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  assert.equal(target(out, 'thursday', 'Rope').reason, 'Every set hit 12');
  assert.equal(target(out, 'tuesday', 'Lat Pulldown').reason, 'Holds: set 2 had 9, needs 10');
  assert.match(target(out, 'thursday', 'Bench Press-Volume').reason, /Last set RPE 9.5: holds/);
  assert.equal(target(out, 'friday', 'Skullcrusher').kind, 'start');
});

// ---------- accessories (strict rule) ----------

test('a miss holds; two misses in a row drop about 10% and show the reason', () => {
  const w = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
    workout('2026-11-10', 'tuesday', { 'Low Row': '180x9, 180x7, 180x5' }),
  ];
  const one = target(computeTargets(PROGRAM, w.slice(0, 1), '2026-11-04'), 'tuesday', 'Low Row');
  assert.equal(one.weight, 180);
  assert.equal(one.kind, 'miss');
  assert.match(one.reason, /Miss 1 of 2 \(set 3 had 5, below 6\)/);
  const two = target(computeTargets(PROGRAM, w, '2026-11-11'), 'tuesday', 'Low Row');
  assert.equal(two.weight, 160); // 162 rounded to the 5 lb jump
  assert.equal(two.kind, 'down');
  assert.match(two.reason, /2 misses in a row/);
});

test('a clean session between two misses resets the miss count', () => {
  const w = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
    workout('2026-11-10', 'tuesday', { 'Low Row': '180x10, 180x8, 180x6' }),
    workout('2026-11-24', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
  ];
  assert.equal(target(computeTargets(PROGRAM, w, '2026-11-25'), 'tuesday', 'Low Row').weight, 180);
});

test('cut short: weight stays, and it does not count as a miss or break a miss streak', () => {
  const w = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
    workout('2026-11-10', 'tuesday', { 'Low Row': '180x10, 180x10' }),
  ];
  const t = target(computeTargets(PROGRAM, w, '2026-11-11'), 'tuesday', 'Low Row');
  assert.equal(t.kind, 'short');
  assert.equal(t.weight, 180);
  w.push(workout('2026-11-17', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }));
  assert.equal(target(computeTargets(PROGRAM, w, '2026-11-18'), 'tuesday', 'Low Row').kind, 'down');
});

test('an exercise not done (or swapped out) keeps its target', () => {
  const w = [workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x10, 180x10' })];
  const out = computeTargets(PROGRAM, w, '2026-11-04');
  assert.equal(target(out, 'tuesday', 'Leg Curl').weight, 50);
  assert.equal(target(out, 'tuesday', 'Leg Curl').kind, 'start');
});

test('weight lowered partway: next time starts at the lower weight', () => {
  const w = [workout('2026-11-03', 'tuesday', { 'Low Row': '190x8, 180x10, 180x10' })];
  const t = target(computeTargets(PROGRAM, w, '2026-11-04'), 'tuesday', 'Low Row');
  assert.equal(t.weight, 180);
  assert.match(t.reason, /lowered partway/);
});

test('weight raised after a too-easy first set: the rules start from what was lifted', () => {
  const w = [workout('2026-11-05', 'thursday', { 'Rope': '50x15, 65x12' })];
  assert.equal(target(computeTargets(PROGRAM, w, '2026-11-06'), 'thursday', 'Rope').weight, 67.5);
});

test('extra sets beyond the plan are ignored', () => {
  const w = [workout('2026-11-05', 'thursday', { 'Iso-Lateral Row': '180x12, 180x12, 180x12, 180x6, 180x5' })];
  assert.equal(target(computeTargets(PROGRAM, w, '2026-11-06'), 'thursday', 'Iso-Lateral Row').weight, 185);
});

test('stall: 3 sessions at the same weight with no added reps is flagged, not dropped', () => {
  const w = [
    workout('2026-11-02', 'monday', { 'Incline Chest': '180x10, 180x9, 180x8' }),
    workout('2026-11-09', 'monday', { 'Incline Chest': '180x10, 180x9, 180x7' }),
    workout('2026-11-16', 'monday', { 'Incline Chest': '180x10, 180x8, 180x8' }),
  ];
  const t = target(computeTargets(PROGRAM, w, '2026-11-17'), 'monday', 'Incline Chest');
  assert.equal(t.weight, 180);
  assert.match(t.flags.join(), /Stalled: 3 sessions at 180/);
  w[2] = workout('2026-11-16', 'monday', { 'Incline Chest': '180x10, 180x10, 180x8' });
  assert.equal(target(computeTargets(PROGRAM, w, '2026-11-17'), 'monday', 'Incline Chest').flags.length, 0);
});

// ---------- after a week off ----------

test('first session of each routine after 8+ empty days holds, even if every set hit the top', () => {
  const w = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x9, 180x9' }),
    workout('2026-11-13', 'friday', { 'Incline Fly': '150x12, 150x12, 150x12' }),
    // Nov 14 to 22: 9 empty days
    workout('2026-11-24', 'tuesday', { 'Low Row': '180x10, 180x10, 180x10' }),
  ];
  const t = target(computeTargets(PROGRAM, w, '2026-11-25'), 'tuesday', 'Low Row');
  assert.equal(t.weight, 180);
  assert.equal(t.kind, 'break');
  // the next Tuesday runs the normal rules
  w.push(workout('2026-12-01', 'tuesday', { 'Low Row': '180x10, 180x10, 180x10' }));
  assert.equal(target(computeTargets(PROGRAM, w, '2026-12-02'), 'tuesday', 'Low Row').weight, 185);
});

test('after a week off, a miss does not count', () => {
  const w = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
    workout('2026-11-24', 'tuesday', { 'Low Row': '180x10, 180x8, 180x5' }),
  ];
  const t = target(computeTargets(PROGRAM, w, '2026-11-25'), 'tuesday', 'Low Row');
  assert.equal(t.weight, 180);
  assert.equal(t.kind, 'break');
});

test('7 empty days is not a week off; skipping one routine while training others is not either', () => {
  const sevenEmpty = [
    workout('2026-11-02', 'monday', { 'Incline Chest': '180x10, 180x9, 180x9' }),
    workout('2026-11-10', 'monday', { 'Incline Chest': '180x10, 180x10, 180x10' }),
  ];
  assert.equal(target(computeTargets(PROGRAM, sevenEmpty, '2026-11-11'), 'monday', 'Incline Chest').weight, 185);
  const skipped = [
    workout('2026-11-03', 'tuesday', { 'Low Row': '180x10, 180x9, 180x9' }),
    workout('2026-11-09', 'monday', { 'Incline Chest': '180x10, 180x10, 180x10' }),
    workout('2026-11-17', 'tuesday', { 'Low Row': '180x10, 180x10, 180x10' }),
  ];
  assert.equal(target(computeTargets(PROGRAM, skipped, '2026-11-18'), 'tuesday', 'Low Row').weight, 185);
});

// ---------- Monday bench ----------

const mon = (day, spec) => workout(day, 'monday', { 'Bench Press': spec });
const bench = (w, today) => target(computeTargets(PROGRAM, w, today), 'monday', 'Bench Press');

test('Monday back-offs: +1 when the best set hits 6, none below 4, every set RPE 8.5 or less', () => {
  assert.equal(bench([mon('2026-11-02', '250x1@8, 237x6@8, 237x5@8.5, 237x5@8.5')], '2026-11-03').weight, 238);
  assert.equal(bench([mon('2026-11-02', '250x1@8, 237x6@8, 237x5@8.5, 237x5@9')], '2026-11-03').weight, 237);
  assert.equal(bench([mon('2026-11-02', '250x1@8, 237x6@8, 237x5@8, 237x3@8')], '2026-11-03').weight, 237);
  assert.equal(bench([mon('2026-11-02', '250x1@8, 237x5@8, 237x5@8, 237x5@8')], '2026-11-03').weight, 237);
  const noRpe = bench([mon('2026-11-02', '250x1@8, 237x6@8, 237x6, 237x6@8')], '2026-11-03');
  assert.equal(noRpe.weight, 237);
  assert.match(noRpe.reason, /no RPE on set 2/);
});

test('Monday back-off reps flat for 3 Mondays: down about 5%', () => {
  const NORESET = { ...PROGRAM, resets: [] }; // the real Nov 16 reset would clear the history
  const bench = (w, today) => target(computeTargets(NORESET, w, today), 'monday', 'Bench Press');
  const w = [
    mon('2026-11-02', '250x1@8, 237x6@9.5, 237x5@9.5, 237x5@10'),
    mon('2026-11-09', '250x1@8, 237x5@9.5, 237x5@9.5, 237x5@10'),
    mon('2026-11-23', '250x1@8, 237x5@9, 237x5@9.5, 237x5@10'),
  ];
  // Nov 23 is after a week off, so it holds and doesn't count
  assert.equal(bench(w, '2026-11-24').weight, 237);
  w.push(mon('2026-11-30', '250x1@8, 237x6@9.5, 237x5@9.5, 237x5@10'));
  const t = bench(w, '2026-12-01');
  assert.equal(t.weight, 225);
  assert.match(t.reason, /flat for 3 Mondays \(16, 15, 16\)/);
});

test('Monday single: RPE 9+ drops 5, RPE 7 or less two weeks running adds 2, RPE 7.5 to 8.5 holds', () => {
  assert.equal(bench([mon('2026-11-02', '250x1@9, 237x6@8, 237x5@8, 237x5@8')], '2026-11-03').single, 245);
  assert.equal(bench([mon('2026-11-02', '250x1@8.5, 237x6@8, 237x5@8, 237x5@8')], '2026-11-03').single, 250);
  const easy = [mon('2026-11-02', '250x1@7, 237x5@8, 237x5@8, 237x5@8')];
  assert.equal(bench(easy, '2026-11-03').single, 250);
  easy.push(mon('2026-11-09', '250x1@6.5, 237x5@8, 237x5@8, 237x5@8'));
  assert.equal(bench(easy, '2026-11-10').single, 252);
});

test('Bill raising the single himself: SHAZAM goes from what was lifted', () => {
  assert.equal(bench([mon('2026-11-02', '255x1@8, 237x5@8, 237x5@8, 237x5@8')], '2026-11-03').single, 255);
});

// ---------- Thursday bench ----------

const thu = (day, spec) => workout(day, 'thursday', { 'Bench Press-Volume': spec });
const vol = (w, today) => target(computeTargets(PROGRAM, w, today), 'thursday', 'Bench Press-Volume');

test('Thursday bench: all 4 at 8 and last set RPE 8.5 or less: +1', () => {
  assert.equal(vol([thu('2026-11-05', '217x8, 217x8, 217x8, 217x8@8.5')], '2026-11-06').weight, 218);
  assert.equal(vol([thu('2026-11-05', '217x8, 217x8, 217x8, 217x8@9')], '2026-11-06').weight, 217);
  assert.equal(vol([thu('2026-11-05', '217x8, 217x8, 217x8, 217x8')], '2026-11-06').weight, 217);
});

test('Thursday bench: last set RPE 9.5+ two Thursdays in a row: down 5', () => {
  const w = [thu('2026-11-05', '217x8, 217x8, 217x8, 217x7@9.5'), thu('2026-11-12', '217x8, 217x8, 217x7, 217x7@10')];
  const t = vol(w, '2026-11-13');
  assert.equal(t.weight, 212);
  assert.equal(t.kind, 'down');
});

test('Thursday bench above 95% of Monday back-offs gets a warning, not a change', () => {
  const w = [mon('2026-11-02', '250x1@8, 230x6@9, 230x5@9, 230x5@9'), thu('2026-11-05', '220x8, 220x8, 220x8, 220x8@8')];
  const t = vol(w, '2026-11-06');
  assert.equal(t.weight, 221);
  assert.match(t.flags.join(), /Above 95% of Monday/);
});

// ---------- planned reset after Nov 16 ----------

test('planned reset: from Nov 16, Monday back-offs 230 and Thursday bench 212', () => {
  const w = [...NOV2,
    mon('2026-11-09', '250x1@8, 237x6@8, 237x5@8, 237x5@8'),
    thu('2026-11-12', '217x8, 217x8, 217x8, 217x8@8')];
  // before the reset date, the normal rules
  assert.equal(bench(w, '2026-11-13').weight, 238);
  assert.equal(vol(w, '2026-11-13').weight, 218);
  // from Nov 16, the reset, with its reason
  const b = bench(w, '2026-11-16');
  assert.equal(b.weight, 230);
  assert.equal(b.kind, 'reset');
  assert.equal(b.reason, 'Planned reset after the week off');
  assert.equal(b.single, 250); // the single isn't reset
  assert.equal(vol(w, '2026-11-16').weight, 212);
});

test('after the reset, the normal rules take over from what was lifted', () => {
  const w = [...NOV2,
    mon('2026-11-23', '250x1@8, 230x6@8, 230x6@8, 230x5@8'),
    mon('2026-11-30', '250x1@8, 231x6@8, 231x6@8, 231x6@8')];
  // Nov 23 is the first Monday after the week off: holds at 230
  assert.equal(bench(w.slice(0, 5), '2026-11-24').weight, 230);
  assert.equal(bench(w, '2026-12-01').weight, 232);
});

// ---------- Hevy routine body ----------

test('routine body: warm-ups, single, rep ranges, kg, notes and rest from the program', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const r = routine('monday');
  const body = buildRoutineBody(r, out[0], { notes: null }, {});
  const benchEx = body.routine.exercises[0];
  assert.equal(body.routine.title, 'Shazam Monday');
  assert.equal(benchEx.exercise_template_id, '79D0BB3A');
  assert.equal(benchEx.sets.length, 8);
  assert.deepEqual(benchEx.sets[0], { type: 'warmup', weight_kg: lbToKg(135), reps: 10, rep_range: null });
  assert.deepEqual(benchEx.sets[4], { type: 'normal', weight_kg: lbToKg(250), reps: 1, rep_range: null });
  assert.deepEqual(benchEx.sets[5], { type: 'normal', weight_kg: lbToKg(237), reps: null, rep_range: { start: 4, end: 6 } });
  assert.equal(kgToLb(body.routine.exercises[1].sets[0].weight_kg), 10);
  assert.equal(benchEx.notes, r.exercises[0].note);
});

test('overrides change what gets sent', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const body = buildRoutineBody(routine('thursday'), out[2], null, { '94B7239B': { weight: 70 } });
  const rope = body.routine.exercises.find(e => e.exercise_template_id === '94B7239B');
  assert.equal(kgToLb(rope.sets[0].weight_kg), 70);
});

// Hevy returns fixed-rep sets as a rep range with no top end, and weights with float noise.
function asHevy(body) {
  return {
    notes: body.routine.notes,
    exercises: body.routine.exercises.map(e => ({
      ...e,
      sets: e.sets.map(s => ({ ...s, weight_kg: s.weight_kg + 1e-12, reps: s.rep_range ? null : s.reps,
        rep_range: s.rep_range ?? { start: s.reps, end: null } })),
    })),
  };
}

test('diff: a routine already matching the plan shows no changes', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const r = routine('monday');
  const d = diffRoutine(r, out[0], asHevy(buildRoutineBody(r, out[0], null)));
  assert.equal(d.same, true, JSON.stringify(d.structure));
});

test('diff: lists weight changes and Hevy rewriting the routine structure', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const r = routine('friday');
  const hevy = asHevy(buildRoutineBody(r, out[3], null));
  hevy.exercises[0].sets.forEach(s => (s.weight_kg = lbToKg(145))); // Hevy wrote what was lifted
  hevy.exercises.splice(3, 2); // and dropped the exercises not done
  const d = diffRoutine(r, out[3], hevy);
  assert.equal(d.same, false);
  assert.deepEqual(d.changes.filter(c => c.from != null).map(c => [c.ex.name, c.from, c.to]), [['Incline Fly (Arsenal)', 145, 150]]);
  assert.match(d.structure.join(), /Exercises in Hevy differ/);
});

test('kept in Hevy: a change made after the last workout stands, one written by the workout does not', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-07');
  const r = routine('thursday');
  const hevy = asHevy(buildRoutineBody(r, out[2], null, { '94B7239B': { weight: 70 } }));
  hevy.updated_at = '2026-11-07T20:00:00Z'; // sent on Nov 7, after the Nov 5 workout
  assert.deepEqual(keptInHevy(r, out[2], hevy, NOV2), { '94B7239B': { weight: 70 } });
  hevy.updated_at = '2026-11-05T22:00:30Z'; // Hevy's own rewrite when the workout was saved
  assert.deepEqual(keptInHevy(r, out[2], hevy, NOV2), {});
});

test('kept in Hevy: a planned reset dated after the change still shows', () => {
  const out = computeTargets(PROGRAM, NOV2, '2026-11-16');
  const r = routine('monday');
  const hevy = asHevy(buildRoutineBody(r, out[0], null, { '79D0BB3A': { weight: 237 } }));
  hevy.updated_at = '2026-11-07T20:00:00Z';
  assert.deepEqual(keptInHevy(r, out[0], hevy, NOV2), {});
  hevy.updated_at = '2026-11-16T15:00:00Z'; // Bill changed it again after the reset date: his number stands
  assert.deepEqual(keptInHevy(r, out[0], hevy, NOV2), { '79D0BB3A': { weight: 237 } });
});

test('fmtSets', () => {
  assert.equal(fmtSets([{ w: 180, r: 10 }, { w: 180, r: 9 }, { w: 180, r: 8, rpe: 10 }]), '180 x 10, 9, 8 @10');
  assert.equal(fmtSets([{ w: 75, r: 12 }, { w: 105, r: 10 }]), '75 x 12, 105 x 10');
});
