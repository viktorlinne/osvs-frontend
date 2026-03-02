import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageContainer } from "../components";
import useFetch from "../hooks/useFetch";
import { listLodges } from "../services";
import type { Lodge } from "../types";

export const LodgesPage = () => {
  async function fetchLodges(): Promise<Lodge[]> {
    const data = await listLodges();
    return Array.isArray(data) ? (data as Lodge[]) : [];
  }

  const { run, data: lodges } = useFetch<Lodge[]>();

  useEffect(() => {
    run(fetchLodges).catch(() => {
      /* swallow; useFetch handles errors */
    });
  }, [run]);

  return (
    <PageContainer size="xl" className="ui-page">
      <h2 className="ui-page-title mb-4">Loger</h2>
      {Array.isArray(lodges) && (
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lodges.map((lodge: Lodge) => (
            <Link
              to={`/lodges/${lodge.id}`}
              key={lodge.id}
              className="ui-card ui-card-hover block"
            >
              <img
                src={lodge?.picture ?? undefined}
                alt={lodge.name}
                className="mb-2 h-16 w-16 rounded-full object-cover"
              />
              <div className="truncate font-semibold text-neutral-900">{lodge.name}</div>
              {lodge.email && (
                <div className="truncate text-sm text-neutral-600">{lodge.email}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
