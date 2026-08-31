// The template registry. Each entry describes one template site the picker
// can show; editor.js is generic over this list. Calendar is the only entry
// today, but this is the extension point future templates register into —
// see docs/editor/README.md.

function makeUid(date, summary, taken) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const slug = summary.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  let uid = `${stamp}-${slug}@club-site`;
  let n = 2;
  while (taken.has(uid)) uid = `${stamp}-${slug}-${n++}@club-site`;
  return uid;
}

function eventRow(event, onRemove) {
  const row = document.createElement("div");
  row.className = "event-row";

  const dateInput = document.createElement("input");
  dateInput.type = "date";
  dateInput.className = "f-date";
  if (event.date) {
    const pad = (n) => String(n).padStart(2, "0");
    dateInput.value = `${event.date.getFullYear()}-${pad(event.date.getMonth() + 1)}-${pad(event.date.getDate())}`;
  }

  const summaryInput = document.createElement("input");
  summaryInput.type = "text";
  summaryInput.className = "f-summary";
  summaryInput.placeholder = "Event title";
  summaryInput.value = event.summary || "";

  const locationInput = document.createElement("input");
  locationInput.type = "text";
  locationInput.className = "f-location";
  locationInput.placeholder = "Location (optional)";
  locationInput.value = event.location || "";

  const descriptionInput = document.createElement("input");
  descriptionInput.type = "text";
  descriptionInput.className = "f-description";
  descriptionInput.placeholder = "Description (optional)";
  descriptionInput.value = event.description || "";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "remove-event";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => onRemove(row));

  row.append(dateInput, summaryInput, locationInput, descriptionInput, removeButton);
  row._uid = event.uid;
  return row;
}

const TEMPLATES = [
  {
    id: "calender",
    name: "Calendar",
    description: "A list of upcoming and past events.",
    dataPath: "calender/events.ics",
    // Already ships in every fork of Club-Site — nothing to create.
    scaffold: null,

    async renderEditor(container, ctx) {
      container.innerHTML = "";
      const status = document.createElement("p");
      status.className = "status";
      status.textContent = "Loading events…";
      container.append(status);

      let file;
      try {
        file = await ctx.github.getFile(this.dataPath);
      } catch (err) {
        status.textContent = err.message;
        return;
      }
      const events = file ? parseICS(file.text) : [];
      status.remove();

      const list = document.createElement("div");
      list.className = "event-list";
      const taken = new Set(events.map((e) => e.uid));
      for (const e of events) list.append(eventRow(e, (row) => row.remove()));

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.textContent = "+ Add event";
      addButton.addEventListener("click", () => {
        list.append(eventRow({ date: new Date() }, (row) => row.remove()));
      });

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.textContent = "Save changes";
      saveButton.className = "primary";

      const saveStatus = document.createElement("p");
      saveStatus.className = "status";

      saveButton.addEventListener("click", async () => {
        const rows = [...list.querySelectorAll(".event-row")];
        const newEvents = [];
        for (const row of rows) {
          const dateVal = row.querySelector(".f-date").value;
          const summary = row.querySelector(".f-summary").value.trim();
          if (!dateVal || !summary) continue; // skip incomplete rows
          const [y, m, d] = dateVal.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          const uid = row._uid || makeUid(date, summary, taken);
          taken.add(uid);
          newEvents.push({
            uid,
            date,
            summary,
            location: row.querySelector(".f-location").value.trim(),
            description: row.querySelector(".f-description").value.trim(),
          });
        }

        saveButton.disabled = true;
        saveStatus.textContent = "Saving…";
        try {
          await ctx.github.putFile(
            this.dataPath,
            serializeICS(newEvents),
            file ? file.sha : undefined,
            "Update events via editor",
          );
          saveStatus.textContent = "Saved. GitHub Pages will redeploy shortly.";
        } catch (err) {
          saveStatus.textContent = err.message;
        }
        saveButton.disabled = false;
      });

      container.append(list, addButton, saveButton, saveStatus);
    },
  },
];
