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

  if (loading) return <p className="text-sm text-gray-500">Laddar publicum...</p>;
  if (failed) return <p className="text-sm text-red-600">Kunde inte hamta publicum</p>;
  if (!posts.length) return <p className="text-sm text-gray-500">Inga publicum-inlagg</p>;

  return (
    <ul className="space-y-2">
      {posts.map((post) => (
        <li key={post.id} className="border-b pb-2">
          <button
            type="button"
            className="w-full text-left hover:opacity-80"
            onClick={() => onSelect?.(post)}
          >
            <p className="italic text-sm text-gray-600">{formatYear(post.createdAt)}</p>
            <p>{post.title}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default PublicumList;
