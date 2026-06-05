import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import { SkeletonLabel, SkeletonText } from "../components/PageSkeleton";
import useFetch from "../hooks/useFetch";
import { listLodges } from "../services";
import type { Lodge } from "../types";

export const LodgesPage = () => {
  async function fetchLodges(): Promise<Lodge[]> {
    const data = await listLodges();
    return Array.isArray(data) ? (data as Lodge[]) : [];
  }

  const { run, data: lodges, loading } = useFetch<Lodge[]>();

  useEffect(() => {
    run(fetchLodges).catch(() => {
      /* useFetch surfaces errors via global error context */
    });
  }, [run]);

  return (
    <PageContainer size="xl" className="ui-page">
      <h1 className="ui-page-title mb-8">Loger</h1>

      {loading ? (
        <div className="divide-y divide-neutral-200 border-t border-neutral-200">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 py-3.5">
              <SkeletonText width="w-40" />
              <SkeletonLabel width="w-20" />
            </div>
          ))}
        </div>
      ) : !lodges || lodges.length === 0 ? (
        <p className="text-sm text-neutral-600">Inga loger registrerade.</p>
      ) : (
        <div className="animate-step-in divide-y divide-neutral-200 border-t border-neutral-200">
          {lodges.map((lodge: Lodge) => (
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
      )}
    </PageContainer>
  );
};
