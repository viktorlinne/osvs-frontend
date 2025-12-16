import api, { fetchData } from "./api";

export async function listRoles() {
	return fetchData(api.get("/admin/roles"));
}

export async function cleanupTokens() {
	return fetchData(api.post("/admin/cleanup-tokens"));
}

export default { listRoles, cleanupTokens };
