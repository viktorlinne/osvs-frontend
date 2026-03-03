const STOCKHOLM_TIME_ZONE = "Europe/Stockholm";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const SQL_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

const STOCKHOLM_PARTS_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: STOCKHOLM_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const STOCKHOLM_MONTH_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: STOCKHOLM_TIME_ZONE,
  month: "long",
});

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isLeapYear(year: number): boolean {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function isValidDateParts(parts: DateParts): boolean {
  if (!Number.isInteger(parts.year) || parts.year < 1000 || parts.year > 9999) {
    return false;
  }
  if (!Number.isInteger(parts.month) || parts.month < 1 || parts.month > 12) {
    return false;
  }
  if (
    !Number.isInteger(parts.day) ||
    parts.day < 1 ||
    parts.day > daysInMonth(parts.year, parts.month)
  ) {
    return false;
  }
  if (!Number.isInteger(parts.hour) || parts.hour < 0 || parts.hour > 23) {
    return false;
  }
  if (
    !Number.isInteger(parts.minute) ||
    parts.minute < 0 ||
    parts.minute > 59
  ) {
    return false;
  }
  if (
    !Number.isInteger(parts.second) ||
    parts.second < 0 ||
    parts.second > 59
  ) {
    return false;
  }
  return true;
}

function toSqlDateTime(parts: DateParts): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)} ${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

function parseSqlLike(raw: string): DateParts | null {
  const m = raw.match(SQL_DATE_TIME_RE);
  if (!m) return null;

  const parts: DateParts = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] ? Number(m[6]) : 0,
  };
  return isValidDateParts(parts) ? parts : null;
}

function toStockholmSqlDateTime(date: Date): string {
  const parts = STOCKHOLM_PARTS_FORMATTER.formatToParts(date);
  const values: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const p of parts) {
    values[p.type] = p.value;
  }

  const typed: DateParts = {
    year: Number(values.year ?? ""),
    month: Number(values.month ?? ""),
    day: Number(values.day ?? ""),
    hour: Number(values.hour ?? ""),
    minute: Number(values.minute ?? ""),
    second: Number(values.second ?? ""),
  };
  if (!isValidDateParts(typed)) return "";
  return toSqlDateTime(typed);
}

function compareSqlDateTimes(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function addHoursToSqlDateTime(value: string, hours: number): string | null {
  const parsed = parseSqlLike(value);
  if (!parsed) return null;
  const baseUtc = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
  );
  if (!Number.isFinite(baseUtc)) return null;
  const next = new Date(baseUtc + hours * 60 * 60 * 1000);
  return toSqlDateTime({
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: next.getUTCHours(),
    minute: next.getUTCMinutes(),
    second: next.getUTCSeconds(),
  });
}

function monthNameSv(parts: DateParts): string {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  const raw = STOCKHOLM_MONTH_FORMATTER.format(date);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function normalizeEventDateTime(value?: string): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  const sqlLike = parseSqlLike(raw);
  if (sqlLike) return toSqlDateTime(sqlLike);

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const stockholm = toStockholmSqlDateTime(parsed);
  return stockholm || null;
}

export function getNowStockholmSqlDateTime(now: Date = new Date()): string {
  return toStockholmSqlDateTime(now);
}

export function formatEventDisplayDate(value?: string): string {
  const normalized = normalizeEventDateTime(value);
  if (!normalized) return value ? String(value) : "";
  const parts = parseSqlLike(normalized);
  if (!parts) return normalized;
  return `${pad2(parts.day)} ${monthNameSv(parts)} ${parts.year} ${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function toEventDateInputValue(value?: string): string {
  const normalized = normalizeEventDateTime(value);
  if (!normalized) return "";
  return normalized.slice(0, 16).replace(" ", "T");
}

export function dateKeyFromEventDate(value?: string): string {
  const normalized = normalizeEventDateTime(value);
  return normalized ? normalized.slice(0, 10) : "";
}

export function isEventStartedNowStockholm(value?: string): boolean {
  const normalized = normalizeEventDateTime(value);
  if (!normalized) return false;
  const now = getNowStockholmSqlDateTime();
  if (!now) return false;
  return compareSqlDateTimes(normalized, now) <= 0;
}

export function isMoreThan48HoursFromNowStockholm(value?: string): boolean {
  const normalized = normalizeEventDateTime(value);
  if (!normalized) return false;
  const now = getNowStockholmSqlDateTime();
  if (!now) return false;
  const nowPlus48 = addHoursToSqlDateTime(now, 48);
  if (!nowPlus48) return false;
  return compareSqlDateTimes(normalized, nowPlus48) > 0;
}

