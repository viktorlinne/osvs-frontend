export function formatEventDisplayDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const parts = new Intl.DateTimeFormat("sv-SE", {
    minute: "2-digit",
    hour: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).formatToParts(d);
  return parts
    .map((p) =>
      p.type === "month"
        ? p.value.charAt(0).toUpperCase() + p.value.slice(1)
        : p.value,
    )
    .join("");
}

export function toEventDateInputValue(value?: string) {
  if (!value) return "";
  const raw = String(value).trim();

  // Already in input format: YYYY-MM-DDTHH:mm(:ss)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw)) {
    return raw.slice(0, 16);
  }

  // Common SQL datetime format: YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(raw)) {
    return raw.slice(0, 16).replace(" ", "T");
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  const minute = String(d.getMinutes()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

