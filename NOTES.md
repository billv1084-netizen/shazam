# SHAZAM: Project Notes

_Last updated: 2026-09-27_

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
- **StrongSplit (the real record):** export `strongsplit_sessions_2026-09-24.csv`, 24 sessions, Jun 29 to Sep 22.
- **SHAZAM phone data (insurance only):** exported 2026-09-27 via History > Export CSV to `C:\Users\billv\Downloads\shazam_export.csv` on the second computer (not in this public repo). 485 sets, 41 sessions, Jun 15 to Sep 22. Exercise names are unreliable because of swaps (e.g. "Hammer Flat Bench" was really machine incline fly). Jun 9 to 11 aren't in it but are on GitHub.
- **Old public data files:** `shazam_data.json` in the public `shazam` repo, and `iron300_data.json` + `legs_data.json` in the public `iron300` repo. To be deleted (see Decisions).

## Issues found
1. **Workout data is in public repos.** Anyone can see it. Can't just make the repos private: free GitHub Pages hosting needs public repos. Fix: have the app sync to the private `shazam-backup` repo instead.
2. **`shazam-backup` is empty** (`{}`), so it isn't actually backing anything up.
3. All 43 tests pass, but `tests.mjs` line 228 uses `.pathname`, which breaks on Windows. Fix with `fileURLToPath` in the first build.
4. `sw.js` cache name is still `shazam-v2.2` while the app is v2.6, so phones may keep old versions.
5. The app falls back to the public `shazam` repo for backups if no repo is set. Until fixed, don't press "Back up now" in SHAZAM.

## Decisions
- 2026-09-24: Data: **StrongSplit is the accurate record.** SHAZAM's data is off because exercises were swapped for equipment availability and a wrist issue (now resolved by a cortisone shot), and new machines were tried (e.g. Pendulum Squat, first logged Sept 22).
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
