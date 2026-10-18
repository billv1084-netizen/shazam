# SHAZAM: Project Notes

_Last updated: 2026-10-18_

## Goal
Bill logs every workout in **Hevy** (since 2026-10-06; StrongSplit retired 2026-10-11). **SHAZAM** reads the workouts from Hevy's API and:
1. Works out the next weights and reps for each exercise using SHAZAM's rules, and sends them to the Hevy routines when Bill taps "Send to Hevy".
2. Shows a **progressive overload view**: each session compared to the last, per exercise.
Old StrongSplit exports (Jun 29 to Oct 2) get imported once, for history.

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

**Not yet on the second computer:** the private `shazam-backup` repo. Clone it there when we start the history import work (`cd C:\Users\billv\code`, then `git clone https://github.com/billv1084-netizen/shazam-backup.git`).

**Claude preferences:** `CLAUDE.md` in this folder is a copy of Bill's personal preferences (from `C:\Users\billv\.claude\CLAUDE.md` on the first computer), so Claude follows them on either computer. It only applies to this project. If Bill changes the preferences, update both copies. Note: this repo is public, so the file is visible to anyone (it has nothing sensitive).

**Second computer setup (checked 2026-09-27):** Node.js v24.15.0 installed. GitHub CLI v2.101.0 installed and signed in as `billv1084-netizen`, with access to both `shazam` and `shazam-backup`. Nothing left to install.

## Where the data is
- **Hevy (the record from Oct 6 on):** read through the Hevy API. See "Hevy" below.
- **StrongSplit (history, Jun 29 to Oct 2):** export `strongsplit_sessions_2026-09-24.csv`, 24 sessions, Jun 29 to Sep 22. Newer export `strongsplit_sessions_2026-10-03.csv` (in Downloads on the second computer) has only 3 sessions: Sep 29 (Day 1), Oct 1 (Day 2), Oct 2 (Upper 2). It does not repeat the older sessions.

### What the Oct 3 StrongSplit export shows (matters for the one-time history import)
- **Unfinished sets are in the file.** `is_completed=false` rows are planned sets that weren't done. On Oct 2, only bench, shoulder press and Arsenal Lat Machine were done; pulldown, row, pec deck, face pull, triceps and curl were not. The importer must skip these, and this is a way to spot short sessions automatically.
- **Warm-ups can't be found by "lighter than the top set."** Sep 29 bench: 135x10, 185x4, 205x2, 225x1, 240x1, then a heavy single 255x1 (RPE 9.5), then 235x4 x3. The real work sets (235) are lighter than the top single. RPE 10 on the 135x10 warm-up confirms warm-up RPEs are junk.
- **Session end time can be wrong.** Oct 2 shows 20:54 to 00:37 (almost 4 hours); the last set was done at 21:44. Use set times, not end time.
- **Exercise names vary.** "Bench Press" (Day 1) vs "Bench Press-Volume" (Upper 2); "Hammer Strength  ISO-Lateral Low Row" (with a double space) on Day 2 vs "Hammer Iso Lateral Row" on Upper 2. SHAZAM needs a name list that says which names are the same exercise.
- **Routines don't fully match the Sep 24 leg plan yet.** Pendulum Squat is on Day 1 as planned. Hip Thrust is still on Day 2 (plan: move to Upper 2). Lying Leg Curl isn't in Day 2 yet.
- **SHAZAM phone data (insurance only):** exported 2026-09-27 via History > Export CSV to `C:\Users\billv\Downloads\shazam_export.csv` on the second computer (not in this public repo). 485 sets, 41 sessions, Jun 15 to Sep 22. Exercise names are unreliable because of swaps (e.g. "Hammer Flat Bench" was really machine incline fly). Jun 9 to 11 aren't in it but are on GitHub.
- **Old public data files:** `shazam_data.json` in the public `shazam` repo, and `iron300_data.json` + `legs_data.json` in the public `iron300` repo. To be deleted (see Decisions).

## Current program (StrongSplit names, week of Sep 29; Hevy names and rules are in the "Hevy" section)
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
- Update 2026-10-18: football season likely ends **Saturday, Oct 24**. Bill wants a **full program audit** after it ends (exercises, sets, rep ranges, the November items). Bill prefers rep ranges capped at 12 (bored after 10, 12 OK, not a fan of 15 unless it's clearly best).
- After that: push again. A **fourth training day** is possible after football if needed.
- Time in the gym is fine on Monday and Thursday. **Friday (Upper 2, chest/back) is too long.**
- **Decided 2026-10-03: trimmed Friday (Upper 2) until November**, 5 exercises, 3 sets each except bench (4 sets, clarified 2026-10-11), in this order: Bench Press-Volume, Narrow Grip Pulldown, Hammer Iso Lateral Row, Hammer Shoulder Press, Arsenal Standing Lateral Raise. Dropped until November: Pec Deck, Face Pull, Overhead Cable Triceps Extension, Cable Curl. Keep weights heavy; cut sets, not load. Order and priority (Bill, 2026-10-11): bench first, then the close-grip pulldown, then the row. Bill does the pulldown early on purpose: he likes it least, so doing it early means it gets done, and it wears him out, so it would suffer later. The pulldown is the back work that has to happen; the Hevy routine already has this order. Revisit in November (bring them back or move them to a fourth day). Also in November: add Lying Leg Curl (Claude suggested Day 2, 2x8-12, at the end).
- **Decided 2026-10-11:** Hip Thrust stays on Thursday (Day 2) until November, so Friday stays short. Lying Leg Curl also waits until November. Revisit both then.

## Hevy
Why Hevy: StrongSplit has no API (manual export plus a Shortcut after every workout). Hevy Pro (about $24/yr) has a public API that reads workouts and updates routines.

- Hevy API checked 2026-10-03 (spec at api.hevyapp.com/docs, version 0.0.1). Workouts: read list, read one, and `GET /v1/workouts/events` (changes since a date, so SHAZAM only fetches what's new). Each logged set has `type` (`normal`, `warmup`, `dropset`, `failure`), `weight_kg`, `reps`, `rpe`. Routines: create and update (`PUT /v1/routines/{id}`); each routine set can have `type`, `weight_kg`, `reps`, `rep_range`. No target RPE on routine sets. Weights are kilograms only, so SHAZAM converts lb to kg and back. Needs Hevy Pro and an `api-key` header. Hevy warns the API is new and may change or be dropped ("use at your own risk").
- Three unknowns at the start (all answered below): can a phone web page call the API directly, how Hevy handles planned sets that weren't done, does kg conversion show clean lb numbers.
- Bill logs RPE on working sets only, not warm-ups. Hevy logs RPE per set, and its `warmup` set type would mark warm-ups directly.
- RPE in Hevy: logged per set, and SHAZAM can read it. It's for logging only: routines can't hold a target RPE, just weight and reps. RPE may need to be switched on in Hevy's settings (not confirmed; check during a trial).
- 2026-10-04: **Bill subscribed to Hevy Pro.** Unknown #1 answered: Hevy's API allows calls from any web page (`Access-Control-Allow-Origin: *`, allows the `api-key` header), so SHAZAM on the phone can talk to Hevy directly. No server needed.
- API key handling: Bill saves it in `C:\Users\billv\.hevy\api_key.txt` (outside this public repo). Never commit it or paste it in chat. Saved and tested on the second computer 2026-10-04: account `billv1084`, weight unit lbs, 0 workouts so far.
- 2026-10-06: **Hevy set up.** RPE switched on in the app. Created via the API: custom exercises "Incline Fly (Arsenal)" and "Standing Lateral Raise (Arsenal)", folder "Shazam", routines "Shazam Day 1", "Shazam Day 2", "Shazam Upper 2" (trimmed Friday). Starting weights copied from the last StrongSplit sessions; warm-ups use Hevy's `warmup` set type (Day 1: 135 to 240 are warm-ups, 255 single is the first working set). Leg curl not added (undecided).
- Exercise mapping (StrongSplit to Hevy): Bench Press to Bench Press (Barbell); Bench Press-Volume to the custom exercise Bench Press-Volume (created 2026-10-11 so Friday has its own history and charts in Hevy; Hevy's bench records now only count Monday); Hammer Strength Incline Press to Incline Chest Press (Machine); Machine Chest Fly to Incline Fly (Arsenal); Seated Machine Lateral Raise to Lateral Raise (Machine); Pendulum Squat to Pendulum Squat (Machine); Overhead Cable Triceps Extension to Overhead Triceps Extension (Cable); Lat Pulldown to Lat Pulldown (Cable); Hammer Strength ISO-Lateral Low Row to Iso-Lateral Low Row; Straight Arm Lat Pulldown to Straight Arm Lat Pulldown (Cable); Reverse Pec Dec to Rear Delt Reverse Fly (Machine); Cable Curl to Bicep Curl (Cable); Hammer Curl to Hammer Curl (Dumbbell); Hip Thrust to Hip Thrust (Machine) (plate loaded); Hammer Iso Lateral Row to Iso-Lateral Row (Machine); Narrow Grip Pulldown to Lat Pulldown - Close Grip (Cable); Hammer Shoulder Press to Shoulder Press (Machine Plates); Arsenal Lat Machine to Standing Lateral Raise (Arsenal).
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
- **SHAZAM's progression rules still apply (confirmed with Bill 2026-10-11).** They live in `index.html` (`PROGRAM`, `updateProgression`, `roundLoad`). Summary: each exercise has a set count and rep range; hit the top of the range on every set and the weight goes up next time (bench +1 lb using 0.5 lb microplates per side, most machines and cables +5, lateral raises and rear delts +2.5); miss it and the weight stays; miss twice in a row and it drops about 10%. Upper 2 bench is pegged to 90% of Day 1 bench. Note: `PROGRAM` still lists the old exercises (JM Press, Chest-Supported Row, Hack Squat and others), so the new exercises need rules assigned before SHAZAM can make targets for them. (Done below.)
- **Rules for the current exercises (approved by Bill 2026-10-11).** Format: sets x rep range, weight jump. "Next" is what the rule gives from the Oct 6 to 9 workouts.
  - Day 1: Bench Press 3x4-6, +1, heavy single at RPE 7 to 8 (next 235). Incline Chest Press (Machine) 3x6-10, +5 (next 180). Incline Fly (Arsenal) 3x8-12, +5, same as the Hammer Chest Press it replaced (Bill, 2026-10-11) (next 135). Lateral Raise (Machine) 3x8-12, +2.5 (next 75). Pendulum Squat 3x8-12, +5 added (next 5, cut short). Overhead Triceps Extension (Cable) 3x8-12, +2.5 (next 50); if the wrist complains, stop adding weight and consider higher reps.
  - Day 2: Lat Pulldown 4x6-10, +5, loose rule (next 185). Iso-Lateral Low Row 4x6-10, +5 (next 180, cut short). Straight Arm Lat Pulldown 2x8-12, +5 (next 75). Rear Delt Reverse Fly 3x8-12, +2.5 (next 95). Bicep Curl (Cable) 3x8-12, +2.5 (next 42.5). Hammer Curl 2x8-12, +5 (next 30). Hip Thrust 2x8-12, +10 (next 150).
  - Upper 2 (trimmed): Bench Press-Volume 4x6-8, +1, starts at 90% of Day 1; **decided 2026-10-18:** it progresses on its own (4 x 8 means +1 next Friday), jumps up to 90% of Day 1 if that's higher, and is capped at 95% of Day 1 so it stays a volume day (was: always exactly 90%, next 212). Bench keeps 4 sets on the trimmed Friday (Bill, 2026-10-11: bench is the most important lift; if short on time, bench comes first). The Oct 6 Hevy routine had only 3 by mistake; Bill added the 4th himself on Oct 9. Lat Pulldown Close Grip 3x6-10, +5, loose rule (next 175). Iso-Lateral Row (Machine) 3x8-12, +5 (next 180). Shoulder Press (Machine Plates) 3x6-10, +5 (next 125, cut short). Standing Lateral Raise (Arsenal) 3x8-12, +2.5 (next 35). **Changed 2026-10-18:** every 10-15 range became 8-12 (Bill's 12-rep cap); strict form on raises and rear delts. Weights at the switch: Lateral Raise 77.5, Rear Delt 97.5 (both were past 12), Straight Arm 75, Arsenal 37.5, Triceps 55.
  - Rule changes: (1) **Decided 2026-10-11:** a "miss" means any set below the bottom of the range; two misses in a row drop the weight about 10%. Today a miss only counts if a set is marked with a red X in SHAZAM, and Hevy has no red X, so the 10% drop would never happen. (2) **Decided 2026-10-11:** fewer sets than planned means "cut short": weight stays, never counts as success or miss, shown flagged in the progress view. An exercise not done at all is ignored. Notes are for Bill only; SHAZAM doesn't interpret them. Bill: when a weight is too heavy he lowers it or does the reps he can, he doesn't stop early, so cut short in practice means time. (2b) **Decided 2026-10-11:** if the weight is lowered partway through an exercise, next time starts at the lower weight; go back up once all sets hit the top of the range. Watch for data-entry slips: Oct 6 Incline Fly shows 135x12, 130x11, 130x10, but Bill says he didn't lower it. The plan (from Sep 29 StrongSplit) was 130x12 x3, so only set 1 was edited. Bill confirmed: 135 for all 3 sets (12, 11, 10). Bill to fix it in Hevy (Edit Workout). Lesson: Hevy pre-fills planned weights, so unedited sets get logged as planned. (3) **Decided 2026-10-11:** no maintenance mode; normal rules run through football season (Bill doesn't want to switch anything back after the season). (4) **Decided 2026-10-11:** the heavy single stays at RPE 7 to 8 (Bill had been taking it to RPE 9 to 9.5; wrist risk, little benefit). Roughly 240 to 245 for now. A true max test, if wanted, every few weeks at most.
  - **The "loose" rule (from SHAZAM's code, `gate:'loose'`; missed by Claude until 2026-10-18):** for Day 1 Bench Press, Day 2 Lat Pulldown and Upper 2 Close Grip Pulldown, the weight goes up when the best set hits the top of the range and no set is below the bottom, with all planned sets done. Every other lift uses the strict rule: every set at the top. Example: bench 235 x 6, 6, 5 (range 4-6) is a jump under the loose rule. Claude applied the strict rule to these lifts at first, which cost two jumps (Oct 12 bench, Oct 8 Lat Pulldown); fixed 2026-10-18.
  - Weight steps (Bill, 2026-10-11): any machine or cable can go up 2.5 or 5 lb, because Bill hooks a plate to the pin when the stack has no add-on. So the jump is picked per exercise: +2.5 for small isolation moves (lateral raises, rear delts, triceps, cable curl), +5 for bigger machines, +10 for Hip Thrust. Dumbbells stay +5 (next dumbbell up).
- **2026-10-11: Hevy routines updated by Claude via the API** to the approved rules (backup of the old routines in the session scratchpad only). Every working set now has a rep range (e.g. 180 x 6-10) instead of a fixed rep count; the API accepts `rep_range` on routine sets. Day 1 bench: warm-ups 135x10, 185x4, 205x2, 225x1, then single 245 (RPE 7 to 8), then 235 x 4-6 x3 (the 240 warm-up was dropped since the single is 245). Straight Arm Pulldown now 2 sets. Not yet checked: how rep ranges look in the Hevy app.
- **2026-10-11: Bench Press-Volume set up in Hevy.** Custom exercise created; Upper 2 routine now uses it with warm-ups 135x10, 185x4, 205x1, then 4 x 212 x 6-8. The Oct 9 workout's bench was moved to it (edited via `PUT /v1/workouts/{id}`; backup in the session scratchpad). API notes: the workout update rejects `routine_id` but keeps the link to the routine anyway; editing a past workout does not rewrite the routine.
- **Week of Oct 12 (checked 2026-10-18):** Day 1 (Oct 12) and Upper 2 (Oct 16); no Day 2. Day 1 skipped Lateral Raise and Pendulum Squat (ignored). Bench single 245 at RPE 8 (on target), back-offs 235 x 6, 6, 5 (up from 5, 5, 4). Bill raised two weights himself on good days: Overhead Triceps Extension 50 to 55, Arsenal Lateral Raise 35 to 37.5, and Friday bench 212 to 215 (4 x 8). SHAZAM treats what he lifted as the new starting point.
  - Typos fixed by Claude via the API (with Bill's OK): Oct 6 Incline Fly sets 2 and 3, 130 to 135; Oct 16 Arsenal Lateral Raise set 3, 37.2 to 37.5. Backups in the session scratchpad.
  - Routines updated 2026-10-18. Day 1: single 245, 235 x 4-6 x3, Incline Chest Press 180, Incline Fly 135, Lateral Raise 75, Pendulum Squat 5, Overhead Triceps Extension 55. Corrected the same day for the loose rule: Day 1 bench back-offs 236 x 4-6, Day 2 Lat Pulldown 190. Upper 2: Bench Press-Volume 216 x 6-8 x4, Close Grip Pulldown 180, Iso-Lateral Row 180, Shoulder Press 130, Arsenal Lateral Raise 37.5. Day 2 otherwise unchanged (not done this week).
- **How targets will reach Hevy once SHAZAM is built (planned):** Bill logs in Hevy as usual. Then he opens SHAZAM on his phone; SHAZAM reads the new workout from Hevy, applies the rules, and writes next targets back into the three "Shazam" routines. Hevy overwrites a routine with what was lifted when a workout is finished, so SHAZAM must run after the workout, not before. Until it's built, Bill asks Claude to update the routines.
  - **Decided 2026-10-11:** SHAZAM shows the new targets first and Bill taps a "Send to Hevy" button to update the routines (no automatic update for now, so typos can be caught). Revisit after a few weeks.

## Issues found
1. **Workout data is in public repos.** Anyone can see it. Can't just make the repos private: free GitHub Pages hosting needs public repos. Fix: have the app sync to the private `shazam-backup` repo instead.
2. **`shazam-backup` is empty** (`{}`), so it isn't actually backing anything up.
3. All 43 tests pass, but `tests.mjs` line 228 uses `.pathname`, which breaks on Windows. Fix with `fileURLToPath` in the first build.
4. `sw.js` cache name is still `shazam-v2.2` while the app is v2.6, so phones may keep old versions.
5. The app falls back to the public `shazam` repo for backups if no repo is set. Until fixed, don't press "Back up now" in SHAZAM.

## Decisions
- 2026-09-24: Data: **StrongSplit is the accurate record** (for Jun 29 to Oct 2; Hevy from Oct 6 on). SHAZAM's data is off because exercises were swapped for equipment availability and a wrist issue (tendonitis; see "Changes since the original SHAZAM program"), and new machines were tried (e.g. Pendulum Squat, first logged Sept 22).
- 2026-09-24: Public data files: once the private `shazam-backup` repo holds a verified copy, delete `shazam_data.json` from the public `shazam` repo and `iron300_data.json` + `legs_data.json` from the public `iron300` repo. Don't rewrite git history.
- 2026-09-24: **SHAZAM's role: prescription engine.** (Replaced 2026-10-11: Bill logs in Hevy and SHAZAM uses the Hevy API; the StrongSplit export, Shortcut and routine import below are no longer the plan.) Bill logs only in StrongSplit. After a workout: Export in StrongSplit, then an Apple Shortcut ("Send to SHAZAM") uploads the CSV to the private `shazam-backup` repo; SHAZAM imports it on open and computes next targets. SHAZAM's own logging screens get retired or simplified. StrongSplit has no API/auto-export (checked 2026-09-24); its Shortcut actions only start routines and read recovery scores.
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
- 2026-10-11: **Hevy is the logging app. StrongSplit is retired.** Old StrongSplit exports are imported once for history.
- 2026-10-11: **Warm-up rules for the one-time StrongSplit history import:** (1) Day 1 bench: every set before the heavy single is a warm-up. (2) Everything else: in each session, find the weight used for the most sets; any set more than 15% lighter is a warm-up. Claude runs the rules on the data and shows Bill odd-looking sessions before anything is saved. Hevy marks warm-ups itself, so this is history only.
- 2026-10-11: **SHAZAM ignores day order.** Bill moves days, skips exercises and sometimes does two routines back to back in football season and Q4. Each Hevy routine keeps its own targets and only gets new ones when that routine is done. Skipped exercises are ignored. No "next day" in SHAZAM. The one link: Upper 2 bench is kept between 90% and 95% of Day 1's working weight (changed 2026-10-18).
- 2026-10-11: **SHAZAM's logging screens are retired.** SHAZAM keeps three jobs: next targets with the "Send to Hevy" button, the progressive overload view, and the plate calculator (it knows Bill's microplates). Old code stays in git history if logging is ever needed again (e.g. Hevy drops its API).
- 2026-09-27: The old idea of combining SHAZAM and IRON 300 into one app is dropped. IRON 300's only remaining task is deleting its public data files.

## Open questions for Bill
- None right now. Next: the detailed build plan (see Next steps).

## Next steps
- [x] Install Node.js and GitHub CLI on the second computer (2026-09-27)
- [x] Back up current SHAZAM phone data (2026-09-27, CSV export)
- [x] Commit NOTES.md to GitHub so both computers have it (2026-09-27)
- [x] Answer the open questions above (2026-10-11)
- [x] Switch logging to Hevy, set up routines, agree on progression rules (2026-10-11)
- [x] Fix Oct 6 Incline Fly sets 2 and 3 to 135 in Hevy (Claude, 2026-10-18)
- [ ] Bill: check how rep ranges look in the Hevy routines
- [ ] Until SHAZAM is built: after each workout, Claude updates the Hevy routines by the rules
- [ ] Clone `shazam-backup` on the second computer; put the StrongSplit exports and `shazam_export.csv` in it
- [ ] Write the detailed build plan here (Hevy connection, rules for the new exercises in `PROGRAM`, "Send to Hevy" button, progressive overload view, one-time StrongSplit history import, fixes for issues 3 to 5)
- [ ] Once `shazam-backup` has a verified copy, delete the public data files
