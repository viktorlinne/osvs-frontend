import api, { fetchData } from "./api";

export async function listPosts() {
	return fetchData(api.get("/posts"));
}

export async function getPost(id: number | string) {
	return fetchData(api.get(`/posts/${id}`));
}

export async function createPost(payload: Record<string, unknown>) {
	return fetchData(api.post("/posts", payload));
}

export async function updatePost(id: number | string, payload: Record<string, unknown>) {
	return fetchData(api.put(`/posts/${id}`, payload));
}

export default { listPosts, getPost, createPost, updatePost };
