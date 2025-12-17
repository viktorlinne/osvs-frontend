let handler: ((msg: string | null) => void) | null = null;

export function registerGlobalErrorHandler(h: (msg: string | null) => void) {
  handler = h;
}

export function unregisterGlobalErrorHandler() {
  handler = null;
}

export function reportGlobalError(msg: string | null) {
  try {
    if (handler) handler(msg);
  } catch {
    // swallow
  }
}

export default {
  registerGlobalErrorHandler,
  unregisterGlobalErrorHandler,
  reportGlobalError,
};
