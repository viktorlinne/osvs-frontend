import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageContainer,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { listLodges, listPosts } from "../services";
import type { Lodge, Post } from "../types";

export const NewsPage = () => {
  const { data: posts, loading, notFound, run } = useFetch<Post[]>();
  const { setError } = useError();
  const [empty, setEmpty] = useState(false);
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLodge, setSelectedLodge] = useState<string>("");
  const [titleQuery, setTitleQuery] = useState("");
  const [debouncedTitleQuery, setDebouncedTitleQuery] = useState("");
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
        setError("Misslyckades att hÃ¤mta loger");
      });
    return () => {
      mounted = false;
    };
  }, [setError]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTitleQuery(titleQuery), 350);
    return () => clearTimeout(t);
  }, [titleQuery]);

  useEffect(() => {
    let mounted = true;
    const lodgeFilter = selectedLodge ? [selectedLodge] : undefined;
    const hasTitleFilter = debouncedTitleQuery.trim().length > 0;
    run(() =>
      listPosts(
        lodgeFilter || hasTitleFilter
          ? {
              lodgeIds: lodgeFilter,
              title: hasTitleFilter ? debouncedTitleQuery : undefined,
            }
          : undefined,
      ),
    )
      .then((res) => {
        if (!mounted) return;
        if (!Array.isArray(res)) {
          setError("NÃ¥got gick fel vid hÃ¤mtning av inlÃ¤gg.");
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
  }, [run, setError, selectedLodge, debouncedTitleQuery]);

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Nyheter</h2>
        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link to="/posts/create" className="ui-btn ui-btn-primary">
              Skapa InlÃ¤gg
            </Link>
          )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={labelClass} htmlFor="titleSearch">
          SÃ¶k pÃ¥ titel
          <input
            id="titleSearch"
            name="titleSearch"
            type="search"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="SÃ¶k inlÃ¤ggstitel"
            className={inputClass}
          />
        </label>

        <label className={labelClass} htmlFor="lodgeFilter">
          Filtrera pÃ¥ loge
          <select
            id="lodgeFilter"
            value={selectedLodge}
            onChange={(e) => setSelectedLodge(e.target.value)}
            className={selectClass}
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

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        {(posts ?? []).map((p) => (
          <Link
            to={`/posts/${p.id}`}
            key={p.id}
            className="ui-card ui-card-hover flex flex-col p-0"
          >
            <img
              src={p.pictureUrl ?? ""}
              alt={p.title}
              className="h-48 w-full rounded-t-card object-cover md:h-56"
            />
            <div className="flex-1 p-4 md:p-5">
              <h3 className="mb-2 truncate text-xl font-semibold text-neutral-900">
                {p.title}
              </h3>
              <p className="line-clamp-2 text-neutral-700">{p.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {!loading && (posts ?? []).length === 0 && !notFound && empty && (
        <p className="mt-6 text-neutral-600">Inga inlÃ¤gg Ã¤n.</p>
      )}
    </PageContainer>
  );
};
