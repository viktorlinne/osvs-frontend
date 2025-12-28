import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context";
import { listPosts } from "../services";
import { Spinner, NotFound } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";

export const NewsPage = () => {
  const { data: posts, loading, notFound, run } = useFetch<Post[]>();
  const { error, setError } = useError();
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    run(() => listPosts())
      .then((res) => {
        if (!mounted) return;
        if (!Array.isArray(res))
          setError("Något gick fel vid hämtning av inlägg.");
        else if (res.length === 0) setError("Inga inlägg än.");
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
      <div className="w-full max-w-3xl flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">Nyheter</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link
              to="/posts/create"
              className="text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded"
            >
              Create Post
            </Link>
          )}
      </div>
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
        <p className="mt-6 text-gray-600">Inga inlägg än.</p>
      )}
    </div>
  );
};
