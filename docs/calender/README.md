# Calendar template site

See [`docs/README.md`](../README.md) for how this fits into Club-Site as a whole.

## Status

No content yet. [`calender/`](../../calender/) currently holds only an empty
`assets/` folder. This doc describes the intent for what it becomes, to guide that
work — not what exists today.

## Purpose

The first template site: a club event calendar. It's the main reason a club needs
frequent updates to their site at all, and the main thing the [editor
app](../editor/README.md) is designed to make easy to change.

## What it needs to show

- A club's upcoming events/dates, kept current with minimal effort.
- Enough detail per event that visitors don't need to look elsewhere (what, when — and
  where/description if the club wants).

## How it gets updated

Two paths, producing the same result — a commit to the repo:

- **Through the editor** (primary, intended path) — a club member edits events in a
  UI; the editor commits and pushes the change. See
  [`docs/editor/README.md`](../editor/README.md).
- **By hand** — since this is just static files in a normal git repo, a club
  comfortable with git can edit and commit directly instead.

## Relationship to the live site

- [`calender/index.html`](../../calender/index.html) (not yet created) is the static
  page a visitor sees, deployed as-is by the existing GitHub Pages workflow.
- [`calender/assets/`](../../calender/assets/) holds its supporting assets (styles,
  images, etc.).
- The root [`index.html`](../../index.html) links out to this page.

## Data format

Events are stored as iCalendar (`calender/events.ics`), read by both the editor and
the page itself. See [`docs/calender/data-format.md`](data-format.md).
