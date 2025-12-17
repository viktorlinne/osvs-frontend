import { useEffect } from "react";
import { Link } from "react-router-dom";
import { listPosts } from "../services";
import { Spinner, NotFound } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";


export const NewsPage = () => {
  const { data: posts, loading, notFound, run } = useFetch<Post[]>();
  const { error, setError } = useError();

  useEffect(() => {
    let mounted = true;
    run(() => listPosts())
      .then((res) => {
        if (!mounted) return;
        if (!Array.isArray(res)) setError("Invalid posts response");
        else if (res.length === 0) setError("No posts found");
      })
      .catch(() => {
        /* errors handled by useFetch */
      });
    return () => {
      mounted = false;
    };
  }, [run, setError]);

  return (
    <div className="flex flex-col items-center min-h-screen">
      <h2 className="text-3xl font-bold mb-4">News</h2>
      <div className="grid gap-4 grid-cols-1">

        {loading && <Spinner />}
        {notFound ? (
          <NotFound />
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          (posts ?? []).map((p) => (
            <Link
              to={`/news/${p.id}`}
              key={p.id}
              className="block rounded shadow-md bg-white overflow-hidden"
            >
              {p.pictureUrl && (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${p.pictureUrl}`}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-4">{p.title}</h3>
                <p className="">{p.description}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && (posts ?? []).length === 0 && !error && (
        <p className="mt-6 text-gray-600">No posts yet.</p>
      )}
    </div>
  );
};
