function formatDateForIcs(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function formatDateTimeUtc(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

type IcsEventOptions = {
  description: string;
  endDate: Date;
  filename: string;
  startDate: Date;
  title: string;
  untilDate?: Date;
};

function buildIcsEventLines({
  description,
  endDate,
  startDate,
  title,
  untilDate
}: Omit<IcsEventOptions, "filename">) {
  const uid = `life-calendar-${startDate.getTime()}@local`;
  const dtStamp = formatDateTimeUtc(new Date());
  const lines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `DTSTART;VALUE=DATE:${formatDateForIcs(startDate)}`,
    `DTEND;VALUE=DATE:${formatDateForIcs(endDate)}`
  ];

  if (untilDate) {
    lines.push(`RRULE:FREQ=WEEKLY;UNTIL=${formatDateForIcs(untilDate)}`);
  }

  lines.push("END:VEVENT");

  return lines;
}

export function downloadIcsEvent(options: IcsEventOptions) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Life Calendar//ES",
    "CALSCALE:GREGORIAN",
    ...buildIcsEventLines(options),
    "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = options.filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function downloadIcsCalendar(
  filename: string,
  events: Array<Omit<IcsEventOptions, "filename">>
) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Life Calendar//ES",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((event) => buildIcsEventLines(event)),
    "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
