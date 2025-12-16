import api, { fetchData } from "./api";

type LoginPayload = { email: string; password: string };

export async function login({ email, password }: LoginPayload) {
  // backend sets cookies on successful login; response body is empty
  await fetchData(api.post<LoginPayload>("/auth/login", { email, password }));
  // fetch current user after login
  return fetchData(api.get<unknown>("/auth/me"));
}

export async function logout() {
  await fetchData(api.post<void>("/auth/logout"));
}

export async function me() {
  return fetchData(api.get<unknown>("/auth/me"));
}

export default { login, logout, me };
