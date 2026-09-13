// Browse/upload/delete UI for the root assets/ folder — the one site.json's
// logo/iconX fields and every other "photo path" field point into. Self-contained
// like record-editor.js/list-editor.js: renderAssetManager(container, ctx) is the
// TEMPLATES entry point (see templates.js), building its own list/upload/status
// markup rather than relying on static HTML.

const ASSETS_DIR = "assets";
const MAX_ASSET_BYTES = 1_000_000; // the Contents API isn't meant for large payloads

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function copyPath(path, statusEl) {
  try {
    await navigator.clipboard.writeText(path);
    statusEl.textContent = `Copied: ${path}`;
  } catch {
    // Clipboard API unavailable — fall back to something the user can still copy by hand.
    statusEl.textContent = `Copy this path: ${path}`;
  }
}

async function renderAssetList(container, github) {
  container.innerHTML = "";
  const status = document.createElement("p");
  status.className = "status";
  status.textContent = "Loading…";
  container.append(status);

  let entries;
  try {
    entries = await github.listDir(ASSETS_DIR);
  } catch (err) {
    status.textContent = err.message;
    return;
  }
  status.remove();

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "help";
    empty.textContent = "No assets yet — upload one below.";
    container.append(empty);
    return;
  }

  for (const entry of entries) {
    const row = document.createElement("div");
    row.className = "asset-row";

    if (entry.download_url) {
      const thumb = document.createElement("img");
      thumb.className = "asset-thumb";
      thumb.src = entry.download_url;
      thumb.alt = "";
      row.append(thumb);
    } else {
      const thumb = document.createElement("span");
      thumb.className = "asset-thumb";
      thumb.textContent = "🗎";
      row.append(thumb);
    }

    const info = document.createElement("span");
    info.className = "asset-info";
    info.textContent = `${entry.name} (${formatBytes(entry.size)})`;
    row.append(info);

    const rowStatus = document.createElement("span");
    rowStatus.className = "status";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy path";
    copyButton.addEventListener("click", () => copyPath(`${ASSETS_DIR}/${entry.name}`, rowStatus));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", async () => {
      if (!confirm(`Delete ${entry.name}? This can't be undone from the editor.`)) return;
      deleteButton.disabled = true;
      try {
        await github.deleteFile(entry.path, entry.sha, `Delete ${entry.path} via editor`);
        renderAssetList(container, github);
      } catch (err) {
        rowStatus.textContent = err.message;
        deleteButton.disabled = false;
      }
    });

    row.append(copyButton, deleteButton, rowStatus);
    container.append(row);
  }
}

// Reads a File as base64 (no data: URL prefix).
function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.slice(reader.result.indexOf(",") + 1));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function uploadAsset(github, file, statusEl) {
  if (file.size > MAX_ASSET_BYTES) {
    statusEl.textContent = `${file.name} is too big (${formatBytes(file.size)}) — keep uploads under ${formatBytes(MAX_ASSET_BYTES)}.`;
    return;
  }

  const path = `${ASSETS_DIR}/${file.name}`;
  let existing;
  try {
    existing = await github.getFile(path);
  } catch (err) {
    statusEl.textContent = err.message;
    return;
  }
  if (existing && !confirm(`${path} already exists — overwrite it?`)) {
    statusEl.textContent = "";
    return;
  }

  statusEl.textContent = "Uploading…";
  try {
    const base64 = await readAsBase64(file);
    await github.putBinaryFile(path, base64, existing ? existing.sha : undefined, `Add ${path} via editor`);
    statusEl.textContent = `Uploaded ${path}. GitHub Pages will redeploy shortly.`;
  } catch (err) {
    statusEl.textContent = err.message;
  }
}

// TEMPLATES entry point (see templates.js) — builds the whole Assets page into
// whatever container editor.js's openTemplate() hands it.
function renderAssetManager(container, ctx) {
  const { github } = ctx;
  container.innerHTML = "";
  container.className = "asset-manager";

  const help = document.createElement("p");
  help.className = "help";
  help.textContent = "Upload images here, then copy the path into a photo/logo/icon field elsewhere in the editor.";

  const listContainer = document.createElement("div");

  const uploadLabel = document.createElement("label");
  uploadLabel.textContent = "Upload a file";
  const uploadInput = document.createElement("input");
  uploadInput.type = "file";
  uploadInput.accept = "image/*";
  uploadLabel.append(uploadInput);

  const uploadStatus = document.createElement("div");
  uploadStatus.className = "status";

  container.append(help, listContainer, uploadLabel, uploadStatus);

  renderAssetList(listContainer, github);

  uploadInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    uploadAsset(github, file, uploadStatus).then(() => renderAssetList(listContainer, github));
  });
}
