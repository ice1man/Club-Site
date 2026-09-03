// Renders calender/events.ics on the site. Parsing itself lives in ics.js,
// shared with the editor — load that script before this one.

// Points #subscribe-link at this feed's webcal:// URL, so a calendar app
// (Apple/Outlook Calendar, etc.) subscribes instead of doing a one-time import.
function setupSubscribeLink() {
  const link = document.getElementById("subscribe-link");
  if (!link) return;
  link.href = new URL("events.ics", location.href).href.replace(/^https?:/, "webcal:");
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
    if (e.hasTime) {
      date.textContent += " · " + e.date.toLocaleTimeString(undefined, {
        hour: "numeric", minute: "2-digit",
      });
    }
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
