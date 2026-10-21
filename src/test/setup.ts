import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without `globals`, so RTL's auto-cleanup is not registered.
// Unmount after every test so portalled Radix layers (dialogs, popovers) and
// the body styles they set (pointer-events, scroll lock) never leak.
afterEach(() => {
  cleanup();
});

// jsdom gaps used by Radix (Popover positioning) and cmdk (scrolling the
// highlighted option into view).
if (typeof window !== "undefined") {
  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "ResizeObserver", {
      value: ResizeObserverStub,
      writable: true,
    });
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => {};
  }
}
