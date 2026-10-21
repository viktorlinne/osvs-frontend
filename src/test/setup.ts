import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without `globals`, so RTL's auto-cleanup is not registered.
// Unmount after every test so portalled Radix layers (dialogs, popovers) and
// the body styles they set (pointer-events, scroll lock) never leak.
afterEach(() => {
  cleanup();
});
