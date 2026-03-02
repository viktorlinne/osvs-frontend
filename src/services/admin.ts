import api, { fetchData } from "./api";

export async function listRoles() {
	return fetchData(api.get("/admin/roles"));
}

export default { listRoles };
