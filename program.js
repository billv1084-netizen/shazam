// SHAZAM program: the 4 Hevy routines and how each exercise progresses.
// Changes go through Claude: edit this file and its tests, then a pull request.
//
// Each exercise:
//   id      Hevy exercise template id (how SHAZAM matches logged sets)
//   name    shown in SHAZAM
//   rule    'strict' (accessories and pulldowns), 'mondayBench', or 'volumeBench'
//   sets    planned working sets
//   reps    [bottom, top] of the rep range
//   jump    lb added when the rule says go up
//   start   target weight (lb) if the exercise has no session since startDate
//   rest    rest timer in Hevy (seconds)
//   note    coaching note shown in Hevy
//   warmups [weight, reps] pairs (bench only, fixed)
//   single  Monday heavy single: { start, up, down } (lb up after two easy weeks, down after RPE 9+)

export const PROGRAM = {
  // SHAZAM replays every workout from this date (first week of the post-football program).
  startDate: '2026-11-02',
  // 8 or more days in a row with no workout at all = a week off
  // (Fri Nov 13 to Mon Nov 23 has 9 empty days in between).
  weekOffDays: 8,
  // Only routines in this folder are ever touched.
  folderId: 3811037,

  routines: [
    {
      key: 'monday',
      id: '3da7a17b-fc87-48df-aa1b-9db0de90b8da',
      title: 'Shazam Monday',
      exercises: [
        {
          id: '79D0BB3A', name: 'Bench Press (Barbell)', rule: 'mondayBench',
          warmups: [[135, 10], [185, 4], [205, 2], [225, 1]],
          single: { start: 250, up: 2, down: 5 },
          sets: 3, reps: [4, 6], jump: 1, start: 237, rest: 120,
          note: "SHAZAM: Work up to one heavy single at RPE 7-8. Smooth, 2-3 reps left. Don't grind it. Then 3 back-off sets.",
        },
        {
          id: '30E293E3', name: 'Pendulum Squat (Machine)', rule: 'strict',
          sets: 4, reps: [6, 10], jump: 2.5, start: 5, rest: 120,
          note: 'SHAZAM: Up 2.5 total when every set hits 10. Full depth, control the way down.',
        },
        {
          id: 'FBF92739', name: 'Incline Chest Press (Machine)', rule: 'strict',
          sets: 3, reps: [6, 10], jump: 5, start: 180, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 10. Brief pause in the stretch at the bottom.',
        },
        {
          id: 'D5D0354D', name: 'Lateral Raise (Machine)', rule: 'strict',
          sets: 4, reps: [8, 12], jump: 2.5, start: 80, rest: 120,
          note: 'SHAZAM: Set on 8. Up 2.5 when every set hits 12. Strict, no swinging.',
        },
        {
          id: 'B5EFBF9C', name: 'Overhead Triceps Extension (Cable)', rule: 'strict',
          sets: 4, reps: [8, 12], jump: 2.5, start: 57.5, rest: 120,
          note: "SHAZAM: Set at 9. Up 2.5 when every set hits 12. Check the wrist the next morning. If it's sore, hold the weight and tell Claude.",
        },
      ],
    },
    {
      key: 'tuesday',
      id: '2e981d41-d4d6-44b4-9c6b-b258f574a839',
      title: 'Shazam Tuesday',
      exercises: [
        {
          id: '6A6C31A5', name: 'Lat Pulldown (Cable)', rule: 'strict',
          sets: 4, reps: [6, 10], jump: 5, start: 190, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 10. Full stretch at the top. Stop set 1 with 1-2 reps left.',
        },
        {
          id: '91FAFBA3', name: 'Iso-Lateral Low Row', rule: 'strict',
          sets: 3, reps: [6, 10], jump: 5, start: 180, rest: 120,
          note: 'SHAZAM: Set at 6. Up 5 when every set hits 10.',
        },
        {
          id: 'B8127AD1', name: 'Lying Leg Curl (Machine)', rule: 'strict',
          sets: 4, reps: [6, 10], jump: 5, start: 50, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 10.',
        },
        {
          id: 'D8281C62', name: 'Rear Delt Reverse Fly (Machine)', rule: 'strict',
          sets: 4, reps: [8, 12], jump: 2.5, start: 100, rest: 120,
          note: 'SHAZAM: Set at 4. Up 2.5 when every set hits 12. Strict, squeeze at the back.',
        },
        {
          id: 'ADA8623C', name: 'Bicep Curl (Cable)', rule: 'strict',
          sets: 4, reps: [8, 12], jump: 2.5, start: 42.5, rest: 120,
          note: 'SHAZAM: Up 2.5 when every set hits 12. Same grip for all 4 sets. EZ bar or rope is easier on the wrist.',
        },
      ],
    },
    {
      key: 'thursday',
      id: 'cda7bfed-d679-441d-b7ff-804da6c9ee23',
      title: 'Shazam Thursday',
      exercises: [
        {
          id: '296dae56-9dd3-4e69-a755-5466bf53922d', name: 'Bench Press-Volume', rule: 'volumeBench',
          warmups: [[135, 10], [185, 4], [210, 1]],
          sets: 4, reps: [6, 8], jump: 1, start: 216, rest: 120,
          note: 'SHAZAM: Volume day, not a max day. 1-2 reps in reserve, crisp reps. Up 1 when all 4 sets hit 8 and the last set is RPE 8.5 or less.',
        },
        {
          id: '4E5257DE', name: 'Lat Pulldown - Close Grip (Cable)', rule: 'strict',
          sets: 3, reps: [6, 10], jump: 5, start: 180, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 10. Stop set 1 with 1-2 reps left.',
        },
        {
          id: 'AA1EB7D8', name: 'Iso-Lateral Row (Machine)', rule: 'strict',
          sets: 3, reps: [8, 12], jump: 5, start: 180, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 12.',
        },
        {
          id: '68CE0B9B', name: 'Hip Thrust (Machine)', rule: 'strict',
          sets: 2, reps: [6, 10], jump: 10, start: 160, rest: 0,
          note: 'SHAZAM: Up 10 when every set hits 10. Pause 1 second at the top.',
        },
        {
          id: '8f47b6be-0ab8-4f3e-a22d-b45219bad2f9', name: 'Standing Lateral Raise (Arsenal)', rule: 'strict',
          sets: 4, reps: [8, 12], jump: 2.5, start: 37.5, rest: 120,
          note: 'SHAZAM: Up 2.5 when every set hits 12. Strict, no swinging.',
        },
        {
          id: '94B7239B', name: 'Triceps Rope Pushdown', rule: 'strict',
          sets: 2, reps: [8, 12], jump: 2.5, start: 50, rest: 120,
          note: 'SHAZAM: Up 2.5 when every set hits 12. Elbows pinned at your sides. Check the wrist the next morning.',
        },
        {
          id: 'cf54d5eb-7a05-4f18-9dc6-eb2d61922b55', name: 'Bayesian Cable Curl', rule: 'strict',
          sets: 2, reps: [8, 12], jump: 2.5, start: 15, rest: 120,
          note: 'SHAZAM: Log the weight for one arm. Up 2.5 when every set hits 12 with both arms. Face away from the cable so the arm starts behind you.',
        },
        {
          id: 'C7973E0E', name: 'Leg Press (Machine)', rule: 'strict',
          sets: 2, reps: [6, 10], jump: 10, start: 150, rest: 120,
          note: 'SHAZAM: Each set is 10 leg presses, then 10 calf raises on the leg press. Up 10 when every set hits 10. Legs are tired after hip thrusts, so lower the weight if needed and log what you lifted.',
        },
      ],
    },
    {
      key: 'friday',
      id: 'ce53f711-9022-4c10-8af3-d345e2c8a90b',
      title: 'Shazam Friday',
      exercises: [
        {
          id: 'd0d566c0-2d48-49e9-9122-f146f3bb080e', name: 'Incline Fly (Arsenal)', rule: 'strict',
          sets: 3, reps: [8, 12], jump: 5, start: 140, rest: 120,
          note: 'SHAZAM: Stop 2 reps short of failure. Up 5 when every set hits 12.',
        },
        {
          id: '5122E7D9', name: 'Seated Dip Machine', rule: 'strict',
          sets: 3, reps: [8, 12], jump: 5, start: 205, rest: 120,
          note: 'SHAZAM: Up 5 when every set hits 12.',
        },
        {
          id: '68F8A292', name: 'Skullcrusher (Dumbbell)', rule: 'strict',
          sets: 2, reps: [8, 12], jump: 5, start: 20, rest: 120,
          note: 'SHAZAM: New. Palms facing each other. Lower beside or slightly behind your head for a full stretch. Up 5 when both sets hit 12. Check the wrist the next morning. Any twinge, stop and tell Claude. First day: if set 1 is way too easy (15+ reps) or too heavy (under 8), change the weight and log what you lifted.',
        },
        {
          id: 'D8281C62', name: 'Rear Delt Reverse Fly (Machine)', rule: 'strict',
          sets: 3, reps: [8, 12], jump: 2.5, start: 100, rest: 120,
          note: "SHAZAM: Set at 4. Up 2.5 when every set hits 12. Strict, squeeze at the back. Machine taken? Swap to the cable reverse fly in Hevy (don't log cable weights here).",
        },
        {
          id: 'cf54d5eb-7a05-4f18-9dc6-eb2d61922b55', name: 'Bayesian Cable Curl', rule: 'strict',
          sets: 2, reps: [8, 12], jump: 2.5, start: 20, rest: 120,
          note: 'SHAZAM: Log the weight for one arm. Up 2.5 when every set hits 12 with both arms. Face away from the cable so the arm starts behind you.',
        },
      ],
    },
  ],

  // Planned one-off weight changes. Each applies to the first session on or after its date,
  // and to the target SHAZAM shows from that date. After that, the normal rules take over.
  resets: [
    { date: '2026-11-16', routine: 'monday', exercise: '79D0BB3A', weight: 230,
      reason: 'Planned reset after the week off' },
    { date: '2026-11-16', routine: 'thursday', exercise: '296dae56-9dd3-4e69-a755-5466bf53922d', weight: 212,
      reason: 'Planned reset after the week off' },
  ],
};
