import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AsyncState, PageContainer } from "../components";
import { SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
import useFetch from "../hooks/useFetch";
import { listLodges } from "../services";
import type { Lodge } from "../types";

export const LodgesPage = () => {
  async function fetchLodges(): Promise<Lodge[]> {
    const data = await listLodges();
    return Array.isArray(data) ? data : [];
  }

  const { run, data: lodges, loading } = useFetch<Lodge[]>();
  const [fetchError, setFetchError] = useState(false);

  const load = useCallback(() => {
    setFetchError(false);
    run(fetchLodges).catch(() => setFetchError(true));
  }, [run]);

  useEffect(() => {
    load();
  }, [load]);

  const lodgeList = lodges ?? [];

  return (
    <PageContainer size="xl" className="ui-page">
      <h1 className="ui-page-title mb-8">Loger</h1>

      <AsyncState
        loading={loading}
        error={fetchError}
        errorMessage="Loger kunde inte laddas."
        onRetry={load}
        empty={!fetchError && lodgeList.length === 0}
        emptyMessage={
          <p className="text-sm text-neutral-600">Inga loger registrerade.</p>
        }
        loadingFallback={
          <div className="divide-y divide-neutral-200 border-t border-neutral-200">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-baseline justify-between gap-4 py-3.5">
                <SkeletonText width="w-40" />
                <SkeletonLabel width="w-20" />
              </div>
            ))}
          </div>
        }
      >
        <div className="animate-step-in divide-y divide-neutral-200 border-t border-neutral-200">
          {lodgeList.map((lodge: Lodge) => (
            <Link
              to={`/lodges/${lodge.id}`}
              key={lodge.id}
              className="group flex items-baseline justify-between gap-4 py-3.5"
            >
              <span className="font-semibold text-neutral-900 transition-colors duration-150 group-hover:text-primary-600">
                {lodge.name}
              </span>
              <span className="ui-chapter shrink-0">{lodge.city}</span>
            </Link>
          ))}
        </div>
      </AsyncState>
    </PageContainer>
  );
};
