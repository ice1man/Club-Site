# Club-Site

Club-Site is a template repo that lets a student club stand up a free website with no
infrastructure of their own: fork the repo, turn on GitHub Pages, and the site is live.
No server to run, no hosting bill, no build pipeline to maintain — the club just owns a
git repo.

## How it works

1. **Fork this repo.** It's a normal GitHub repo containing static, plain HTML sites.
2. **Enable GitHub Pages.** [`.github/workflows/static.yml`](../.github/workflows/static.yml)
   already deploys the whole repo root on every push to `main`, so this is the only setup
   step — no config to write.
3. **The fork is now a live site.** The root [`index.html`](../index.html) links out to
   each template site (currently just [`calender/`](../calender/)).

That covers getting a site *up*. The harder problem is keeping it *current* — a club's
calendar of events changes every week, and most club officers aren't going to hand-edit
HTML or learn git to update it. That's what the editor app is for.

## The two pieces

- **Template sites** — the actual content clubs display, as plain static files living at
  the repo root (e.g. `calender/`). Each one is documented under `docs/<name>/`.
- **[`editor/`](../editor/)** — an app that wraps git so a club member can update a
  template site's content (starting with dates on the calendar) through a normal UI,
  without touching git directly. See [`docs/editor/README.md`](editor/README.md).

The editor doesn't replace the repo — it's a front end for it. An edit made in the
editor becomes a real git commit pushed to the club's fork, which the existing Pages
workflow then redeploys automatically. A club that's comfortable with git can always
skip the editor and just edit the files by hand; both paths produce the same commits.

## Docs

- [`docs/editor/README.md`](editor/README.md) — the editor app: what it does, how it
  relates to git and to template sites.
- [`docs/calender/README.md`](calender/README.md) — the calendar template site: the
  first template site, and the main thing the editor is designed to update.

These are vision-level docs written before the editor app and calendar content exist,
to guide what gets built next — not a technical spec.

## Cache-busting

Every local `<script src>` / `<link rel="stylesheet" href>` across the site carries a
`?v=1` query string (e.g. `assets/editor.js?v=1`). There's no build step to hash
filenames automatically, and this site is served through a CDN (GitHub Pages, plus
Cloudflare on custom domains) that can hold onto an old copy of a JS/CSS file after a
change ships — that's exactly what happened once already (the editor briefly looked
like it only had one template because a browser had cached an old `templates.js`).

**Whenever a `.js` or `.css` file under any `assets/` folder changes, bump `?v=1` to
`?v=2` (etc.) everywhere it's referenced** — across all HTML pages, not just the one
that changed, since it's one shared version number by design (simpler to maintain
than tracking a version per file, at the cost of busting the cache for unchanged
files too — negligible for a site this size). This does *not* apply to content data
files (`events.ics`, `admins.json`, `info.json`, `site.json`) — those are expected to
change often via the editor and should always be fetched fresh.
