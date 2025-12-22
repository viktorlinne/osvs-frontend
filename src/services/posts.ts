import api, { fetchData } from "./api";
import type { Post } from "@osvs/types";

function normalizePost(raw: Post): Post | null {
  const id = Number(raw?.id);
  const title = String(raw?.title ?? "").trim();
  if (!Number.isFinite(id) || title.length === 0) return null;
  return {
    id,
    title,
    description: raw?.description ?? "",
    pictureUrl: raw?.pictureUrl ?? "",
  };
}

export async function listPosts(): Promise<Post[]> {
  const res = await fetchData(api.get("/posts"));
  const raw = (res as { posts: Post[] })?.posts;
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map(normalizePost).filter(Boolean) as Post[];
  return normalized;
}

export async function getPost(id: number | string): Promise<Post | null> {
  const res = await fetchData(api.get(`/posts/${id}`));
  const raw = (res as { post: Post })?.post;
  if (!raw) return null;
  return normalizePost(raw);
}

export async function createPost(payload: Record<string, unknown>) {
  return fetchData(api.post("/posts", payload));
}

export async function updatePost(
  id: number | string,
  payload: Record<string, unknown>
) {
  return fetchData(api.put(`/posts/${id}`, payload));
}

export default { listPosts, getPost, createPost, updatePost };
