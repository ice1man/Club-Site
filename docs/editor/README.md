# Editor app

See [`docs/README.md`](../README.md) for how this fits into Club-Site as a whole.

## Purpose

Give a club member a simple UI to update their site's content — starting with the
calendar's dates and events — without needing to know git or edit HTML by hand.

## Core idea: wraps git

The editor doesn't invent its own storage or format. A club's site is just the files in
their forked repo, and the editor's job is to make changing those files feel like using
a normal app instead of using git:

- **Read** the current site content out of the repo.
- Present it as an editable UI (e.g. a calendar with events, not raw HTML/data files).
- **Write** the user's changes back to the same files.
- **Commit and push** that change to the club's repo on their behalf.

Because every edit is a real git commit, the existing GitHub Pages workflow
([`static.yml`](../../.github/workflows/static.yml)) picks it up and redeploys the site
automatically — the editor doesn't need its own deploy step. It's a front end for git,
not a replacement for it, so a club can always fall back to editing files directly.

## Templates

Beyond editing an existing site, the editor is also where a club picks what kind of
site they want in the first place. "Templates" are starter site structures — the
calendar ([`docs/calender/README.md`](../calender/README.md)) is the first — that a
club can drop in and then customize through the same edit/commit/push flow.

## User flow (high level)

1. Open the editor against the club's forked repo.
2. Make a change — e.g. add a new event date, edit an existing one.
3. Save.
4. Editor commits the change and pushes it.
5. GitHub Pages redeploys; the live site reflects the change.

## Tech stack

The editor is a static, client-side web app (no backend) that talks to a club's repo
through GitHub's API (no local git needed), built in vanilla JS/HTML/CSS (no
framework, no build step). See [`docs/editor/tech-stack.md`](tech-stack.md) for the
full rationale and what's still open — notably the auth mechanism and the data
format template content is stored in.
