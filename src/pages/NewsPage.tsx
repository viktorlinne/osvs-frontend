import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context";
import { listPosts } from "../services";
import { Spinner, NotFound } from "../components";
import type { Post } from "../types";
import { useError } from "../context";
import useFetch from "../hooks/useFetch";

//! TODO agg pagination, search and filtering
export const NewsPage = () => {
  const { data: posts, loading, notFound, run } = useFetch<Post[]>();
  const { setError, clearError } = useError();
  const [empty, setEmpty] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    clearError();
    run(() => listPosts())
      .then((res) => {
        if (!mounted) return;
        if (!Array.isArray(res)) {
          setError("Något gick fel vid hämtning av inlägg.");
        } else if (res.length === 0) {
          setEmpty(true);
        } else {
          setEmpty(false);
        }
      })
      .catch(() => {
        /* errors handled by useFetch */
      });
    return () => {
      mounted = false;
    };
  }, [run, setError, clearError]);

  return (
    <div className="flex flex-col items-center min-h-screen py-6 px-4">
      <div className="w-full max-w-3xl flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">Nyheter</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link
              to="/posts/create"
              className="text-sm text-white bg-green-600 hover:bg-green-700 transition px-3 py-2 rounded-md"
            >
              Skapa Inlägg
            </Link>
          )}
      </div>
      <div className="w-full max-w-3xl grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto">
        {loading && <Spinner />}
        {notFound ? (
          <NotFound />
        ) : (
          (posts ?? []).map((p) => (
            <Link
              to={`/news/${p.id}`}
              key={p.id}
              className="rounded-md shadow-md bg-white flex flex-col p-4 md:p-6"
            >
              {p.pictureUrl && (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${p.pictureUrl}`}
                  alt={p.title}
                  className="w-full h-48 md:h-56 lg:h-48 object-cover rounded-t-md"
                />
              )}
              <div className="p-4 flex-1">
                <h3 className="text-xl font-semibold mb-2 truncate">
                  {p.title}
                </h3>
                <p
                  className="text-gray-700 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {p.description}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && (posts ?? []).length === 0 && !notFound && empty && (
        <p className="mt-6 text-gray-600">Inga inlägg än.</p>
      )}
    </div>
  );
};
