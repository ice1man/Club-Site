# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Club-Site is a template repo a student club forks to get a free static website on GitHub Pages. There is **no build step, no package manager, no tests, no linter, and no dependencies** — just plain HTML/CSS/vanilla JS served as-is. `.github/workflows/static.yml` uploads the entire repo root to Pages on every push to `main`.

To run locally, serve the repo root over HTTP (pages `fetch()` their data files, so `file://` won't work):

```sh
python3 -m http.server 8000   # then open http://localhost:8000/
```

Design rationale lives in `docs/` (`docs/README.md`, `docs/editor/tech-stack.md`, `docs/calender/data-format.md`); read those before changing the data formats or the editor's approach. Note parts of those docs were written before the code existed and may describe things as "not yet created".

## Architecture

**Template sites** are top-level folders, each a static page that fetches a data file at load time and renders it client-side:

| Folder | Data file | Notes |
|---|---|---|
| `/` (`index.html`) | `site.json`, `home-links.json` | Home page: title, logo, colors, per-tile icons and hide flags; extra custom tiles from `home-links.json` (logic is inline in `index.html`) |
| `calender/` | `calender/events.ics` | Upcoming (`index.html`) and past (`past.html`) events |
| `about/` | `about/admins.json` | "Our Team" officers list |
| `who-we-are/` | `who-we-are/info.json` | Mission + reasons |
| `rewards/` | `rewards/awards.json` | Member awards |
| `resources/` | `resources/links.json` | Useful links list |

The folder is spelled `calender` (sic) everywhere — paths, template ids, `site.json` keys like `hideCalender`. Don't "fix" it; forks depend on these paths.

`calender/assets/style.css` is the shared base stylesheet — other pages (including the editor) link it before their own `assets/style.css`.

**The editor** (`editor/`) is a backend-less SPA that edits a club's fork through the GitHub REST API using a user-supplied token stored in `localStorage`. Every save is a real commit to the repo (e.g. "Update events via editor"), which then triggers the Pages redeploy. Consequently, `origin/main` frequently gains content commits made from the editor — pull before editing data files.

- `github.js` — `GitHubClient` (get/put/delete files via the contents API, UTF-8-safe base64).
- `templates.js` — the `TEMPLATES` registry. `editor.js` is generic over it. Each entry declares a `dataPath` and a `renderEditor` that configures one of two shared UIs:
  - `list-editor.js` (`renderListEditor`) for arrays of records — fields, `parse`/`serialize`, optional `idKey`/`generateId`, `toValues`/`fromValues`, `reorder`, `prependNew`, and the `repeat` bulk-creation option.
  - `record-editor.js` (`renderRecordEditor`) for a single object.
  - `asset-manager.js` is a special entry with `dataPath: null` (uploads to root `assets/`).
- `backup.js` — download/restore all template data files, driven by the `TEMPLATES` list.
- `editor.js` — connect → picker → editor screens; also an update check comparing the fork's `info.json` `version` against upstream `ice1man/Club-Site`.

Adding a new template site means: a new top-level folder + data file, a `TEMPLATES` entry, a tile in root `index.html` (plus `hide*`/`icon*` keys in `site.json` and the Home Page template's fields), and nav links on the other pages.

**ICS handling:** `calender/assets/ics.js` is a hand-written parser/serializer for a deliberately small iCalendar subset (see `docs/calender/data-format.md`), shared by the calendar page and the editor (`editor/index.html` loads `../calender/assets/ics.js`). Key rules: floating local times with no timezone handling; all-day `DTEND` is exclusive in the file but inclusive in the parsed object; no `RRULE` — "repeating events" in the editor generate independent `VEVENT`s, each with its own stable `UID`.

## Versioning conventions

- **Cache-busting:** every local `<script src>` / stylesheet `href` carries a shared `?v=N` query string (currently `?v=14`). Whenever any `.js` or `.css` file under an `assets/` folder changes, bump `N` **everywhere it appears across all HTML pages** (one shared number). Data files (`*.json`, `events.ics`) are never versioned.
- **`info.json` `version`:** the release number forks compare against upstream to show the editor's "update available" banner. Bump it for changes clubs should sync (new templates/features), not for content edits.
