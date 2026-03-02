import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { listLodges, listRevisions } from "../services";
import { useAuth } from "../context";
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

  useEffect(() => {
    runLodges(async () => {
      const data = await listLodges();
      return Array.isArray(data) ? data : [];
    }).catch(() => {
      // handled by useFetch
    });
  }, [runLodges]);

  useEffect(() => {
    const parsedYear =
      yearFilter.trim().length > 0 ? Number(yearFilter.trim()) : undefined;
    const parsedLodgeId =
      selectedLodge.trim().length > 0 ? Number(selectedLodge.trim()) : undefined;

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

    run(() =>
      listRevisions({
        year: parsedYear,
        lodgeId: parsedLodgeId,
      }),
    ).catch(() => {
      // handled by useFetch
    });
  }, [run, yearFilter, selectedLodge]);

  return (
    <div className="flex flex-col items-center min-h-screen p-6">
      <div className="w-full max-w-3xl flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-2xl font-bold">Revisioner</h2>
        {canCreate && (
          <Link
            to="/revisions/create"
            className="flex text-white bg-green-600 hover:bg-green-700 text-sm font-medium transition px-3 py-2 rounded-md"
          >
            Lagg till revision
          </Link>
        )}
      </div>

      <div className="w-full max-w-3xl flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
        <label
          htmlFor="revision-year-filter"
          className="flex flex-col text-sm font-medium text-gray-700"
        >
          Filtrera pa ar
          <input
            id="revision-year-filter"
            type="number"
            inputMode="numeric"
            min={1900}
            max={3000}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="t.ex. 2026"
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
          />
        </label>

        <label
          htmlFor="revision-lodge-filter"
          className="flex flex-col text-sm font-medium text-gray-700"
        >
          Filtrera pa loge
          <select
            id="revision-lodge-filter"
            value={selectedLodge}
            onChange={(e) => setSelectedLodge(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-200"
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

      <div className="w-full max-w-3xl grid gap-4">
        {(revisions ?? []).map((revision) => (
          <a
            key={revision.id}
            href={revision.pictureUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="block p-4 bg-white rounded-md shadow-md hover:shadow-lg transition"
          >
            <div className="text-lg font-semibold">{revision.title}</div>
            <div className="text-sm text-gray-600">
              {revision.lodgeName} - {revision.year}
            </div>
          </a>
        ))}
      </div>

      {!loading && (revisions ?? []).length === 0 && (
        <p className="mt-6 text-gray-600">Inga revisioner hittades.</p>
      )}
    </div>
  );
};
