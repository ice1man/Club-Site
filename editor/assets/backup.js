// Backup/restore: every template's data file, bundled into one JSON file a
// club can download and, if something goes wrong, upload again to restore.
// Generic over TEMPLATES — a future template's data file is automatically
// included, nothing to update here when one is added.

async function downloadBackup(github) {
  const files = {};
  for (const t of TEMPLATES) {
    const file = await github.getFile(t.dataPath).catch(() => null);
    if (file) files[t.dataPath] = file.text;
  }

  const backup = {
    exportedAt: new Date().toISOString(),
    repo: `${github.owner}/${github.repo}`,
    files,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `club-site-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function restoreBackup(github, file, statusEl) {
  statusEl.innerHTML = "";
  let backup;
  try {
    backup = JSON.parse(await file.text());
  } catch {
    statusEl.textContent = "That doesn't look like a valid backup file (not JSON).";
    return;
  }
  if (!backup.files || typeof backup.files !== "object" || Array.isArray(backup.files)) {
    statusEl.textContent = "That doesn't look like a valid backup file (missing \"files\").";
    return;
  }

  const paths = Object.keys(backup.files);
  if (paths.length === 0) {
    statusEl.textContent = "That backup file has nothing in it.";
    return;
  }
  const ok = confirm(
    `This will overwrite ${paths.length} file(s) in your site with the contents of this backup ` +
    `(from ${backup.exportedAt || "an unknown date"}):\n\n${paths.join("\n")}\n\nContinue?`,
  );
  if (!ok) return;

  statusEl.textContent = "Restoring…";
  for (const path of paths) {
    const line = document.createElement("p");
    statusEl.append(line);
    try {
      const existing = await github.getFile(path).catch(() => null);
      await github.putFile(path, backup.files[path], existing ? existing.sha : undefined, `Restore ${path} from backup`);
      line.textContent = `✓ ${path}`;
    } catch (err) {
      line.textContent = `✗ ${path}: ${err.message}`;
    }
  }
}
