// The template registry. Each entry describes one template site the picker
// can show; editor.js is generic over this list. The editing UI itself is
// shared — list-editor.js for a list of records (calendar, admins),
// record-editor.js for a single record (who-we-are) — each template just
// configures fields and how to parse/serialize its data file. See
// docs/editor/README.md.

function makeUid(date, summary, taken) {
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const slug = summary.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  let uid = `${stamp}-${slug}@club-site`;
  let n = 2;
  while (taken.has(uid)) uid = `${stamp}-${slug}-${n++}@club-site`;
  return uid;
}

function dateToInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function timeToInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const TEMPLATES = [
  {
    id: "calender",
    name: "Calendar",
    description: "A list of upcoming and past events.",
    dataPath: "calender/events.ics",
    // Already ships in every fork of Club-Site — nothing to create.
    scaffold: null,

    renderEditor: (container, ctx) => renderListEditor(container, {
      github: ctx.github,
      dataPath: "calender/events.ics",
      fields: [
        { key: "date", label: "Date", type: "date", required: true },
        { key: "time", label: "Time", type: "time" },
        { key: "summary", label: "Event title", type: "text", required: true },
        { key: "location", label: "Location", type: "text" },
        { key: "description", label: "Description", type: "text" },
      ],
      parse: parseICS,
      serialize: serializeICS,
      idKey: "uid",
      generateId: (record, taken) => makeUid(record.date, record.summary, taken),
      toValues: (record) => ({
        date: record.date ? dateToInputValue(record.date) : "",
        time: record.hasTime ? timeToInputValue(record.date) : "",
        summary: record.summary || "",
        location: record.location || "",
        description: record.description || "",
      }),
      fromValues: (values) => {
        const [y, m, d] = values.date.split("-").map(Number);
        const hasTime = !!values.time;
        const [hh, mm] = hasTime ? values.time.split(":").map(Number) : [0, 0];
        return {
          date: new Date(y, m - 1, d, hh, mm),
          hasTime,
          summary: values.summary,
          location: values.location,
          description: values.description,
        };
      },
      commitMessage: "Update events via editor",
    }),
  },
  {
    id: "about",
    name: "Our Team",
    description: "Club officers: name, role, bio, and photo.",
    dataPath: "about/admins.json",
    // Already ships in every fork of Club-Site — nothing to create.
    scaffold: null,

    renderEditor: (container, ctx) => renderListEditor(container, {
      github: ctx.github,
      dataPath: "about/admins.json",
      fields: [
        { key: "photo", label: "Photo path", type: "text" },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "role", label: "Role", type: "text", required: true },
        { key: "bio", label: "Bio", type: "textarea" },
      ],
      parse: (text) => JSON.parse(text),
      serialize: (records) => JSON.stringify(records, null, 2),
      commitMessage: "Update admins via editor",
    }),
  },
  {
    id: "who-we-are",
    name: "Who We Are",
    description: "Club mission, photo, and why it's worth taking seriously.",
    dataPath: "who-we-are/info.json",
    // Already ships in every fork of Club-Site — nothing to create.
    scaffold: null,

    renderEditor: (container, ctx) => renderRecordEditor(container, {
      github: ctx.github,
      dataPath: "who-we-are/info.json",
      fields: [
        { key: "photo", label: "Photo path", type: "text" },
        { key: "mission", label: "Mission", type: "textarea", required: true },
        { key: "reasons", label: "Reasons (one per line)", type: "lines" },
      ],
      parse: (text) => JSON.parse(text),
      serialize: (record) => JSON.stringify(record, null, 2),
      commitMessage: "Update Who We Are via editor",
    }),
  },
  {
    id: "site",
    name: "Home Page",
    description: "Site title and whether icons are shown on the home page.",
    dataPath: "site.json",
    // Already ships in every fork of Club-Site — nothing to create.
    scaffold: null,

    renderEditor: (container, ctx) => renderRecordEditor(container, {
      github: ctx.github,
      dataPath: "site.json",
      fields: [
        { key: "title", label: "Site title", type: "text", required: true },
        { key: "showIcons", label: "Show icons", type: "checkbox" },
      ],
      parse: (text) => JSON.parse(text),
      serialize: (record) => JSON.stringify(record, null, 2),
      commitMessage: "Update home page via editor",
    }),
  },
];
