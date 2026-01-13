let handler: ((msg: string | null) => void) | null = null;
let lastMessage: string | null = null;

export function registerGlobalErrorHandler(h: (msg: string | null) => void) {
  handler = h;
  // If an error was reported before registration, notify immediately
  try {
    if (lastMessage != null) h(lastMessage);
  } catch {
    // swallow
  }
}

export function unregisterGlobalErrorHandler() {
  handler = null;
}

export function reportGlobalError(msg: string | null) {
  lastMessage = msg;
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
