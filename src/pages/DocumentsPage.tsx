import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageContainer, inputClass, labelClass } from "../components";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listDocuments } from "../services";
import type { SiteDocument } from "../types";

export const DocumentsPage = () => {
  const { user } = useAuth();
  const canCreate = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );
  const { run, data: documents, loading } = useFetch<SiteDocument[]>();
  const [titleQuery, setTitleQuery] = useState("");
  const [fetchError, setFetchError] = useState(false);

  const load = useCallback(() => {
    setFetchError(false);
    run(() => listDocuments()).catch(() => {
      setFetchError(true);
    });
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = (documents ?? []).filter((d) =>
    d.title.toLowerCase().includes(titleQuery.toLowerCase()),
  );

  const isFiltered = titleQuery.trim().length > 0;

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="ui-page-title">Dokument</h2>
        {canCreate && (
          <Link to="/documents/create" className="ui-btn ui-btn-primary">
            Nytt dokument
          </Link>
        )}
      </div>

      <div className="mb-8">
        <label className={labelClass} htmlFor="titleSearch">
          Sök på titel
          <input
            id="titleSearch"
            name="titleSearch"
            type="search"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            placeholder="Sök dokumenttitel"
            className={inputClass}
          />
        </label>
      </div>

      {!loading && fetchError && (
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-md border border-danger-600/20 bg-danger-50 px-4 py-3 text-sm text-danger-700"
          role="alert"
        >
          <span>Dokument kunde inte laddas.</span>
          <button
            type="button"
            onClick={load}
            className="shrink-0 font-medium underline underline-offset-2 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600 focus-visible:ring-offset-2"
          >
            Försök igen
          </button>
        </div>
      )}

      {loading ? (
        <div
          className="overflow-hidden rounded-card border border-neutral-200"
          aria-busy="true"
          aria-label="Laddar dokument"
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-b border-neutral-200 px-5 py-3.5 last:border-b-0"
              aria-hidden="true"
            >
              <div className="h-5 w-2/3 rounded skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : !fetchError && filtered.length > 0 ? (
        <div className="animate-step-in overflow-hidden rounded-card border border-neutral-200">
          {filtered.map((document) =>
            document.pictureUrl ? (
              <a
                key={document.id}
                href={document.pictureUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`${document.title} (öppnas i ny flik)`}
                className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5 last:border-b-0 bg-white transition-colors duration-150 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-600"
              >
                <span className="min-w-0 truncate font-semibold leading-snug tracking-tight text-neutral-900">
                  {document.title}
                </span>
              </a>
            ) : (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3.5 last:border-b-0 opacity-60"
              >
                <span className="min-w-0 truncate font-semibold leading-snug tracking-tight text-neutral-900">
                  {document.title}
                </span>
                <span className="ui-chapter shrink-0">Fil saknas</span>
              </div>
            ),
          )}
        </div>
      ) : !fetchError ? (
        <div className="my-12 flex flex-col items-center gap-3 text-center">
          <span className="ui-chapter" aria-hidden="true">
            {isFiltered ? "Inga resultat" : "Inga dokument"}
          </span>
          <p className="text-neutral-600">
            {isFiltered
              ? "Inga dokument matchade sökningen."
              : "Inga dokument i arkivet ännu."}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => setTitleQuery("")}
              className="ui-btn ui-btn-secondary mt-1"
            >
              Rensa sökning
            </button>
          )}
        </div>
      ) : null}
    </PageContainer>
  );
};
