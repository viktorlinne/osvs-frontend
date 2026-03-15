import api, { fetchData } from "./api";
import type { Post } from "../types";
import {
  readArrayField,
  readBooleanField,
  readNumberField,
  readObjectField,
} from "./parsers/response";

type ListPostsParams = {
  lodgeIds?: Array<number | string>;
  title?: string;
};

export type PublicumPostListItem = {
  id: number;
  title: string;
  createdAt: string;
  description: string;
  pictureUrl: string;
};

export type PostMutationResult = {
  success: boolean;
};

export type CreatePostResult = PostMutationResult & {
  id: number | null;
};

function parseMutationResult(source: unknown): PostMutationResult {
  return {
    success: readBooleanField(source, "success") ?? false,
  };
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "on"].includes(normalized)) return true;
    if (["0", "false", "off", ""].includes(normalized)) return false;
  }
  return undefined;
}

function normalizePost(raw: Post): Post | null {
  const id = Number(raw?.id);
  const title = String(raw?.title ?? "").trim();
  if (!Number.isFinite(id) || title.length === 0) return null;
  const publicum = normalizeOptionalBoolean(raw?.publicum);
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
    publicum,
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
  const raw = readArrayField<Post>(res, "posts");
  const normalized = raw.map(normalizePost).filter(Boolean) as Post[];
  return normalized;
}

export async function listPublicumPosts(): Promise<PublicumPostListItem[]> {
  const res = await fetchData(api.get("/posts/publicum"));
  const raw = readArrayField<PublicumPostListItem>(res, "posts");
  return raw
    .map((item) => ({
      id: Number(item?.id),
      title: String(item?.title ?? "").trim(),
      createdAt: String(item?.createdAt ?? ""),
      description: String(item?.description ?? ""),
      pictureUrl: String(item?.pictureUrl ?? ""),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.id) &&
        item.title.length > 0 &&
        item.pictureUrl.length > 0,
    );
}

export async function getPost(id: number | string): Promise<Post | null> {
  const res = await fetchData(api.get(`/posts/${id}`));
  const raw = (readObjectField(res, "post") as Post | null) ?? null;
  if (!raw) return null;
  return normalizePost(raw);
}

export async function createPost(payload: FormData): Promise<CreatePostResult> {
  const response = await fetchData(api.post("/posts", payload));
  return {
    ...parseMutationResult(response),
    id: readNumberField(response, "id"),
  };
}

export async function updatePost(
  id: number | string,
  payload: FormData,
): Promise<PostMutationResult> {
  return parseMutationResult(await fetchData(api.put(`/posts/${id}`, payload)));
}

export async function deletePost(
  id: number | string,
): Promise<PostMutationResult> {
  return parseMutationResult(await fetchData(api.delete(`/posts/${id}`)));
}

export default {
  listPosts,
  listPublicumPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};
