export function parseISODate(value) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    )
  );
}

export function formatDateTime(value) {
  const date = typeof value === "string" ? parseISODate(value) : value;
  if (!date) return "";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function isToday(date) {
  if (!(date instanceof Date)) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

export function isThisWeek(date) {
  if (!(date instanceof Date)) return false;
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);
  return date >= startOfWeek && date <= endOfWeek;
}

export function compareAsc(a, b) {
  if (!(a instanceof Date) || !(b instanceof Date)) return 0;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function toISODate(date) {
  if (!(date instanceof Date)) return "";
  return date.toISOString();
}

function getStartOfWeek(baseDate) {
  const date = new Date(
    Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate())
  );
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function getEndOfWeek(baseDate) {
  const start = getStartOfWeek(baseDate);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}
