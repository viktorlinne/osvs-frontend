import { useEffect, useState } from "react";
import {
  listPublicumPosts,
  type PublicumPostListItem,
} from "../services/posts";

function formatYear(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return String(parsed.getFullYear());
  }
  const match = String(value).match(/\d{4}/);
  return match ? match[0] : String(value);
}

type PublicumListProps = {
  onSelect?: (post: PublicumPostListItem) => void;
  selectedId?: string | number | null;
};

export function PublicumList({ onSelect, selectedId }: PublicumListProps) {
  const [posts, setPosts] = useState<PublicumPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setFailed(false);
      try {
        const rows = await listPublicumPosts();
        if (!mounted) return;
        setPosts(Array.isArray(rows) ? rows : []);
      } catch {
        if (!mounted) return;
        setFailed(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return <p className="text-sm text-neutral-600">Laddar publicum...</p>;
  if (failed)
    return (
      <p className="text-sm text-danger-600">Kunde inte hämta publicum</p>
    );
  if (!posts.length)
    return (
      <p className="text-sm text-neutral-600">Inga publicum-inlägg</p>
    );

  return (
    <div className="relative">
      <ul className="max-h-[40rem] overflow-y-auto pb-6">
        {posts.map((post) => {
          const isSelected = selectedId != null && post.id === selectedId;
          return (
            <li key={post.id} className="ui-entry">
              <button
                type="button"
                className={`flex w-full items-baseline gap-4 rounded px-1 py-0.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 ${
                  isSelected
                    ? "bg-primary-50 text-primary-700"
                    : "hover:bg-neutral-100"
                }`}
                onClick={() => onSelect?.(post)}
              >
                <span className="w-12 shrink-0 tabular-nums text-xs text-neutral-600">
                  {formatYear(post.createdAt)}
                </span>
                <span className={`text-sm ${isSelected ? "text-primary-700" : "text-neutral-900"}`}>
                  {post.title}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-neutral-50 to-transparent" />
    </div>
  );
}

export default PublicumList;
