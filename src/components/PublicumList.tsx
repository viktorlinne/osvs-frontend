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
};

export function PublicumList({ onSelect }: PublicumListProps) {
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

  if (loading) return <p className="text-sm text-neutral-600">Laddar publicum...</p>;
  if (failed) return <p className="text-sm text-danger-600">Kunde inte hamta publicum</p>;
  if (!posts.length) return <p className="text-sm text-neutral-600">Inga publicum-inlagg</p>;

  return (
    <ul className="max-h-[40rem] space-y-2 overflow-y-auto">
      {posts.map((post) => (
        <li key={post.id} className="border-b border-neutral-200 pb-2">
          <button
            type="button"
            className="w-full rounded-md text-left transition hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
            onClick={() => onSelect?.(post)}
          >
            <p className="text-sm italic text-neutral-600">{formatYear(post.createdAt)}</p>
            <p className="text-neutral-900">{post.title}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default PublicumList;
