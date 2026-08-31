// Thin wrapper around the GitHub Contents API. Each read or write is one
// commit-worthy API call — no local clone, no git binary. See
// docs/editor/tech-stack.md.

function b64EncodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function b64DecodeUtf8(b64) {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

class GitHubClient {
  constructor(token, owner, repo, branch) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
  }

  async #request(path, options = {}) {
    const res = await fetch(`https://api.github.com/repos/${this.owner}/${this.repo}/${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        ...options.headers,
      },
    });
    return res;
  }

  // Returns { text, sha } for a file, or null if it doesn't exist on this branch.
  async getFile(path) {
    const res = await this.#request(`contents/${path}?ref=${this.branch}`);
    if (res.status === 404) return null;
    if (!res.ok) throw await githubError(res);
    const data = await res.json();
    return { text: b64DecodeUtf8(data.content), sha: data.sha };
  }

  // Creates or updates a file — this call itself is the commit. Omit `sha`
  // when creating a new file; pass the `sha` from getFile() when updating one.
  async putFile(path, text, sha, message) {
    const res = await this.#request(`contents/${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: b64EncodeUtf8(text),
        branch: this.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) throw await githubError(res);
    return res.json();
  }
}

async function githubError(res) {
  let detail = "";
  try { detail = (await res.json()).message; } catch { /* ignore */ }
  if (res.status === 401 || res.status === 403) {
    return new Error(`GitHub rejected the token (${res.status}). Check it has Contents read/write on this repo.`);
  }
  if (res.status === 409) {
    return new Error("Someone else saved a change first — reload and try again.");
  }
  return new Error(`GitHub API error ${res.status}${detail ? `: ${detail}` : ""}`);
}
