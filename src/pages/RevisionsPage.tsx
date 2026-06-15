import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  PageContainer,
  AsyncState,
  inputClass,
  labelClass,
  selectClass,
} from "../components";
import { SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
import { useAuth } from "../context";
import useFetch from "../hooks/useFetch";
import { listLodges, listRevisions } from "../services";
import type { Lodge, Revision } from "../types";

export const RevisionsPage = () => {
  const { user } = useAuth();
  const canCreate = Boolean(
    user && (user.roles ?? []).some((r) => ["Admin", "Editor"].includes(r)),
  );

  const { data: revisions, run, loading } = useFetch<Revision[]>();
  const { run: runLodges, data: lodges } = useFetch<Lodge[]>();

  const [yearFilter, setYearFilter] = useState("");
  const [selectedLodge, setSelectedLodge] = useState("");
  const [fetchError, setFetchError] = useState(false);
  const [filtersError, setFiltersError] = useState(false);

  const hasFilters =
    yearFilter.trim().length > 0 || selectedLodge.trim().length > 0;

  useEffect(() => {
    setFiltersError(false);
    runLodges(async () => {
      const data = await listLodges();
      return Array.isArray(data) ? data : [];
    }).catch(() => setFiltersError(true));
  }, [runLodges]);

  useEffect(() => {
    const parsedYear =
      yearFilter.trim().length > 0 ? Number(yearFilter.trim()) : undefined;
    const parsedLodgeId =
      selectedLodge.trim().length > 0
        ? Number(selectedLodge.trim())
        : undefined;

    if (
      parsedYear !== undefined &&
      (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 3000)
    ) {
      return;
    }
    if (
      parsedLodgeId !== undefined &&
      (!Number.isInteger(parsedLodgeId) || parsedLodgeId <= 0)
    ) {
      return;
    }

    setFetchError(false);
    run(() =>
      listRevisions({
        year: parsedYear,
        lodgeId: parsedLodgeId,
      }),
    ).catch(() => setFetchError(true));
  }, [run, yearFilter, selectedLodge]);

  function clearFilters() {
    setYearFilter("");
    setSelectedLodge("");
  }

  const list = revisions ?? [];
  const isEmpty = !loading && list.length === 0;

  return (
    <PageContainer size="xl" className="ui-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="ui-page-title">Revisioner</h1>
        {canCreate && (
          <Link to="/revisions/create" className="ui-btn ui-btn-primary">
            Ny revision
          </Link>
        )}
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label htmlFor="revision-year-filter" className={labelClass}>
            Filtrera på år
            <input
              id="revision-year-filter"
              type="number"
              inputMode="numeric"
              min={1900}
              max={3000}
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder="ex. 2026"
              className={inputClass}
            />
          </label>

          <label htmlFor="revision-lodge-filter" className={labelClass}>
            Filtrera på loge
            <select
              id="revision-lodge-filter"
              value={selectedLodge}
              onChange={(e) => setSelectedLodge(e.target.value)}
              className={selectClass}
            >
              <option value="">Alla loger</option>
              {(lodges ?? []).map((lodge) => (
                <option key={lodge.id} value={String(lodge.id)}>
                  {lodge.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasFilters && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-neutral-600">Aktivt filter</span>
            <button
              type="button"
              onClick={clearFilters}
              className="ui-btn ui-btn-secondary ui-btn-sm"
            >
              Rensa filter
            </button>
          </div>
        )}
      </div>

      {filtersError ? (
        <AsyncState
          loading={false}
          error
          errorMessage="Logfilter kunde inte laddas."
          onRetry={() => {
            setFiltersError(false);
            runLodges(async () => {
              const data = await listLodges();
              return Array.isArray(data) ? data : [];
            }).catch(() => setFiltersError(true));
          }}
        />
      ) : null}

      {!loading && fetchError ? (
        <div className="mb-4">
          <AsyncState
            loading={false}
            error
            errorMessage="Revisioner kunde inte laddas."
            onRetry={() => {
              setFetchError(false);
              const parsedYear =
                yearFilter.trim().length > 0 ? Number(yearFilter.trim()) : undefined;
              const parsedLodgeId =
                selectedLodge.trim().length > 0
                  ? Number(selectedLodge.trim())
                  : undefined;
              run(() =>
                listRevisions({
                  year: parsedYear,
                  lodgeId: parsedLodgeId,
                }),
              ).catch(() => setFetchError(true));
            }}
          />
        </div>
      ) : null}

      <div role="status" aria-live="polite">
        {loading && (
          <div>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="ui-entry flex items-baseline justify-between gap-4">
                <SkeletonText width="w-56" />
                <div className="flex shrink-0 items-baseline gap-3">
                  <SkeletonLabel width="w-20" />
                  <SkeletonLabel width="w-10" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && list.length > 0 && !fetchError && (
        <ul className="animate-step-in">
          {list.map((revision) => {
            const hasDoc = Boolean(revision.pictureUrl);
            const meta = (
              <div className="flex shrink-0 items-baseline gap-3">
                <span className="ui-chapter">
                  {revision.lodgeName ?? "Okänd loge"}
                </span>
                <span className="text-xs tabular-nums text-neutral-600">
                  {revision.year}
                </span>
              </div>
            );

            if (hasDoc) {
              return (
                <li key={revision.id} className="ui-entry">
                  <a
                    href={revision.pictureUrl!}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-baseline justify-between gap-4 rounded transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50"
                  >
                    <span className="text-sm">{revision.title}</span>
                    {meta}
                  </a>
                </li>
              );
            }

            return (
              <li
                key={revision.id}
                className="ui-entry flex items-baseline justify-between gap-4"
              >
                <span className="text-sm text-neutral-600">
                  {revision.title}
                </span>
                <div className="flex shrink-0 items-baseline gap-3">
                  {meta}
                  <span className="text-xs italic text-neutral-600">
                    Inget dokument
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isEmpty && !fetchError && hasFilters && (
        <div className="mt-8 flex flex-col items-start gap-3">
          <p className="text-sm text-neutral-600">
            Inga revisioner matchade filtret.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="ui-btn ui-btn-secondary ui-btn-sm"
          >
            Rensa filter
          </button>
        </div>
      )}

      {isEmpty && !fetchError && !hasFilters && (
        <div className="mt-8">
          <p className="text-sm text-neutral-600">
            {canCreate
              ? "Inga revisioner har lagts till ännu."
              : "Inga revisioner hittades."}
          </p>
          {canCreate && (
            <Link
              to="/revisions/create"
              className="ui-btn ui-btn-primary mt-3"
            >
              Lägg till den första
            </Link>
          )}
        </div>
      )}
    </PageContainer>
  );
};
