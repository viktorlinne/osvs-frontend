import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  PageContainer,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { useAuth, useError } from "../context";
import useFetch from "../hooks/useFetch";
import { listLodges, listPosts } from "../services";
import type { PaginatedPostsResponse } from "../services/posts";
import type { Lodge } from "../types";
import { mediaPlaceholderUrl } from "../utils/media";

const POSTS_PAGE_SIZE = 24;

export const NewsPage = () => {
  const {
    data: postsPage,
    loading,
    notFound,
    run,
  } = useFetch<PaginatedPostsResponse>();
  const { setError } = useError();
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLodge, setSelectedLodge] = useState<string>("");
  const [titleQuery, setTitleQuery] = useState("");
  const [debouncedTitleQuery, setDebouncedTitleQuery] = useState("");
  const [page, setPage] = useState(1);
  const { user } = useAuth();

  useEffect(() => {
    let mounted = true;
    listLodges()
      .then((data) => {
        if (!mounted) return;
        setLodges(data);
      })
      .catch(() => {
        setError("Misslyckades att hämta loger");
      });
    return () => {
      mounted = false;
    };
  }, [setError]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedTitleQuery(titleQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [titleQuery]);

  useEffect(() => {
    const lodgeFilter = selectedLodge ? [selectedLodge] : undefined;
    const hasTitleFilter = debouncedTitleQuery.trim().length > 0;
    run(() =>
      listPosts({
        lodgeIds: lodgeFilter,
        title: hasTitleFilter ? debouncedTitleQuery : undefined,
        page,
        pageSize: POSTS_PAGE_SIZE,
      }),
    ).catch(() => {
      /* errors handled by useFetch */
    });
  }, [run, setError, selectedLodge, debouncedTitleQuery, page]);

  const posts = postsPage?.posts ?? [];
  const total = postsPage?.total ?? 0;
  const totalPages = postsPage?.totalPages ?? 0;
  const currentPageSize = postsPage?.pageSize ?? POSTS_PAGE_SIZE;
  const from = total === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * currentPageSize, total);

  function handleLodgeChange(value: string) {
    setSelectedLodge(value);
    setPage(1);
  }

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Nyheter</h2>

        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link to="/posts/create" className="ui-btn ui-btn-primary">
              Skapa
            </Link>
          )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className={labelClass} htmlFor="titleSearch">
          Sök på titel
          <input
            id="titleSearch"
            name="titleSearch"
            type="search"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Sök inläggstitel"
            className={inputClass}
          />
        </label>

        <label className={labelClass} htmlFor="lodgeFilter">
          Filtrera på loge
          <select
            id="lodgeFilter"
            value={selectedLodge}
            onChange={(e) => handleLodgeChange(e.target.value)}
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

      {!loading ? (
        <div className="mb-4 flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {total > 0
              ? `Visar ${from}-${to} av ${total} inlägg`
              : "Inga inlägg hittades"}
          </span>
          {totalPages > 1 ? (
            <span>{`Sida ${page} av ${totalPages}`}</span>
          ) : null}
        </div>
      ) : null}

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        {posts.map((p) => (
          <Link
            to={`/posts/${p.id}`}
            key={p.id}
            className="ui-card ui-card-hover flex flex-col p-0"
          >
            <img
              src={p.pictureUrl || mediaPlaceholderUrl("post")}
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

      {!loading && posts.length === 0 && !notFound && (
        <p className="mt-6 text-neutral-600">Inga inlägg än.</p>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-neutral-600">{`Sida ${page} av ${totalPages}`}</div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Föregående
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || page >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Nästa
            </Button>
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
};
