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
