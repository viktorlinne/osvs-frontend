import { useEffect, useState } from "react";
import { listPosts } from "../services/posts";

type PostItem = {
  id: number;
  title: string;
  pictureUrl?: string;
  description?: string;
};

export const NewsPage = () => {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listPosts()
      .then((res: any) => {
        const items = Array.isArray(res?.posts) ? res.posts : [];
        if (mounted) setPosts(items);
      })
      .catch((e: any) => {
        if (mounted) setError(e?.message ?? String(e));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen">
      <h2 className="text-3xl font-bold mb-4">News</h2>

      {loading && <p>Loading posts...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <article key={p.id} className="border rounded overflow-hidden shadow-sm bg-white">
            {p.pictureUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.pictureUrl} alt={p.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-gray-700">{p.description}</p>
            </div>
          </article>
        ))}
      </div>

      {!loading && posts.length === 0 && !error && (
        <p className="mt-6 text-gray-600">No posts yet.</p>
      )}
    </div>
  );
};
