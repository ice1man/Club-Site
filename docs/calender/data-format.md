# Calendar: event data format

See [`docs/calender/README.md`](README.md) for what the calendar template is; this
doc records how its events are stored.

## Decisions

| Question | Decision |
|---|---|
| Format? | iCalendar (`.ics`) |
| Layout? | A single file — `calender/events.ics` |
| Rendering? | `calender/index.html` fetches it and renders client-side, no build step |

### iCalendar (`.ics`)

Events are stored as a standard iCalendar file. The payoff over a plain JSON/YAML
array: it's a format calendar apps already understand, so the same file that drives
the site can also be offered to visitors as a "subscribe to this calendar" link —
useful for a club calendar specifically.

The cost: there's no browser-native ICS parser (unlike JSON), and general iCalendar
(RFC 5545) is large — recurrence rules, timezones, alarms, nested components. Pulling
in a full ICS library would break the no-dependencies stance from
[`docs/editor/tech-stack.md`](../editor/tech-stack.md). The resolution: we don't
implement general iCalendar — we define a small, fixed subset below, and both the
editor and `calender/index.html` ship a hand-written parser/serializer for exactly
that subset (a few dozen lines, not a library).

### Single file: `calender/events.ics`

One `VCALENDAR` containing every event as a `VEVENT`. Simple to fetch (one request),
simple for the editor to read-modify-write via a single GitHub API commit per edit.
Sized for a club's event list (dozens, not thousands) — not meant to scale past that.

### Client-side rendering, no build step

`calender/index.html` fetches `events.ics` at page load, parses it with the shared
parser, and renders the event list in the browser. Matches the current
[`static.yml`](../../.github/workflows/static.yml) workflow, which deploys the repo
as-is — no generation step runs between a commit and the live site.

## The supported subset

Only these properties are read/written. Anything else found in a hand-edited file
should be preserved on round-trip where reasonably possible, but isn't interpreted.

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Club-Site//Calendar//EN

BEGIN:VEVENT
UID:2026-09-15-general-meeting@club           (required, stable id for the event)
DTSTART;VALUE=DATE:20260915                   (required — all-day, see below)
SUMMARY:General meeting                       (required — event title)
LOCATION:Room 204                             (optional)
DESCRIPTION:Bring your laptop.                 (optional)
END:VEVENT

END:VCALENDAR
```

- **All-day only, for v1.** `DTSTART` is a bare date (`VALUE=DATE`), not a
  date-time. No `DTEND`, no timezone handling. Most club events (meetings, socials)
  read fine as "happening on this day"; time-of-day can be folded into
  `DESCRIPTION` for now rather than solved properly here.
- **No recurrence.** Each `VEVENT` is one occurrence. A weekly meeting is entered as
  individual events rather than an `RRULE` — simpler for both the parser and for a
  club member editing by hand.
- **`UID` is required and stable** so the editor can identify "this is the same
  event, edited" vs "this is a new event" across commits.

## Still open

- Whether/when to move past all-day-only events (time-of-day, multi-day events).
- Display rules: does the site show past events, or only upcoming? Sort order?
  (Likely upcoming-first, but not decided.)
- ~~Whether to expose `events.ics` itself as a subscribe link~~ — decided: both
  pages link to it via `webcal:`, so calendar apps subscribe rather than
  one-time-import.
