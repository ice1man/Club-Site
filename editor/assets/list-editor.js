// Generic "list of records in one file" editor: load -> editable rows ->
// add/remove -> save as one commit. Configured per-template by templates.js
// (fields, parse/serialize, and — for records needing a stable id — idKey/
// generateId). See docs/editor/README.md.

async function renderListEditor(container, config) {
  const {
    github, dataPath, fields, parse, serialize, commitMessage,
    idKey, generateId, toValues, fromValues, reorder, prependNew, repeat,
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

  function addRow(record, { prepend, repeat: repeatSpec } = {}) {
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

    if (repeatSpec) {
      row._repeat = repeatSpec;
      const freq = repeat && repeat.frequencies.find((f) => f.value === repeatSpec.frequency);
      const badge = document.createElement("span");
      badge.className = "repeat-badge";
      badge.textContent = `Repeats ${freq ? freq.label.toLowerCase() : repeatSpec.frequency} until ${repeatSpec.until}`;

      const clearRepeatButton = document.createElement("button");
      clearRepeatButton.type = "button";
      clearRepeatButton.className = "clear-repeat";
      clearRepeatButton.textContent = "×";
      clearRepeatButton.title = "Don't repeat this event";
      clearRepeatButton.addEventListener("click", () => {
        row._repeat = null;
        badge.remove();
        clearRepeatButton.remove();
      });

      row.append(badge, clearRepeatButton);
    }

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

  let repeatControls = null;
  if (repeat) {
    const frequencySelect = document.createElement("select");
    frequencySelect.className = "repeat-frequency";
    const blankOption = document.createElement("option");
    blankOption.value = "";
    blankOption.textContent = "Repeat…";
    frequencySelect.append(blankOption);
    for (const f of repeat.frequencies) {
      const option = document.createElement("option");
      option.value = f.value;
      option.textContent = f.label;
      frequencySelect.append(option);
    }

    const untilInput = document.createElement("input");
    untilInput.type = "date";
    untilInput.className = "repeat-until";

    const repeatStatus = document.createElement("span");
    repeatStatus.className = "status";

    const addRepeatingButton = document.createElement("button");
    addRepeatingButton.type = "button";
    addRepeatingButton.textContent = "+ Add repeating event";
    addRepeatingButton.addEventListener("click", () => {
      if (!frequencySelect.value || !untilInput.value) {
        repeatStatus.textContent = "Pick a frequency and an until date first.";
        return;
      }
      repeatStatus.textContent = "";
      addRow({}, {
        prepend: !!prependNew,
        repeat: { frequency: frequencySelect.value, until: untilInput.value },
      });
    });

    repeatControls = document.createElement("div");
    repeatControls.className = "repeat-controls";
    repeatControls.append(frequencySelect, untilInput, addRepeatingButton, repeatStatus);
  }

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

      const valuesList = row._repeat ? expandRepeat(values, row._repeat, repeat) : [values];
      for (const v of valuesList) {
        let record = fromValues ? fromValues(v) : v;
        if (idKey) {
          const id = row._id || generateId(record, taken);
          taken.add(id);
          record = { [idKey]: id, ...record };
        }
        newRecords.push(record);
      }
    }

    saveButton.disabled = true;
    saveStatus.textContent = "Saving…";
    try {
      const result = await github.putFile(dataPath, serialize(newRecords), file ? file.sha : undefined, commitMessage);
      file = { text: serialize(newRecords), sha: result.content.sha };
      saveStatus.textContent = "Saved. GitHub Pages will redeploy shortly.";
      // Each occurrence is now its own saved record — clear the tag so a
      // later save in this session doesn't regenerate the whole series again.
      for (const row of rows) row._repeat = null;
    } catch (err) {
      saveStatus.textContent = err.message;
    }
    saveButton.disabled = false;
  });

  container.append(list, addButton);
  if (repeatControls) container.append(repeatControls);
  container.append(saveButton, saveStatus);
}

// Maximum occurrences a single "repeat until" can generate, as a safeguard
// against a mistyped far-future until-date silently creating a huge commit.
const MAX_REPEAT_OCCURRENCES = 100;

// Expands one row's field values into one values-object per occurrence,
// stepping `repeatConfig.dateKey` (and `endDateKey`, if set on this event)
// forward with the chosen frequency's `addToDate` until it passes `until`.
// Falls back to the single occurrence if that produces none (e.g. an until
// date before the start).
function expandRepeat(values, repeatSpec, repeatConfig) {
  const freq = repeatConfig.frequencies.find((f) => f.value === repeatSpec.frequency);
  if (!freq || !values[repeatConfig.dateKey]) return [values];

  const [uy, um, ud] = repeatSpec.until.split("-").map(Number);
  const until = new Date(uy, um - 1, ud);

  const [y, m, d] = values[repeatConfig.dateKey].split("-").map(Number);
  let cursor = new Date(y, m - 1, d);

  const endKey = repeatConfig.endDateKey;
  let endCursor = null;
  if (endKey && values[endKey]) {
    const [ey, em, ed] = values[endKey].split("-").map(Number);
    endCursor = new Date(ey, em - 1, ed);
  }

  const out = [];
  while (cursor <= until && out.length < MAX_REPEAT_OCCURRENCES) {
    const variant = { ...values, [repeatConfig.dateKey]: repeatConfig.formatDate(cursor) };
    if (endCursor) variant[endKey] = repeatConfig.formatDate(endCursor);
    out.push(variant);
    cursor = freq.addToDate(cursor);
    if (endCursor) endCursor = freq.addToDate(endCursor);
  }

  return out.length ? out : [values];
}
