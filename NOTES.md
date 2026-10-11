# SHAZAM: Project Notes

_Last updated: 2026-10-11_

## Goal
Bill logs every workout in **StrongSplit**. **SHAZAM** reads the StrongSplit exports and:
1. Suggests the next weights and reps for each exercise.
2. Shows a **progressive overload view**: each session compared to the last, per exercise.

## Working on two computers
Both computers have the project at `C:\Users\billv\code\shazam` (second computer set up 2026-09-27). Bill expects to do most future work on the second computer.

**Starting a session (either computer):**
1. Open PowerShell.
2. `cd C:\Users\billv\code\shazam`
3. `git pull`
4. Open the Claude app, start a session in the `shazam` folder (not "No folder"), and say: "Read NOTES.md and pick up where we left off."

**Ending a session:**
1. Claude updates NOTES.md, pushes to a branch, and opens a pull request.
2. Bill merges the pull request on GitHub.

**Rule:** pull before you start, merge before you switch computers.

**Not yet on the second computer:** the private `shazam-backup` repo. Clone it there when we start the StrongSplit import work (`cd C:\Users\billv\code`, then `git clone https://github.com/billv1084-netizen/shazam-backup.git`).

**Claude preferences:** `CLAUDE.md` in this folder is a copy of Bill's personal preferences (from `C:\Users\billv\.claude\CLAUDE.md` on the first computer), so Claude follows them on either computer. It only applies to this project. If Bill changes the preferences, update both copies. Note: this repo is public, so the file is visible to anyone (it has nothing sensitive).

**Second computer setup (checked 2026-09-27):** Node.js v24.15.0 installed. GitHub CLI v2.101.0 installed and signed in as `billv1084-netizen`, with access to both `shazam` and `shazam-backup`. Nothing left to install.

## Where the data is
- **StrongSplit (the real record):** export `strongsplit_sessions_2026-09-24.csv`, 24 sessions, Jun 29 to Sep 22. Newer export `strongsplit_sessions_2026-10-03.csv` (in Downloads on the second computer) has only 3 sessions: Sep 29 (Day 1), Oct 1 (Day 2), Oct 2 (Upper 2). It does not repeat the older sessions.

### What the Oct 3 export shows (matters for the importer)
- **Unfinished sets are in the file.** `is_completed=false` rows are planned sets that weren't done. On Oct 2, only bench, shoulder press and Arsenal Lat Machine were done; pulldown, row, pec deck, face pull, triceps and curl were not. The importer must skip these, and this is a way to spot short sessions automatically.
- **Warm-ups can't be found by "lighter than the top set."** Sep 29 bench: 135x10, 185x4, 205x2, 225x1, 240x1, then a heavy single 255x1 (RPE 9.5), then 235x4 x3. The real work sets (235) are lighter than the top single. RPE 10 on the 135x10 warm-up confirms warm-up RPEs are junk.
- **Session end time can be wrong.** Oct 2 shows 20:54 to 00:37 (almost 4 hours); the last set was done at 21:44. Use set times, not end time.
- **Exercise names vary.** "Bench Press" (Day 1) vs "Bench Press-Volume" (Upper 2); "Hammer Strength  ISO-Lateral Low Row" (with a double space) on Day 2 vs "Hammer Iso Lateral Row" on Upper 2. SHAZAM needs a name list that says which names are the same exercise.
- **Routines don't fully match the Sep 24 leg plan yet.** Pendulum Squat is on Day 1 as planned. Hip Thrust is still on Day 2 (plan: move to Upper 2). Lying Leg Curl isn't in Day 2 yet.
- **SHAZAM phone data (insurance only):** exported 2026-09-27 via History > Export CSV to `C:\Users\billv\Downloads\shazam_export.csv` on the second computer (not in this public repo). 485 sets, 41 sessions, Jun 15 to Sep 22. Exercise names are unreliable because of swaps (e.g. "Hammer Flat Bench" was really machine incline fly). Jun 9 to 11 aren't in it but are on GitHub.
- **Old public data files:** `shazam_data.json` in the public `shazam` repo, and `iron300_data.json` + `legs_data.json` in the public `iron300` repo. To be deleted (see Decisions).

## Current program (from StrongSplit, week of Sep 29)
Monday is Day 1, Thursday is Day 2, Friday is Upper 2, but days move around during football season and Q4.
- **Shazam Day 1 (heavy bench):** Bench Press (ramp to a heavy single, then back-off sets), Hammer Strength Incline Press, Machine Chest Fly, Seated Machine Lateral Raise (standard machine), Pendulum Squat, Overhead Cable Triceps Extension.
- **Shazam Day 2 (pull):** Lat Pulldown, Hammer Strength ISO-Lateral Low Row, Straight Arm Lat Pulldown, Reverse Pec Dec, Cable Curl, Hammer Curl, Hip Thrust.
- **Shazam Upper 2 (volume bench):** Bench Press-Volume, Narrow Grip Pulldown, Hammer Iso Lateral Row, Hammer Shoulder Press, Pec Deck, Arsenal Lat Machine, Face Pull, Overhead Cable Triceps Extension, Cable Curl.

### Changes since the original SHAZAM program (Bill, 2026-10-03)
- **Wrist:** tendonitis again; second cortisone shot in the same wrist. The doctor recommended a procedure if it comes back. **JM Press stopped** because of this. Bill likes JM Press but doesn't want the tendonitis back. Overhead Cable Triceps Extension looks like the replacement.
- **Gym equipment changes:** the Hammer chest-supported row machine is gone. Replaced by the **Hammer ISO-Lateral Row**.
- New **Arsenal Reloaded Incline Fly** replaces the Hammer flat chest press ("Hammer Strength Chest Press" in SHAZAM).
- New **Arsenal Selectorized Standing Lateral Raise** is the second lateral raise: standard lateral raise machine on Monday, Arsenal machine on Friday.
- Confirmed: StrongSplit "Machine Chest Fly" (Day 1) = Arsenal Reloaded Incline Fly.
- Confirmed: StrongSplit "Arsenal Lat Machine" (Upper 2) = Arsenal Selectorized Standing Lateral Raise.
- Confirmed: "Hammer Strength ISO-Lateral Low Row" (Day 2) and "Hammer Iso Lateral Row" (Upper 2) are **different machines**. Track them as separate exercises.
- Decided 2026-10-03: new machines **start fresh**. Old chest-supported row history (up to 180 lb, Sep 8) is kept for reference only, not used for new targets.

### Program review (Claude, 2026-10-03; nothing decided yet)
- Upper body is well covered (chest about 17 sets a week, back about 17 if Upper 2's back work actually gets done, shoulders and arms fine).
- **Hamstrings get zero direct work.** Legs total about 5 sets a week (Pendulum Squat 3, Hip Thrust 2). Lying Leg Curl was planned but never added.
- **Sessions are too long for this season:** Day 1 ran 1h40m, Day 2 1h32m. The Day 1 bench ramp alone (9 sets, 5 of them singles) took about 38 minutes.
- Upper 2 has 9 exercises and its back work was the first thing cut on Oct 2.
- Overlap that could be trimmed: two rear delt moves (Reverse Pec Dec, Face Pull), cable curl on two days plus hammer curl, two flies (incline fly, pec deck), straight-arm pulldown.
- No core work since Pallof Press / Dead Bug dropped out.
- Idea to discuss: a short "busy week" version of each day (priority lifts only) alongside the full version.

### Training goal (Bill, 2026-10-03)
- **Until early November: maintain.** Get through football season and Q4 without losing ground. Coaching ends early November, maybe sooner depending on playoffs.
- After that: push again. A **fourth training day** is possible after football if needed.
- Time in the gym is fine on Monday and Thursday. **Friday (Upper 2, chest/back) is too long.**
- **Decided 2026-10-03: trimmed Friday (Upper 2) until November**, 5 exercises, 3 sets each, in this order: Bench Press-Volume, Hammer Iso Lateral Row, Narrow Grip Pulldown, Hammer Shoulder Press, Arsenal Standing Lateral Raise. Dropped until November: Pec Deck, Face Pull, Overhead Cable Triceps Extension, Cable Curl. Keep weights heavy; cut sets, not load. Revisit in November (bring them back or move them to a fourth day).
- Open: the Sep 24 plan moved Hip Thrust to Friday. With Friday trimmed, it probably stays on Thursday for now. Not decided.

## Issues found
1. **Workout data is in public repos.** Anyone can see it. Can't just make the repos private: free GitHub Pages hosting needs public repos. Fix: have the app sync to the private `shazam-backup` repo instead.
2. **`shazam-backup` is empty** (`{}`), so it isn't actually backing anything up.
3. All 43 tests pass, but `tests.mjs` line 228 uses `.pathname`, which breaks on Windows. Fix with `fileURLToPath` in the first build.
4. `sw.js` cache name is still `shazam-v2.2` while the app is v2.6, so phones may keep old versions.
5. The app falls back to the public `shazam` repo for backups if no repo is set. Until fixed, don't press "Back up now" in SHAZAM.

## Decisions
- 2026-09-24: Data: **StrongSplit is the accurate record.** SHAZAM's data is off because exercises were swapped for equipment availability and a wrist issue (tendonitis; see "Changes since the original SHAZAM program"), and new machines were tried (e.g. Pendulum Squat, first logged Sept 22).
- 2026-09-24: Public data files: once the private `shazam-backup` repo holds a verified copy, delete `shazam_data.json` from the public `shazam` repo and `iron300_data.json` + `legs_data.json` from the public `iron300` repo. Don't rewrite git history.
- 2026-09-24: **SHAZAM's role: prescription engine.** Bill logs only in StrongSplit. After a workout: Export in StrongSplit, then an Apple Shortcut ("Send to SHAZAM") uploads the CSV to the private `shazam-backup` repo; SHAZAM imports it on open and computes next targets. SHAZAM's own logging screens get retired or simplified. StrongSplit has no API/auto-export (checked 2026-09-24); its Shortcut actions only start routines and read recovery scores.
  - Bonus to test: StrongSplit routine import. The routines CSV (`routine,exercise,set_index,set_type,weight_lb,reps,rest_s,rpe`) carries per-set targets, so SHAZAM could generate "Shazam ..." routines with next targets filled in. Only touch routines named "Shazam ...".
  - StrongSplit appears to overwrite routines with the last-performed numbers.
  - Import caveat: every set is marked `working`, including warm-ups, and warm-up RPEs are unreliable. The importer needs a warm-up rule.
- 2026-09-24: **Must-have feature: progressive overload view.** Bill wants to see, per exercise, each session compared to the last: more weight, more reps, same, or less. StrongSplit's chart only shows an estimated 1RM, which hides what changed. Prototype on real data worked well (e.g. Hammer Incline 140x6 to 175x10/9/8 Jun to Sep). Must also flag dropped sets/short sessions so they don't count as progress (e.g. Aug 25 lat pulldown, 2 of 4 sets, was a work emergency, not a stall).
- 2026-09-24: **Legs: Pendulum Squat replaces Hack Squat** (Bill wants best bang for the buck, not attached to a specific exercise; pendulum was the research pick). Both machines are heavy with no plates added yet, so blank weight in StrongSplit means "machine only, 0 added". SHAZAM should track added plates (0, 5, 10...) and progress reps first, then plates.
- 2026-09-24: **Leg work is spread out: one leg exercise per training day**, not a dedicated leg day. This is what made 3 days/week possible. The 60-minute cap isn't strict; sessions ran over and that was fine.
- 2026-09-24: **Leg exercise per day:** Day A (heavy bench) Pendulum Squat (quads); Day B (pull) Lying Leg Curl (hamstrings, currently missing from StrongSplit); Day C (volume bench) Hip Thrust (glutes, moves from Day B).
- 2026-09-24: Hammer Strength Shoulder Press (machine) is on the third day (StrongSplit "Shazam Upper 2"), matching the brief's Day C.
- 2026-09-24: Deploy workflow: Claude pushes changes to a branch and opens a pull request; Bill reviews and merges on GitHub. No more manual web uploads.
- 2026-09-27: NOTES.md is now committed to the repo so plans sync between Bill's two computers. Routine: `git pull` before starting, merge the PR before switching computers.
- 2026-09-27: The old idea of combining SHAZAM and IRON 300 into one app is dropped. IRON 300's only remaining task is deleting its public data files.

## Open questions for Bill
- **Is StrongSplit the right logging app? (raised 2026-10-03)** StrongSplit has no API, so the plan needs a manual export plus a Shortcut after every workout, and the routine import is untested. Hevy Pro has a public API that can read workouts and create/update routines, which could remove both problems. Cost of switching: about $24/yr, learning a new app in a busy season. Old StrongSplit CSVs can still be imported into SHAZAM once. Not decided.
  - Hevy API checked 2026-10-03 (spec at api.hevyapp.com/docs, version 0.0.1). Workouts: read list, read one, and `GET /v1/workouts/events` (changes since a date, so SHAZAM only fetches what's new). Each logged set has `type` (`normal`, `warmup`, `dropset`, `failure`), `weight_kg`, `reps`, `rpe`. Routines: create and update (`PUT /v1/routines/{id}`); each routine set can have `type`, `weight_kg`, `reps`, `rep_range`. No target RPE on routine sets. Weights are kilograms only, so SHAZAM converts lb to kg and back. Needs Hevy Pro and an `api-key` header. Hevy warns the API is new and may change or be dropped ("use at your own risk").
  - Not verified yet: whether a web page on the phone can call the API directly (browser security rules may block it), how Hevy handles planned sets that weren't done, and whether kg conversion shows clean lb numbers in the app.
  - Bill logs RPE on working sets only, not warm-ups. Hevy logs RPE per set, and its `warmup` set type would mark warm-ups directly.
  - RPE in Hevy: logged per set, and SHAZAM can read it. It's for logging only: routines can't hold a target RPE, just weight and reps. RPE may need to be switched on in Hevy's settings (not confirmed; check during a trial).
  - 2026-10-04: **Bill subscribed to Hevy Pro.** Unknown #1 answered: Hevy's API allows calls from any web page (`Access-Control-Allow-Origin: *`, allows the `api-key` header), so SHAZAM on the phone can talk to Hevy directly. No server needed.
  - API key handling: Bill saves it in `C:\Users\billv\.hevy\api_key.txt` (outside this public repo). Never commit it or paste it in chat. Saved and tested on the second computer 2026-10-04: account `billv1084`, weight unit lbs, 0 workouts so far.
  - 2026-10-06: **Hevy set up.** RPE switched on in the app. Created via the API: custom exercises "Incline Fly (Arsenal)" and "Standing Lateral Raise (Arsenal)", folder "Shazam", routines "Shazam Day 1", "Shazam Day 2", "Shazam Upper 2" (trimmed Friday). Starting weights copied from the last StrongSplit sessions; warm-ups use Hevy's `warmup` set type (Day 1: 135 to 240 are warm-ups, 255 single is the first working set). Leg curl not added (undecided).
  - Exercise mapping (StrongSplit to Hevy): Bench Press and Bench Press-Volume to Bench Press (Barbell); Hammer Strength Incline Press to Incline Chest Press (Machine); Machine Chest Fly to Incline Fly (Arsenal); Seated Machine Lateral Raise to Lateral Raise (Machine); Pendulum Squat to Pendulum Squat (Machine); Overhead Cable Triceps Extension to Overhead Triceps Extension (Cable); Lat Pulldown to Lat Pulldown (Cable); Hammer Strength ISO-Lateral Low Row to Iso-Lateral Low Row; Straight Arm Lat Pulldown to Straight Arm Lat Pulldown (Cable); Reverse Pec Dec to Rear Delt Reverse Fly (Machine); Cable Curl to Bicep Curl (Cable); Hammer Curl to Hammer Curl (Dumbbell); Hip Thrust to Hip Thrust (Machine) (plate loaded); Hammer Iso Lateral Row to Iso-Lateral Row (Machine); Narrow Grip Pulldown to Lat Pulldown - Close Grip (Cable); Hammer Shoulder Press to Shoulder Press (Machine Plates); Arsenal Lat Machine to Standing Lateral Raise (Arsenal).
  - Hevy API quirks found (differ from its docs): creating a custom exercise returns a bare id, not JSON; an empty routine folder list comes back under the key `routines`, not `routine_folders`. Weights round-trip with tiny float noise (75 lb comes back as 74.99999999999999), so SHAZAM must round when converting kg to lb.
  - Unknown #2 answered 2026-10-06: the Hevy app shows clean pound numbers (75, 185) and warm-up markers. Remaining unknown: what Hevy does with planned sets that weren't done. Test with Bill's next real workout.
  - **First week in Hevy (checked 2026-10-11):** 3 workouts logged: Day 1 (Oct 6), Day 2 (Oct 8), Upper 2 (Oct 9). SHAZAM can read them all through the API.
    - Unknown #3 answered: **sets that weren't done are left out of the workout.** Oct 8 Iso-Lateral Low Row: 2 of 4 sets. Oct 9 Shoulder Press: 1 of 3. Oct 6 Pendulum Squat: 2 of 3. So a short exercise can only be spotted by comparing with the plan, and SHAZAM has to keep its own copy of the plan.
    - **Hevy overwrites the routine after each workout** with what was actually lifted (routine `updated_at` matches each workout's end time). Skipped sets stay in the routine at the old numbers. Same behavior StrongSplit had. Means SHAZAM's targets get replaced unless SHAZAM rewrites the routines after each workout.
    - **Exercise notes work as a "cut short" marker.** Bill wrote "Work call. Had to stop." on the Low Row. SHAZAM can read this.
    - RPE logged on Day 1 bench working sets and Day 2 Lat Pulldown only.
    - Hevy sets have no timestamps, so a wrong session end time can't be fixed from set times. Oct 9 shows 3h22m, probably finished late in the app.
    - Progress already visible: Day 1 bench back-offs 235x5/5/4 (Sep 29: 235x4 x3); heavy single 255 at RPE 9 (was 9.5).
    - Oct 9 bench 212 lb x8 x4 is correct, not a typo. It's SHAZAM's rule: Friday bench = 90% of Monday's working weight (235 x 0.9 = 211.5, rounded to 212 with microplates). Claude should have checked the code before asking.
  - **SHAZAM's progression rules still apply (confirmed with Bill 2026-10-11).** They live in `index.html` (`PROGRAM`, `updateProgression`, `roundLoad`). Summary: each exercise has a set count and rep range; hit the top of the range on every set and the weight goes up next time (bench +1 lb using 0.5 lb microplates per side, most machines and cables +5, lateral raises and rear delts +2.5); miss it and the weight stays; miss twice in a row and it drops about 10%. Upper 2 bench is pegged to 90% of Day 1 bench. Note: `PROGRAM` still lists the old exercises (JM Press, Chest-Supported Row, Hack Squat and others), so the new exercises need rules assigned before SHAZAM can make targets for them.
  - **Rules for the current exercises (approved by Bill 2026-10-11; the four rule changes below are still being discussed one at a time).** Format: sets x rep range, weight jump. "Next" is what the rule gives from the Oct 6 to 9 workouts.
    - Day 1: Bench Press 3x4-6, +1, heavy single at RPE 7 to 8 (next 235). Incline Chest Press (Machine) 3x6-10, +5 (next 180). Incline Fly (Arsenal) 3x10-15, +5 (next 135). Lateral Raise (Machine) 3x10-15, +2.5 (next 75). Pendulum Squat 3x8-12, +5 added (next 5, cut short). Overhead Triceps Extension (Cable) 3x10-15, +2.5 (next 50).
    - Day 2: Lat Pulldown 4x6-10, +5, loose rule (next 185). Iso-Lateral Low Row 4x6-10, +5 (next 180, cut short). Straight Arm Lat Pulldown 2x10-15, +5 (next 75). Rear Delt Reverse Fly 3x10-15, +2.5 (next 95). Bicep Curl (Cable) 3x8-12, +2.5 (next 42.5). Hammer Curl 2x8-12, +5 (next 30). Hip Thrust 2x8-12, +10 (next 150).
    - Upper 2 (trimmed): Bench Press-Volume 4x6-8, pegged at 90% of Day 1 (next 212). Lat Pulldown Close Grip 3x6-10, +5, loose rule (next 175). Iso-Lateral Row (Machine) 3x8-12, +5 (next 180). Shoulder Press (Machine Plates) 3x6-10, +5 (next 125, cut short). Standing Lateral Raise (Arsenal) 3x10-15, +2.5 (next 35).
    - Rule changes proposed: (1) **Decided 2026-10-11:** a "miss" means any set below the bottom of the range; two misses in a row drop the weight about 10%. Today a miss only counts if a set is marked with a red X in SHAZAM, and Hevy has no red X, so the 10% drop would never happen. (2) **Decided 2026-10-11:** fewer sets than planned means "cut short": weight stays, never counts as success or miss, shown flagged in the progress view. An exercise not done at all is ignored. Notes are for Bill only; SHAZAM doesn't interpret them. Bill: when a weight is too heavy he lowers it or does the reps he can, he doesn't stop early, so cut short in practice means time. (2b) **Decided 2026-10-11:** if the weight is lowered partway through an exercise, next time starts at the lower weight; go back up once all sets hit the top of the range. Watch for data-entry slips: Oct 6 Incline Fly shows 135x12, 130x11, 130x10, but Bill says he didn't lower it. The plan (from Sep 29 StrongSplit) was 130x12 x3, so only set 1 was edited. Bill confirmed: 135 for all 3 sets (12, 11, 10). Bill to fix it in Hevy (Edit Workout). Lesson: Hevy pre-fills planned weights, so unedited sets get logged as planned. (3) No separate maintenance mode until November; holding and progressing on easy days is fine. (4) The heavy single stays at RPE 7 to 8. Bill is doing it at RPE 9 to 9.5.
    - Weight steps (Bill, 2026-10-11): any machine or cable can go up 2.5 or 5 lb, because Bill hooks a plate to the pin when the stack has no add-on. So the jump is picked per exercise: +2.5 for small isolation moves (lateral raises, rear delts, triceps, cable curl), +5 for bigger machines, +10 for Hip Thrust. Dumbbells stay +5 (next dumbbell up).
  - Proposed next step: a 1 to 2 week Hevy Pro trial so Claude can test the three unknowns with Bill's account before he decides. Bill will decide at the end of planning.
- **Real-life schedule (2026-10-03):** football season and Q4 at work. Bill skips exercises, moves days, and sometimes does two routines back to back (Oct 1 and 2: Day 2, then Upper 2 with back work skipped). SHAZAM's targets should probably work per exercise, not depend on a fixed day order, and skipped exercises shouldn't count as stalls. To discuss in the build plan.
- **Warm-up rule:** StrongSplit marks every set as `working`. How should SHAZAM tell warm-ups apart (e.g. any set well below the top weight for that exercise)?
- **Short sessions:** Should you be able to mark a session as "cut short" so it doesn't count toward progression, or should SHAZAM detect it on its own (e.g. fewer sets than planned)?
- **SHAZAM's logging screens:** retire them completely, or keep a simplified version?
- **Routine import (test on phone):** if SHAZAM generates a routine with the same name as an existing one, does StrongSplit replace it or make a duplicate?

## Next steps
- [x] Install Node.js and GitHub CLI on the second computer (2026-09-27)
- [x] Back up current SHAZAM phone data (2026-09-27, CSV export)
- [x] Commit NOTES.md to GitHub so both computers have it (2026-09-27)
- [ ] Answer the open questions above
- [ ] Clone `shazam-backup` on the second computer; put the StrongSplit export and `shazam_export.csv` in it
- [ ] Add Lying Leg Curl to Day B in StrongSplit
- [ ] Write the detailed build plan here (importer, progressive overload view, next-target suggestions, "Send to SHAZAM" Shortcut, fixes for issues 3 to 5)
- [ ] Once `shazam-backup` has a verified copy, delete the public data files
