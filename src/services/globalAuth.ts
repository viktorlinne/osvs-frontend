type UnauthorizedDetails = {
  status?: number;
  url?: string;
  source?: string;
};

let handler: ((details?: UnauthorizedDetails) => void) | null = null;
let lastUnauthorizedAt = 0;
const UNAUTHORIZED_REPORT_DEDUPE_MS = 400;

export function registerUnauthorizedHandler(
  h: (details?: UnauthorizedDetails) => void
) {
  handler = h;
}

export function unregisterUnauthorizedHandler() {
  handler = null;
}

export function reportUnauthorized(details?: UnauthorizedDetails) {
  const now = Date.now();
  if (now - lastUnauthorizedAt < UNAUTHORIZED_REPORT_DEDUPE_MS) return;
  lastUnauthorizedAt = now;
  try {
    handler?.(details);
  } catch {
    // ignore handler errors
  }
}

export default {
  registerUnauthorizedHandler,
  unregisterUnauthorizedHandler,
  reportUnauthorized,
};
