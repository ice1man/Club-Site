// Parses and renders calender/events.ics.
// Only understands the subset defined in docs/calender/data-format.md —
// not a general iCalendar (RFC 5545) parser.

function parseICS(text) {
  const unescape = (s) => s.replace(/\\n/gi, "\n").replace(/\\([,;])/g, "$1");

  return text.split("BEGIN:VEVENT").slice(1).map((block) => {
    block = block.split("END:VEVENT")[0];
    const event = {};
    for (const line of block.split(/\r?\n/)) {
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const name = line.slice(0, colon).split(";")[0].trim().toUpperCase();
      const value = line.slice(colon + 1).trim();
      if (name === "UID") event.uid = value;
      else if (name === "SUMMARY") event.summary = unescape(value);
      else if (name === "LOCATION") event.location = unescape(value);
      else if (name === "DESCRIPTION") event.description = unescape(value);
      else if (name === "DTSTART") {
        const y = +value.slice(0, 4), m = +value.slice(4, 6), d = +value.slice(6, 8);
        event.date = new Date(y, m - 1, d);
      }
    }
    return event;
  }).filter((e) => e.uid && e.date && e.summary);
}

// Fetches events.ics and renders them into #events, filtered/sorted by mode.
async function renderEvents(mode) {
  const list = document.getElementById("events");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let events;
  try {
    const res = await fetch("events.ics");
    events = parseICS(await res.text());
  } catch (err) {
    list.textContent = "Couldn't load events.";
    return;
  }

  if (mode === "upcoming") {
    events = events.filter((e) => e.date >= today).sort((a, b) => a.date - b.date);
  } else {
    events = events.filter((e) => e.date < today).sort((a, b) => b.date - a.date);
  }

  if (events.length === 0) {
    list.textContent = mode === "upcoming" ? "No upcoming events." : "No past events yet.";
    return;
  }

  for (const e of events) {
    const li = document.createElement("li");

    const date = document.createElement("span");
    date.className = "date";
    date.textContent = e.date.toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    li.append(date);

    const summary = document.createElement("span");
    summary.className = "summary";
    summary.textContent = e.summary;
    li.append(summary);

    if (e.location) {
      const location = document.createElement("span");
      location.className = "detail";
      location.textContent = e.location;
      li.append(location);
    }

    if (e.description) {
      const description = document.createElement("span");
      description.className = "detail";
      description.textContent = e.description;
      li.append(description);
    }

    list.append(li);
  }
}
