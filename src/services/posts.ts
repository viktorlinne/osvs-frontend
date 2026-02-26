import api, { fetchData } from "./api";
import type { Post } from "../types";

type ListPostsParams = {
  lodgeIds?: Array<number | string>;
  title?: string;
};

function normalizePost(raw: Post): Post | null {
  const id = Number(raw?.id);
  const title = String(raw?.title ?? "").trim();
  if (!Number.isFinite(id) || title.length === 0) return null;
  const lodges = Array.isArray(raw?.lodges)
    ? (raw?.lodges ?? [])
        .map((lodge) => ({
          id: Number(lodge?.id),
          name: String(lodge?.name ?? "").trim(),
        }))
        .filter((lodge) => Number.isFinite(lodge.id) && lodge.name.length > 0)
    : [];
  return {
    id,
    title,
    description: raw?.description ?? "",
    pictureUrl: raw?.pictureUrl ?? "",
    lodges,
  };
}

export async function listPosts(params?: ListPostsParams): Promise<Post[]> {
  const search = new URLSearchParams();
  if (Array.isArray(params?.lodgeIds)) {
    for (const value of params.lodgeIds) {
      if (value === null || value === undefined || value === "") continue;
      search.append("lodgeId", String(value));
    }
  }
  if (typeof params?.title === "string" && params.title.trim().length > 0) {
    search.set("title", params.title.trim());
  }
  const query = search.toString();
  const url = query ? `/posts?${query}` : "/posts";
  const res = await fetchData(api.get(url));
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
