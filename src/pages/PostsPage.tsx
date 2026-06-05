import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

function PostSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="flex overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card md:flex-row">
        <div className="h-56 w-full skeleton-shimmer md:h-auto md:w-2/5" />
        <div className="flex flex-1 flex-col justify-center gap-3 p-6 md:p-8">
          <div className="h-3 w-20 rounded skeleton-shimmer" />
          <div className="h-8 w-4/5 rounded skeleton-shimmer" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded skeleton-shimmer" />
            <div className="h-4 w-4/5 rounded skeleton-shimmer" />
            <div className="h-4 w-3/5 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card">
      <div className="aspect-[16/9] skeleton-shimmer" />
      <div className="flex flex-col gap-2 p-4 md:p-5">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

function EmptyPosts({
  isFiltered,
  onClear,
}: {
  isFiltered: boolean;
  onClear: () => void;
}) {
  return (
    <div className="my-12 flex flex-col items-center gap-3 text-center">
      <span className="ui-chapter text-neutral-600" aria-hidden="true">
        {isFiltered ? "Inga resultat" : "Inga inlägg"}
      </span>
      <p className="text-neutral-600">
        {isFiltered
          ? "Inga inlägg matchade dina filterval."
          : "Inga inlägg har publicerats ännu."}
      </p>
      {isFiltered && (
        <button
          type="button"
          onClick={onClear}
          className="ui-btn ui-btn-secondary mt-1"
        >
          Rensa filter
        </button>
      )}
    </div>
  );
}

export const NewsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    data: postsPage,
    loading,
    run,
  } = useFetch<PaginatedPostsResponse>();
  const { setError } = useError();
  const [lodges, setLodges] = useState<Lodge[]>([]);
  const [selectedLodge, setSelectedLodge] = useState<string>(
    () => searchParams.get("loge") ?? "",
  );
  const [titleQuery, setTitleQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [debouncedTitleQuery, setDebouncedTitleQuery] = useState(titleQuery);
  const [page, setPage] = useState(
    () => Math.max(1, Number(searchParams.get("sida") ?? 1)),
  );
  const { user } = useAuth();
  const isFirstRender = useRef(true);

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
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const t = setTimeout(() => {
      setDebouncedTitleQuery(titleQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [titleQuery]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedLodge) params.loge = selectedLodge;
    if (debouncedTitleQuery.trim()) params.q = debouncedTitleQuery.trim();
    if (page > 1) params.sida = String(page);
    setSearchParams(params, { replace: true });
  }, [selectedLodge, debouncedTitleQuery, page, setSearchParams]);

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
  }, [run, selectedLodge, debouncedTitleQuery, page]);

  const posts = postsPage?.posts ?? [];
  const total = postsPage?.total ?? 0;
  const totalPages = postsPage?.totalPages ?? 0;
  const currentPageSize = postsPage?.pageSize ?? POSTS_PAGE_SIZE;
  const from = total === 0 ? 0 : (page - 1) * currentPageSize + 1;
  const to = total === 0 ? 0 : Math.min(page * currentPageSize, total);

  const isFiltered =
    selectedLodge.length > 0 || debouncedTitleQuery.trim().length > 0;

  function handleLodgeChange(value: string) {
    setSelectedLodge(value);
    setPage(1);
  }

  function clearFilters() {
    setTitleQuery("");
    setDebouncedTitleQuery("");
    setSelectedLodge("");
    setPage(1);
  }

  const [featured, ...rest] = posts;
  const isFirstLoad = loading && posts.length === 0;
  const isPaginating = loading && posts.length > 0;

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Nyheter</h2>

        {user &&
          (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)) && (
            <Link to="/posts/create" className="ui-btn ui-btn-primary">
              Skapa inlägg
            </Link>
          )}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
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

      {!loading && total > 0 && (
        <p className="mb-4 text-sm text-neutral-600">
          {`Visar ${from === to ? from : `${from}–${to}`} av ${total} inlägg`}
        </p>
      )}

      {isFirstLoad ? (
        <div className="flex flex-col gap-6">
          <PostSkeleton featured />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <EmptyPosts isFiltered={isFiltered} onClear={clearFilters} />
      ) : (
        <div
          aria-busy={isPaginating}
          className={`flex flex-col gap-6 animate-step-in transition-opacity duration-200 ${isPaginating ? "pointer-events-none opacity-50" : ""}`}
        >
          {featured && (
            <Link
              to={`/posts/${featured.id}`}
              className="flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover md:flex-row"
            >
              <img
                src={featured.pictureUrl || mediaPlaceholderUrl("post")}
                alt=""
                className="h-56 w-full object-cover md:h-auto md:w-2/5"
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6 md:p-8">
                {(featured.lodges ?? []).length > 0 && (
                  <span className="ui-chapter truncate text-primary-600">
                    {featured.lodges!.map((l) => l.name).join(", ")}
                  </span>
                )}
                <h3 className="break-words text-2xl font-semibold leading-snug tracking-tight text-neutral-900 md:text-3xl">
                  {featured.title}
                </h3>
                {featured.description && (
                  <p className="line-clamp-3 text-neutral-700">
                    {featured.description}
                  </p>
                )}
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {rest.map((p) => (
                <Link
                  to={`/posts/${p.id}`}
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-card border border-neutral-200 bg-white shadow-card transition-shadow duration-200 hover:shadow-card-hover"
                >
                  <img
                    src={p.pictureUrl || mediaPlaceholderUrl("post")}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 md:p-5">
                    {(p.lodges ?? []).length > 0 && (
                      <span className="ui-chapter truncate text-primary-600">
                        {p.lodges!.map((l) => l.name).join(", ")}
                      </span>
                    )}
                    <h3 className="break-words text-lg font-semibold leading-snug tracking-tight text-neutral-900">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="line-clamp-2 text-sm text-neutral-700">
                        {p.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
      )}
    </PageContainer>
  );
};
