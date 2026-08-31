# Editor: tech stack decisions

See [`docs/editor/README.md`](README.md) for what the editor is; this doc records
*how* it's built and why.

## Decisions

| Question | Decision |
|---|---|
| How does it talk to a club's repo? | GitHub's REST/GraphQL API — no local git binary or clone |
| How does it run / get distributed? | A static, client-side web app — no backend server |
| Frontend stack? | Vanilla JS/HTML/CSS — no framework, no build step |

### GitHub API instead of local git

The editor never shells out to `git` or clones a repo to disk. Reading a file,
writing a file, and committing are all single API calls (`GET`/`PUT` contents,
create a commit) against a club's forked repo. This means:

- A club member needs nothing installed — no git, no Node, no terminal.
- The editor can be a plain web page: no process to spawn, no filesystem to manage.
- "Wraps git" ends up meaning *wraps GitHub's API representation of git* rather than
  the `git` CLI — the commits it produces are indistinguishable from ones made by
  hand, which is what matters (the [`static.yml`](../../.github/workflows/static.yml)
  Pages workflow doesn't care how a commit was made).

### Static client-side web app, no backend

The editor is a single-page app that runs entirely in the browser and calls GitHub's
API directly with the user's own credentials. There's no Club-Site-operated server in
the middle reading or storing anyone's repo contents or tokens.

This preserves the project's core promise — a club owns their fork and their data,
full stop, the same way they own it when editing files by hand. It also means the
editor page itself can be hosted the exact same way template sites are (a static
site on GitHub Pages), so it needs no separate infrastructure decision from the rest
of Club-Site.

### Vanilla JS/HTML/CSS, no framework

No build step, no `node_modules`, no bundler config. Matches the style already used
for the root [`index.html`](../../index.html): a club that forks this repo and wants
to peek at or tweak the editor isn't dropped into a framework they don't know just to
read the code.

Trade-off, noted for later: this means writing more by hand instead of leaning on a
component framework. Acceptable while the editor's UI surface is small (a calendar
of events); worth revisiting if/when more template types with more complex editing
UIs are added.

## Still open

This doc fixes the *shape* of the stack; these are the next decisions to make, not
yet answered:

- **Auth mechanism** — how a club member proves to GitHub's API that they can write
  to their fork. Candidates: a GitHub OAuth App (device flow, no backend required to
  complete the handshake) vs. having the user paste in a fine-scoped personal access
  token. Whichever is picked, the token lives only in the browser (e.g.
  `localStorage`), never sent anywhere but GitHub's API.
- ~~Data format for template content~~ — decided for the calendar template: see
  [`docs/calender/data-format.md`](../calender/data-format.md).
- **One shared hosted copy vs. every fork hosting its own editor page** — the static
  app can work either way (it just needs to know which repo it's pointed at), but
  the default club workflow should pick one.
