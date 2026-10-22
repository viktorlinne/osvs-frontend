import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { AxiosError } from "axios";

const SESSION = {
  inactivityTimeoutMs: 900_000,
  inactivityExpiresAt: "2099-01-01T00:00:00.000Z",
  refreshWindowDays: 30,
};

type Reply =
  | { status: number; data?: unknown }
  | { networkError: true }
  | { timeout: true };
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

function pathOf(config: InternalAxiosRequestConfig) {
  return String(config.url ?? "").replace(/^\/api/, "");
}

/** Fresh service modules with a fake HTTP adapter (no network). */
async function setup(handler: Handler) {
  vi.resetModules();
  const apiModule = await import("./api");
  const globalAuth = await import("./globalAuth");
  const auth = await import("./auth");
  const calls: string[] = [];
  const timeouts: number[] = [];

  const adapter: AxiosAdapter = async (config) => {
    calls.push(`${String(config.method).toUpperCase()} ${pathOf(config)}`);
    timeouts.push(Number(config.timeout));
    const reply = await handler(config);
    if ("networkError" in reply) {
      throw new AxiosError("Network Error", AxiosError.ERR_NETWORK, config);
    }
    if ("timeout" in reply) {
      throw new AxiosError(
        "timeout of 10000ms exceeded",
        AxiosError.ECONNABORTED,
        config,
      );
    }
    const response: AxiosResponse = {
      data: reply.data ?? {},
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(`status ${reply.status}`, undefined, config, undefined, response);
    }
    return response;
  };
  apiModule.api.defaults.adapter = adapter;
  return { apiModule, globalAuth, auth, calls, timeouts };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchData error normalisation", () => {
  it("maps a network failure to a Swedish ApiError with status 0", async () => {
    const { apiModule } = await setup(() => ({ networkError: true }));
    await expect(
      apiModule.fetchData(apiModule.api.get("/posts")),
    ).rejects.toEqual({
      status: 0,
      code: "NETWORK_ERROR",
      message: apiModule.NETWORK_ERROR_MESSAGE,
    });
  });

  it("maps a client timeout to a message that warns the change may be saved", async () => {
    const { apiModule } = await setup(() => ({ timeout: true }));
    await expect(
      apiModule.fetchData(apiModule.api.post("/events", {})),
    ).rejects.toMatchObject({
      status: 0,
      code: "TIMEOUT",
      message: apiModule.TIMEOUT_ERROR_MESSAGE,
    });
  });

  it("never shows an HTML proxy error page as the message", async () => {
    const html = "<html><head><title>502 Bad Gateway</title></head><body>nginx</body></html>";
    const { apiModule } = await setup(() => ({ status: 502, data: html }));
    const error = await apiModule
      .fetchData(apiModule.api.get("/posts"))
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ status: 502 });
    expect((error as { message: string }).message).not.toContain("<");
    expect((error as { message: string }).message).toMatch(/tillfälligt otillgänglig/);
  });

  it("still shows a short plain-text server message", async () => {
    const { apiModule } = await setup(() => ({ status: 400, data: "Ogiltig fil" }));
    await expect(
      apiModule.fetchData(apiModule.api.get("/posts")),
    ).rejects.toMatchObject({ status: 400, message: "Ogiltig fil" });
  });

  it("keeps backend JSON messages and field details", async () => {
    const { apiModule } = await setup(() => ({
      status: 400,
      data: { message: "Valideringsfel", details: { fields: { title: "Obligatoriskt" } } },
    }));
    await expect(
      apiModule.fetchData(apiModule.api.post("/posts", {})),
    ).rejects.toMatchObject({
      status: 400,
      message: "Valideringsfel",
      details: { fields: { title: "Obligatoriskt" } },
    });
  });
});

describe("upload timeout", () => {
  it("uses the long upload timeout for multipart bodies only", async () => {
    const { apiModule, timeouts } = await setup(() => ({ status: 200, data: {} }));
    await apiModule.fetchData(apiModule.api.get("/posts"));
    const fd = new FormData();
    fd.append("title", "x");
    await apiModule.fetchData(apiModule.api.post("/documents", fd));
    expect(timeouts).toEqual([10_000, apiModule.UPLOAD_TIMEOUT_MS]);
  });
});

describe("logout", () => {
  it("logs out directly when the access token is valid", async () => {
    const { auth, calls } = await setup(() => ({ status: 200, data: {} }));
    await auth.logout();
    expect(calls).toEqual(["POST /auth/logout"]);
  });

  it("renews and retries when the access token has expired, so the refresh token is revoked", async () => {
    let logoutAttempts = 0;
    const { auth, calls } = await setup((config) => {
      const path = pathOf(config);
      if (path === "/auth/logout") {
        logoutAttempts += 1;
        return logoutAttempts === 1 ? { status: 401 } : { status: 200, data: {} };
      }
      if (path === "/auth/refresh") return { status: 200, data: { session: SESSION } };
      return { status: 404 };
    });
    await auth.logout();
    expect(calls).toEqual(["POST /auth/logout", "POST /auth/refresh", "POST /auth/logout"]);
  });

  it("resolves when the session is already gone server-side", async () => {
    const { auth, calls } = await setup(() => ({ status: 401 }));
    await expect(auth.logout()).resolves.toBeUndefined();
    expect(calls).toEqual(["POST /auth/logout", "POST /auth/refresh"]);
  });

  it("rejects when the server cannot be reached", async () => {
    const { auth } = await setup(() => ({ networkError: true }));
    await expect(auth.logout()).rejects.toMatchObject({ status: 0 });
  });
});

describe("resolveApiBaseUrl", () => {
  it("handles dev, empty, unset and trailing-slash values", async () => {
    const { resolveApiBaseUrl } = await import("./apiBaseUrl");
    expect(resolveApiBaseUrl(true, "https://x.se")).toBe("/api");
    expect(resolveApiBaseUrl(false, "")).toBe("/api");
    expect(resolveApiBaseUrl(false, undefined)).toBe("/api");
    expect(resolveApiBaseUrl(false, "https://osvs.se/")).toBe("https://osvs.se/api");
  });
});
