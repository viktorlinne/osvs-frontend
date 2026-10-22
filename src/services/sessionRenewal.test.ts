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

const ME_BODY = {
  user: { matrikelnummer: 7, firstname: "Test", lastname: "Member" },
  roles: ["Member"],
  session: SESSION,
};

type Reply = { status: number; data?: unknown };
type Handler = (config: InternalAxiosRequestConfig) => Reply | Promise<Reply>;

function pathOf(config: InternalAxiosRequestConfig) {
  return String(config.url ?? "").replace(/^\/api/, "");
}

/** Loads fresh copies of the service modules with a fake HTTP adapter. */
async function setup(handler: Handler) {
  vi.resetModules();
  const apiModule = await import("./api");
  const globalAuth = await import("./globalAuth");
  const auth = await import("./auth");
  const calls: string[] = [];

  const adapter: AxiosAdapter = async (config) => {
    const path = pathOf(config);
    calls.push(`${String(config.method).toUpperCase()} ${path}`);
    const reply = await handler(config);
    const response: AxiosResponse = {
      data: reply.data ?? {},
      status: reply.status,
      statusText: String(reply.status),
      headers: {},
      config,
    };
    if (reply.status >= 400) {
      throw new AxiosError(
        `status ${reply.status}`,
        undefined,
        config,
        undefined,
        response,
      );
    }
    return response;
  };
  apiModule.api.defaults.adapter = adapter;

  const unauthorized = vi.fn();
  globalAuth.registerUnauthorizedHandler(unauthorized);

  return { apiModule, globalAuth, auth, calls, unauthorized };
}

const count = (calls: string[], call: string) =>
  calls.filter((c) => c === call).length;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("restoreSession (app start)", () => {
  it("does not refresh when /auth/me succeeds", async () => {
    const { auth, calls } = await setup(() => ({ status: 200, data: ME_BODY }));

    const state = await auth.restoreSession();

    expect(state.user?.matrikelnummer).toBe(7);
    expect(state.session).toEqual(SESSION);
    expect(calls).toEqual(["GET /auth/me"]);
  });

  it("refreshes once on 401 from /auth/me and retries", async () => {
    let refreshed = false;
    const { auth, calls } = await setup((config) => {
      const path = pathOf(config);
      if (path === "/auth/refresh") {
        refreshed = true;
        return { status: 200, data: { session: SESSION } };
      }
      return refreshed
        ? { status: 200, data: ME_BODY }
        : { status: 401, data: { message: "Ogiltig session" } };
    });

    const state = await auth.restoreSession();

    expect(state.user?.matrikelnummer).toBe(7);
    expect(calls).toEqual(["GET /auth/me", "POST /auth/refresh", "GET /auth/me"]);
  });

  it("resolves to logged out when the refresh itself returns 401", async () => {
    const { auth } = await setup(() => ({
      status: 401,
      data: { message: "Ogiltig eller utgången session" },
    }));

    await expect(auth.restoreSession()).resolves.toEqual({
      user: null,
      session: null,
    });
  });

  it("rejects with a Swedish retry message (not logged out) when refresh is rate limited", async () => {
    const { auth, apiModule } = await setup((config) =>
      pathOf(config) === "/auth/refresh"
        ? { status: 429, data: { message: "För många sessionförnyelser" } }
        : { status: 401, data: {} },
    );

    await expect(auth.restoreSession()).rejects.toEqual({
      status: 429,
      message: apiModule.SESSION_RENEWAL_RATE_LIMITED_MESSAGE,
    });
  });
});

describe("refresh on 401 for API requests", () => {
  it("shares a single in-flight refresh between concurrent 401s and retries each request", async () => {
    let refreshed = false;
    let releaseRefresh: () => void = () => {};
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    const { apiModule, globalAuth, calls, unauthorized } = await setup(
      async (config) => {
        const path = pathOf(config);
        if (path === "/auth/refresh") {
          await refreshGate;
          refreshed = true;
          return { status: 200, data: { session: SESSION } };
        }
        return refreshed
          ? { status: 200, data: { path } }
          : { status: 401, data: { message: "Vänligen logga in" } };
      },
    );
    globalAuth.setAuthenticatedSession(SESSION);

    const requests = ["/events", "/posts", "/users/7"].map((url) =>
      apiModule.fetchData(apiModule.api.get(url)),
    );
    await vi.waitFor(() => expect(calls).toHaveLength(4));
    releaseRefresh();
    const results = await Promise.all(requests);

    expect(results).toEqual([
      { path: "/events" },
      { path: "/posts" },
      { path: "/users/7" },
    ]);
    expect(count(calls, "POST /auth/refresh")).toBe(1);
    expect(count(calls, "GET /events")).toBe(2);
    expect(unauthorized).not.toHaveBeenCalled();
    expect(globalAuth.hasActiveSession()).toBe(true);
  });

  it("shares the in-flight renewal between heartbeat and refresh", async () => {
    let releaseRenewal: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseRenewal = resolve;
    });
    const { apiModule, calls } = await setup(async () => {
      await gate;
      return { status: 200, data: { session: SESSION } };
    });

    const a = apiModule.renewSession("/auth/heartbeat");
    const b = apiModule.renewSession("/auth/refresh");
    releaseRenewal();
    await Promise.all([a, b]);

    expect(calls).toEqual(["POST /auth/heartbeat"]);
  });

  it("serialises renewals across tabs with a Web Lock when available", async () => {
    const lockNames: string[] = [];
    vi.stubGlobal("navigator", {
      ...navigator,
      locks: {
        request: (name: string, callback: () => Promise<unknown>) => {
          lockNames.push(name);
          return callback();
        },
      },
    });
    try {
      const { apiModule, calls } = await setup(() => ({
        status: 200,
        data: { session: SESSION },
      }));
      await apiModule.renewSession("/auth/refresh");
      expect(lockNames).toEqual(["osvs-session-renewal"]);
      expect(calls).toEqual(["POST /auth/refresh"]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("logs out only when the refresh returns 401", async () => {
    const { apiModule, globalAuth, calls, unauthorized } = await setup(() => ({
      status: 401,
      data: { message: "Ogiltig eller utgången session" },
    }));
    globalAuth.setAuthenticatedSession(SESSION);

    await expect(
      apiModule.fetchData(apiModule.api.get("/events")),
    ).rejects.toMatchObject({ status: 401 });

    expect(count(calls, "POST /auth/refresh")).toBe(1);
    expect(unauthorized).toHaveBeenCalledTimes(1);
    expect(globalAuth.hasActiveSession()).toBe(false);
  });

  it("keeps the session when the refresh is rate limited (429)", async () => {
    const { apiModule, globalAuth, unauthorized } = await setup((config) =>
      pathOf(config) === "/auth/refresh"
        ? {
            status: 429,
            data: { message: "För många sessionförnyelser, försök igen senare." },
          }
        : { status: 401, data: {} },
    );
    globalAuth.setAuthenticatedSession(SESSION);

    await expect(
      apiModule.fetchData(apiModule.api.get("/events")),
    ).rejects.toEqual({
      status: 429,
      message: apiModule.SESSION_RENEWAL_RATE_LIMITED_MESSAGE,
    });

    expect(unauthorized).not.toHaveBeenCalled();
    expect(globalAuth.hasActiveSession()).toBe(true);
  });

  it("does not refresh when no session is active", async () => {
    const { apiModule, calls } = await setup(() => ({ status: 401, data: {} }));

    await expect(
      apiModule.fetchData(apiModule.api.get("/events")),
    ).rejects.toMatchObject({ status: 401 });

    expect(calls).toEqual(["GET /events"]);
  });
});
