// Wires up the three screens: connect, pick a template, edit it.
// See docs/editor/README.md and docs/editor/tech-stack.md.

const STORAGE_KEY = "club-site-editor";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function save(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

// Editor is normally reached at https://<owner>.github.io/<repo>/editor/ —
// guess owner/repo from the URL so the connect form starts pre-filled.
function guessOwnerRepo() {
  const hostMatch = location.hostname.match(/^([^.]+)\.github\.io$/);
  const owner = hostMatch ? hostMatch[1] : "";
  const repo = location.pathname.split("/").filter(Boolean)[0] || "";
  return { owner, repo };
}

function showScreen(name) {
  for (const el of document.querySelectorAll("[data-screen]")) {
    el.hidden = el.dataset.screen !== name;
  }
}

let github;

function openPicker() {
  showScreen("picker");
  const list = document.getElementById("template-list");
  list.innerHTML = "Checking your site…";

  Promise.all(TEMPLATES.map((t) => github.getFile(t.dataPath).catch(() => null)))
    .then((results) => {
      list.innerHTML = "";
      TEMPLATES.forEach((template, i) => {
        const present = results[i] !== null;
        const card = document.createElement("div");
        card.className = "template-card";

        const title = document.createElement("h3");
        title.textContent = template.name;
        const desc = document.createElement("p");
        desc.textContent = template.description;

        const button = document.createElement("button");
        button.type = "button";
        if (present) {
          button.textContent = "Edit";
        } else if (template.scaffold) {
          button.textContent = "Add to your site";
        } else {
          button.textContent = "Not on your site";
          button.disabled = true;
        }
        button.addEventListener("click", () => openTemplate(template));

        card.append(title, desc, button);
        list.append(card);
      });
    });
}

function openTemplate(template) {
  showScreen("editor-screen");
  document.getElementById("editor-title").textContent = template.name;
  template.renderEditor(document.getElementById("editor-container"), { github });
}

document.getElementById("connect-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const config = {
    token: document.getElementById("f-token").value.trim(),
    owner: document.getElementById("f-owner").value.trim(),
    repo: document.getElementById("f-repo").value.trim(),
    branch: document.getElementById("f-branch").value.trim() || "main",
  };
  save(config);
  github = new GitHubClient(config.token, config.owner, config.repo, config.branch);
  openPicker();
});

document.getElementById("back-to-picker").addEventListener("click", openPicker);
document.getElementById("disconnect").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// Init: pre-fill the connect form, and skip straight to the picker if we
// already have a saved token.
(function init() {
  const saved = loadSaved();
  const guess = guessOwnerRepo();
  document.getElementById("f-token").value = saved.token || "";
  document.getElementById("f-owner").value = saved.owner || guess.owner;
  document.getElementById("f-repo").value = saved.repo || guess.repo;
  document.getElementById("f-branch").value = saved.branch || "main";

  if (saved.token && saved.owner && saved.repo) {
    github = new GitHubClient(saved.token, saved.owner, saved.repo, saved.branch || "main");
    openPicker();
  } else {
    showScreen("connect");
  }
})();
