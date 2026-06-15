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
});
