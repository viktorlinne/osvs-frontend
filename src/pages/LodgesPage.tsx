import { useEffect } from "react";
import { Spinner } from "../components";
import useFetch from "../hooks/useFetch";
import type { Lodge } from "../types";
import { listLodges } from "../services";
import { Link } from "react-router-dom";

export const LodgesPage = () => {
  async function fetchLodges(): Promise<Lodge[]> {
    const data = await listLodges();
    return Array.isArray(data) ? (data as Lodge[]) : [];
  }

  const { run, loading, data: lodges } = useFetch<Lodge[]>();

  useEffect(() => {
    run(fetchLodges).catch(() => {
      /* swallow; useFetch handles errors */
    });
  }, [run]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><Spinner /></div>;

  return (
    <div className="flex flex-col items-center min-h-screen">
      <div className="max-w-3xl w-full mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Loger</h2>
        {Array.isArray(lodges) && (
          <div className="w-full grid gap-4 grid-cols-1">
            {lodges.map((lodge: Lodge) => (
              <Link
                to={`/lodges/${lodge.id}`}
                key={lodge.id}
                className="block p-3 bg-white rounded-md shadow-md hover:shadow-lg transition"
              >
                <img src={lodge?.picture} alt={lodge.name} className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="font-semibold truncate">{lodge.name}</div>
                {lodge.email && (
                  <div className="text-sm text-gray-500 truncate">{lodge.email}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
