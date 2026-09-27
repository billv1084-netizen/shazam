# Workout Apps: Project Notes

_Last updated: 2026-09-27_

## Goal
Improve and combine the two workout apps (**SHAZAM** and **IRON 300**) into one app.

## What we have

| | IRON 300 | SHAZAM |
|---|---|---|
| Used | Mar 27 to May 26, 2026 (30 workouts synced) | Jun 9 to Jun 11, 2026 (3 workouts synced) |
| Focus | Hitting a 300 lb bench; upper body, plus a Legs tab (hack squat, leg curl) | Back-safe 4-day program: bench, back/arms, posterior chain + legs, second bench day |
| Screens | Today, Progress, History, Plates, Settings (+ Legs, Schedule, Graphs) | Today, Progress, History, Plates, Settings |
| Strengths | Very mature progression engine (training max, RPE, deloads, Beat Up mode, 300 lb projection, streaks, rest timer); ~550 automated tests | Cleaner design; program defined as simple data; progression recomputed from the workout history; microplate (0.5 lb) support; stale-lift detection |
| Data sync | Writes `iron300_data.json` + `legs_data.json` into the **public** iron300 repo | Writes `shazam_data.json` into the **public** shazam repo by default |

SHAZAM looks like the newer redesign/successor of IRON 300.

## Issues found
1. **Workout data is in public repos.** Anyone can see it. Can't just make the repos private: free GitHub Pages hosting needs public repos. Fix: have the app sync to the private `shazam-backup` repo instead.
2. **`shazam-backup` is empty** (`{}`), so it isn't actually backing anything up.
3. **Garbled text in IRON 300 data**: notes like `Advanced Ã¢ÂÂ added 1 rep` (a text-encoding bug).
4. The GitHub copy of SHAZAM data stops at Jun 11. Newer workouts may exist only on the phone.
5. ~~Node.js isn't installed~~ Installed 2026-09-24. All 43 tests pass, but `tests.mjs` line 228 uses `.pathname`, which breaks on Windows. Fix with `fileURLToPath` in the first build.
6. `sw.js` cache name is still `shazam-v2.2` while the app is v2.6, so phones may keep old versions.
7. The app falls back to the public `shazam` repo for backups if no repo is set.

## Options for combining
- **A (recommended): SHAZAM as the base.** Import IRON 300's workout history, then bring over IRON 300's best features (300 lb dashboard/projection, readiness check + Beat Up mode, rest timer, streaks/attendance, schedule).
- **B: IRON 300 as the base**, adding SHAZAM's program as another program option.
- **C: Keep them separate** and just fix/improve each.

## Decisions
- 2026-09-24: Bill uses **SHAZAM** now, so SHAZAM is the base app (option A).
- 2026-09-24: Data: Bill logs in both SHAZAM and StrongSplit, but **StrongSplit is the accurate record**. SHAZAM's data is off because exercises were swapped for equipment availability and a wrist issue (now resolved by a cortisone shot), and new machines were tried (e.g. Pendulum Squat, first logged Sept 22). StrongSplit export `strongsplit_sessions_2026-09-24.csv` has 24 sessions, Jun 29 to Sep 22. Still back up SHAZAM's phone data before changing anything, even though it won't be the reference.
- 2026-09-24: Public data files: option A. Once the private `shazam-backup` repo holds a verified copy, delete `shazam_data.json` from the public `shazam` repo and `iron300_data.json` + `legs_data.json` from the public `iron300` repo. Don't rewrite git history.
- 2026-09-24: **SHAZAM's role: option B, prescription engine.** Bill logs only in StrongSplit. After a workout: Export in StrongSplit, then an Apple Shortcut ("Send to SHAZAM") uploads the CSV to the private `shazam-backup` repo; SHAZAM imports it on open and computes next targets. SHAZAM's own logging screens get retired or simplified. StrongSplit has no API/auto-export (checked 2026-09-24); its Shortcut actions only start routines and read recovery scores.
  - Bonus to test: StrongSplit routine import. The routines CSV (`routine,exercise,set_index,set_type,weight_lb,reps,rest_s,rpe`) carries per-set targets, so SHAZAM could generate "Shazam ..." routines with next targets filled in. Unknown: does importing an existing routine name replace it or duplicate it? Test on phone first. Only touch routines named "Shazam ...".
  - StrongSplit appears to overwrite routines with the last-performed numbers.
  - Import caveat: every set is marked `working`, including warm-ups, and warm-up RPEs are unreliable. The importer needs a warm-up rule.
- 2026-09-24: **Must-have feature: progressive overload view.** Bill wants to see, per exercise, each session compared to the last: more weight, more reps, same, or less. StrongSplit's chart only shows an estimated 1RM, which hides what changed. Prototype on real data worked well (e.g. Hammer Incline 140x6 to 175x10/9/8 Jun to Sep). Must also flag dropped sets/short sessions so they don't count as progress (e.g. Aug 25 lat pulldown, 2 of 4 sets, was a work emergency, not a stall). Consider letting Bill mark a session as "cut short" so it's excluded from progression.
- 2026-09-24: **Legs: Pendulum Squat replaces Hack Squat** (Bill wants best bang for the buck, not attached to a specific exercise; pendulum was the research pick). Both machines are heavy with no plates added yet, so blank weight in StrongSplit means "machine only, 0 added". SHAZAM should track added plates (0, 5, 10...) and progress reps first, then plates.
- 2026-09-24: **Leg work is spread out: one leg exercise per training day**, not a dedicated leg day. This is what made 3 days/week possible. The 60-minute cap isn't strict; sessions ran over and that was fine.
- 2026-09-24: **Leg exercise per day:** Day A (heavy bench) Pendulum Squat (quads); Day B (pull) Lying Leg Curl (hamstrings, currently missing from StrongSplit); Day C (volume bench) Hip Thrust (glutes, moves from Day B).
- 2026-09-24: Hammer Strength Shoulder Press (machine) is on the third day (StrongSplit "Shazam Upper 2"), matching the brief's Day C.
- 2026-09-24: Deploy workflow: Claude pushes changes to a branch and opens a pull request; Bill reviews and merges on GitHub. No more manual web uploads.
- 2026-09-27: NOTES.md is now committed to the repo so plans sync between Bill's two computers. Routine: `git pull` before starting, merge the PR before switching computers.

## Open questions for Bill
- Is the phone holding workouts newer than what's on GitHub? (Export/sync before we change anything.)
- Which IRON 300 features do you miss or want in the combined app?

## Next steps
- [ ] Answer the open questions
- [ ] Back up current phone data before any changes
- [x] Install Node.js so tests can run
- [x] Pick option A/B/C (chose A: SHAZAM as base)
- [x] Commit NOTES.md to GitHub so both computers have it (2026-09-27)
- [ ] Write the detailed plan here
