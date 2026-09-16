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
        const [date, hasTime] = parseDateOrDateTime(value);
        event.date = date;
        event.hasTime = hasTime;
      } else if (name === "DTEND") {
        const [date, hasTime] = parseDateOrDateTime(value);
        // An all-day DTEND is exclusive per RFC 5545 (a 3-day event ending
        // "Aug 12" is stored as DTEND Aug 13) — shift back one day so `end`
        // holds the inclusive last day, matching what the editor shows/takes.
        event.end = hasTime ? date : new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
        event.hasEndTime = hasTime;
      }
    }
    return event;
  }).filter((e) => e.uid && e.date && e.summary);
}

// Parses a DTSTART/DTEND value (YYYYMMDD or YYYYMMDDTHHMMSS) into [Date, hasTime].
function parseDateOrDateTime(value) {
  const y = +value.slice(0, 4), m = +value.slice(4, 6), d = +value.slice(6, 8);
  const t = value.indexOf("T");
  if (t === -1) return [new Date(y, m - 1, d), false];
  // Floating local time — a trailing Z (UTC) isn't converted, just ignored.
  const hh = +value.slice(t + 1, t + 3), mm = +value.slice(t + 3, t + 5);
  return [new Date(y, m - 1, d, hh, mm), true];
}

function serializeICS(events) {
  const escape = (s) => String(s).replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n");
  const pad = (n) => String(n).padStart(2, "0");
  const dateStamp = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const dateTimeLine = (prop, d, hasTime) => hasTime
    ? `${prop}:${dateStamp(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`
    : `${prop};VALUE=DATE:${dateStamp(d)}`;

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Club-Site//Calendar//EN", ""];

  for (const e of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.uid}`);
    lines.push(dateTimeLine("DTSTART", e.date, e.hasTime));
    if (e.end) {
      // Restore the RFC 5545 exclusive-end convention for an all-day end
      // (the inclusive last day held in `end` is written as the day after).
      const dtend = e.hasEndTime ? e.end : new Date(e.end.getFullYear(), e.end.getMonth(), e.end.getDate() + 1);
      lines.push(dateTimeLine("DTEND", dtend, e.hasEndTime));
    }
    lines.push(`SUMMARY:${escape(e.summary)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    lines.push("END:VEVENT", "");
  }

  lines.push("END:VCALENDAR", "");
  return lines.join("\n");
}
