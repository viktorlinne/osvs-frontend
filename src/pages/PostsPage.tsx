import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useError } from "../context";
import { listPosts, listLodges } from "../services";
import type { Post, Lodge } from "../types";
import useFetch from "../hooks/useFetch";

//! TODO add search and filtering
export const NewsPage = () => {
  const { data: posts, loading, notFound, run } = useFetch<Post[]>();
  const { setError } = useError();
  const [empty, setEmpty] = useState(false);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLodge, setSelectedLodge] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    listLodges()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setLodges(data);
        }
      })
      .catch(() => {
        setError("Misslyckades att hämta loger");
      });
    return () => {
      mounted = false;
    };
  }, [setError]);

  useEffect(() => {
    let mounted = true;
    const lodgeFilter = selectedLodge ? [selectedLodge] : undefined;
    run(() => listPosts(lodgeFilter ? { lodgeIds: lodgeFilter } : undefined))
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
  }, [run, setError, selectedLodge]);

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">Nyheter</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link
              to="/posts/create"
              className="flex text-white bg-green-600 hover:bg-green-700 text-sm font-medium transition px-3 py-2 rounded-md "
            >
              Skapa Inlägg
            </Link>
          )}
      </div>
      <div className="w-full max-w-3xl flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <label className="flex flex-col text-sm font-medium text-gray-700" htmlFor="lodgeFilter">
          Filtrera på loge
          <select
            id="lodgeFilter"
            value={selectedLodge}
            onChange={(e) => setSelectedLodge(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="">Alla loger</option>
            {lodges.map((lodge) => (
              <option key={lodge.id} value={String(lodge.id)}>
                {lodge.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="w-full max-w-3xl grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto">
        {(posts ?? []).map((p) => (
          <Link
            to={`/posts/${p.id}`}
            key={p.id}
            className="rounded-md shadow-md hover:shadow-lg transition bg-white flex flex-col p-4 md:p-6"
          >
            <img
              src={p.pictureUrl ?? ""}
              alt={p.title}
              className="w-full h-48 md:h-56 lg:h-48 object-cover rounded-t-md"
            />
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
        }
      </div>

      {!loading && (posts ?? []).length === 0 && !notFound && empty && (
        <p className="mt-6 text-gray-600">Inga inlägg än.</p>
      )}
    </div>
  );
};
