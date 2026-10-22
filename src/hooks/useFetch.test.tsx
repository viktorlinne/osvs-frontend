import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import axios from "axios";
import useFetch from "./useFetch";
import { ErrorProvider } from "../context/ErrorProvider";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <ErrorProvider>{children}</ErrorProvider>;
}

describe("useFetch", () => {
  it("sets notFound on 404 axios errors", async () => {
    const error = Object.assign(new Error("Not found"), {
      isAxiosError: true,
      response: { status: 404, data: { status: 404, message: "Missing" } },
    });
    vi.spyOn(axios, "isAxiosError").mockReturnValue(true);

    const { result } = renderHook(() => useFetch<null>(), { wrapper });

    await act(async () => {
      try {
        await result.current.run(async () => {
          throw error;
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(result.current.notFound).toBe(true);
      expect(result.current.loading).toBe(false);
    });
  });

  it("ignores a stale response that settles after a newer run", async () => {
    const { result } = renderHook(() => useFetch<string>(), { wrapper });
    let resolveOld!: (v: string) => void;
    let resolveNew!: (v: string) => void;

    let oldRun!: Promise<string>;
    let newRun!: Promise<string>;
    act(() => {
      oldRun = result.current.run(() => new Promise<string>((r) => (resolveOld = r)));
    });
    act(() => {
      newRun = result.current.run(() => new Promise<string>((r) => (resolveNew = r)));
    });

    await act(async () => {
      resolveNew("member-2");
      await newRun;
    });
    // The older run is still in flight: loading must stay true.
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe("member-2");

    await act(async () => {
      resolveOld("member-1");
      await oldRun;
    });
    expect(result.current.data).toBe("member-2");
    expect(result.current.loading).toBe(false);
  });

  it("does not mark notFound from a stale 404", async () => {
    const { result } = renderHook(() => useFetch<string>(), { wrapper });
    let rejectOld!: (e: unknown) => void;
    let resolveNew!: (v: string) => void;
    let oldRun!: Promise<string>;
    let newRun!: Promise<string>;
    act(() => {
      oldRun = result.current.run(() => new Promise<string>((_, rej) => (rejectOld = rej)));
    });
    act(() => {
      newRun = result.current.run(() => new Promise<string>((r) => (resolveNew = r)));
    });
    await act(async () => {
      resolveNew("ok");
      await newRun;
      rejectOld({ status: 404, message: "Hittades inte" });
      await oldRun.catch(() => undefined);
    });
    expect(result.current.notFound).toBe(false);
    expect(result.current.data).toBe("ok");
  });
});
