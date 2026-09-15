// Generic "list of records in one file" editor: load -> editable rows ->
// add/remove -> save as one commit. Configured per-template by templates.js
// (fields, parse/serialize, and — for records needing a stable id — idKey/
// generateId). See docs/editor/README.md.

async function renderListEditor(container, config) {
  const {
    github, dataPath, fields, parse, serialize, commitMessage,
    idKey, generateId, toValues, fromValues, reorder, prependNew,
  } = config;

  container.innerHTML = "";
  const status = document.createElement("p");
  status.className = "status";
  status.textContent = "Loading…";
  container.append(status);

  let file;
  try {
    file = await github.getFile(dataPath);
  } catch (err) {
    status.textContent = err.message;
    return;
  }
  const records = file ? parse(file.text) : [];
  status.remove();

  const list = document.createElement("div");
  list.className = "record-list";
  const taken = new Set(idKey ? records.map((r) => r[idKey]) : []);

  function addRow(record, { prepend } = {}) {
    const row = document.createElement("div");
    row.className = "record-row";
    row._inputs = {};
    const values = toValues ? toValues(record) : record;

    for (const f of fields) {
      const input = document.createElement(f.type === "textarea" ? "textarea" : "input");
      if (f.type && f.type !== "textarea") input.type = f.type;
      input.className = `f-${f.key}`;
      input.placeholder = f.label + (f.required ? "" : " (optional)");
      input.value = values[f.key] || "";
      row.append(input);
      row._inputs[f.key] = input;
    }

    if (idKey && record[idKey]) row._id = record[idKey];

    if (reorder) {
      const moveUpButton = document.createElement("button");
      moveUpButton.type = "button";
      moveUpButton.className = "move-record move-up";
      moveUpButton.textContent = "▲";
      moveUpButton.title = "Move up";
      moveUpButton.addEventListener("click", () => {
        const prev = row.previousElementSibling;
        if (prev) list.insertBefore(row, prev);
      });
      row.append(moveUpButton);

      const moveDownButton = document.createElement("button");
      moveDownButton.type = "button";
      moveDownButton.className = "move-record move-down";
      moveDownButton.textContent = "▼";
      moveDownButton.title = "Move down";
      moveDownButton.addEventListener("click", () => {
        const next = row.nextElementSibling;
        if (next) list.insertBefore(next, row);
      });
      row.append(moveDownButton);
    }

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-record";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => row.remove());
    row.append(removeButton);

    if (prepend) list.prepend(row); else list.append(row);
  }

  for (const r of records) addRow(r);

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.textContent = "+ Add";
  addButton.addEventListener("click", () => addRow({}, { prepend: !!prependNew }));

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "primary";
  saveButton.textContent = "Save changes";

  const saveStatus = document.createElement("p");
  saveStatus.className = "status";

  saveButton.addEventListener("click", async () => {
    const rows = [...list.querySelectorAll(".record-row")];
    const newRecords = [];
    for (const row of rows) {
      const values = {};
      for (const f of fields) values[f.key] = row._inputs[f.key].value.trim();
      if (fields.some((f) => f.required && !values[f.key])) continue; // skip incomplete rows

      let record = fromValues ? fromValues(values) : values;
      if (idKey) {
        const id = row._id || generateId(record, taken);
        taken.add(id);
        record = { [idKey]: id, ...record };
      }
      newRecords.push(record);
    }

    saveButton.disabled = true;
    saveStatus.textContent = "Saving…";
    try {
      await github.putFile(dataPath, serialize(newRecords), file ? file.sha : undefined, commitMessage);
      saveStatus.textContent = "Saved. GitHub Pages will redeploy shortly.";
    } catch (err) {
      saveStatus.textContent = err.message;
    }
    saveButton.disabled = false;
  });

  container.append(list, addButton, saveButton, saveStatus);
}
