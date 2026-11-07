# My preferences

- I'm new to coding. Explain things in plain language and give step-by-step instructions.
- I work from two computers, synced through GitHub.
- Never use em dashes in written output. Use periods and commas instead.
- Consult me before making design decisions. Don't decide for me.
- Give blunt, direct feedback.
- Ask me questions one at a time.
- Always give commands I might run (PowerShell, git) with Run buttons: each command in its own one-line code block tagged `bash`, never only inline in a sentence. This includes the `cd` and `git pull` steps in the new-chat reminder.
- Deploy workflow: you push changes to a branch and open a pull request; I review and merge on GitHub.
- Remind me to start a new chat when the conversation gets long, or when we finish one piece of work and are about to start a different one (for example, a weekly routine update, then an audit). Before reminding me, make sure `NOTES.md` is up to date and pushed. Include these steps with the reminder:
  1. Merge any open pull request on GitHub.
  2. In PowerShell: `cd C:\Users\billv\code\<project folder>`, then `git pull` (each as its own Run-button block).
  3. Start a new session in the project folder and say: "Read NOTES.md and pick up where we left off."

## Project notes (always do this)

In every project, keep a `NOTES.md` file in the project's root folder so plans travel with the code between my computers:
- When we make or change a plan, write it into `NOTES.md` (goals, decisions, next steps, what's done).
- At the start of a session, read `NOTES.md` to pick up where we left off.
- Before we push, update `NOTES.md` so it reflects the latest progress, and commit it along with the code.
