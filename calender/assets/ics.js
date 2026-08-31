// Reads and writes calender/events.ics.
// Only understands the subset defined in docs/calender/data-format.md —
// not a general iCalendar (RFC 5545) parser/serializer.
// Shared by the calendar site (calendar.js) and the editor (templates.js).

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

function serializeICS(events) {
  const escape = (s) => String(s).replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");
  const pad = (n) => String(n).padStart(2, "0");

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Club-Site//Calendar//EN", ""];

  for (const e of events) {
    const stamp = `${e.date.getFullYear()}${pad(e.date.getMonth() + 1)}${pad(e.date.getDate())}`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(`DTSTART;VALUE=DATE:${stamp}`);
    lines.push(`SUMMARY:${escape(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push("END:VEVENT", "");
  }

  lines.push("END:VCALENDAR", "");
  return lines.join("\n");
}
