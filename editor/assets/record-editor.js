// Generic "single record in one file" editor: load -> one form -> save as
// one commit. Sibling to list-editor.js — same field/parse/serialize shape,
// but for a single JSON object instead of an array of records (e.g.
// who-we-are/info.json or site.json, vs. calendar events or admins).
// Field types: "text", "textarea", "lines" (textarea <-> string array,
// one entry per non-empty line), "checkbox" (boolean), "color" (hex string —
// give the field a `default`, since an empty color input reads as #000000).

// Field types backed by an <input> and the type= they use; everything else
// renders as a <textarea>.
const INPUT_TYPES = { text: "text", checkbox: "checkbox", color: "color" };

async function renderRecordEditor(container, config) {
  const { github, dataPath, fields, parse, serialize, commitMessage } = config;

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
  const record = file ? parse(file.text) : {};
  status.remove();

  const form = document.createElement("div");
  form.className = "record-form";
  const inputs = {};

  for (const f of fields) {
    const label = document.createElement("label");
    const isCheckbox = f.type === "checkbox";
    const inputType = INPUT_TYPES[f.type];
    const input = document.createElement(inputType ? "input" : "textarea");
    if (inputType) input.type = inputType;
    input.className = `f-${f.key}`;

    if (isCheckbox) {
      label.className = "checkbox-field";
      input.checked = !!record[f.key];
      label.append(input, document.createTextNode(f.label));
    } else {
      label.textContent = f.label + (f.required ? "" : " (optional)");
      if (f.type === "lines") input.value = (record[f.key] || []).join("\n");
      else input.value = record[f.key] || f.default || "";
      label.append(input);
    }

    form.append(label);
    inputs[f.key] = input;
  }

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.className = "primary";
  saveButton.textContent = "Save changes";

  const saveStatus = document.createElement("p");
  saveStatus.className = "status";

  saveButton.addEventListener("click", async () => {
    const newRecord = {};
    for (const f of fields) {
      if (f.type === "checkbox") {
        newRecord[f.key] = inputs[f.key].checked;
        continue;
      }
      const value = inputs[f.key].value.trim();
      newRecord[f.key] = f.type === "lines"
        ? value.split("\n").map((line) => line.trim()).filter(Boolean)
        : value;
    }

    const missing = fields.filter((f) => f.required && f.type !== "checkbox" && !(newRecord[f.key] && newRecord[f.key].length));
    if (missing.length) {
      saveStatus.textContent = `Please fill in: ${missing.map((f) => f.label).join(", ")}`;
      return;
    }

    saveButton.disabled = true;
    saveStatus.textContent = "Saving…";
    try {
      await github.putFile(dataPath, serialize(newRecord), file ? file.sha : undefined, commitMessage);
      saveStatus.textContent = "Saved. GitHub Pages will redeploy shortly.";
    } catch (err) {
      saveStatus.textContent = err.message;
    }
    saveButton.disabled = false;
  });

  container.append(form, saveButton, saveStatus);
}
